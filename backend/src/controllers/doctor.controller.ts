import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DoctorProfile } from '../models/DoctorProfile';
import { Appointment } from '../models/Appointment';
import { PostVisitNote } from '../models/PostVisitNote';
import { Prescription } from '../models/Prescription';
import { PreVisitSummary } from '../models/PreVisitSummary';
import { PostVisitSummary } from '../models/PostVisitSummary';
import { SymptomForm } from '../models/SymptomForm';
import { User } from '../models/User';
import { SlotService } from '../services/slot.service';
import { PDFService } from '../services/pdf.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { AuthRequest, AppointmentStatus, NotificationType } from '../types';
import { NotFoundError } from '../utils/errors';
import { formatDateForDisplay } from '../utils/helpers';
import { agenda } from '../config/agenda';

export class DoctorController {
  static async searchDoctors(req: Request, res: Response) {
    const { specialisation, search } = req.query;
    const filter: any = {};
    if (specialisation) {
      filter.specialisation = new RegExp(specialisation as string, 'i');
    }

    const profiles = await DoctorProfile.find(filter).populate('userId', 'firstName lastName email avatarUrl');

    let results = profiles;
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      results = profiles.filter((p: any) => {
        const u = p.userId;
        return (
          u &&
          (searchRegex.test(u.firstName) ||
            searchRegex.test(u.lastName) ||
            searchRegex.test(p.specialisation))
        );
      });
    }

