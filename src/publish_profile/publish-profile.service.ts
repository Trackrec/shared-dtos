// publish-profile.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { AccountsVisitors } from 'src/visitors/accounts_visitor.entity';
import { AnalyticsAccess } from 'src/visitors/analytics_access.entity';
import { SharedService } from 'src/shared/shared.service';
import { MailgunService } from 'src/mailgun/mailgun.service';
@Injectable()
export class PublishProfileService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(AccountsVisitors)
    private readonly visitorRepository: Repository<AccountsVisitors>,
    @InjectRepository(AnalyticsAccess)
    private readonly analyticsRepository: Repository<AnalyticsAccess>,
    private readonly sharedService: SharedService,
    private readonly mailgunService: MailgunService,
  ) {}

  async publishProfile(
    userId: number,
  ): Promise<{ error: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

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

  async sendGetInTouchMail(
    emailData: any,
  ): Promise<{ error: boolean; message: string }> {
    try {
      console.log(emailData);
      const user = await this.userRepository.findOne({
        where: { email: emailData?.email_to },
      });
      if (!user) {
        return { error: true, message: 'User not found' };
      }

      const messageData = {
        from: `TrackRec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
        to: user.email,
        subject: `Get in Touch - Inquiry from ${emailData.name}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Get in Touch - Inquiry</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                line-height: 1.6;
              }
              .content {
                background: #fff;
                padding: 20px;
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                background: #28a745;
                color: #fff;
                padding: 10px 15px;
                text-align: center;
                text-decoration: none;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <p>Hello ${user.full_name},</p>
                <p>You have received a new inquiry through your TrackRec profile.</p>
                <p>Details:</p>
                <ul>
                  <li><strong>Name:</strong> ${emailData.name}</li>
                  <li><strong>Email:</strong> ${emailData.email}</li>
                  <li><strong>Phone:</strong> ${emailData.phone}</li>
                  <li><strong>Inquiry:</strong> ${emailData.inquiry}</li>
                </ul>   
                <br/>
                
                Best, <br/>
                Team TrackRec <br/> 
                <a href="${process.env.REACT_APP_URL}">app.trackrec.co</a> <br/>
              </div>
            </div>
          </body>
          </html>`,
      };

      // Send the email using your mail service (e.g., Mailgun)
      await this.mailgunService.sendMail(messageData);

      return { error: false, message: 'Email send successfully' };
    } catch (error) {
      console.error('Error sending email:', error);
      return { error: true, message: 'Internal server error' };
    }
  }

  async privateProfile(
    userId: number,
  ): Promise<{ error: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return { error: true, message: 'User not found' };
      }

      user.published_at = null;
      await this.userRepository.save(user);

      return { error: false, message: 'Profile private successfully' };
    } catch (error) {
      console.error('Error privating profile:', error);
      return { error: true, message: 'Internal server error' };
    }
  }

  async getProfileViews(user_id) {
    try {
      const analyticsAccessRecords = await this.analyticsRepository.find({
        where: {
          user: {
            id: user_id,
          },
        },
        relations: ['accountVisitor'],
        order: {
          created_at: 'DESC',
        },
      });

      return { error: false, views: analyticsAccessRecords };
    } catch (error) {
      console.error('Error fetching profile views:', error);
      return { error: true, message: 'views not found.' };
    }
  }

  async track_view(userId: number, visitor_id: number): Promise<void> {
    try {
      // Find the visitor by id
      const visitor = await this.userRepository.findOne({
        where: { id: visitor_id },
      });

      // If visitor exists, create a new visitor and save it
      if (visitor) {
        const newVisitor = this.visitorRepository.create({
          email: visitor.email,
          full_name: visitor.full_name,
          linkedin_access_token: visitor.linkedin_access_token,
          username: visitor.username,
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

  async findUserByIdAndName(
    userName: string,
    visitor_id: number,
  ): Promise<UserAccounts | null> {
    const formattedName = userName.replace(/-/g, ' ').toLowerCase();
    let user = await this.userRepository.findOne({
      where: { public_profile_username: userName },
      relations: [
        'positions',
        'positions.details',
        'positions.company',
        'positions.verify_request',
        'positions.verify_request.user',
      ],
    });

    if (!user?.published_at) {
      return null;
    }

    if (!user) {
      return null;
    }
    if (visitor_id && visitor_id != user.id) {
      this.track_view(user.id, visitor_id);
    }

    delete user.password;
    delete user.linkedin_access_token;

    if (user && user.positions && user.positions.length > 0) {
      let updated_positions = [];
      let totalRevenue = 0;
      let postionVerifyUser;

      for (let i = 0; i < user.positions.length; i++) {
        let updated_verify_user = [];
        for (let j = 0; j < user.positions[i].verify_request.length; j++) {
          if (user?.positions[i].verify_request[j]?.status != 'Approved')
            continue;
          if (
            user?.positions[i].verify_request[j]?.status === 'Approved' &&
            user?.positions[i].verify_request[j]?.user?.id
          ) {
            postionVerifyUser = await this.userRepository.findOne({
              where: { id: user?.positions[i].verify_request[j]?.user['id'] },
            });
          } else {
            postionVerifyUser = await this.userRepository.findOne({
              where: {
                email: user?.positions[i].verify_request[j]?.email,
              },
            });
          }

          delete postionVerifyUser?.password;
          delete postionVerifyUser?.linkedin_access_token;
          updated_verify_user.push({
            ...user.positions[i].verify_request[j],
            user: postionVerifyUser,
          });
        }

        let completion_percentage =
          user.positions[i] && user.positions[i]?.details
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
          verify_request: updated_verify_user,
        });
        if (is_completed) {
          totalRevenue += +user.positions[i].details.revenue_generated;
        }
      }
      (user as any).total_revenue = totalRevenue;
      (user as any).total_years_experience =
        this.sharedService.calculateExperience(user.positions);
      (user as any).total_bdr_experience =
        this.sharedService.calculateExperience(user.positions, "bdr");
      (user as any).total_leadership_experience =
        this.sharedService.calculateExperience(user.positions, "leadership");
      (user as any).total_individual_contributor_experience =
        this.sharedService.calculateExperience(user.positions, "individual_experience");
      const {
        existing_business_average,
        new_business_average,
        partnership_average,
      } = this.sharedService.calculateWeightedAverageForBusiness(
        user.positions,
      );
      const { outbound_average, inbound_average } =
        this.sharedService.calculateWeightedAverageForOutbound(user.positions);
      const { smb_average, midmarket_average, enterprise_average } =
        this.sharedService.calculateWeightedAverageForSegment(user.positions);
      (user as any).weightedAverageExistingBusiness = existing_business_average;
      (user as any).weightedAverageNewBusiness = new_business_average;
      (user as any).weightedAveragePartnershipBusiness = partnership_average;
      (user as any).outbound_average = outbound_average;
      (user as any).inbound_average = inbound_average;
      (user as any).smb_average = smb_average;
      (user as any).midmarket_average = midmarket_average;
      (user as any).enterprise_average = enterprise_average;
       user.positions = updated_positions;
      (user as any).groupPositions = this.sharedService.groupAndSortPositions(updated_positions);
    }

    (user as any).total_years_experience =
      this.sharedService.calculateExperience(user.positions);
    (user as any).total_bdr_experience =
      this.sharedService.calculateExperience(user.positions, "bdr");
    (user as any).total_leadership_experience =
      this.sharedService.calculateExperience(user.positions, "leadership");
    (user as any).total_individual_contributor_experience =
      this.sharedService.calculateExperience(user.positions, "individual_experience");
    user.positions = user.positions.filter(
        (position) => (position as any).is_completed,
      );
    (user as any).groupPositions = this.sharedService.groupAndSortPositions(user.positions.filter(
      (position) => (position as any).is_completed,
    ));
    return user;
  }
}
