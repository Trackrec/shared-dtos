import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Logger,
  Put,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Post,
  Query,
  UseFilters,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import {
  ApplicantUserParamDto,
  GetMeResponseDto,
  UpdatePreferencesRequestDto,
} from 'src/shared-dtos/src/user.dto';
import {
  applicantUserParamSchema,
  updatePreferencesRequestSchema,
} from 'src/validations/user.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';

import { ThrottlerGuard } from '@nestjs/throttler';

import { Catch, ExceptionFilter, ArgumentsHost, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { configurations } from '../config/env.config';

const { reactAppUrl } = configurations;
// Custom Exception Filter to catch all errors globally for LinkedIn login
@Injectable()
@Catch()
export class LinkedInAuthExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    console.error('LinkedIn Auth Error:', exception);

    // Redirect to a custom error page with a meaningful message
    return response.redirect(`${reactAppUrl}/linkedin`);
  }
}

@Injectable()
export class LinkedInAuthGuard extends AuthGuard('linkedin') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('LinkedIn authentication failed');
    }
    return user;
  }
}

@Injectable()
export class LinkedInSecondaryAuthGuard extends AuthGuard('linkedinSecondary') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('LinkedIn authentication failed');
    }
    return user;
  }
}

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Get('linkedin')
  setLinkedinSession(@Query() queryParams: Record<string, string>, @Req() req, @Res() res) {
    req.session.savedQueryParams = new URLSearchParams(queryParams).toString();
    this.logger.log(`LinkedIn session value set with query params: ${JSON.stringify(queryParams)}`);
    const redirectPath = queryParams.request_token
      ? '/secondary-linkedin/set-session'
      : '/linkedin/set-session';
    return res.redirect(redirectPath);
  }

  @Get('linkedin/set-session')
  @UseGuards(LinkedInAuthGuard)
  @UseFilters(LinkedInAuthExceptionFilter)
  linkedinLogin(@Req() req) {
    this.logger.log('LinkedIn login initiated');
  }

  @Get('secondary-linkedin/set-session')
  @UseGuards(LinkedInSecondaryAuthGuard)
  @UseFilters(LinkedInAuthExceptionFilter)
  secondaryLinkedinLogin(@Req() req) {
    this.logger.log('Secondary LinkedIn login initiated');
  }

  @Get('linkedin/callback')
  @UseGuards(LinkedInAuthGuard)
  @UseFilters(LinkedInAuthExceptionFilter)
  async linkedinLoginCallback(@Req() req, @Res() res) {
    try {
      const user = req.user;
      const savedQueryParams = req.session.savedQueryParams || '';
      const topBarJobId = this.authService.getTopBarJobId(savedQueryParams);

      if (topBarJobId) {
        this.logger.log(`Redirecting LinkedIn user with job ID: ${topBarJobId}`);
        return res.redirect(
          `${reactAppUrl}/?token=${user.token}&job_apply_redirect_url=${topBarJobId}&${savedQueryParams}`,
        );
      }

      if (user && user.token) {
        this.logger.log(`Redirecting LinkedIn user with token: ${user.token}`);
        return res.redirect(`${reactAppUrl}/?token=${user.token}&${savedQueryParams}`);
      } else {
        this.logger.warn('User token missing during LinkedIn callback');
        return res.redirect(`${reactAppUrl}/linkedin?${savedQueryParams}`);
      }
    } catch (error) {
      this.logger.error(`Error in linkedinLoginCallback: ${error.message}`, error.stack);
      return res.redirect(`${reactAppUrl}/linkedin`);
    }
  }

  @Get('secondar-_linkedin/callback')
  @UseGuards(LinkedInSecondaryAuthGuard)
  @UseFilters(LinkedInAuthExceptionFilter)
  async secondaryLinkedinLoginCallback(@Req() req, @Res() res) {
    try {
      const user = req.user;
      const savedQueryParams = req.session.savedQueryParams || '';
      const topBarJobId = this.authService.getTopBarJobId(savedQueryParams);

      if (topBarJobId) {
        this.logger.log(`Redirecting secondary LinkedIn user with job ID: ${topBarJobId}`);
        return res.redirect(
          `${reactAppUrl}/?token=${user.token}&job_apply_redirect_url=${topBarJobId}&${savedQueryParams}`,
        );
      }

      if (user && user.token) {
        this.logger.log(`Redirecting secondary LinkedIn user with token: ${user.token}`);
        return res.redirect(`${reactAppUrl}/?token=${user.token}&${savedQueryParams}`);
      } else {
        this.logger.warn('User token missing during secondary LinkedIn callback');
        return res.redirect(`${reactAppUrl}/linkedin?${savedQueryParams}`);
      }
    } catch (error) {
      this.logger.error(`Error in secondaryLinkedinLoginCallback: ${error.message}`, error.stack);
      return res.redirect(`${reactAppUrl}/linkedin`);
    }
  }

  @Get('me')
  async getMe(@Req() req: Request): Promise<GetMeResponseDto> {
    const userId: number = req['user_id'];
    this.logger.debug(`getMe called for user ID: ${userId}`);

    try {
      const result: GetMeResponseDto = await this.authService.getMe(userId);

      if (result.error) {
        this.logger.warn(`Failed to fetch user data for user ID: ${userId}`);
        return { error: true, message: result.message };
      } else {
        this.logger.log(`Fetched user data successfully for user ID: ${userId}`);
        return { error: false, userDetails: result.user };
      }
    } catch (error) {
      this.logger.error(`Error in getMe for user ID: ${userId} - ${error.message}`, error.stack);
      return { error: true, message: `Error processing user details: ${error.message}` };
    }
  }

  @Put('profile/:id')
  async updateUser(
    @Param(new ZodValidationPipe(applicantUserParamSchema)) param: ApplicantUserParamDto,
    @Body(new ZodValidationPipe(updatePreferencesRequestSchema))
    updateUserPayload: UpdatePreferencesRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    const { id } = param;
    this.logger.log(`Updating user with ID: ${id}`);
    return this.authService.updateUser(id, updateUserPayload);
  }

  @Post('update-profile-picture/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateProfilePicture(
    @Param(new ZodValidationPipe(applicantUserParamSchema)) param: ApplicantUserParamDto,
    @UploadedFile() image: Multer.File,
  ): Promise<{ error: boolean; message: string }> {
    const { id } = param;
    this.logger.log(`Updating profile picture for user ID: ${id}`);
    return this.authService.updateProfilePciture(id, image.buffer);
  }

  @Put('preference/update')
  async updatePreference(
    @Body(new ZodValidationPipe(updatePreferencesRequestSchema))
    updateUserPreferencePayload: UpdatePreferencesRequestDto,
    @Req() req: Request,
  ): Promise<{ error: boolean; message: string }> {
    const userId = req['user_id'];
    this.logger.log(`Updating preferences for user ID: ${userId}`);
    return this.authService.updatepreference(userId, updateUserPreferencePayload);
  }
}
