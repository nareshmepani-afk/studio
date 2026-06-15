'use client';

import React from 'react';

export function AdminFooter() {
  return (
    <footer className="mt-12 text-center space-y-2 pointer-events-none select-none">
      <div className="flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-semibold">
          SECURE TUNNEL Core Active
        </span>
      </div>
      <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium">
        © 2026 Studio Productions • Version 2.4.0
      </p>
    </footer>
  );
}
