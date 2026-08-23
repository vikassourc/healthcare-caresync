import React, { useEffect, useState } from 'react';
import { Mail, Clock, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { appointmentApi } from '../services/api';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      appointmentApi
        .getMyNotifications()
        .then((res) => {
          if (res.data.success && res.data.data) {
            setLogs(res.data.data);
            if (res.data.data.length > 0) {
              setSelectedLog(res.data.data[0]);
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/60 backdrop-blur-sm">
      <div className="card-glass w-full max-w-4xl max-h-[85vh] rounded-[32px] shadow-glass border border-white/90 bg-white/95 backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-sage-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sage-900 text-cream flex items-center justify-center shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-sage-900">
                Email Dispatch & Notification Logs
              </h3>
              <p className="text-xs text-ink-muted">
                Audit trail of booking confirmations, calendar links, and daily medication alerts
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

        {/* Content Body: Left List + Right Email Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-sage-200/60">
          
          {/* Left Column: Notification Feed */}
          <div className="md:col-span-5 p-4 overflow-y-auto space-y-2 max-h-[60vh]">
            {loading ? (
              <div className="py-12 text-center text-xs text-ink-muted">Loading dispatch logs...</div>
            ) : !logs.length ? (
              <div className="py-12 text-center text-xs text-ink-muted">
                No email notifications dispatched yet. Book a consultation or issue a prescription to trigger automated alerts.
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?._id === log._id;
                return (
                  <button
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-sage-900 text-cream border-sage-900 shadow-md'
                        : 'bg-white/80 hover:bg-sage-50 text-ink border-sage-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={`font-bold ${isSelected ? 'text-sage-300' : 'text-sage-700'}`}>
                        {log.type}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-sage-300/80' : 'text-ink-muted'}`}>
                        {format(new Date(log.createdAt), 'MMM d, hh:mm a')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold truncate">{log.subject}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px]">
                      <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
                      <span className={isSelected ? 'text-cream/90' : 'text-ink-muted'}>
                        Delivered ({log.channel})
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Live Rendered Email Preview */}
          <div className="md:col-span-7 p-6 overflow-y-auto max-h-[60vh] space-y-4 bg-sage-50/40">
            {selectedLog ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-sage-200 shadow-sm space-y-1.5 text-xs">
                  <div className="flex justify-between text-ink-muted">
                    <span><strong>Subject:</strong> {selectedLog.subject}</span>
                    <span className="font-mono text-[10px] text-sage-800">
                      ID: {selectedLog._id.substring(0, 10)}...
                    </span>
                  </div>
                  <p className="text-ink-muted">
                    <strong>Sent via:</strong> Nodemailer / SendGrid SMTP Engine ({selectedLog.channel})
                  </p>
                </div>

                {/* Styled Email HTML View */}
                <div className="bg-white rounded-2xl p-6 border border-sage-200 shadow-sm">
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedLog.body }}
                    className="prose prose-sm max-w-none text-ink"
                  />
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-ink-muted">
                Select an email from the left feed to preview its delivery payload.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-sage-100/60 border-t border-sage-200/60 flex items-center justify-between text-xs text-ink-muted">
          <span className="flex items-center gap-1.5 text-sage-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Idempotency-Key Deduplication Active (Zero Duplicate Spams)</span>
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
