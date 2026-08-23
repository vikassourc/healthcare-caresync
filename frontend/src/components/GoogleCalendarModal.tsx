import React, { useState } from 'react';
import { Calendar, CheckCircle2, ExternalLink, X, Key, Zap, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getGoogleCalendarUrl } from '../utils/calendar';
import { calendarApi } from '../services/api';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({ isOpen, onClose }) => {
  const [authorizing, setAuthorizing] = useState(false);

  if (!isOpen) return null;

  const handleAuthorizeGoogle = async () => {
    setAuthorizing(true);
    try {
      const res = await calendarApi.getAuthUrl();
      if (res.data.data?.url) {
        window.open(res.data.data.url, '_blank');
        toast.success('Google OAuth sign-in window opened');
      }
    } catch {
      toast.error('Could not initiate Google OAuth. Please check backend connection.');
    } finally {
      setAuthorizing(false);
    }
  };

  const sampleCalendarUrl = getGoogleCalendarUrl({
    title: 'Clinical Consultation: Dr. Rajesh Sharma (Cardiologist)',
    doctorName: 'Rajesh Sharma',
    patientName: 'Aarav Gupta',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
    details: 'CareSync Healthcare Consultation. Please arrive 10 minutes prior to your scheduled time.'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/60 backdrop-blur-sm">
      <div className="card-glass w-full max-w-xl rounded-[32px] shadow-glass border border-white/90 bg-white/95 backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-sage-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sage-900 text-cream flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-sage-900">
                Google Calendar & OAuth Integration
              </h3>
              <p className="text-xs text-ink-muted">
                Official Google Calendar OAuth 2.0 Client Connected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-sage-100 text-ink-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-xs text-ink">
          
          {/* Section 1: Live OAuth 2.0 Account Authorization */}
          <div className="bg-sage-50/80 p-5 rounded-2xl border border-sage-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sage-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sage-700" />
                <span>Google OAuth 2.0 Account Authorization</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Configured
              </span>
            </div>
            <p className="text-ink-muted text-xs leading-relaxed">
              Authorize CareSync to sync consultation appointments and doctor schedules directly with your personal Google Calendar account.
            </p>
            <button
              onClick={handleAuthorizeGoogle}
              disabled={authorizing}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-sage-900 hover:bg-sage-800 text-cream font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-sage-300" />
              <span>{authorizing ? 'Opening Google...' : 'Sign in with Google Account'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section 2: Instant 1-Click Direct Sync */}
          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>1-Click Direct Sync (Pre-filled Event)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
                Active on All Visits
              </span>
            </div>
            <p className="text-emerald-800 text-xs leading-relaxed">
              You can also click <strong>"Add to Google Calendar"</strong> on any confirmed booking to immediately open Google Calendar with time, doctor specialization, and preparation notes pre-filled.
            </p>
            <a
              href={sampleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-cream font-bold text-xs shadow-sm transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Test Sample Calendar Event</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-sage-100/60 border-t border-sage-200/60 flex items-center justify-between text-xs text-ink-muted">
          <span className="flex items-center gap-1.5 text-sage-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Client ID: 979550335571...</span>
          </span>
          <button
            onClick={onClose}
            className="btn-sage-pill py-1.5 px-4 text-xs shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
