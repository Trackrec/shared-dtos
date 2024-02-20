// publish-profile.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { AccountsVisitors } from 'src/visitors/accounts_visitor.entity';
import { AnalyticsAccess } from 'src/visitors/analytics_access.entity';
@Injectable()
export class PublishProfileService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(AccountsVisitors)
    private readonly visitorRepository: Repository<AccountsVisitors>,
    @InjectRepository(AnalyticsAccess)
    private readonly analyticsRepository: Repository<AnalyticsAccess>
  ) {}

  async publishProfile(userId: number): Promise<{ error: boolean, message: string }> {
    try {
      const user = await this.userRepository.findOne({where:{id:userId}});

      if (!user) {
        return { error: true, message: 'User not found' };
      }

      user.published_at = new Date();
      await this.userRepository.save(user);

      return { error: false, message: 'Profile published successfully' };
    } catch (error) {
      console.error('Error publishing profile:', error);
      return { error: true, message: 'Internal server error' };
    }
  }

  async getProfileViews(user_id) {
    try {
      const analyticsAccessRecords = await this.analyticsRepository.find({
        where: {
          user: {
            id: user_id
          }
        },
        relations: ['accountVisitor'], 
        order: {
          created_at: 'DESC' 
        }
      });
  
      return {error:false, views: analyticsAccessRecords};
    } catch (error) {
      console.error('Error fetching profile views:', error);
      return {error: true, message:"views not found."}
    }
  }
  

  async track_view(userId: number, visitor_id: number): Promise<void> {
    try {
      // Find the visitor by id
      const visitor = await this.userRepository.findOne({where:{id:visitor_id}});
  
      // If visitor exists, create a new visitor and save it
      if (visitor) {
        const newVisitor = this.visitorRepository.create({
          email: visitor.email,
          full_name: visitor.full_name,
          linkedin_access_token: visitor.linkedin_access_token,
        });
        const createdVisitor = await this.visitorRepository.save(newVisitor);
  
        // Create new analytics entry
        const newAnalytics = this.analyticsRepository.create({
          type: 'view',
          accountVisitor: { id: createdVisitor.id },
          user: { id: userId },
        });
  
        await this.analyticsRepository.save(newAnalytics);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }
  
  async findUserByIdAndName(userId: number, userName: string, visitor_id: number): Promise<UserAccounts | null> {
    const formattedName = userName.replace(/-/g, ' ').toLowerCase();

    if(visitor_id && visitor_id!=userId){
        this.track_view(userId, visitor_id)
    }
    let user = await this.userRepository.findOne({ where: { id: userId } ,  relations: ['positions', 'positions.details', 'positions.company'],});
    if (!user || user.full_name.toLowerCase() !== formattedName) {
      return null;
    }
    delete user.password;
    delete user.linkedin_access_token;
    if(user && user.positions && user.positions.length>0){
      let updated_positions=[]
      let totalRevenue=0;
      
      for(let i=0;i<user.positions.length;i++){
        let completion_percentage=(user.positions[i] && user.positions[i]?.details) ? this.calculateCompletionPercentage(user.positions[i]) : 0.0

        let is_completed: boolean= completion_percentage==100.0? true : false
        updated_positions.push({
          ...user.positions[i],
          is_completed: is_completed,
          completion_percentage
        })
        if(is_completed){
          totalRevenue+=+user.positions[i].details.revenue_generated;
        }
      }
      (user as any).total_revenue=totalRevenue;
      (user as any).total_years_experience=this.calculateExperience(user.positions)
      const {existing_business_average, new_business_average}= this.calculateWeightedAverageForBusiness(user.positions);
      const {outbound_average, inbound_average}= this.calculateWeightedAverageForOutbound(user.positions);
      const {smb_average, midmarket_average, enterprise_average}= this.calculateWeightedAverageForSegment(user.positions);
      (user as any).weightedAverageExistingBusiness=existing_business_average;
      (user as any).weightedAverageNewBusiness=new_business_average;
      (user as any).outbound_average=outbound_average;
      (user as any).inbound_average=inbound_average;
      (user as any).smb_average=smb_average;
      (user as any).midmarket_average=midmarket_average;
      (user as any).enterprise_average=enterprise_average;


      user.positions=updated_positions
    }


    (user as any).total_years_experience=this.calculateExperience(user.positions)
     user.positions=user.positions.filter((position)=>(position as any).is_completed)
    return user;
  }

  calculateWeightedAverageForBusiness(positions){
    let totalWeightedExistingBusiness = 0;
    let totalWeightedNewBusiness = 0;
    let totalDuration = 0;
  
    if(!positions || positions.length === 0){
      return { existing_business_average: 0, new_business_average: 0 };
    }
    
    positions.forEach(position => {
      if(!position.details || !this.isProfileCompleted(position.details)) {
        return;
      }
  
      let startMonth = position.start_month;
      let startYear = position.start_year;
      let endMonth = position.end_month;
      let endYear = position.end_year;
      let existingBusinessPercentage = position.details.existing_business;
      let newBusinessPercentage = position.details.new_business;
  
      let duration = this.calculateDuration(startMonth, startYear, endMonth, endYear);
      totalDuration += duration;
  
      let weightedExistingBusiness = existingBusinessPercentage * duration;
      let weightedNewBusiness = newBusinessPercentage * duration;
  
      totalWeightedExistingBusiness += weightedExistingBusiness;
      totalWeightedNewBusiness += weightedNewBusiness;
    });
  
    if(totalDuration === 0){
      return { existing_business_average: 0, new_business_average: 0 };
    }
  
    // Calculate weighted averages
    let weightedAverageExistingBusiness = totalWeightedExistingBusiness / totalDuration;
    let weightedAverageNewBusiness = totalWeightedNewBusiness / totalDuration;
  
    return { existing_business_average: Math.round(weightedAverageExistingBusiness), new_business_average: Math.round(weightedAverageNewBusiness) };
  }
  calculateDuration(startMonth, startYear, endMonth, endYear) {
    let startDate = new Date(startYear, startMonth - 1);
    let endDate:Date;
    if (endMonth === null || endYear === null) {
        endDate = new Date();
    } else {
        endDate = new Date(endYear, endMonth - 1);
    }
    let durationInMilliseconds = endDate.getTime() - startDate.getTime();
    let durationInMonths = durationInMilliseconds / (1000 * 60 * 60 * 24 * 30);
    return durationInMonths;
  }
  
  calculateWeightedAverageForOutbound(positions){
    let totalWeightedOutbound = 0;
    let totalWeightedInbound = 0;
    let totalDuration = 0;
  
    if(!positions || positions.length === 0){
      return { outbound_average: 0, inbound_average: 0 };
    }
    
    positions.forEach(position => {
      if(!position.details || !this.isProfileCompleted(position.details)) {
        return;
      }
  
      let startMonth = position.start_month;
      let startYear = position.start_year;
      let endMonth = position.end_month;
      let endYear = position.end_year;
      let outboundPercentage = position.details.outbound;
      let inboundPercentage = position.details.inbound;
  
      let duration = this.calculateDuration(startMonth, startYear, endMonth, endYear);
      totalDuration += duration;
  
      let weightedOutbound = outboundPercentage * duration;
      let weightedInbound = inboundPercentage * duration;
  
      totalWeightedOutbound += weightedOutbound;
      totalWeightedInbound += weightedInbound;
    });
  
    if(totalDuration === 0){
      return { outbound_average: 0, inbound_average: 0 };
    }
  
    // Calculate weighted averages
    let weightedAverageOutbound = totalWeightedOutbound / totalDuration;
    let weightedAverageInbound = totalWeightedInbound / totalDuration;
  
    return { outbound_average: Math.round(weightedAverageOutbound), inbound_average: Math.round(weightedAverageInbound) };
  }
  
  isProfileCompleted(details) {
    return ((details.is_leadership || details.is_individual_contributor || details.is_booking_meeting) &&
           details.outbound != null && 
           details.inbound != null && 
           details.revenue_generated != null && 
           details.segment_smb != null && 
           details.segment_mid_market != null &&
           details.segment_enterprise != null && 
           details.new_business != null && 
           details.existing_business != null && 
           details.worked_in != null && 
           details.sold_to != null &&
           details.territories != null && 
           details.short_deal_size != null && 
           details.average_deal_size != null && 
           details.long_deal_size != null && 
           details.short_sales_cycle != null && 
           details.average_sales_cycle != null && 
           details.long_sales_cycle != null && 
           details.persona != null && 
           details.quota_achievements != null);
}

  calculateWeightedAverageForSegment(positions) {
    let totalSmb = 0;
    let totalMidmarket = 0;
    let totalEnterprise = 0;
    let totalDuration = 0;
  
    if (!positions || positions.length === 0) {
      return { smb_average: 0, midmarket_average: 0, enterprise_average: 0 };
    }
  
    positions.forEach(position => {
      if (!position.details || !this.isProfileCompleted(position.details)) {
        return;
      }
  
      let startMonth = position.start_month;
      let startYear = position.start_year;
      let endMonth = position.end_month;
      let endYear = position.end_year;
      let smbPercentage = position.details.segment_smb;
      let midmarketPercentage = position.details.segment_mid_market;
      let enterprisePercentage = position.details.segment_enterprise;
  
      let duration = this.calculateDuration(startMonth, startYear, endMonth, endYear);
      totalDuration += duration;
  
      let weightedSmb = smbPercentage * duration;
      let weightedMidmarket = midmarketPercentage * duration;
      let weightedEnterprise = enterprisePercentage * duration;
  
      // Accumulate weighted values
      totalSmb += weightedSmb;
      totalMidmarket += weightedMidmarket;
      totalEnterprise += weightedEnterprise;
    });
  
    if (totalDuration === 0) {
      return { smb_average: 0, midmarket_average: 0, enterprise_average: 0 };
    }
  
    // Calculate weighted averages
    let weightedAverageSmb = totalSmb / totalDuration;
    let weightedAverageMidmarket = totalMidmarket / totalDuration;
    let weightedAverageEnterprise = totalEnterprise / totalDuration;
  
    return {
      smb_average: Math.round(weightedAverageSmb),
      midmarket_average: Math.round(weightedAverageMidmarket),
      enterprise_average: Math.round(weightedAverageEnterprise)
    };
  }
  calculateCompletionPercentage(position) {
    let totalFields = 0;
    let filledFields=0;
    if(position.details.is_leadership){
      totalFields=23;
      filledFields= this.calculateIsLeadershipFields(position)
    }
    else if(position.details.is_individual_contributor){
      totalFields=22;
      filledFields = this.calculateIsIndividualContributerFields(position)
    }
    else if(position.details.is_booking_meeting){
      totalFields=16;
      filledFields = this.calculateIsBookingMeetingFields(position)
    }
   
    const completionPercentage = filledFields == 0 ? 0.00 : parseFloat(((filledFields * 100) / totalFields).toFixed(2));
    return completionPercentage;
}

calculateIsBookingMeetingFields(position) {
  let totalFilled = 1;

  const positionFields=[
    'company', 'role', 'revenue_generated'
  ]

  positionFields.forEach(field=>{
    if(position[field]){
      totalFilled++;
    }
  })

  // Define fields that contribute 1 to the count
  const fieldsToCount1 = [
   'quota_achievements', 
     'average_booked_meeting',
  ];

  const arrayFields =[
    "worked_in", "sold_to", "persona", "territories", "achievements", "notable_clients"
  ]

  arrayFields.forEach(field => {
    if (position.details[field] && position.details[field].length>0) {
      totalFilled++;
    }
  });
  
  // Count fields that contribute 1 to the total filled count
  fieldsToCount1.forEach(field => {
    if (position.details[field]) {
      totalFilled++;
    }
  });

  // Check additional conditions
  if (position.details.segment_smb || position.details.segment_mid_market || position.details.segment_enterprise) {
    totalFilled++;
  }
  if (position.details.existing_business || position.details.new_business) {
    totalFilled++;
  }
  if(position.start_month && position.start_year)
    totalFilled+=2;
  if (position.details.outbound || position.details.inbound) {
    totalFilled++;
  }
  if(position.details.linkedin_percentage || position.details.email_percentage || position.details.cold_call_percentage || position.details.tradeshow_percentage || position.details.refferals_percentage){
    totalFilled++;
  }

  return totalFilled;
}


calculateIsIndividualContributerFields(position) {
  let totalFilled = 1;

  const positionFields=[
    'company', 'role', 'revenue_generated'
  ]

  positionFields.forEach(field=>{
    if(position[field]){
      totalFilled++;
    }
  })

  // Define fields that contribute 1 to the count
  const fieldsToCount1 = [
   'quota_achievements', 
     'short_deal_size', 
    'average_deal_size', 'long_deal_size', 'short_sales_cycle', 
    'average_sales_cycle', 'long_sales_cycle', 
     
  ];

  const arrayFields =[
    "worked_in", "sold_to", "persona", "territories", "achievements", "notable_clients"
  ]

  // Count fields that contribute 1 to the total filled count
  fieldsToCount1.forEach(field => {
    if (position.details[field]) {
      totalFilled++;
    }
  });

  arrayFields.forEach(field => {
    if (position.details[field] && position.details[field].length>0) {
      totalFilled++;
    }
  });

  // Check additional conditions
  if (position.details.segment_smb || position.details.segment_mid_market || position.details.segment_enterprise) {
    totalFilled++;
  }
  if (position.details.existing_business || position.details.new_business) {
    totalFilled++;
  }
  if(position.start_month && position.start_year)
    totalFilled+=2;
  if (position.details.outbound || position.details.inbound) {
    totalFilled++;
  }
  if(position.details.linkedin_percentage || position.details.email_percentage || position.details.cold_call_percentage || position.details.tradeshow_percentage || position.details.refferals_percentage){
    totalFilled++;
  }

  return totalFilled;
}

calculateIsLeadershipFields(position) {
  let totalFilled = 1;

  const positionFields=[
    'company', 'role', 'revenue_generated'
  ]

  positionFields.forEach(field=>{
    if(position[field]){
      totalFilled++;
    }
  })
  // Define fields that contribute 1 to the count
  const detailFields = [
    'quota_achievements', 
     'short_deal_size', 
    'average_deal_size', 'long_deal_size', 'short_sales_cycle', 
    'average_sales_cycle', 'long_sales_cycle', 
    'people_rolling_up'
  ];

  const arrayFields =[
    "worked_in", "sold_to", "persona", "territories", "management", "achievements", "notable_clients"
  ]

  // Count fields that contribute 1 to the total filled count
  detailFields.forEach(field => {
    if (position.details[field]) {
      totalFilled++;
    }
  });

  arrayFields.forEach(field => {
    if (position.details[field] && position.details[field].length>0) {
      totalFilled++;
    }
  });
  // Check additional conditions
  if (position.details.segment_smb || position.details.segment_mid_market || position.details.segment_enterprise) {
    totalFilled++;
  }
  if (position.details.existing_business || position.details.new_business) {
    totalFilled++;
  }
  if(position.start_month && position.start_year)
    totalFilled+=2;
  if (position.details.outbound || position.details.inbound) {
    totalFilled++;
  }

  return totalFilled;
}
  calculateExperience(positions) {
    if (positions.length === 0) {
        return "N/A";
    }
    const result = positions.reduce(
        (acc, position) => {
            if (position.is_completed) {
                return this.calculatePositionDays(position, acc);
            } else {
                return acc;
            }
        },
        { totalDays: 0, maxEndDate: null }
    );
    return this.calculateYearsAndMonths(result.totalDays);
}


calculatePositionDays(position, { totalDays, maxEndDate }) {
  const startDate:any = new Date(position.start_year, position.start_month - 1, 1);
  const endDate:any = (position.end_year && position.end_month)
   ? new Date(position.end_year, position.end_month - 1, 1)
   : new Date(); // Use the current date if end date is null
  let daysToAdd;
  if (maxEndDate === null || startDate >= maxEndDate) {
   // Include all days for the position
   daysToAdd = Math.max(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1, 0);
  } else {
   // Include only days after the previous max end date
   const maxEndDateDiff = Math.max(Math.ceil((startDate - maxEndDate) / (1000 * 60 * 60 * 24)), 0);
   daysToAdd = Math.max(Math.ceil((endDate - maxEndDate) / (1000 * 60 * 60 * 24)) - maxEndDateDiff + 1, 0);
  }
  return { totalDays: totalDays + daysToAdd, maxEndDate: endDate };
 }

 calculateYearsAndMonths(diff) {
  const years = Math.floor(diff / 365);
  const remainingDays = diff % 365;
  const months = Math.floor(remainingDays / 30.44); // Average number of days in a month
  if (years > 0 && months === 0) {
   return `${years} year${years !== 1 ? 's' : ''}`;
  } else if (years > 0 && months > 0) {
   return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
  } else if (months > 0) {
   return `${months} month${months !== 1 ? 's' : ''}`;
  } else {
   return "N/A";
  }
 }

}
