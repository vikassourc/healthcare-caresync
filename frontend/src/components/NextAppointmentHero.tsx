import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Appointment } from '../types';

interface NextAppointmentHeroProps {
  appointment?: Appointment;
}

export const NextAppointmentHero: React.FC<NextAppointmentHeroProps> = ({ appointment }) => {
  if (!appointment) {
    return (
      <div className="space-y-4">
        <span className="text-xs text-sage-300 font-bold uppercase tracking-wider">Patient Overview</span>
        <h3 className="font-serif text-3xl font-normal text-cream">No Upcoming Visits</h3>
        <p className="text-sm text-sage-200/80 leading-relaxed">
          You currently have no scheduled consultations. Book a slot with our specialist network in seconds.
        </p>
        <Link
          to="/patient/book"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cream hover:bg-white text-sage-900 font-bold rounded-pill text-sm shadow-md transition-all mt-2 cursor-pointer"
        >
          <span>Find a Doctor</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const doctor: any = appointment.doctorId;
  const startTime = new Date(appointment.slotStartTime);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs text-sage-300 font-bold uppercase tracking-wider">Next Scheduled Consultation</span>
        <h3 className="font-serif text-3xl font-normal text-cream mt-1">
          Dr. {doctor?.lastName || 'Specialist'}
        </h3>
        <p className="text-sm text-sage-200/80">{doctor?.doctorProfile?.specialisation || 'Clinical Consultation'}</p>
      </div>

      <div className="bg-sage-800/80 rounded-2xl p-5 border border-white/10 space-y-3">
        <div className="flex items-center gap-3 text-sm text-cream">
          <Calendar className="w-4 h-4 text-sage-400" />
          <span>{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-cream">
          <Clock className="w-4 h-4 text-sage-400" />
          <span>{format(startTime, 'hh:mm a')}</span>
        </div>
      </div>

      <Link
        to={`/patient/appointments/${appointment._id}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-cream font-semibold rounded-pill text-xs transition-colors cursor-pointer"
      >
        <span>View Consultation Details</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
