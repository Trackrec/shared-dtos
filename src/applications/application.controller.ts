// application.controller.ts

import { Controller, Post, Body, Req, Get, Delete, HttpStatus, HttpCode, Param } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { MyApplicationsListDto, ProjectApplicationRequestDto } from 'src/shared-dtos/src/project_application.dto';

@Controller('applications')
export class ProjectApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  async createApplication(@Body() body:ProjectApplicationRequestDto, @Req() req: Request): Promise<{error: boolean, message: string}> {
    const user_id: number=req['user_id']
    return await this.applicationService.createApplication(body, user_id);
  }

  @Get('/my')
  async getMyApplications(@Req() req: Request): Promise<MyApplicationsListDto>{
    const user_id: number= req['user_id']
    return await this.applicationService.getMyApplications(user_id)
  }

  @Delete('delete-user-applications/:userId')
  async deleteUserApplications(
    @Param('userId') userId: number,
    @Req() req: Request
  ): Promise<{error: boolean, message: string}> {
    const loggedInUser: number= req['user_id']
    return await this.applicationService.deleteApplicationsForUserAndCompany(userId, loggedInUser);
  }
}


