import { Types } from 'mongoose';
import { Appointment } from '../models/Appointment';
import { DoctorProfile } from '../models/DoctorProfile';
import { SymptomForm } from '../models/SymptomForm';
import { User } from '../models/User';
import { AppointmentStatus, NotificationType, SlotInfo } from '../types';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { isWithinWorkingHours, formatDateForDisplay } from '../utils/helpers';
import { agenda } from '../config/agenda';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { CalendarService } from './calendar.service';
import { logger } from '../utils/logger';

export interface HoldSlotParams {
  patientId: string | Types.ObjectId;
  doctorId: string | Types.ObjectId;
  slotStartTime: Date;
}

export interface ConfirmAppointmentParams {
  appointmentId: string;
  patientId: string | Types.ObjectId;
  symptomForm: {
    chiefComplaint: string;
    symptoms: string[];
    duration: string;
    severity: string;
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

    const doctorProfile = await DoctorProfile.findOne({
      $or: [{ userId: doctorId }, { _id: doctorId }]
    });

    if (!doctorProfile) {
      throw new NotFoundError('Doctor profile not found');
    }

    const actualDoctorUserId: any = (doctorProfile.userId as any)._id || doctorProfile.userId;

    if (slotStartTime.getTime() <= Date.now()) {
      throw new ValidationError('Cannot book an appointment slot in the past. Please choose an upcoming available time.');
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
          doctorId: actualDoctorUserId,
          slotStartTime,
          status: { $in: [AppointmentStatus.HELD, AppointmentStatus.CONFIRMED] }
        },
        {
          $setOnInsert: {
            patientId,
            doctorId: actualDoctorUserId,
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
        const nextSlots = await this.getNextAvailableSlots(actualDoctorUserId.toString(), slotStartTime);
        throw new ConflictError('This slot is already held or booked by another patient.', {
          nextAvailableSlots: nextSlots
        });
      }

      return appointment;
    } catch (error: any) {
      // MongoDB E11000 duplicate key index collision
      if (error.code === 11000) {
        const nextSlots = await this.getNextAvailableSlots(actualDoctorUserId.toString(), slotStartTime);
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

    // Fetch user details for notification (supporting both User ID and DoctorProfile ID)
    let patient = await User.findById(patientId);
    let doctor = await User.findById(appointment.doctorId);

    if (!doctor) {
      const docProfile = await DoctorProfile.findById(appointment.doctorId);
      if (docProfile) {
        doctor = await User.findById(docProfile.userId);
      }
    }

    const doctorLastName = doctor?.lastName || 'Specialist';
    const doctorFullName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Dr. Specialist';
    const patientFullName = patient ? `${patient.firstName} ${patient.lastName}` : 'Valued Patient';
    const dateDisplay = formatDateForDisplay(appointment.slotStartTime);

    // 1. Direct immediate send to Patient's personal registered email
    if (patient?.email) {
      const patientSubject = `Appointment Confirmed: ${doctorFullName} - ${dateDisplay}`;
      const emailHtml = EmailService.templates.bookingConfirmation(
        patientFullName,
        doctorFullName,
        dateDisplay
      );

      logger.info(`[Booking Confirmation] Dispatching email to Patient: ${patient.email}`);
      EmailService.sendEmail(patient.email, patientSubject, emailHtml).catch((err) => {
        logger.error(`Error delivering patient confirmation email: ${err.message}`);
      });

      NotificationService.queueNotification({
        recipientId: patient._id,
        type: NotificationType.BOOKING_CONFIRM,
        subject: patientSubject,
        body: emailHtml,
        dedupSuffix: appointment._id.toString()
      }).catch(() => {});
    }

    // 2. Direct immediate send to Doctor's personal registered email
    if (doctor?.email) {
      const doctorSubject = `New Patient Consultation Scheduled: ${patientFullName} (${dateDisplay})`;
      const doctorAlertHtml = EmailService.templates.doctorNewBookingAlert(
        doctorFullName,
        patientFullName,
        dateDisplay,
        symptomForm.chiefComplaint,
        symptomForm.severity
      );

      logger.info(`[Booking Alert] Dispatching email to Doctor: ${doctor.email}`);
      EmailService.sendEmail(doctor.email, doctorSubject, doctorAlertHtml).catch((err) => {
        logger.error(`Error delivering doctor alert email: ${err.message}`);
      });

      NotificationService.queueNotification({
        recipientId: doctor._id,
        type: NotificationType.BOOKING_CONFIRM,
        subject: doctorSubject,
        body: doctorAlertHtml,
        dedupSuffix: `doc_${appointment._id.toString()}`
      }).catch(() => {});
    }

    // Async Google Calendar Event Sync (non-blocking)
    if (doctor && patient) {
      CalendarService.syncAppointmentEvent(appointment, doctor, patient).then((eventId) => {
        if (eventId) {
          Appointment.findByIdAndUpdate(appointment._id, { googleCalendarEventId: eventId }).exec();
        }
      });
    }

    return appointment;
  }

  /**
   * Cancels an appointment safely.
   */
  static async cancelAppointment(appointmentId: string, userId: string, reason?: string) {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      $or: [{ patientId: userId }, { doctorId: userId }],
      status: { $in: [AppointmentStatus.HELD, AppointmentStatus.CONFIRMED] }
    });

    if (!appointment) {
      throw new NotFoundError('Active appointment not found or already cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = reason || 'Cancelled by user';
    await appointment.save();

    // Notify other party
    const isPatientCancelling = appointment.patientId.toString() === userId;
    const notifyUserId = isPatientCancelling ? appointment.doctorId : appointment.patientId;
    const otherUser = await User.findById(notifyUserId);
    const cancellingUser = await User.findById(userId);

    if (otherUser && cancellingUser) {
      const dateDisplay = formatDateForDisplay(appointment.slotStartTime);
      const emailHtml = EmailService.templates.cancellationNotice(
        `${otherUser.firstName} ${otherUser.lastName}`,
        `${cancellingUser.firstName} ${cancellingUser.lastName}`,
        dateDisplay,
        reason
      );

      if (otherUser.email) {
        EmailService.sendEmail(
          otherUser.email,
          `Appointment Cancelled: Consultation on ${dateDisplay}`,
          emailHtml
        ).catch(() => {});
      }

      await NotificationService.queueNotification({
        recipientId: otherUser._id,
        type: NotificationType.CANCELLATION,
        subject: `Appointment Cancelled: Consultation on ${dateDisplay}`,
        body: emailHtml,
        dedupSuffix: `cancel_${appointment._id.toString()}`
      });
    }

    return appointment;
  }

  /**
   * Helper: computes the next 3 available slots for conflict resolution.
   */
  static async getNextAvailableSlots(doctorId: string | Types.ObjectId, afterDate: Date): Promise<SlotInfo[]> {
    const nextSlots: SlotInfo[] = [];
    const checkDate = new Date(afterDate);

    for (let dayOffset = 0; dayOffset < 7 && nextSlots.length < 3; dayOffset++) {
      checkDate.setDate(checkDate.getDate() + (dayOffset === 0 ? 0 : 1));
      const dateStr = checkDate.toISOString().split('T')[0];

      try {
        const { SlotService } = await import('./slot.service');
        const slots = await SlotService.getAvailableSlots(doctorId, dateStr);
        const available = slots.filter((s) => s.available && s.startTime > afterDate);
        nextSlots.push(...available.slice(0, 3 - nextSlots.length));
      } catch {
        // continue
      }
    }

    return nextSlots;
  }
}
