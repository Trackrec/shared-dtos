// super-admin.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
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


}
