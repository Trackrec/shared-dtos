import { Controller, Post, Body, Req, Get, Delete, Param, Logger } from '@nestjs/common';
import { ApplicationService } from './application.service';
import {
  MyApplicationsListDto,
  ProjectApplicationRequestDto,
} from 'src/shared-dtos/src/project_application.dto';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
import { projectApplicationRequestSchema } from 'src/validations/project_application.validaton';
import { UserParamDto } from 'src/shared-dtos/src/user.dto';
import { userParamSchema } from 'src/validations/user.validation';

@Controller('applications')
export class ProjectApplicationController {
  private readonly logger = new Logger(ProjectApplicationController.name);

  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  async createApplication(
    @Body(new ZodValidationPipe(projectApplicationRequestSchema))
    body: ProjectApplicationRequestDto,
    @Req() req: Request,
  ): Promise<{ error: boolean; message: string }> {
    const userId: number = req['user_id'];
    this.logger.log(
      `Creating application for user ID: ${userId} with payload: ${JSON.stringify(body)}`,
    );

    try {
      const result = await this.applicationService.createApplication(body, userId);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create application for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to create application' };
    }
  }

  @Get('/my')
  async getMyApplications(@Req() req: Request): Promise<MyApplicationsListDto> {
    const userId: number = req['user_id'];
    this.logger.log(`Fetching applications for user ID: ${userId}`);

    try {
      const result = await this.applicationService.getMyApplications(userId);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to fetch applications for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to fetch applications' };
    }
  }

  @Delete('delete-user-applications/:userId')
  async deleteUserApplications(
    @Param(new ZodValidationPipe(userParamSchema)) param: UserParamDto,
    @Req() req: Request,
  ): Promise<{ error: boolean; message: string }> {
    const { userId } = param;
    const loggedInUser: number = req['user_id'];
    this.logger.log(
      `Deleting applications for user ID: ${userId} by logged-in user ID: ${loggedInUser}`,
    );

    try {
      const result = await this.applicationService.deleteApplicationsForUserAndCompany(
        userId,
        loggedInUser,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to delete applications for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to delete applications' };
    }
  }
}
