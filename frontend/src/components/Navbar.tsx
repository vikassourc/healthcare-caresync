import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Menu, LogOut, Mail, Calendar, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { calendarApi } from '../services/api';
import { NotificationModal } from './NotificationModal';

import { GoogleCalendarModal } from './GoogleCalendarModal';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const handleConnectCalendar = () => {
    setShowCalendarModal(true);
  };

  return (
    <>
      <header className="h-18 bg-cream/90 backdrop-blur-md border-b border-ink/8 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-ink-muted hover:bg-sage-100 hover:text-sage-900 transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-sage-900 flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-cream stroke-[2.4]" />
            </div>
            <span className="font-bold text-lg text-sage-900 tracking-tight">CareSync</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Google Calendar Connect / Status Button */}
              <button
                onClick={handleConnectCalendar}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-sage-900 text-xs font-semibold border border-sage-200 shadow-sm transition-all cursor-pointer"
                title="Google Calendar Integration"
              >
                <Calendar className="w-3.5 h-3.5 text-sage-700" />
                <span>Google Calendar</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>

              {/* View Email Dispatch Logs Button */}
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2 text-ink-muted hover:text-sage-900 hover:bg-sage-100 rounded-xl transition-all relative cursor-pointer"
                title="View Sent Email Logs & Notifications"
              >
                <Mail className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
              </button>

              <div className="flex items-center gap-3 pl-2 border-l border-sage-200/60">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-ink">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-xs text-sage-700 font-semibold capitalize">
                    {user.role} Portal
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-900 to-sage-800 text-cream flex items-center justify-center font-serif font-bold text-xs shadow-sm border border-sage-700/30 tracking-wider">
                  <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-1 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Dispatched Emails & Notifications Viewer */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Google Calendar Integration & 1-Click Sync Modal */}
      <GoogleCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </>
  );
};
