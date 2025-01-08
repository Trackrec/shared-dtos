// publish-profile.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { AccountsVisitors } from 'src/visitors/accounts_visitor.entity';
import { AnalyticsAccess } from 'src/visitors/analytics_access.entity';
import { SharedService } from 'src/shared/shared.service';
import { MailgunService } from 'src/mailgun/mailgun.service';
import { AccountsVisitorsDto, AnalyticsAccessDto, ExtendedPositionDto, ExtendedUserDetailsDto, GetInTouchMailRequestDto, ProfileViewsResponseDto, UserDto } from 'src/shared-dtos/src/user.dto';
import { PositionDto, VerifyPositionDto } from 'src/shared-dtos/src/Position.dto';
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
      const user: UserAccounts= await this.userRepository.findOne({ where: { id: userId } });

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
    emailData: GetInTouchMailRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    try {
      console.log(emailData);
      const user: UserAccounts = await this.userRepository.findOne({
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
      const user: UserDto = await this.userRepository.findOne({ where: { id: userId } });

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

  async getProfileViews(user_id: number): Promise<ProfileViewsResponseDto> {
    try {
      const analyticsAccessRecords: AnalyticsAccessDto[] = await this.analyticsRepository.find({
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
      const visitor: UserDto = await this.userRepository.findOne({
        where: { id: visitor_id },
      });

      // If visitor exists, create a new visitor and save it
      if (visitor) {
        const newVisitor: AccountsVisitorsDto = this.visitorRepository.create({
          email: visitor.email,
          full_name: visitor.full_name,
          linkedin_access_token: visitor.linkedin_access_token,
          username: visitor.username,
        });
        const createdVisitor = await this.visitorRepository.save(newVisitor);

        // Create new analytics entry
        const newAnalytics: AnalyticsAccessDto = this.analyticsRepository.create({
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
  ): Promise<ExtendedUserDetailsDto | null> {
    const formattedName = userName.replace(/-/g, ' ').toLowerCase();
    let user: UserDto = await this.userRepository.findOne({
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
  
    if (user.positions && user.positions.length > 0) {
      let updated_positions: ExtendedPositionDto[] = [];
      let totalRevenue = 0;
  
      for (const position of user.positions) {
        let updated_verify_user: VerifyPositionDto[] = [];
  
        for (const verifyRequest of position.verify_request) {
          if (verifyRequest.status !== 'Approved') continue;
  
          const verifiedUser =
            verifyRequest.user?.id
              ? await this.userRepository.findOne({ where: { id: verifyRequest.user.id } })
              : await this.userRepository.findOne({ where: { email: verifyRequest.email } });
  
          if (verifiedUser) {
            delete verifiedUser.password;
            delete verifiedUser.linkedin_access_token;
          }
  
          updated_verify_user.push({ ...verifyRequest, user: verifiedUser });
        }
  
        const completion_percentage = position.details
          ? this.sharedService.calculateCompletionPercentage(position)
          : 0.0;
        const is_completed = completion_percentage === 100.0;
  
        updated_positions.push({
          ...position,
          is_completed,
          completion_percentage,
          verify_request: updated_verify_user,
        });
  
        if (is_completed) {
          totalRevenue += position.details.revenue_generated || 0;
        }
      }
  
      const extendedUser: ExtendedUserDetailsDto = {
        ...user,
        total_revenue: totalRevenue,
        total_years_experience: this.sharedService.calculateExperience(user.positions),
        total_bdr_experience: this.sharedService.calculateExperience(user.positions, 'bdr'),
        total_leadership_experience: this.sharedService.calculateExperience(user.positions, 'leadership'),
        total_individual_contributor_experience: this.sharedService.calculateExperience(
          user.positions,
          'individual_contributor'
        ),
        positions: updated_positions,
        groupPositions: this.sharedService.groupAndSortPositions(updated_positions),
        ...this.calculateWeightedAverages(user.positions),
      };
  
      extendedUser.positions = updated_positions.filter((position) => position.is_completed);
      extendedUser.groupPositions = this.sharedService.groupAndSortPositions(
        extendedUser.positions.filter((position) => position.is_completed)
      );
  
      return extendedUser;
    }
  
    return null;
  }


  private calculateWeightedAverages(positions: PositionDto[]): Partial<ExtendedUserDetailsDto> {
    const { existing_business_average, new_business_average, partnership_average } =
      this.sharedService.calculateWeightedAverageForBusiness(positions);
    const { outbound_average, inbound_average } =
      this.sharedService.calculateWeightedAverageForOutbound(positions);
    const { smb_average, midmarket_average, enterprise_average } =
      this.sharedService.calculateWeightedAverageForSegment(positions);
  
    return {
      weightedAverageExistingBusiness: existing_business_average,
      weightedAverageNewBusiness: new_business_average,
      weightedAveragePartnershipBusiness: partnership_average,
      outbound_average,
      inbound_average,
      smb_average,
      midmarket_average,
      enterprise_average,
    };
  }
  
}
