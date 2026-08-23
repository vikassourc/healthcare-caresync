import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: true,

  login: (tokens, user) => {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

  logout: async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const res = await authApi.getMe();
      if (res.data.success && res.data.data) {
        set({ user: res.data.data, isAuthenticated: true, isLoading: false });
      } else {
        throw new Error();
      }
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
