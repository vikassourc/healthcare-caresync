import { agenda } from '../config/agenda';
import { defineHoldExpiryJob } from './holdExpiry.job';
import { defineEmailSenderJob } from './emailSender.job';
import { defineLLMProcessorJobs } from './llmProcessor.job';
import { defineLeaveProcessorJob } from './leaveProcessor.job';
import { defineMedicationReminderJobs } from './medicationReminder.job';
import { logger } from '../utils/logger';

export async function registerBackgroundJobs(): Promise<void> {
  defineHoldExpiryJob(agenda);
  defineEmailSenderJob(agenda);
  defineLLMProcessorJobs(agenda);
  defineLeaveProcessorJob(agenda);
  defineMedicationReminderJobs(agenda);

  // Schedule recurring hold expiry monitor every 60 seconds
  await agenda.every('60 seconds', 'expire-stale-holds');

  logger.info('All background jobs (Hold Expiry, Email, LLM, Leave, Medication) registered.');
}