    res.status(StatusCodes.OK).json({ success: true, data: results });
  }

  static async getDoctorDetail(req: Request, res: Response) {
    const profile = await DoctorProfile.findOne({ userId: req.params.id }).populate(
      'userId',
      'firstName lastName email phone bio avatarUrl'
    );
    if (!profile) throw new NotFoundError('Doctor profile not found');
    res.status(StatusCodes.OK).json({ success: true, data: profile });
  }

  static async getAvailableSlots(req: Request, res: Response) {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, error: { message: 'Date query param required (YYYY-MM-DD)' } });
      return;
    }
    const slots = await SlotService.getAvailableSlots(id, date as string);
    res.status(StatusCodes.OK).json({ success: true, data: slots });
  }

  static async getMyAppointments(req: AuthRequest, res: Response) {
    const appointments = await Appointment.find({ doctorId: req.user!._id })
      .populate('patientId', 'firstName lastName email phone avatarUrl')
      .sort({ slotStartTime: 1 });
    res.status(StatusCodes.OK).json({ success: true, data: appointments });
  }

  static async getAppointmentDetail(req: AuthRequest, res: Response) {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.user!._id
    }).populate('patientId', 'firstName lastName email phone');

    if (!appointment) throw new NotFoundError('Appointment not found');

    const [symptoms, preVisitSummary, postVisitNote, postVisitSummary, prescriptions] = await Promise.all([
      SymptomForm.findOne({ appointmentId: appointment._id }),
      PreVisitSummary.findOne({ appointmentId: appointment._id }),
      PostVisitNote.findOne({ appointmentId: appointment._id }),
      PostVisitSummary.findOne({ appointmentId: appointment._id }),
      Prescription.find({ appointmentId: appointment._id })
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        appointment,
        symptoms,
        preVisitSummary,
        postVisitNote,
        postVisitSummary,
        prescriptions
      }
    });
  }

  static async submitPostVisitNotes(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { diagnosis, notes, followUpInstructions } = req.body;

    const appointment = await Appointment.findOne({ _id: id, doctorId: req.user!._id });
    if (!appointment) throw new NotFoundError('Appointment not found');

    const postVisitNote = await PostVisitNote.findOneAndUpdate(
      { appointmentId: appointment._id },
      {
        appointmentId: appointment._id,
        doctorId: req.user!._id,
        diagnosis,
        notes,
        followUpInstructions
      },
      { upsert: true, new: true }
    );

    appointment.status = AppointmentStatus.COMPLETED;
    await appointment.save();

    // Trigger async patient-friendly summary generation via LLM
    await agenda.now('generate-post-visit-summary', { appointmentId: appointment._id.toString() });

    res.status(StatusCodes.OK).json({ success: true, data: postVisitNote });
  }

  static async createPrescription(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { medicationName, form, dosage, frequency, timing, route, durationDays, refills, instructions } =
      req.body;

    const appointment = await Appointment.findOne({ _id: id, doctorId: req.user!._id });
    if (!appointment) throw new NotFoundError('Appointment not found');

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (durationDays || 7) * 24 * 60 * 60 * 1000);

    const prescription = await Prescription.create({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: req.user!._id,
      medicationName,
      form: form || 'Tablet',
      dosage,
      frequency,
      timing: timing || 'After food',
      route: route || 'Oral',
      durationDays: durationDays || 7,
      refills: refills || 0,
      startDate,
      endDate,
      instructions
    });

    // Schedule automated daily medication reminders
    await agenda.now('schedule-prescription-reminders', { prescriptionId: prescription._id.toString() });

    // Asynchronously generate PDF and send "Thank you for visiting Dr. [Name]" email to patient
    (async () => {
      try {
        const [patient, doctor, profile, postNote, allPrescriptions] = await Promise.all([
          User.findById(appointment.patientId),
          User.findById(req.user!._id),
          DoctorProfile.findOne({ userId: req.user!._id }),
          PostVisitNote.findOne({ appointmentId: appointment._id }),
          Prescription.find({ appointmentId: appointment._id })
        ]);

        if (patient && doctor) {
          const pdfBuffer = await PDFService.generatePrescriptionPDF({
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientEmail: patient.email,
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            doctorSpecialisation: profile?.specialisation || 'Clinical Specialist',
            appointmentId: appointment._id.toString(),
            date: appointment.slotStartTime,
            diagnosis: postNote?.diagnosis,
            notes: postNote?.notes,
            prescriptions: allPrescriptions
          });

          const dateDisplay = formatDateForDisplay(new Date(appointment.slotStartTime));
          const emailHtml = EmailService.templates.prescriptionIssued(
            `${patient.firstName} ${patient.lastName}`,
            `${doctor.firstName} ${doctor.lastName}`,
            profile?.specialisation || 'Clinical Specialist',
            dateDisplay,
            postNote?.diagnosis || '',
            allPrescriptions
          );

          // 1. Dispatch Email with attached PDF
          await EmailService.sendEmail(
            patient.email,
            `Official Prescription & Thank You for Visiting Dr. ${doctor.lastName} - CareSync`,
            emailHtml,
            [
              {
                filename: `CareSync_Prescription_Dr_${doctor.lastName}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ]
          );

          // 2. Queue in Notification Log feed
          await NotificationService.queueNotification({
            recipientId: patient._id,
            type: NotificationType.MEDICATION,
            subject: `Official Prescription & Thank You for Visiting Dr. ${doctor.lastName}`,
            body: emailHtml,
            dedupSuffix: `rx_${prescription._id.toString()}`
          });
        }
      } catch (err: any) {
        console.error('Error generating prescription PDF email:', err);
      }
    })();

    res.status(StatusCodes.CREATED).json({ success: true, data: prescription });
  }

  static async downloadPrescriptionPDF(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) throw new NotFoundError('Appointment not found');

    const [patient, doctor, profile, postNote, allPrescriptions] = await Promise.all([
      User.findById(appointment.patientId),
      User.findById(appointment.doctorId),
      DoctorProfile.findOne({ userId: appointment.doctorId }),
      PostVisitNote.findOne({ appointmentId: appointment._id }),
      Prescription.find({ appointmentId: appointment._id })
    ]);

    if (!patient || !doctor) throw new NotFoundError('Encounter parties not found');

    const pdfBuffer = await PDFService.generatePrescriptionPDF({
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientEmail: patient.email,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      doctorSpecialisation: profile?.specialisation || 'Clinical Specialist',
      appointmentId: appointment._id.toString(),
      date: appointment.slotStartTime,
      diagnosis: postNote?.diagnosis,
      notes: postNote?.notes,
      prescriptions: allPrescriptions
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CareSync_Prescription_Dr_${doctor.lastName}.pdf`);
    res.send(pdfBuffer);
  }

  static async updateStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, doctorId: req.user!._id },
      { $set: { status } },
      { new: true }
    );

    if (!appointment) throw new NotFoundError('Appointment not found');

    res.status(StatusCodes.OK).json({ success: true, data: appointment });
  }
}
