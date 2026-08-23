import { Agenda } from 'agenda';
import { SymptomForm } from '../models/SymptomForm';
import { PreVisitSummary } from '../models/PreVisitSummary';
import { PostVisitNote } from '../models/PostVisitNote';
import { PostVisitSummary } from '../models/PostVisitSummary';
import { Prescription } from '../models/Prescription';
import { LLMService } from '../services/llm.service';
import { logger } from '../utils/logger';

export function defineLLMProcessorJobs(agenda: Agenda): void {
  agenda.define('generate-pre-visit-summary', async (job: any) => {
    const { appointmentId } = job.attrs.data;
    if (!appointmentId) return;

    try {
      const symptomForm = await SymptomForm.findOne({ appointmentId });
      if (!symptomForm) {
        logger.warn(`No symptom form found for appointment ${appointmentId}`);
        return;
      }

      const { result, llmFailed, rawSummary } = await LLMService.generatePreVisitSummary(symptomForm);

      await PreVisitSummary.findOneAndUpdate(
        { appointmentId },
        {
          appointmentId,
          urgencyLevel: result.urgencyLevel,
          chiefComplaint: result.chiefComplaint,
          suggestedQuestions: result.suggestedQuestions,
          rawSummary,
          llmFailed
        },
        { upsert: true, new: true }
      );

      logger.info(`[Agenda] Pre-visit AI summary generated for appointment ${appointmentId} (llmFailed: ${llmFailed})`);
    } catch (error) {
      logger.error(`[Agenda] Failed to process pre-visit summary job for ${appointmentId}`, error);
    }
  });

  agenda.define('generate-post-visit-summary', async (job: any) => {
    const { appointmentId } = job.attrs.data;
    if (!appointmentId) return;

    try {
      const [notes, prescriptions] = await Promise.all([
        PostVisitNote.findOne({ appointmentId }),
        Prescription.find({ appointmentId })
      ]);

      if (!notes) {
        logger.warn(`No post-visit notes found for appointment ${appointmentId}`);
        return;
      }

      const { result, llmFailed } = await LLMService.generatePostVisitSummary(notes, prescriptions);

      await PostVisitSummary.findOneAndUpdate(
        { appointmentId },
        {
          appointmentId,
          patientFriendlySummary: result.summary,
          medicationSchedule: result.medicationSchedule,
          followUpSteps: result.followUpSteps,
          llmFailed
        },
        { upsert: true, new: true }
      );

      logger.info(`[Agenda] Post-visit AI summary generated for appointment ${appointmentId} (llmFailed: ${llmFailed})`);
    } catch (error) {
      logger.error(`[Agenda] Failed to process post-visit summary job for ${appointmentId}`, error);
    }
  });
}
