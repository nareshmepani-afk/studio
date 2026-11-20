'use client';

import React from 'react';
import { Terminal, RefreshCw } from 'lucide-react';
import { AdminHealthBar } from './AdminHealthBar';
import { TerminalLogs } from './TerminalLogs';

export function DevOpsConsole() {
  return (
    <div className="space-y-8">
      {/* Live Synthetic System Readiness & Parity Probe */}
      <AdminHealthBar />

      {/* Operational Terminal */}
      <section className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-300">
              Live Gateway Logs
            </span>
          </div>
          <button
            id="btn-refresh-logs"
            type="button"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <TerminalLogs />
      </section>
    </div>
  );
}
