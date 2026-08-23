import axios from 'axios';
import { ApiResponse, Appointment, DoctorProfile, Prescription, SlotInfo, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', data),
  register: (data: any) => api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', data),
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const appointmentApi = {
  holdSlot: (doctorId: string, slotStartTime: string) =>
    api.post<ApiResponse<Appointment>>('/appointments/hold', { doctorId, slotStartTime }),
  confirmAppointment: (id: string, symptomForm: any) =>
    api.post<ApiResponse<Appointment>>(`/appointments/${id}/confirm`, { symptomForm }),
  cancelAppointment: (id: string, reason?: string) =>
    api.post<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, { reason }),
  getMyAppointments: () => api.get<ApiResponse<Appointment[]>>('/appointments/my-appointments'),
  getMyPrescriptions: () => api.get<ApiResponse<Prescription[]>>('/appointments/my-prescriptions'),
  getMyNotifications: () => api.get<ApiResponse<any[]>>('/appointments/my-notifications'),
  getAppointmentDetail: (id: string) => api.get<ApiResponse<any>>(`/appointments/${id}`)
};

export const doctorApi = {
  searchDoctors: (params?: { specialisation?: string; search?: string }) =>
    api.get<ApiResponse<DoctorProfile[]>>('/doctors/search', { params }),
  getDoctorDetail: (id: string) => api.get<ApiResponse<DoctorProfile>>(`/doctors/${id}`),
  getAvailableSlots: (id: string, date: string) =>
    api.get<ApiResponse<SlotInfo[]>>(`/doctors/${id}/slots`, { params: { date } }),
  getPortalAppointments: () => api.get<ApiResponse<Appointment[]>>('/doctors/portal/appointments'),
  getPortalAppointmentDetail: (id: string) => api.get<ApiResponse<any>>(`/doctors/portal/appointments/${id}`),
  submitNotes: (id: string, data: any) => api.post<ApiResponse<any>>(`/doctors/portal/appointments/${id}/notes`, data),
  createPrescription: (id: string, data: any) => api.post<ApiResponse<any>>(`/doctors/portal/appointments/${id}/prescription`, data),
  updateStatus: (id: string, status: string) => api.put<ApiResponse<any>>(`/doctors/portal/appointments/${id}/status`, { status })
};

export const adminApi = {
  getStats: () => api.get<ApiResponse<any>>('/admin/dashboard-stats'),
  getDoctors: () => api.get<ApiResponse<DoctorProfile[]>>('/admin/doctors'),
  createDoctor: (data: any) => api.post<ApiResponse<any>>('/admin/doctors', data),
  updateDoctor: (id: string, data: any) => api.put<ApiResponse<any>>(`/admin/doctors/${id}`, data),
  markLeave: (data: any) => api.post<ApiResponse<any>>('/admin/doctors/leave', data),
  getLeaves: () => api.get<ApiResponse<any[]>>('/admin/leaves'),
  getDeadLetterQueue: (page: number = 1) => api.get<ApiResponse<any>>('/admin/notifications/dead-letter', { params: { page } }),
  retryNotification: (id: string) => api.post<ApiResponse<any>>(`/admin/notifications/${id}/retry`)
};

export const calendarApi = {
  getAuthUrl: () => api.get<ApiResponse<{ url: string }>>('/calendar/auth-url'),
  disconnect: () => api.delete('/calendar/disconnect')
};
