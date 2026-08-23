import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public Google Auth URL generation (for Sign-In and Sign-Up)
router.get('/auth-url', CalendarController.getAuthUrl);
router.get('/callback', CalendarController.handleCallback);
router.delete('/disconnect', authenticate, CalendarController.disconnect);

export default router;
