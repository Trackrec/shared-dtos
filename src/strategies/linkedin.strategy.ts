import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-linkedin-oauth2';
import { AuthService } from '../auth/auth.service';
import * as jwt from 'jsonwebtoken';
@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, 'linkedin') {
  private readonly logger = new Logger(LinkedinStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: [  'r_basicprofile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      this.logger.debug(`LinkedIn profile: ${JSON.stringify(profile)}`);

      const { id, displayName, emails, photos, _json } = profile;
      const vanityName = _json.vanityName;

      // Create user object
      const user = {
        //todo: remove linkedin id since it is not being used
        linkedinId: id,
        displayName: displayName,
        email: emails[0]?.value,
        profilePicture: photos[0]?.value,
        accessToken: accessToken,
        username: vanityName,
      };

      const createdUser = await this.authService.findOrCreate(user);
      if(!createdUser.error){
        const jwtToken = this.generateToken(createdUser.user);
        this.logger.debug(`User created: ${JSON.stringify(createdUser)}`);
  
        return done(null, { token: jwtToken });
      }
      else{
        return done(null, {token: null})
      }
      
    } catch (error) {
      this.logger.error(`Error during LinkedIn authentication: ${error.message}`, error);
      return done(done, {token:null});
    }
  }

  private generateToken(user: any): string {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn:'30d' });
  }
}
