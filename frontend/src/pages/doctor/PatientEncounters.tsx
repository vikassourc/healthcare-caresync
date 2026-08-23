import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Users,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  Stethoscope,
  Activity,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { doctorApi } from '../../services/api';
import { StatusPill } from '../../components/StatusPill';
import { Appointment } from '../../types';

export const DoctorPatientEncounters: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorApi
      .getPortalAppointments()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setAppointments(res.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredAppointments = appointments.filter((app: any) => {
    const patientName = `${app.patientId?.firstName || ''} ${app.patientId?.lastName || ''}`.toLowerCase();
    const patientEmail = (app.patientId?.email || '').toLowerCase();
    const matchesSearch =
      patientName.includes(searchQuery.toLowerCase()) ||
      patientEmail.includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL' || app.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPatientsCount = new Set(appointments.map((a: any) => a.patientId?._id || a.patientId)).size;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const upcomingCount = appointments.filter((a) => a.status === 'CONFIRMED').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header with Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-normal text-sage-900 leading-tight">
            Patient Clinical Encounters
          </h2>
          <p className="text-xs text-ink-muted font-medium mt-1">
            Comprehensive directory of patient consultations, diagnostic summaries, and clinical workflows
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full card-glass text-xs font-semibold text-sage-900 shadow-sm border border-white/80">
            {totalPatientsCount} Unique Patients
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-sage-100 text-xs font-bold text-sage-800">
            {upcomingCount} Upcoming
          </span>
        </div>
      </div>

      {/* Search & Status Filter Toolbar */}
      <div className="card-glass rounded-[24px] p-4 sm:p-5 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-80 bg-white/80 px-4 py-2.5 rounded-2xl border border-sage-200">
          <Search className="w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by patient name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs text-ink focus:outline-none placeholder:text-ink-muted/50"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['ALL', 'CONFIRMED', 'COMPLETED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-pill text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-sage-900 text-white shadow-sm'
                  : 'bg-white/60 text-ink-muted hover:bg-sage-100/70 hover:text-sage-900 border border-sage-200/60'
              }`}
            >
              {status === 'ALL' ? 'All Encounters' : status === 'CONFIRMED' ? 'Upcoming Visits' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Encounters Grid / List */}
      {loading ? (
        <div className="py-16 text-center text-ink-muted flex items-center justify-center gap-2">
          <Activity className="w-5 h-5 animate-spin text-sage-700" />
          <span>Loading patient encounter records...</span>
        </div>
      ) : !filteredAppointments.length ? (
        <div className="card-glass rounded-[28px] p-12 text-center text-ink-muted space-y-3 shadow-glass border border-white/80 bg-white/75">
          <Users className="w-10 h-10 text-sage-600/40 mx-auto" />
          <h4 className="font-serif text-lg text-sage-900">No Patient Encounters Found</h4>
          <p className="text-xs max-w-sm mx-auto">
            No consultations matched your search criteria. Select a different filter or search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((app: any) => {
            const patient = app.patientId;
            const startTime = new Date(app.slotStartTime);
            const isCompleted = app.status === 'COMPLETED';

            return (
              <div
                key={app._id}
                className="card-glass rounded-[24px] p-6 shadow-glass border border-white/80 bg-white/80 backdrop-blur-xl hover:shadow-glass-hover transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Patient Profile & Identification */}
                <div className="flex items-start gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-sage-900 text-cream font-bold text-base flex items-center justify-center shadow-md flex-shrink-0">
                    {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-serif font-normal text-xl text-sage-900 leading-tight">
                        {patient?.firstName} {patient?.lastName}
                      </h4>
                      <StatusPill status={app.status} />
                    </div>

                    <p className="text-xs text-ink-muted font-medium flex items-center gap-2">
                      <span>{patient?.email}</span>
                      <span>•</span>
                      <span>{patient?.phone || '+91 Contact on File'}</span>
                    </p>

                    <div className="flex items-center gap-4 text-xs text-sage-800 pt-1 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sage-700" />
                        {format(startTime, 'EEEE, MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sage-700" />
                        {format(startTime, 'hh:mm a')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions & Clinical Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-sage-200/60">
                  <div className="text-right hidden lg:block pr-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                      Encounter Workflow
                    </span>
                    <span className="text-xs text-sage-900 font-semibold flex items-center gap-1 justify-end">
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Notes & Rx Documented</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Triage Ready for Review</span>
                        </>
                      )}
                    </span>
                  </div>

                  <Link
                    to={`/doctor/appointments/${app._id}`}
                    className="btn-sage-pill py-2.5 px-5 text-xs shadow-pill flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Open Clinical Encounter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
