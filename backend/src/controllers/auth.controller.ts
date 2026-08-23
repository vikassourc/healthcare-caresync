import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { User } from '../models/User';
import { AuthService } from '../services/auth.service';
import { AuthRequest, UserRole } from '../types';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { DoctorProfile } from '../models/DoctorProfile';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const { email, password, firstName, lastName, role, phone, specialisation } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    const assignedRole = role === UserRole.DOCTOR ? UserRole.DOCTOR : UserRole.PATIENT;

    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password,
      firstName,
      lastName,
      role: assignedRole,
      phone
    });

    await user.save();

    // If doctor, initialize profile
    if (assignedRole === UserRole.DOCTOR) {
      await DoctorProfile.create({
        userId: user._id,
        specialisation: specialisation || 'General Medicine',
        slotDurationMinutes: 30
      });

      const { EmailService } = await import('../services/email.service');
      const welcomeHtml = EmailService.templates.doctorWelcome(
        `${user.firstName} ${user.lastName}`,
        specialisation || 'General Medicine'
      );
      EmailService.sendEmail(
        user.email,
        `Welcome to CareSync Platform, Dr. ${user.lastName}`,
        welcomeHtml
      ).catch(() => {});
    }

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user);

    user.refreshTokenHash = await AuthService.hashToken(refreshToken);
    await user.save();

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        },
        accessToken,
        refreshToken
      }
    });
  }

  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user);

    user.refreshTokenHash = await AuthService.hashToken(refreshToken);
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl
        },
        accessToken,
        refreshToken
      }
    });
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    let payload: { userId: string };
    try {
      payload = AuthService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token expired or invalid');
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedError('Session terminated. Please login again.');
    }

    const isValid = await AuthService.compareTokenHash(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid refresh token credential');
    }

    // Token Rotation
    const newAccessToken = AuthService.generateAccessToken(user);
    const newRefreshToken = AuthService.generateRefreshToken(user);

    user.refreshTokenHash = await AuthService.hashToken(newRefreshToken);
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  }

  static async logout(req: AuthRequest, res: Response): Promise<void> {
    if (req.user) {
      req.user.refreshTokenHash = undefined;
      await req.user.save();
    }
    res.status(StatusCodes.OK).json({ success: true, message: 'Logged out successfully' });
  }

  static async getMe(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user!;
    let profile = null;
    if (user.role === UserRole.DOCTOR) {
      profile = await DoctorProfile.findOne({ userId: user._id });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        doctorProfile: profile
      }
    });
  }
}
