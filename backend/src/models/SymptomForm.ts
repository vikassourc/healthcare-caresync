import { Schema, model } from 'mongoose';
import { ISymptomFormDocument } from '../types';

const symptomFormSchema = new Schema<ISymptomFormDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true
    },
    chiefComplaint: {
      type: String,
      required: true,
      trim: true
    },
    symptoms: {
      type: [String],
      required: true,
      default: []
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate',
      required: true
    },
    additionalNotes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const SymptomForm = model<ISymptomFormDocument>('SymptomForm', symptomFormSchema);
