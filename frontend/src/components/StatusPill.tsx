import React from 'react';
import { AppointmentStatus } from '../types';

interface StatusPillProps {
  status: AppointmentStatus | string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return { dot: 'bg-sage-700', text: 'Confirmed', bg: 'bg-sage-100 text-sage-900' };
      case AppointmentStatus.COMPLETED:
        return { dot: 'bg-emerald-600', text: 'Completed', bg: 'bg-emerald-50 text-emerald-800' };
      case AppointmentStatus.HELD:
        return { dot: 'bg-amber-600', text: 'Held (5m)', bg: 'bg-amber-50 text-amber-900' };
      case AppointmentStatus.CANCELLED:
        return { dot: 'bg-gray-400', text: 'Cancelled', bg: 'bg-gray-100 text-gray-700' };
      case AppointmentStatus.NO_SHOW:
        return { dot: 'bg-rose-600', text: 'No Show', bg: 'bg-rose-50 text-rose-800' };
      default:
        return { dot: 'bg-gray-400', text: status, bg: 'bg-gray-100 text-gray-700' };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.text}
    </span>
  );
};
