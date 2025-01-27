import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserAccounts } from 'src/auth/User.entity';
import { Repository } from 'typeorm';
import { configurations } from '../config/env.config';

const { jwtSecret } = configurations; // Add recruiterTokenSecret to your configurations

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.split(' ')[1];
    const recruiterToken = req.headers['x-recruiter-token'];

    // Check if the current request path matches the /p/:username pattern
    const isProfileRoute = req.originalUrl.startsWith('/p/');

    if (!token) {
      res.status(401).json({ authError: true, message: 'No Token Provided' });
      return;
    }

    // Verify auth token
    if (token !== 'null' && token) {
      try {
        const decodedToken: { id: number } = jwt.verify(token, jwtSecret);
        req['user_id'] = decodedToken.id;
        this.updateLastAccessed(decodedToken.id);
      } catch (err) {
        console.log(err);
        res.status(401).json({ error: true, message: 'Invalid Token' });
        return;
      }
    }

    // Validate recruiterToken if it's a /p/:username route
    if (isProfileRoute && recruiterToken) {
      try {
        console.log('recruiter token');
        const decodedRecruiterToken: { id: number } = jwt.verify(recruiterToken, jwtSecret);
        req['recruiter_id'] = decodedRecruiterToken.id;
      } catch (err) {
        console.log('Invalid recruiter token:', err);
      }
    }

    next();
  }

  async updateLastAccessed(userId: number) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return { error: true, message: 'User not found.' };
      }

      user.last_accessed_at = new Date();
      await this.userRepository.save(user);
    } catch (error) {
      console.log('Error updating last access!', error);
    }
  }
}
