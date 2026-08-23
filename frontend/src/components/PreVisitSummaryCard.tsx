import React from 'react';
import { Sparkles, HelpCircle, ShieldAlert } from 'lucide-react';
import { PreVisitSummary, UrgencyLevel } from '../types';

interface PreVisitSummaryCardProps {
  summary?: PreVisitSummary;
  patientName?: string;
}

export const PreVisitSummaryCard: React.FC<PreVisitSummaryCardProps> = ({ summary, patientName }) => {
  if (!summary) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sage-300 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-sage-400" />
          <span>AI Clinical Intelligence</span>
        </div>
        <h3 className="font-serif text-2xl font-normal text-cream">No Active Encounter</h3>
        <p className="text-sm text-sage-200/80 leading-relaxed">
          Select an upcoming consultation to review AI symptom triage and suggested diagnostic inquiries.
        </p>
      </div>
    );
  }

  const getUrgencyBadge = (level: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.HIGH:
        return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', label: 'High Urgency' };
      case UrgencyLevel.LOW:
        return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Low Urgency' };
      default:
        return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Medium Urgency' };
    }
  };

  const badge = getUrgencyBadge(summary.urgencyLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sage-300 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-sage-400" />
          <span>AI Pre-Visit Triage</span>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-bold border ${badge.bg}`}>
          {badge.label}
        </span>
      </div>

      {/* Patient Name & Chief Complaint */}
      <div>
        {patientName && <p className="text-xs text-sage-300/80 uppercase font-semibold mb-1">{patientName}</p>}
        <h3 className="font-serif text-xl font-normal text-cream leading-snug">
          "{summary.chiefComplaint}"
        </h3>
      </div>

      {/* Suggested Questions */}
      <div className="bg-sage-800/80 rounded-2xl p-5 border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-sage-200">
          <HelpCircle className="w-4 h-4 text-sage-400" />
          <span>Suggested Diagnostic Inquiries:</span>
        </div>
        <ul className="space-y-2.5">
          {summary.suggestedQuestions.map((q, idx) => (
            <li key={idx} className="text-xs text-cream/90 flex items-start gap-2 leading-relaxed">
              <span className="text-sage-400 font-bold">•</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>

      {summary.llmFailed && (
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Anthropic LLM fallback heuristic applied.</span>
        </div>
      )}
    </div>
  );
};
