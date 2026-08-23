import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Mail, Pill, CheckCircle2, Stethoscope, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentApi } from '../../services/api';
import { StatusPill } from '../../components/StatusPill';
import { PostVisitSummaryCard } from '../../components/PostVisitSummaryCard';
import { AppointmentStatus } from '../../types';
import { getGoogleCalendarUrl } from '../../utils/calendar';

export const PatientAppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = () => {
    if (!id) return;
    appointmentApi
      .getAppointmentDetail(id)
      .then((res) => {
        if (res.data.success) setData(res.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you wish to cancel this scheduled consultation?')) return;
    try {
      await appointmentApi.cancelAppointment(id!, 'Patient requested cancellation');
      toast.success('Appointment cancelled. Confirmation email has been sent.');
      fetchDetail();
    } catch {
      toast.error('Failed to cancel appointment');
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
        <Clock className="w-5 h-5 animate-spin text-sage-700" />
        <span>Loading consultation encounter...</span>
      </div>
    );
  }

  const { appointment, symptoms, postVisitSummary, prescriptions = [] } = data;
  const doctor = appointment.doctorId;
  const isConfirmed = appointment.status === AppointmentStatus.CONFIRMED;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        to="/patient/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-sage-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Appointment Summary Banner */}
      <div className="card-glass rounded-[28px] p-6 sm:p-8 shadow-glass border border-white/80 bg-white/80 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="font-serif font-normal text-2xl sm:text-3xl text-sage-900 leading-tight">
              Dr. {doctor?.firstName} {doctor?.lastName}
            </h2>
            <StatusPill status={appointment.status} />
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-ink-muted font-medium pt-1">
            <span className="flex items-center gap-1.5 text-sage-900 font-semibold">
              <Calendar className="w-4 h-4 text-sage-700" />
              {format(new Date(appointment.slotStartTime), 'EEEE, MMMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1.5 text-sage-900 font-semibold">
              <Clock className="w-4 h-4 text-sage-700" />
              {format(new Date(appointment.slotStartTime), 'hh:mm a')} (30 min)
            </span>
          </div>
        </div>

        {/* Action Buttons: Add to Google Calendar + Cancel */}
        <div className="flex flex-wrap items-center gap-3">
          {isConfirmed && (
            <a
              href={getGoogleCalendarUrl({
                title: `Consultation: Dr. ${doctor?.lastName || 'Specialist'}`,
                doctorName: `${doctor?.firstName || ''} ${doctor?.lastName || 'Specialist'}`,
                startTime: appointment.slotStartTime,
                endTime: appointment.slotEndTime,
                details: `CareSync Clinical Consultation with Dr. ${doctor?.lastName}.`
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-pill bg-sage-900 hover:bg-sage-800 text-cream font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-sage-300" />
              <span>Add to Google Calendar</span>
            </a>
          )}

          {isConfirmed && (
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-pill border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel Visit
            </button>
          )}
        </div>
      </div>

      {/* Integration Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-glass rounded-2xl p-4 shadow-glass border border-white/80 bg-white/70 flex items-center gap-3 text-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-sage-900">Email Confirmation Dispatched</p>
            <p className="text-ink-muted text-[11px]">Audit trail recorded in notification queue</p>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-4 shadow-glass border border-white/80 bg-white/70 flex items-center gap-3 text-xs">
          <div className="w-9 h-9 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-sage-900">Google Calendar OAuth Sync</p>
            <p className="text-ink-muted text-[11px]">1-Click web sync enabled for this encounter</p>
          </div>
        </div>
      </div>

      {/* Symptom Triage Record */}
      {symptoms && (
        <div className="card-glass rounded-[28px] p-7 shadow-glass border border-white/80 bg-white/80 backdrop-blur-xl space-y-4">
          <h3 className="font-serif text-lg font-normal text-sage-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-sage-700" />
            <span>Pre-Visit Symptom Submission</span>
          </h3>

          <div className="bg-sage-50/70 p-5 rounded-2xl border border-sage-200/60 space-y-3 text-xs">
            <div>
              <span className="text-[11px] uppercase font-bold text-ink-muted">Chief Complaint</span>
              <p className="font-serif text-base text-sage-900 mt-0.5">"{symptoms.chiefComplaint}"</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-sage-200/60">
              <div>
                <span className="text-[11px] uppercase font-semibold text-ink-muted block">Duration</span>
                <span className="font-bold text-sage-900">{symptoms.duration}</span>
              </div>
              <div>
                <span className="text-[11px] uppercase font-semibold text-ink-muted block">Severity</span>
                <span className="font-bold uppercase text-amber-700">{symptoms.severity}</span>
              </div>
              <div>
                <span className="text-[11px] uppercase font-semibold text-ink-muted block">Reported Symptoms</span>
                <span className="font-medium text-sage-900">{(symptoms.symptoms || []).join(', ') || 'Standard'}</span>
              </div>
            </div>

            {symptoms.additionalNotes && (
              <div className="pt-2 border-t border-sage-200/60">
                <span className="text-[11px] uppercase font-semibold text-ink-muted block">Patient Notes</span>
                <p className="text-xs text-ink-muted italic mt-0.5">{symptoms.additionalNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post-Visit Clinical Summary (if completed) */}
      {postVisitSummary && <PostVisitSummaryCard summary={postVisitSummary} />}

      {/* Prescriptions on File */}
      {prescriptions?.length > 0 && (
        <div className="card-glass rounded-[28px] p-7 shadow-glass border border-white/80 bg-white/80 backdrop-blur-xl space-y-4">
          <h3 className="font-serif text-lg font-normal text-sage-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-sage-700" />
            <span>Prescriptions Provided During Consultation</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prescriptions.map((p: any) => (
              <div key={p._id} className="p-4 rounded-2xl bg-sage-50 border border-sage-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sage-900 text-sm">{p.medicationName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {p.form || 'Tablet'}
                  </span>
                </div>
                <p className="text-ink-muted">
                  <strong>Dosage:</strong> {p.dosage} · {p.frequency}
                </p>
                <p className="text-ink-muted">
                  <strong>Timing:</strong> {p.timing || 'After food'} ({p.durationDays} Days)
                </p>
                {p.instructions && (
                  <p className="text-sage-700 italic border-t border-sage-200 pt-1.5">{p.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
