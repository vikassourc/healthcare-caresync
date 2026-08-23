import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center text-white text-sm font-semibold">
        Verifying secure session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to proper role portal
    if (user.role === UserRole.PATIENT) return <Navigate to="/patient/dashboard" replace />;
    if (user.role === UserRole.DOCTOR) return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === UserRole.ADMIN) return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};
