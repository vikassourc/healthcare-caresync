import { Types } from 'mongoose';
import { NotificationLog } from '../models/NotificationLog';
import { User } from '../models/User';
import { NotificationChannel, NotificationStatus, NotificationType } from '../types';
import { generateIdempotencyKey } from '../utils/helpers';
import { agenda } from '../config/agenda';
import { logger } from '../utils/logger';
import { EmailService } from './email.service';

export interface QueueNotificationParams {
  recipientId: string | Types.ObjectId;
  type: NotificationType;
  subject: string;
  body: string;
  channel?: NotificationChannel;
  metadata?: Record<string, any>;
  dedupSuffix?: string;
}

export class NotificationService {
  /**
   * Queues an email/in-app notification with strict idempotency protection.
   * Dispatches immediate email delivery AND keeps Agenda job for retry guarantee.
   */
  static async queueNotification(params: QueueNotificationParams): Promise<any> {
    const channel = params.channel || NotificationChannel.EMAIL;
    const idempotencyKey = generateIdempotencyKey(
      params.type,
      params.recipientId.toString(),
      params.dedupSuffix || params.subject
    );

    // Check for existing SENT notification
    const existing = await NotificationLog.findOne({ idempotencyKey });
    if (existing && existing.status === NotificationStatus.SENT) {
      logger.info(`Notification ${idempotencyKey} already sent. Skipping duplicate.`);
      return existing;
    }

    let notification;
    if (existing) {
      existing.status = NotificationStatus.QUEUED;
      existing.retryCount = 0;
      existing.errorMessage = undefined;
      notification = await existing.save();
    } else {
      notification = await NotificationLog.create({
        idempotencyKey,
        recipientId: params.recipientId,
        channel,
        type: params.type,
        subject: params.subject,
        body: params.body,
        status: NotificationStatus.QUEUED,
        retryCount: 0,
        metadata: params.metadata
      });
    }

    // 1. Instant Direct Delivery Attempt
    try {
      const recipient = await User.findById(params.recipientId);
      if (recipient?.email) {
        logger.info(`Immediate email dispatch to user's registered address: ${recipient.email}`);
        EmailService.sendEmail(recipient.email, params.subject, params.body).then(async (sent) => {
          if (sent) {
            await NotificationLog.findByIdAndUpdate(notification._id, {
              status: NotificationStatus.SENT,
              lastAttemptAt: new Date()
            });
            logger.info(`Notification status updated to SENT for ${recipient.email}`);
          }
        }).catch((err) => {
          logger.warn(`Immediate dispatch error, falling back to Agenda queue: ${err.message}`);
        });
      }
    } catch (err: any) {
      logger.warn(`Failed initial user lookup for notification: ${err.message}`);
    }

    // 2. Queue in Agenda worker for guaranteed retry mechanism
    try {
      await agenda.now('send-email', { notificationId: notification._id.toString() });
    } catch (e: any) {
      logger.warn(`Agenda job schedule note: ${e.message}`);
    }

    return notification;
  }

  static async getDeadLetterNotifications(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      NotificationLog.find({ status: NotificationStatus.DEAD_LETTER })
        .populate('recipientId', 'firstName lastName email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationLog.countDocuments({ status: NotificationStatus.DEAD_LETTER })
    ]);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  static async retryNotification(notificationId: string): Promise<boolean> {
    const notification = await NotificationLog.findById(notificationId).populate('recipientId');
    if (!notification) return false;

    notification.status = NotificationStatus.QUEUED;
    notification.retryCount = 0;
    notification.errorMessage = undefined;
    await notification.save();

    const recipient: any = notification.recipientId;
    if (recipient?.email) {
      await EmailService.sendEmail(recipient.email, notification.subject, notification.body);
      notification.status = NotificationStatus.SENT;
      notification.lastAttemptAt = new Date();
      await notification.save();
      return true;
    }

    await agenda.now('send-email', { notificationId: notification._id.toString() });
    return true;
  }
}
