import React from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

export const ProfileCard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="card-glass rounded-[24px] p-6 sm:p-7 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl flex items-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-900 via-sage-800 to-sage-700 text-cream font-serif font-semibold text-xl flex items-center justify-center shadow-md flex-shrink-0 border border-sage-600/30 tracking-wider">
        <span>{initials}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-lg font-normal text-sage-900 truncate">
            {user.role === UserRole.DOCTOR ? `Dr. ${user.firstName} ${user.lastName}` : `${user.firstName} ${user.lastName}`}
          </h3>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-800">
            {user.role}
          </span>
        </div>
        <p className="text-xs text-ink-muted flex items-center gap-1.5 mt-1 truncate font-medium">
          <Mail className="w-3.5 h-3.5 text-sage-700" />
          <span>{user.email}</span>
        </p>
      </div>
    </div>
  );
};
