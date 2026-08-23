import React from 'react';
import { Stethoscope, ArrowRight } from 'lucide-react';
import { DoctorProfile } from '../types';

interface DoctorCardProps {
  doctor: DoctorProfile;
  onBook: (doctor: DoctorProfile) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook }) => {
  const user: any = doctor.userId;
  const initials = `${user?.firstName?.[0] || 'D'}${user?.lastName?.[0] || 'R'}`.toUpperCase();

  return (
    <div className="card-glass rounded-[28px] p-6 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl hover:shadow-glass-hover transition-all flex flex-col justify-between">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sage-900 via-sage-800 to-sage-700 text-cream font-serif font-semibold text-lg flex items-center justify-center shadow-md flex-shrink-0 border border-sage-600/30 tracking-wider">
          <span>{initials}</span>
        </div>
        <div>
          <h4 className="font-serif font-normal text-sage-900 text-lg">
            Dr. {user?.firstName} {user?.lastName}
          </h4>
          <p className="text-xs text-sage-700 font-semibold flex items-center gap-1 mt-0.5">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{doctor.specialisation}</span>
          </p>
          <p className="text-xs text-ink-muted mt-2 line-clamp-2 leading-relaxed">
            {doctor.bio || 'Clinical specialist providing dedicated outpatient consultations and treatment plans.'}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-sage-200/60 flex items-center justify-between">
        <span className="text-xs text-ink-muted font-medium">
          {doctor.slotDurationMinutes}m Consultations
        </span>
        <button
          onClick={() => onBook(doctor)}
          className="btn-sage-pill py-2 px-4 text-xs shadow-sm cursor-pointer"
        >
          <span>Select Doctor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
