import React, { useEffect, useState } from 'react';
import { Users, CalendarCheck, Clock, CheckCircle } from 'lucide-react';
import { DashboardShell } from '../../layouts/DashboardShell';
import { PreVisitSummaryCard } from '../../components/PreVisitSummaryCard';
import { ProfileCard } from '../../components/ProfileCard';
import { StatsCard } from '../../components/StatsCard';
import { AppointmentCalendar } from '../../components/AppointmentCalendar';
import { AppointmentHistoryTable } from '../../components/AppointmentHistoryTable';
import { doctorApi } from '../../services/api';
import { Appointment, PreVisitSummary } from '../../types';

export const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [focusedSummary, setFocusedSummary] = useState<PreVisitSummary | undefined>();
  const [focusedPatientName, setFocusedPatientName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    doctorApi.getPortalAppointments().then((res) => {
      if (res.data.success && res.data.data) {
        setAppointments(res.data.data);
        // Automatically fetch AI summary of first active upcoming encounter
        const firstActive = res.data.data[0];
        if (firstActive) {
          const patient: any = firstActive.patientId;
          setFocusedPatientName(`${patient?.firstName} ${patient?.lastName}`);
          doctorApi.getPortalAppointmentDetail(firstActive._id).then((dRes) => {
            if (dRes.data.data?.preVisitSummary) {
              setFocusedSummary(dRes.data.data.preVisitSummary);
            }
          });
        }
      }
    });
  }, []);

  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  const statTiles = [
    { label: "Today's Consultations", value: appointments.length, icon: CalendarCheck },
    { label: 'Completed Visits', value: completedCount, icon: CheckCircle },
    { label: 'Total Patients', value: '42 Total', icon: Users },
    { label: 'Slot Duration', value: '30 min', icon: Clock }
  ];

  return (
    <DashboardShell
      heroContent={
        <PreVisitSummaryCard
          summary={focusedSummary}
          patientName={focusedPatientName}
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileCard />
        <StatsCard tiles={statTiles} />
      </div>

      <AppointmentCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        highlightedDates={appointments.map((a) => new Date(a.slotStartTime))}
      />

      <AppointmentHistoryTable appointments={appointments} isDoctorView={true} />
    </DashboardShell>
  );
};
