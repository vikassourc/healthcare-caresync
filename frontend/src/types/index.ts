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

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  doctorProfile?: DoctorProfile;
}

export interface DoctorProfile {
  _id: string;
  userId: string | User;
  specialisation: string;
  workingHours: Record<string, { start: string; end: string } | null>;
  slotDurationMinutes: number;
  bio?: string;
}

export interface Appointment {
  _id: string;
  patientId: string | User;
  doctorId: string | User;
  slotStartTime: string;
  slotEndTime: string;
  status: AppointmentStatus;
  holdExpiresAt?: string;
  cancellationReason?: string;
  googleCalendarEventId?: string;
  createdAt: string;
}

export interface SymptomForm {
  _id: string;
  appointmentId: string;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  additionalNotes?: string;
}

export interface PreVisitSummary {
  _id: string;
  appointmentId: string;
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  rawSummary?: string;
  llmFailed: boolean;
}

export interface PostVisitNote {
  _id: string;
  appointmentId: string;
  doctorId: string;
  diagnosis: string;
  notes: string;
  followUpInstructions?: string;
}

export interface PostVisitSummary {
  _id: string;
  appointmentId: string;
  patientFriendlySummary: string;
  medicationSchedule: string[];
  followUpSteps: string[];
  llmFailed: boolean;
}

export interface Prescription {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string | User;
  medicationName: string;
  form?: string;
  dosage: string;
  frequency: string;
  timing?: string;
  route?: string;
  durationDays: number;
  refills?: number;
  startDate: string;
  endDate: string;
  instructions?: string;
}

export interface SlotInfo {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}
