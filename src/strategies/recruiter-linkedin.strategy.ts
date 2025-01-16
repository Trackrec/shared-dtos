import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-linkedin-oauth2';
import { RecruiterAuthService } from 'src/recruiter/recruiter-auth/recruiter-auth.service';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { VerifyPosition } from 'src/verify-position/verify-position.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RecruiterLinkedinStrategy extends PassportStrategy(Strategy, 'recruiter-linkedin') {
  private readonly logger = new Logger(RecruiterLinkedinStrategy.name);

  constructor(
    private readonly recruiterAuthService: RecruiterAuthService,
    @InjectRepository(VerifyPosition)
    private readonly verifyPostionRepository: Repository<VerifyPosition>,
  ) {
    super({
      clientID: process.env.PRIMARY_LINKEDIN_CLIENT_ID,
      clientSecret: process.env.PRIMARY_LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.PRIMARY_RECRUITER_LINKEDIN_CALLBACK_URL,
      scope: ['r_basicprofile', 'r_liteprofile', 'r_emailaddress'],
      passReqToCallback: true, // This is important to get the req in the validate method
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      displayName: string;
      emails: { value: string }[];
      photos: { value: string }[];
      _json: {
        vanityName: string;
      };
    },
    done: VerifyCallback,
  ): Promise<void> {
    try {
      this.logger.debug(`LinkedIn profile: ${JSON.stringify(profile)}`);
      const { id, displayName, emails, photos, _json: jsonData } = profile;
      const vanityName = jsonData.vanityName;

      // Create user object
      const user = {
        //todo: remove linkedin id since it is not being used
        linkedinId: id,
        displayName: displayName,
        email: emails[0]?.value,
        profilePicture: photos[0]?.value,
        accessToken: accessToken,
        username: vanityName,
        loginMethod: 'linkedin',
      };

      const createdUser = await this.recruiterAuthService.findOrCreate(user);

      if (!createdUser.error) {
        const jwtToken = this.generateToken(createdUser.user);
        this.logger.debug(`User created: ${JSON.stringify(createdUser)}`);

        return done(null, { token: jwtToken, userId: createdUser?.user?.id });
      } else {
        return done(null, { error: createdUser?.message });
      }
    } catch (error) {
      this.logger.error(`Error during LinkedIn authentication: ${error.message}`, error);
      return done(done, { token: null });
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
