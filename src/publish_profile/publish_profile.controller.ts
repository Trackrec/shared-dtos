// publish-profile.controller.ts

import { Controller, Post, Param, Get, Req, Body } from '@nestjs/common';
import { PublishProfileService } from './publish-profile.service';
import { UserAccounts } from 'src/auth/User.entity';

@Controller()
export class PublishProfileController {
  constructor(private readonly publishProfileService: PublishProfileService) {}

  @Post('publish_profile/:userId')
  async publishProfile(
    @Param('userId') userId: number,
  ): Promise<{ error: boolean; message: string }> {
    const result = await this.publishProfileService.publishProfile(userId);
    return result;
  }

  @Post('public_profile/get_in_touch')
  async GetInTouchMail(
    @Body() mailData: any,
  ): Promise<{ error: boolean; message: string }> {
    const result =
      await this.publishProfileService.sendGetInTouchMail(mailData);
    return result;
  }

  @Post('private_profile/:userId')
  async privateProfile(
    @Param('userId') userId: number,
  ): Promise<{ error: boolean; message: string }> {
    const result = await this.publishProfileService.privateProfile(userId);
    return result;
  }

  @Get('p/:userId-:userName')
  async getUserProfile(
    @Param('userId') userId: number,
    @Param('userName') userName: string,
    @Req() req: Request,
  ): Promise<{ error: boolean; user?: UserAccounts; message?: string }> {
    try {
      const visitor_id = req['user_id'];
      const user = await this.publishProfileService.findUserByIdAndName(
        userId,
        userName,
        visitor_id,
      );
      return { error: false, user: user };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { error: true, message: 'User not found' };
    }
  }

  @Get('my/profile_views')
  async profileViews(@Req() req: Request) {
    try {
      const visitor_id = req['user_id'];
      return await this.publishProfileService.getProfileViews(visitor_id);
    } catch (e) {
      return { error: true, message: 'Views not found' };
    }
  }
}
