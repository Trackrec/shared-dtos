import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserAccounts } from 'src/auth/User.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>
  ) {}
  use(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.split(' ')[1];
    
    // Check if the current request path matches the dynamic route pattern
    if (!token && !req.originalUrl.startsWith("/p/")) {
      res.status(401).json({ authError: true, message: 'No Token Provided' });
      return;
    }

    // If token is present, verify it
    
    if (token) {
      try {
        const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET);
        req['username'] = decodedToken.username;
        req['user_id'] = decodedToken.id;
        this.updateLastAccessed(decodedToken.id)
        next();
      } catch (err) {
        res.status(401).json({ error: true, message: 'No Token Provided' });
      }
    } else {
      next(); 
    }
  }

  async updateLastAccessed(userId: number) {
    try {
      const user = await this.userRepository.findOne({where:{id:userId}});
      if (!user) {
        return { error: true, message: 'User not found.' };
      }

      user.last_accessed_at = new Date();
      await this.userRepository.save(user);

    } catch (error) {
       console.log("Error updating last access!")
    }
  }

}
