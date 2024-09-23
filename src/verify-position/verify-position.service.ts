// verifyPosition.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifyPosition } from './verify-position.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { MailgunService } from 'src/mailgun/mailgun.service';
import { Position } from 'src/positions/positions.entity';
import { SharedService } from 'src/shared/shared.service';
import * as jwt from 'jsonwebtoken';

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

        Hello ${existingRequest?.first_name} ${existingRequest?.last_name}, <br/><br/>
        ${existingRequest?.requestBy?.full_name} has listed you as someone who can attest to their professional accomplishments during their time at ${existingRequest?.position?.company?.name}.<br/><br/>
        Your verification would greatly assist ${existingRequest?.requestBy?.full_name} in substantiating their sales achievements and would contribute to the credibility of their profile.<br/><br/>
        If you could take a few moments to verify ${existingRequest?.requestBy?.full_name}'s sales achievements, it would be highly appreciated.<br/><br/>
        Your response will only take a few minutes and can be completed directly through our platform. <br/><br/>
        <a href="${process.env.REACT_APP_URL}/?approval_request=true&request_token=${existingRequest?.unique_token}">Click here</a> <br/><br/>

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

  generateUniqueToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_SECRET);
  }

  async requestVerification(requestBody: any, userId: any): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (user.email === requestBody?.email) {
        return {
          error: true,
          message: 'You cannot send request to yourself.',
        };
      }

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
      verifyPosition.unique_token = this.generateUniqueToken({
        id: verifyPosition.id,
      });
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

        Hello ${requestBody?.first_name}, <br/><br/>
        ${requestBy.full_name} is asking for your help! Like thousands of high level Sales pros, ${requestBy.full_name.split(' ')[0]} has built an impressive portfolio of their Sales achievements on TrackRec.<br/>
        Now, they listed you as someone who can attest to their professional accomplishments during their time at ${position?.company?.name}.<br/>
        ${requestBy.full_name.split(' ')[0]} needs 1 minute of your time to verify their experience with ${position?.company?.name} to solidify their sales achievements and help them land their next big role.<br/>
        Here's the link to help ${requestBy.full_name.split(' ')[0]}.<br/><br/>
        <a href="${process.env.REACT_APP_URL}/?approval_request=true&request_token=${verifyPosition.unique_token}">Click here</a> <br/><br/>

        And then, if you want to checkout the platform:  <a href="${process.env.REACT_APP_URL}">app.trackrec.co</a>
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
        relations: ['position', 'position.company', 'requestBy'],
      });

      if (!verifyPosition) {
        return { error: true, message: 'Verification request not found.' };
      }
      // Update the status
      verifyPosition.status = status;
      await this.verifyPositionRepository.save(verifyPosition);
      let messageData;
      const firstName = verifyPosition?.requestBy?.full_name?.split(' ')[0];

      if (status === 'Approved') {
        messageData = {
          from: `Trackrec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
          to: verifyPosition?.requestBy?.email,
          subject: `Your Experience Verification Update`,
          html: `
  
          Hello ${firstName},<br/>
          Great news. ${verifyPosition?.first_name} ${verifyPosition?.last_name} verified your ${verifyPosition?.position?.company?.name} experience as a ${verifyPosition?.role} of yours.<br/>
       
          Their name now appears on the Verification section of this experience on your profile. You can always edit these in your settings.<br/><br/>

          Great stuff! <br/>
          Team TrackRec <br/> 
  
          `,
        };
      } else {
        messageData = {
          from: `Trackrec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
          to: verifyPosition?.requestBy?.email,
          subject: `Your Experience Verification Update`,
          html: `
  
          Hello ${firstName},<br/>
          We regret to inform you that  ${verifyPosition?.first_name} ${verifyPosition?.last_name} was unable to verify your experience at ${verifyPosition?.position?.company?.name} as a ${verifyPosition?.role}.<br/>
       
          Their feedback has been noted, and this experience will not be listed as verified on your profile. You can review and update your experiences at any time in your settings.<br/><br/>

          Great stuff! <br/>
          Team TrackRec <br/> 
  
          `,
        };
      }

      await this.mailgunService.sendMail(messageData);

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
      // Awais Chnages

      // Retrieve all requests associated with the user's email
      const requests = await this.verifyPositionRepository.find({
        where: { user: { id: userId } },
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

  async updateUserIdInRequest(userId, body) {
    try {
      const { request_token } = body;
      const verifyPosition = await this.verifyPositionRepository.findOne({
        where: { unique_token: request_token },
      });
      if (verifyPosition && verifyPosition.user == null) {
        verifyPosition.user = userId as any;
        await this.verifyPositionRepository.save(verifyPosition);
      }
      return {
        error: false,
        message: 'User_id updated successfully in verify request.',
      };
    } catch (e) {
      return {
        error: true,
        message: 'Not able to update user_id in verify request.',
      };
    }
  }

  async deleteVerificationRequest(requestId) {
    try {
      const request = await this.verifyPositionRepository.findOne({
        where: { id: requestId },
      });
      if (!request) {
        return {
          error: true,
          message: 'Request not found.',
        };
      }
      await this.verifyPositionRepository.delete(requestId);
    } catch (error) {}
  }
}
