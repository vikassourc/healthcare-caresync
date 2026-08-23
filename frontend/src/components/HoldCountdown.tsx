import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';

interface HoldCountdownProps {
  expiresAt: string;
}

export const HoldCountdown: React.FC<HoldCountdownProps> = ({ expiresAt }) => {
  const { minutes, seconds, isExpired } = useCountdown(expiresAt);

  if (isExpired) {
    return (
      <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-600" />
        <span>Hold Expired. Please re-select your slot.</span>
      </div>
    );
  }

  const isUrgent = minutes === 0 && seconds < 60;

  return (
    <div
      className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
        isUrgent ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-amber-50 text-amber-700'
      }`}
    >
      <Clock className="w-4 h-4" />
      <span>
        Slot reserved: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} remaining to confirm
      </span>
    </div>
  );
};
