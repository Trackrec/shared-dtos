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
    Post,
    Delete,
    ParseIntPipe,
    HttpStatus,
    UnauthorizedException,
    UseFilters,
  
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { RecruiterAuthService } from './recruiter-auth.service';
import { ChangePasswordRequestDto, ForgotPasswordRequestDto, InviteUserRequestDto, RecruiterUserAuthRequestDto, RecruiterUserAuthResponseDto, RecruiterUserParamDto, ResetPasswordRequestDto, UserInfoResponseDto, VerifyTokenRequestDto, VerifyTokenResponse } from 'src/shared-dtos/src/user.dto';
import { changePasswordRequestSchema, forgotPasswordRequestSchema, inviteUserRequestSchema, loginRecruiterUserRequestSchema, recruiterUserAuthRequestSchema, recruiterUserParamSchema, resetPasswordRequestSchema, updateRecruiterUserSchema, verifyTokenRequestSchema } from 'src/validations/user.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
import { ThrottlerGuard } from '@nestjs/throttler';

  import { Catch, ExceptionFilter, ArgumentsHost, Injectable } from '@nestjs/common';
  import { Response } from 'express';

// Custom Exception Filter to catch all errors globally for LinkedIn login
@Injectable()
@Catch()
export class LinkedInAuthExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    console.error('LinkedIn Auth Error:', exception);

    // Redirect to a custom error page with a meaningful message
    return response.redirect(`${process.env.REACT_APP_URL}/recruiter/login`);
  }
}


