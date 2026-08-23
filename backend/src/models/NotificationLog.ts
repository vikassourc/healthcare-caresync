import { Schema, model } from 'mongoose';
import { INotificationLogDocument, NotificationChannel, NotificationStatus, NotificationType } from '../types';

const notificationLogSchema = new Schema<INotificationLogDocument>(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      default: NotificationChannel.EMAIL
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.QUEUED,
      index: true
    },
    retryCount: {
      type: Number,
      default: 0
    },
    lastAttemptAt: {
      type: Date
    },
    errorMessage: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

export const NotificationLog = model<INotificationLogDocument>('NotificationLog', notificationLogSchema);
