import React from 'react';
import AdminDashboardContent from './AdminDashboardContent';
import '../globals.css';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <div className="flex-grow">
        <AdminDashboardContent />
      </div>
      <div className="text-[10px] font-mono text-slate-600 text-center mt-8 pb-4">BUILD_VER: 2026-06-21-DASHBOARD-015</div>
    </div>
  );
}
