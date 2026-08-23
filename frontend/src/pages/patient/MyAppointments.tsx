import React, { useEffect, useState } from 'react';
import { appointmentApi } from '../../services/api';
import { AppointmentHistoryTable } from '../../components/AppointmentHistoryTable';
import { Appointment } from '../../types';

export const PatientMyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    appointmentApi.getMyAppointments().then((res) => {
      if (res.data.success && res.data.data) {
        setAppointments(res.data.data);
      }
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">My Consultation History</h2>
        <p className="text-xs text-gray-400 mt-1">Review past and upcoming specialist visits</p>
      </div>
      <AppointmentHistoryTable appointments={appointments} isDoctorView={false} />
    </div>
  );
};
