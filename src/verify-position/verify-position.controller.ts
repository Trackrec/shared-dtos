import { Controller, Post, Body, Req, Get, Delete, Param, Logger } from '@nestjs/common';
import { VerifyPositionService } from './verify-position.service';
import {
  ChangeVerificationRequestDto,
  DeleteVerificationDto,
  ResendPositionVerificationEmailRequestDto,
  UpdateUserIdRequestDto,
  VerifyPositionRequestDto,
  VerifyRequestsResponseDto,
} from 'src/shared-dtos/src/Position.dto';
import {
  changeVerificationRequestSchema,
  deleteVerificationSchema,
  resendPositionVerificationEmailRequestSchema,
  updateUserIdRequestSchema,
  verifyPositionRequestSchema,
} from 'src/validations/position.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
@Controller('verify')
export class VerifyPositionController {
  private readonly logger = new Logger(VerifyPositionController.name);

  constructor(private readonly verifyPositionService: VerifyPositionService) {}

  @Post('request-verification')
  async requestVerification(
    @Body(new ZodValidationPipe(verifyPositionRequestSchema)) requestBody: VerifyPositionRequestDto,
    @Req() req: Request,
  ): Promise<{ error: boolean; message: string }> {
    try {
      const userId: number = req['user_id'];
      this.logger.log(`User ID: ${userId} is requesting position verification`);
      return await this.verifyPositionService.requestVerification(requestBody, userId);
    } catch (error) {
      this.logger.error(`Error in request_verification: ${error.message}`);
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(
    @Body(new ZodValidationPipe(resendPositionVerificationEmailRequestSchema))
    body: ResendPositionVerificationEmailRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    try {
      const { requestId } = body;
      this.logger.log(`Resending verification email for request ID: ${requestId}`);
      return await this.verifyPositionService.resendVerificationEmail(requestId);
    } catch (error) {
      this.logger.error(`Error in resend_verification_email: ${error.message}`);
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Post('change-verification-status')
  async changeVerificationStatus(
    @Body(new ZodValidationPipe(changeVerificationRequestSchema))
    requestBody: ChangeVerificationRequestDto,
  ): Promise<{ error?: boolean; message: string; success?: boolean }> {
    try {
      this.logger.log('Changing verification status');
      return await this.verifyPositionService.changeVerificationStatus(requestBody);
    } catch (error) {
      this.logger.error(`Error in change_verification_status: ${error.message}`);
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Get('all-requests')
  async getAllRequests(@Req() req: Request): Promise<VerifyRequestsResponseDto> {
    try {
      const userId: number = req['user_id'];
      this.logger.log(`Fetching all verification requests for user ID: ${userId}`);
      return await this.verifyPositionService.getAllRequests(userId);
    } catch (error) {
      this.logger.error(`Error in getAllRequests: ${error.message}`);
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Post('update-user-id')
  async updateUserIdInRequest(
    @Req() req: Request,
    @Body(new ZodValidationPipe(updateUserIdRequestSchema)) body: UpdateUserIdRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    try {
      const userId: number = req['user_id'];
      const { request_token: requesToken } = body;
      this.logger.log(`Updating user ID for request token: ${requesToken}`);
      return await this.verifyPositionService.updateUserIdInRequest(userId, requesToken);
    } catch (error) {
      this.logger.error(`Error in updateUserIdInRequest: ${error.message}`);
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Delete('delete-verification/:request_id')
  async deleteVerificationRequest(
    @Param(new ZodValidationPipe(deleteVerificationSchema)) param: DeleteVerificationDto,
  ): Promise<{ error: boolean; message: string } | void> {
    try {
      const { request_id: requestId } = param;
      this.logger.log(`Deleting verification request with ID: ${requestId}`);
      await this.verifyPositionService.deleteVerificationRequest(requestId);
      this.logger.log(`Verification request with ID: ${requestId} deleted successfully`);
      return { error: false, message: 'Request deleted successfully' };
    } catch (error) {
      this.logger.error(`Error in deleteVerificationRequest: ${error.message}`);
      return { error: true, message: 'Internal server error.' };
    }
  }
}
