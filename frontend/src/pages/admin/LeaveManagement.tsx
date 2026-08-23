import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarOff } from 'lucide-react';
import { adminApi } from '../../services/api';
import { DoctorProfile } from '../../types';
import { format } from 'date-fns';

export const AdminLeaveManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const loadData = () => {
    adminApi.getDoctors().then((res) => {
      if (res.data.success && res.data.data) setDoctors(res.data.data);
    });
    adminApi.getLeaves().then((res) => {
      if (res.data.success && res.data.data) setLeaves(res.data.data);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.markLeave({
        doctorId: selectedDoctorId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason
      });
      toast.success('Leave scheduled! Async background worker is notifying affected patients with reschedule options.');
      loadData();
    } catch {
      toast.error('Failed to submit doctor leave');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">Doctor Leave & Conflict Management</h2>
        <p className="text-xs text-gray-400 mt-1">
          When leave is registered, affected confirmed bookings are cancelled asynchronously and patients are alerted with next-available slot recommendations.
        </p>
      </div>

      <div className="bg-surface-white rounded-3xl p-8 shadow-card space-y-4">
        <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
          <CalendarOff className="w-5 h-5 text-coral-500" />
          <span>Register Doctor Leave Period</span>
        </h3>

        <form onSubmit={handleMarkLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Select Doctor *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-surface-light border border-surface-border text-sm text-navy-900"
            >
              <option value="">-- Choose Doctor --</option>
              {doctors.map((d) => {
                const u: any = d.userId;
                return (
                  <option key={d._id} value={u?._id}>
                    Dr. {u?.firstName} {u?.lastName} ({d.specialisation})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-light border border-surface-border text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-light border border-surface-border text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Reason / Clinical Note
            </label>
            <input
              type="text"
              placeholder="Medical conference attendance, emergency leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-surface-light border border-surface-border text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-pill text-xs shadow-md transition-all"
          >
            Mark Leave & Trigger Async Fan-out Notifications
          </button>
        </form>
      </div>

      {/* Leave History Table */}
      <div className="bg-surface-white rounded-3xl p-6 shadow-card overflow-hidden">
        <h3 className="text-base font-bold text-navy-900 mb-4">Leave Records</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-xs text-gray-400 font-bold uppercase">
              <th className="pb-3 px-2">Doctor</th>
              <th className="pb-3 px-2">Dates</th>
              <th className="pb-3 px-2">Status</th>
              <th className="pb-3 px-2">Affected Consultations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {leaves.map((l) => {
              const doc = l.doctorId;
              return (
                <tr key={l._id} className="hover:bg-surface-light/50">
                  <td className="py-3 px-2 font-semibold text-navy-900">Dr. {doc?.firstName} {doc?.lastName}</td>
                  <td className="py-3 px-2 text-xs text-gray-600">
                    {format(new Date(l.startDate), 'MMM d')} – {format(new Date(l.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-2 text-xs font-bold text-emerald-600">{l.status}</td>
                  <td className="py-3 px-2 text-xs font-bold text-coral-500">{l.affectedAppointmentsCount || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
