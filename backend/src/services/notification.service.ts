import { Types } from 'mongoose';
import { NotificationLog } from '../models/NotificationLog';
import { NotificationChannel, NotificationStatus, NotificationType } from '../types';
import { generateIdempotencyKey } from '../utils/helpers';
import { agenda } from '../config/agenda';
import { logger } from '../utils/logger';

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
   * If a notification with the same idempotency key was already SENT, it skips duplicating.
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

    // Enqueue async email worker job via Agenda
    await agenda.now('send-email', { notificationId: notification._id.toString() });
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
    const notification = await NotificationLog.findById(notificationId);
    if (!notification) return false;

    notification.status = NotificationStatus.QUEUED;
    notification.retryCount = 0;
    notification.errorMessage = undefined;
    await notification.save();

    await agenda.now('send-email', { notificationId: notification._id.toString() });
    return true;
  }
}
