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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}
  @Get('linkedin')
  setLinkedinSession(
    @Query() queryParams: Record<string, string>,
    @Req() req,
    @Res() res,
  ) {
    req.session.savedQueryParams = new URLSearchParams(queryParams).toString();
    console.log(queryParams);
    this.logger.log('LinkedIn session value set');
    const redirectPath = queryParams.request_token
      ? '/secondary_linkedin/set-session'
      : '/linkedin/set-session';
    return res.redirect(redirectPath);
  }
  @Get('linkedin/set-session')
  @UseGuards(AuthGuard('linkedin'))
  linkedinLogin(@Req() req) {
    this.logger.log('LinkedIn login initiated');
  }

  @Get('secondary_linkedin/set-session')
  @UseGuards(AuthGuard('linkedinSecondary'))
  secondaryLinkedinLogin(@Req() req) {
    this.logger.log('LinkedIn login initiated');
  }

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinLoginCallback(@Req() req, @Res() res) {
    try {
      const user = req.user;

      // Retrieve saved query parameters from session
      const savedQueryParams = req.session.savedQueryParams || '';
      const topBarJobId = this.authService.getTopBarJobId(savedQueryParams);
      if (topBarJobId) {
        return res.redirect(
          `${process.env.REACT_APP_URL}/?token=${user.token}&job_apply_redirect_url=${topBarJobId}&${savedQueryParams}`,
        );
      }

      if (user && user.token) {
        return res.redirect(
          `${process.env.REACT_APP_URL}/?token=${user.token}&${savedQueryParams}`,
        );
      } else {
        return res.redirect(
          `${process.env.REACT_APP_URL}/linkedin?${savedQueryParams}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error in linkedinLoginCallback: ${error.message}`);
      return res.redirect(`${process.env.REACT_APP_URL}/linkedin`);
    }
  }

  @Get('secondary_linkedin/callback')
  @UseGuards(AuthGuard('linkedinSecondary'))
  async secondaryLinkedinLoginCallback(@Req() req, @Res() res) {
    try {
      const user = req.user;
      const savedQueryParams = req.session.savedQueryParams || '';
      const topBarJobId = this.authService.getTopBarJobId(savedQueryParams);
      if (topBarJobId) {
        return res.redirect(
          `${process.env.REACT_APP_URL}/?token=${user.token}&job_apply_redirect_url=${topBarJobId}&${savedQueryParams}`,
        );
      }

      if (user && user.token) {
        return res.redirect(
          `${process.env.REACT_APP_URL}/?token=${user.token}&${savedQueryParams}`,
        );
      } else {
        return res.redirect(
          `${process.env.REACT_APP_URL}/linkedin?${savedQueryParams}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error in linkedinLoginCallback: ${error.message}`);
      return res.redirect(`${process.env.REACT_APP_URL}/linkedin`);
    }
  }

  @Get('me')
  async getMe(@Req() req) {
    const user_id = req['user_id'];
    try {
      const result = await this.authService.getMe(user_id);

      if (result.error) {
        return { error: true, message: result.message };
      } else {
        return { error: false, userDetails: result.user };
      }
    } catch (error) {
      this.logger.error(`Error in getMe: ${error.message}`);
      return {
        error: true,
        message: `Error processing user details: ${error.message}`,
      };
    }
  }
  @Put('profile/:id')
  async updateUser(@Param('id') id: number, @Body() updateUserPayload: any) {
    // Pass image along with other payload data to service for update
    return this.authService.updateUser(id, updateUserPayload);
  }

  @Post('update_profile_picture/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateProfilePicture(
    @Param('id') id: number,
    @UploadedFile() image: Multer.File,
  ) {
    // Pass image along with other payload data to service for update
    return this.authService.updateProfilePciture(id, image.buffer);
  }

  @Put('preference/update')
  async updatePreference(@Body() updateUserPreferencePayload: any, @Req() req) {
    const user_id = req['user_id'];
    console.log(updateUserPreferencePayload);
    return this.authService.updatepreference(
      user_id,
      updateUserPreferencePayload,
    );
  }
}
