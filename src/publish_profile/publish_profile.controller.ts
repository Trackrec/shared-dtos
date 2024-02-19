// publish-profile.controller.ts

import { Controller, Post, Param, Get } from '@nestjs/common';
import { PublishProfileService } from './publish-profile.service';
import { UserAccounts } from 'src/auth/User.entity';

@Controller()
export class PublishProfileController {
  constructor(private readonly publishProfileService: PublishProfileService) {}

  @Post('publish_profile/:userId')
  async publishProfile(@Param('userId') userId: number): Promise<{ error: boolean, message: string }> {
    const result = await this.publishProfileService.publishProfile(userId);
    return result;
  }

  @Get('p/:userId-:userName')
  async getUserProfile(@Param('userId') userId: number, @Param('userName') userName: string): Promise<{ error: boolean, user?: UserAccounts, message?: string }> {
    try {
      const user = await this.publishProfileService.findUserByIdAndName(userId, userName);
      return { error: false, user: user };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { error: true, message: 'User not found' };
    }
  }
}
