import { Schema, model } from 'mongoose';
import { IDoctorProfileDocument } from '../types';

const doctorProfileSchema = new Schema<IDoctorProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    specialisation: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    workingHours: {
      type: Schema.Types.Mixed,
      default: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '09:00', end: '15:00' },
        sunday: { start: '09:00', end: '15:00' }
      }
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
      enum: [15, 20, 30, 45, 60]
    },
    bio: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const DoctorProfile = model<IDoctorProfileDocument>('DoctorProfile', doctorProfileSchema);
