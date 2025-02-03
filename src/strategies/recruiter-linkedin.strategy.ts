import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy } from 'passport-linkedin-oauth2';
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
    private readonly verifyPositionRepository: Repository<VerifyPosition>,
  ) {
    super({
      clientID: process.env.PRIMARY_LINKEDIN_CLIENT_ID,
      clientSecret: process.env.PRIMARY_LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.PRIMARY_RECRUITER_LINKEDIN_CALLBACK_URL,
      scope: ['openid', 'profile', 'email'],
      state: true,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      this.logger.debug(`LinkedIn profile: ${JSON.stringify(profile)}`);
      
      // Handle new OpenID profile structure
      const { sub, name, email, picture } = profile;

      if (!email) {
        this.logger.warn(`No email found for LinkedIn user with id: ${sub}`);
        return done(new Error('Email not provided by LinkedIn'), false);
      }

      const user = {
        linkedinId: sub,
        displayName: name || 'Unknown',
        email: email,
        profilePicture: picture || null,
        accessToken: accessToken,
        username: email.split('@')[0],
        loginMethod: "linkedin"
      };

      const createdUser = await this.recruiterAuthService.findOrCreate(user);

      if (!createdUser.error) {
        const jwtToken = this.generateToken(createdUser.user);
        this.logger.debug(`User created: ${JSON.stringify(createdUser)}`);
        return done(null, { token: jwtToken });
      }

      return done(null, { error: createdUser?.message });
    } catch (error) {
      this.logger.error(`LinkedIn authentication error: ${error.message}`, error);
      return done(error, false);
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