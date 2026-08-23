import { Schema, model } from 'mongoose';
import { IAppointmentDocument, AppointmentStatus } from '../types';

const appointmentSchema = new Schema<IAppointmentDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    slotStartTime: {
      type: Date,
      required: true
    },
    slotEndTime: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.HELD,
      required: true,
      index: true
    },
    holdExpiresAt: {
      type: Date,
      index: true
    },
    cancellationReason: {
      type: String
    },
    googleCalendarEventId: {
      type: String
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * Unique compound partial index on { doctorId, slotStartTime }
 * Only appointments with status 'HELD' or 'CONFIRMED' are subject to this unique constraint.
 * Cancelled or expired appointments release the slot seamlessly without blocking re-booking.
 */
appointmentSchema.index(
  { doctorId: 1, slotStartTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [AppointmentStatus.HELD, AppointmentStatus.CONFIRMED] }
    },
    name: 'unique_active_booking_per_slot'
  }
);

appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, slotStartTime: 1, status: 1 });

export const Appointment = model<IAppointmentDocument>('Appointment', appointmentSchema);
