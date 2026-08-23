import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle, Clock, Pill } from 'lucide-react';
import { DashboardShell } from '../../layouts/DashboardShell';
import { NextAppointmentHero } from '../../components/NextAppointmentHero';
import { ProfileCard } from '../../components/ProfileCard';
import { StatsCard } from '../../components/StatsCard';
import { AppointmentCalendar } from '../../components/AppointmentCalendar';
import { AppointmentHistoryTable } from '../../components/AppointmentHistoryTable';
import { appointmentApi } from '../../services/api';
import { Appointment, AppointmentStatus } from '../../types';

export const PatientDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    appointmentApi
      .getMyAppointments()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setAppointments(res.data.data);
        }
      });
  }, []);

  const nextAppointment = appointments.find(
    (a) =>
      a.status === AppointmentStatus.CONFIRMED &&
      new Date(a.slotStartTime).getTime() > Date.now()
  );

  const completedCount = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length;
  const activeCount = appointments.filter((a) => a.status === AppointmentStatus.CONFIRMED).length;

  const statTiles = [
    { label: 'Upcoming Consultations', value: activeCount, icon: CalendarDays },
    { label: 'Completed Visits', value: completedCount, icon: CheckCircle },
    { label: 'Prescriptions On File', value: '3 Active', icon: Pill },
    { label: 'Care Reminders', value: 'Daily 9:00 AM', icon: Clock }
  ];

  return (
    <DashboardShell heroContent={<NextAppointmentHero appointment={nextAppointment} />}>
      {/* Row 1: Profile + Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileCard />
        <StatsCard tiles={statTiles} />
      </div>

      {/* Row 2: Interactive Monthly Calendar */}
      <AppointmentCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        highlightedDates={appointments.map((a) => new Date(a.slotStartTime))}
      />

      {/* Row 3: Full Encounter History */}
      <AppointmentHistoryTable appointments={appointments} isDoctorView={false} />
    </DashboardShell>
  );
};
