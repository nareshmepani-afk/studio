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
  Mail,
  LogOut
} from 'lucide-react';
import { DevOpsConsole } from '@/components/admin/DevOpsConsole';
import { BusinessConsole } from '@/components/admin/BusinessConsole';
import { AccessConsole } from '@/components/admin/AccessConsole';
import { EmailOperationsConsole } from '@/components/admin/EmailOperationsConsole';
import KnowledgeHub from '@/components/admin/KnowledgeHub';
import { VoucherMintingConsole } from '@/components/admin/VoucherMintingConsole';
import { MissionControlConsole } from '@/components/admin/MissionControlConsole';
import { BugTriageConsole } from '@/components/admin/BugTriageConsole';
import { PrelaunchAccessConsole } from '@/components/admin/PrelaunchAccessConsole';
import { FounderDecisionForm } from '@/components/admin/FounderDecisionForm';
import { FounderInboxConsole } from '@/components/admin/FounderInboxConsole';
import { FounderDryRunConsole } from '@/components/admin/FounderDryRunConsole';
import { UserDirectoryConsole } from '@/components/admin/UserDirectoryConsole';
import { Bug, Lock, ClipboardCheck, UserCog, Inbox, ExternalLink, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, Film } from 'lucide-react';
import { isProductionProject, STAGING_APP_URL } from '@/config/environment';
import type { InboxBadgeCounts } from '@/lib/releaseControls';
import { getBackendEnvironmentDetails } from './actions';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Gift, Rocket, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardContent() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null;
  const initialIsLiveProduction = isProductionProject(clientProjectId);

  const [activeSuite, setActiveSuite] = useState<'dryrun' | 'releases' | 'devops' | 'business' | 'users' | 'access' | 'email' | 'knowledge' | 'vouchers' | 'mission' | 'bugs' | 'prelaunch' | 'decisions'>(
    initialIsLiveProduction ? 'devops' : 'releases'
  );
  const [envInfo, setEnvInfo] = useState<{ projectId: string; envContext: 'LIVE-PRODUCTION' | 'DEV-APP' | 'LOCAL-DEV'; label: string } | null>(null);
  const [inboxBadges, setInboxBadges] = useState<InboxBadgeCounts | null>(null);
  // SSR-safe Focus Mode toggle (always false on initial render; hydrates preference inside useEffect)
  const [sidebarHidden, setSidebarHidden] = useState<boolean>(false);
  // Engineering & Archive sidebar section collapsed by default; auto-expands when an engineering suite is active
  const [engineeringExpanded, setEngineeringExpanded] = useState<boolean>(initialIsLiveProduction);

  useEffect(() => {
    if (['devops', 'mission', 'knowledge', 'decisions'].includes(activeSuite)) {
      setEngineeringExpanded(true);
    }
  }, [activeSuite]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem('mw_admin_focus_mode') === '1') {
        setSidebarHidden(true);
      }
    } catch {
      // Non-fatal storage guard
    }
  }, []);

  const toggleFocusMode = () => {
    setSidebarHidden((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('mw_admin_focus_mode', next ? '1' : '0');
        }
      } catch {
        // Non-fatal storage guard
      }
      return next;
    });
  };

  // Seed strictly from NEXT_PUBLIC_FIREBASE_PROJECT_ID before getBackendEnvironmentDetails resolves
  // (avoids 150ms staging-tab flash on LIVE-PRODUCTION with zero SSR/client hydration mismatch).
  const isLiveProduction = envInfo
    ? envInfo.envContext === 'LIVE-PRODUCTION' || isProductionProject(envInfo.projectId)
    : initialIsLiveProduction;

  const selectSuite = (suite: typeof activeSuite) => {
    setActiveSuite(suite);
    if (typeof window !== 'undefined') {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('suite', suite);
      nextUrl.searchParams.delete('tab');
      window.history.replaceState(null, '', `${nextUrl.pathname}?${nextUrl.searchParams.toString()}`);
    }
  };

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

      // Rehydrate active suite from URL search params (?suite=email, ?suite=vouchers, or ?tab=access)
      const urlParams = new URLSearchParams(window.location.search);
      const suiteParam = urlParams.get('suite') || urlParams.get('tab');
      if (suiteParam && ['dryrun', 'releases', 'devops', 'business', 'users', 'access', 'email', 'knowledge', 'vouchers', 'mission', 'bugs', 'prelaunch', 'decisions'].includes(suiteParam)) {
        setActiveSuite(suiteParam as any);
      } else if (urlParams.get('traceId') || urlParams.get('reportId') || urlParams.get('userId')) {
        setActiveSuite('bugs');
      } else if (activeEnv !== 'LIVE-PRODUCTION') {
        setActiveSuite('releases');
      }
    }

    getBackendEnvironmentDetails()
      .then((res) => {
        if (res.success && res.projectId) {
          const resolvedContext = (res.envContext as 'LIVE-PRODUCTION' | 'DEV-APP' | 'LOCAL-DEV') || activeEnv;
          const fallbackLabel =
            resolvedContext === 'LIVE-PRODUCTION'
              ? 'LIVE PRODUCTION'
              : resolvedContext === 'LOCAL-DEV'
              ? 'LOCAL WORKSPACE'
              : 'STAGING';
          setEnvInfo({
            projectId: res.projectId,
            envContext: resolvedContext,
            label: res.label || fallbackLabel
          });
        }
      })
      .catch(() => {
        const fallbackProjectId = clientProjectId || 'unknown';
        const fallbackContext: 'LIVE-PRODUCTION' | 'DEV-APP' | 'LOCAL-DEV' =
          isProductionProject(fallbackProjectId) ? 'LIVE-PRODUCTION' : activeEnv;
        setEnvInfo({
          projectId: fallbackProjectId,
          envContext: fallbackContext,
          label:
            fallbackContext === 'LIVE-PRODUCTION'
              ? 'LIVE PRODUCTION'
              : fallbackContext === 'LOCAL-DEV'
              ? 'LOCAL WORKSPACE'
              : 'STAGING'
        });
      });
  }, [clientProjectId]);

  useEffect(() => {
    if (!envInfo || isLiveProduction) return;
    let cancelled = false;
    const loadBadges = async () => {
      try {
        const res = await fetch('/api/admin/controls', { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.success && data.badges) {
          setInboxBadges(data.badges);
        }
      } catch {
        // Non-fatal sidebar badge refresh
      }
    };
    loadBadges();
    const onUpdated = () => loadBadges();
    window.addEventListener('admin-inbox-updated', onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('admin-inbox-updated', onUpdated);
    };
  }, [envInfo, isLiveProduction]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    router.push('/admin/login');
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 font-mono text-sm">
        <div className="animate-pulse tracking-widest text-indigo-400/80 font-black">VERIFYING ADMINISTRATIVE ACCESS CONTEXT...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Top Header (opaque bg avoids stacked backdrop-blur GPU compositing on Windows DWM) */}
      <header className="border-b border-slate-800/80 bg-slate-900/95 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 id="admin-header-title" className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent truncate">
                Memory Weaver Studio
              </h1>
              <p className="text-xs text-indigo-400 font-medium tracking-wider uppercase truncate">Command Centre Admin Hub</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <button
              type="button"
              onClick={toggleFocusMode}
              data-testid="ADMIN_FOCUS_MODE_TOGGLE"
              title={sidebarHidden ? 'Show Admin Suites Sidebar' : 'Focus Mode — Hide Sidebar for Split-Screen'}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium transition cursor-pointer ${
                sidebarHidden
                  ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-indigo-500/40 hover:text-white'
              }`}
            >
              {sidebarHidden ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
              <span>{sidebarHidden ? 'Show Suites' : 'Focus Mode'}</span>
            </button>
            {envInfo ? (
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                envInfo.envContext === 'LIVE-PRODUCTION' 
                  ? 'bg-rose-500/15 border-rose-500/35 text-rose-300' 
                  : envInfo.envContext === 'DEV-APP'
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  : 'bg-sky-500/10 border-sky-500/25 text-sky-400 font-mono'
              }`}>
                {envInfo.envContext === 'LIVE-PRODUCTION' ? (
                  <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-rose-500/40 inline-block" />
                ) : (
                  <Server className="h-3.5 w-3.5" />
                )}
                {envInfo.label} ({envInfo.projectId})
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-slate-900 border-slate-800 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-700" />
                EVALUATING ENVIRONMENT...
              </span>
            )}
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/35" />
              SYSTEM SECURE
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/60 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs font-mono font-medium transition-all cursor-pointer shadow-sm"
              title="Log Out of Admin Hub"
            >
              <LogOut className="h-3 w-3" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className={`grid grid-cols-1 gap-8 ${sidebarHidden ? '' : 'lg:grid-cols-4'}`}>
          
          {/* Left Sidebar (hidden cleanly when Focus Mode is active) */}
          {!sidebarHidden && (
          <aside className="space-y-6" data-testid="ADMIN_SUITES_SIDEBAR">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
              {/* Group 1: Launch & Testing (Staging-only — completely omitted on LIVE PRODUCTION) */}
              {!isLiveProduction && (
                <div className="space-y-1.5" data-testid="ADMIN_NAV_GROUP_LAUNCH">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-indigo-400/90 block px-3">
                    Launch &amp; Testing
                  </span>

                  <button
                    type="button"
                    data-testid="ADMIN_NAV_DRYRUN"
                    onClick={() => selectSuite('dryrun')}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                      activeSuite === 'dryrun'
                        ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-200'
                        : 'border border-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Film className="h-4 w-4 text-indigo-400" />
                      <span>🎬 Dry-Run Runway</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="ADMIN_NAV_RELEASES"
                    onClick={() => selectSuite('releases')}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                      activeSuite === 'releases'
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
                        : 'border border-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Inbox className="h-4 w-4 text-rose-400 shrink-0" />
                      <span className="truncate">Founder Inbox</span>
                    </span>
                    {inboxBadges && (inboxBadges.red > 0 || inboxBadges.amber > 0 || inboxBadges.readySignOff > 0) && (
                      <span className="flex items-center gap-1 shrink-0" data-testid="ADMIN_NAV_INBOX_BADGES">
                        {inboxBadges.red > 0 && (
                          <span
                            data-testid="ADMIN_NAV_BADGE_RED"
                            title={`${inboxBadges.red} RED blocking gate${inboxBadges.red === 1 ? '' : 's'}`}
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-rose-500/25 text-rose-200 border border-rose-500/50"
                          >
                            🔴 {inboxBadges.red}
                          </span>
                        )}
                        {inboxBadges.amber > 0 && (
                          <span
                            data-testid="ADMIN_NAV_BADGE_AMBER"
                            title={`${inboxBadges.amber} AMBER low-drag gate${inboxBadges.amber === 1 ? '' : 's'}`}
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-500/50"
                          >
                            🟠 {inboxBadges.amber}
                          </span>
                        )}
                        {inboxBadges.readySignOff > 0 && (
                          <span
                            data-testid="ADMIN_NAV_BADGE_SIGNOFF"
                            title={`${inboxBadges.readySignOff} fix${inboxBadges.readySignOff === 1 ? '' : 'es'} ready for sign-off`}
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-sky-500/25 text-sky-200 border border-sky-500/50"
                          >
                            ✅ {inboxBadges.readySignOff}
                          </span>
                        )}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    data-testid="ADMIN_NAV_BUGS"
                    onClick={() => selectSuite('bugs')}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                      activeSuite === 'bugs'
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                        : 'border border-transparent text-slate-300 hover:bg-slate-800/40 hover:text-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Bug className="h-4 w-4 text-rose-400 shrink-0" />
                      <span className="truncate">Founder Sign-Off Queue</span>
                    </span>
                    {inboxBadges && inboxBadges.readySignOff > 0 && (
                      <span
                        data-testid="ADMIN_NAV_BUGS_BADGE"
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-sky-500/25 text-sky-200 border border-sky-500/50 shrink-0"
                      >
                        {inboxBadges.readySignOff}
                      </span>
                    )}
                  </button>

                  <Link
                    href="/admin/qa"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition duration-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>QA Testing Suite</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">/admin/qa ↗</span>
                  </Link>
                </div>
              )}

              {/* Group 2: Live Operations */}
              <div
                className={`space-y-1.5 ${!isLiveProduction ? 'pt-3 border-t border-slate-800/60' : ''}`}
                data-testid="ADMIN_NAV_GROUP_LIVE_OPS"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 block px-3">
                  Live Operations
                </span>

                <button
                  type="button"
                  onClick={() => selectSuite('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                    activeSuite === 'users'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <UserCog className="h-4 w-4 text-emerald-400" />
                  Users / CRM
                </button>

                <button
                  type="button"
                  onClick={() => selectSuite('vouchers')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                    activeSuite === 'vouchers'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Gift className="h-4 w-4 text-amber-400" />
                  Heirloom Vouchers
                </button>

                <button
                  type="button"
                  onClick={() => selectSuite('email')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                    activeSuite === 'email'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Mail className="h-4 w-4 text-amber-400" />
                  Email Operations
                </button>

                <button
                  type="button"
                  onClick={() => selectSuite('prelaunch')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                    activeSuite === 'prelaunch'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span>Pre-Launch Gate</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectSuite('business')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                    activeSuite === 'business'
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Business &amp; Analytics
                </button>

                <button
                  type="button"
                  onClick={() => selectSuite('access')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                    activeSuite === 'access'
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Access &amp; Support
                </button>

                {isLiveProduction && (
                  <button
                    type="button"
                    data-testid="ADMIN_NAV_BUGS"
                    onClick={() => selectSuite('bugs')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                      activeSuite === 'bugs'
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                        : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <Bug className="h-4 w-4 text-rose-400" />
                    <span>Customer Bug Inbox</span>
                  </button>
                )}
              </div>

              {/* Group 3: Engineering & Archive (collapsed by default unless active suite is inside) */}
              <div className="pt-3 border-t border-slate-800/60 space-y-1.5" data-testid="ADMIN_NAV_GROUP_ENGINEERING">
                <button
                  type="button"
                  data-testid="ADMIN_NAV_ENGINEERING_TOGGLE"
                  onClick={() => setEngineeringExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  <span>Engineering &amp; Archive</span>
                  {engineeringExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>

                {engineeringExpanded && (
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => selectSuite('devops')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                        activeSuite === 'devops'
                          ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300'
                          : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      <Cpu className="h-4 w-4" />
                      DevOps &amp; Operations
                    </button>

                    <button
                      type="button"
                      onClick={() => selectSuite('mission')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                        activeSuite === 'mission'
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      <Rocket className="h-4 w-4 text-amber-400" />
                      Mission Control
                    </button>

                    <button
                      type="button"
                      onClick={() => selectSuite('knowledge')}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border transition-all cursor-pointer ${
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

                    {!isLiveProduction && (
                      <button
                        type="button"
                        onClick={() => selectSuite('decisions')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                          activeSuite === 'decisions'
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                            : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                        }`}
                      >
                        <ClipboardCheck className="h-4 w-4 text-amber-400" />
                        <span>Founder Decisions</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/60 mt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl border border-transparent text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-400" />
                  <span>Log Out of Admin Hub</span>
                </button>
              </div>
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
                    envInfo?.envContext === 'LIVE-PRODUCTION' ? 'bg-rose-500 ring-2 ring-rose-500/40' :
                    envInfo?.envContext === 'DEV-APP' ? 'bg-amber-500 ring-2 ring-amber-500/35' : 'bg-sky-500'
                  }`} />
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {envInfo?.label || (isLiveProduction ? 'LIVE PRODUCTION' : 'RESOLVING...')}
                  </span>
                </div>
              </div>
            </div>
          </aside>
          )}

          {/* Right Main Content Panel */}
          <main className={`space-y-8 ${sidebarHidden ? 'max-w-5xl mx-auto w-full' : 'lg:col-span-3'}`}>
            
            {/* Banner Section */}
            <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-slate-900/60 p-8 shadow-2xl">
              <div className="relative z-10 space-y-2 max-w-2xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {activeSuite === 'dryrun' && 'Founder Dry-Run Runway'}
                  {activeSuite === 'releases' && 'Founder Inbox & Release Controls'}
                  {activeSuite === 'devops' && 'DevOps & Operations'}
                  {activeSuite === 'business' && 'Business Analytics'}
                  {activeSuite === 'users' && 'Users & Customer Directory (CRM)'}
                  {activeSuite === 'access' && 'Customer Support & Access'}
                  {activeSuite === 'email' && 'Email Operations & Live Dispatcher'}
                  {activeSuite === 'vouchers' && 'Heirloom Voucher Minting'}
                  {activeSuite === 'mission' && 'Mission Control & Flight Recorder'}
                  {activeSuite === 'knowledge' && 'Living Knowledge Hub'}
                  {activeSuite === 'prelaunch' && 'Pre-Launch Gate & Tester List'}
                  {activeSuite === 'decisions' && 'Founder Cutover Decision Form'}
                  {activeSuite === 'bugs' && (isLiveProduction ? 'Production Customer Bug Inbox' : 'Staging Founder Sign-Off Queue')}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {activeSuite === 'dryrun' && 'Guided staging dry user run across SoundStage (Acts I–V), Fireside Booth, and Heirloom Gift checkout — mark PASS/SNAG and log any snag directly to Firestore.'}
                  {activeSuite === 'releases' && 'Single Staging Control Plane for 🔴 RED blocking release gates, 🟠 AMBER low-drag approvals, and 1-click sign-offs — never lost in chat.'}
                  {activeSuite === 'devops' && 'Monitor resilience memory structures, local IndexedDB states, WebRTC signaling integrity, and routing traces.'}
                  {activeSuite === 'business' && 'View subscription tier tracking, user adoption quotas, and API analytics telemetry.'}
                  {activeSuite === 'users' && 'Inspect all registered Firebase Auth accounts alongside Firestore memory counts, filter Customers vs Test/Aliases, export CSVs, and safely disable or purge non-admin accounts.'}
                  {activeSuite === 'access' && 'Manage client authentication tokens, inspect permission passes, and execute administrative bypasses.'}
                  {activeSuite === 'email' && 'Dispatch 1-click test emails across all 4 production templates, inspect live Resend API delivery receipts with SPF/DKIM validation, and audit Obsidian-Gold HTML rendering.'}
                  {activeSuite === 'vouchers' && 'Mint complimentary founder passes, test vouchers, and custom vanity codes with 1-click unboxing test links.'}
                  {activeSuite === 'mission' && 'Real-time multi-agent flight recorder tracking active platform coordinates, partner discipline checkpoints, target files, and sprint roadmap.'}
                  {activeSuite === 'knowledge' && 'Search, filter, and inspect compiled business rules, operational playbooks, subscription tier pricing, and lifecycle policies.'}
                  {activeSuite === 'prelaunch' && 'Control RESTRICTED vs PUBLIC access in 1 click, toggle Tester activation switches per visitor, and bulk-import testers from Google Sheets or CSV.'}
                  {activeSuite === 'decisions' && 'Confirm cutover decisions via pre-selected recommendations, add notes, or defer any item directly to Plane without back-and-forth chat questions.'}
                  {activeSuite === 'bugs' && (isLiveProduction
                    ? 'Live customer bug intake inbox for memoryweaver.studio. Antigravity & Gemini triage reports to Plane.so, ship P2/P3 fixes via dev first (or P0/P1 hotfix/* with automatic master -> dev back-merge), and mark verified once live.'
                    : 'Staging founder sign-off queue for dev.memoryweaver.studio. Verify FIXED_ON_DEV items live and sign off in 1 click to auto-close linked Plane.so tickets.')}
                </p>
              </div>
            </section>

            {/* Sub-Console Router */}
            <div>
              {activeSuite === 'dryrun' && (
                isLiveProduction ? (
                  <div className="rounded-2xl border border-amber-500/35 bg-slate-900/60 p-6 space-y-3">
                    <h3 className="text-base font-bold text-white">Dry-Run Runway Lives on Staging</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Founder dry user runs execute exclusively against the Staging environment so test memories and test snags never touch live production customer data.
                    </p>
                    <a
                      href={`${STAGING_APP_URL}/admin?suite=dryrun`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                    >
                      Open Staging Dry-Run Runway
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <FounderDryRunConsole
                    readyBugsCount={inboxBadges?.readySignOff ?? 0}
                    onNavigateSuite={(suite) => selectSuite(suite)}
                  />
                )
              )}
              {activeSuite === 'releases' && (
                isLiveProduction ? (
                  <div className="rounded-2xl border border-amber-500/35 bg-slate-900/60 p-6 space-y-3">
                    <h3 className="text-base font-bold text-white">Engineering Release Controls Live on Staging</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      To prevent split approvals between production and staging, all batch pushes, cutover gates, and Red/Amber release controls live strictly on the Staging Control Plane. Any control targeting live customers is clearly badged{' '}
                      <span className="font-mono font-bold text-rose-300">[ENV: PROD] • memoryweaver.studio</span> before execution.
                    </p>
                    <a
                      href={`${STAGING_APP_URL}/admin?suite=releases`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                    >
                      Open Staging Founder Inbox
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <FounderInboxConsole onNavigateSuite={(suite) => selectSuite(suite)} />
                )
              )}
              {activeSuite === 'devops' && <DevOpsConsole />}
              {activeSuite === 'business' && <BusinessConsole />}
              {activeSuite === 'users' && <UserDirectoryConsole />}
              {activeSuite === 'access' && <AccessConsole />}
              {activeSuite === 'email' && <EmailOperationsConsole />}
              {activeSuite === 'vouchers' && <VoucherMintingConsole />}
              {activeSuite === 'mission' && <MissionControlConsole />}
              {activeSuite === 'knowledge' && <KnowledgeHub />}
              {activeSuite === 'prelaunch' && (
                <PrelaunchAccessConsole
                  isProduction={
                    envInfo
                      ? envInfo.envContext === 'LIVE-PRODUCTION' || envInfo.projectId === 'memory-weaver-8rk9t'
                      : undefined
                  }
                />
              )}
              {activeSuite === 'decisions' && (
                isLiveProduction ? (
                  <div className="rounded-2xl border border-amber-500/35 bg-slate-900/60 p-6 space-y-3">
                    <h3 className="text-base font-bold text-white">Cutover Decisions Live on Staging</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Founder cutover decisions are locked to the Staging Control Plane so production Firestore is never seeded with staging cutover records.
                    </p>
                    <a
                      href={`${STAGING_APP_URL}/admin?suite=decisions`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                    >
                      Open Staging Founder Decisions
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <FounderDecisionForm />
                )
              )}
              {activeSuite === 'bugs' && <BugTriageConsole />}
            </div>

          </main>

        </div>
      </div>
    </div>
  );
}
