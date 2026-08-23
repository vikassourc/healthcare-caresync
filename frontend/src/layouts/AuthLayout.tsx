import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Rotating3DMedicalModel } from '../components/Rotating3DMedicalModel';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden text-ink">
      {/* Ambient Nature-Toned Background */}
      <div className="absolute inset-0 z-0 bg-ambient-sage bg-ambient-dots pointer-events-none" />
      <div className="grain-overlay z-0" />

      {/* 3D Rotating Medical Model (interactive floating in background) */}
      <Rotating3DMedicalModel />

      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-2.5 mb-8 z-10 hover:opacity-90 transition-opacity">
        <div className="w-10 h-10 rounded-[12px] bg-sage-900 flex items-center justify-center shadow-md">
          <Activity className="w-5 h-5 text-cream stroke-[2.4]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sage-900 tracking-tight">CareSync</h1>
          <p className="text-[10px] text-sage-700 uppercase font-semibold tracking-wider">Clinical Intelligence</p>
        </div>
      </Link>

      {/* Glassmorphic White/Cream Card */}
      <div className="w-full max-w-md card-glass rounded-[28px] p-8 sm:p-10 shadow-glass relative z-10 border border-white/80 bg-white/75 backdrop-blur-xl">
        <div className="mb-6 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-sage-900 leading-tight">
            {title}
          </h2>
          <p className="text-xs text-ink-muted mt-1.5 font-medium">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
};
