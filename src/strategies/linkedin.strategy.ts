import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy } from 'passport-linkedin-oauth2';
import { AuthService } from '../auth/auth.service';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { VerifyPosition } from 'src/verify-position/verify-position.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, 'linkedin') {
  private readonly logger = new Logger(LinkedinStrategy.name);

  constructor(
    private readonly authService: AuthService,
    @InjectRepository(VerifyPosition)
    private readonly verifyPositionRepository: Repository<VerifyPosition>,
  ) {
    super({
      clientID: process.env.PRIMARY_LINKEDIN_CLIENT_ID,
      clientSecret: process.env.PRIMARY_LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.PRIMARY_LINKEDIN_CALLBACK_URL,
      scope: ['openid', 'profile', 'email', 'w_member_social'],
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
      this.logger.debug(`LinkedIn profile received: ${JSON.stringify(profile)}`);

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
      };

      this.logger.debug(`User object constructed: ${JSON.stringify(user)}`);

      const createdUser = await this.authService.findOrCreate(user, true);

      if (!createdUser.error) {
        const jwtToken = this.generateToken(createdUser.user);
        return done(null, { token: jwtToken, userId: createdUser?.user?.id });
      }

      this.logger.error(`User creation failed: ${JSON.stringify(createdUser.error)}`);
      return done(new Error('User creation failed'), false);
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
