import { Controller, Get, UseGuards, Req, Res, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  linkedinLogin() {
    this.logger.log('LinkedIn login initiated');
  }

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  linkedinLoginCallback(@Req() req, @Res() res) {
    try {
      const user = req.user;

      if (user && user.token) {
        res.json({ error: false, token: user.token });
      } else {
        res.json({ error: true, token: null });
      }
    } catch (error) {
      this.logger.error(`Error in linkedinLoginCallback: ${error.message}`);
      res.json({ error: true, token: null });
    }
  }

  @Get('me')
  async getMe(@Req() req) {
    const username = req['username'];
    const user_id= req['user_id']
    try {
      const result = await this.authService.getMe(username,user_id);

      if (result.error) {
        return { error: true, message: result.message };
      } else {
        return { error: false, userDetails: result.user };
      }
    } catch (error) {
      this.logger.error(`Error in getMe: ${error.message}`);
      return { error: true, message: `Error processing user details: ${error.message}` };
    }
  }
}
