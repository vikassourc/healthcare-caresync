import { Schema, model } from 'mongoose';
import { IMedicationReminderDocument, MedicationReminderStatus } from '../types';

const medicationReminderSchema = new Schema<IMedicationReminderDocument>(
  {
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      index: true
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(MedicationReminderStatus),
      default: MedicationReminderStatus.PENDING,
      index: true
    },
    retryCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const MedicationReminder = model<IMedicationReminderDocument>('MedicationReminder', medicationReminderSchema);
