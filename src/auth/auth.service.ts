import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
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
import { MailgunService } from 'src/mailgun/mailgun.service';
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
    private readonly mailgunService: MailgunService,
    private readonly companyService: CompanyService,
    private readonly uploadService: S3UploadService,
    private readonly sharedService: SharedService,
  ) {}

  private async generateUniqueUsername(fullname: string): Promise<string> {
    let baseUsername = fullname.toLowerCase().replace(/\s+/g, '-');
    let username = baseUsername;
    let counter = 2;

    while (
      await this.userRepository.findOne({
        where: { public_profile_username: username },
      })
    ) {
      username = `${baseUsername}-${counter}`;
      counter++;
    }

    return username;
  }
  async findOrCreate(
    userDto: any,
    registerEmail: boolean,
  ): Promise<{ error: boolean; message?: string; user?: UserAccounts }> {
    const {
      email,
      displayName,
      profilePicture,
      accessToken,
      vanityName,
      username,
    } = userDto;

    try {
      /** todo: Create a condition here that if email is present then
       * search based on email, otherwise search based on username for old data
       */
      let user = await this.userRepository.findOne({
        where: [
          { email, role: 'Applicant' },
          { email, role: 'Super-Admin' },
          { username, role: 'Applicant' },
          { username, role: 'Super-Admin' },
        ],
      });

      if (user) {
        user.linkedin_access_token = accessToken;
        if (!user.username) user.username = username;
        //update this token in db
        await this.userRepository.save(user);

        return { error: false, user };
      }
      let public_profile_username = (await this.generateUniqueUsername(
        displayName,
      )) as any;
      let imageName =
        await this.uploadService.uploadImageFromURL(profilePicture);
      user = this.userRepository.create({
        email,
        full_name: displayName,
        profile_image: imageName ? imageName : '',
        linkedin_access_token: accessToken,
        username,
        role: 'Applicant',
        public_profile_username,
      });

      await this.userRepository.save(user);

      // Sending Registration Mail
      const messageData = {
        from: `TrackRec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
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
                        <p>I'm absolutely thrilled to have you here. At any given time, go to <a href="${process.env.REACT_APP_URL}">${process.env.REACT_APP_URL}</a> to access and update your track record.</p>
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
                        <p><a href="${process.env.REACT_APP_URL}" class="button">Go to TrackRec</a></p>
                     </div>
                        <p>Best,<br>
                           Team TrackRec<br>
                           <a href="${process.env.REACT_APP_URL}">app.trackrec.co</a>
                        </p>
                  </div>
               </body>
            </html>
      `,
      };
      if (registerEmail) {
        await this.mailgunService.sendMail(messageData);
      }
      return { error: false, user };
    } catch (error) {
      //todo: look for a better way to do this, check how TypeOrm gives status codes for each type, + Add pino logger to see logs later on
      if (error.code === '23505') {
        if (error.detail.includes('email')) {
          return {
            error: true,
            message: 'User with this email already exists.',
          };
        } else if (error.detail.includes('username')) {
          return {
            error: true,
            message: 'User with this username already exists.',
          };
        }
      } else {
        return { error: true, message: 'Error creating or finding user.' };
      }
    }
  }

  async updateProfilePciture(
    id: number,
    image,
  ): Promise<{ error: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return { error: true, message: 'User not found' };
    }

    try {
      let storedImage = await this.uploadService.uploadNewImage(
        image,
        'profile_images',
      );
      if (storedImage) user.profile_image = storedImage;

      await this.userRepository.save(user);

      return { error: false, message: 'Profile Image updated successfully' };
    } catch (error) {
      return { error: true, message: 'Failed to update user' };
    }
  }

  async updateUser(
    id: number,
    updateUserPayload: any,
  ): Promise<{ error: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return { error: true, message: 'User not found' };
    }
    try {
      updateUserPayload.is_preferences_save = true;
      const existingUser = await this.userRepository.findOne({
        where: {
          public_profile_username: updateUserPayload.public_profile_username,
        },
      });
      if (existingUser && existingUser.id != id) {
        return {
          error: true,
          message: 'This Public profile username already choosen.',
        };
      }

      // Update user properties based on the payload
      Object.assign(user, updateUserPayload);

      await this.userRepository.save(user);

      return { error: false, message: 'User updated successfully' };
    } catch (error) {
      return { error: true, message: 'Failed to update user' };
    }
  }

  async updatepreference(
    id: number,
    updateUserPreferencePayload: any,
  ): Promise<{ error: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    console.log(id);
    if (!user) {
      return { error: true, message: 'User not found' };
    }
    try {
      Object.assign(user, updateUserPreferencePayload);
      await this.userRepository.save(user);
      return { error: false, message: 'Preference save successfully' };
    } catch (error) {
      console.log(error);
      return { error: true, message: 'Failed to save preference' };
    }
  }

  async getMe(
    user_id: number,
  ): Promise<{ error: boolean; user?: any; message?: string }> {
    try {
      /** todo: Create a condition here that if email is present then
       * search based on email, otherwise search based on username for old data
       */
      let user = await this.userRepository.findOne({
        where: { id: user_id },
        relations: [
          'keywords',
          'positions',
          'positions.details',
          'positions.company',
          'positions.verify_request',
        ],
      });

      if (!user) {
        return { error: true, message: 'User not found' };
      }

      if (!user.isExperienceImported) {
        await this.importExperiences(user, user_id, user.username);
        user.isExperienceImported = true;
        await this.userRepository.save(user);
        let updatedUser = await this.userRepository.findOne({
          where: { id: user_id },
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
        if (
          updatedUser &&
          updatedUser.positions &&
          updatedUser.positions.length > 0
        ) {
          let updated_positions = [];
          let totalRevenue = 0;

          for (let i = 0; i < updatedUser.positions.length; i++) {
            let completion_percentage =
              user.positions[i] && user.positions[i]?.details
                ? this.sharedService.calculateCompletionPercentage(
                    user.positions[i],
                  )
                : 0.0;

            let is_completed: boolean =
              completion_percentage == 100.0 ? true : false;
            updated_positions.push({
              ...updatedUser.positions[i],
              is_completed: is_completed,
              completion_percentage,
            });
            if (is_completed) {
              totalRevenue +=
                +updatedUser.positions[i].details.revenue_generated;
            }
          }
          (updatedUser as any).total_revenue = totalRevenue;
          (updatedUser as any).total_years_experience =
            this.sharedService.calculateExperience(updatedUser.positions);
            (updatedUser as any).total_bdr_experience =
            this.sharedService.calculateExperience(updatedUser.positions, "bdr");
            (updatedUser as any).total_leadership_experience =
            this.sharedService.calculateExperience(updatedUser.positions, "leadership");
            (updatedUser as any).total_individual_contributor_experience =
            this.sharedService.calculateExperience(updatedUser.positions, "individual_contributor");
          const {
            existing_business_average,
            new_business_average,
            partnership_average,
          } = this.sharedService.calculateWeightedAverageForBusiness(
            updatedUser.positions,
          );
          const { outbound_average, inbound_average } =
            this.sharedService.calculateWeightedAverageForOutbound(
              updatedUser.positions,
            );
          const { smb_average, midmarket_average, enterprise_average } =
            this.sharedService.calculateWeightedAverageForSegment(
              updatedUser.positions,
            );
          (updatedUser as any).weightedAverageExistingBusiness =
            existing_business_average;
          (updatedUser as any).weightedAverageNewBusiness =
            new_business_average;
          (updatedUser as any).weightedAveragePartnershipBusiness =
            partnership_average;
          (updatedUser as any).outbound_average = outbound_average;
          (updatedUser as any).inbound_average = inbound_average;
          (updatedUser as any).smb_average = smb_average;
          (updatedUser as any).midmarket_average = midmarket_average;
          (updatedUser as any).enterprise_average = enterprise_average;

          updatedUser.positions = updated_positions;
        }
        return { error: false, user: updatedUser };
      }
      delete user.password;
      delete user.linkedin_access_token;
      if (user && user.positions && user.positions.length > 0) {
        let updated_positions = [];
        let totalRevenue = 0;
        for (let i = 0; i < user.positions.length; i++) {
          let completion_percentage = user.positions[i].details
            ? this.sharedService.calculateCompletionPercentage(
                user.positions[i],
              )
            : 0.0;
          let is_completed: boolean =
            completion_percentage == 100.0 ? true : false;

          updated_positions.push({
            ...user.positions[i],
            is_completed: is_completed,
            completion_percentage,
          });
          if (is_completed) {
            totalRevenue += +user.positions[i].details.revenue_generated;
          }
        }
        (user as any).total_revenue = totalRevenue;
        (user as any).total_years_experience =
          this.sharedService.calculateExperience(
            updated_positions.filter((pos) => pos.is_completed),
          );
        (user as any).total_bdr_experience =
          this.sharedService.calculateExperience(user.positions, "bdr");
        (user as any).total_leadership_experience =
          this.sharedService.calculateExperience(user.positions, "leadership");
        (user as any).total_individual_contributor_experience =
          this.sharedService.calculateExperience(user.positions, "individual_contributor");
        const {
          existing_business_average,
          new_business_average,
          partnership_average,
        } = this.sharedService.calculateWeightedAverageForBusiness(
          user.positions,
        );
        const { outbound_average, inbound_average } =
          this.sharedService.calculateWeightedAverageForOutbound(
            user.positions,
          );
        const { smb_average, midmarket_average, enterprise_average } =
          this.sharedService.calculateWeightedAverageForSegment(user.positions);

        (user as any).weightedAverageExistingBusiness =
          existing_business_average;
        (user as any).weightedAverageNewBusiness = new_business_average;
        (user as any).weightedAveragePartnershipBusiness = partnership_average;
        (user as any).outbound_average = outbound_average;
        (user as any).inbound_average = inbound_average;
        (user as any).smb_average = smb_average;
        (user as any).midmarket_average = midmarket_average;
        (user as any).enterprise_average = enterprise_average;
        user.positions = updated_positions;
      }
      return { error: false, user };
    } catch (error) {
      // Handle database errors or other exceptions, add logger
      return {
        error: true,
        message: `Error retrieving user details: ${error.message}`,
      };
    }
  }

  async importExperiences(user, userId, username) {
    const headers = {
      Authorization: `Bearer ${process.env.nobellaAccessToken}`,
    };
    let url = `https://nubela.co/proxycurl/api/v2/linkedin?linkedin_profile_url=https://www.linkedin.com/in/${username}&use_cache=if-recent`;

    try {
      const response = await axios.get(url, { headers });
      if (response && response.data && response.data.experiences.length > 0) {
        const { experiences } = response.data;
        const positionsPromises = experiences.map(async (experience) => {
          let company = await this.companyRepository.findOne({
            where: [{ name: experience.company }],
          });
          let newCompany = null;
          if (!company){
            let appoloCompany= await this.companyService.searchCompany({company_name: experience.company})
            const website_url = 
                 appoloCompany && !appoloCompany.error 
                    ? (
                      Array.isArray(appoloCompany.data?.organizations) && appoloCompany.data.organizations.length > 0 
                      ? appoloCompany.data.organizations[0]?.website_url : null
                     ) : null;

            newCompany = await this.companyService.createCompany({
              name: experience.company,
              logo_url: experience.logo_url ? experience.logo_url : null,
              domain: experience.domain ? experience.domain : null,
              website_url:website_url
            });
          }

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
            company: newCompany
              ? { id: newCompany.createdCompany.id }
              : company,
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
