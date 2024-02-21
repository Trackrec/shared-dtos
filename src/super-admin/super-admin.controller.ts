// super-admin.controller.ts
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';

@Controller()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('get_all_users')
  getAllUsers() {
    return this.superAdminService.getAllUsers();
  }

  @Get('get_user_details/:userId')
  getUserDetails(@Param('userId') userId: number) {
    return this.superAdminService.getUserDetails(userId);
  }

  @Get('get_all_companies')
  getAllCompanies(){
    return this.superAdminService.getAllCompanies()
  }

  @Post('update_block_user_status')
  blockUser(@Req() req: Request, @Body() body: any) {
    return this.superAdminService.updateBlockStatus(body);
  }

  @Post('impersonate_user')
  impersonateUser(@Req() req: Request, @Body() body: any) {
    return this.superAdminService.impersonateUser(body);
  }

}
