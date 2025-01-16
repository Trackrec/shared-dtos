// application.controller.ts

import { Controller, Post, Body, Req, Get, Delete, HttpStatus, HttpCode, Param } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { MyApplicationsListDto, ProjectApplicationRequestDto } from 'src/shared-dtos/src/project_application.dto';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
import { projectApplicationRequestSchema } from 'src/validations/project_application.validaton';
import { UserParamDto } from 'src/shared-dtos/src/user.dto';
import { userParamSchema } from 'src/validations/user.validation';

@Controller('applications')
export class ProjectApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}
 

  @Post()
  async createApplication(@Body(new ZodValidationPipe(projectApplicationRequestSchema)) body:ProjectApplicationRequestDto, @Req() req: Request): Promise<{error: boolean, message: string}> {
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
    @Param(new ZodValidationPipe(userParamSchema)) param: UserParamDto,
    @Req() req: Request
  ): Promise<{error: boolean, message: string}> {
    const {userId}=param;
    const loggedInUser: number= req['user_id']
    return await this.applicationService.deleteApplicationsForUserAndCompany(userId, loggedInUser);
  }
}


