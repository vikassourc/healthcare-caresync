import React, { useEffect, useState } from 'react';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CalendarCheck,
  UserCheck
} from 'lucide-react';
import { doctorApi } from '../../services/api';
import { AppointmentCalendar } from '../../components/AppointmentCalendar';
import { StatusPill } from '../../components/StatusPill';
import { Appointment } from '../../types';

export const DoctorMySchedule: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchSchedule = () => {
    doctorApi
      .getPortalAppointments()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setAppointments(res.data.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Filter appointments specifically for the selected date
  const dayAppointments = appointments.filter((app) => {
    const aDate = new Date(app.slotStartTime);
    return isSameDay(aDate, selectedDate);
  });

  // Standard clinical hourly time slots from 08:00 to 18:00
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Schedule Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-normal text-sage-900 leading-tight">
            Clinical Schedule & Daily Roster
          </h2>
          <p className="text-xs text-ink-muted font-medium mt-1">
            Visual hour-by-hour timeline of booked patient encounters, consultations, and open time slots
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3.5 py-1.5 rounded-full card-glass text-xs font-bold text-sage-900 border border-white/80 hover:bg-white transition-colors cursor-pointer"
          >
            Jump to Today
          </button>
          <div className="flex items-center gap-1 bg-white/70 rounded-full p-1 border border-sage-200">
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-1 rounded-full hover:bg-sage-100 text-ink-muted transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-sage-900">
              {format(selectedDate, 'MMM d')}
            </span>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-1 rounded-full hover:bg-sage-100 text-ink-muted transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Month Calendar & Quick Stats */}
        <div className="lg:col-span-4 space-y-6">
          <AppointmentCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            highlightedDates={appointments.map((a) => new Date(a.slotStartTime))}
          />

          <div className="card-glass rounded-[24px] p-6 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl space-y-3.5">
            <h4 className="font-serif text-base text-sage-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-sage-700" />
              <span>Day Overview</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-sage-200/60">
                <span className="text-ink-muted">Total Consultations:</span>
                <span className="font-bold text-sage-900">{dayAppointments.length} Booked</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-sage-200/60">
                <span className="text-ink-muted">Clinical Hours:</span>
                <span className="font-bold text-sage-900">09:00 AM – 05:00 PM</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-ink-muted">Working Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active Roster
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High-Visibility Hourly Timeline Grid */}
        <div className="lg:col-span-8 card-glass rounded-[28px] p-6 sm:p-8 shadow-glass border border-white/80 bg-white/80 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-sage-200/60">
            <div>
              <h3 className="font-serif text-2xl font-normal text-sage-900 leading-tight">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                {dayAppointments.length === 0
                  ? 'No patient bookings scheduled for this date.'
                  : `${dayAppointments.length} patient consultations scheduled.`}
              </p>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-sage-100 text-xs font-bold text-sage-900">
              {dayAppointments.length} Active Slots
            </span>
          </div>

          {/* Timeline Grid */}
          <div className="space-y-4">
            {timeSlots.map((hourStr) => {
              // Find appointments starting in this hour block
              const matchingApps = dayAppointments.filter((app) => {
                const appDate = new Date(app.slotStartTime);
                const appHour = format(appDate, 'HH:00');
                return appHour === hourStr;
              });

              const [h] = hourStr.split(':');
              const hourNum = parseInt(h, 10);
              const displayTime = format(new Date().setHours(hourNum, 0, 0, 0), 'hh:00 a');

              return (
                <div key={hourStr} className="flex items-start gap-4 group">
                  {/* Time Label */}
                  <div className="w-20 pt-2 text-right text-xs font-bold text-ink-muted flex-shrink-0">
                    {displayTime}
                  </div>

                  {/* Slot Bar / Appointment Blocks */}
                  <div className="flex-1 min-h-[64px] rounded-2xl border border-sage-200/80 bg-white/60 p-2.5 transition-all group-hover:border-sage-300">
                    {matchingApps.length === 0 ? (
                      <div className="h-full flex items-center px-3 text-xs text-ink-muted/40 font-medium">
                        <span>Open Consultation Window</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {matchingApps.map((app: any) => {
                          const patient = app.patientId;
                          const startTime = new Date(app.slotStartTime);

                          return (
                            <div
                              key={app._id}
                              className="p-3.5 rounded-xl bg-sage-900 text-cream shadow-md flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-cream text-sage-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                  {patient?.firstName?.[0] || <UserCheck className="w-4 h-4" />}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-sm text-cream leading-tight">
                                    {patient?.firstName} {patient?.lastName}
                                  </h5>
                                  <p className="text-[11px] text-sage-200/80 mt-0.5 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-sage-400" />
                                    <span>{format(startTime, 'hh:mm a')} (30m Consultation)</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <StatusPill status={app.status} />
                                <Link
                                  to={`/doctor/appointments/${app._id}`}
                                  className="px-3.5 py-1.5 rounded-pill bg-cream text-sage-900 hover:bg-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  <span>Encounter</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
