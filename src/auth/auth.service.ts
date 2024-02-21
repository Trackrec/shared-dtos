import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from './User.entity';
import axios from 'axios';
import { PositionService } from 'src/positions/positions.service';
import { CompanyService } from 'src/company/company.service';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
import { SharedService } from 'src/shared/shared.service';
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
    private readonly uploadService: S3UploadService,
    private readonly sharedService: SharedService
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
      updateUserPayload.is_preferences_save= true;
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
        relations: ['keywords','positions', 'positions.details', 'positions.company'],
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
          relations: ["keywords",'positions', 'positions.details', 'positions.company'],
        });
        
        delete updatedUser.password;
        delete updatedUser.linkedin_access_token;
        if(updatedUser && updatedUser.positions && updatedUser.positions.length>0){
          let updated_positions=[]
          let totalRevenue=0;
          
          for(let i=0;i<updatedUser.positions.length;i++){
            let completion_percentage=(user.positions[i] && user.positions[i]?.details) ? this.sharedService.calculateCompletionPercentage(user.positions[i]) : 0.0

            let is_completed: boolean= completion_percentage==100.0? true : false
            updated_positions.push({
              ...updatedUser.positions[i],
              is_completed: is_completed,
              completion_percentage
            })
            if(is_completed){
              totalRevenue+=+updatedUser.positions[i].details.revenue_generated;
            }
          }
          (updatedUser as any).total_revenue=totalRevenue;
          (updatedUser as any).total_years_experience=this.sharedService.calculateExperience(updatedUser.positions)
          const {existing_business_average, new_business_average}= this.sharedService.calculateWeightedAverageForBusiness(updatedUser.positions);
          const {outbound_average, inbound_average}= this.sharedService.calculateWeightedAverageForOutbound(updatedUser.positions);
          const {smb_average, midmarket_average, enterprise_average}= this.sharedService.calculateWeightedAverageForSegment(updatedUser.positions);
          (updatedUser as any).weightedAverageExistingBusiness=existing_business_average;
          (updatedUser as any).weightedAverageNewBusiness=new_business_average;
          (updatedUser as any).outbound_average=outbound_average;
          (updatedUser as any).inbound_average=inbound_average;
          (updatedUser as any).smb_average=smb_average;
          (updatedUser as any).midmarket_average=midmarket_average;
          (updatedUser as any).enterprise_average=enterprise_average;


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
          let completion_percentage=user.positions[i].details ? this.sharedService.calculateCompletionPercentage(user.positions[i]) : 0.0
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
        (user as any).total_years_experience=this.sharedService.calculateExperience(user.positions)
        const {existing_business_average, new_business_average}= this.sharedService.calculateWeightedAverageForBusiness(user.positions);
        const {outbound_average, inbound_average}= this.sharedService.calculateWeightedAverageForOutbound(user.positions);
        const {smb_average, midmarket_average, enterprise_average}= this.sharedService.calculateWeightedAverageForSegment(user.positions);

        (user as any).weightedAverageExistingBusiness=existing_business_average;
        (user as any).weightedAverageNewBusiness=new_business_average;
        (user as any).outbound_average=outbound_average;
        (user as any).inbound_average=inbound_average;
        (user as any).smb_average=smb_average;
        (user as any).midmarket_average=midmarket_average;
        (user as any).enterprise_average=enterprise_average;
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
  

}
