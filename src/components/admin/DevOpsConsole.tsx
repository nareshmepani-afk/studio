'use client';

import React from 'react';
import { 
  Activity, 
  Users, 
  Database, 
  HardDrive, 
  Terminal, 
  RefreshCw 
} from 'lucide-react';

export function DevOpsConsole() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">Memory Cache Size</span>
            <Database className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition duration-300" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-white">44.03 MB</span>
            <p className="text-xs text-slate-500 mt-1">Fallback Resilience Storage</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">P2P Peer Nodes</span>
            <Users className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition duration-300" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-white">Active</span>
            <p className="text-xs text-slate-500 mt-1">Host/Guest Remote Sync</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">System Telemetry</span>
            <Activity className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition duration-300" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-white">100% Green</span>
            <p className="text-xs text-emerald-400 mt-1">161/161 Tests Passing</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">Active Gateway</span>
            <HardDrive className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition duration-300" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-white">Cloudflare Edge</span>
            <p className="text-xs text-slate-500 mt-1">Subdomain Interception Live</p>
          </div>
        </div>
      </section>

      {/* Operational Terminal */}
      <section className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-300">Live Gateway Logs</span>
          </div>
          <button id="btn-refresh-logs" className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-5 font-mono text-xs text-indigo-300/90 space-y-2 max-h-60 overflow-y-auto bg-black/40">
          <p className="text-slate-500">[2026-06-15T08:20:00Z] INITIALIZING SECURITY CONTEXT GATEWAY...</p>
          <p>INFO: DISTRIBUTED CORRELATION TRACE INTERCEPTED // INGESTION POOL SECURE</p>
          <p className="text-emerald-400">SUCCESS: Host admin.memoryweaver.studio rewritten cleanly to internal /admin app workspace.</p>
          <p className="text-indigo-400/70">DEBUG: Global optics interception shield status - Active (Optics unmuted)</p>
        </div>
      </section>
    </div>
  );
}
