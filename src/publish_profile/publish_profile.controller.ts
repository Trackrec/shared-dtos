// publish-profile.controller.ts

import { Controller, Post, Param, Get, Req, Body } from '@nestjs/common';
import { PublishProfileService } from './publish-profile.service';
import { UserAccounts } from 'src/auth/User.entity';
import { ExtendedUserDetailsDto, GetInTouchMailRequestDto, GetPublicProfileParamDto, PrivateProfileParamDto, ProfileViewsResponseDto, PublishProfileParamDto, UserDto } from 'src/shared-dtos/src/user.dto';
import { getInTouchMailRequestSchema, getPublicProfileParamSchema, privateProfileParamSchema, publishProfileParamSchema } from 'src/validations/user.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';

@Controller()
export class PublishProfileController {
  constructor(private readonly publishProfileService: PublishProfileService) {}

  @Post('publish_profile/:userId')
  async publishProfile(
    @Param(new ZodValidationPipe(publishProfileParamSchema)) param: PublishProfileParamDto,
  ): Promise<{ error: boolean; message: string }> {
    const { userId } =param;
    const result: { error: boolean; message: string } = await this.publishProfileService.publishProfile(userId);
    return result;
  }
  
  @Post('public_profile/get_in_touch')
  async GetInTouchMail(
    @Body(new ZodValidationPipe(getInTouchMailRequestSchema)) mailData: GetInTouchMailRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    const result =
      await this.publishProfileService.sendGetInTouchMail(mailData);
    return result;
  }

  @Post('private_profile/:userId')
  async privateProfile(
    @Param(new ZodValidationPipe(privateProfileParamSchema)) param: PrivateProfileParamDto,
  ): Promise<{ error: boolean; message: string }> {
    const { userId } = param;
    const result = await this.publishProfileService.privateProfile(userId);
    return result;
  }

  @Get('p/:userName')
  async getUserProfile(
    @Param(new ZodValidationPipe(getPublicProfileParamSchema)) param: GetPublicProfileParamDto,
    @Req() req: Request,
  ): Promise<{ error: boolean; user?: ExtendedUserDetailsDto; message?: string }> {
    try {
      const visitor_id: number = req['user_id'];
      const { userName } = param;
      const user = await this.publishProfileService.findUserByIdAndName(
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
  async profileViews(@Req() req: Request): Promise<ProfileViewsResponseDto> {
    try {
      const visitor_id: number = req['user_id'];
      return await this.publishProfileService.getProfileViews(visitor_id);
    } catch (e) {
      return { error: true, message: 'Views not found' };
    }
  }
}
