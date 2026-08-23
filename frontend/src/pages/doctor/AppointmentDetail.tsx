import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Pill, Clock, CheckCircle2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi, appointmentApi } from '../../services/api';
import { PreVisitSummaryCard } from '../../components/PreVisitSummaryCard';
import { PostVisitSummaryCard } from '../../components/PostVisitSummaryCard';
import { StatusPill } from '../../components/StatusPill';

export const DoctorAppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq] = useState('');
  const [duration, setDuration] = useState(7);
  const [instructions, setInstructions] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);

  const fetchDetail = () => {
    if (!id) return;
    doctorApi.getPortalAppointmentDetail(id).then((res) => {
      if (res.data.success) {
        setData(res.data.data);
        if (res.data.data.postVisitNote) {
          setDiagnosis(res.data.data.postVisitNote.diagnosis || '');
          setNotes(res.data.data.postVisitNote.notes || '');
          setFollowUp(res.data.data.postVisitNote.followUpInstructions || '');
        }
      }
    });
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSubmitNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotes(true);
    try {
      await doctorApi.submitNotes(id!, { diagnosis, notes, followUpInstructions: followUp });
      toast.success('Clinical notes saved & encounter marked COMPLETED.');
      fetchDetail();
    } catch {
      toast.error('Failed to submit clinical notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !dosage || !freq) {
      toast.error('Please enter medication name, dosage, and frequency');
      return;
    }
    setSavingPrescription(true);
    try {
      await doctorApi.createPrescription(id!, {
        medicationName: medName,
        dosage,
        frequency: freq,
        durationDays: duration,
        instructions
      });
      toast.success(`Prescription for ${medName} saved and daily 9:00 AM reminders scheduled!`);
      setMedName('');
      setDosage('');
      setFreq('');
      setInstructions('');
      fetchDetail();
    } catch {
      toast.error('Failed to save prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  if (!data) {
    return (
      <div className="p-12 text-center text-ink-muted flex items-center justify-center gap-2">
        <Clock className="w-5 h-5 animate-spin text-sage-700" />
        <span>Loading patient clinical encounter...</span>
      </div>
    );
  }

  const { appointment, preVisitSummary, postVisitSummary, prescriptions = [] } = data;
  const patient = appointment.patientId;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link
        to="/doctor/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-sage-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Clinical Overview</span>
      </Link>

      {/* Patient Header Card */}
      <div className="card-glass rounded-[28px] p-6 sm:p-8 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sage-900 text-cream font-bold text-lg flex items-center justify-center shadow-md flex-shrink-0">
            {patient?.firstName?.[0]}{patient?.lastName?.[0]}
          </div>
          <div>
            <h2 className="font-serif font-normal text-2xl text-sage-900 leading-tight">
              {patient?.firstName} {patient?.lastName}
            </h2>
            <p className="text-xs text-ink-muted font-medium mt-0.5">
              {patient?.email} · {patient?.phone || '+91 Contact on File'}
            </p>
          </div>
        </div>
        <StatusPill status={appointment.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: AI Pre-Visit Triage Panel */}
        <div className="lg:col-span-5 bg-sage-900 rounded-[28px] p-7 shadow-glass text-cream border border-sage-700/40 lg:sticky lg:top-8">
          <PreVisitSummaryCard
            summary={preVisitSummary}
            patientName={`${patient?.firstName} ${patient?.lastName}`}
          />
        </div>

        {/* Right Column: Documentation & Prescription Forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Post-Visit Clinical Documentation Form */}
          <div className="card-glass rounded-[28px] p-7 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl space-y-4">
            <h3 className="font-serif text-lg font-normal text-sage-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sage-700" />
              <span>Clinical Examination & Notes</span>
            </h3>

            <form onSubmit={handleSubmitNotes} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Primary Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Essential Hypertension / Exertional Angina Workup"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sage-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Encounter Notes & Observations *
                </label>
                <textarea
                  rows={4}
                  placeholder="Vitals review, cardiovascular auscultation, clinical findings..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sage-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Follow-up Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Repeat ECG in 2 weeks; maintain daily BP log"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sage-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-600"
                />
              </div>

              <button
                type="submit"
                disabled={savingNotes}
                className="w-full btn-sage-pill py-3 text-xs shadow-pill flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{savingNotes ? 'Saving & Generating AI Summary...' : 'Save Clinical Notes & Complete Visit'}</span>
              </button>
            </form>
          </div>

          {/* Issue Prescription Section */}
          <div className="card-glass rounded-[28px] p-7 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl space-y-4">
            <h3 className="font-serif text-lg font-normal text-sage-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-sage-700" />
              <span>Issue Prescription & Schedule Reminders</span>
            </h3>

            <form onSubmit={handleAddPrescription} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-ink-muted mb-1">Medication Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Telmisartan"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-2xl bg-white/80 border border-sage-200 text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-ink-muted mb-1">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 40mg"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-2xl bg-white/80 border border-sage-200 text-sm text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-ink-muted mb-1">Frequency</label>
                  <input
                    type="text"
                    placeholder="e.g. Once Daily (Morning)"
                    value={freq}
                    onChange={(e) => setFreq(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-2xl bg-white/80 border border-sage-200 text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-ink-muted mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-2 rounded-2xl bg-white/80 border border-sage-200 text-sm text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-ink-muted mb-1">Instructions / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Take after breakfast with water"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl bg-white/80 border border-sage-200 text-sm text-ink"
                />
              </div>

              <button
                type="submit"
                disabled={savingPrescription}
                className="w-full btn-sage-pill py-2.5 text-xs shadow-pill flex items-center justify-center gap-2 cursor-pointer bg-sage-800 hover:bg-sage-900"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>{savingPrescription ? 'Saving Prescription...' : 'Save Prescription & Queue 9:00 AM Reminders'}</span>
              </button>
            </form>

            {/* Saved Prescriptions List for this Visit */}
            {prescriptions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-sage-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sage-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active Prescriptions Issued ({prescriptions.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (id) appointmentApi.downloadPrescriptionPDF(id, appointment?.doctorId?.lastName || 'Specialist');
                    }}
                    className="px-3 py-1.5 rounded-full bg-sage-900 hover:bg-sage-800 text-cream text-[11px] font-bold shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-sage-300" />
                    <span>Download Signed PDF</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {prescriptions.map((p: any) => (
                    <div key={p._id} className="p-3.5 rounded-2xl bg-sage-50 border border-sage-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-sage-900">{p.medicationName} ({p.dosage})</p>
                        <p className="text-ink-muted">{p.frequency} · {p.durationDays} Days</p>
                        {p.instructions && <p className="text-sage-700 italic mt-0.5">{p.instructions}</p>}
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Active Reminders
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Patient-Friendly Generated Summary (if generated) */}
          {postVisitSummary && (
            <PostVisitSummaryCard summary={postVisitSummary} />
          )}
        </div>
      </div>
    </div>
  );
};
