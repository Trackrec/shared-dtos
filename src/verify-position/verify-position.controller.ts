// verifyPosition.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Req,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { VerifyPositionService } from './verify-position.service';
import { ChangeVerificationRequestDto, DeleteVerificationDto, ResendPositionVerificationEmailRequestDto, UpdateUserIdRequestDto, VerifyPositionRequestDto, VerifyRequestsResponseDto } from 'src/shared-dtos/src/Position.dto';
import { changeVerificationRequestSchema, deleteVerificationSchema, resendPositionVerificationEmailRequestSchema, updateUserIdRequestSchema, verifyPositionRequestSchema } from 'src/validations/position.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
@Controller('verify')
export class VerifyPositionController {
  constructor(private readonly verifyPositionService: VerifyPositionService) {}
  
  @Post('request_verification')
  async requestVerification(@Body(new ZodValidationPipe(verifyPositionRequestSchema)) requestBody: VerifyPositionRequestDto, @Req() req: Request): Promise<{error: boolean, message: string}>  {
    try {
      const userId: number = req['user_id'];
      return await this.verifyPositionService.requestVerification(
        requestBody,
        userId,
      );
    } catch (error) {
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Post('resend_verification_email')
  async resendVerificationEmail(@Body(new ZodValidationPipe(resendPositionVerificationEmailRequestSchema)) body: ResendPositionVerificationEmailRequestDto): Promise<{error: boolean, message: string}> {
    try {
      const {requestId} = body;
      return await this.verifyPositionService.resendVerificationEmail(
        requestId,
      );
    } catch (error) {
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }
  
  @Post('change_verification_status')
  async changeVerificationStatus(@Body(new ZodValidationPipe(changeVerificationRequestSchema)) requestBody: ChangeVerificationRequestDto): Promise<{error?: boolean, message: string, success?: boolean}> {
    try {
      return await this.verifyPositionService.changeVerificationStatus(
        requestBody,
      );
    } catch (error) {
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Get('all_requests')
  async getAllRequests(@Req() req: Request): Promise<VerifyRequestsResponseDto> {
    try {
      const userId: number = req['user_id'];
      return await this.verifyPositionService.getAllRequests(userId);
    } catch (error) {
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }
  
  @Post('update_user_id')
  async updateUserIdInRequest(@Req() req: Request,@Body(new ZodValidationPipe(updateUserIdRequestSchema)) body: UpdateUserIdRequestDto ): Promise<{error: boolean; message: string}>{
    try{
      const userId : number = req['user_id'];
      const {request_token}=body;
      return await this.verifyPositionService.updateUserIdInRequest(userId, request_token)
    }
    catch(error){
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }
  
  @Delete('delete_verification/:request_id')
  async deleteVerificationRequest(@Param(new ZodValidationPipe(deleteVerificationSchema)) param: DeleteVerificationDto): Promise<{error: boolean, message : string} | void> {
    try {
      const {request_id} = param;
      await this.verifyPositionService.deleteVerificationRequest(request_id);
      return { error: false, message: 'Request deleted successfully' };
    } catch (error) {
      return { error: true, message: 'Internal server error.' };
    }
  }
}
