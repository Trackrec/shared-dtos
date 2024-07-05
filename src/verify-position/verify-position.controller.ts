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
@Controller('verify')
export class VerifyPositionController {
  constructor(private readonly verifyPositionService: VerifyPositionService) {}

  @Post('request_verification')
  async requestVerification(@Body() requestBody: any, @Req() req) {
    try {
      const userId = req.user_id;
      return await this.verifyPositionService.requestVerification(
        requestBody,
        userId,
      );
    } catch (error) {
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Post('resend_verification_email')
  async resendVerificationEmail(@Body() requestBody: any) {
    try {
      return await this.verifyPositionService.resendVerificationEmail(
        requestBody,
      );
    } catch (error) {
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Post('change_verification_status')
  async changeVerificationStatus(@Body() requestBody: any) {
    try {
      return await this.verifyPositionService.changeVerificationStatus(
        requestBody,
      );
    } catch (error) {
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Get('all_requests')
  async getAllRequests(@Req() req) {
    try {
      const userId = req.user_id;
      return await this.verifyPositionService.getAllRequests(userId);
    } catch (error) {
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Post('update_user_id')
  async updateUserIdInRequest(@Req() req,@Body() requestBody: any ){
    try{
      const userId = req.user_id;
      return await this.verifyPositionService.updateUserIdInRequest(userId, requestBody)
    }
    catch(error){
      return { error: true, message: 'Something went wrong please try again.' };
    }
  }

  @Delete('delete_verification/:request_id')
  async deleteVerificationRequest(@Param('request_id') request_id: string) {
    try {
      await this.verifyPositionService.deleteVerificationRequest(request_id);
      return { error: false, message: 'Request deleted successfully' };
    } catch (error) {
      return { error: true, message: 'Internal server error.' };
    }
  }
}
