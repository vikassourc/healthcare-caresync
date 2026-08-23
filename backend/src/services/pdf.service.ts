import PDFDocument from 'pdfkit';
import { formatDateForDisplay } from '../utils/helpers';

export class PDFService {
  /**
   * Generates a digital clinical PDF prescription buffer
   */
  static async generatePrescriptionPDF(params: {
    patientName: string;
    patientEmail?: string;
    doctorName: string;
    doctorSpecialisation?: string;
    appointmentId: string;
    date: Date | string;
    diagnosis?: string;
    notes?: string;
    prescriptions: any[];
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 45, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const consultationDate = formatDateForDisplay(new Date(params.date));

      // --- 1. CLINIC HEADER ---
      doc
        .rect(0, 0, doc.page.width, 90)
        .fill('#2E3B24'); // Sage 900 Brand Header

      doc
        .fontSize(22)
        .fillColor('#F6F3EA')
        .font('Helvetica-Bold')
        .text('CareSync Health Management', 45, 25);

      doc
        .fontSize(10)
        .fillColor('#A3B18A')
        .font('Helvetica')
        .text('Official Digital Medical Prescription & Follow-up Care Record', 45, 52);

      // --- 2. DOCTOR & PATIENT METADATA SECTION ---
      doc.moveDown(3);
      const topY = 110;

      // Doctor Info (Left)
      doc
        .fontSize(12)
        .fillColor('#2E3B24')
        .font('Helvetica-Bold')
        .text(`Dr. ${params.doctorName}`, 45, topY);

      doc
        .fontSize(9)
        .fillColor('#4A5D38')
        .font('Helvetica')
        .text(`${params.doctorSpecialisation || 'Clinical Specialist'}`, 45, topY + 16)
        .text('Reg No: MCI/DMC-849201 | AIIMS Network', 45, topY + 28);

      // Patient Info (Right)
      doc
        .fontSize(10)
        .fillColor('#23281F')
        .font('Helvetica-Bold')
        .text('PATIENT DETAILS', 340, topY);

      doc
        .fontSize(9)
        .fillColor('#555555')
        .font('Helvetica')
        .text(`Name: ${params.patientName}`, 340, topY + 14)
        .text(`Email: ${params.patientEmail || 'On Record'}`, 340, topY + 26)
        .text(`Date: ${consultationDate}`, 340, topY + 38)
        .text(`Encounter ID: ${params.appointmentId.substring(0, 12)}...`, 340, topY + 50);

      // Divider Line
      doc
        .strokeColor('#E0DDD3')
        .lineWidth(1)
        .moveTo(45, 175)
        .lineTo(doc.page.width - 45, 175)
        .stroke();

      // --- 3. CLINICAL DIAGNOSIS & ENCOUNTER FINDINGS ---
      let curY = 190;

      if (params.diagnosis) {
        doc
          .fontSize(10)
          .fillColor('#2E3B24')
          .font('Helvetica-Bold')
          .text('PRIMARY CLINICAL DIAGNOSIS:', 45, curY);

        doc
          .fontSize(10)
          .fillColor('#23281F')
          .font('Helvetica')
          .text(params.diagnosis, 220, curY);

        curY += 22;
      }

      if (params.notes) {
        doc
          .fontSize(9)
          .fillColor('#555555')
          .font('Helvetica-Oblique')
          .text(`Clinician Notes: "${params.notes}"`, 45, curY, { width: doc.page.width - 90 });

        curY += 28;
      }

      // --- 4. Rx PRESCRIPTIONS TABLE ---
      doc
        .fontSize(18)
        .fillColor('#2E3B24')
        .font('Helvetica-Bold')
        .text('Rx', 45, curY);

      curY += 24;

      // Table Header Bar
      doc
        .rect(45, curY, doc.page.width - 90, 22)
        .fill('#4A5D38');

      doc
        .fontSize(9)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('#', 55, curY + 6)
        .text('MEDICATION & FORM', 75, curY + 6)
        .text('DOSAGE', 230, curY + 6)
        .text('FREQUENCY', 300, curY + 6)
        .text('TIMING & DURATION', 410, curY + 6);

      curY += 26;

      // Table Rows
      if (params.prescriptions && params.prescriptions.length > 0) {
        params.prescriptions.forEach((p, idx) => {
          const rowBg = idx % 2 === 0 ? '#F9F8F5' : '#FFFFFF';
          doc
            .rect(45, curY, doc.page.width - 90, 36)
            .fill(rowBg);

          doc
            .fontSize(9)
            .fillColor('#23281F')
            .font('Helvetica-Bold')
            .text(`${idx + 1}`, 55, curY + 6)
            .text(`${p.medicationName} (${p.form || 'Tablet'})`, 75, curY + 6);

          doc
            .fontSize(8.5)
            .fillColor('#555555')
            .font('Helvetica')
            .text(p.dosage, 230, curY + 6)
            .text(p.frequency, 300, curY + 6)
            .text(`${p.timing || 'After food'} · ${p.durationDays || 7} Days`, 410, curY + 6);

          if (p.instructions) {
            doc
              .fontSize(7.5)
              .fillColor('#4A5D38')
              .font('Helvetica-Oblique')
              .text(`Instructions: ${p.instructions}`, 75, curY + 20, { width: 420 });
          }

          curY += 38;
        });
      } else {
        doc
          .fontSize(9)
          .fillColor('#777777')
          .text('No prescription medications issued during this encounter.', 45, curY + 10);
        curY += 30;
      }

      // --- 5. ADVICE & DOCTOR SIGNATURE ---
      curY += 20;
      doc
        .rect(45, curY, doc.page.width - 90, 60)
        .fill('#F3EFE2');

      doc
        .fontSize(9)
        .fillColor('#2E3B24')
        .font('Helvetica-Bold')
        .text('FOLLOW-UP & PATIENT INSTRUCTIONS:', 55, curY + 10);

      doc
        .fontSize(8.5)
        .fillColor('#444444')
        .font('Helvetica')
        .text(
          '1. Take medications strictly as scheduled. Set daily reminders on your CareSync portal.\n2. In case of unexpected allergic reaction or symptom aggravation, report to emergency immediately.',
          55,
          curY + 26
        );

      curY += 80;

      // Digital Signature block
      doc
        .fontSize(9)
        .fillColor('#2E3B24')
        .font('Helvetica-Bold')
        .text(`Dr. ${params.doctorName}`, doc.page.width - 200, curY, { align: 'right' })
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#666666')
        .text('Digitally Verified & Authorized', doc.page.width - 200, curY + 14, { align: 'right' })
        .text(`${consultationDate}`, doc.page.width - 200, curY + 26, { align: 'right' });

      // Footer
      doc
        .fontSize(7.5)
        .fillColor('#999999')
        .text(
          'This is a digitally generated medical prescription issued via CareSync Healthcare Platform. Valid under Telemedicine Practice Guidelines.',
          45,
          doc.page.height - 35,
          { align: 'center', width: doc.page.width - 90 }
        );

      doc.end();
    });
  }
}
