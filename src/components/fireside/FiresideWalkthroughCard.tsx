'use client';

/**
 * 🧭 Fireside Free Walkthrough & 30-Second Soundcheck Card (MW-88-T5)
 *
 * Mobile rehearsal counterpart to Desktop's `FlightSimulatorCard.tsx`.
 * Invites storytellers to experience Fireside capture (Selfie Video Memo & Tactile Voice)
 * with the canonical "Sunday Kettle & Cardamom Chai" script across 4 languages without
 * writing any mock data to the permanent Generational Vault.
 *
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 12 Optimistic UI, Rule 14 Prose Preservation,
 *  Rule 20 British English: synchronised, prioritised, sanitisation, colour, behaviour, digitiser, centred,
 *  Rule 26 48px-56px Elder Ergonomic Touch Targets)
 */

import React, { useState, useEffect } from 'react';
import { Compass, Coffee } from 'lucide-react';
import type { FiresideLanguage } from '@/types/fireside';
import { FIRESIDE_TOUCH_TARGETS } from '@/types/fireside';
import { WARMUP_CHAI_SCRIPTS } from './FiresideWarmupModal';

const WALKTHROUGH_DISMISS_KEY = 'mw_dismiss_fireside_walkthrough';

export interface FiresideWalkthroughCardProps {
  activeLanguage?: FiresideLanguage;
  warmupCompleted?: boolean;
  onLaunchWalkthrough: () => void;
  className?: string;
}

export const FiresideWalkthroughCard: React.FC<FiresideWalkthroughCardProps> = ({
  activeLanguage = 'en',
  warmupCompleted = false,
  onLaunchWalkthrough,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(WALKTHROUGH_DISMISS_KEY) === 'true';
        setIsDismissed(stored);
      }
    } catch {
      // Ignore sessionStorage restrictions in private browsing
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(WALKTHROUGH_DISMISS_KEY, 'true');
      }
    } catch {
      // Ignore storage errors
    }
  };

  const handleExpandAndOpen = () => {
    setIsDismissed(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(WALKTHROUGH_DISMISS_KEY);
      }
    } catch {
      // Ignore storage errors
    }
    onLaunchWalkthrough();
  };

  const chaiScript = WARMUP_CHAI_SCRIPTS[activeLanguage] || WARMUP_CHAI_SCRIPTS.en;

  if (isDismissed) {
    return (
      <div className={`w-full max-w-xl mx-auto flex flex-col items-center gap-2 ${className}`}>
        <button
          type="button"
          data-testid="HS_FIRESIDE_WALKTHROUGH_COLLAPSED_PILL"
          data-hotspot-id="HS_FIRESIDE_WALKTHROUGH_COLLAPSED_PILL"
          onClick={handleExpandAndOpen}
          style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
          className="w-full min-h-[56px] px-5 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-98 border border-amber-400/40 text-amber-200 font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md shadow-amber-500/10"
        >
          <span>[ 🎙️ 📹 Free Walkthrough &amp; 30s Soundcheck ]</span>
          {warmupCompleted && (
            <span className="ml-1 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              ✓ Ready
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="fireside-walkthrough-card"
      className={`w-full max-w-xl mx-auto relative rounded-3xl overflow-hidden bg-[#141210]/95 backdrop-blur-xl border border-amber-500/35 shadow-[0_0_40px_rgba(245,158,11,0.12)] p-6 sm:p-8 transition-all ${className}`}
    >
      {/* Top Specular Edge Highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />

      <div className="space-y-3.5">
        {/* Eyebrow Pill & Secondary Quick Soundcheck Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase bg-amber-500/15 border border-amber-500/35 text-amber-300">
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>🧭 🎙️ FIRESIDE WALKTHROUGH // 30S REHEARSAL • ZERO-FRICTION PRACTICE FLIGHT</span>
          </span>

          <button
            type="button"
            data-testid="fireside-warmup-trigger"
            data-hotspot-id="HS_FIRESIDE_WARMUP_TRIGGER_BTN"
            onClick={onLaunchWalkthrough}
            className="text-[11px] font-mono text-amber-300/90 hover:text-amber-200 underline underline-offset-4 cursor-pointer px-2 py-1 rounded-lg"
            aria-label="30-Second Mic Warmup and Soundcheck"
          >
            🎙️ 30-Second Mic Warmup &amp; Soundcheck
            {warmupCompleted ? ' (✓ Ready)' : ''}
          </button>
        </div>

        {/* Headline */}
        <h2 className="text-lg sm:text-xl font-serif font-bold text-white italic tracking-tight leading-snug">
          Free Walkthrough — Experience Fireside Capture &amp; Soundcheck Without Saving
        </h2>

        {/* Canonical Multi-Lingual Cardamom Chai Script Excerpt */}
        <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-white/15 border-l-4 border-l-amber-400 text-white shadow-inner">
          <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
          <p
            data-testid="walkthrough-chai-script-excerpt"
            className="text-xs sm:text-sm font-serif italic leading-relaxed text-stone-100"
          >
            &ldquo;{chaiScript}&rdquo;
          </p>
        </div>

        {/* Reassurance Body */}
        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
          Step through the Fireside arc: Sample Chai Script → 10s Camera/Mic Take → Acoustic Warmth Check → Photo Digitiser Preview. Your Generational Vault progress remains untouched.
        </p>

        {/* Action Row: Primary CTA + Dismiss Trigger (Rule 26: 56px Touch Envelopes) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <button
            type="button"
            data-testid="HS_FIRESIDE_WALKTHROUGH_TRIGGER_BTN"
            data-hotspot-id="HS_FIRESIDE_WALKTHROUGH_TRIGGER_BTN"
            onClick={onLaunchWalkthrough}
            style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
            className="flex-1 min-h-[56px] px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm font-mono uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>[ 🎬 Step into 30s Practice Walkthrough ]</span>
          </button>

          <button
            type="button"
            data-testid="HS_FIRESIDE_WALKTHROUGH_DISMISS_BTN"
            data-hotspot-id="HS_FIRESIDE_WALKTHROUGH_DISMISS_BTN"
            onClick={handleDismiss}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center cursor-pointer"
          >
            <span>[ ✕ Dismiss ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiresideWalkthroughCard;
