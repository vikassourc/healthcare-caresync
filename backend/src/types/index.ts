import { Request } from 'express';
import { Document, Types } from 'mongoose';

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin'
}

export enum AppointmentStatus {
  HELD = 'HELD',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  EXPIRED = 'EXPIRED'
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP'
}

export enum NotificationType {
  BOOKING_CONFIRM = 'BOOKING_CONFIRM',
  REMINDER = 'REMINDER',
  CANCELLATION = 'CANCELLATION',
  LEAVE_NOTICE = 'LEAVE_NOTICE',
  MEDICATION = 'MEDICATION',
  RESCHEDULE = 'RESCHEDULE'
}

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DEAD_LETTER = 'DEAD_LETTER'
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSED = 'PROCESSED'
}

export enum MedicationReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

export type SeverityType = 'mild' | 'moderate' | 'severe';

export interface IDayHours {
  start: string; // e.g. "09:00"
  end: string;   // e.g. "17:00"
}

export interface IWorkingHours {
  monday?: IDayHours | null;
  tuesday?: IDayHours | null;
  wednesday?: IDayHours | null;
  thursday?: IDayHours | null;
  friday?: IDayHours | null;
  saturday?: IDayHours | null;
  sunday?: IDayHours | null;
  [key: string]: IDayHours | null | undefined;
}

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  refreshTokenHash?: string;
  googleCalendarTokens?: {
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

export interface IDoctorProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId | IUser;
  specialisation: string;
  workingHours: IWorkingHours;
  slotDurationMinutes: number;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctorProfileDocument extends IDoctorProfile, Document {
  _id: Types.ObjectId;
}

export interface IDoctorLeave {
  _id: Types.ObjectId;
  doctorId: Types.ObjectId | IUser;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: LeaveStatus;
  affectedAppointmentsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctorLeaveDocument extends IDoctorLeave, Document {
  _id: Types.ObjectId;
}

export interface IAppointment {
  _id: Types.ObjectId;
  patientId: Types.ObjectId | IUser;
  doctorId: Types.ObjectId | IUser;
  slotStartTime: Date;
  slotEndTime: Date;
  status: AppointmentStatus;
  holdExpiresAt?: Date;
  cancellationReason?: string;
  googleCalendarEventId?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointmentDocument extends IAppointment, Document {
  _id: Types.ObjectId;
}

export interface ISymptomForm {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId | IAppointment;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: SeverityType;
  additionalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISymptomFormDocument extends ISymptomForm, Document {
  _id: Types.ObjectId;
}

export interface IPreVisitSummary {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId | IAppointment;
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  rawSummary?: string;
  llmFailed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPreVisitSummaryDocument extends IPreVisitSummary, Document {
  _id: Types.ObjectId;
}

export interface IPostVisitNote {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId | IAppointment;
  doctorId: Types.ObjectId | IUser;
  diagnosis: string;
  notes: string;
  followUpInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostVisitNoteDocument extends IPostVisitNote, Document {
  _id: Types.ObjectId;
}

export interface IPostVisitSummary {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId | IAppointment;
  patientFriendlySummary: string;
  medicationSchedule: string[];
  followUpSteps: string[];
  llmFailed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostVisitSummaryDocument extends IPostVisitSummary, Document {
  _id: Types.ObjectId;
}

export interface IPrescription {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId | IAppointment;
  patientId: Types.ObjectId | IUser;
  doctorId: Types.ObjectId | IUser;
  medicationName: string;
  form?: string;
  dosage: string;
  frequency: string;
  timing?: string;
  route?: string;
  durationDays: number;
  refills?: number;
  startDate: Date;
  endDate: Date;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrescriptionDocument extends IPrescription, Document {
  _id: Types.ObjectId;
}

export interface IMedicationReminder {
  _id: Types.ObjectId;
  prescriptionId: Types.ObjectId | IPrescription;
  patientId: Types.ObjectId | IUser;
  scheduledAt: Date;
  status: MedicationReminderStatus;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicationReminderDocument extends IMedicationReminder, Document {
  _id: Types.ObjectId;
}

export interface INotificationLog {
  _id: Types.ObjectId;
  idempotencyKey: string;
  recipientId: Types.ObjectId | IUser;
  channel: NotificationChannel;
  type: NotificationType;
  subject: string;
  body: string;
  status: NotificationStatus;
  retryCount: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationLogDocument extends INotificationLog, Document {
  _id: Types.ObjectId;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

export interface SlotInfo {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export interface LLMPreVisitResponse {
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
}

export interface LLMPostVisitResponse {
  summary: string;
  medicationSchedule: string[];
  followUpSteps: string[];
}
