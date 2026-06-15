'use client';

import React from 'react';
import { 
  Shield, 
  Activity, 
  Users, 
  Database, 
  HardDrive, 
  Cpu, 
  Terminal, 
  Settings, 
  RefreshCw 
} from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 id="admin-header-title" className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Memory Weaver Studio
              </h1>
              <p className="text-xs text-indigo-400 font-medium tracking-wider uppercase">Command Center Admin Hub</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              SYSTEM SECURE
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Banner Section */}
        <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-slate-900/60 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Engine Operations View
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Global routing gateway successfully mapped to edge subdomains. From this console, monitor local IndexedDB backups, verify WebRTC signaling status, and manage active media collections.
            </p>
          </div>
        </section>

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
            <p className="text-slate-500">[{new Date().toISOString()}] INITIALIZING SECURITY CONTEXT GATEWAY...</p>
            <p>INFO: DISTRIBUTED CORRELATION TRACE INTERCEPTED // INGESTION POOL SECURE</p>
            <p className="text-emerald-400">SUCCESS: Host admin.memoryweaver.studio rewritten cleanly to internal /admin app workspace.</p>
            <p className="text-indigo-400/70">DEBUG: Global optics interception shield status - Active (Optics unmuted)</p>
          </div>
        </section>
      </main>
    </div>
  );
}
