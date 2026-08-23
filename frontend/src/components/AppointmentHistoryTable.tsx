import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Appointment } from '../types';
import { StatusPill } from './StatusPill';

interface AppointmentHistoryTableProps {
  appointments: Appointment[];
  isDoctorView?: boolean;
}

export const AppointmentHistoryTable: React.FC<AppointmentHistoryTableProps> = ({
  appointments,
  isDoctorView
}) => {
  if (!appointments.length) {
    return (
      <div className="card-glass rounded-[28px] p-8 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl text-center text-sm text-ink-muted">
        No appointment history found.
      </div>
    );
  }

  return (
    <div className="card-glass rounded-[28px] p-6 sm:p-7 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl overflow-hidden">
      <h3 className="font-serif text-lg font-normal text-sage-900 mb-4">Consultation History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-sage-200/60 text-xs text-ink-muted font-semibold uppercase tracking-wider">
              <th className="pb-3 px-2">{isDoctorView ? 'Patient' : 'Doctor'}</th>
              <th className="pb-3 px-2">Date & Time</th>
              <th className="pb-3 px-2">Status</th>
              <th className="pb-3 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-200/60">
            {appointments.map((app) => {
              const party: any = isDoctorView ? app.patientId : app.doctorId;
              const linkPath = isDoctorView
                ? `/doctor/appointments/${app._id}`
                : `/patient/appointments/${app._id}`;

              return (
                <tr key={app._id} className="hover:bg-sage-50/60 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-ink flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sage-900 text-cream text-xs flex items-center justify-center font-bold">
                      {party?.firstName?.[0] || 'U'}
                    </div>
                    <span>{party?.firstName} {party?.lastName}</span>
                  </td>
                  <td className="py-3.5 px-2 text-ink-muted text-xs font-medium">
                    {format(new Date(app.slotStartTime), 'MMM d, yyyy · hh:mm a')}
                  </td>
                  <td className="py-3.5 px-2">
                    <StatusPill status={app.status} />
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <Link
                      to={linkPath}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sage-900 hover:text-sage-700"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
