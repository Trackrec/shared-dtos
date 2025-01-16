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
    async createUser(@Body(new ZodValidationPipe(inviteUserRequestSchema)) inviteUserRequest: InviteUserRequestDto, @Req() req: Request): Promise<Promise<{error: boolean, message: string}>>{
    const user_id: number= req['user_id']
    const { email, full_name, role } = inviteUserRequest;
    return await this.authService.createUser(email, full_name, role, user_id)
  }

    @Put('update-user/:id')
     async updateUser(
         @Param(new ZodValidationPipe(recruiterUserParamSchema)) param: RecruiterUserParamDto,
         @Body(new ZodValidationPipe(updateRecruiterUserSchema)) inviteUserRequest: InviteUserRequestDto,
         @Req() req: Request
         ): Promise<{error: boolean, message: string}> {
          const user_id: number = req['user_id'];
          const {id}= param;
          const { email, full_name, role } = inviteUserRequest;

          return await this.authService.updateCompanyUser(id, email, full_name, role, user_id);
      }


      
    @Post('register')
    async registerUser(@Body(new ZodValidationPipe(recruiterUserAuthRequestSchema)) body: RecruiterUserAuthRequestDto): Promise<RecruiterUserAuthResponseDto> {
      const { email, password, first_name, last_name }: RecruiterUserAuthRequestDto = body;
  
      // Validate required fields
      if (!email || !password || !first_name || !last_name) {
        return { error: true, message: 'All fields (email, password, first_name, last_name) are required.' };
      }
  
      try {
        return await this.authService.registerUser(email, password, first_name, last_name);
      } catch (error) {
        return { error: true, message: 'An unexpected error occurred.' };
      }
    }
    
    @Post('login')
    async loginUser(@Body(new ZodValidationPipe(loginRecruiterUserRequestSchema)) body: Partial<RecruiterUserAuthRequestDto>): Promise<RecruiterUserAuthResponseDto> {
      const { email, password } : Partial<RecruiterUserAuthRequestDto>= body;
  
      if (!email || !password) {
        return { error: true, message: 'Email and password are required.' };
      }
  
      try {
        return await this.authService.loginUser(email, password);
      } catch (error) {
        return { error: true, message: 'An unexpected error occurred.' };
      }
    }

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
           }
   


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
    }
  
   
  
    @Get('me')
    async getMe(@Req() req: Request): Promise<UserInfoResponseDto> {
      const user_id: number = req['user_id'];
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
    
    @Post('change-password')
    async changePassword(
    @Req() req: Request,
    @Body(new ZodValidationPipe(changePasswordRequestSchema)) body: ChangePasswordRequestDto
  ): Promise<{error: boolean, message: string} > {
    const user_id: number=req['user_id'];
    return await this.authService.changePassword(body, user_id);
  }
  
  @Delete('delete-user/:id')
  async deleteUser(@Param(new ZodValidationPipe(recruiterUserParamSchema)) param: RecruiterUserParamDto): Promise<{ error: boolean; message: string }> {
    const {id} = param;
    return await this.authService.deleteUser(id);
  }
  

  @Post('forgot-password')
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordRequestSchema)) body: ForgotPasswordRequestDto) : Promise<{error: boolean, message: string}>{
    const {email} =body;  
    return await this.authService.sendResetEmail(email);
  }
  
  
  @Post('verify-token')
  async verifyPassword(@Body(new ZodValidationPipe(verifyTokenRequestSchema)) body: VerifyTokenRequestDto) : Promise<VerifyTokenResponse>{
    const {token} =body;  
    return await this.authService.verifyToken(token);
  }
  
  @Post('reset-password/:token')
  async resetPassword(@Param(new ZodValidationPipe(verifyTokenRequestSchema)) param: VerifyTokenRequestDto, @Body(new ZodValidationPipe(resetPasswordRequestSchema)) body: ResetPasswordRequestDto): Promise<{error: boolean, message: string}> {
    const {new_password} =body;
    const {token} =param;
    return await this.authService.resetPassword(token, new_password);
  }
   
  

  }
  