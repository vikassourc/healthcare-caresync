import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { User } from '../models/User';
import { DoctorProfile } from '../models/DoctorProfile';
import { DoctorLeave } from '../models/DoctorLeave';
import { Appointment } from '../models/Appointment';
import { NotificationService } from '../services/notification.service';
import { agenda } from '../config/agenda';
import { UserRole } from '../types';
import { NotFoundError } from '../utils/errors';

export class AdminController {
  static async getDashboardStats(_req: Request, res: Response) {
    const [totalDoctors, totalPatients, totalAppointments, pendingLeave, deadLetterNotifications] = await Promise.all([
      User.countDocuments({ role: UserRole.DOCTOR }),
      User.countDocuments({ role: UserRole.PATIENT }),
      Appointment.countDocuments(),
      DoctorLeave.countDocuments({ status: 'PENDING' }),
      NotificationService.getDeadLetterNotifications(1, 5)
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        pendingLeave,
        deadLetterCount: deadLetterNotifications.total
      }
    });
  }

  static async listDoctors(_req: Request, res: Response) {
    const doctors = await DoctorProfile.find().populate('userId', 'firstName lastName email phone avatarUrl');
    res.status(StatusCodes.OK).json({ success: true, data: doctors });
  }

  static async createDoctor(req: Request, res: Response) {
    const { email, password, firstName, lastName, phone, specialisation, workingHours, slotDurationMinutes, bio } = req.body;

    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password,
      firstName,
      lastName,
      role: UserRole.DOCTOR,
      phone
    });
    await user.save();

    const profile = await DoctorProfile.create({
      userId: user._id,
      specialisation: specialisation || 'General Medicine',
      workingHours,
      slotDurationMinutes: slotDurationMinutes || 30,
      bio
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: { user, profile }
    });
  }

  static async updateDoctor(req: Request, res: Response) {
    const { id } = req.params;
    const { specialisation, workingHours, slotDurationMinutes, bio, firstName, lastName } = req.body;

    const profile = await DoctorProfile.findById(id);
    if (!profile) throw new NotFoundError('Doctor profile not found');

    if (specialisation) profile.specialisation = specialisation;
    if (workingHours) profile.workingHours = workingHours;
    if (slotDurationMinutes) profile.slotDurationMinutes = slotDurationMinutes;
    if (bio !== undefined) profile.bio = bio;
    await profile.save();

    if (firstName || lastName) {
      await User.findByIdAndUpdate(profile.userId, {
        ...(firstName && { firstName }),
        ...(lastName && { lastName })
      });
    }

    res.status(StatusCodes.OK).json({ success: true, data: profile });
  }

  static async markDoctorLeave(req: Request, res: Response) {
    const { doctorId, startDate, endDate, reason } = req.body;

    const leave = await DoctorLeave.create({
      doctorId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'PENDING'
    });

    // Enqueue async fan-out worker job immediately (Admin returns in <50ms)
    await agenda.now('process-doctor-leave', { leaveId: leave._id.toString() });

    res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: 'Doctor leave registered. Conflicting appointment notifications are processing asynchronously.',
      data: leave
    });
  }

  static async listLeaves(_req: Request, res: Response) {
    const leaves = await DoctorLeave.find().populate('doctorId', 'firstName lastName email').sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({ success: true, data: leaves });
  }

  static async getDeadLetterQueue(req: Request, res: Response) {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const result = await NotificationService.getDeadLetterNotifications(page, limit);
    res.status(StatusCodes.OK).json({ success: true, data: result });
  }

  static async retryNotification(req: Request, res: Response) {
    const { id } = req.params;
    const success = await NotificationService.retryNotification(id);
    if (!success) throw new NotFoundError('Notification not found');
    res.status(StatusCodes.OK).json({ success: true, message: 'Notification queued for retry' });
  }
}
