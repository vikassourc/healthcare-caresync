import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CalendarService } from '../services/calendar.service';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { env } from '../config/env';

export class CalendarController {
  static getAuthUrl(req: Request, res: Response) {
    const authReq = req as AuthRequest;
    const state = authReq.user ? authReq.user._id.toString() : 'google_auth_login';
    const url = CalendarService.getAuthUrl(state);
    res.status(StatusCodes.OK).json({ success: true, data: { url } });
  }

  static async handleCallback(req: any, res: Response) {
    const { code, state } = req.query;
    if (!code) {
      res.redirect(`${env.FRONTEND_URL || 'http://localhost:5173'}/login?googleAuth=failed`);
      return;
    }

    const result = await CalendarService.handleCallback(code as string, (state as string) || 'google_auth_login');

    if (result.success && result.user && result.accessToken && result.refreshToken) {
      const role = result.user.role.toLowerCase();
      // Redirect to frontend with auth payload
      res.redirect(
        `${env.FRONTEND_URL || 'http://localhost:5173'}/login?googleAuth=success&token=${result.accessToken}&refreshToken=${result.refreshToken}&role=${role}`
      );
      return;
    }

    res.redirect(`${env.FRONTEND_URL || 'http://localhost:5173'}/login?googleAuth=failed`);
  }

  static async disconnect(req: AuthRequest, res: Response) {
    await User.findByIdAndUpdate(req.user!._id, { $unset: { googleCalendarTokens: '' } });
    res.status(StatusCodes.OK).json({ success: true, message: 'Google Calendar disconnected' });
  }
}
