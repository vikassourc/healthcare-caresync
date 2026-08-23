import React from 'react';
import { FileText, CheckCircle2, Pill } from 'lucide-react';
import { PostVisitSummary } from '../types';

interface PostVisitSummaryCardProps {
  summary: PostVisitSummary;
}

export const PostVisitSummaryCard: React.FC<PostVisitSummaryCardProps> = ({ summary }) => {
  return (
    <div className="bg-surface-white rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-navy-900">Patient-Friendly Visit Summary</h3>
          <p className="text-xs text-gray-400">Clear translation of clinical findings and care instructions</p>
        </div>
      </div>

      <div className="bg-surface-light p-5 rounded-2xl text-sm text-navy-800 leading-relaxed font-medium">
        {summary.patientFriendlySummary}
      </div>

      {summary.medicationSchedule?.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Pill className="w-3.5 h-3.5 text-coral-500" />
            <span>Medication Schedule</span>
          </h4>
          <ul className="space-y-2">
            {summary.medicationSchedule.map((med, idx) => (
              <li key={idx} className="text-xs text-navy-900 bg-coral-50/50 p-3 rounded-xl font-medium">
                {med}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.followUpSteps?.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Recommended Next Steps</span>
          </h4>
          <ul className="space-y-2">
            {summary.followUpSteps.map((step, idx) => (
              <li key={idx} className="text-xs text-navy-800 flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
