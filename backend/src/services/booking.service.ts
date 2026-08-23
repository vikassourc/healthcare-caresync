import { Types } from 'mongoose';
import { Appointment } from '../models/Appointment';
import { DoctorProfile } from '../models/DoctorProfile';
import { SymptomForm } from '../models/SymptomForm';
import { User } from '../models/User';
import { AppointmentStatus, NotificationType, UrgencyLevel } from '../types';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { formatDateForDisplay, isWithinWorkingHours } from '../utils/helpers';
import { SlotService } from './slot.service';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { CalendarService } from './calendar.service';
import { agenda } from '../config/agenda';
import { logger } from '../utils/logger';

export interface HoldSlotParams {
  patientId: string | Types.ObjectId;
  doctorId: string | Types.ObjectId;
  slotStartTime: Date;
}

export interface ConfirmAppointmentParams {
  appointmentId: string;
  patientId: string;
  symptomForm: {
    chiefComplaint: string;
    symptoms: string[];
    duration: string;
    severity: 'mild' | 'moderate' | 'severe';
    additionalNotes?: string;
  };
}

export class BookingService {
  /**
   * CRITICAL CONCURRENCY IMPLEMENTATION:
   * Holds a slot using MongoDB's atomic findOneAndUpdate with upsert:true.
   * Combined with the unique compound partial index on { doctorId, slotStartTime } (for HELD/CONFIRMED),
   * this guarantees that if two requests arrive at the exact same millisecond:
   * - One wins and acquires the hold.
   * - The second throws E11000 duplicate key error, which is caught and returned as clean 409 Conflict.
   */
  static async holdSlot(params: HoldSlotParams) {
    const { patientId, doctorId, slotStartTime } = params;

    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctorProfile) {
      throw new NotFoundError('Doctor profile not found');
    }

    if (!isWithinWorkingHours(slotStartTime, doctorProfile.workingHours)) {
      throw new ValidationError('Requested slot time falls outside doctor working hours');
    }

    const durationMs = doctorProfile.slotDurationMinutes * 60 * 1000;
    const slotEndTime = new Date(slotStartTime.getTime() + durationMs);
    const holdExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute hold TTL

