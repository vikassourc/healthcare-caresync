import { Router } from 'express';
import { z } from 'zod';
import { AppointmentController } from '../controllers/appointment.controller';
import { DoctorController } from '../controllers/doctor.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

const holdSlotSchema = z.object({
  doctorId: z.string().min(1),
  slotStartTime: z.string().min(1)
});

const symptomDetailSchema = z.object({
  chiefComplaint: z.string().min(1),
  symptoms: z.array(z.string()).optional().default([]),
  duration: z.string().min(1),
  severity: z.enum(['mild', 'moderate', 'severe']).default('moderate'),
  additionalNotes: z.string().optional()
});

const confirmSchema = z.union([
  z.object({ symptomForm: symptomDetailSchema }),
  symptomDetailSchema
]);

router.post('/hold', authorize(UserRole.PATIENT), validate(holdSlotSchema), AppointmentController.holdSlot);
router.post('/:id/confirm', authorize(UserRole.PATIENT), validate(confirmSchema), AppointmentController.confirmAppointment);
router.post('/:id/cancel', AppointmentController.cancelAppointment);
router.get('/my-appointments', authorize(UserRole.PATIENT), AppointmentController.getMyAppointments);
router.get('/my-prescriptions', authorize(UserRole.PATIENT), AppointmentController.getMyPrescriptions);
router.get('/my-notifications', AppointmentController.getMyNotifications);
router.get('/:id/prescription-pdf', DoctorController.downloadPrescriptionPDF);
router.get('/:id', AppointmentController.getAppointmentDetail);

export default router;
