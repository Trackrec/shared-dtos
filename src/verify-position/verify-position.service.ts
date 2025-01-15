// verifyPosition.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifyPosition } from './verify-position.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { MailgunService } from 'src/mailgun/mailgun.service';
import { Position } from 'src/positions/positions.entity';
import { SharedService } from 'src/shared/shared.service';
import * as jwt from 'jsonwebtoken';
import { UserDto } from 'src/shared-dtos/src/user.dto';
import {
  ChangeVerificationRequestDto,
  ExtendedVerifyPositionDto,
  VerifyPositionDto,
  VerifyPositionRequestDto,
  VerifyRequestsResponseDto,
} from 'src/shared-dtos/src/Position.dto';

@Injectable()
export class VerifyPositionService {
  private readonly logger = new Logger(VerifyPositionService.name);

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

  async resendVerificationEmail(requestId: number): Promise<{ error: boolean; message: string }> {
    try {
      this.logger.log(`Attempting to resend verification email for request ID: ${requestId}`);

      const existingRequest: VerifyPosition = await this.verifyPositionRepository.findOne({
        where: { id: requestId },
        relations: ['position', 'requestBy', 'position.company'],
      });

      if (!existingRequest) {
        this.logger.warn(`Verification request with ID: ${requestId} does not exist`);
        return {
          error: true,
          message: 'Request with this id does not exist!',
        };
      }

      this.logger.log(
        `Found verification request for ${existingRequest?.first_name}, sending email...`,
      );

      const messageData = {
        from: `Trackrec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
        to: existingRequest?.email,
        subject: `Requesting verification of experience`,
        html: `
  
        Hello ${existingRequest?.first_name}, <br/><br/>
        ${existingRequest.requestBy.full_name} is asking for your help! Like thousands of high level Sales pros, ${existingRequest.requestBy.full_name.split(' ')[0]} has built an impressive portfolio of their Sales achievements on TrackRec.<br/>
        Now, they listed you as someone who can attest to their professional accomplishments during their time at ${existingRequest.position?.company?.name}.<br/>
        ${existingRequest.requestBy.full_name.split(' ')[0]} needs 1 minute of your time to verify their experience with ${existingRequest.position?.company?.name} to solidify their sales achievements and help them land their next big role.<br/>
        Here's the link to help ${existingRequest.requestBy.full_name.split(' ')[0]}.<br/><br/>
        <a href="${process.env.REACT_APP_URL}/?approval_request=true&request_token=${existingRequest.unique_token}">Click here</a> <br/><br/>
  
        And then, if you want to checkout the platform:  <a href="${process.env.REACT_APP_URL}">app.trackrec.co</a>
        `,
      };

      await this.mailgunService.sendMail(messageData);

      this.logger.log(`Verification email resent successfully for request ID: ${requestId}`);

      return {
        error: false,
        message: 'Email resent successfully!',
      };
    } catch (error) {
      this.logger.error(
        `Error sending verification email for request ID: ${requestId}: ${error.message}`,
      );
      return { error: true, message: 'Error sending verification request.' };
    }
  }

  generateUniqueToken(payload: { id: number }): string {
    return jwt.sign(payload, process.env.JWT_SECRET);
  }

  async requestVerification(
    requestBody: VerifyPositionRequestDto,
    userId: number,
  ): Promise<{ error: boolean; message: string }> {
    try {
      this.logger.log(
        `User ID: ${userId} is requesting verification for position ID: ${requestBody.positionId}`,
      );
      const user: UserDto = await this.userRepository.findOne({ where: { id: userId } });

      if (user.email === requestBody?.email) {
        this.logger.warn(
          `User ${user.id} attempted to send a verification request to themselves with email: ${requestBody?.email}`,
        );
        return {
          error: true,
          message: 'You cannot send request to yourself.',
        };
      }

      this.logger.log(
        `Checking for existing verification request for position ID: ${requestBody.positionId} and email: ${requestBody.email}`,
      );
      const existingRequest: VerifyPosition = await this.verifyPositionRepository.findOne({
        where: {
          position: { id: requestBody.positionId },
          email: requestBody.email,
        },
      });
      if (existingRequest) {
        this.logger.warn(
          `Verification request already exists for position ID: ${requestBody.positionId} and email: ${requestBody.email}`,
        );
        return {
          error: true,
          message: 'Verification request for this position already sent!',
        };
      }

      this.logger.log(`Fetching user with ID: ${requestBody.requestBy}`);
      const requestBy: UserAccounts = await this.userRepository.findOne({
        where: { id: requestBody.requestBy },
      });

      this.logger.log(`Fetching position with ID: ${requestBody.positionId}`);
      const position: Position = await this.positionRepository.findOne({
        where: { id: requestBody.positionId },
        relations: { company: true },
      });

      this.logger.log(
        `Creating new verification request for position ID: ${requestBody.positionId} and email: ${requestBody.email}`,
      );
      const verifyPosition = new VerifyPosition();
      verifyPosition.email = requestBody.email;
      verifyPosition.requestBy = requestBy;
      verifyPosition.position = position;
      verifyPosition.role = requestBody.role;
      verifyPosition.first_name = requestBody?.first_name;
      verifyPosition.last_name = requestBody?.last_name;
      verifyPosition.unique_token = this.generateUniqueToken({
        id: verifyPosition.id,
      });

      await this.verifyPositionRepository.save(verifyPosition);
      this.logger.log(
        `New verification request created and saved for position ID: ${requestBody.positionId} with email: ${requestBody.email}`,
      );

      //position.verify_request = createdRequest;
      this.positionRepository.save(position);

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
      this.logger.log(`Verification email sent`);
      return {
        error: false,
        message: 'Verification request sent successfully!',
      };
    } catch (error) {
      return { error: true, message: 'Error sending verification erequest.' };
    }
  }

  async changeVerificationStatus(
    body: ChangeVerificationRequestDto,
  ): Promise<{ error?: boolean; message: string; success?: boolean }> {
    try {
      const { status, request_id: requestId }: ChangeVerificationRequestDto = body;

      this.logger.log(`Attempting to change verification status for request ID: ${requestId}`);

      if (!status || !requestId) {
        this.logger.warn('Status or Request id is missing');
        return {
          error: true,
          message: 'Status and Request id are the required fields.',
        };
      }

      // Check if the requested verification exists
      const verifyPosition: VerifyPosition = await this.verifyPositionRepository.findOne({
        where: { id: requestId },
        relations: ['position', 'position.company', 'requestBy'],
      });

      if (!verifyPosition) {
        this.logger.warn(`Verification request with ID: ${requestId} not found`);
        return { error: true, message: 'Verification request not found.' };
      }

      // Update the status
      verifyPosition.status = status;
      await this.verifyPositionRepository.save(verifyPosition);
      this.logger.log(`Verification status for request ID: ${requestId} updated to ${status}`);

      let messageData;
      const firstName: string = verifyPosition?.requestBy?.full_name?.split(' ')[0];

      if (status === 'Approved') {
        this.logger.log(`Sending approval email to ${verifyPosition?.requestBy?.email}`);
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
        this.logger.log(`Sending rejection email to ${verifyPosition?.requestBy?.email}`);
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
      this.logger.log(
        `Verification status update email sent to ${verifyPosition?.requestBy?.email}`,
      );

      return {
        success: true,
        message: 'Verification status updated successfully.',
      };
    } catch (e) {
      this.logger.error(`Error in updating verification request status : ${e.message}`);
      return {
        error: true,
        message: 'Error in updating verification request status, try again.',
      };
    }
  }

  async getAllRequests(userId: number): Promise<VerifyRequestsResponseDto> {
    try {
      // Awais Chnages

      // Retrieve all requests associated with the user's email
      const requests: VerifyPositionDto[] = await this.verifyPositionRepository.find({
        where: { user: { id: userId } },
        relations: ['requestBy', 'position', 'position.company', 'position.details'],
      });
      const updatedRequests: ExtendedVerifyPositionDto[] = requests.map((request) => {
        const completionPercentage =
          request.position && request.position.details
            ? this.sharedService.calculateCompletionPercentage(request.position)
            : 0.0;

        const isCompleted = completionPercentage === 100.0;

        const updatedPosition = {
          ...request.position,
          is_completed: isCompleted,
          completion_percentage: completionPercentage,
        };

        return {
          ...request,
          position: updatedPosition,
        };
      });

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

  async updateUserIdInRequest(
    userId: number,
    requstToken: string,
  ): Promise<{ error: boolean; message: string }> {
    try {
      this.logger.log(`Attempting to update user_id for request with token: ${requstToken}`);

      const verifyPosition: VerifyPosition = await this.verifyPositionRepository.findOne({
        where: { unique_token: requstToken },
      });

      if (!verifyPosition) {
        this.logger.warn(`Verification request not found for token: ${requstToken}`);
        return {
          error: true,
          message: 'Verification request not found.',
        };
      }

      const user: UserAccounts = await this.userRepository.findOne({ where: { id: userId } });

      if (verifyPosition && verifyPosition.user == null) {
        this.logger.log(
          `Assigning user ID: ${userId} to the verification request with token: ${requstToken}`,
        );
        verifyPosition.user = user;
        await this.verifyPositionRepository.save(verifyPosition);
        this.logger.log(
          `User ID: ${userId} successfully updated in the verification request with token: ${requstToken}`,
        );
      }

      return {
        error: false,
        message: 'User_id updated successfully in verify request.',
      };
    } catch (e) {
      this.logger.error(
        `Error updating user_id in verify request with token: ${requstToken}: ${e.message}`,
      );
      return {
        error: true,
        message: 'Not able to update user_id in verify request.',
      };
    }
  }

  async deleteVerificationRequest(
    requestId: number,
  ): Promise<{ error: boolean; message: string } | void> {
    try {
      this.logger.log(`Attempting to delete verification request with ID: ${requestId}`);

      const request: VerifyPosition = await this.verifyPositionRepository.findOne({
        where: { id: requestId },
      });

      if (!request) {
        this.logger.warn(`Verification request with ID: ${requestId} not found.`);
        return {
          error: true,
          message: 'Request not found.',
        };
      }

      this.logger.log(`Deleting verification request with ID: ${requestId}`);
      await this.verifyPositionRepository.delete(requestId);

      this.logger.log(`Verification request with ID: ${requestId} deleted successfully.`);
    } catch (error) {
      this.logger.error(
        `Error deleting verification request with ID: ${requestId}: ${error.message}`,
      );
    }
  }
}
