'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Settings, 
  Users, 
  TrendingUp, 
  Cpu,
  ShieldCheck,
  Server,
  Mail
} from 'lucide-react';
import { DevOpsConsole } from '@/components/admin/DevOpsConsole';
import { BusinessConsole } from '@/components/admin/BusinessConsole';
import { AccessConsole } from '@/components/admin/AccessConsole';
import { EmailOperationsConsole } from '@/components/admin/EmailOperationsConsole';
import KnowledgeHub from '@/components/admin/KnowledgeHub';
import { getBackendEnvironmentDetails } from './actions';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AdminDashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeSuite, setActiveSuite] = useState<'devops' | 'business' | 'access' | 'email' | 'knowledge'>('devops');
  const [envInfo, setEnvInfo] = useState<{ projectId: string; envContext: 'LIVE-PRODUCTION' | 'DEV-APP' | 'LOCAL-DEV'; label: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login?reason=unauthenticated');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let activeEnv: 'LIVE-PRODUCTION' | 'DEV-APP' | 'LOCAL-DEV' = 'DEV-APP';
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'admin.memoryweaver.studio' || hostname === 'memoryweaver.studio') {
        activeEnv = 'LIVE-PRODUCTION';
      } else if (hostname === 'dev.memoryweaver.studio') {
        activeEnv = 'DEV-APP';
      } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        activeEnv = 'LOCAL-DEV';
      }

      // Rehydrate active suite from URL search params (?suite=email or ?tab=access)
      const urlParams = new URLSearchParams(window.location.search);
      const suiteParam = urlParams.get('suite') || urlParams.get('tab');
      if (suiteParam && ['devops', 'business', 'access', 'email', 'knowledge'].includes(suiteParam)) {
        setActiveSuite(suiteParam as any);
      }
    }

    getBackendEnvironmentDetails()
      .then((res) => {
        if (res.success && res.projectId) {
          setEnvInfo({
            projectId: res.projectId,
            envContext: (res.envContext as any) || activeEnv,
            label: res.label || activeEnv
          });
        }
      })
      .catch(() => {
        setEnvInfo({
          projectId: 'memory-weaver-dev',
          envContext: activeEnv,
          label: activeEnv
        });
      });
  }, []);

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 font-mono text-sm">
        <div className="animate-pulse tracking-widest text-indigo-400/80 font-black">VERIFYING ADMINISTRATIVE ACCESS CONTEXT...</div>
      </div>
    );
  }

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
            {envInfo ? (
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-300 ${
                envInfo.envContext === 'LIVE-PRODUCTION' 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse' 
                  : envInfo.envContext === 'DEV-APP'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-sky-500/10 border-sky-500/20 text-sky-400 font-mono'
              }`}>
                {envInfo.envContext === 'LIVE-PRODUCTION' ? (
                  <span className="h-2 w-2 rounded-full bg-rose-500 inline-block animate-ping" />
                ) : (
                  <Server className="h-3.5 w-3.5" />
                )}
                {envInfo.label} ({envInfo.projectId})
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-slate-900 border-slate-800 text-slate-500 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-slate-700 animate-pulse" />
                EVALUATING ENVIRONMENT...
              </span>
            )}
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

              <button
                onClick={() => setActiveSuite('email')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                  activeSuite === 'email' 
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Mail className="h-4 w-4 text-amber-400" />
                Email Operations
              </button>

              <button
                onClick={() => setActiveSuite('knowledge')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border transition-all ${
                  activeSuite === 'knowledge'
                    ? 'bg-purple-600/10 border-purple-500/30 text-purple-200'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Knowledge Hub
              </button>
            </div>

            {/* Quick Stats/Info */}
            <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-5 space-y-4 hidden lg:block">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  Security Gateway
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Edge interception maps subdomain traffic to specific environments. All actions are traced under session correlation rules.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-900/60 space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 block">Routing Scope</span>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    envInfo?.envContext === 'LIVE-PRODUCTION' ? 'bg-rose-500 animate-ping' :
                    envInfo?.envContext === 'DEV-APP' ? 'bg-amber-500 animate-pulse' : 'bg-sky-500'
                  }`} />
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {envInfo?.envContext || 'RESOLVING...'}
                  </span>
                </div>
              </div>
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
                  {activeSuite === 'email' && 'Email Operations & Live Dispatcher'}
                  {activeSuite === 'knowledge' && 'Living Knowledge Hub'}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {activeSuite === 'devops' && 'Monitor resilience memory structures, local IndexedDB states, WebRTC signaling integrity, and routing traces.'}
                  {activeSuite === 'business' && 'View subscription tier tracking, user adoption quotas, and API analytics telemetry.'}
                  {activeSuite === 'access' && 'Manage client authentication tokens, inspect permission passes, and execute administrative bypasses.'}
                  {activeSuite === 'email' && 'Dispatch 1-click test emails across all 4 production templates, inspect live Resend API delivery receipts with SPF/DKIM validation, and audit Obsidian-Gold HTML rendering.'}
                  {activeSuite === 'knowledge' && 'Search, filter, and inspect compiled business rules, operational playbooks, subscription tier pricing, and lifecycle policies.'}
                </p>
              </div>
            </section>

            {/* Sub-Console Router */}
            <div>
              {activeSuite === 'devops' && <DevOpsConsole />}
              {activeSuite === 'business' && <BusinessConsole />}
              {activeSuite === 'access' && <AccessConsole />}
              {activeSuite === 'email' && <EmailOperationsConsole />}
              {activeSuite === 'knowledge' && <KnowledgeHub />}
            </div>

          </main>

        </div>
      </div>
    </div>
  );
}
