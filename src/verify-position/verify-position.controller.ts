// verifyPosition.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus, Req, Get } from '@nestjs/common';
import { VerifyPositionService } from './verify-position.service';
@Controller('verify')
export class VerifyPositionController {
  constructor(private readonly verifyPositionService: VerifyPositionService) {}

  @Post('request_verification')
  async requestVerification(@Body() requestBody: any) {
    try {
      return await this.verifyPositionService.requestVerification(requestBody);
      
    } catch (error) {
        return {error: true, message: "Something went wrong please try again."}
    }
  }

  @Post('change_verification_status')
  async changeVerificationStatus(@Body() requestBody:any ){
    try{
       return await this.verifyPositionService.changeVerificationStatus(requestBody)
    }
    catch(error){
        return {error: true, message: "Something went wrong please try again."}
    }
  }

  @Get('all_requests')
  async getAllRequests(@Req() req){
    try{
        const userId=req.user_id;
        return await this.verifyPositionService.getAllRequests(userId)

    }
    catch(error){
        return {error: true, message: "Something went wrong please try again."}
    }
  }
}
