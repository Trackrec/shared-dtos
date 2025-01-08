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
  
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { RecruiterAuthService } from './recruiter-auth.service';
import { ChangePasswordRequestDto, InviteUserRequestDto, RecruiterUserAuthRequestDto, RecruiterUserAuthResponseDto, UserInfoResponseDto, VerifyTokenResponse } from 'src/shared-dtos/src/user.dto';
  @Controller('recruiter')
  export class RecruiterAuthController {
    private readonly logger = new Logger(RecruiterAuthController.name);
  
    constructor(private readonly authService: RecruiterAuthService) {}
    
    @Post('invite-user')
    async createUser(@Body() inviteUserRequest: InviteUserRequestDto, @Req() req: Request): Promise<Promise<{error: boolean, message: string}>>{
    const user_id: number= req['user_id']
    const { email, full_name, role } = inviteUserRequest;
    return await this.authService.createUser(email, full_name, role, user_id)
  }

    @Put('update-user/:id')
     async updateUser(
         @Param('id') id: number,
         @Body() inviteUserRequest: InviteUserRequestDto,
         @Req() req: Request
         ): Promise<{error: boolean, message: string}> {
          const user_id: number = req['user_id'];
          const { email, full_name, role } = inviteUserRequest;

          return await this.authService.updateCompanyUser(id, email, full_name, role, user_id);
      }



    @Post('register')
    async registerUser(@Body() body: RecruiterUserAuthRequestDto): Promise<RecruiterUserAuthResponseDto> {
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
    async loginUser(@Body() body: Partial<RecruiterUserAuthRequestDto>): Promise<RecruiterUserAuthResponseDto> {
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
    @UseGuards(AuthGuard('google'))
     async googleAuth() {
       // Guard redirects to Google login page
     }

     @Get('google-auth/callback')
     @UseGuards(AuthGuard('google'))
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
    @UseGuards(AuthGuard('recruiter-linkedin'))
    linkedinLogin() {
      this.logger.log('LinkedIn login initiated');
    }
  
   
  
    @Get('linkedin-auth/callback')
    @UseGuards(AuthGuard('recruiter-linkedin'))
    linkedinLoginCallback(@Req() req: Request, @Res() res) {
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
    @Body() body: ChangePasswordRequestDto
  ): Promise<{error: boolean, message: string} > {
    const user_id: number=req['user_id'];
    return await this.authService.changePassword(body, user_id);
  }

  @Delete('delete-user/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<{ error: boolean; message: string }> {
    return await this.authService.deleteUser(id);
  }
  

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) : Promise<{error: boolean, message: string}>{
      return await this.authService.sendResetEmail(email);
  }
  
  @Post('verify-token')
  async verifyPassword(@Body('token') token: string) : Promise<VerifyTokenResponse>{
      return await this.authService.verifyToken(token);
  }

  @Post('reset-password/:token')
  async resetPassword(@Param('token') token: string, @Body('new_password') new_password: string): Promise<{error: boolean, message: string}> {
    return await this.authService.resetPassword(token, new_password);
  }
   
  

  }
  