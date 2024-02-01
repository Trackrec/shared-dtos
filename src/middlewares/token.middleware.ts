import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Request, Response, NextFunction } from 'express';
  import * as jwt from 'jsonwebtoken';
  
  @Injectable()
  export class TokenMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.json({ authError: true, message: 'No Token Provided' });
        return;
      }
  
      try {
        const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET);
        req['username'] = decodedToken.username;
        req['user_id'] = decodedToken.id;

  
        next();
      } catch (err) {
        res.json({ authError: true, message: 'Invalid Token' });
        return;
      }
    }
  }
  