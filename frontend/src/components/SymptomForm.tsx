import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Activity, CheckCircle2, ArrowRight } from 'lucide-react';

const symptomSchema = z.object({
  chiefComplaint: z.string().min(3, 'Please describe your chief complaint in at least 3 characters'),
  symptoms: z.string().min(2, 'List at least one primary symptom'),
  duration: z.string().min(1, 'Please state approximately how long you have experienced this'),
  severity: z.enum(['mild', 'moderate', 'severe']),
  additionalNotes: z.string().optional()
});

type SymptomFormData = z.infer<typeof symptomSchema>;

interface SymptomFormProps {
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export const SymptomForm: React.FC<SymptomFormProps> = ({ onSubmit, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SymptomFormData>({
    resolver: zodResolver(symptomSchema),
    defaultValues: { severity: 'moderate' }
  });

  const handleFormSubmit = (data: SymptomFormData) => {
    onSubmit({
      ...data,
      symptoms: data.symptoms.split(',').map((s) => s.trim()).filter(Boolean)
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-sage-900 mb-2">
          Chief Medical Concern / Reason for Visit *
        </label>
        <input
          type="text"
          placeholder="e.g. Sharp pain in lower back after lifting heavy box"
          {...register('chiefComplaint')}
          className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-sage-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-700 text-sm text-ink font-medium shadow-sm transition-all"
        />
        {errors.chiefComplaint && (
          <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.chiefComplaint.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-sage-900 mb-2">
          Primary Symptoms (comma separated) *
        </label>
        <input
          type="text"
          placeholder="e.g. Muscle stiffness, Difficulty bending, Throbbing discomfort"
          {...register('symptoms')}
          className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-sage-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-700 text-sm text-ink font-medium shadow-sm transition-all"
        />
        {errors.symptoms && (
          <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.symptoms.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-sage-900 mb-2">
            Duration *
          </label>
          <input
            type="text"
            placeholder="e.g. 3 days, 2 weeks"
            {...register('duration')}
            className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-sage-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-700 text-sm text-ink font-medium shadow-sm transition-all"
          />
          {errors.duration && (
            <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.duration.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-sage-900 mb-2">
            Perceived Severity *
          </label>
          <select
            {...register('severity')}
            className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-sage-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-700 text-sm text-ink font-medium shadow-sm transition-all"
          >
            <option value="mild">Mild (Noticeable but does not impede daily tasks)</option>
            <option value="moderate">Moderate (Interferes with normal routines)</option>
            <option value="severe">Severe (Significantly debilitating)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-sage-900 mb-2">
          Additional Context or Relevant Medical History
        </label>
        <textarea
          rows={3}
          placeholder="Any existing medications, allergies, or prior similar episodes..."
          {...register('additionalNotes')}
          className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-sage-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-700 text-sm text-ink font-medium shadow-sm transition-all"
        />
      </div>

      {/* Prominent High-Visibility Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-sage-900 hover:bg-sage-800 text-cream font-bold text-sm rounded-pill shadow-pill hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-sage-700"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>
            {isSubmitting
              ? 'Confirming with Clinical System...'
              : 'Confirm Appointment & Submit Symptoms'}
          </span>
          <ArrowRight className="w-4 h-4 text-sage-300" />
        </button>
      </div>
    </form>
  );
};
