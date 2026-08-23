import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowRight, UserCheck, Stethoscope, Loader2 } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { authApi, calendarApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['patient', 'doctor']),
  specialisation: z.string().optional()
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') === 'doctor' ? 'doctor' : 'patient') as 'patient' | 'doctor';

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: initialRole }
  });

  const selectedRole = watch('role');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'doctor') {
      setValue('role', 'doctor');
    } else if (roleParam === 'patient') {
      setValue('role', 'patient');
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.data.success && res.data.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        login({ accessToken, refreshToken }, user);
        toast.success(`Registration successful! Welcome Dr. / ${user.firstName}.`);

        if (user.role === UserRole.PATIENT) navigate('/patient/dashboard');
        else if (user.role === UserRole.DOCTOR) navigate('/doctor/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const res = await calendarApi.getAuthUrl();
      if (res.data.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch {
      toast.error('Google Sign-Up service unavailable. Please use the registration form.');
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title={selectedRole === 'doctor' ? 'Doctor Registration' : 'Patient Registration'}
      subtitle={
        selectedRole === 'doctor'
          ? 'Join the CareSync specialist network and manage your patient practice'
          : 'Create your CareSync account for seamless appointment booking & care'
      }
    >
      {/* Account Type Toggle Selector */}
      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2 text-center">
          Choose Account Type:
        </label>
        <div className="grid grid-cols-2 gap-2 bg-sage-100/80 p-1.5 rounded-2xl border border-sage-200">
          <button
            type="button"
            onClick={() => setValue('role', 'patient')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedRole === 'patient'
                ? 'bg-white text-sage-900 shadow-sm'
                : 'text-ink-muted hover:text-sage-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Patient</span>
          </button>

          <button
            type="button"
            onClick={() => setValue('role', 'doctor')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedRole === 'doctor'
                ? 'bg-sage-900 text-cream shadow-sm'
                : 'text-ink-muted hover:text-sage-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor / Specialist</span>
          </button>
        </div>
      </div>

      {/* Google OAuth Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-sage-50/80 border border-sage-300/80 text-ink font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer"
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
          <span>{googleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
        </button>
      </div>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-sage-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/90 px-3 text-ink-muted font-medium">Or fill details</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
              First Name *
            </label>
            <input
              type="text"
              placeholder={selectedRole === 'doctor' ? 'Dr. Rajesh' : 'Aarav'}
              {...register('firstName')}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sage-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-600 text-sm text-ink"
            />
            {errors.firstName && (
              <p className="text-xs text-rose-600 mt-1">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
              Last Name *
            </label>
            <input
              type="text"
              placeholder={selectedRole === 'doctor' ? 'Sharma' : 'Gupta'}
              {...register('lastName')}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sage-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-600 text-sm text-ink"
            />
            {errors.lastName && (
              <p className="text-xs text-rose-600 mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
            Email Address *
          </label>
          <input
            type="email"
            placeholder={selectedRole === 'doctor' ? 'dr.name@hospital.com' : 'patient@example.com'}
            {...register('email')}
            className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sage-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-600 text-sm text-ink"
          />
          {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
            Password *
          </label>
          <input
            type="password"
            placeholder="••••••••"
            {...register('password')}
            className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sage-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-600 text-sm text-ink"
          />
          {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>}
        </div>

        {selectedRole === 'doctor' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
              Medical Specialisation *
            </label>
            <input
              type="text"
              placeholder="e.g. Cardiologist, Neurologist, Orthopedic Surgeon"
              {...register('specialisation')}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sage-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-600 text-sm text-ink"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-sage-900 hover:bg-sage-800 text-white font-semibold rounded-pill shadow-pill transition-all text-sm mt-3 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>
            {loading
              ? 'Creating Account...'
              : selectedRole === 'doctor'
              ? 'Complete Doctor Registration'
              : 'Complete Patient Registration'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-sage-900 hover:underline">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};
