import React, { useEffect, useState } from 'react';
import { Pill, Clock, Calendar, Stethoscope, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { format } from 'date-fns';
import { appointmentApi } from '../../services/api';
import { Prescription } from '../../types';

export const PatientPrescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentApi
      .getMyPrescriptions()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setPrescriptions(res.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="font-serif text-3xl font-normal text-sage-900 leading-tight">
          Active Prescriptions & Medication Reminders
        </h2>
        <p className="text-xs text-ink-muted font-medium mt-1">
          Detailed medication schedules, dosage instructions, and automated 9:00 AM daily care alerts
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-ink-muted text-xs">Loading active prescriptions...</div>
      ) : !prescriptions.length ? (
        <div className="card-glass rounded-[28px] p-12 text-center text-ink-muted space-y-3 shadow-glass border border-white/80 bg-white/75">
          <Pill className="w-10 h-10 text-sage-600/40 mx-auto" />
          <h4 className="font-serif text-lg text-sage-900">No Active Prescriptions on File</h4>
          <p className="text-xs max-w-sm mx-auto">
            When your doctor issues medications during a consultation, your digital prescription and reminder schedule will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((p) => {
            const doc: any = p.doctorId;
            return (
              <div
                key={p._id}
                className="card-glass rounded-[28px] p-7 shadow-glass border border-white/80 bg-white/80 backdrop-blur-xl space-y-5 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-sage-900 text-cream flex items-center justify-center shadow-md flex-shrink-0">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-serif font-normal text-xl text-sage-900 leading-tight">
                        {p.medicationName}
                      </h4>
                      <p className="text-xs text-sage-700 font-semibold mt-0.5">
                        {p.form || 'Tablet'} · {p.dosage}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200/60">
                    Active
                  </span>
                </div>

                {/* Detailed Clinical Specification Grid */}
                <div className="bg-sage-50/70 p-4 rounded-2xl text-xs space-y-2.5 text-ink border border-sage-200/60">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10.5px] uppercase font-semibold text-ink-muted block">Frequency</span>
                      <span className="font-semibold text-sage-900">{p.frequency}</span>
                    </div>
                    <div>
                      <span className="text-[10.5px] uppercase font-semibold text-ink-muted block">Food Timing</span>
                      <span className="font-semibold text-sage-900">{p.timing || 'After food'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sage-200/60">
                    <div>
                      <span className="text-[10.5px] uppercase font-semibold text-ink-muted block">Course Duration</span>
                      <span className="font-semibold text-sage-900">{p.durationDays} Days</span>
                    </div>
                    <div>
                      <span className="text-[10.5px] uppercase font-semibold text-ink-muted block">Administration</span>
                      <span className="font-semibold text-sage-900">{p.route || 'Oral'}</span>
                    </div>
                  </div>

                  {p.instructions && (
                    <div className="pt-2 border-t border-sage-200/60">
                      <span className="text-[10.5px] uppercase font-semibold text-ink-muted block">Doctor Notes</span>
                      <span className="text-xs text-sage-800 italic">{p.instructions}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-sage-200/60 flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-sage-700" />
                      <span>Dr. {doc?.firstName ? `${doc.firstName} ${doc.lastName}` : 'Specialist'}</span>
                    </span>
                    <span>Refills: {p.refills || 0}</span>
                  </div>
                </div>

                {/* Download PDF & Reminder Alert Strip */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (p.appointmentId) appointmentApi.downloadPrescriptionPDF(p.appointmentId, doc?.lastName || 'Specialist');
                    }}
                    className="w-full py-2.5 rounded-pill bg-white hover:bg-sage-50 text-sage-900 font-bold text-xs border border-sage-300 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-sage-700" />
                    <span>Download Signed Prescription (PDF)</span>
                  </button>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-bold bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-200/50">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Scheduled Daily 9:00 AM Reminder Notifications</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
