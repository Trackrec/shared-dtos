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
  
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { RecruiterAuthService } from './recruiter-auth.service';
  @Controller('recruiter')
  export class RecruiterAuthController {
    private readonly logger = new Logger(RecruiterAuthController.name);
  
    constructor(private readonly authService: RecruiterAuthService) {}
    
    @Post('invite-user')
    async createUser(@Body('email') email: string, @Body('full_name') full_name:string, @Body('role') role: string, @Req() req){
    const user_id= req['user_id']
    return await this.authService.createUser(email, full_name, role, user_id)
  }


    @Post('register')
    async registerUser(@Body() body: any): Promise<any> {
      const { email, password, first_name, last_name } = body;
  
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
    async loginUser(@Body() body: any): Promise<any> {
      const { email, password } = body;
  
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
     async googleAuth(@Req() req) {
       // Guard redirects to Google login page
     }

     @Get('google-auth/callback')
     @UseGuards(AuthGuard('google'))
     googleAuthRedirect(@Req() req, @Res() res) {
        try {
            const user = req.user;
      
            if (user && user.token) {
              return res.redirect(
                `${process.env.REACT_APP_URL}/recruiter/?token=${user.token}`,
              );
            } else {
              return res.redirect(`${process.env.REACT_APP_URL}/linkedin`);
            }
          } catch (error) {
            this.logger.error(`Error in linkedinLoginCallback: ${error.message}`);
            return res.redirect(`${process.env.REACT_APP_URL}/linkedin`);
          }
           }
   


    @Get('linkedin-auth')
    @UseGuards(AuthGuard('recruiter-linkedin'))
    linkedinLogin(@Req() req) {
      this.logger.log('LinkedIn login initiated');
    }
  
   
  
    @Get('linkedin-auth/callback')
    @UseGuards(AuthGuard('recruiter-linkedin'))
    linkedinLoginCallback(@Req() req, @Res() res) {
      try {
        const user = req.user;
  
        if (user && user.token) {
          return res.redirect(
            `${process.env.REACT_APP_URL}/recruiter/?token=${user.token}`,
          );
        } else {
          return res.redirect(`${process.env.REACT_APP_URL}/linkedin`);
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

    @Post('change-password')
    async changePassword(
    @Req() req,
    @Body() body: any
  ): Promise<any> {
    const user_id=req['user_id'];
    return await this.authService.changePassword(body, user_id);
  }
  
   
  

  }
  