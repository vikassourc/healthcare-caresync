import { Schema, model } from 'mongoose';
import { IPostVisitNoteDocument } from '../types';

const postVisitNoteSchema = new Schema<IPostVisitNoteDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String,
      required: true,
      trim: true
    },
    followUpInstructions: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const PostVisitNote = model<IPostVisitNoteDocument>('PostVisitNote', postVisitNoteSchema);
