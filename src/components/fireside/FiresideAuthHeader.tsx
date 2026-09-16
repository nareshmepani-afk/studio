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

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Sparkles,
  ArrowLeft,
  User,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Mic,
  LogOut,
} from 'lucide-react';

export interface FiresideAuthHeaderProps {
  className?: string;
  activePartTitle?: string;
  activeSceneTitle?: string;
}

export function FiresideAuthHeader({
  className = '',
  activePartTitle,
}: FiresideAuthHeaderProps) {
  const { user, logout } = useAuth();
  const isAuthenticated = !!(user && !user.isAnonymous);
  const userEmail = user?.email || (isAuthenticated ? 'Authenticated Storyteller' : null);

  const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || '';

  return (
    <header
      className={`w-full border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 transition-colors ${className}`}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-between gap-2 sm:gap-2.5">
        {/* Row 1: Back to Desktop Stage & Studio Title & Staging Environment Badges */}
        <div className="w-full flex items-center justify-between gap-2.5 sm:gap-3">
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 py-1.5 px-2.5 sm:px-3 rounded-xl transition-all shrink-0 cursor-pointer shadow-sm group"
            title="Switch to Desktop Theatrical Soundstage (Acts I–IV)"
            aria-label="Switch to Desktop Theatrical Soundstage"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-amber-400" />
            <span className="hidden sm:inline">Desktop Soundstage (Acts I–IV)</span>
            <span className="sm:hidden">Desktop Stage</span>
          </Link>

          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-4 h-4 animate-pulse text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-serif font-semibold tracking-wide text-amber-300 truncate">
              Fireside Studio
            </span>

            {/* Explicit Environment Badge with Commit SHA to Disambiguate and Confirm Latest Version */}
            <span
              className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold shrink-0"
              title={`Deployment Environment: Dev Staging${commitSha ? ` (${commitSha.slice(0, 7)})` : ''}`}
            >
              Dev Staging{commitSha ? ` • ${commitSha.slice(0, 7)}` : ''}
            </span>

            {/* Explicit Production Stage Context: Act II Equivalent (visible on unfolded foldables, tablets & desktops) */}
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-stone-300 shrink-0"
              title="Production Context: Act II Equivalent Armchair Story Capture"
            >
              <Mic className="w-2.5 h-2.5 text-amber-400" />
              <span>Act II: Story Capture</span>
            </span>

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

        {/* Row 2: Discreet Elder Auth Badge (On its own dedicated row - zero horizontal collision) */}
        <div className="w-full flex items-center justify-center sm:justify-end gap-2 shrink-0 pt-0.5">
          {isAuthenticated ? (
            <>
              <div
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1 rounded-full shadow-sm max-w-full truncate"
                title={`Signed in as ${userEmail}. Your memories are secured in the Generational Vault.`}
              >
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[180px] sm:max-w-[280px] md:max-w-[360px] font-medium text-emerald-200">
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

              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout(false);
                  } catch (err) {
                    console.error('Logout error:', err);
                  }
                }}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-400 hover:text-rose-300 bg-stone-900/80 hover:bg-rose-950/40 border border-stone-800 hover:border-rose-500/40 px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-sm shrink-0"
                title="Sign out of this session"
                aria-label="Sign out"
              >
                <LogOut className="w-2.5 h-2.5 text-stone-400 group-hover:text-rose-300" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login?redirect=/studio/fireside"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-stone-300 hover:text-amber-200 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-500/50 px-3 py-1 rounded-full transition-all shadow-sm group cursor-pointer"
              title="Currently running in local guest session. Tap to sign in and back up to the Generational Vault."
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-300 shrink-0" />
              <span className="text-stone-300">Guest Session (Saved to Phone)</span>
              <span className="text-stone-500">•</span>
              <span className="text-amber-300 group-hover:underline flex items-center gap-1">
                <span>Sign In</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default FiresideAuthHeader;
