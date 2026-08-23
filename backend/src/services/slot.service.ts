import { Types } from 'mongoose';
import { DoctorProfile } from '../models/DoctorProfile';
import { Appointment } from '../models/Appointment';
import { AppointmentStatus, SlotInfo } from '../types';
import { NotFoundError } from '../utils/errors';
import { generateSlots } from '../utils/helpers';

export class SlotService {
  /**
   * Generates all available slots for a doctor on a given date by:
   * 1. Inspecting doctor working hours from DoctorProfile
   * 2. Generating discrete time slots by slotDurationMinutes
   * 3. Checking existing HELD & CONFIRMED appointments
   * 4. Flagging unavailable and past slots accurately
   */
  static async getAvailableSlots(doctorId: string | Types.ObjectId, dateStr: string): Promise<SlotInfo[]> {
    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctorProfile) {
      throw new NotFoundError('Doctor profile not found');
    }

    const queryDate = new Date(dateStr);
    if (isNaN(queryDate.getTime())) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    // Set time window for the entire day (UTC)
    const dayStart = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 0, 0, 0));
    const dayEnd = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 23, 59, 59, 999));

    // Generate potential slots based on working hours
    const allSlots = generateSlots(dayStart, doctorProfile.workingHours, doctorProfile.slotDurationMinutes);

    // Fetch all active appointments for this doctor on this day
    const activeAppointments = await Appointment.find({
      doctorId,
      slotStartTime: { $gte: dayStart, $lte: dayEnd },
      status: { $in: [AppointmentStatus.HELD, AppointmentStatus.CONFIRMED] }
    });

    const bookedStartTimes = new Set(
      activeAppointments.map((app) => app.slotStartTime.getTime())
    );

    const now = new Date();

    // Mark availability: slot must not be booked AND must be strictly in the future (removes passed slots for today)
    return allSlots.map((slot) => {
      const isPast = slot.startTime.getTime() <= now.getTime();
      const isBooked = bookedStartTimes.has(slot.startTime.getTime());
      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: !isBooked && !isPast
      };
    });
  }
}
