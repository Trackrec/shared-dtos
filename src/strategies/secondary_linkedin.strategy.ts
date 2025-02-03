import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, Req } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-linkedin-oauth2';
import { AuthService } from '../auth/auth.service';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { VerifyPosition } from 'src/verify-position/verify-position.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LinkedinSecondaryStrategy extends PassportStrategy(
  Strategy,
  'linkedinSecondary',
) {
  private readonly logger = new Logger(LinkedinSecondaryStrategy.name);

  constructor(
    private readonly authService: AuthService,
    @InjectRepository(VerifyPosition)
    private readonly verifyPostionRepository: Repository<VerifyPosition>,
  ) {
    super({
      clientID: process.env.SECONDARY_LINKEDIN_CLIENT_ID,
      clientSecret: process.env.SECONDARY_LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.SECONDARY_LINKEDIN_CALLBACK_URL,
      scope: ['profile'],
      passReqToCallback: true, // This is important to get the req in the validate method
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const session = req.session as { request_token?: string };

      this.logger.debug(`LinkedIn profile: ${JSON.stringify(profile)}`);
      const { id, displayName, emails, photos, _json } = profile;
      const vanityName = _json.vanityName;
      const verifyPosition = await this.verifyPostionRepository.findOne({
        where: { unique_token: session?.request_token },
      });
      // Create user object
      const user = {
        //todo: remove linkedin id since it is not being used
        linkedinId: id,
        displayName: displayName,
        email: verifyPosition ? verifyPosition.email : null,
        profilePicture: photos[0]?.value,
        accessToken: accessToken,
        username: vanityName,
      };

      const createdUser = await this.authService.findOrCreate(user, false);

      if (!createdUser.error) {
        if (session?.request_token) {
          if (verifyPosition && verifyPosition.user == null) {
            verifyPosition.user = createdUser.user.id as any;
            await this.verifyPostionRepository.save(verifyPosition);
          }
        }
        const jwtToken = this.generateToken(createdUser.user);
        this.logger.debug(`User created: ${JSON.stringify(createdUser)}`);

        return done(null, { token: jwtToken });
      } else {
        return done(null, { token: null });
      }
    } catch (error) {
      this.logger.error(
        `Error during LinkedIn authentication: ${error.message}`,
        error,
      );
      return done(done, { token: null });
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
