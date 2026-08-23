import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CalendarService } from '../services/calendar.service';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { env } from '../config/env';

export class CalendarController {
  static getAuthUrl(req: Request, res: Response) {
    const authReq = req as AuthRequest;
    const origin = (req.query.origin as string) || (req.headers.origin as string) || env.FRONTEND_URL || 'http://localhost:5173';
    const userId = authReq.user ? authReq.user._id.toString() : 'anonymous';

    // Encode origin and user state safely into base64 JSON
    const statePayload = Buffer.from(JSON.stringify({ origin, userId, ts: Date.now() })).toString('base64');
    const url = CalendarService.getAuthUrl(statePayload);
    res.status(StatusCodes.OK).json({ success: true, data: { url } });
  }

  static async handleCallback(req: any, res: Response) {
    const { code, state } = req.query;

    let targetOrigin = env.FRONTEND_URL || 'http://localhost:5173';
    let userId = 'anonymous';

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
        if (decoded.origin) targetOrigin = decoded.origin;
        if (decoded.userId) userId = decoded.userId;
      } catch {
        // fallback
      }
    }

    if (!code) {
      res.redirect(`${targetOrigin}/login?googleAuth=failed`);
      return;
    }

    const result = await CalendarService.handleCallback(code as string, userId);

    if (result.success && result.user && result.accessToken && result.refreshToken) {
      const role = result.user.role.toLowerCase();
      // Redirect to frontend with auth payload
      res.redirect(
        `${targetOrigin}/login?googleAuth=success&token=${result.accessToken}&refreshToken=${result.refreshToken}&role=${role}`
      );
      return;
    }

    res.redirect(`${targetOrigin}/login?googleAuth=failed`);
  }

  static async disconnect(req: AuthRequest, res: Response) {
    await User.findByIdAndUpdate(req.user!._id, { $unset: { googleCalendarTokens: '' } });
    res.status(StatusCodes.OK).json({ success: true, message: 'Google Calendar disconnected' });
  }
}
