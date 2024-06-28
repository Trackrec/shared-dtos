import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './positions.entity';
import { CompanyService } from 'src/company/company.service';
import { Company } from 'src/company/company.entity';
import { VerifyPosition } from 'src/verify-position/verify-position.entity';
import { MailgunService } from 'src/mailgun/mailgun.service';
import { UserAccounts } from 'src/auth/User.entity';
@Injectable()
export class PositionService {
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
    companyId: string,
    userId: number,
    positionData: any,
  ): Promise<any> {
    try {
      let company = await this.companyRepository.findOne({
        where: { company_id: positionData.company_id },
      });
      let newCompany;
      if (!company)
        newCompany = await this.companyService.createCompany({
          company_id: positionData?.company_id,
          name: positionData?.company_name,
          logo_url: positionData.logo_url ? positionData.logo_url : null,
          domain: positionData.domain ? positionData.domain : null,
        });

      const existingPositions = await this.positionRepository.find({
        where: { user: { id: userId } },
      });

      let isNewUserPosition = false;
      if (existingPositions.length === 0) {
        isNewUserPosition = true;
      }

      const position = this.positionRepository.create({
        ...positionData,
        user: { id: userId },
        company: { id: !company ? newCompany?.createdCompany.id : company.id },
      });

      if (isNewUserPosition) {
        await this.sendWelcomeEmail(userId);
      }
      const savedPosition = await this.positionRepository.save(position);

      return {
        ...savedPosition,
        company: {
          name: positionData?.company_name,
          logo_url: positionData.logo_url ? positionData.logo_url : null,
          domain: positionData.domain ? positionData.domain : null,
          id: !company ? newCompany?.createdCompany.id : company.id,
          company_id: !company
            ? newCompany?.createdCompany.company_id
            : company.company_id,
        },
      };
    } catch (error) {
      //todo: add logger here
      throw new Error(`Error creating position: ${error.message}`);
    }
  }

  async sendWelcomeEmail(userId) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    try {
      //Sending Experience Completion Mail
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
                 .header, .footer {
                 background: #333;
                 color: #fff;
                 padding: 20px 0;
                 text-align: center;
                 }
                 .content {
                 background: #fff;
                 padding: 20px;
                 margin: 20px 0;
                 }
                 .button {
                 display: inline-block;
                 background: #007bff;
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
                 <div class="header">
                    <h1>Congrats on Completing Your First Experience</h1>
                 </div>
                 <div class="content">
                    <p>Hello ${user?.full_name},</p>
                    <p>Congrats! You successfully completed your first experience on TrackRec.</p>
                    <p>Now you can have it verified by Managers, Colleagues or Clients:</p>
                    <ol>
                       <li>Click on the blue "Verify" button, top right of any experience</li>
                       <li>Enter the information of the person of your choice and their capacity</li>
                       <li>Send your request!</li>
                    </ol>
                    <p>You'll receive an email once this person verifies this experience and their name & LinkedIn profile will be displayed in the Verified section of your profile.</p>
                    <p>Let's grow your sales career,</p>
                    <p>Victor @ TrackRec<br>Founder</p>
                    <p><a href="${process.env.REACT_APP_URL}" class="button">Go to TrackRec</a></p>
                 </div>
                 <div class="footer">
                    <p>Best,<br>
                       Team TrackRec<br> 
                       <a href="${process.env.REACT_APP_URL}" style="color: #fff;">app.trackrec.co</a>
                    </p>
                 </div>
              </div>
           </body>
        </html>        
  `,
      };

      await this.mailgunService.sendMail(messageData);
    } catch (error) {}
  }

  async getPositionById(positionId: number): Promise<Position> {
    try {
      const position = await this.positionRepository.findOne({
        where: { id: positionId },
      });

      if (!position) {
        throw new NotFoundException('Position not found');
      }

      return position;
    } catch (error) {
      //todo: add logger here
      throw new Error(`Error getting position by ID: ${error.message}`);
    }
  }

  async updatePosition(
    positionId: number,
    positionData: Partial<Position>,
  ): Promise<Position> {
    try {
      //todo: remove
      await this.getPositionById(positionId);

      //todo: use return true so you dont have to do a db call to get latest details
      await this.positionRepository.update(positionId, positionData);

      //todo: remove
      return await this.getPositionById(positionId);
    } catch (error) {
      //todo: add logger here
      throw new Error(`Error updating position: ${error.message}`);
    }
  }

  async deletePosition(positionId: number): Promise<void> {
    try {
      //todo: remove
      await this.getPositionById(positionId);

      // Delete related verification requests
      await this.verifyPositionRepository.delete({
        position: { id: positionId },
      });

      //todo: add logger here, evaluate response and send appropriate object back
      await this.positionRepository.delete(positionId);
    } catch (error) {
      throw new Error(`Error deleting position: ${error.message}`);
    }
  }

  async getAllPositionsByUserId(userId: number): Promise<Position[]> {
    try {
      return await this.positionRepository.find({
        where: { user: { id: userId } },
      });
    } catch (error) {
      //todo: add logger here
      throw new Error(`Error getting positions by user ID: ${error.message}`);
    }
  }
}
