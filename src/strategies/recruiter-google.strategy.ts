import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { RecruiterAuthService } from 'src/recruiter/recruiter-auth/recruiter-auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RecruiterGoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(RecruiterGoogleStrategy.name);

  constructor(private readonly recruiterAuthService: RecruiterAuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID, // Replace with your Google client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Replace with your Google client secret
      callbackURL: process.env.PRIMARY_RECRUITER_GOOGLE_CALLBACK_URL, // Adjust callback URL as needed
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      name: { givenName: string; familyName: string };
      emails: { value: string }[];
      photos: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    const { name, emails, photos } = profile;

    const user = {
      email: emails[0].value,
      displayName: `${name.givenName} ${name.familyName}`,
      picture: photos[0].value,
      accessToken,
      loginMethod: 'google',
    };

    const createdUser = await this.recruiterAuthService.findOrCreate(user);
    if (!createdUser.error) {
      const jwtToken = this.generateToken(createdUser.user);
      this.logger.debug(`User created: ${JSON.stringify(createdUser)}`);

      return done(null, { token: jwtToken, userId: createdUser?.user?.id });
    } else {
      return done(null, { error: createdUser?.message });
    }
  }

  private generateToken(user: { id: number; email: string; username: string }): string {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
  }
}
