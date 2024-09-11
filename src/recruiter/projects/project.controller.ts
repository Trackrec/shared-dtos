// account-project.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { RecruiterProject } from './project.entity';
import { RecruiterProjectService } from './project.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
@Controller('recruiter/projects')
export class RecruiterProjectController {
  constructor(private readonly recruiterProjectService: RecruiterProjectService) {}

  @Get('check_applied')
  async checkApplied(
    @Req() req: Request,
    @Query('project_id', ParseIntPipe) projectId: number,

  ): Promise<any> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.checkApplied(+projectId, +user_id);
  }
  
  @Get('candidates')
  async getCandidates(
    @Req() req: Request,
    @Query('page') page: number = 1, // Default to page 1
    @Query('limit') limit: number = 10 // Default to 10 items per page
  ): Promise<any> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.getCandidates(+user_id, +page, +limit);
  }
  

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('page') page = 1, 
    @Query('limit') limit = 10,
    @Query('role') title?: string, // Project title
    @Query('startDate') startDate?: string,
    @Query('status') status?: 'published' | 'draft',
    @Query('ref') ref?: number // Project ID
  ): Promise<any> {
    const user_id = req['user_id'];
    const parsedStartDate = startDate ? new Date(startDate) : undefined;

    return this.recruiterProjectService.findAll(user_id, +page, +limit, title, parsedStartDate, status, ref);
  }

  @Get('/all-users')
  findAllUsersProjects(@Req() req: any): Promise<any> {
    const user_id=req['user_id']
    return this.recruiterProjectService.findAllUsersProjects(user_id);
  }

  @Get('project-view/:id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<RecruiterProject> {
    return this.recruiterProjectService.findOne(+id, true);
  }

  @Get(':id')
  findOneProject(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<RecruiterProject> {
    return this.recruiterProjectService.findOne(+id);
  }

  @Post()
  create(
    @Body() accountProjectData: Partial<RecruiterProject>,
    @Req() req: Request,
  ): Promise<any> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.create(accountProjectData, user_id);
  }

  @Post('save_and_publish')
  saveAndPublish(
    @Body() accountProjectData: RecruiterProject,
    @Req() req: Request,
  ): Promise<any> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.createAndPublish(accountProjectData, user_id);
  }

  @Post('update_and_publish/:id')
  updateAndPublish(
    @Body() accountProjectData: RecruiterProject,
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<any> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.updateAndPublish(accountProjectData, user_id, id);
  }

  @Post('/:id/publish')
  async publishProject(
    @Param('id') projectId: number,
    @Req() req: Request,
  ): Promise<any> {
    const userId = req['user_id'];
    return this.recruiterProjectService.publishProject(projectId, userId);
  }

  @Post('/:id/unpublish')
async unpublishProject(
  @Param('id') projectId: number,
  @Req() req: Request,
): Promise<any> {
  const userId = req['user_id'];
  return this.recruiterProjectService.unpublishProject(projectId, userId);
}

  @Put('/:id')
  update(
    @Param('id') id: string,
    @Body() accountProjectData: Partial<RecruiterProject>,
    @Req() req: Request,
  ): Promise<any> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.update(user_id, +id, accountProjectData);
  }

  @Delete('/:id')
  remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.remove(+id, user_id);
  }

 

  @Get('project_ranking/:id')
  async getRanking(@Param('id') project_id: number, @Req() req: Request) {
    const user_id = req['user_id'];
    return await this.recruiterProjectService.getRanking(project_id, user_id);
  }

  
  
}
