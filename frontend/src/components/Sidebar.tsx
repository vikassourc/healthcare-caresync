import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  Pill,
  Users,
  CalendarOff,
  BellRing,
  Stethoscope,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { user } = useAuth();
  if (!user) return null;

  const patientLinks = [
    { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patient/book', label: 'Book Appointment', icon: CalendarPlus },
    { to: '/patient/appointments', label: 'My Visits', icon: CalendarDays },
    { to: '/patient/prescriptions', label: 'Prescriptions', icon: Pill }
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: 'Clinical Overview', icon: LayoutDashboard },
    { to: '/doctor/schedule', label: 'My Schedule & Agenda', icon: CalendarDays },
    { to: '/doctor/patients', label: 'Patient Encounters', icon: Users }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/doctors', label: 'Doctor Directory', icon: Stethoscope },
    { to: '/admin/leave', label: 'Leave Requests', icon: CalendarOff },
    { to: '/admin/notifications', label: 'Dead-Letter Queue', icon: BellRing }
  ];

  const links =
    user.role === UserRole.PATIENT
      ? patientLinks
      : user.role === UserRole.DOCTOR
      ? doctorLinks
      : adminLinks;

  return (
    <aside
      className={`bg-cream border-r border-ink/8 py-6 flex flex-col transition-all duration-300 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <nav className="flex-1 px-3 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-sage-900 text-white shadow-sm'
                    : 'text-ink-muted hover:bg-sage-100 hover:text-sage-900'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
