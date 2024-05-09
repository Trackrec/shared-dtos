// verifyPosition.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifyPosition } from './verify-position.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { MailgunService } from 'src/mailgun/mailgun.service';
import { Position } from 'src/positions/positions.entity';
@Injectable()
export class VerifyPositionService {
  constructor(
    @InjectRepository(VerifyPosition)
    private readonly verifyPositionRepository: Repository<VerifyPosition>,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    private readonly mailgunService: MailgunService,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
  ) {}

  async resendVerificationEmail(requestBody: any): Promise<any> {
    try {
      const existingRequest = await this.verifyPositionRepository.findOne({
        where: { id: requestBody.requestId },
        relations: ['position', 'requestBy'],
      });
      if (!existingRequest) {
        return {
          error: true,
          message: 'Request with this id does not exist!',
        };
      }

      const messageData = {
        from: `Trackrec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
        to: existingRequest?.email,
        subject: `Requesting verification of experience`,
        html: `

        Hello, <br/><br/>
        ${existingRequest?.requestBy?.full_name} has listed you as someone who can attest to their professional accomplishments during their time at ${existingRequest?.position?.company?.name}.<br/><br/>
        Your verification would greatly assist ${existingRequest?.requestBy?.full_name} in substantiating their sales achievements and would contribute to the credibility of their profile.<br/><br/>
        If you could take a few moments to verify ${existingRequest?.requestBy?.full_name}'s sales achievements, it would be highly appreciated.<br/><br/>
        Your response will only take a few minutes and can be completed directly through our platform. <br/><br/>
        <a href="${process.env.REACT_APP_URL}/approval-requests">Click here</a> <br/><br/>

        Best, <br/>
        Team TrackRec <br/> 
        app.trackrec.co <br/>

        `,
      };

      await this.mailgunService.sendMail(messageData);

      return {
        error: false,
        message: 'Email resent successfully!',
      };
    } catch (error) {
      return { error: true, message: 'Error sending verification erequest.' };
    }
  }
  async requestVerification(requestBody: any): Promise<any> {
    try {
      const existingRequest = await this.verifyPositionRepository.findOne({
        where: {
          position: { id: requestBody.positionId },
          email: requestBody.email,
        },
      });
      if (existingRequest) {
        return {
          error: true,
          message: 'Verification request for this position already sent!',
        };
      }
      const verifyPosition = new VerifyPosition();
      verifyPosition.email = requestBody.email;
      verifyPosition.requestBy = requestBody.requestBy;
      verifyPosition.position = requestBody.positionId;

      const createdRequest =
        await this.verifyPositionRepository.save(verifyPosition);

      const position = await this.positionRepository.findOne({
        where: { id: requestBody.positionId },
        relations: { company: true },
      });
      //position.verify_request = createdRequest;
      this.positionRepository.save(position);

      let requestBy = await this.userRepository.findOne({
        where: { id: requestBody.requestBy },
      });
      const messageData = {
        from: `Trackrec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
        to: requestBody.email,
        subject: `Requesting verification of experience`,
        html: `

        Hello, <br/><br/>
        ${requestBy.full_name} has listed you as someone who can attest to their professional accomplishments during their time at ${position?.company?.name}.<br/><br/>
        Your verification would greatly assist ${requestBy.full_name} in substantiating their sales achievements and would contribute to the credibility of their profile.<br/><br/>
        If you could take a few moments to verify ${requestBy.full_name}'s sales achievements, it would be highly appreciated.<br/><br/>
        Your response will only take a few minutes and can be completed directly through our platform. <br/><br/>
        <a href="${process.env.REACT_APP_URL}/approval-requests">Click here</a> <br/><br/>

        Best, <br/>
        Team TrackRec <br/> 
        app.trackrec.co <br/>

        `,
      };

      await this.mailgunService.sendMail(messageData);

      return {
        error: false,
        message: 'Verification request sent successfully!',
      };
    } catch (error) {
      return { error: true, message: 'Error sending verification erequest.' };
    }
  }

  async changeVerificationStatus(body) {
    try {
      const { status, request_id } = body;
      if (!status || !request_id) {
        return {
          error: true,
          message: 'Status and Request id are the required fields.',
        };
      }

      // Check if the requested verification exists
      const verifyPosition = await this.verifyPositionRepository.findOne({
        where: { id: request_id },
      });
      if (!verifyPosition) {
        return { error: true, message: 'Verification request not found.' };
      }
      // Update the status
      verifyPosition.status = status;
      await this.verifyPositionRepository.save(verifyPosition);

      return {
        success: true,
        message: 'Verification status updated successfully.',
      };
    } catch (e) {
      return {
        error: true,
        message: 'Error in updating verification request status, try again.',
      };
    }
  }

  async getAllRequests(userId) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const requests = await this.verifyPositionRepository
        .createQueryBuilder('verifyPosition')
        .leftJoin('verifyPosition.requestBy', 'requestBy')
        .leftJoin('verifyPosition.position', 'position')
        .leftJoin('position.company', 'company')
        .select([
          'verifyPosition.id',
          'verifyPosition.email',
          'verifyPosition.created_at',
          'verifyPosition.status',
          'verifyPosition.updated_at',
          'requestBy.id',
          'requestBy.email',
          'requestBy.full_name',
          'position',
          'company',
        ])
        .where('verifyPosition.email = :email', { email: user.email })
        .getMany();

      return { error: false, requests };
    } catch (error) {
      console.log(error);
      return {
        error: true,
        message: 'Something went wrong, please try again.',
      };
    }
  }
}
