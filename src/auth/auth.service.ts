import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from './User.entity';
import axios from 'axios';
import { PositionService } from 'src/positions/positions.service';
import { CompanyService } from 'src/company/company.service';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
import { SharedService } from 'src/shared/shared.service';
import { Position } from 'src/positions/positions.entity';
import { Company } from 'src/company/company.entity';
import { MailgunService } from 'src/mailgun/mailgun.service';
import {
  ExtendedPositionDto,
  ExtendedUserDetailsDto,
  GetMeResponseDto,
  UpdatePreferencesRequestDto,
  UserDto,
} from 'src/shared-dtos/src/user.dto';
import { CompanyDto } from 'src/shared-dtos/src/company.dto';
import { configurations } from '../config/env.config';

const { mailgun, reactAppUrl, nobellaAccessToken } = configurations;
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly positionService: PositionService,
    private readonly mailgunService: MailgunService,
    private readonly companyService: CompanyService,
    private readonly uploadService: S3UploadService,
    private readonly sharedService: SharedService,
  ) {}

  private async generateUniqueUsername(fullname: string): Promise<string> {
    this.logger.log(`method: generateUniqueUsername start`);

    const baseUsername: string = fullname.toLowerCase().replace(/\s+/g, '-');
    let username: string = baseUsername;
    let counter: number = 2;

    this.logger.log(`baseUsername: ${baseUsername}`);

    while (
      await this.userRepository.findOne({
        where: { public_profile_username: username },
      })
    ) {
      username = `${baseUsername}-${counter}`;
      counter++;
    }

    this.logger.log(`Unique username generated: ${username}`);

    return username;
  }
  async findOrCreate(
    userDto: {
      email: string;
      displayName: string;
      profilePicture: string;
      accessToken: string;
      vanityName?: string;
      username: string;
    },
    registerEmail: boolean,
  ): Promise<{ error: boolean; message?: string; user?: UserAccounts }> {
    const { email, displayName, profilePicture, accessToken, username } = userDto;

    this.logger.debug(`findOrCreate called with email: ${email}, username: ${username}`);

    try {
      let user: UserAccounts = await this.userRepository.findOne({
        where: [
          { email, role: 'Applicant' },
          { email, role: 'Super-Admin' },
          { username, role: 'Applicant' },
          { username, role: 'Super-Admin' },
        ],
      });

      if (user) {
        this.logger.log(`User found with email: ${email} or username: ${username}`);
        user.linkedin_access_token = accessToken;
        if (!user.username) user.username = username;
        await this.userRepository.save(user);
        this.logger.log(`LinkedIn access token updated for user ID: ${user.id}`);
        return { error: false, user };
      }

      this.logger.log(`No existing user found. Creating a new user with email: ${email}`);
      const publicProfileUsername: string = await this.generateUniqueUsername(displayName);
      const imageName: string = await this.uploadService.uploadImageFromURL(profilePicture);

      user = this.userRepository.create({
        email,
        full_name: displayName,
        profile_image: imageName ? imageName : '',
        linkedin_access_token: accessToken,
        username,
        role: 'Applicant',
        public_profile_username: publicProfileUsername,
      });

      await this.userRepository.save(user);
      this.logger.log(`New user created with ID: ${user.id}`);

      const messageData = {
        from: `TrackRec <no-reply@${mailgun.domain}>`,
        to: user.email,
        subject: `Welcome to TrackRec`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
             <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to TrackRec</title>
                <style>
                   body {
                   font-family: Arial, sans-serif;
                   background-color: #f4f4f4;
                   color: #333;
                   line-height: 1.6;
                   }
                   .container {
                   width: 80%;
                   margin: auto;
                   overflow: hidden;
                   }
  
                   .content {
                   background: #fff;
                   padding: 20px;
                   margin: 20px 0;
                   }
  
                </style>
             </head>
             <body>
                <div class="container">
                   <div class="content">
                      <p>Hello ${user?.full_name}, and welcome to TrackRec.</p>
                      <p>I'm absolutely thrilled to have you here. At any given time, go to <a href="${reactAppUrl}">${reactAppUrl}</a> to access and update your track record.</p>
                      <p>Here’s what you can expect from using TrackRec:</p>
                      <ul>
                         <li>Showcase your sales achievements and track record (and ditch the resume once and for all).</li>
                         <li>Verify your experiences with approvals from managers, colleagues, and clients.</li>
                         <li>Share your profile with hiring managers to skip a few steps in the hiring process (and see who viewed it).</li>
                         <li>Receive job offers based on your own terms: location, compensation, work environment, title, etc.</li>
                         <li>Access salary benchmarks to understand how much others with a similar background are making in your industry and location.</li>
                      </ul>
                      <p>Let's grow your sales career,</p>
                      <p>Victor @ TrackRec<br>Founder</p>
                      <p><a href="${reactAppUrl}" class="button">Go to TrackRec</a></p>
                   </div>
                </div>
             </body>
          </html>
        `,
      };

      if (registerEmail) {
        await this.mailgunService.sendMail(messageData);
        this.logger.log(`Welcome email sent to ${user.email}`);
      }

      return { error: false, user };
    } catch (error) {
      this.logger.error(`Error in findOrCreate: ${error.message}`, error.stack);

      if (error.code === '23505') {
        if (error.detail.includes('email')) {
          this.logger.warn(`Duplicate email detected: ${email}`);
          return { error: true, message: 'User with this email already exists.' };
        } else if (error.detail.includes('username')) {
          this.logger.warn(`Duplicate username detected: ${username}`);
          return { error: true, message: 'User with this username already exists.' };
        }
      }

      return { error: true, message: 'Error creating or finding user.' };
    }
  }

  async updateProfilePciture(
    id: number,
    image: Buffer,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.debug(`updateProfilePciture called with user ID: ${id}`);

    const user: UserDto = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      return { error: true, message: 'User not found' };
    }

    try {
      this.logger.log(`Uploading new profile image for user ID: ${id}`);
      const storedImage: string = await this.uploadService.uploadNewImage(image, 'profile_images');

      if (storedImage) {
        user.profile_image = storedImage;
        this.logger.log(`Profile image uploaded successfully for user ID: ${id}`);
      }

      await this.userRepository.save(user);
      this.logger.log(`Profile image updated in the database for user ID: ${id}`);

      return { error: false, message: 'Profile Image updated successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to update profile image for user ID: ${id} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to update user' };
    }
  }

  async updateUser(
    id: number,
    updateUserPayload: UpdatePreferencesRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.debug(
      `updateUser called with ID: ${id} and Payload: ${JSON.stringify(updateUserPayload)}`,
    );

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      return { error: true, message: 'User not found' };
    }

    try {
      updateUserPayload.is_preferences_save = true;

      const existingUser: UserDto = await this.userRepository.findOne({
        where: {
          public_profile_username: updateUserPayload.public_profile_username,
        },
      });

      if (existingUser && existingUser.id != id) {
        this.logger.warn(
          `Public profile username "${updateUserPayload.public_profile_username}" is already taken by user ID: ${existingUser.id}`,
        );
        return {
          error: true,
          message: 'This Public profile username already chosen.',
        };
      }

      Object.assign(user, updateUserPayload);

      await this.userRepository.save(user);
      this.logger.log(`User with ID: ${id} updated successfully`);

      return { error: false, message: 'User updated successfully' };
    } catch (error) {
      this.logger.error(`Failed to update user with ID: ${id} - ${error.message}`, error.stack);
      return { error: true, message: 'Failed to update user' };
    }
  }

  async updatepreference(
    id: number,
    updateUserPreferencePayload: UpdatePreferencesRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.debug(
      `updatepreference called with ID: ${id} and Payload: ${JSON.stringify(updateUserPreferencePayload)}`,
      'UpdatePreferenceService',
    );

    const user: UserDto = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn(`User with ID: ${id} not found`, 'UpdatePreferenceService');
      return { error: true, message: 'User not found' };
    }

    try {
      Object.assign(user, updateUserPreferencePayload);

      this.logger.log(`Saving updated preferences for user ID: ${id}`);
      await this.userRepository.save(user);

      this.logger.log(`Preferences updated successfully for user ID: ${id}`);
      return { error: false, message: 'Preference saved successfully' };
    } catch (error) {
      this.logger.error(
        `Error updating preferences for user ID: ${id} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to save preference' };
    }
  }

  checkPositionsCompleted(positions) {
    this.logger.debug(
      `checkPositionsCompleted called with positions: ${JSON.stringify(positions)}`,
    );

    if (!positions || positions.length === 0) {
      this.logger.warn('No positions provided or positions array is empty');
      return false;
    }

    for (const position of positions) {
      if (position.is_completed) {
        this.logger.log(`Position marked as completed: ${JSON.stringify(position)}`);
        return true;
      }
    }

    this.logger.log('No completed positions found');
    return false;
  }

  getTopBarJobId(queryString) {
    this.logger.debug(`getTopBarJobId called with queryString: ${queryString}`);

    const params = new URLSearchParams(queryString);
    const jobId = params.has('top_bar_job_id') ? params.get('top_bar_job_id') : null;

    if (jobId) {
      this.logger.log(`Top bar job ID retrieved: ${jobId}`);
    } else {
      this.logger.warn(`No 'top_bar_job_id' found in query string`);
    }

    return jobId;
  }

  async getMe(userId: number): Promise<GetMeResponseDto> {
    this.logger.debug(`getMe called with user ID: ${userId}`);

    try {
      const user: ExtendedUserDetailsDto = await this.userRepository.findOne({
        where: { id: userId },
        relations: [
          'keywords',
          'positions',
          'positions.details',
          'positions.company',
          'positions.verify_request',
        ],
      });

      if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        return { error: true, message: 'User not found' };
      }

      if (!user.isExperienceImported) {
        this.logger.log(`Importing experiences for user ID: ${userId}`);
        await this.importExperiences(user, userId, user.username);
        user.isExperienceImported = true;
        await this.userRepository.save(user);
        this.logger.log(`Experiences imported and updated for user ID: ${userId}`);

        const updatedUser: ExtendedUserDetailsDto = await this.userRepository.findOne({
          where: { id: userId },
          relations: [
            'keywords',
            'positions',
            'positions.details',
            'positions.company',
            'positions.verify_request',
          ],
        });

        delete updatedUser.password;
        delete updatedUser.linkedin_access_token;

        if (updatedUser && updatedUser.positions && updatedUser.positions.length > 0) {
          const updatedPositions = [];
          let totalRevenue = 0;

          for (let i = 0; i < updatedUser.positions.length; i++) {
            const completionPercentage: number =
              user.positions[i] && user.positions[i]?.details
                ? this.sharedService.calculateCompletionPercentage(user.positions[i])
                : 0.0;

            const isCompleted: boolean = completionPercentage === 100.0;
            updatedPositions.push({
              ...updatedUser.positions[i],
              is_completed: isCompleted,
              completion_percentage: completionPercentage,
            });

            if (isCompleted) {
              totalRevenue += +updatedUser.positions[i].details.revenue_generated;
            }
          }

          updatedUser.total_revenue = totalRevenue;
          updatedUser.total_years_experience = this.sharedService.calculateExperience(
            updatedUser.positions,
          );
          updatedUser.total_bdr_experience = this.sharedService.calculateExperience(
            updatedUser.positions,
            'bdr',
          );
          updatedUser.total_leadership_experience = this.sharedService.calculateExperience(
            updatedUser.positions,
            'leadership',
          );
          updatedUser.total_individual_contributor_experience =
            this.sharedService.calculateExperience(updatedUser.positions, 'individual_contributor');

          const {
            existing_business_average: existingBusinessAverage,
            new_business_average: newBusinessAverage,
            partnership_average: partnershipAverage,
          } = this.sharedService.calculateWeightedAverageForBusiness(updatedUser.positions);

          const { outbound_average: outboundAverage, inbound_average: inboundAverage } =
            this.sharedService.calculateWeightedAverageForOutbound(updatedUser.positions);

          const {
            smb_average: smbAverage,
            midmarket_average: midmarketAverage,
            enterprise_average: enterpriseAverage,
          } = this.sharedService.calculateWeightedAverageForSegment(updatedUser.positions);

          updatedUser.weightedAverageExistingBusiness = existingBusinessAverage;
          updatedUser.weightedAverageNewBusiness = newBusinessAverage;
          updatedUser.weightedAveragePartnershipBusiness = partnershipAverage;
          updatedUser.outbound_average = outboundAverage;
          updatedUser.inbound_average = inboundAverage;
          updatedUser.smb_average = smbAverage;
          updatedUser.midmarket_average = midmarketAverage;
          updatedUser.enterprise_average = enterpriseAverage;
          updatedUser.positions = updatedPositions;
          updatedUser.groupPositions = this.sharedService.groupAndSortPositions(updatedPositions);

          this.logger.log(`User data processed successfully for user ID: ${userId}`);
        }

        return { error: false, user: updatedUser };
      }

      delete user.password;
      delete user.linkedin_access_token;

      if (user && user.positions && user.positions.length > 0) {
        const updatedPositions: ExtendedPositionDto[] = [];
        let totalRevenue = 0;

        for (let i = 0; i < user.positions.length; i++) {
          const completionPercentage = user.positions[i].details
            ? this.sharedService.calculateCompletionPercentage(user.positions[i])
            : 0.0;

          const isCompleted: boolean = completionPercentage === 100.0;

          updatedPositions.push({
            ...user.positions[i],
            is_completed: isCompleted,
            completion_percentage: completionPercentage,
          });

          if (isCompleted) {
            totalRevenue += +user.positions[i].details.revenue_generated;
          }
        }

        user.total_revenue = totalRevenue;
        user.total_years_experience = this.sharedService.calculateExperience(
          updatedPositions.filter((pos) => pos.is_completed),
        );
        user.total_bdr_experience = this.sharedService.calculateExperience(user.positions, 'bdr');
        user.total_leadership_experience = this.sharedService.calculateExperience(
          user.positions,
          'leadership',
        );
        user.total_individual_contributor_experience = this.sharedService.calculateExperience(
          user.positions,
          'individual_contributor',
        );

        const {
          existing_business_average: existingBusinessAverage,
          new_business_average: newBusinessAverage,
          partnership_average: partnershipAverage,
        } = this.sharedService.calculateWeightedAverageForBusiness(user.positions);

        const { outbound_average: outboundAverage, inbound_average: inboundAverage } =
          this.sharedService.calculateWeightedAverageForOutbound(user.positions);

        const {
          smb_average: smbAverage,
          midmarket_average: midmarketAverage,
          enterprise_average: enterpriseAverage,
        } = this.sharedService.calculateWeightedAverageForSegment(user.positions);

        user.weightedAverageExistingBusiness = existingBusinessAverage;
        user.weightedAverageNewBusiness = newBusinessAverage;
        user.weightedAveragePartnershipBusiness = partnershipAverage;
        user.outbound_average = outboundAverage;
        user.inbound_average = inboundAverage;
        user.smb_average = smbAverage;
        user.midmarket_average = midmarketAverage;
        user.enterprise_average = enterpriseAverage;
        user.positions = updatedPositions;
        user.groupPositions = this.sharedService.groupAndSortPositions(updatedPositions);

        this.logger.log(`User data processed successfully for user ID: ${userId}`);
      }

      return { error: false, user };
    } catch (error) {
      this.logger.error(
        `Error retrieving user details for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      return {
        error: true,
        message: `Error retrieving user details: ${error.message}`,
      };
    }
  }

 
  async importExperiences(user, userId, username) {
    this.logger.debug(`Starting importExperiences for user ID: ${userId}, username: ${username}`);
    const headers = {
      Authorization: `Bearer ${nobellaAccessToken}`,
    };
    let url = `https://nubela.co/proxycurl/api/v2/linkedin?linkedin_profile_url=https://www.linkedin.com/in/${username}&use_cache=if-recent`;

    try {
      this.logger.log(`Fetching experiences from LinkedIn for username: ${username}`);
      const response = await axios.get(url, { headers });
      if (response && response.data && response.data.experiences.length > 0) {
        const { experiences } = response.data;
        this.logger.log(`Received ${experiences.length} experiences for user ID: ${userId}`);
        const positionsPromises = experiences.map(async (experience) => {
          let company = await this.companyRepository.findOne({
            where: [{ name: experience.company }],
          });
          if (!company){
            this.logger.log(`Company "${experience.company}" not found. Searching for it via company service.`);
            let appoloCompany= await this.companyService.searchCompany(experience.company)
            const website_url = 
                 appoloCompany && !appoloCompany.error 
                    ? (
                      Array.isArray(appoloCompany.data?.organizations) && appoloCompany.data.organizations.length > 0 
                      ? appoloCompany.data.organizations[0]?.website_url : null
                     ) : null;

            const newCompany = await this.companyService.createCompany({
              name: experience.company,
              logo_url: experience.logo_url ? experience.logo_url : null,
              domain: experience.domain ? experience.domain : null,
              website_url:website_url
            });

            this.logger.log(`Created new company "${experience.company}" with ID: ${newCompany.createdCompany.id}`);
            const positionData = {
              start_month: experience.starts_at
                ? experience.starts_at.month
                : null,
              start_year: experience.starts_at ? experience.starts_at.year : null,
              end_month: experience.ends_at ? experience.ends_at.month : null,
              end_year: experience.ends_at ? experience.ends_at.year : null,
              role: experience.title,
            };
            

            const position = this.positionRepository.create({
              ...positionData,
              company: newCompany?.createdCompany?.id
                ? { id: newCompany.createdCompany.id }
                : null,
              user: user,
            });
            this.logger.debug(`Prepared position for role: ${experience.title} at company: ${company.name}`);
  
            return position;
          }
          else{
          const positionData = {
            start_month: experience.starts_at
              ? experience.starts_at.month
              : null,
            start_year: experience.starts_at ? experience.starts_at.year : null,
            end_month: experience.ends_at ? experience.ends_at.month : null,
            end_year: experience.ends_at ? experience.ends_at.year : null,
            role: experience.title,
          };

          const position = this.positionRepository.create({
            ...positionData,
            company:company,
            user: user,
          });

          this.logger.debug(`Prepared position for role: ${experience.title} at company: ${company.name}`);
          return position;
        }
        });

        const positions = await Promise.all(positionsPromises);

        // Now save all positions in one batch
        this.positionRepository.save(positions);
        this.logger.log(`Successfully saved ${positions.length} positions for user ID: ${userId}`);
      }
      else{
        this.logger.warn(`No experiences found for user ID: ${userId}`);
      }
      // Handle the response here
      // console.log('API Response:', response.data);
    } catch (error) {
      // Handle errors
      console.error('API Error:', error.message);
    }
  }
  
  
}
