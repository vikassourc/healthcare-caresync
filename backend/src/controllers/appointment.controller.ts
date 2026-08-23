import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BookingService } from '../services/booking.service';
import { Appointment } from '../models/Appointment';
import { SymptomForm } from '../models/SymptomForm';
import { PreVisitSummary } from '../models/PreVisitSummary';
import { PostVisitSummary } from '../models/PostVisitSummary';
import { Prescription } from '../models/Prescription';
import { AuthRequest } from '../types';
import { NotFoundError } from '../utils/errors';

export class AppointmentController {
  static async holdSlot(req: AuthRequest, res: Response) {
    const { doctorId, slotStartTime } = req.body;
    const appointment = await BookingService.holdSlot({
      patientId: req.user!._id,
      doctorId,
      slotStartTime: new Date(slotStartTime)
    });
    res.status(StatusCodes.CREATED).json({ success: true, data: appointment });
  }

  static async confirmAppointment(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const symptomFormData = req.body.symptomForm || req.body;
    const appointment = await BookingService.confirmAppointment({
      appointmentId: id,
      patientId: req.user!._id.toString(),
      symptomForm: symptomFormData
    });
    res.status(StatusCodes.OK).json({ success: true, data: appointment });
  }

  static async cancelAppointment(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const appointment = await BookingService.cancelAppointment(id, req.user!._id.toString(), reason);
    res.status(StatusCodes.OK).json({ success: true, data: appointment });
  }

  static async getMyAppointments(req: AuthRequest, res: Response) {
    const appointments = await Appointment.find({ patientId: req.user!._id })
      .populate('doctorId', 'firstName lastName email')
      .sort({ slotStartTime: -1 });
    res.status(StatusCodes.OK).json({ success: true, data: appointments });
  }

  static async getAppointmentDetail(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const appointment = await Appointment.findOne({
      _id: id,
      $or: [{ patientId: req.user!._id }, { doctorId: req.user!._id }]
    })
      .populate('doctorId', 'firstName lastName email')
      .populate('patientId', 'firstName lastName email');

    if (!appointment) throw new NotFoundError('Appointment not found');

    const [symptoms, preVisitSummary, postVisitSummary, prescriptions] = await Promise.all([
      SymptomForm.findOne({ appointmentId: appointment._id }),
      PreVisitSummary.findOne({ appointmentId: appointment._id }),
      PostVisitSummary.findOne({ appointmentId: appointment._id }),
      Prescription.find({ appointmentId: appointment._id })
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        appointment,
        symptoms,
        preVisitSummary,
        postVisitSummary,
        prescriptions
      }
    });
  }

  static async getMyPrescriptions(req: AuthRequest, res: Response) {
    const prescriptions = await Prescription.find({ patientId: req.user!._id })
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({ success: true, data: prescriptions });
  }

  static async getMyNotifications(req: AuthRequest, res: Response) {
    const { NotificationLog } = await import('../models/NotificationLog');
    const logs = await NotificationLog.find({ recipientId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(StatusCodes.OK).json({ success: true, data: logs });
  }
}
