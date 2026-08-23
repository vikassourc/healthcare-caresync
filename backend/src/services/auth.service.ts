import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IUserDocument, JwtPayload, UserRole } from '../types';
import { env } from '../config/env';

export class AuthService {
  static generateAccessToken(user: IUserDocument): string {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  }

  static generateRefreshToken(user: IUserDocument): string {
    const payload = { userId: user._id.toString() };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
  }

  static verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  }

  static async hashToken(token: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(token, salt);
  }

  static async compareTokenHash(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }
}
