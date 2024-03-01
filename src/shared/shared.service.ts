import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';


@Injectable()
export class SharedService {

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


       calculateCompletionPercentage(position) {
        let totalFields = 0;
        let filledFields=0;
        if(position.details.is_leadership){
          totalFields=22;
          filledFields= this.calculateIsLeadershipFields(position)
        }
        else if(position.details.is_individual_contributor){
          totalFields=21;
          filledFields = this.calculateIsIndividualContributerFields(position)
        }
        else if(position.details.is_booking_meeting){
          totalFields=15;
          filledFields = this.calculateIsBookingMeetingFields(position)
        }
        const completionPercentage = filledFields == 0 ? 0.00 : parseFloat(((filledFields * 100) / totalFields).toFixed(2));
        return completionPercentage;
    }
    
    calculateIsBookingMeetingFields(position) {
      let totalFilled = 1;
    
      const positionFields=[
        'company', 'role', 
      ]
    
      positionFields.forEach(field=>{
        if(position[field]){
          totalFilled++;
        }
      })
    
      // Define fields that contribute 1 to the count
      const fieldsToCount1 = [
       'quota_achievements', 
         'average_booked_meeting','revenue_generated'
      ];
    
      const arrayFields =[
        "worked_in", "sold_to", "persona", "territories", "achievements"
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
        totalFilled+=1;
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
        'company', 'role'
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
        'average_sales_cycle', 'long_sales_cycle', 'revenue_generated'
         
      ];
    
      const arrayFields =[
        "worked_in", "sold_to", "persona", "territories", "achievements"
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
        totalFilled+=1;
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
        'company', 'role'
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
        'people_rolling_up', 'revenue_generated'
      ];
    
      const arrayFields =[
        "worked_in", "sold_to", "persona", "territories", "management", "achievements"
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
        totalFilled+=1;
      if (position.details.outbound || position.details.inbound) {
        totalFilled++;
      }
      return totalFilled;
    }


    calculateWeightedAverageForBusiness(positions){
        let totalWeightedExistingBusiness = 0;
        let totalWeightedNewBusiness = 0;
        let totalDuration = 0;
      
        if(!positions || positions.length === 0){
          return { existing_business_average: 0, new_business_average: 0 };
        }
        
        positions.forEach(position => {
          let completion_percentage=position.details ? this.calculateCompletionPercentage(position) : 0.0
          let is_completed: boolean= completion_percentage==100.0? true : false
           
          if(!position.details || !is_completed) {
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
          let completion_percentage=position.details ? this.calculateCompletionPercentage(position) : 0.0
          let is_completed: boolean= completion_percentage==100.0? true : false
           
          if(!position.details || !is_completed) {
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
      
      
      calculateWeightedAverageForSegment(positions) {
        let totalSmb = 0;
        let totalMidmarket = 0;
        let totalEnterprise = 0;
        let totalDuration = 0;
      
        if (!positions || positions.length === 0) {
          return { smb_average: 0, midmarket_average: 0, enterprise_average: 0 };
        }
      
        positions.forEach(position => {
          let completion_percentage=position.details ? this.calculateCompletionPercentage(position) : 0.0
          let is_completed: boolean= completion_percentage==100.0? true : false
           
          if(!position.details || !is_completed) {
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
}