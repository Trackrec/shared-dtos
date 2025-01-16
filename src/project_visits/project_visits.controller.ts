import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ProjectVisitorsService } from './project_visits.service';
import { ProjectVisitors } from './project_visits.entity';
import { CreateProjectVisitorRequestDto, CreateProjectVisitorResponseDto, ProjectVisitorsCountResponseDto, ProjectVisitorsDto } from 'src/shared-dtos/src/recruiter_project.dto';

@Controller('project_visitor')
export class ProjectVisitorsController {
  constructor(
    private readonly projectVisitorssService: ProjectVisitorsService,
  ) {}

  @Post()
  async createProjectVisitor(
    @Body() projectVisitorsData: CreateProjectVisitorRequestDto,
    @Req() req: Request
  ) : Promise<CreateProjectVisitorResponseDto> {
    try {
      const user_id: number=req['user_id']
      const visitor: ProjectVisitorsDto =
        await this.projectVisitorssService.create(projectVisitorsData, user_id);
      return { error: false, position: visitor };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  @Get(':projectId')
  async getProjectVisitors(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ProjectVisitorsCountResponseDto> {
    try {
      const visitorsCount: number =
        await this.projectVisitorssService.getProjectVisitors(projectId);
      return { error: false, data: visitorsCount };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
}
