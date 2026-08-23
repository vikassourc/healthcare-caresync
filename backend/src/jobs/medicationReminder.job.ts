import { Agenda } from 'agenda';
import { Prescription } from '../models/Prescription';
import { MedicationReminder } from '../models/MedicationReminder';
import { User } from '../models/User';
import { MedicationReminderStatus, NotificationType } from '../types';
import { NotificationService } from '../services/notification.service';
import { EmailService } from '../services/email.service';
import { logger } from '../utils/logger';

export function defineMedicationReminderJobs(agenda: Agenda): void {
  agenda.define('schedule-prescription-reminders', async (job: any) => {
    const { prescriptionId } = job.attrs.data;
    if (!prescriptionId) return;

    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) return;

      const durationDays = prescription.durationDays || 7;
      const startDate = new Date(prescription.startDate);

      for (let day = 0; day < durationDays; day++) {
        const reminderTime = new Date(startDate);
        reminderTime.setDate(reminderTime.getDate() + day);
        reminderTime.setHours(9, 0, 0, 0); // 9:00 AM daily

        const reminder = await MedicationReminder.create({
          prescriptionId: prescription._id,
          patientId: prescription.patientId,
          scheduledAt: reminderTime,
          status: MedicationReminderStatus.PENDING
        });

        await agenda.schedule(reminderTime, 'send-single-medication-reminder', {
          reminderId: reminder._id.toString()
        });
      }

      logger.info(`[Agenda] Scheduled ${durationDays} medication reminders for prescription ${prescriptionId}`);
    } catch (error) {
      logger.error('[Agenda] Error scheduling medication reminders', error);
    }
  });

  agenda.define('send-single-medication-reminder', async (job: any) => {
    const { reminderId } = job.attrs.data;
    if (!reminderId) return;

    try {
      const reminder = await MedicationReminder.findById(reminderId).populate('prescriptionId');
      if (!reminder || reminder.status === MedicationReminderStatus.SENT) return;

      const prescription: any = reminder.prescriptionId;
      const patient = await User.findById(reminder.patientId);

      if (patient && prescription) {
        const emailHtml = EmailService.templates.medicationReminder(
          `${patient.firstName} ${patient.lastName}`,
          prescription.medicationName,
          prescription.dosage,
          prescription.instructions
        );

        await NotificationService.queueNotification({
          recipientId: patient._id,
          type: NotificationType.MEDICATION,
          subject: `Daily Medication Reminder: ${prescription.medicationName}`,
          body: emailHtml,
          dedupSuffix: `reminder-${reminder._id}`
        });

        reminder.status = MedicationReminderStatus.SENT;
        await reminder.save();
      }
    } catch (error) {
      logger.error(`[Agenda] Failed to send medication reminder ${reminderId}`, error);
    }
  });
}
