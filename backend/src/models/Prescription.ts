import { Schema, model } from 'mongoose';
import { IPrescriptionDocument } from '../types';

const prescriptionSchema = new Schema<IPrescriptionDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true
    },
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
    medicationName: {
      type: String,
      required: true,
      trim: true
    },
    form: {
      type: String,
      default: 'Tablet',
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      trim: true
    },
    timing: {
      type: String,
      default: 'After food',
      trim: true
    },
    route: {
      type: String,
      default: 'Oral',
      trim: true
    },
    durationDays: {
      type: Number,
      required: true,
      default: 7
    },
    refills: {
      type: Number,
      default: 0
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    instructions: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

prescriptionSchema.index({ patientId: 1, endDate: 1 });

export const Prescription = model<IPrescriptionDocument>('Prescription', prescriptionSchema);