    try {
      const appointment = await Appointment.findOneAndUpdate(
        {
          doctorId,
          slotStartTime,
          status: { $in: [AppointmentStatus.HELD, AppointmentStatus.CONFIRMED] }
        },
        {
          $setOnInsert: {
            patientId,
            doctorId,
            slotStartTime,
            slotEndTime,
            status: AppointmentStatus.HELD,
            holdExpiresAt
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      // If existing document was returned that belongs to a different patient
      if (appointment.patientId.toString() !== patientId.toString()) {
        const nextSlots = await this.getNextAvailableSlots(doctorId, slotStartTime);
        throw new ConflictError('This slot is already held or booked by another patient.', {
          nextAvailableSlots: nextSlots
        });
      }

      return appointment;
    } catch (error: any) {
      // MongoDB E11000 duplicate key index collision
      if (error.code === 11000) {
        const nextSlots = await this.getNextAvailableSlots(doctorId, slotStartTime);
        throw new ConflictError(
          'This slot was just claimed by another user. Here are the next available slots.',
          { nextAvailableSlots: nextSlots }
        );
      }
      throw error;
    }
  }

  /**
   * Confirms a held appointment atomically, creates the symptom form,
   * enqueues pre-visit LLM summary generation, and fires confirmation email.
   */
  static async confirmAppointment(params: ConfirmAppointmentParams) {
    const { appointmentId, patientId, symptomForm } = params;

    // Atomically transition from HELD to CONFIRMED verifying hold has not expired
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        patientId,
        status: AppointmentStatus.HELD,
        holdExpiresAt: { $gt: new Date() }
      },
      {
        $set: { status: AppointmentStatus.CONFIRMED },
        $unset: { holdExpiresAt: '' }
      },
      { new: true }
    );

    if (!appointment) {
      throw new ConflictError(
        'Your 5-minute hold for this appointment has expired. Please select the slot again to hold it.'
      );
    }

    // Persist Symptom Form
    await SymptomForm.create({
      appointmentId: appointment._id,
      chiefComplaint: symptomForm.chiefComplaint,
      symptoms: symptomForm.symptoms,
      duration: symptomForm.duration,
      severity: symptomForm.severity,
      additionalNotes: symptomForm.additionalNotes
    });

    // Enqueue async background jobs
    await agenda.now('generate-pre-visit-summary', { appointmentId: appointment._id.toString() });

    // Fetch user details for notification
    const [patient, doctor] = await Promise.all([
      User.findById(patientId),
      User.findById(appointment.doctorId)
    ]);

    if (patient && doctor) {
      const dateDisplay = formatDateForDisplay(appointment.slotStartTime);
      const emailHtml = EmailService.templates.bookingConfirmation(
        `${patient.firstName} ${patient.lastName}`,
        `${doctor.firstName} ${doctor.lastName}`,
        dateDisplay
      );

      await NotificationService.queueNotification({
        recipientId: patient._id,
        type: NotificationType.BOOKING_CONFIRM,
        subject: `Appointment Confirmed: Dr. ${doctor.lastName} - ${dateDisplay}`,
        body: emailHtml,
        dedupSuffix: appointment._id.toString()
      });

      // Also send real notification email directly to Doctor's registered email
      const doctorAlertHtml = EmailService.templates.doctorNewBookingAlert(
        `${doctor.firstName} ${doctor.lastName}`,
        `${patient.firstName} ${patient.lastName}`,
        dateDisplay,
        symptomForm.chiefComplaint,
        symptomForm.severity
      );

      await NotificationService.queueNotification({
        recipientId: doctor._id,
        type: NotificationType.BOOKING_CONFIRM,
        subject: `New Patient Consultation Scheduled: ${patient.firstName} ${patient.lastName} (${dateDisplay})`,
        body: doctorAlertHtml,
        dedupSuffix: `doc_${appointment._id.toString()}`
      });

      // Async Google Calendar Event Sync (non-blocking)
      CalendarService.syncAppointmentEvent(appointment, doctor, patient).then((eventId) => {
        if (eventId) {
          Appointment.findByIdAndUpdate(appointment._id, { googleCalendarEventId: eventId }).exec();
        }
      });
    }

    return appointment;
  }

  static async cancelAppointment(appointmentId: string, userId: string, reason?: string) {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        $or: [{ patientId: userId }, { doctorId: userId }],
        status: { $in: [AppointmentStatus.HELD, AppointmentStatus.CONFIRMED] }
      },
      {
        $set: {
          status: AppointmentStatus.CANCELLED,
          cancellationReason: reason || 'Cancelled by user'
        },
        $unset: { holdExpiresAt: '' }
      },
      { new: true }
    );

    if (!appointment) {
      throw new NotFoundError('Active appointment not found or cannot be cancelled');
    }

    // Notify patient
    const [patient, doctor] = await Promise.all([
      User.findById(appointment.patientId),
      User.findById(appointment.doctorId)
    ]);

    if (patient && doctor) {
      const dateDisplay = formatDateForDisplay(appointment.slotStartTime);
      await NotificationService.queueNotification({
        recipientId: patient._id,
        type: NotificationType.CANCELLATION,
        subject: `Appointment Cancelled: Dr. ${doctor.lastName} - ${dateDisplay}`,
        body: EmailService.templates.cancellationNotice(
          `${patient.firstName} ${patient.lastName}`,
          `${doctor.firstName} ${doctor.lastName}`,
          dateDisplay,
          reason
        ),
        dedupSuffix: `cancel-${appointment._id}`
      });
    }

    return appointment;
  }

  static async getNextAvailableSlots(doctorId: string | Types.ObjectId, afterTime: Date, limit: number = 3) {
    try {
      const dateStr = afterTime.toISOString().split('T')[0];
      const slots = await SlotService.getAvailableSlots(doctorId, dateStr);
      return slots
        .filter((s) => s.available && s.startTime.getTime() > afterTime.getTime())
        .slice(0, limit);
    } catch {
      return [];
    }
  }
}