@Injectable()
export class LinkedInAuthGuard extends AuthGuard('recruiter-linkedin') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('LinkedIn authentication failed');
    }
    return user;
  }
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('LinkedIn authentication failed');
    }
    return user;
  }
}
  @Controller('recruiter')
  export class RecruiterAuthController {
    private readonly logger = new Logger(RecruiterAuthController.name);
  
    constructor(private readonly authService: RecruiterAuthService) {}
    @Post('invite-user')
    async createUser(
      @Body(new ZodValidationPipe(inviteUserRequestSchema)) inviteUserRequest: InviteUserRequestDto, 
      @Req() req: Request
    ): Promise<{ error: boolean, message: string }> {
      const user_id: number = req['user_id'];
      const { email, full_name, role } = inviteUserRequest;
      
      this.logger.log(`User ${user_id} is inviting a new user with email: ${email}, full_name: ${full_name}, role: ${role}`);
      
      try {
        const result = await this.authService.createUser(email, full_name, role, user_id);
        return result;
      } catch (error) {
        this.logger.error(`Failed to invite user with email: ${email}`, error.stack);
        return { error: true, message: 'Failed to invite user.' };
      }
    }
    
    @Put('update-user/:id')
    async updateUser(
      @Param(new ZodValidationPipe(recruiterUserParamSchema)) param: RecruiterUserParamDto,
      @Body(new ZodValidationPipe(updateRecruiterUserSchema)) inviteUserRequest: InviteUserRequestDto,
      @Req() req: Request
    ): Promise<{ error: boolean, message: string }> {
      const user_id: number = req['user_id'];
      const { id } = param;
      const { email, full_name, role } = inviteUserRequest;
    
      this.logger.log(`User ${user_id} is updating user with ID: ${id}, email: ${email}, full_name: ${full_name}, role: ${role}`);
      
      try {
        const result = await this.authService.updateCompanyUser(id, email, full_name, role, user_id);
        return result;
      } catch (error) {
        this.logger.error(`Failed to update user with ID: ${id}`, error.stack);
        return { error: true, message: 'Failed to update user.' };
      }
    }
      
    @UseGuards(ThrottlerGuard)
    @Post('register')
    async registerUser(
      @Body(new ZodValidationPipe(recruiterUserAuthRequestSchema)) body: RecruiterUserAuthRequestDto
    ): Promise<RecruiterUserAuthResponseDto> {
      const { email, password, first_name, last_name } = body;
    
      this.logger.log(`Attempting to register user with email: ${email}`);
    
      if (!email || !password || !first_name || !last_name) {
        this.logger.warn(`Registration failed due to missing fields`);
        return { error: true, message: 'All fields (email, password, first_name, last_name) are required.' };
      }
    
      try {
        const result = await this.authService.registerUser(email, password, first_name, last_name);
        return result;
      } catch (error) {
        this.logger.error(`Error during registration for email: ${email}`, error.stack);
        return { error: true, message: 'An unexpected error occurred.' };
      }
    }
    
    @UseGuards(ThrottlerGuard)
    @Post('login')
    async loginUser(
      @Body(new ZodValidationPipe(loginRecruiterUserRequestSchema)) body: Partial<RecruiterUserAuthRequestDto>
    ): Promise<RecruiterUserAuthResponseDto> {
      const { email, password } = body;
    
      this.logger.log(`Attempting to log in user with email: ${email}`);
    
      if (!email || !password) {
        this.logger.warn(`Login failed due to missing credentials`);
        return { error: true, message: 'Email and password are required.' };
      }
    
      try {
        const result = await this.authService.loginUser(email, password);
        return result;
      } catch (error) {
        this.logger.error(`Login failed for email: ${email}`, error.stack);
        return { error: true, message: 'An unexpected error occurred.' };
      }
    }
    
    @UseGuards(ThrottlerGuard)
    @Get('google-auth')
    @UseGuards(GoogleAuthGuard) 
    @UseFilters(LinkedInAuthExceptionFilter)
     async googleAuth(@Req() req) {
       // Guard redirects to Google login page
     }

     @Get('google-auth/callback')
     @UseGuards(GoogleAuthGuard) 
    @UseFilters(LinkedInAuthExceptionFilter)
     googleAuthRedirect(@Req() req, @Res() res) {
        try {
            const user = req.user;
            
            if (user && user.token) {
              return res.redirect(
                `${process.env.REACT_APP_URL}/recruiter/login?token=${user.token}`,
              );
            } else {
              let redirectUrl = `${process.env.REACT_APP_URL}/recruiter/login`;

              if (user && user.error) {
               redirectUrl += `?error=${user.error}`;
               }
              return res.redirect(redirectUrl);
                        
            }
          } catch (error) {
            this.logger.error(`Error in linkedinLoginCallback: ${error.message}`);
            return res.redirect(`${process.env.REACT_APP_URL}/recruiter/login`);
          }
          return res.redirect(redirectUrl);
        }
      } catch (error) {
        this.logger.error(`Error during Google auth callback`, error.stack);
        return res.redirect(`${process.env.REACT_APP_URL}/recruiter/login`);
      }
    }
    
    @UseGuards(ThrottlerGuard)
    @Get('linkedin-auth')
    @UseGuards(LinkedInAuthGuard) 
    @UseFilters(LinkedInAuthExceptionFilter)
    linkedinLogin(@Req() req) {
      this.logger.log('LinkedIn login initiated');
    }
    
   
  
    @Get('linkedin-auth/callback')
    @UseGuards(LinkedInAuthGuard) 
    @UseFilters(LinkedInAuthExceptionFilter)
    linkedinLoginCallback(@Req() req, @Res() res) {
      try {
        const user = req['user'];
        this.logger.log(`LinkedIn login callback triggered for user: ${user?.email || 'Unknown user'}`);
    
        if (user && user.token) {
          this.logger.log(`LinkedIn login successful. Redirecting with token for user: ${user?.email}`);
          return res.redirect(`${process.env.REACT_APP_URL}/recruiter/login?token=${user.token}`);
        } else {
          let redirectUrl = `${process.env.REACT_APP_URL}/recruiter/login`;
    
          if (user && user.error) {
            this.logger.warn(`LinkedIn login failed for user. Error: ${user.error}`);
            redirectUrl += `?error=${user.error}`;
          } else {
            this.logger.warn(`LinkedIn login failed. No user data found.`);
          }
    
          return res.redirect(redirectUrl);
        }
      } catch (error) {
        this.logger.error(`Error in linkedinLoginCallback: ${error.message}`);
        return res.redirect(`${process.env.REACT_APP_URL}/recruiter/login`);
      }
    }
    
    @Get('me')
    async getMe(@Req() req: Request): Promise<UserInfoResponseDto> {
      const user_id: number = req['user_id'];
      this.logger.log(`Fetching user details for user ID: ${user_id}`);
    
      try {
        const result = await this.authService.getMe(user_id);
    
        if (result.error) {
          this.logger.warn(`Failed to fetch user details for user ID: ${user_id} - ${result.message}`);
          return { error: true, message: result.message };
        } else {
          this.logger.log(`Successfully fetched user details for user ID: ${user_id}`);
          return { error: false, userDetails: result.user };
        }
      } catch (error) {
        this.logger.error(`Error in getMe for user ID ${user_id}: ${error.message}`);
        return {
          error: true,
          message: `Error processing user details: ${error.message}`,
        };
      }
    }
    
    @Post('change-password')
    async changePassword(
      @Req() req: Request,
      @Body(new ZodValidationPipe(changePasswordRequestSchema)) body: ChangePasswordRequestDto
    ): Promise<{ error: boolean, message: string }> {
      const user_id: number = req['user_id'];
      this.logger.log(`User ID ${user_id} requested to change password`);
    
      try {
        const result = await this.authService.changePassword(body, user_id);
        return result;
      } catch (error) {
        this.logger.error(`Failed to change password for user ID ${user_id}: ${error.message}`);
        return { error: true, message: 'Failed to change password' };
      }
    }
    
    @Delete('delete-user/:id')
    async deleteUser(
      @Param(new ZodValidationPipe(recruiterUserParamSchema)) param: RecruiterUserParamDto
    ): Promise<{ error: boolean; message: string }> {
      const { id } = param;
      this.logger.log(`Request to delete user with ID: ${id}`);
    
      try {
        const result = await this.authService.deleteUser(id);
        return result;
      } catch (error) {
        this.logger.error(`Failed to delete user with ID ${id}: ${error.message}`);
        return { error: true, message: 'Failed to delete user' };
      }
    }
    
    @UseGuards(ThrottlerGuard)
    @Post('forgot-password')
    async forgotPassword(
      @Body(new ZodValidationPipe(forgotPasswordRequestSchema)) body: ForgotPasswordRequestDto
    ): Promise<{ error: boolean, message: string }> {
      const { email } = body;
      this.logger.log(`Password reset requested for email: ${email}`);
    
      try {
        const result = await this.authService.sendResetEmail(email);
        return result;
      } catch (error) {
        this.logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
        return { error: true, message: 'Failed to send reset email' };
      }
    }
    
    @Post('verify-token')
    async verifyPassword(
      @Body(new ZodValidationPipe(verifyTokenRequestSchema)) body: VerifyTokenRequestDto
    ): Promise<VerifyTokenResponse> {
      const { token } = body;
      this.logger.log(`Verifying password reset token`);
    
      try {
        const result = await this.authService.verifyToken(token);
        return result;
      } catch (error) {
        this.logger.error(`Token verification failed: ${error.message}`);
        return { error: true, message: 'Invalid or expired token' };
      }
    }
    
    @Post('reset-password/:token')
    async resetPassword(
      @Param(new ZodValidationPipe(verifyTokenRequestSchema)) param: VerifyTokenRequestDto,
      @Body(new ZodValidationPipe(resetPasswordRequestSchema)) body: ResetPasswordRequestDto
    ): Promise<{ error: boolean, message: string }> {
      const { new_password } = body;
      const { token } = param;
    
      this.logger.log(`Attempting to reset password using token`);
    
      try {
        const result = await this.authService.resetPassword(token, new_password);
        return result;
      } catch (error) {
        this.logger.error(`Password reset failed: ${error.message}`);
        return { error: true, message: 'Failed to reset password' };
      }
    }
    
  

  }
  