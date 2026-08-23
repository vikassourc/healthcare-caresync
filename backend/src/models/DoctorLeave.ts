import { Schema, model } from 'mongoose';
import { IDoctorLeaveDocument, LeaveStatus } from '../types';

const doctorLeaveSchema = new Schema<IDoctorLeaveDocument>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(LeaveStatus),
      default: LeaveStatus.PENDING
    },
    affectedAppointmentsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

doctorLeaveSchema.index({ doctorId: 1, startDate: 1, endDate: 1 });

export const DoctorLeave = model<IDoctorLeaveDocument>('DoctorLeave', doctorLeaveSchema);
