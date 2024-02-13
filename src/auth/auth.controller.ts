import { Controller, Get, UseGuards, Req, Res, Logger, Put, Body, Param } from '@nestjs/common';
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
        return res.redirect(`http://localhost:3000/?token=${user.token}`);
      } else {
        return res.redirect('http://localhost:3000/linkedin');
      }
    } catch (error) {
      this.logger.error(`Error in linkedinLoginCallback: ${error.message}`);
      return res.redirect('http://localhost:3000/linkedin');
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

  @Put('profile/:id')
  async updateUser(@Param('id') id: number, @Body() updateUserPayload: any) {
    return this.authService.updateUser(id, updateUserPayload);
  }
}
