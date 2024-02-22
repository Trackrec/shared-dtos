// user.controller.ts
import { Controller, Post, Get, Body, Req, Delete, Param } from '@nestjs/common';
import { AdminAuthService } from './auth.service';
import { MailgunService } from 'src/mailgun/mailgun.service';
@Controller()
export class AdminAuthController {
  constructor(private readonly userService: AdminAuthService,
    private readonly mailgunService: MailgunService) {}

  @Get('admin/create-admin-user')
  async createAdminUser(): Promise<string> {
      return await this.userService.createAdminUser();
  }

  @Get('get-my-details')
  async getUserDetails(@Req() req: Request){
    const user_id= req['user_id']
    return await this.userService.getUserDetails(user_id)
  }

  @Post('login')
  async loginUser(@Body('email') email: string, @Body('password') password: string): Promise<string | { message: string }> {
    return await this.userService.loginUser(email, password);
  }

  @Post('create-user')
  async createUser(@Body('email') email: string, @Body('full_name') full_name:string, @Body('role') role: string, @Req() req){
    const user_id= req['user_id']
    return await this.userService.createUser(email, full_name, role, user_id)
  }

  @Delete('remove-user/:id')
  remove(@Param('id') id: string,  @Req() req: Request): Promise<any> {
    const user_id = req['user_id'];
    return this.userService.remove(+id, user_id);
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
