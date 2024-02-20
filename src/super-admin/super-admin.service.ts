// super-admin.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { Company } from 'src/company/company.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>
  ) {}

  async getAllUsers() {
    try {
        const users = await this.userRepository.find({ select: ['id', 'full_name', 'email', 'created_at', 'last_accessed_at', 'is_preferences_save'] });
        if (!users || users.length === 0) {
        return { error: false, data: [] };
      }
      return { error: false,  data: users };
    } catch (error) {
      return { error: true, message: 'Error fetching users: ' + error.message };
    }
  }

  async getUserDetails(user_id:any){
    try{
    let user= await this.userRepository.findOne({where:{id:user_id},  relations: ["keywords",'positions', 'positions.details']})
     if(!user){
        return { error: true, message: 'User not found.' };
     }
     delete user.password;

     (user as any).imported_positions = user.positions.length;

     let is_completed: boolean=false;
     let totalRevenue=0;

     for(let i=0;i<user.positions.length;i++){
         let completion_percentage=(user.positions[i] && user.positions[i]?.details) ? this.calculateCompletionPercentage(user.positions[i]) : 0.0
         is_completed= completion_percentage==100.0? true : false

         if(is_completed){
            totalRevenue+=+user.positions[i].details.revenue_generated;
         }
     }
     (user as any).completed_positions= is_completed;
     (user as any).total_revenue_generated = totalRevenue;
     (user as any).total_years_experience=this.calculateExperience(user.positions)

     delete user.positions;
     return {error: false, user}

    }
    catch(e){
        return { error: true, message: 'User not found.' };

    }

  }

  async updateBlockStatus(userId: number, body: any) {
    const { block_status } = body;
    if (block_status === undefined || block_status === null) {
        return { error: true, message: "block_status field is required" };
    }
    try {
        await this.userRepository.update(userId, { blocked: block_status });
        return { error: false, message: "Block status updated successfully!" };
    } catch (error) {
        return { error: true, message: "Error during updating block status." };
    }
}


  async getAllCompanies(){
      try{
        const companies= await this.companyRepository.find()
        if(!companies || companies.length==0){
            return {error: false, data: []}
        }
        return { error: false,  data: companies };

      }
      catch(error){
        return { error: true, message: 'Error fetching companies: ' + error.message };

      }
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
}
