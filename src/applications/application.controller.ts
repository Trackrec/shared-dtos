// application.controller.ts

import { Controller, Post, Body, Req, Get, Delete, HttpStatus, HttpCode, Param } from '@nestjs/common';
import { ApplicationService } from './application.service';

@Controller('applications')
export class ProjectApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  async createApplication(@Body() body:any, @Req() req: Request) {
    const user_id=req['user_id']
    return await this.applicationService.createApplication(body, user_id);
  }

  @Get('/my')
  async getMyApplications(@Req() req: Request){
    const user_id= req['user_id']
    return await this.applicationService.getMyApplications(user_id)
  }

  @Delete('delete-user-applications/:userId/:companyId')
  async deleteUserApplications(
    @Param('userId') userId: number,
    @Req() req: Request
  ): Promise<void> {
    const loggedInUser= req['user_id']
    return await this.applicationService.deleteApplicationsForUserAndCompany(userId, loggedInUser);
  }
}


