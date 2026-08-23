import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['patient', 'doctor']).optional(),
  phone: z.string().optional(),
  specialisation: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);

export default router;
