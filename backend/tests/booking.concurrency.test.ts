import request from 'supertest';
import { app } from '../src/index';
import { User } from '../src/models/User';
import { DoctorProfile } from '../src/models/DoctorProfile';
import { Appointment } from '../src/models/Appointment';
import { UserRole } from '../src/types';
import { AuthService } from '../src/services/auth.service';

describe('Concurrency & Double-Booking Prevention Suite', () => {
  let doctorUser: any;
  let patientTokens: string[] = [];
  let testSlotDate: Date;

  beforeAll(async () => {
    // Setup test doctor
    doctorUser = await User.create({
      email: `test.doctor.${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: UserRole.DOCTOR,
      firstName: 'Doctor',
      lastName: 'Concurrency'
    });

    await DoctorProfile.create({
      userId: doctorUser._id,
      specialisation: 'Cardiologist',
      slotDurationMinutes: 30,
      workingHours: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' }
      }
    });

    // Create 10 distinct patient users and access tokens
    for (let i = 0; i < 10; i++) {
      const patient = await User.create({
        email: `patient.${i}.${Date.now()}@test.com`,
        passwordHash: 'Password123!',
        role: UserRole.PATIENT,
        firstName: `Patient${i}`,
        lastName: 'Test'
      });
      patientTokens.push(AuthService.generateAccessToken(patient));
    }

    testSlotDate = new Date();
    const day = testSlotDate.getUTCDay();
    const daysUntilMonday = ((1 + 7 - day) % 7) || 7;
    testSlotDate.setUTCDate(testSlotDate.getUTCDate() + daysUntilMonday);
    testSlotDate.setUTCHours(10, 0, 0, 0);
    testSlotDate.setUTCMinutes(0, 0, 0);
  });

  afterAll(async () => {
    await Appointment.deleteMany({});
  });

  test('Fires 10 simultaneous booking requests for the exact same slot -> Exactly 1 success (201) and 9 conflicts (409)', async () => {
    // Fire all 10 requests in true parallel via Promise.all
    const holdPromises = patientTokens.map((token) =>
      request(app)
        .post('/api/appointments/hold')
        .set('Authorization', `Bearer ${token}`)
        .send({
          doctorId: doctorUser._id.toString(),
          slotStartTime: testSlotDate.toISOString()
        })
    );

    const responses = await Promise.all(holdPromises);

    const successResponses = responses.filter((r) => r.status === 201);
    const conflictResponses = responses.filter((r) => r.status === 409);

    // CRITICAL ASSERTION: Exactly 1 Winner
    expect(successResponses.length).toBe(1);
    expect(conflictResponses.length).toBe(9);

    // Verify 409 responses include helpful alternative slot suggestions
    const firstConflict = conflictResponses[0].body;
    expect(firstConflict.success).toBe(false);
    expect(firstConflict.error.message).toMatch(/held|booked|claimed|taken/i);
    expect(Array.isArray(firstConflict.error.details?.nextAvailableSlots)).toBe(true);

    // Verify database only has 1 appointment record for this slot
    const appointmentsInDb = await Appointment.find({
      doctorId: doctorUser._id,
      slotStartTime: testSlotDate
    });
    expect(appointmentsInDb.length).toBe(1);
    expect(appointmentsInDb[0].status).toBe('HELD');
  });
});
