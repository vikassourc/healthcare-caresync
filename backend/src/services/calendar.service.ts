import { google } from 'googleapis';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { User } from '../models/User';
import { UserRole } from '../types';
import { AuthService } from './auth.service';

export class CalendarService {
  private static getOAuthClient() {
    return new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID || 'mock_client_id',
      env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
      env.GOOGLE_REDIRECT_URI
    );
  }

  static getAuthUrl(state?: string): string {
    const client = this.getOAuthClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
      ],
      state: state || 'google_auth_login',
      prompt: 'select_account'
    });
  }

  static async handleCallback(code: string, state: string): Promise<{ success: boolean; user?: any; accessToken?: string; refreshToken?: string }> {
    try {
      const client = this.getOAuthClient();
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email?.toLowerCase();

      if (!email) {
        throw new Error('Google did not return an email address');
      }

      let user = await User.findOne({ email });

      if (!user) {
        // Auto-register new patient from Google Profile
        user = await User.create({
          email,
          firstName: userInfo.data.given_name || 'Google',
          lastName: userInfo.data.family_name || 'User',
          role: UserRole.PATIENT,
          avatarUrl: userInfo.data.picture,
          passwordHash: 'GoogleOAuthUserPassword123!'
        });
        logger.info(`Auto-registered new patient account from Google OAuth: ${email}`);
      }

      // Update tokens & avatar
      user.googleCalendarTokens = {
        accessToken: tokens.access_token || undefined,
        refreshToken: tokens.refresh_token || user.googleCalendarTokens?.refreshToken || undefined,
        expiryDate: tokens.expiry_date || undefined
      };
      if (userInfo.data.picture && !user.avatarUrl) {
        user.avatarUrl = userInfo.data.picture;
      }

      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);
      user.refreshTokenHash = await AuthService.hashToken(refreshToken);
      await user.save();

      logger.info(`Google OAuth login successful for user ${user.email} (${user.role})`);
      return { success: true, user, accessToken, refreshToken };
    } catch (error) {
      logger.error('Failed to exchange Google OAuth code for tokens', error);
      return { success: false };
    }
  }

  static async syncAppointmentEvent(appointment: any, doctor: any, patient: any): Promise<string | null> {
    try {
      if (!doctor?.googleCalendarTokens?.refreshToken) {
        logger.info(`Doctor ${doctor?.email} has not connected Google Calendar. Skipping calendar sync.`);
        return null;
      }

      const client = this.getOAuthClient();
      client.setCredentials({
        refresh_token: doctor.googleCalendarTokens.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: client });
      const event = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: `Healthcare Consultation: ${patient.firstName} ${patient.lastName}`,
          description: `Consultation with Dr. ${doctor.firstName} ${doctor.lastName}. Status: CONFIRMED\nCareSync Health Platform`,
          start: { dateTime: new Date(appointment.slotStartTime).toISOString() },
          end: { dateTime: new Date(appointment.slotEndTime).toISOString() },
          attendees: [{ email: patient.email }, { email: doctor.email }]
        }
      });

      logger.info(`Google Calendar Event created successfully: ${event.data.id}`);
      return event.data.id || null;
    } catch (error) {
      logger.error('Google Calendar event sync encountered non-blocking error', error);
      return null;
    }
  }
}
