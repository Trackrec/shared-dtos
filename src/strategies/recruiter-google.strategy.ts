import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { RecruiterAuthService } from 'src/recruiter/recruiter-auth/recruiter-auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RecruiterGoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = new Logger(RecruiterGoogleStrategy.name);

    constructor(
        private readonly recruiterAuthService: RecruiterAuthService
    ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID, // Replace with your Google client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Replace with your Google client secret
      callbackURL: 'http://localhost:4000/recruiter/google-auth/callback', // Adjust callback URL as needed
      scope: ['email', 'profile'],
    });
    
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;


    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      loginMethod: "google"
    };

    const createdUser = await this.recruiterAuthService.findOrCreate(user);
    if (!createdUser.error) {
      const jwtToken = this.generateToken(createdUser.user);
      this.logger.debug(`User created: ${JSON.stringify(createdUser)}`);

      return done(null, { token: jwtToken });
    } else {
      return done(null, { token: createdUser?.message });
    }
  }

  private generateToken(user: any): string {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
  }
}
