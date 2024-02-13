import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from './User.entity';
import axios from 'axios';
import { PositionService } from 'src/positions/positions.service';
import { CompanyService } from 'src/company/company.service';
import { Console } from 'console';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    private readonly positionService: PositionService,
    private readonly companyService: CompanyService
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

      user = this.userRepository.create({
        email,
        full_name: displayName,
        profile_image: profilePicture,
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
  async getMe(username: string, user_id:number): Promise<{ error: boolean; user?: UserAccounts; message?: string }> {
    try {
       /** todo: Create a condition here that if email is present then 
       * search based on email, otherwise search based on username for old data
      */
       const user = await this.userRepository.findOne({
        where: { username: username },
        relations: ['positions', 'positions.details', 'positions.company'],
      });
      

      if (!user) {
        return { error: true, message: 'User not found' };
      }

      if(!user.isExperienceImported){
        await this.importExperiences(user_id, user.username)
        user.isExperienceImported=true;
        let updatedUser = await this.userRepository.save(user);
        delete updatedUser.password;
        delete updatedUser.linkedin_access_token;
        return { error: false, user:updatedUser };

      }
      delete user.password;
      delete user.linkedin_access_token;
      return { error: false, user };


    } catch (error) {
      // Handle database errors or other exceptions, add logger 
      return { error: true, message: `Error retrieving user details: ${error.message}` };
    }
  }

  async importExperiences(userId, username){
    const headers = {
      Authorization: `Bearer ${process.env.nobellaAccessToken}`,
    };
    let url = `https://nubela.co/proxycurl/api/v2/linkedin?linkedin_profile_url=https://www.linkedin.com/in/${username}&use_cache=if-recent`

    try {
      const response = await axios.get(url, { headers });
      if(response && response.data && response.data.experiences.length>0){
        const {experiences} =response.data;
        for(let i=0;i<experiences.length;i++){
        
            let newCompany=await this.companyService.createCompany({name:experiences[i].company, logo_url: experiences[i].logo_url ? experiences[i].logo_url : null})
             let positionData={
              start_month:experiences[i].starts_at ? experiences[i].starts_at.month : null,
              start_year:experiences[i].starts_at ? experiences[i].starts_at.year : null,
              end_month :experiences[i].ends_at ? experiences[i].ends_at.month : null,
              end_year :experiences[i].ends_at ? experiences[i].ends_at.year : null,
              role: experiences[i].title,
             }
             this.positionService.createPosition(newCompany?.createdCompany?.id,userId, positionData)
        }


      }
      // Handle the response here
     // console.log('API Response:', response.data);
    } catch (error) {
      // Handle errors
      console.error('API Error:', error.message);
    }
  }
}
