import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import doctorRoutes from './doctor.routes';
import appointmentRoutes from './appointment.routes';
import calendarRoutes from './calendar.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/calendar', calendarRoutes);

export default router;
