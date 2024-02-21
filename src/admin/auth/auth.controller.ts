// user.controller.ts
import { Controller, Post, Get, Body } from '@nestjs/common';
import { AdminAuthService } from './auth.service';
@Controller()
export class AdminAuthController {
  constructor(private readonly userService: AdminAuthService) {}

  @Get('admin/create-admin-user')
  async createAdminUser(): Promise<string> {
      return await this.userService.createAdminUser();
  }

  @Post('login')
  async loginUser(@Body('email') email: string, @Body('password') password: string): Promise<string | { message: string }> {
    return await this.userService.loginUser(email, password);
  }

  @Post('create-user')
  async createUser(@Body('email') email: string, @Body('full_name') full_name:string, @Body('password') password: string){
    return await this.userService.createUser(email, full_name, password)
  }

  @Post('change-password')
  async changePassword(
    @Body('email') email: string,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ): Promise<any> {
    return await this.userService.changePassword(email, oldPassword, newPassword);
  }
}
