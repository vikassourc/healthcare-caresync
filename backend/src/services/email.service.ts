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
  private static getTransporter() {
    const smtpUser = env.SMTP_USER || 'vsrivastava873@gmail.com';
    const smtpPass = (env.SMTP_PASS || 'tiztxgffnamwgggc').replace(/\s+/g, '');

    if (smtpUser && smtpPass) {
      // Use port 587 with STARTTLS — port 465 is blocked on many cloud hosts including Render
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,         // STARTTLS (upgrades to TLS after connect)
        requireTLS: true,      // Force TLS upgrade
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    if (env.SENDGRID_API_KEY) {
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: env.SENDGRID_API_KEY
        }
      });
    }

    return null;
  }

  static async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: EmailAttachment[]
  ): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      if (!transporter) {
        logger.warn(`No email transporter configured. Email to ${to} printed to console.`);
        logger.info(`[MOCK EMAIL TO ${to}] Subject: ${subject}`);
        return true;
      }

      const fromAddress = env.EMAIL_FROM || env.SMTP_USER || 'vsrivastava873@gmail.com';
      const info = await transporter.sendMail({
        from: `CareSync Healthcare <${fromAddress}>`,
        to,
        subject,
        html,
        attachments: attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      });

      logger.info(`Email successfully dispatched to ${to}. MessageId: ${info.messageId} (Response: ${info.response})`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to deliver email to ${to}: ${error.message}`, error);
      return false;
    }
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
        <div style="background: #2E3B24; padding: 20px; border-radius: 14px; text-align: center; margin-bottom: 24px;">
          <h2 style="color: #F6F3EA; margin: 0; font-size: 22px;">Thank You for Visiting Dr. ${doctorName}</h2>
          <p style="color: #A3B18A; font-size: 12px; margin-top: 6px;">Official Digital Prescription & Care Instructions Attached</p>
        </div>

        <p style="color: #23281F; font-size: 14px;">Dear <strong>${patientName}</strong>,</p>
        <p style="color: #444444; font-size: 14px; line-height: 1.6;">
          Thank you for consulting with <strong>Dr. ${doctorName}</strong> (${specialisation}) on <strong>${dateStr}</strong>.
          Your consultation notes have been finalized and your digital prescription is ready.
        </p>

        ${
          diagnosis
            ? `
          <div style="background: #FFFFFF; padding: 14px; border-radius: 12px; border: 1px solid #E0DDD3; margin: 16px 0;">
            <p style="margin: 0; color: #2E3B24; font-size: 12px; font-weight: bold; text-transform: uppercase;">Clinical Diagnosis</p>
            <p style="margin: 4px 0 0 0; color: #23281F; font-size: 13px;">${diagnosis}</p>
          </div>
        `
            : ''
        }

        <h3 style="color: #2E3B24; font-size: 15px; margin-top: 20px; margin-bottom: 10px;">Prescription Medications (Rx):</h3>
        <table style="width: 100%; border-collapse: collapse; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E0DDD3; font-size: 12px;">
          <thead>
            <tr style="background: #4A5D38; color: #FFFFFF; text-align: left;">
              <th style="padding: 10px 12px;">Medication</th>
              <th style="padding: 10px 12px;">Dosage</th>
              <th style="padding: 10px 12px;">Frequency</th>
              <th style="padding: 10px 12px;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${prescriptions
              .map(
                (p, idx) => `
              <tr style="border-bottom: 1px solid #EEEEEE; background: ${idx % 2 === 0 ? '#FAFAFA' : '#FFFFFF'};">
                <td style="padding: 10px 12px; font-weight: bold; color: #23281F;">
                  ${p.medicationName} <span style="font-size: 10px; color: #6F8657;">(${p.form || 'Tablet'})</span>
                  ${p.instructions ? `<br><span style="font-size: 10px; font-weight: normal; color: #777;">Note: ${p.instructions}</span>` : ''}
                </td>
                <td style="padding: 10px 12px; color: #555555;">${p.dosage}</td>
                <td style="padding: 10px 12px; color: #555555;">${p.frequency}</td>
                <td style="padding: 10px 12px; color: #555555;">${p.durationDays || 7} Days (${p.timing || 'After food'})</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="background: #E8F5E9; padding: 14px; border-radius: 12px; border: 1px solid #C8E6C9; margin-top: 20px;">
          <p style="margin: 0; color: #2E7D32; font-size: 12px; font-weight: bold;">📎 PDF Attachment Included</p>
          <p style="margin: 4px 0 0 0; color: #388E3C; font-size: 11px;">
            A signed copy of your prescription is attached to this email. You can also view and print your active prescriptions anytime from your CareSync portal.
          </p>
        </div>

        <div style="border-top: 1px solid #E0DDD3; margin-top: 24px; padding-top: 14px; text-align: center; color: #888888; font-size: 11px;">
          CareSync Healthcare Network • Dr. ${doctorName} Practice Office
        </div>
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
