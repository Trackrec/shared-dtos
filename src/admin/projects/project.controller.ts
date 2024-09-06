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
import { AccountProject } from './project.entity';
import { AccountProjectService } from './project.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
@Controller()
export class AccountProjectController {
  constructor(private readonly accountProjectService: AccountProjectService) {}

  @Get('account-projects')
  findAll(@Req() req: Request): Promise<any> {
    const user_id = req['user_id'];
    return this.accountProjectService.findAll(user_id);
  }

  @Get('account-projects/all-users')
  findAllUsersProjects(@Req() req: Request): Promise<any> {
    return this.accountProjectService.findAllUsersProjects();
  }

  @Get('project-view/:id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<AccountProject> {
    return this.accountProjectService.findOne(+id);
  }

  @Post('account-projects')
  create(
    @Body() accountProjectData: Partial<AccountProject>,
    @Req() req: Request,
  ): Promise<any> {
    const user_id = req['user_id'];
    return this.accountProjectService.create(accountProjectData, user_id);
  }

  @Post('account-projects/:id/publish')
  async publishProject(
    @Param('id') projectId: number,
    @Req() req: Request,
  ): Promise<any> {
    const userId = req['user_id'];
    return this.accountProjectService.publishProject(projectId, userId);
  }

  @Put('account-projects/:id')
  update(
    @Param('id') id: string,
    @Body() accountProjectData: Partial<AccountProject>,
    @Req() req: Request,
  ): Promise<any> {
    const user_id = req['user_id'];
    return this.accountProjectService.update(user_id, +id, accountProjectData);
  }

  @Delete('account-projects/:id')
  remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const user_id = req['user_id'];
    return this.accountProjectService.remove(+id, user_id);
  }

  @Post('update_project_picture/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateProfilePicture(
    @Param('id') id: number,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ) {
    const user_id = req['user_id'];
    if (!image) {
      return { error: true, message: 'Please upload image first.' };
    }
    return this.accountProjectService.updateProjectPicture(
      id,
      image.buffer,
      user_id,
    );
  }

  @Get('project_ranking/:id')
  async getRanking(@Param('id') project_id: number, @Req() req: Request) {
    const user_id = req['user_id'];
    return await this.accountProjectService.getRanking(project_id, user_id);
  }

  @Get('account-projects/check_applied')
  async checkApplied(
    @Query('project_id', ParseIntPipe) projectId: number,
    @Query('user_id', ParseIntPipe) userId: string,
  ): Promise<any> {
    return this.accountProjectService.checkApplied(+projectId, +userId);
  }
}
