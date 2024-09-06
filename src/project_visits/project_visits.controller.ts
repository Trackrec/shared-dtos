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

@Controller('project_visitor')
export class ProjectVisitorsController {
  constructor(
    private readonly projectVisitorssService: ProjectVisitorsService,
  ) {}

  @Post()
  async createProjectVisitor(
    @Body() projectVisitorsData: { project_id: number },
    @Req() req: any
  ) {
    try {
      const user_id=req['user_id']
      const visitor =
        await this.projectVisitorssService.create(projectVisitorsData, user_id);
      return { error: false, position: visitor };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  @Get(':projectId')
  async getProjectVisitors(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    try {
      const visitorsCount =
        await this.projectVisitorssService.getProjectVisitors(projectId);
      return { error: false, data: visitorsCount };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
}
