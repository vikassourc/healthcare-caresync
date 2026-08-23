import Agenda from 'agenda';
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export let agenda: Agenda = new Agenda({
  db: { address: env.MONGODB_URI, collection: 'agendaJobs' },
  defaultConcurrency: 5,
  maxConcurrency: 20
});

export async function startAgenda(customUri?: string): Promise<void> {
  try {
    const targetUri = customUri || (mongoose.connection.host === 'localhost' || mongoose.connection.host === '127.0.0.1' ? 'mongodb://localhost:27017/healthcare' : env.MONGODB_URI);
    agenda = new Agenda({
      db: { address: targetUri, collection: 'agendaJobs' },
      defaultConcurrency: 5,
      maxConcurrency: 20
    });
    await agenda.start();
    logger.info('Agenda background job processor started successfully');
  } catch (error) {
    logger.error('Failed to start Agenda background worker', error);
  }
}
