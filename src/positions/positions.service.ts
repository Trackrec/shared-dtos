import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './positions.entity';
import { CompanyService } from 'src/company/company.service';
import { Company } from 'src/company/company.entity';
import { VerifyPosition } from 'src/verify-position/verify-position.entity';
import { MailgunService } from 'src/mailgun/mailgun.service';
import { UserAccounts } from 'src/auth/User.entity';
import {
  PositionDto,
  PositionRequestDto,
  PositionWithCompany,
} from 'src/shared-dtos/src/Position.dto';
@Injectable()
export class PositionService {
  private readonly logger = new Logger(PositionService.name);

  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(VerifyPosition)
    private readonly verifyPositionRepository: Repository<VerifyPosition>,
    private readonly companyService: CompanyService,
    private readonly mailgunService: MailgunService,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async createPosition(
    companyId: string | null,
    userId: number,
    positionData: PositionRequestDto,
  ): Promise<PositionWithCompany> {
    try {
      this.logger.log(
        `Starting position creation for user ID: ${userId} with data: ${JSON.stringify(positionData)}`,
      );

      let company: Company = await this.companyRepository.findOne({
        where: { company_id: positionData.company_id },
      });

      let newCompany;

      if (!company) {
        this.logger.log(
          `Company not found for company_id: ${positionData.company_id}. Creating new company.`,
        );

        newCompany = await this.companyService.createCompany({
          company_id: positionData?.company_id,
          name: positionData?.company_name,
          logo_url: positionData.logo_url ? positionData.logo_url : null,
          domain: positionData.domain ? positionData.domain : null,
          website_url: positionData.website_url ? positionData.website_url : null,
        });

        if (newCompany.error) {
          this.logger.error(
            `Error creating new company for company_id: ${positionData.company_id}`,
          );
          throw new Error('Error creating company');
        }

        this.logger.log(`New company created with ID: ${newCompany.createdCompany.id}`);
      } else {
        if (positionData?.website_url && company.website_url !== positionData.website_url) {
          this.logger.log(`Updating website URL for existing company ID: ${company.id}`);
          company.website_url = positionData.website_url;
          company = await this.companyRepository.save(company);
        }
      }

      const existingPositions: Position[] = await this.positionRepository.find({
        where: { user: { id: userId } },
      });

      const isNewUserPosition: boolean = existingPositions.length === 0;

      if (isNewUserPosition) {
        this.logger.log(
          `This is the first position for user ID: ${userId}. Sending welcome email.`,
        );
        await this.sendWelcomeEmail(userId);
      }

      const position: Position = this.positionRepository.create({
        ...positionData,
        user: { id: userId },
        company: { id: !company ? newCompany?.createdCompany.id : company.id },
      });

      const savedPosition: Position = await this.positionRepository.save(position);

      this.logger.log(
        `Position created successfully for user ID: ${userId} with position ID: ${savedPosition.id}`,
      );

      return {
        ...savedPosition,
        company: {
          name: positionData?.company_name,
          logo_url: positionData.logo_url ? positionData.logo_url : null,
          domain: positionData.domain ? positionData.domain : null,
          id: !company ? newCompany?.createdCompany.id : company.id,
          company_id: !company ? newCompany?.createdCompany.company_id : company.company_id,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating position for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      throw new Error(`Error creating position: ${error.message}`);
    }
  }

  async sendWelcomeEmail(userId: number) {
    try {
      this.logger.log(`Fetching user details for user ID: ${userId} to send a welcome email.`);

      const user: UserAccounts = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        this.logger.warn(`User not found with ID: ${userId}. Cannot send welcome email.`);
        return;
      }

      this.logger.log(`Preparing welcome email for user: ${user.email}`);

      const messageData = {
        from: `TrackRec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
        to: user.email,
        subject: `Congrats on Completing Your First Experience`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
             <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Congrats on Completing Your First Experience</title>
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
                      <p>Hello ${user?.full_name},</p>
                      <p>Congrats! You successfully completed your first experience on TrackRec.</p>
                      <p>Now you can have it verified by Managers, Colleagues, or Clients:</p>
                      <ol>
                         <li>Click on the blue "Verify" button, top right of any experience.</li>
                         <li>Enter the information of the person of your choice and their capacity.</li>
                         <li>Send your request!</li>
                      </ol>
                      <p>You'll receive an email once this person verifies this experience, and their name & LinkedIn profile will be displayed in the Verified section of your profile.</p>
                      <p>Let's grow your sales career,</p>
                      <p>Victor @ TrackRec<br>Founder</p>
                      <p><a href="${process.env.REACT_APP_URL}" class="button">Go to TrackRec</a></p>
                   </div>
                </div>
             </body>
          </html>        
        `,
      };

      await this.mailgunService.sendMail(messageData);
      this.logger.log(`Welcome email successfully sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to user ID: ${userId} - ${error.message}`,
        error.stack,
      );
    }
  }

  async getPositionById(positionId: number): Promise<PositionDto> {
    try {
      this.logger.log(`Fetching position with ID: ${positionId}`);

      const position: PositionDto = await this.positionRepository.findOne({
        where: { id: positionId },
      });

      if (!position) {
        this.logger.warn(`Position with ID: ${positionId} not found.`);
        throw new NotFoundException('Position not found');
      }

      this.logger.log(`Successfully retrieved position with ID: ${positionId}`);
      return position;
    } catch (error) {
      this.logger.error(
        `Error fetching position with ID: ${positionId} - ${error.message}`,
        error.stack,
      );
      throw new Error(`Error getting position by ID: ${error.message}`);
    }
  }

  async updatePosition(
    positionId: number,
    positionData: Partial<PositionRequestDto>,
  ): Promise<PositionDto> {
    try {
      this.logger.log(`Attempting to update position with ID: ${positionId}`);
      this.logger.debug(`Update data: ${JSON.stringify(positionData)}`);

      await this.positionRepository.update(positionId, positionData);

      this.logger.log(`Successfully updated position with ID: ${positionId}`);

      const updatedPosition = await this.getPositionById(positionId);
      this.logger.debug(`Updated position details: ${JSON.stringify(updatedPosition)}`);

      return updatedPosition;
    } catch (error) {
      this.logger.error(
        `Error updating position with ID: ${positionId} - ${error.message}`,
        error.stack,
      );
      throw new Error(`Error updating position: ${error.message}`);
    }
  }

  async deletePosition(positionId: number): Promise<void> {
    try {
      this.logger.log(`Attempting to delete position with ID: ${positionId}`);

      // Delete related verification requests
      await this.verifyPositionRepository.delete({
        position: { id: positionId },
      });
      this.logger.log(`Deleted verification requests for position ID: ${positionId}`);

      // Delete the position
      await this.positionRepository.delete(positionId);
      this.logger.log(`Successfully deleted position with ID: ${positionId}`);
    } catch (error) {
      this.logger.error(
        `Error deleting position with ID: ${positionId} - ${error.message}`,
        error.stack,
      );
      throw new Error(`Error deleting position: ${error.message}`);
    }
  }

  async getAllPositionsByUserId(userId: number): Promise<PositionDto[]> {
    try {
      this.logger.log(`Fetching all positions for user ID: ${userId}`);

      const positions = await this.positionRepository.find({
        where: { user: { id: userId } },
      });

      this.logger.log(`Successfully fetched ${positions.length} positions for user ID: ${userId}`);
      return positions;
    } catch (error) {
      this.logger.error(
        `Error fetching positions for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      throw new Error(`Error getting positions by user ID: ${error.message}`);
    }
  }
}
