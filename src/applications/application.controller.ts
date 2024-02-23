// application.controller.ts

import { Controller, Post, Body, Req, Get } from '@nestjs/common';
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
}


