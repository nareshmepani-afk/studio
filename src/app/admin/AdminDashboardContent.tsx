'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  Terminal, 
  Settings, 
  Users, 
  TrendingUp, 
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { DevOpsConsole } from '@/components/admin/DevOpsConsole';
import { BusinessConsole } from '@/components/admin/BusinessConsole';
import { AccessConsole } from '@/components/admin/AccessConsole';

export default function AdminDashboardContent() {
  const [activeSuite, setActiveSuite] = useState<'devops' | 'business' | 'access'>('devops');

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
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar */}
          <aside className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 block px-3 mb-2">Admin Suites</span>
              
              <button
                onClick={() => setActiveSuite('devops')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                  activeSuite === 'devops' 
                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Cpu className="h-4 w-4" />
                DevOps & Operations
              </button>

              <button
                onClick={() => setActiveSuite('business')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                  activeSuite === 'business' 
                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Business & Analytics
              </button>

              <button
                onClick={() => setActiveSuite('access')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                  activeSuite === 'access' 
                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Users className="h-4 w-4" />
                Access & Support
              </button>
            </div>

            {/* Quick Stats/Info */}
            <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-5 space-y-3 hidden lg:block">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                Security Gateway
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Edge interception maps subdomain traffic to specific environments. All actions are traced under session correlation rules.
              </p>
            </div>
          </aside>

          {/* Right Main Content Panel */}
          <main className="lg:col-span-3 space-y-8">
            
            {/* Banner Section */}
            <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-slate-900/60 p-8 shadow-2xl">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-2 max-w-2xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {activeSuite === 'devops' && 'DevOps & Operations'}
                  {activeSuite === 'business' && 'Business Analytics'}
                  {activeSuite === 'access' && 'Customer Support & Access'}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {activeSuite === 'devops' && 'Monitor resilience memory structures, local IndexedDB states, WebRTC signaling integrity, and routing traces.'}
                  {activeSuite === 'business' && 'View subscription tier tracking, user adoption quotas, and API analytics telemetry.'}
                  {activeSuite === 'access' && 'Manage client authentication tokens, inspect permission passes, and execute administrative bypasses.'}
                </p>
              </div>
            </section>

            {/* Sub-Console Router */}
            <div>
              {activeSuite === 'devops' && <DevOpsConsole />}
              {activeSuite === 'business' && <BusinessConsole />}
              {activeSuite === 'access' && <AccessConsole />}
            </div>

          </main>

        </div>
      </div>
    </div>
  );
}
