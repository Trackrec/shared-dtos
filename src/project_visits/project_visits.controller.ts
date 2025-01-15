import { Controller, Post, Get, Body, Param, Req, Logger } from '@nestjs/common';
import { ProjectVisitorsService } from './project_visits.service';
import {
  ProjectVisitorsDto,
  CreateProjectVisitorRequestDto,
  CreateProjectVisitorResponseDto,
  ProjectVisitorParamDto,
  ProjectVisitorsCountResponseDto,
} from 'src/shared-dtos/src/recruiter_project.dto';
import {
  createProjectVisitorRequestSchema,
  projectVisitorParamSchema,
} from 'src/validations/recruiter_project.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';

@Controller('project-visitor')
export class ProjectVisitorsController {
  private readonly logger = new Logger(ProjectVisitorsController.name);

  constructor(private readonly projectVisitorssService: ProjectVisitorsService) {}

  @Post()
  async createProjectVisitor(
    @Body(new ZodValidationPipe(createProjectVisitorRequestSchema))
    projectVisitorsData: CreateProjectVisitorRequestDto,
    @Req() req: Request,
  ): Promise<CreateProjectVisitorResponseDto> {
    const userId: number = req['user_id'];
    this.logger.log(`Attempting to create a project visitor for user ID: ${userId}`);

    try {
      const visitor: ProjectVisitorsDto = await this.projectVisitorssService.create(
        projectVisitorsData,
        userId,
      );

      return { error: false, position: visitor };
    } catch (error) {
      this.logger.error(
        `Error creating project visitor for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: error.message };
    }
  }

  @Get(':projectId')
  async getProjectVisitors(
    @Param(new ZodValidationPipe(projectVisitorParamSchema)) param: ProjectVisitorParamDto,
  ): Promise<ProjectVisitorsCountResponseDto> {
    const { projectId } = param;
    this.logger.log(`Fetching visitors count for project ID: ${projectId}`);

    try {
      const visitorsCount: number =
        await this.projectVisitorssService.getProjectVisitors(projectId);

      return { error: false, data: visitorsCount };
    } catch (error) {
      this.logger.error(
        `Error fetching visitors for project ID: ${projectId} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: error.message };
    }
  }
}
