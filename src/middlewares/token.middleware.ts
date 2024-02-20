import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.split(' ')[1];
    // Define a regular expression pattern for routes with dynamic segments after /p
    const dynamicRoutePattern = /^\/p\/\w+$/;

    // Check if the current request path matches the dynamic route pattern
    if (!token && dynamicRoutePattern.test(req.path)) {
      res.status(401).json({ authError: true, message: 'No Token Provided' });
      return;
    }

    // If token is present, verify it
    if (token) {
      try {
        const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET);
        req['username'] = decodedToken.username;
        req['user_id'] = decodedToken.id;
      } catch (err) {
        res.status(401).json({ authError: true, message: 'Invalid Token' });
        return;
      }
    }

    next();
  }
}
