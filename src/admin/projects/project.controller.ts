// account-project.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Req } from '@nestjs/common';
import { AccountProject } from './project.entity';
import { AccountProjectService } from './project.service';
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
  findOne(@Param('id') id: string, @Req() req: Request): Promise<AccountProject> {
    return this.accountProjectService.findOne(+id);
  }

  @Post('account-projects')
  create(@Body() accountProjectData: Partial<AccountProject>, @Req() req: Request): Promise<any> {
    const user_id = req['user_id'];
    return this.accountProjectService.create(accountProjectData, user_id);
  }

  @Put('account-projects/:id')
  update(@Param('id') id: string, @Body() accountProjectData: Partial<AccountProject>, @Req() req: Request): Promise<any> {
    const user_id = req['user_id'];
    return this.accountProjectService.update(user_id,+id, accountProjectData);
  }

  @Delete('account-projects/:id')
  remove(@Param('id') id: string,  @Req() req: Request): Promise<void> {
    const user_id = req['user_id'];
    return this.accountProjectService.remove(+id, user_id);
  }
}
