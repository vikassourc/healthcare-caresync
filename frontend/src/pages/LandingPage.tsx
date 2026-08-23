import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Clock,
  Sparkles,
  Heart,
  Pill,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  Zap,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import { UserRole } from '../types';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated, login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const googleAuth = searchParams.get('googleAuth');

    if (googleAuth === 'success' && token && refreshToken) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('refreshToken', refreshToken);
      authApi
        .getMe()
        .then((res) => {
          if (res.data.success && res.data.data) {
            login({ accessToken: token, refreshToken }, res.data.data);
            toast.success(`Welcome to CareSync, ${res.data.data.firstName}!`);
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

  return (
    <div className="relative min-h-screen bg-cream overflow-hidden text-ink">
      {/* Ambient Nature-Toned Background */}
      <div className="absolute inset-0 z-0 bg-ambient-sage bg-ambient-dots pointer-events-none" />
      <div className="grain-overlay z-0" />

      <div className="relative z-10">
        {/* Navigation Bar */}
        <nav className="max-w-[1180px] mx-auto px-6 sm:px-8 pt-7 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-[17px] text-ink">
            <span className="w-[34px] h-[34px] rounded-[10px] bg-sage-900 flex items-center justify-center shadow-md">
              <Activity className="w-[18px] h-[18px] text-cream stroke-[2.4]" />
            </span>
            <span className="tracking-tight">CareSync</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[14.5px] text-ink font-medium">
            <a href="#features" className="opacity-80 hover:opacity-100 transition-opacity">Features</a>
            <a href="#doctors" className="opacity-80 hover:opacity-100 transition-opacity">Doctors</a>
            <a href="#triage" className="opacity-80 hover:opacity-100 transition-opacity">AI Triage</a>
            <a href="#prescriptions" className="opacity-80 hover:opacity-100 transition-opacity">Prescriptions</a>
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            {isAuthenticated ? (
              <Link
                to={
                  user?.role === 'doctor'
                    ? '/doctor/dashboard'
                    : user?.role === 'admin'
                    ? '/admin/dashboard'
                    : '/patient/dashboard'
                }
                className="btn-sage-pill"
              >
                <span>Dashboard ({user?.firstName})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[14.5px] font-semibold text-ink hover:text-sage-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-sage-pill shadow-pill"
                >
                  <span>Start free trial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-[820px] mx-auto px-6 pt-16 sm:pt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill card-glass text-[12.5px] font-semibold text-sage-700 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sage-600 fill-sage-600" />
            <span>Now with AI visit summaries — CareSync 2.0</span>
          </div>

          <h1 className="font-serif font-normal text-4xl sm:text-6xl text-sage-900 leading-[1.08] tracking-tight mt-6">
            Manage your health<br />
            <em className="italic font-normal">anytime, anywhere.</em>
          </h1>

          <p className="max-w-[500px] mx-auto text-ink-muted text-base sm:text-[17px] leading-relaxed mt-5">
            CareSync helps you book appointments, share symptoms with your doctor in advance,
            and get a clear summary after every visit — all in one simple app.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-7">
            <Link
              to={isAuthenticated ? '/patient/book' : '/register'}
              className="btn-sage-pill py-3.5 px-7 text-[15px] shadow-pill"
            >
              <span>Book an appointment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-sage-900 hover:text-sage-700 transition-colors"
            >
              <span>Explore Specialist Network</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Floating 24/7 Care Badge */}
        <div className="hidden lg:flex items-center gap-2 absolute top-48 right-[8%] z-20 px-4 py-2.5 rounded-pill card-glass text-[12.5px] font-semibold text-sage-900 shadow-glass">
          <Clock className="w-3.5 h-3.5 text-sage-700" />
          <span>24/7 care available</span>
        </div>

        {/* Showcase Area: Phone Mockup + Floating Glass Cards */}
        <section className="relative max-w-[1040px] mx-auto mt-14 px-6 pb-24 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-0">
          
          {/* Left Floating Stat Card */}
          <div className="card-glass rounded-[22px] p-5 w-full sm:w-[220px] lg:-mr-10 lg:mb-16 z-20 shadow-glass">
            <div className="flex items-center gap-3 py-2">
              <div className="w-[36px] h-[36px] rounded-[10px] bg-white/70 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-sage-700" />
              </div>
              <div>
                <div className="text-[11.5px] text-ink-muted font-medium">Upcoming visit</div>
                <div className="text-[14px] font-bold text-sage-900 leading-tight">Dr. Rao · Tomorrow, 10 AM</div>
              </div>
            </div>
            <div className="border-t border-ink/10 mt-2 pt-2 flex items-center gap-3">
              <div className="w-[36px] h-[36px] rounded-[10px] bg-white/70 flex items-center justify-center flex-shrink-0">
                <Pill className="w-4 h-4 text-sage-700" />
              </div>
              <div>
                <div className="text-[11.5px] text-ink-muted font-medium">Prescriptions</div>
                <div className="text-[14px] font-bold text-sage-900 leading-tight">2 active reminders</div>
              </div>
            </div>
          </div>

          {/* Central Device Phone Mockup */}
          <div className="relative z-30 w-[310px] bg-white rounded-[34px] p-3.5 shadow-phone border border-white/80">
            {/* Phone Statusbar */}
            <div className="flex items-center justify-between px-2 pt-1 pb-3 text-xs font-semibold text-ink">
              <span>9:41</span>
              <div className="w-[90px] h-[22px] bg-ink rounded-pill" />
              <span>100%</span>
            </div>

            {/* Phone Screen Header */}
            <div className="flex items-center justify-between px-1 pb-4">
              <span className="font-bold text-[17px] text-ink">Overview</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ink" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink" />
              </div>
            </div>

            {/* Phone Inner Card 1: Activity Chart */}
            <div className="bg-[#FAF8F2] rounded-[18px] p-4 mb-3">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-ink text-[13px]">Sleep quality</span>
                <span className="font-semibold text-sage-700 text-[11.5px]">Weekly view</span>
              </div>
              <div className="flex items-end gap-2.5 h-[70px] px-1">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-sage-900/10 rounded-md h-[26px]" />
                  <span className="text-[9.5px] font-semibold text-ink-muted mt-1.5">MON</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-sage-700 rounded-md h-[56px] shadow-sm" />
                  <span className="text-[9.5px] font-semibold text-sage-900 mt-1.5 font-bold">FRI</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-sage-900/10 rounded-md h-[14px]" />
                  <span className="text-[9.5px] font-semibold text-ink-muted mt-1.5">SAT</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-sage-900/10 rounded-md h-[22px]" />
                  <span className="text-[9.5px] font-semibold text-ink-muted mt-1.5">SUN</span>
                </div>
              </div>
            </div>

            {/* Phone Inner Card 2: Alerts */}
            <div className="bg-[#FAF8F2] rounded-[18px] p-3.5 flex items-center justify-between">
              <span className="text-[13px] font-bold text-ink">Medication alerts</span>
              <span className="text-[11.5px] font-semibold text-sage-700">View all</span>
            </div>
          </div>

          {/* Right Floating Heart Rate Card */}
          <div className="card-glass rounded-[22px] p-5 w-full sm:w-[200px] lg:-ml-10 lg:mt-12 z-20 shadow-glass text-left">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="text-xs text-ink-muted font-medium">Heart rate</span>
            </div>
            <div className="text-2xl font-bold text-sage-900">72 <span className="text-xs font-semibold text-ink-muted">BPM</span></div>
          </div>
        </section>

        {/* Partner Logo Strip */}
        <section className="relative z-10 bg-cream border-t border-ink/8 py-8 px-6">
          <div className="max-w-[980px] mx-auto flex items-center justify-between flex-wrap gap-6 opacity-60">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Layers className="w-4 h-4" /> Hexagon Health
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Zap className="w-4 h-4" /> ByteBoost
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShieldCheck className="w-4 h-4" /> Codelink
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Award className="w-4 h-4" /> Netdot
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Globe className="w-4 h-4" /> Webgen
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
