import { Router } from 'express';
import { z } from 'zod';
import { DoctorController } from '../controllers/doctor.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { UserRole } from '../types';

const router = Router();

// Public / Search endpoints
router.get('/', DoctorController.searchDoctors);
router.get('/search', DoctorController.searchDoctors);
router.get('/:id', DoctorController.getDoctorDetail);
router.get('/:id/slots', DoctorController.getAvailableSlots);

// Doctor Portal Authenticated Actions
const notesSchema = z.object({
  diagnosis: z.string().min(1),
  notes: z.string().min(1),
  followUpInstructions: z.string().optional()
});

const prescriptionSchema = z.object({
  medicationName: z.string().min(1),
  form: z.string().optional(),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  timing: z.string().optional(),
  route: z.string().optional(),
  durationDays: z.number().optional(),
  refills: z.number().optional(),
  instructions: z.string().optional()
});

router.get('/portal/appointments', authenticate, authorize(UserRole.DOCTOR), DoctorController.getMyAppointments);
router.get('/portal/appointments/:id', authenticate, authorize(UserRole.DOCTOR), DoctorController.getAppointmentDetail);
router.get('/portal/appointments/:id/prescription-pdf', authenticate, DoctorController.downloadPrescriptionPDF);
router.post('/portal/appointments/:id/notes', authenticate, authorize(UserRole.DOCTOR), validate(notesSchema), DoctorController.submitPostVisitNotes);
router.post('/portal/appointments/:id/prescription', authenticate, authorize(UserRole.DOCTOR), validate(prescriptionSchema), DoctorController.createPrescription);
router.put('/portal/appointments/:id/status', authenticate, authorize(UserRole.DOCTOR), DoctorController.updateStatus);

export default router;
