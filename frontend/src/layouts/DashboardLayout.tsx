import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col relative">
      <div className="absolute inset-0 bg-ambient-sage-subtle bg-ambient-dots pointer-events-none z-0" />
      <div className="grain-overlay z-0" />

      <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 relative z-10">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
