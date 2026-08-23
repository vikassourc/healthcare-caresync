import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { env } from '../config/env';
import { User } from '../models/User';

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired. Please refresh your session.');
      }
      throw new UnauthorizedError('Invalid authentication token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
