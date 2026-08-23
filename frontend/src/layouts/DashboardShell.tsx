import React from 'react';

interface DashboardShellProps {
  heroContent: React.ReactNode;
  children: React.ReactNode;
}

/**
 * THE SAGE & CREAM TWO-ZONE ARCHITECTURE:
 * Desktop: Left Zone is an organic dark Sage-900 / Glass contextual panel
 *          Right Zone is an organic canvas of cream & glassmorphic cards.
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({ heroContent, children }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT ZONE: Dark Sage Focus / AI Clinical Triage Panel */}
      <div className="lg:col-span-4 bg-sage-900 text-cream rounded-[28px] p-6 sm:p-8 shadow-glass relative overflow-hidden lg:sticky lg:top-8 border border-sage-700/40">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-sage-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">{heroContent}</div>
      </div>

      {/* RIGHT ZONE: Modular Organic Cards */}
      <div className="lg:col-span-8 flex flex-col gap-8">{children}</div>
    </div>
  );
};
