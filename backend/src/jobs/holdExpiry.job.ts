import { Agenda } from 'agenda';
import { Appointment } from '../models/Appointment';
import { AppointmentStatus } from '../types';
import { logger } from '../utils/logger';

export function defineHoldExpiryJob(agenda: Agenda): void {
  agenda.define('expire-stale-holds', async () => {
    try {
      const now = new Date();
      const result = await Appointment.updateMany(
        {
          status: AppointmentStatus.HELD,
          holdExpiresAt: { $lt: now }
        },
        {
          $set: { status: AppointmentStatus.EXPIRED },
          $unset: { holdExpiresAt: '' }
        }
      );

      if (result.modifiedCount > 0) {
        logger.info(`[Agenda] Released ${result.modifiedCount} expired slot holds back to available inventory.`);
      }
    } catch (error) {
      logger.error('[Agenda] Error running hold expiry job', error);
    }
  });
}
