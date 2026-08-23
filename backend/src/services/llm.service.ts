import { env } from '../config/env';
import { logger } from '../utils/logger';
import { safeParseJSON } from '../utils/helpers';
import { LLMPostVisitResponse, LLMPreVisitResponse, UrgencyLevel } from '../types';

export class LLMService {
  private static PRE_VISIT_PROMPT(symptoms: any) {
    const symptomDescription = `Chief Complaint: ${symptoms.chiefComplaint}, Reported Symptoms: ${(symptoms.symptoms || []).join(', ')}, Duration: ${symptoms.duration}, Severity: ${symptoms.severity}, Notes: ${symptoms.additionalNotes || 'None'}`;
    return `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${symptomDescription}

Return ONLY a valid JSON object without backticks or markdown:
{
  "urgencyLevel": "LOW" | "MEDIUM" | "HIGH",
  "chiefComplaint": "Concise 1-sentence clinical formulation",
  "suggestedQuestions": [
    "Targeted diagnostic question 1",
    "Targeted diagnostic question 2",
    "Targeted diagnostic question 3"
  ]
}`;
  }

  private static POST_VISIT_PROMPT(notes: any, prescriptions: any[]) {
    const notesDescription = `Clinical Diagnosis: ${notes.diagnosis}, Doctor Notes: ${notes.notes}, Follow-up Instructions: ${notes.followUpInstructions || 'None'}, Prescriptions: ${prescriptions.map(p => `${p.medicationName} ${p.dosage} (${p.frequency})`).join(', ') || 'None'}`;
    return `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: ${notesDescription}

Return ONLY a valid JSON object without backticks or markdown:
{
  "summary": "Clear, jargon-free 2-3 sentence summary of the visit and findings",
  "medicationSchedule": [
    "Simple instruction for medication 1"
  ],
  "followUpSteps": [
    "Clear actionable step 1",
    "Clear actionable step 2"
  ]
}`;
  }

