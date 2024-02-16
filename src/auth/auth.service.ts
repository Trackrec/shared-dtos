import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from './User.entity';
import axios from 'axios';
import { PositionService } from 'src/positions/positions.service';
import { CompanyService } from 'src/company/company.service';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
import { Console } from 'console';
import { Position } from 'src/positions/positions.entity';
import { Company } from 'src/company/company.entity';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly positionService: PositionService,
    private readonly companyService: CompanyService,
    private readonly uploadService: S3UploadService
  ) {}

  async findOrCreate(userDto: any): Promise<{ error: boolean; message?: string; user?: UserAccounts }> {
    const { email, displayName, profilePicture, accessToken, vanityName, username } = userDto;

    try {
     
      /** todo: Create a condition here that if email is present then 
       * search based on email, otherwise search based on username for old data
      */
      let user = await this.userRepository.findOne({
        where: [{ email }, { username }], 
      });

      if (user) {
        user.linkedin_access_token=accessToken;
        if(!user.username)
        user.username=username
        //update this token in db
        await this.userRepository.save(user);

        return { error: false, user };
      }
      let imageName=await this.uploadService.uploadImageFromURL(profilePicture)
      user = this.userRepository.create({
        email,
        full_name: displayName,
        profile_image: imageName?imageName:"",
        linkedin_access_token: accessToken,
        username,
        role: 'Applicant',
      });

      await this.userRepository.save(user);

      return { error: false, user };
    } catch (error) {

      //todo: look for a better way to do this, check how TypeOrm gives status codes for each type, + Add pino logger to see logs later on
      if (error.code === '23505') {
        if (error.detail.includes('email')) {
          return { error: true, message: 'User with this email already exists.' };
        } else if (error.detail.includes('username')) {
          return { error: true, message: 'User with this username already exists.' };
        }
      } else {
        return { error: true, message: 'Error creating or finding user.' };
      }
    }
  }

  async updateProfilePciture(id: number, image): Promise<{ error: boolean, message: string }> {
    const user = await this.userRepository.findOne({where:{id}});
    if (!user) {
      return { error: true, message: 'User not found' };
    }

    try {
      let storedImage=await this.uploadService.uploadNewImage(image, "profile_images")
      if(storedImage)
      user.profile_image=storedImage;
      

      await this.userRepository.save(user);

      return { error: false, message: 'Profile Image updated successfully' };
    } catch (error) {
      return { error: true, message: 'Failed to update user' };
    }
  }



  async updateUser(id: number, updateUserPayload: any): Promise<{ error: boolean, message: string }> {
    const user = await this.userRepository.findOne({where:{id}});
    if (!user) {
      return { error: true, message: 'User not found' };
    }
    try {
      // Update user properties based on the payload
      Object.assign(user, updateUserPayload);

      await this.userRepository.save(user);

      return { error: false, message: 'User updated successfully' };
    } catch (error) {
      return { error: true, message: 'Failed to update user' };
    }
  }
  async getMe(username: string, user_id:number): Promise<{ error: boolean; user?: any; message?: string }> {
    try {
       /** todo: Create a condition here that if email is present then 
       * search based on email, otherwise search based on username for old data
      */
       let user = await this.userRepository.findOne({
        where: { username: username },
        relations: ['positions', 'positions.details', 'positions.company'],
      });
      

      if (!user) {
        return { error: true, message: 'User not found' };
      }

      if(!user.isExperienceImported){
        await this.importExperiences(user,user_id, user.username)
        user.isExperienceImported=true;
        await this.userRepository.save(user);
        let updatedUser = await this.userRepository.findOne({
          where: { username: username },
          relations: ['positions', 'positions.details', 'positions.company'],
        });
        
        delete updatedUser.password;
        delete updatedUser.linkedin_access_token;
        if(updatedUser && updatedUser.positions && updatedUser.positions.length>0){
          let updated_positions=[]
          let totalRevenue=0;
          for(let i=0;i<updatedUser.positions.length;i++){
            let is_completed: boolean= updatedUser.positions[i].details ? this.isProfileCompleted(updatedUser.positions[i].details) : false
            updated_positions.push({
              ...updatedUser.positions[i],
              is_completed: is_completed
            })
            if(is_completed){
              totalRevenue+=+updatedUser.positions[i].details.revenue_generated;
            }
          }
          (updatedUser as any).total_revenue=totalRevenue;
          (updatedUser as any).total_years_experience=this.calculateExperience(updatedUser.positions)
          updatedUser.positions=updated_positions
        }
        return { error: false, user:updatedUser };

      }
      delete user.password;
      delete user.linkedin_access_token;
      if(user && user.positions && user.positions.length>0){
        let updated_positions=[]
        let totalRevenue=0;
        for(let i=0;i<user.positions.length;i++){
          let is_completed: boolean= user.positions[i].details ? this.isProfileCompleted(user.positions[i].details) : false
          let completion_percentage=user.positions[i].details ? this.calculateCompletionPercentage(user.positions[i]) : 0.0
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

        user.positions=updated_positions
      }
      return { error: false, user };


    } catch (error) {
      // Handle database errors or other exceptions, add logger 
      return { error: true, message: `Error retrieving user details: ${error.message}` };
    }
  }

  async importExperiences(user,userId, username){
    const headers = {
      Authorization: `Bearer ${process.env.nobellaAccessToken}`,
    };
    let url = `https://nubela.co/proxycurl/api/v2/linkedin?linkedin_profile_url=https://www.linkedin.com/in/${username}&use_cache=if-recent`

    try {
      const response = await axios.get(url, { headers });
      if(response && response.data && response.data.experiences.length>0){
        const {experiences} =response.data;
        const positionsPromises = experiences.map(async (experience) => {

          let company=await this.companyRepository.findOne({
            where: [
                { name:experience.company },
            ],
        });
        let newCompany=null;
        if(!company)
        newCompany=await this.companyService.createCompany({name:experience.company, logo_url: experience.logo_url ? experience.logo_url : null, domain: experience.domain ? experience.domain : null})
              
          const positionData = {
              start_month: experience.starts_at ? experience.starts_at.month : null,
              start_year: experience.starts_at ? experience.starts_at.year : null,
              end_month: experience.ends_at ? experience.ends_at.month : null,
              end_year: experience.ends_at ? experience.ends_at.year : null,
              role: experience.title,
          };
      
          const position = this.positionRepository.create({
              ...positionData,
              company: newCompany ? { id: newCompany.createdCompany.id } : company,
              user: user, 
          });
      
          return position;
      });
      
      const positions = await Promise.all(positionsPromises);
      
      // Now save all positions in one batch
      this.positionRepository.save(positions);
      


      }
      // Handle the response here
     // console.log('API Response:', response.data);
    } catch (error) {
      // Handle errors
      console.error('API Error:', error.message);
    }
  }
  calculateExperience(positions) {
    if (positions.length === 0) {
     return "N/A";
    }
    const result = positions.reduce(
     (acc, position) => this.calculatePositionDays(position, acc),
     { totalDays: 0, maxEndDate: null }
    );
    return this.calculateYearsAndMonths(result.totalDays);
   }

   calculateCompletionPercentage(position) {
    let totalFields = 0;
    let filledFields=0;
    if(position.details.is_leadership){
      totalFields=24;
      filledFields= this.calculateIsLeadershipFields(position)
    }
    else if(position.details.is_individual_contributor){
      totalFields=23;
      filledFields = this.calculateIsIndividualContributerFields(position)
    }
    else if(position.details.is_booking_meeting){
      totalFields=17;
      filledFields = this.calculateIsBookingMeetingFields(position)
    }
    //filledFields = this.calculateFilledFields(position);
    console.log(filledFields)
    console.log(totalFields)
    const completionPercentage = filledFields == 0 ? 0.00 : parseFloat(((filledFields * 100) / totalFields).toFixed(2));
    console.log(completionPercentage)
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

calculateFilledFields(position) {
    const detail = position.details;
    if (detail !== null && detail !== undefined) {
        const roleFilled = detail.is_individual_contributor || detail.is_leadership || detail.is_booking_meeting ? 1 : 0;

        const segmentsSum =
            (detail.segment_smb !== null && detail.segment_mid_market !== null && detail.segment_enterprise !== null &&
                detail.segment_smb + detail.segment_mid_market + detail.segment_enterprise === 100) ? 1 : 0;

        const businessSum =
            (detail.new_business !== null && detail.existing_business !== null &&
                detail.new_business + detail.existing_business === 100) ? 1 : 0;

        const outboundSum =
            (detail.outbound !== null && detail.inbound !== null &&
                detail.inbound + detail.outbound === 100) ? 1 : 0;

        const salesCyclesFilled =
            ((detail.average_sales_cycle !== null ? 1 : 0) +
                (detail.short_sales_cycle !== null ? 1 : 0) +
                (detail.long_sales_cycle !== null ? 1 : 0));

        const industryFieldsFilled =
            ((detail.worked_in !== null ? 1 : 0) +
                (detail.sold_to !== null ? 1 : 0) +
                (detail.revenue_generated !== null ? 1 : 0) +
                (position.role !== null ? 1 : 0) +
                (position.company_id !== null ? 1 : 0) +
                (detail.quota_achievement !== null ? 1 : 0) +
                (detail.people_rolling_up !== null ? 1 : 0) +
                (detail.average_deal_size !== null ? 1 : 0) +
                (detail.short_deal_size !== null ? 1 : 0) +
                (detail.long_deal_size !== null ? 1 : 0) +
                (detail.notable_clients !== null ? 1 : 0));

        const personasFilled = (detail.persona !== null && detail.persona.length > 0) ? 1 : 0;

        const territoryFilled = (detail.territories !== null && detail.territories.length > 0) ? 1 : 0;

        // const teamsManagedFilled = (detail.teams_managed_ids !== null && detail.teams_managed_ids.length > 0) ? 1 : 0;

        const achievementsFilled = (detail.achievements !== null && detail.achievements.length > 0) ? 1 : 0;

        return segmentsSum + salesCyclesFilled + industryFieldsFilled + personasFilled +
            territoryFilled  + businessSum + outboundSum +
            achievementsFilled + roleFilled;
    } else {
        return 0;
    }
}





  calculatePositionDays(position, { totalDays, maxEndDate }) {
    const startDate:any = new Date(position.start_year, position.start_month - 1, 1);
    const endDate:any = position.end_year && position.end_month
     ? new Date(position.endYear, position.endMonth - 1, 1)
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


}
