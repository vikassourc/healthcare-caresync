import { Agenda } from 'agenda';
import { DoctorLeave } from '../models/DoctorLeave';
import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { AppointmentStatus, LeaveStatus, NotificationType } from '../types';
import { NotificationService } from '../services/notification.service';
import { EmailService } from '../services/email.service';
import { SlotService } from '../services/slot.service';
import { formatDateForDisplay } from '../utils/helpers';
import { logger } from '../utils/logger';

export function defineLeaveProcessorJob(agenda: Agenda): void {
  agenda.define('process-doctor-leave', async (job: any) => {
    const { leaveId } = job.attrs.data;
    if (!leaveId) return;

    try {
      const leave = await DoctorLeave.findById(leaveId);
      if (!leave) return;

      const doctor = await User.findById(leave.doctorId);
      if (!doctor) return;

      // Find all confirmed appointments in leave date range
      const affectedAppointments = await Appointment.find({
        doctorId: leave.doctorId,
        slotStartTime: { $gte: leave.startDate, $lte: leave.endDate },
        status: { $in: [AppointmentStatus.HELD, AppointmentStatus.CONFIRMED] }
      }).populate('patientId');

      logger.info(`[Agenda] Processing leave for Dr. ${doctor.lastName}. Found ${affectedAppointments.length} conflicting appointments.`);

      for (const app of affectedAppointments) {
        // Cancel appointment
        app.status = AppointmentStatus.CANCELLED;
        app.cancellationReason = `Doctor on approved leave: ${leave.reason || 'Personal schedule adjustment'}`;
        await app.save();

        const patient: any = app.patientId;
        if (patient && patient.email) {
          // Suggest available slots
          const nextDay = new Date(leave.endDate);
          nextDay.setUTCDate(nextDay.getUTCDate() + 1);
          const nextSlots = await SlotService.getAvailableSlots(leave.doctorId as any, nextDay.toISOString().split('T')[0]).catch(() => []);
          const suggestedTimes = nextSlots
            .filter((s) => s.available)
            .slice(0, 3)
            .map((s) => formatDateForDisplay(s.startTime));

          const dateDisplay = formatDateForDisplay(app.slotStartTime);
          const emailHtml = EmailService.templates.doctorLeaveNotice(
            `${patient.firstName} ${patient.lastName}`,
            `${doctor.firstName} ${doctor.lastName}`,
            dateDisplay,
            suggestedTimes.length > 0 ? suggestedTimes : ['Please check online portal for updated availability']
          );

          await NotificationService.queueNotification({
            recipientId: patient._id,
            type: NotificationType.LEAVE_NOTICE,
            subject: `Schedule Update: Dr. ${doctor.lastName} - ${dateDisplay}`,
            body: emailHtml,
            dedupSuffix: `leave-${leave._id}-${app._id}`
          });
        }
      }

      leave.status = LeaveStatus.PROCESSED;
      leave.affectedAppointmentsCount = affectedAppointments.length;
      await leave.save();

      logger.info(`[Agenda] Leave ${leaveId} processed successfully.`);
    } catch (error) {
      logger.error(`[Agenda] Failed to process leave ${leaveId}`, error);
    }
  });
}
