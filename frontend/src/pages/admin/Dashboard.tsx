import React, { useEffect, useState } from 'react';
import { Users, Stethoscope, CalendarOff, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../services/api';
import { StatsCard } from '../../components/StatsCard';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    adminApi.getStats().then((res) => {
      if (res.data.success) setStats(res.data.data);
    });
  }, []);

  const statTiles = [
    { label: 'Registered Doctors', value: stats?.totalDoctors || 0, icon: Stethoscope },
    { label: 'Registered Patients', value: stats?.totalPatients || 0, icon: Users },
    { label: 'Pending Leave Approvals', value: stats?.pendingLeave || 0, icon: CalendarOff },
    { label: 'Dead-Letter Notifications', value: stats?.deadLetterCount || 0, icon: AlertTriangle }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">Administrator Console</h2>
        <p className="text-xs text-gray-400 mt-1">Platform telemetry, doctor roster, and notification reliability queue</p>
      </div>

      <StatsCard tiles={statTiles} />
    </div>
  );
};
