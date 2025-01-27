import { Controller, Post, Param, Get, Req, Body, Logger } from '@nestjs/common';
import { PublishProfileService } from './publish-profile.service';
import {
  ExtendedUserDetailsDto,
  GetInTouchMailRequestDto,
  GetPublicProfileParamDto,
  PrivateProfileParamDto,
  ProfileViewsResponseDto,
  PublishProfileParamDto,
} from 'src/shared-dtos/src/user.dto';
import {
  getInTouchMailRequestSchema,
  getPublicProfileParamSchema,
  privateProfileParamSchema,
  publishProfileParamSchema,
} from 'src/validations/user.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';

@Controller()
export class PublishProfileController {
  private readonly logger = new Logger(PublishProfileController.name);

  constructor(private readonly publishProfileService: PublishProfileService) {}

  @Post('publish-profile/:userId')
  async publishProfile(
    @Param(new ZodValidationPipe(publishProfileParamSchema)) param: PublishProfileParamDto,
  ): Promise<{ error: boolean; message: string }> {
    const { userId } = param;
    this.logger.log(`Attempting to publish profile for user ID: ${userId}`);
    try {
      const result = await this.publishProfileService.publishProfile(userId);
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish profile for user ID: ${userId}`, error.stack);
      return { error: true, message: error.message };
    }
  }

  @Post('public-profile/get-in-touch')
  async GetInTouchMail(
    @Body(new ZodValidationPipe(getInTouchMailRequestSchema)) mailData: GetInTouchMailRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.log(`Sending 'Get In Touch' email to ${mailData.email}`);
    try {
      const result = await this.publishProfileService.sendGetInTouchMail(mailData);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send 'Get In Touch' email to ${mailData.email}`, error.stack);
      return { error: true, message: error.message };
    }
  }

  @Post('private-profile/:userId')
  async privateProfile(
    @Param(new ZodValidationPipe(privateProfileParamSchema)) param: PrivateProfileParamDto,
  ): Promise<{ error: boolean; message: string }> {
    const { userId } = param;
    this.logger.log(`Attempting to make profile private for user ID: ${userId}`);
    try {
      const result = await this.publishProfileService.privateProfile(userId);
      return result;
    } catch (error) {
      this.logger.error(`Failed to make profile private for user ID: ${userId}`, error.stack);
      return { error: true, message: error.message };
    }
  }

  @Get('p/:userName')
  async getUserProfile(
    @Param(new ZodValidationPipe(getPublicProfileParamSchema)) param: GetPublicProfileParamDto,
    @Req() req: Request,
  ): Promise<{ error: boolean; user?: ExtendedUserDetailsDto; message?: string }> {
    const visitorId: number = req['user_id'];
    const recruiterId: number = req['recruiter_id'];
    const { userName } = param;
    this.logger.log(
      `Fetching public profile for username: ${userName} by visitor ID: ${visitorId}`,
    );
    try {
      const user = await this.publishProfileService.findUserByIdAndName(
        userName,
        visitorId,
        recruiterId,
      );
      return { error: false, user };
    } catch (error) {
      this.logger.error(`Error fetching public profile for username: ${userName}`, error.stack);
      return { error: true, message: 'User not found' };
    }
  }

  @Get('my/profile-views')
  async profileViews(@Req() req: Request): Promise<ProfileViewsResponseDto> {
    const visitorId: number = req['user_id'];
    this.logger.log(`Fetching profile views for user ID: ${visitorId}`);
    try {
      const result = await this.publishProfileService.getProfileViews(visitorId);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch profile views for user ID: ${visitorId}`, error.stack);
      return { error: true, message: 'Views not found' };
    }
  }
}
