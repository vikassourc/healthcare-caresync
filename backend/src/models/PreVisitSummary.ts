import { Schema, model } from 'mongoose';
import { IPreVisitSummaryDocument, UrgencyLevel } from '../types';

const preVisitSummarySchema = new Schema<IPreVisitSummaryDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true
    },
    urgencyLevel: {
      type: String,
      enum: Object.values(UrgencyLevel),
      default: UrgencyLevel.MEDIUM,
      required: true
    },
    chiefComplaint: {
      type: String,
      required: true
    },
    suggestedQuestions: {
      type: [String],
      default: []
    },
    rawSummary: {
      type: String
    },
    llmFailed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const PreVisitSummary = model<IPreVisitSummaryDocument>('PreVisitSummary', preVisitSummarySchema);
