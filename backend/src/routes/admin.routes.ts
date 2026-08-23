import { Router } from 'express';
import { z } from 'zod';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

const createDoctorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  specialisation: z.string().min(1),
  slotDurationMinutes: z.number().optional(),
  bio: z.string().optional()
});

const leaveSchema = z.object({
  doctorId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional()
});

router.get('/dashboard-stats', AdminController.getDashboardStats);
router.get('/doctors', AdminController.listDoctors);
router.post('/doctors', validate(createDoctorSchema), AdminController.createDoctor);
router.put('/doctors/:id', AdminController.updateDoctor);
router.post('/doctors/leave', validate(leaveSchema), AdminController.markDoctorLeave);
router.get('/leaves', AdminController.listLeaves);
router.get('/notifications/dead-letter', AdminController.getDeadLetterQueue);
router.post('/notifications/:id/retry', AdminController.retryNotification);

export default router;
