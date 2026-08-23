import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import { DoctorProfile } from '../../types';

export const AdminDoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialisation, setSpecialisation] = useState('');

  const fetchDoctors = () => {
    adminApi.getDoctors().then((res) => {
      if (res.data.success && res.data.data) setDoctors(res.data.data);
    });
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createDoctor({ email, password, firstName, lastName, specialisation });
      toast.success('Doctor account and profile created.');
      setShowModal(false);
      fetchDoctors();
    } catch {
      toast.error('Failed to create doctor');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Specialist Directory Management</h2>
          <p className="text-xs text-gray-400 mt-1">Add and configure doctor profiles, working hours, and slot durations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-pill text-xs shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Doctor</span>
        </button>
      </div>

      <div className="bg-surface-white rounded-3xl p-6 shadow-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-xs text-gray-400 font-bold uppercase">
              <th className="pb-3 px-2">Doctor Name</th>
              <th className="pb-3 px-2">Email</th>
              <th className="pb-3 px-2">Specialisation</th>
              <th className="pb-3 px-2">Slot Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {doctors.map((d) => {
              const u: any = d.userId;
              return (
                <tr key={d._id} className="hover:bg-surface-light/50">
                  <td className="py-3 px-2 font-semibold text-navy-900">Dr. {u?.firstName} {u?.lastName}</td>
                  <td className="py-3 px-2 text-xs text-gray-500">{u?.email}</td>
                  <td className="py-3 px-2 text-xs text-coral-600 font-medium">{d.specialisation}</td>
                  <td className="py-3 px-2 text-xs">{d.slotDurationMinutes}m</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900">Add New Doctor</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-light border border-surface-border text-sm"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-light border border-surface-border text-sm"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-light border border-surface-border text-sm"
              />
              <input
                type="text"
                placeholder="Specialisation (e.g. Dermatologist)"
                value={specialisation}
                onChange={(e) => setSpecialisation(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-light border border-surface-border text-sm"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-surface-light text-navy-800 font-bold rounded-pill text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-coral-500 text-white font-bold rounded-pill text-xs shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
