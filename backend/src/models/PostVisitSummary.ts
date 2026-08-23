import { Schema, model } from 'mongoose';
import { IPostVisitSummaryDocument } from '../types';

const postVisitSummarySchema = new Schema<IPostVisitSummaryDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true
    },
    patientFriendlySummary: {
      type: String,
      required: true
    },
    medicationSchedule: {
      type: [String],
      default: []
    },
    followUpSteps: {
      type: [String],
      default: []
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

export const PostVisitSummary = model<IPostVisitSummaryDocument>('PostVisitSummary', postVisitSummarySchema);
