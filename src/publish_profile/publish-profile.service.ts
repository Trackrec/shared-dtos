// publish-profile.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { AccountsVisitors } from 'src/visitors/accounts_visitor.entity';
import { AnalyticsAccess } from 'src/visitors/analytics_access.entity';
import { SharedService } from 'src/shared/shared.service';
import { MailgunService } from 'src/mailgun/mailgun.service';
import {
  AccountsVisitorsDto,
  AnalyticsAccessDto,
  ExtendedPositionDto,
  ExtendedUserDetailsDto,
  GetInTouchMailRequestDto,
  ProfileViewsResponseDto,
  UserDto,
} from 'src/shared-dtos/src/user.dto';
import { PositionDto, VerifyPositionDto } from 'src/shared-dtos/src/position.dto';
import { configurations } from '../config/env.config';

const { reactAppUrl, mailgun } = configurations;
@Injectable()
export class PublishProfileService {
  private readonly logger = new Logger(PublishProfileService.name);

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

  async publishProfile(userId: number): Promise<{ error: boolean; message: string }> {
    this.logger.log(`Attempting to publish profile for user ID: ${userId}`);
    try {
      const user: UserAccounts = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        this.logger.warn(`User not found for user ID: ${userId}`);
        return { error: true, message: 'User not found' };
      }

      user.published_at = new Date();
      await this.userRepository.save(user);

      this.logger.log(`Profile published successfully for user ID: ${userId}`);
      return { error: false, message: 'Profile published successfully' };
    } catch (error) {
      this.logger.error(`Error publishing profile for user ID: ${userId}`, error.stack);
      return { error: true, message: 'Internal server error' };
    }
  }

  async sendGetInTouchMail(
    emailData: GetInTouchMailRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.log(`Attempting to send 'Get in Touch' email to: ${emailData.email_to}`);

    try {
      const user: UserAccounts = await this.userRepository.findOne({
        where: { email: emailData?.email_to },
      });

      if (!user) {
        this.logger.warn(`User with email ${emailData.email_to} not found.`);
        return { error: true, message: 'User not found' };
      }

      const messageData = {
        from: `TrackRec <no-reply@${mailgun.domain}>`,
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
                <a href="${reactAppUrl}">app.trackrec.co</a> <br/>
              </div>
            </div>
          </body>
          </html>`,
      };

      this.logger.log(`Sending email to ${user.email}`);
      await this.mailgunService.sendMail(messageData);
      this.logger.log(`Email successfully sent to ${user.email}`);

      return { error: false, message: 'Email sent successfully' };
    } catch (error) {
      this.logger.error(
        `Error sending 'Get in Touch' email to ${emailData.email_to}: ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Internal server error' };
    }
  }

  async privateProfile(userId: number): Promise<{ error: boolean; message: string }> {
    this.logger.log(`Attempting to make profile private for user ID: ${userId}`);

    try {
      const user: UserDto = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        this.logger.warn(`User with ID ${userId} not found.`);
        return { error: true, message: 'User not found' };
      }

      user.published_at = null;
      await this.userRepository.save(user);

      this.logger.log(`Profile successfully made private for user ID: ${userId}`);
      return { error: false, message: 'Profile made private successfully' };
    } catch (error) {
      this.logger.error(
        `Error making profile private for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Internal server error' };
    }
  }

  async getProfileViews(userId: number): Promise<ProfileViewsResponseDto> {
    this.logger.log(`Fetching profile views for user ID: ${userId}`);

    try {
      const analyticsAccessRecords: AnalyticsAccessDto[] = await this.analyticsRepository.find({
        where: {
          user: {
            id: userId,
          },
        },
        relations: ['accountVisitor'],
        order: {
          created_at: 'DESC',
        },
      });

      this.logger.log(
        `Successfully fetched ${analyticsAccessRecords.length} profile views for user ID: ${userId}`,
      );
      return { error: false, views: analyticsAccessRecords };
    } catch (error) {
      this.logger.error(
        `Error fetching profile views for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Views not found.' };
    }
  }

  async track_view(userId: number, visitorId: number): Promise<void> {
    this.logger.log(`Tracking profile view for user ID: ${userId} by visitor ID: ${visitorId}`);

    try {
      // Find the visitor by id
      const visitor: UserDto = await this.userRepository.findOne({
        where: { id: visitorId },
      });

      if (visitor) {
        this.logger.log(`Visitor found: ${visitor.full_name} (ID: ${visitorId})`);

        // Create and save new visitor entry
        const newVisitor: AccountsVisitorsDto = this.visitorRepository.create({
          email: visitor.email,
          full_name: visitor.full_name,
          linkedin_access_token: visitor.linkedin_access_token,
          username: visitor.username,
        });
        const createdVisitor = await this.visitorRepository.save(newVisitor);
        this.logger.log(`New visitor record created with ID: ${createdVisitor.id}`);

        // Create and save new analytics entry
        const newAnalytics: AnalyticsAccessDto = this.analyticsRepository.create({
          type: 'view',
          accountVisitor: { id: createdVisitor.id },
          user: { id: userId },
        });

        await this.analyticsRepository.save(newAnalytics);
        this.logger.log(
          `Analytics record created for user ID: ${userId} and visitor ID: ${createdVisitor.id}`,
        );
      } else {
        this.logger.warn(`Visitor with ID: ${visitorId} not found. No tracking recorded.`);
      }
    } catch (error) {
      this.logger.error(
        `Error tracking profile view for user ID: ${userId} by visitor ID: ${visitorId} - ${error.message}`,
        error.stack,
      );
    }
  }

  async findUserByIdAndName(
    userName: string,
    visitorId: number,
  ): Promise<ExtendedUserDetailsDto | null> {
    this.logger.log(`Fetching user profile for username: ${userName}`);

    try {
      const user: UserDto = await this.userRepository.findOne({
        where: { public_profile_username: userName },
        relations: [
          'positions',
          'positions.details',
          'positions.company',
          'positions.verify_request',
          'positions.verify_request.user',
        ],
      });

      if (!user) {
        this.logger.warn(`No user found with username: ${userName}`);
        return null;
      }

      if (!user?.published_at) {
        this.logger.warn(`User profile for username: ${userName} is not published`);
        return null;
      }

      this.logger.log(`User found: ${user.full_name} (ID: ${user.id})`);

      if (visitorId && visitorId !== user.id) {
        this.logger.log(`Tracking view for user ID: ${user.id} by visitor ID: ${visitorId}`);
        this.track_view(user.id, visitorId);
      }

      delete user.password;
      delete user.linkedin_access_token;

      if (user.positions && user.positions.length > 0) {
        const updatedPositions: ExtendedPositionDto[] = [];
        let totalRevenue = 0;

        for (const position of user.positions) {
          const updatedVerifyUser: VerifyPositionDto[] = [];

          for (const verifyRequest of position.verify_request) {
            if (verifyRequest.status !== 'Approved') continue;

            const verifiedUser = verifyRequest.user?.id
              ? await this.userRepository.findOne({ where: { id: verifyRequest.user.id } })
              : await this.userRepository.findOne({ where: { email: verifyRequest.email } });

            if (verifiedUser) {
              delete verifiedUser.password;
              delete verifiedUser.linkedin_access_token;
              this.logger.log(`Verified user found for position ID: ${position.id}`);
            }

            updatedVerifyUser.push({ ...verifyRequest, user: verifiedUser });
          }

          const completionPercentage = position.details
            ? this.sharedService.calculateCompletionPercentage(position)
            : 0.0;
          const isCompleted = completionPercentage === 100.0;

          updatedPositions.push({
            ...position,
            is_completed: isCompleted,
            completion_percentage: completionPercentage,
            verify_request: updatedVerifyUser,
          });

          if (isCompleted) {
            totalRevenue += position.details.revenue_generated || 0;
          }
        }

        const extendedUser: ExtendedUserDetailsDto = {
          ...user,
          total_revenue: totalRevenue,
          total_years_experience: this.sharedService.calculateExperience(user.positions),
          total_bdr_experience: this.sharedService.calculateExperience(user.positions, 'bdr'),
          total_leadership_experience: this.sharedService.calculateExperience(
            user.positions,
            'leadership',
          ),
          total_individual_contributor_experience: this.sharedService.calculateExperience(
            user.positions,
            'individual_contributor',
          ),
          positions: updatedPositions,
          groupPositions: this.sharedService.groupAndSortPositions(updatedPositions),
          ...this.calculateWeightedAverages(user.positions),
        };

        extendedUser.positions = updatedPositions.filter((position) => position.is_completed);
        extendedUser.groupPositions = this.sharedService.groupAndSortPositions(
          extendedUser.positions.filter((position) => position.is_completed),
        );

        this.logger.log(`Profile data prepared successfully for username: ${userName}`);
        return extendedUser;
      }

      this.logger.warn(`No positions found for user: ${userName}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching profile for username: ${userName} - ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  private calculateWeightedAverages(positions: PositionDto[]): Partial<ExtendedUserDetailsDto> {
    this.logger.log(`Calculating weighted averages for ${positions.length} positions`);

    try {
      const {
        existing_business_average: existingBusinessAverage,
        new_business_average: newBusinessAverage,
        partnership_average: partnershipAverage,
      } = this.sharedService.calculateWeightedAverageForBusiness(positions);
      this.logger.log(
        `Business Averages - Existing: ${existingBusinessAverage}, New: ${newBusinessAverage}, Partnership: ${partnershipAverage}`,
      );

      const { outbound_average: outboundAverage, inbound_average: inboundAverage } =
        this.sharedService.calculateWeightedAverageForOutbound(positions);
      this.logger.log(
        `Outbound/Inbound Averages - Outbound: ${outboundAverage}, Inbound: ${inboundAverage}`,
      );

      const {
        smb_average: smbAverage,
        midmarket_average: midmarketAverage,
        enterprise_average: enterpriseAverage,
      } = this.sharedService.calculateWeightedAverageForSegment(positions);
      this.logger.log(
        `Segment Averages - SMB: ${smbAverage}, Midmarket: ${midmarketAverage}, Enterprise: ${enterpriseAverage}`,
      );

      this.logger.log(`Weighted averages calculation completed successfully`);

      return {
        weightedAverageExistingBusiness: existingBusinessAverage,
        weightedAverageNewBusiness: newBusinessAverage,
        weightedAveragePartnershipBusiness: partnershipAverage,
        outbound_average: outboundAverage,
        inbound_average: inboundAverage,
        smb_average: smbAverage,
        midmarket_average: midmarketAverage,
        enterprise_average: enterpriseAverage,
      };
    } catch (error) {
      this.logger.error(`Error calculating weighted averages: ${error.message}`, error.stack);
      throw new Error(`Failed to calculate weighted averages.`);
    }
  }
}
