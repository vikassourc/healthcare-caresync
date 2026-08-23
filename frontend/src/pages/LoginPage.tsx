import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowRight, UserCheck, Stethoscope, ShieldCheck, Loader2 } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { authApi, calendarApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const googleAuth = searchParams.get('googleAuth');

    if (googleAuth === 'success' && token && refreshToken) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      authApi
        .getMe()
        .then((res) => {
          if (res.data.success && res.data.data) {
            login({ accessToken: token, refreshToken }, res.data.data);
            toast.success(`Signed in with Google as ${res.data.data.firstName}!`);
            if (res.data.data.role === UserRole.PATIENT) navigate('/patient/dashboard');
            else if (res.data.data.role === UserRole.DOCTOR) navigate('/doctor/dashboard');
            else if (res.data.data.role === UserRole.ADMIN) navigate('/admin/dashboard');
          }
        })
        .catch(() => {
          toast.error('Google authentication failed. Please try again.');
        });
    } else if (googleAuth === 'failed') {
      toast.error('Google Sign-In was cancelled or failed.');
    }
  }, [searchParams, login, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      if (res.data.success && res.data.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        login({ accessToken, refreshToken }, user);
        toast.success(`Welcome back, ${user.firstName}!`);

        if (user.role === UserRole.PATIENT) navigate('/patient/dashboard');
        else if (user.role === UserRole.DOCTOR) navigate('/doctor/dashboard');
        else if (user.role === UserRole.ADMIN) navigate('/admin/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
      setActiveDemo(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const res = await calendarApi.getAuthUrl();
      if (res.data.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch {
      toast.error('Google Sign-In service unavailable. Please use email sign-in.');
      setGoogleLoading(false);
    }
  };

  const handle1ClickDemoLogin = (role: 'patient' | 'doctor' | 'admin') => {
    setActiveDemo(role);
    let email = 'vsrivastava2004dec@gmail.com';
    const password = 'Password123!';

    if (role === 'doctor') {
      email = 'dr.rajesh.sharma@healthcarerx.com';
    } else if (role === 'admin') {
      email = 'admin@healthcarerx.com';
    }

    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });

    // Perform immediate 1-click login
    onSubmit({ email, password });
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to access your clinical dashboard">
      {/* Google OAuth Sign-in Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-sage-50/80 border border-sage-300/80 text-ink font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-sage-900" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{googleLoading ? 'Redirecting to Google...' : 'Sign in with Google'}</span>
        </button>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-sage-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/90 px-3 text-ink-muted font-medium">Or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            {...register('email')}
            className="w-full px-4 py-3 rounded-2xl bg-white/80 border border-sage-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-600 text-sm text-ink transition-all"
          />
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            {...register('password')}
            className="w-full px-4 py-3 rounded-2xl bg-white/80 border border-sage-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-600 text-sm text-ink transition-all"
          />
          {errors.password && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-sage-900 hover:bg-sage-800 text-white font-semibold rounded-pill shadow-pill transition-all text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* 1-Click Instant Demo Login Buttons */}
      <div className="mt-6 pt-5 border-t border-sage-200/60">
        <p className="text-xs text-ink-muted font-semibold text-center mb-3">
          1-Click Instant Demo Access:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handle1ClickDemoLogin('patient')}
            className="px-2.5 py-2 rounded-2xl bg-sage-100/90 hover:bg-sage-200 text-xs font-bold text-sage-900 transition-all flex flex-col items-center gap-1 cursor-pointer border border-sage-300/40 shadow-sm"
          >
            <UserCheck className="w-4 h-4 text-sage-700" />
            <span className="truncate">{activeDemo === 'patient' ? 'Signing in...' : 'Patient'}</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handle1ClickDemoLogin('doctor')}
            className="px-2.5 py-2 rounded-2xl bg-sage-100/90 hover:bg-sage-200 text-xs font-bold text-sage-900 transition-all flex flex-col items-center gap-1 cursor-pointer border border-sage-300/40 shadow-sm"
          >
            <Stethoscope className="w-4 h-4 text-sage-700" />
            <span className="truncate">{activeDemo === 'doctor' ? 'Signing in...' : 'Dr. Sharma'}</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handle1ClickDemoLogin('admin')}
            className="px-2.5 py-2 rounded-2xl bg-sage-100/90 hover:bg-sage-200 text-xs font-bold text-sage-900 transition-all flex flex-col items-center gap-1 cursor-pointer border border-sage-300/40 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-sage-700" />
            <span className="truncate">{activeDemo === 'admin' ? 'Signing in...' : 'Admin'}</span>
          </button>
        </div>
      </div>

      {/* Register Links for Both Patient and Doctor */}
      <div className="mt-6 pt-4 border-t border-sage-200/60 text-center text-xs text-ink-muted space-y-2">
        <p className="font-medium">Don't have an account?</p>
        <div className="flex items-center justify-center gap-4 text-xs font-bold">
          <Link
            to="/register?role=patient"
            className="px-3 py-1.5 rounded-full bg-sage-100/80 hover:bg-sage-200 text-sage-900 transition-all"
          >
            Register as Patient
          </Link>
          <span className="text-sage-300">•</span>
          <Link
            to="/register?role=doctor"
            className="px-3 py-1.5 rounded-full bg-sage-900 hover:bg-sage-800 text-cream transition-all shadow-sm"
          >
            Register as Doctor
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
