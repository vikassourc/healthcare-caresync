import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { startAgenda } from './config/agenda';
import { registerBackgroundJobs } from './jobs';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '10mb' }));
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.get('/', (req, res) => {
  res.json({
    name: 'CareSync Healthcare API Server',
    status: 'ONLINE',
    version: '1.0.0',
    health: '/api/health',
    doctors: '/api/doctors',
    message: 'Backend is running. Open the frontend static site to access the patient and doctor portal UI.'
  });
});

app.use('/api', apiRouter);

// SMTP Debug endpoint to verify email works from Render's servers
app.get('/api/debug/smtp-test', async (req: any, res: any) => {
  try {
    const { EmailService } = await import('./services/email.service');
    const { env } = await import('./config/env');
    const testEmail = (req.query.to as string) || 'vsrivastava2004dec@gmail.com';
    const smtpUser = env.SMTP_USER || 'vsrivastava873@gmail.com';
    const smtpPass = env.SMTP_PASS || 'tiztxgffnamwgggc';
    const sent = await EmailService.sendEmail(
      testEmail,
      'CareSync SMTP Test from Render Server',
      `<div style="font-family:Arial;padding:20px;"><h2>SMTP Test Email</h2><p>This email was sent directly from the Render backend server at <strong>${new Date().toISOString()}</strong></p><p>SMTP User: ${smtpUser}</p></div>`
    );
    res.json({ success: sent, smtpUser, to: testEmail, timestamp: new Date().toISOString() });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Global Error Handler
app.use(errorHandler);

async function bootstrap() {
  await connectDatabase();
  await startAgenda();
  await registerBackgroundJobs();

  // Auto-seed if database is empty
  const { User } = await import('./models/User');
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    logger.info('Database empty. Automatically populating initial seed roster...');
    const { seed } = await import('./seed');
    await seed();
  }

  if (env.NODE_ENV !== 'test') {
    app.listen(env.PORT, () => {
      logger.info(`Healthcare Appointment API Server running on port ${env.PORT} (${env.NODE_ENV})`);
    });
  }
}

if (env.NODE_ENV !== 'test') {
  bootstrap();
}

export { app, bootstrap };
