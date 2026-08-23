import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { UserRole } from './types';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Patient Pages
import { PatientDashboard } from './pages/patient/Dashboard';
import { BookAppointment } from './pages/patient/BookAppointment';
import { PatientAppointmentDetail } from './pages/patient/AppointmentDetail';
import { PatientMyAppointments } from './pages/patient/MyAppointments';
import { PatientPrescriptions } from './pages/patient/Prescriptions';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/Dashboard';
import { DoctorAppointmentDetail } from './pages/doctor/AppointmentDetail';
import { DoctorMySchedule } from './pages/doctor/MySchedule';
import { DoctorPatientEncounters } from './pages/doctor/PatientEncounters';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminDoctorManagement } from './pages/admin/DoctorManagement';
import { AdminLeaveManagement } from './pages/admin/LeaveManagement';
import { AdminNotificationQueue } from './pages/admin/NotificationQueue';

export const App: React.FC = () => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '999px',
            background: '#2E3B24',
            color: '#F6F3EA',
            fontSize: '13px',
            fontWeight: 600,
            padding: '12px 20px',
            boxShadow: '0 10px 30px rgba(46,59,36,0.25)'
          }
        }}
      />
      <Routes>
        {/* Public Landing & Auth Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Patient Portal */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="book" element={<BookAppointment />} />
          <Route path="appointments" element={<PatientMyAppointments />} />
          <Route path="appointments/:id" element={<PatientAppointmentDetail />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Doctor Portal */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments/:id" element={<DoctorAppointmentDetail />} />
          <Route path="schedule" element={<DoctorMySchedule />} />
          <Route path="patients" element={<DoctorPatientEncounters />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Admin Portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="doctors" element={<AdminDoctorManagement />} />
          <Route path="leave" element={<AdminLeaveManagement />} />
          <Route path="notifications" element={<AdminNotificationQueue />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
