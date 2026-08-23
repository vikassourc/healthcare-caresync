import { Agenda } from 'agenda';
import { NotificationLog } from '../models/NotificationLog';
import { User } from '../models/User';
import { NotificationStatus } from '../types';
import { EmailService } from '../services/email.service';
import { logger } from '../utils/logger';

const BACKOFF_DELAYS_MINUTES = [1, 5, 30]; // Exponential retry schedule

export function defineEmailSenderJob(agenda: Agenda): void {
  agenda.define('send-email', async (job: any) => {
    const { notificationId } = job.attrs.data;
    if (!notificationId) return;

    const notification = await NotificationLog.findById(notificationId).populate('recipientId');
    if (!notification || notification.status === NotificationStatus.SENT) {
      return;
    }

    const recipient: any = notification.recipientId;
    if (!recipient || !recipient.email) {
      notification.status = NotificationStatus.DEAD_LETTER;
      notification.errorMessage = 'Recipient has no valid email address';
      await notification.save();
      return;
    }

    try {
      await EmailService.sendEmail(recipient.email, notification.subject, notification.body);
      notification.status = NotificationStatus.SENT;
      notification.lastAttemptAt = new Date();
      notification.errorMessage = undefined;
      await notification.save();
      logger.info(`[Agenda] Email notification ${notificationId} successfully sent to ${recipient.email}`);
    } catch (error: any) {
      notification.retryCount += 1;
      notification.lastAttemptAt = new Date();
      notification.errorMessage = error.message || 'Unknown email transmission error';

      if (notification.retryCount >= 3) {
        notification.status = NotificationStatus.DEAD_LETTER;
        logger.warn(`[Agenda] Notification ${notificationId} reached max retries (3) -> Moved to DEAD_LETTER`);
      } else {
        notification.status = NotificationStatus.FAILED;
        const delayMins = BACKOFF_DELAYS_MINUTES[notification.retryCount - 1] || 15;
        logger.info(`[Agenda] Notification ${notificationId} failed. Scheduling retry #${notification.retryCount} in ${delayMins}m`);
        await agenda.schedule(`in ${delayMins} minutes`, 'send-email', { notificationId: notification._id.toString() });
      }

      await notification.save();
    }
  });
}
