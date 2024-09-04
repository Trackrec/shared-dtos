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

  @Get('')
  findAll(@Req() req: Request): Promise<any> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.findAll(user_id);
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

  @Post('')
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

  @Get('/check_applied')
  async checkApplied(
    @Query('project_id', ParseIntPipe) projectId: number,
    @Query('user_id', ParseIntPipe) userId: string,
  ): Promise<any> {
    return this.recruiterProjectService.checkApplied(+projectId, +userId);
  }
}
