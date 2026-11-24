'use client';

/**
 * 👤 Fireside Voice & Video Studio — Elder Auth Header
 *
 * Milestone: MW-87 (Ticket #249 / MW-248)
 * Governing Rules: Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics
 * Target Route: /studio/fireside
 *
 * Displays a discreet, high-contrast account badge:
 * - If authenticated: [ 👤 User Email • Generational Vault / Director Pass ✓ ]
 * - If guest: [ 👤 Guest Session (Saved to Phone) • Tap to Sign In ]
 * Provides a high-visibility link to the Desktop Soundstage (/studio),
 * an explicit environment badge (Dev Staging), and production stage context (Act II: Story Capture).
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isProductionProject, isStagingProject, resolveProjectId } from '@/config/environment';
import {
  Sparkles,
  ArrowLeft,
  User,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  LogOut,
} from 'lucide-react';

import type { UnifiedCurriculumMemory } from '@/types/curriculum';
import { isSceneCompleted } from '@/types/curriculum';
import { OpticsPrivacyShield } from '@/components/studio/OpticsPrivacyShield';
import { FiresideProfileDrawer } from '@/components/fireside/FiresideProfileDrawer';
import { ReportIssueTrigger } from '@/components/feedback/ReportIssueTrigger';

export interface FiresideAuthHeaderProps {
  className?: string;
  activePartTitle?: string;
  activeSceneTitle?: string;
  activeStage?: number;
  activeSceneMemory?: Partial<UnifiedCurriculumMemory> | null;
}

export function resolveHeaderActBadge(
  activeStage?: number,
  activeSceneMemory?: Partial<UnifiedCurriculumMemory> | null
): string {
  if (typeof activeStage === 'number' && activeStage >= 1 && activeStage <= 4) {
    if (activeStage === 4) return '🎞️ ACT IV: SCREENING ROOM';
    if (activeStage === 3) return '🎙️ ACT III: SOUNDSTAGE';
    if (activeStage === 2) return '✨ ACT II: THE WEAVE';
    return '🎬 ACT I: SCRIPTORIUM';
  }
  const stage = activeStage ?? activeSceneMemory?.productionStage;
  if (
    stage === 4 ||
    activeSceneMemory?.currentStatus === 'mastered' ||
    Boolean(activeSceneMemory?.directorialPolish?.masterReelUrl)
  ) {
    return '🎞️ ACT IV: SCREENING ROOM';
  }
  if (stage === 3 || isSceneCompleted(activeSceneMemory)) {
    return '🎙️ ACT III: SOUNDSTAGE';
  }
  if (stage === 2) {
    return '✨ ACT II: THE WEAVE';
  }
  return '🎬 ACT I: SCRIPTORIUM';
}

export function resolveHeaderActBadgeStyle(headerActBadge: string): string {
  if (headerActBadge.includes('ACT IV')) {
    return 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300';
  }
  if (headerActBadge.includes('ACT II') || headerActBadge.includes('ACT III')) {
    return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
  }
  return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
}

export function isProductionHostname(hostname?: string | null): boolean {
  const clean = (hostname || '').trim().toLowerCase();
  return clean === 'memoryweaver.studio' || clean === 'www.memoryweaver.studio';
}

export function FiresideAuthHeader({
  className = '',
  activePartTitle,
  activeStage,
  activeSceneMemory,
}: FiresideAuthHeaderProps) {
  const { user, logout } = useAuth();
  const isAuthenticated = !!(user && !user.isAnonymous);
  const userEmail = user?.email || (isAuthenticated ? 'Authenticated Storyteller' : null);

  const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || '';
  const projectId = resolveProjectId();
  const [clientIsProdHost, setClientIsProdHost] = useState<boolean>(() =>
    typeof window !== 'undefined' ? isProductionHostname(window.location?.hostname) : false
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientIsProdHost(isProductionHostname(window.location?.hostname));
    }
  }, []);

  // Strict fail-closed staging pill guard: NEVER render "Dev Staging" on production
  // project (memory-weaver-8rk9t) or production hostnames (memoryweaver.studio / www.memoryweaver.studio).
  const showStagingBadge =
    !isProductionProject(projectId) &&
    !clientIsProdHost &&
    isStagingProject(projectId);

  const headerActBadge = resolveHeaderActBadge(activeStage, activeSceneMemory);

  return (
    <header
      className={`w-full border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-2.5 transition-colors ${className}`}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-between gap-1.5 sm:gap-2">
        {/* Row 1: Split into two balanced full-width rows on < sm; single row on sm+ */}
        <div className="w-full flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {/* Sub-row 1A: Back to Production Board + Fireside Studio Title (+ Staging Badge on staging only) */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 min-w-0">
            <Link
              href="/studio"
              data-testid="HS_FIRESIDE_HEADER_NAV_DESKTOP_BTN"
              data-hotspot-id="HS_FIRESIDE_HEADER_NAV_DESKTOP_BTN"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-xl transition-all shrink-0 cursor-pointer shadow-sm group"
              title="Return to Production Board"
              aria-label="Return to Production Board"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-amber-400" />
              <span className="hidden sm:inline">Back to Production Board</span>
              <span className="sm:hidden">Production Board</span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2 text-amber-400 min-w-0 flex-wrap justify-end">
              <div className="inline-flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-serif font-semibold tracking-wide text-amber-300 truncate">
                  Fireside Studio
                </span>
              </div>

              {/* Explicit Environment Badge — strictly gated to staging */}
              {showStagingBadge && (
                <span
                  data-testid="HS_FIRESIDE_HEADER_STAGING_BADGE"
                  className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold shrink-0"
                  title={`Deployment Environment: Dev Staging${commitSha ? ` (${commitSha.slice(0, 7)})` : ''}`}
                >
                  Dev Staging{commitSha ? ` • ${commitSha.slice(0, 7)}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Sub-row 1B: Production Act Context Badge + Hardware Optics Privacy Shield */}
          <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
            {/* Dynamic Production Stage Context Badge Synchronised with Desktop Studio (MW-88-T8 / MW-88-T9 / MW-119) */}
            <span
              data-testid="HS_FIRESIDE_HEADER_ACT_BADGE"
              className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full font-semibold shrink-0 border ${resolveHeaderActBadgeStyle(headerActBadge)}`}
              title={`Active Production Stage: ${headerActBadge}`}
            >
              {headerActBadge}
            </span>

            {/* Hardware Camera & Microphone Privacy Shield (MW-88-T9 Desktop Parity) */}
            <OpticsPrivacyShield compact className="py-1 px-2 sm:px-2.5 min-h-[32px] sm:min-h-[36px]" />

            {/* Active Curriculum Part Badge if provided */}
            {activePartTitle && (
              <span
                className="hidden md:inline-block text-[10px] font-mono text-stone-400 border border-stone-800 bg-stone-900/60 rounded px-1.5 py-0.5 shrink-0"
                title={`Curriculum Alignment: ${activePartTitle}`}
              >
                {activePartTitle.split(':')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Compact Elder Auth Badge & Mobile Profile Drawer Trigger */}
        <div className="w-full flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0">
          {isAuthenticated ? (
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
              <div
                data-testid="HS_FIRESIDE_HEADER_USER_BADGE"
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 rounded-full shadow-sm max-w-[185px] sm:max-w-md truncate"
                title={`Signed in as ${userEmail}. Your memories are secured in the Generational Vault.`}
              >
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-[240px] font-medium text-emerald-200">
                  {userEmail}
                </span>
                <span className="text-emerald-500/70">•</span>
                <span className="flex items-center gap-1 text-emerald-300 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Generational Vault</span>
                  <span className="sm:hidden">Vault</span>
                  <span>✓</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  data-hotspot-id="HS_FIRESIDE_HEADER_SIGNOUT_BTN"
                  data-testid="HS_FIRESIDE_HEADER_SIGNOUT_BTN"
                  onClick={async () => {
                    try {
                      await logout(false);
                    } catch (err) {
                      console.error('Logout error:', err);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-400 hover:text-rose-300 bg-stone-900/80 hover:bg-rose-950/40 border border-stone-800 hover:border-rose-500/40 px-2 py-1 rounded-full transition-all cursor-pointer shadow-sm shrink-0"
                  title="Sign out of this session"
                  aria-label="Sign out"
                >
                  <LogOut className="w-2.5 h-2.5 text-stone-400 group-hover:text-rose-300" />
                  <span>Sign Out</span>
                </button>

                <ReportIssueTrigger variant="icon-pill" label="Issue" className="shrink-0" />

                {/* Mobile Slide-Over Account & Navigation Drawer (min 44px touch target) */}
                <FiresideProfileDrawer />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login?redirect=/studio/fireside"
                data-testid="HS_FIRESIDE_HEADER_SIGNIN_BTN"
                data-hotspot-id="HS_FIRESIDE_HEADER_SIGNIN_BTN"
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-stone-300 hover:text-amber-200 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-500/50 px-3 py-1.5 rounded-full transition-all shadow-sm group cursor-pointer min-h-[44px]"
                title="Currently running in local guest session. Tap to sign in and back up to the Generational Vault."
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-300 shrink-0" />
                <span className="text-stone-300">
                  Guest Session<span className="hidden sm:inline"> (Saved to Phone)</span>
                </span>
                <span className="text-stone-500">•</span>
                <span className="text-amber-300 group-hover:underline flex items-center gap-1 font-semibold">
                  <span>Sign In</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </Link>

              <ReportIssueTrigger variant="icon-pill" label="Issue" className="shrink-0" />

              {/* Mobile Slide-Over Account & Navigation Drawer (min 44px touch target) */}
              <FiresideProfileDrawer />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default FiresideAuthHeader;