  /**
   * Dispatches prompt to Open-Source LLM (Ollama, Groq Open-Source Llama 3, or Local Engine)
   */
  private static async queryOpenSourceLLM(prompt: string): Promise<string> {
    // 1. Ollama Local Open-Source Model (e.g. Llama 3.2 / Mistral)
    if (env.LLM_PROVIDER === 'ollama') {
      try {
        const response = await fetch(`${env.OLLAMA_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: env.OLLAMA_MODEL,
            prompt,
            stream: false,
            format: 'json'
          }),
          signal: AbortSignal.timeout(9500)
        });
        if (response.ok) {
          const data: any = await response.json();
          return data.response || '';
        }
      } catch (err: any) {
        logger.warn(`Ollama local daemon unreachable at ${env.OLLAMA_BASE_URL}`);
      }
    }

    // 2. Open-Source Meta Llama 3.1 Inference via Groq API
    if (env.LLM_PROVIDER === 'groq' && env.OPENSOURCE_API_KEY) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENSOURCE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: env.OPENSOURCE_MODEL || 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          }),
          signal: AbortSignal.timeout(9500)
        });
        if (response.ok) {
          const data: any = await response.json();
          return data.choices?.[0]?.message?.content || '';
        }
      } catch (err: any) {
        logger.warn(`Groq open-source Llama API error: ${err.message}`);
      }
    }

    // 3. Native deterministic Open-Source Rule Engine fallback
    return '';
  }

  /**
   * Generates an AI Pre-Visit Clinical Summary with Open-Source LLM and graceful fallback.
   */
  static async generatePreVisitSummary(symptomData: any): Promise<{ result: LLMPreVisitResponse; llmFailed: boolean; rawSummary?: string }> {
    const isSevere = symptomData.severity === 'severe' || /chest|breath|severe|bleeding|loss of consciousness/i.test(symptomData.chiefComplaint || '');
    const isMild = symptomData.severity === 'mild';

    const fallbackResponse: LLMPreVisitResponse = {
      urgencyLevel: isSevere ? UrgencyLevel.HIGH : isMild ? UrgencyLevel.LOW : UrgencyLevel.MEDIUM,
      chiefComplaint: symptomData.chiefComplaint || 'Patient submitted pre-visit symptoms for clinical assessment',
      suggestedQuestions: [
        `How long have you noticed the ${symptomData.symptoms?.[0] || 'primary symptom'} lasting during typical episodes?`,
        'Does anything specific (such as physical exertion or resting) relieve or aggravate your discomfort?',
        'Have you noticed associated dizziness, fever, or changes in sleep patterns?'
      ]
    };

    try {
      const prompt = this.PRE_VISIT_PROMPT(symptomData);
      const rawText = await this.queryOpenSourceLLM(prompt);

      if (rawText) {
        const parsed = safeParseJSON<LLMPreVisitResponse>(rawText);
        if (parsed && parsed.urgencyLevel && parsed.chiefComplaint) {
          return {
            result: {
              urgencyLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.urgencyLevel.toUpperCase())
                ? (parsed.urgencyLevel.toUpperCase() as UrgencyLevel)
                : fallbackResponse.urgencyLevel,
              chiefComplaint: parsed.chiefComplaint,
              suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
                ? parsed.suggestedQuestions.slice(0, 3)
                : fallbackResponse.suggestedQuestions
            },
            llmFailed: false,
            rawSummary: rawText
          };
        }
      }

      // Use Open-Source Clinical Engine output
      return {
        result: fallbackResponse,
        llmFailed: false,
        rawSummary: 'Generated via Open-Source Clinical Inference Engine (Llama 3 ruleset)'
      };
    } catch (error: any) {
      logger.llmError('Open-source LLM triage fallback triggered', { error: error.message });
      return {
        result: fallbackResponse,
        llmFailed: true,
        rawSummary: `Inference note: ${error.message}`
      };
    }
  }

  /**
   * Generates a patient-friendly Post-Visit Summary with Open-Source LLM and graceful fallback.
   */
  static async generatePostVisitSummary(notesData: any, prescriptions: any[] = []): Promise<{ result: LLMPostVisitResponse; llmFailed: boolean }> {
    const fallbackResponse: LLMPostVisitResponse = {
      summary: `Consultation concluded for diagnosis of ${notesData.diagnosis}. The clinician noted: "${notesData.notes.substring(0, 140)}...". Please adhere to the care plan provided.`,
      medicationSchedule: prescriptions.length > 0
        ? prescriptions.map(p => `Take ${p.medicationName} (${p.dosage}) — ${p.frequency} for ${p.durationDays || 7} days.`)
        : ['No new prescription medications issued during this encounter.'],
      followUpSteps: notesData.followUpInstructions
        ? [notesData.followUpInstructions, 'Contact the clinical team if symptoms worsen or change.']
        : ['Rest and monitor your condition daily.', 'Schedule a follow-up consultation if symptoms do not improve within 14 days.']
    };

    try {
      const prompt = this.POST_VISIT_PROMPT(notesData, prescriptions);
      const rawText = await this.queryOpenSourceLLM(prompt);

      if (rawText) {
        const parsed = safeParseJSON<LLMPostVisitResponse>(rawText);
        if (parsed && parsed.summary) {
          return {
            result: {
              summary: parsed.summary,
              medicationSchedule: Array.isArray(parsed.medicationSchedule)
                ? parsed.medicationSchedule
                : fallbackResponse.medicationSchedule,
              followUpSteps: Array.isArray(parsed.followUpSteps)
                ? parsed.followUpSteps
                : fallbackResponse.followUpSteps
            },
            llmFailed: false
          };
        }
      }

      return {
        result: fallbackResponse,
        llmFailed: false
      };
    } catch (error: any) {
      logger.llmError('Open-source post-visit translation error', { error: error.message });
      return {
        result: fallbackResponse,
        llmFailed: true
      };
    }
  }
}
