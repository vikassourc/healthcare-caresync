import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Search, ArrowLeft, CheckCircle2, Calendar, Mail } from 'lucide-react';
import { doctorApi, appointmentApi } from '../../services/api';
import { DoctorProfile, SlotInfo, Appointment } from '../../types';
import { DoctorCard } from '../../components/DoctorCard';
import { AppointmentCalendar } from '../../components/AppointmentCalendar';
import { SlotPicker } from '../../components/SlotPicker';
import { SymptomForm } from '../../components/SymptomForm';
import { HoldCountdown } from '../../components/HoldCountdown';
import { getGoogleCalendarUrl } from '../../utils/calendar';

export const BookAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [heldAppointment, setHeldAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    doctorApi.searchDoctors().then((res) => {
      if (res.data.success && res.data.data) {
        setDoctors(res.data.data);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      setLoadingSlots(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const docUser: any = selectedDoctor.userId;
      const doctorId = docUser?._id || selectedDoctor.userId;
      doctorApi
        .getAvailableSlots(doctorId, dateStr)
        .then((res) => {
          if (res.data.success && res.data.data) {
            setSlots(res.data.data);
          }
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDoctor, selectedDate]);

  const handleSelectDoctor = (doc: DoctorProfile) => {
    setSelectedDoctor(doc);
    setStep(2);
  };

  const handleHoldSlot = async (slot: SlotInfo) => {
    setSelectedSlot(slot);
    try {
      const docUser: any = selectedDoctor?.userId;
      const doctorId = docUser?._id || selectedDoctor?.userId;
      const res = await appointmentApi.holdSlot(
        doctorId,
        new Date(slot.startTime).toISOString()
      );
      if (res.data.success && res.data.data) {
        setHeldAppointment(res.data.data);
        toast.success('Slot held for 5 minutes! Complete your symptom details to confirm.');
        setStep(3);
      }
    } catch (err: any) {
      const conflictMsg = err.response?.data?.error?.message || 'Slot could not be held.';
      toast.error(conflictMsg);
      // Refresh slots
      if (selectedDoctor) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const docUser: any = selectedDoctor.userId;
        const doctorId = docUser?._id || selectedDoctor.userId;
        doctorApi.getAvailableSlots(doctorId, dateStr).then((res) => {
          if (res.data.data) setSlots(res.data.data);
        });
      }
    }
  };

  const handleConfirmAppointment = async (symptomData: any) => {
    if (!heldAppointment) return;
    setIsSubmitting(true);
    try {
      const res = await appointmentApi.confirmAppointment(heldAppointment._id, symptomData);
      if (res.data.success) {
        toast.success('Appointment booked and confirmed successfully!');
        setStep(4);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to confirm booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stepper Progress */}
      <div className="bg-surface-white rounded-3xl p-6 shadow-card flex items-center justify-between">
        {[
          { num: 1, label: 'Choose Specialist' },
          { num: 2, label: 'Select Date & Slot' },
          { num: 3, label: 'Symptom Triage' },
          { num: 4, label: 'Confirmed' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s.num
                  ? 'bg-coral-500 text-white shadow-md shadow-coral-500/25'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-surface-light text-gray-400'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-navy-900">{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Search & Pick Doctor */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-surface-white rounded-3xl p-6 shadow-card flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by doctor name or medical specialisation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm text-navy-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctors
              .filter((d: any) => {
                const name = `${d.userId?.firstName} ${d.userId?.lastName}`.toLowerCase();
                return (
                  name.includes(searchQuery.toLowerCase()) ||
                  d.specialisation.toLowerCase().includes(searchQuery.toLowerCase())
                );
              })
              .map((doc) => (
                <DoctorCard key={doc._id} doctor={doc} onBook={handleSelectDoctor} />
              ))}
          </div>
        </div>
      )}

      {/* STEP 2: Pick Calendar Date and Available Time Slot */}
      {step === 2 && selectedDoctor && (
        <div className="space-y-6">
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-coral-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Doctor</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AppointmentCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <div className="bg-surface-white rounded-3xl p-6 sm:p-7 shadow-card space-y-4">
              <div>
                <h4 className="text-base font-bold text-navy-900">
                  Available Slots: {format(selectedDate, 'MMM d, yyyy')}
                </h4>
                <p className="text-xs text-gray-400">
                  Select an open time slot to reserve it for 5 minutes.
                </p>
              </div>

              <SlotPicker
                slots={slots}
                selectedSlot={selectedSlot}
                onSelectSlot={handleHoldSlot}
                isLoading={loadingSlots}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Pre-visit Symptom Triage Form (with Hold Countdown) */}
      {step === 3 && heldAppointment && (
        <div className="bg-surface-white rounded-3xl p-8 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
            <div>
              <h3 className="text-xl font-bold text-navy-900">Pre-Visit Symptom Submission</h3>
              <p className="text-xs text-gray-400">
                Dr. {selectedDoctor?.specialisation} will review this prior to your consultation.
              </p>
            </div>
            {heldAppointment.holdExpiresAt && (
              <HoldCountdown expiresAt={heldAppointment.holdExpiresAt} />
            )}
          </div>

          <SymptomForm onSubmit={handleConfirmAppointment} isSubmitting={isSubmitting} />
        </div>
      )}

      {/* STEP 4: Success Confirmation */}
      {step === 4 && (
        <div className="card-glass rounded-[32px] p-8 sm:p-10 shadow-glass border border-white/90 bg-white/90 backdrop-blur-2xl text-center space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h3 className="font-serif text-3xl font-normal text-sage-900 leading-tight">
              Consultation Confirmed!
            </h3>
            <p className="text-xs text-ink-muted mt-1.5 max-w-sm mx-auto">
              Your appointment with{' '}
              <strong className="text-sage-900">
                Dr. {selectedDoctor?.userId ? `${(selectedDoctor.userId as any).firstName} ${(selectedDoctor.userId as any).lastName}` : 'Specialist'}
              </strong>{' '}
              has been successfully booked.
            </p>
          </div>

          {/* Appointment Summary Box */}
          <div className="bg-sage-50/80 p-5 rounded-2xl border border-sage-200/70 text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-muted">Date & Time:</span>
              <span className="font-bold text-sage-900">
                {selectedSlot ? format(new Date(selectedSlot.startTime), 'EEEE, MMMM d, yyyy · hh:mm a') : 'Confirmed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Specialisation:</span>
              <span className="font-bold text-sage-900">{selectedDoctor?.specialisation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                CONFIRMED & HELD
              </span>
            </div>
          </div>

          {/* Integrations Action Strip: Google Calendar + Email */}
          <div className="space-y-3 pt-2">
            {selectedSlot && (
              <a
                href={getGoogleCalendarUrl({
                  title: `Consultation: Dr. ${(selectedDoctor?.userId as any)?.lastName || 'Specialist'} (${selectedDoctor?.specialisation || 'Doctor'})`,
                  doctorName: `${(selectedDoctor?.userId as any)?.firstName || ''} ${(selectedDoctor?.userId as any)?.lastName || 'Specialist'}`,
                  startTime: selectedSlot.startTime,
                  endTime: selectedSlot.endTime,
                  details: `CareSync Clinical Appointment with Dr. ${(selectedDoctor?.userId as any)?.lastName}. Please arrive 10 minutes before your slot.`
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-pill bg-white hover:bg-sage-50 text-sage-900 font-bold text-xs border border-sage-300 shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Calendar className="w-4 h-4 text-sage-700" />
                <span>Add to Google Calendar (1-Click Sync)</span>
              </a>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-800 font-semibold bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60">
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Confirmation Email Dispatched to Your Inbox</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/patient/dashboard')}
            className="btn-sage-pill w-full py-3.5 text-xs shadow-pill cursor-pointer"
          >
            Return to Patient Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
