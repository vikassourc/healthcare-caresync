import { connectDatabase } from './config/database';
import { User } from './models/User';
import { DoctorProfile } from './models/DoctorProfile';
import { Appointment } from './models/Appointment';
import { SymptomForm } from './models/SymptomForm';
import { PreVisitSummary } from './models/PreVisitSummary';
import { AppointmentStatus, UrgencyLevel, UserRole } from './types';
import { logger } from './utils/logger';

export async function seed() {
  await connectDatabase();
  logger.info('Purging existing database records...');
  await Promise.all([
    User.deleteMany({}),
    DoctorProfile.deleteMany({}),
    Appointment.deleteMany({}),
    SymptomForm.deleteMany({}),
    PreVisitSummary.deleteMany({})
  ]);

  logger.info('Seeding Indian Clinical Specialist roster and accounts...');

  // 1. Admin Account
  const admin = await User.create({
    email: 'admin@healthcarerx.com',
    passwordHash: 'Password123!',
    role: UserRole.ADMIN,
    firstName: 'System',
    lastName: 'Administrator',
    phone: '+91 98765 43210'
  });

  // 2. Indian Doctor Accounts
  const doc1 = await User.create({
    email: 'dr.rajesh.sharma@healthcarerx.com',
    passwordHash: 'Password123!',
    role: UserRole.DOCTOR,
    firstName: 'Rajesh',
    lastName: 'Sharma',
    phone: '+91 98111 22334'
  });

  await DoctorProfile.create({
    userId: doc1._id,
    specialisation: 'Cardiologist',
    slotDurationMinutes: 30,
    bio: 'Senior Consultant Cardiologist with 16+ years of clinical experience in non-invasive cardiovascular imaging, preventive cardiology, and hypertension management (AIIMS New Delhi alumnus).',
    workingHours: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '17:00' },
      sunday: { start: '09:00', end: '17:00' }
    }
  });

  const doc2 = await User.create({
    email: 'dr.ananya.iyer@healthcarerx.com',
    passwordHash: 'Password123!',
    role: UserRole.DOCTOR,
    firstName: 'Ananya',
    lastName: 'Iyer',
    phone: '+91 98222 33445'
  });

  await DoctorProfile.create({
    userId: doc2._id,
    specialisation: 'Neurologist',
    slotDurationMinutes: 30,
    bio: 'Lead Neurologist specializing in migraine diagnostics, neuropathies, vertigo assessment, and clinical neurophysiology.',
    workingHours: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '10:00', end: '16:00' },
      sunday: { start: '10:00', end: '16:00' }
    }
  });

  const doc3 = await User.create({
    email: 'dr.priya.patel@healthcarerx.com',
    passwordHash: 'Password123!',
    role: UserRole.DOCTOR,
    firstName: 'Priya',
    lastName: 'Patel',
    phone: '+91 98333 44556'
  });

  await DoctorProfile.create({
    userId: doc3._id,
    specialisation: 'Dermatologist',
    slotDurationMinutes: 20,
    bio: 'Consultant Dermatologist and Trichologist focused on clinical dermatology, psoriasis, allergy patch testing, and aesthetic medicine.',
    workingHours: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '09:00', end: '15:00' },
      sunday: { start: '09:00', end: '15:00' }
    }
  });

  const doc4 = await User.create({
    email: 'dr.vikram.malhotra@healthcarerx.com',
    passwordHash: 'Password123!',
    role: UserRole.DOCTOR,
    firstName: 'Vikram',
    lastName: 'Malhotra',
    phone: '+91 98444 55667'
  });

  await DoctorProfile.create({
    userId: doc4._id,
    specialisation: 'Orthopedic Surgeon',
    slotDurationMinutes: 30,
    bio: 'Orthopedic Consultant specialized in sports injuries, joint preservation, spine health, and arthroscopic knee/shoulder care.',
    workingHours: {
      monday: { start: '10:00', end: '18:00' },
      tuesday: { start: '10:00', end: '18:00' },
      wednesday: { start: '10:00', end: '18:00' },
      thursday: { start: '10:00', end: '18:00' },
      friday: { start: '10:00', end: '18:00' },
      saturday: { start: '10:00', end: '16:00' },
      sunday: { start: '10:00', end: '16:00' }
    }
  });

  // 3. Indian Patient Accounts
  const patient1 = await User.create({
    email: 'vsrivastava2004dec@gmail.com',
    passwordHash: 'Password123!',
    role: UserRole.PATIENT,
    firstName: 'Vikas',
    lastName: 'Srivastava',
    phone: '+91 97111 88990'
  });

  const patient2 = await User.create({
    email: 'meera.nair@example.com',
    passwordHash: 'Password123!',
    role: UserRole.PATIENT,
    firstName: 'Meera',
    lastName: 'Nair',
    phone: '+91 97222 77889'
  });

  // 4. Sample Appointment with AI Triage Summary for Dr. Rajesh Sharma
  const now = new Date();
  const sampleSlotStart = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  const sampleSlotEnd = new Date(sampleSlotStart.getTime() + 30 * 60 * 1000);

  const sampleApp = await Appointment.create({
    patientId: patient1._id,
    doctorId: doc1._id,
    slotStartTime: sampleSlotStart,
    slotEndTime: sampleSlotEnd,
    status: AppointmentStatus.CONFIRMED
  });

  await SymptomForm.create({
    appointmentId: sampleApp._id,
    chiefComplaint: 'Chest tightness and breathlessness after light climbing',
    symptoms: ['chest discomfort', 'exertional breathlessness', 'palpitations'],
    duration: '5 days',
    severity: 'severe',
    additionalNotes: 'Episodes typically last 5 to 10 minutes and subside with complete rest.'
  });

  await PreVisitSummary.create({
    appointmentId: sampleApp._id,
    urgencyLevel: UrgencyLevel.HIGH,
    chiefComplaint: 'Exertional angina-equivalent discomfort with exertional dyspnea',
    suggestedQuestions: [
      'Does the pressure radiate towards your neck, jaw, or left shoulder?',
      'Have you noticed any episodes of dizziness, cold sweats, or nausea?',
      'Do you have a personal or family history of hypertension or dyslipidemia?'
    ],
    rawSummary: 'Clinical rule engine flagged as high triage priority due to exertional chest tightness.'
  });

  logger.info('=============================================');
  logger.info('Indian Roster Seed Data Populated Successfully:');
  logger.info('Admin:   admin@healthcarerx.com / Password123!');
  logger.info('Doctor:  dr.rajesh.sharma@healthcarerx.com / Password123!');
  logger.info('Doctor:  dr.ananya.iyer@healthcarerx.com / Password123!');
  logger.info('Doctor:  dr.priya.patel@healthcarerx.com / Password123!');
  logger.info('Doctor:  dr.vikram.malhotra@healthcarerx.com / Password123!');
  logger.info('Patient: aarav.gupta@example.com / Password123!');
  logger.info('Patient: meera.nair@example.com / Password123!');
  logger.info('=============================================');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
