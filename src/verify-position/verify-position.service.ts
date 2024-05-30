// verifyPosition.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifyPosition } from './verify-position.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { MailgunService } from 'src/mailgun/mailgun.service';
import { Position } from 'src/positions/positions.entity';
import { SharedService } from 'src/shared/shared.service';

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
    private readonly sharedService: SharedService,
  ) {}

  async resendVerificationEmail(requestBody: any): Promise<any> {
    try {
      const existingRequest = await this.verifyPositionRepository.findOne({
        where: { id: requestBody.requestId },
        relations: ['position', 'requestBy', 'position.company'],
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
      verifyPosition.role = requestBody.role;
      verifyPosition.first_name = requestBody?.first_name;
      verifyPosition.last_name = requestBody?.last_name;

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

      console.log(position);
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
      // const requests = await this.verifyPositionRepository
      //   .createQueryBuilder('verifyPosition')
      //   .leftJoin('verifyPosition.requestBy', 'requestBy')
      //   .leftJoin('verifyPosition.position', 'position')
      //   .leftJoin('position.company', 'company')
      //   .leftJoin('position.details', 'details')
      //   .select([
      //     'verifyPosition.id',
      //     'verifyPosition.email',
      //     'verifyPosition.created_at',
      //     'verifyPosition.status',
      //     'verifyPosition.updated_at',
      //     'requestBy',
      //     'position',
      //     'details',
      //     'company',
      //   ])
      //   .where('verifyPosition.email = :email', { email: user.email })
      //   .getMany();

      // Awais Chnages

      // Retrieve all requests associated with the user's email
      const requests = await this.verifyPositionRepository.find({
        where: { email: user.email },
        relations: [
          'requestBy',
          'position',
          'position.company',
          'position.details',
        ],
      });
      let updatedRequests = requests;

      for (let i = 0; i < updatedRequests.length; i++) {
        let updated_requests_positon = null;
        let completion_percentage =
          updatedRequests[i].position && updatedRequests[i].position?.details
            ? this.sharedService.calculateCompletionPercentage(
                updatedRequests[i].position,
              )
            : 0.0;

        let is_completed: boolean =
          completion_percentage == 100.0 ? true : false;

        updated_requests_positon = {
          ...updatedRequests[i].position,
          is_completed: is_completed,
          completion_percentage,
        };
        updatedRequests[i].position = updated_requests_positon;
      }

      // Awais Chnages

      return { error: false, requests: updatedRequests };
    } catch (error) {
      console.log(error);
      return {
        error: true,
        message: 'Something went wrong, please try again.',
      };
    }
  }
}
