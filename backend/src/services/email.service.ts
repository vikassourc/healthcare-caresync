import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
}

export class EmailService {
  private static cachedTransporter: nodemailer.Transporter | null = null;

  private static getTransporter() {
    const smtpUser = process.env.SMTP_USER || env.SMTP_USER || 'vsrivastava873@gmail.com';
    const smtpPass = (process.env.SMTP_PASS || env.SMTP_PASS || 'tiztxgffnamwgggc').replace(/\s+/g, '');

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  static async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: EmailAttachment[]
  ): Promise<boolean> {
    const fromAddress = process.env.EMAIL_FROM || env.EMAIL_FROM || env.SMTP_USER || 'vsrivastava873@gmail.com';

    const mailOptions: any = {
      from: `CareSync Healthcare <${fromAddress}>`,
      to,
      subject,
      html
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType
      }));
    }

    // 1. Primary: Direct Gmail SMTP
    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      logger.info(`[EmailService] Email successfully delivered to ${to}. MessageId: ${info.messageId}`);
      try { transporter.close(); } catch (_) {}
      return true;
    } catch (err: any) {
      logger.warn(`[EmailService] Gmail direct delivery error for ${to}: ${err.message}`);
    }

    // 3. Last resort: Resend HTTP API (if configured)
    const resendKey = process.env.RESEND_API_KEY || '';
    if (resendKey) {
      try {
        const payload: any = {
          from: 'CareSync Healthcare <onboarding@resend.dev>',
          to: [to],
          subject,
          html
        };

        if (attachments && attachments.length > 0) {
          payload.attachments = attachments.map((att) => ({
            filename: att.filename,
            content: Buffer.isBuffer(att.content)
              ? att.content.toString('base64')
              : Buffer.from(att.content as string, 'binary').toString('base64')
          }));
        }

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          logger.info(`[EmailService/Resend] Fallback delivery successful to ${to}`);
          return true;
        }
      } catch (err: any) {
        logger.warn(`[EmailService/Resend] Fallback error: ${err.message}`);
      }
    }

    return false;
  }

  static templates = {
    bookingConfirmation: (patientName: string, doctorName: string, dateStr: string) => `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: auto; padding: 28px; background: #FBF9F2; border: 1px solid #E0DDD3; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #2E3B24; margin: 0; font-size: 24px;">Appointment Confirmed</h2>
          <p style="color: #6F8657; font-size: 13px; margin-top: 4px;">CareSync Health Management</p>
        </div>
        <p style="color: #23281F; font-size: 14px;">Dear <strong>${patientName}</strong>,</p>
        <p style="color: #555555; font-size: 14px; line-height: 1.6;">
          Your consultation with <strong>Dr. ${doctorName}</strong> has been successfully booked and confirmed.
        </p>
        <div style="background: #FFFFFF; padding: 18px; border-radius: 14px; border: 1px solid #E0DDD3; margin: 20px 0;">
          <p style="margin: 6px 0; color: #23281F; font-size: 13px;"><strong>Date & Time:</strong> ${dateStr}</p>
          <p style="margin: 6px 0; color: #23281F; font-size: 13px;"><strong>Status:</strong> <span style="color: #2E7D32; font-weight: bold; background: #E8F5E9; padding: 3px 8px; border-radius: 6px;">CONFIRMED</span></p>
        </div>
        <p style="color: #555555; font-size: 13px;">Please arrive 10 minutes prior to your scheduled consultation window. You can also sync this directly to your Google Calendar from your patient dashboard.</p>
        <div style="border-top: 1px solid #E0DDD3; margin-top: 24px; padding-top: 14px; text-align: center; color: #888888; font-size: 11px;">
          CareSync Clinical Platform • Automated Healthcare Notification
        </div>
      </div>
    `,

    prescriptionIssued: (
      patientName: string,
      doctorName: string,
      specialisation: string,
      dateStr: string,
      diagnosis: string,
      prescriptions: any[]
    ) => `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 620px; margin: auto; padding: 28px; background: #FBF9F2; border: 1px solid #E0DDD3; border-radius: 20px;">
        <div style="background: #2E3B24; color: #FFFFFF; padding: 22px; border-radius: 14px; text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 22px;">Official Medical Prescription</h2>
          <p style="color: #ADC296; font-size: 13px; margin-top: 4px;">Dr. ${doctorName} (${specialisation})</p>
        </div>
        <p style="color: #23281F; font-size: 14px;">Dear <strong>${patientName}</strong>,</p>
        <p style="color: #555555; font-size: 14px; line-height: 1.6;">
          Thank you for your clinical consultation on <strong>${dateStr}</strong>. Your digitally verified medical prescription is attached to this email as a PDF.
        </p>
        ${diagnosis ? `
        <div style="background: #FFFFFF; padding: 14px; border-radius: 12px; border: 1px solid #E0DDD3; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #2E3B24;"><strong>Diagnosis:</strong> ${diagnosis}</p>
        </div>` : ''}
        <div style="background: #FFFFFF; padding: 16px; border-radius: 14px; border: 1px solid #E0DDD3; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #2E3B24;">Prescribed Medications:</p>
          <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 13px; line-height: 1.8;">
            ${prescriptions.map((p) => `<li><strong>${p.medicationName} (${p.dosage})</strong> - ${p.frequency}, ${p.timing || 'After food'} for ${p.durationDays} days</li>`).join('')}
          </ul>
        </div>
        <div style="background: #E8F5E9; padding: 12px; border-radius: 10px; border: 1px solid #C8E6C9; text-align: center; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12.5px; color: #2E7D32; font-weight: bold;">📎 PDF Attachment Included: CareSync_Prescription_Dr_${doctorName}.pdf</p>
        </div>
        <p style="color: #777777; font-size: 12px; line-height: 1.5;">Daily medication reminders will be sent according to your schedule. You can download this prescription PDF at any time from your patient dashboard.</p>
      </div>
    `,

    cancellationNotice: (patientName: string, doctorName: string, dateStr: string, reason?: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <h2 style="color: #C62828;">Appointment Cancelled</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment with <strong>Dr. ${doctorName}</strong> on ${dateStr} has been cancelled.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>You may log into your patient portal at any time to book an alternate slot.</p>
      </div>
    `,

    doctorLeaveNotice: (patientName: string, doctorName: string, dateStr: string, nextSlots: string[]) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <h2 style="color: #C62828;">Important Schedule Update: Doctor on Leave</h2>
        <p>Dear ${patientName},</p>
        <p>Dr. ${doctorName} has had an urgent schedule change and is on leave for your booked time on <strong>${dateStr}</strong>.</p>
        <p>Your previous booking was safely released. Recommended upcoming available slots with Dr. ${doctorName}:</p>
        <ul>
          ${nextSlots.map((s) => `<li>${s}</li>`).join('')}
        </ul>
        <p>Please visit your dashboard to select your preferred reschedule slot.</p>
      </div>
    `,

    medicationReminder: (patientName: string, medicationName: string, dosage: string, instructions?: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <h2 style="color: #2E3B24;">CareSync Daily Medication Reminder (9:00 AM)</h2>
        <p>Dear ${patientName},</p>
        <p>This is your scheduled clinical reminder to take your prescribed medication:</p>
        <div style="background: #F9F8F5; padding: 15px; border-radius: 8px; border: 1px solid #E0DDD3;">
          <p style="margin: 5px 0;"><strong>Medication:</strong> ${medicationName}</p>
          <p style="margin: 5px 0;"><strong>Dosage:</strong> ${dosage}</p>
          ${instructions ? `<p style="margin: 5px 0;"><strong>Instructions:</strong> ${instructions}</p>` : ''}
        </div>
      </div>
    `,

    doctorNewBookingAlert: (doctorName: string, patientName: string, dateStr: string, chiefComplaint: string, severity: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #FBF9F2; border: 1px solid #E0DDD3; border-radius: 16px;">
        <div style="background: #2E3B24; color: #FFFFFF; padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px;">New Consultation Booked</h2>
          <p style="color: #ADC296; font-size: 12px; margin-top: 4px;">CareSync Doctor Schedule Notification</p>
        </div>
        <p style="color: #23281F; font-size: 14px;">Dear <strong>Dr. ${doctorName}</strong>,</p>
        <p style="color: #555555; font-size: 14px;">A new clinical consultation has been booked on your calendar:</p>
        <div style="background: #FFFFFF; padding: 16px; border-radius: 12px; border: 1px solid #E0DDD3; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Patient:</strong> ${patientName}</p>
          <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${dateStr}</p>
          <p style="margin: 4px 0;"><strong>Chief Complaint:</strong> ${chiefComplaint}</p>
          <p style="margin: 4px 0;"><strong>Reported Severity:</strong> <span style="text-transform: capitalize; font-weight: bold; color: ${severity === 'severe' ? '#C62828' : severity === 'moderate' ? '#E65100' : '#2E7D32'};">${severity}</span></p>
        </div>
        <p style="color: #555555; font-size: 13px;">You can view the patient's full symptom report and AI pre-visit summary from your Doctor Portal dashboard.</p>
      </div>
    `,

    doctorWelcome: (doctorName: string, specialisation: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #FBF9F2; border: 1px solid #E0DDD3; border-radius: 16px;">
        <div style="background: #2E3B24; color: #FFFFFF; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 22px;">Welcome to CareSync Platform</h2>
          <p style="color: #ADC296; font-size: 13px; margin-top: 4px;">Clinical Specialist Portal</p>
        </div>
        <p style="color: #23281F; font-size: 14px;">Dear <strong>Dr. ${doctorName}</strong> (${specialisation}),</p>
        <p style="color: #555555; font-size: 14px; line-height: 1.6;">
          Your doctor account has been successfully registered on the CareSync Clinical Platform.
        </p>
        <div style="background: #FFFFFF; padding: 16px; border-radius: 12px; border: 1px solid #E0DDD3; margin: 16px 0;">
          <p style="margin: 4px 0; color: #2E3B24; font-weight: bold;">Your Clinical Tools:</p>
          <ul style="margin: 8px 0; padding-left: 20px; color: #555555; font-size: 13px; line-height: 1.6;">
            <li><strong>Patient Encounters & Triage:</strong> Review incoming symptoms and AI clinical summaries before consultations.</li>
            <li><strong>Digital Prescriptions:</strong> Issue authenticated PDF prescriptions that automatically email to patients.</li>
            <li><strong>Schedule Management:</strong> Manage working hours and Google Calendar synchronization.</li>
          </ul>
        </div>
      </div>
    `,

    patientWelcome: (patientName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #FBF9F2; border: 1px solid #E0DDD3; border-radius: 16px;">
        <div style="background: #2E3B24; color: #FFFFFF; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 22px;">Welcome to CareSync</h2>
          <p style="color: #ADC296; font-size: 13px; margin-top: 4px;">Healthcare Appointment & Follow-Up Portal</p>
        </div>
        <p style="color: #23281F; font-size: 14px;">Dear <strong>${patientName}</strong>,</p>
        <p style="color: #555555; font-size: 14px; line-height: 1.6;">
          Your CareSync patient account has been created successfully. You can now browse verified specialists, book appointments with instant Google Calendar sync, and receive digital PDF prescriptions after your visits.
        </p>
        <div style="background: #FFFFFF; padding: 16px; border-radius: 12px; border: 1px solid #E0DDD3; margin: 16px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #2E3B24; font-weight: bold;">Ready to schedule your first consultation?</p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #555555;">Log in anytime to view available specialist time slots.</p>
        </div>
      </div>
    `
  };
}
