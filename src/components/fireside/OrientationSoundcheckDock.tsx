'use client';

/**
 * 🧭 Studio Orientation & Soundcheck Dock (MW-100-C)
 *
 * Unifies the "Large Display / Tablet Detected" recommendation panel and the
 * "Fireside 30-Second Walkthrough & Soundcheck" rehearsal panel into a single,
 * top-anchored orientation container above the chapter header across all scenes.
 *
 * Behaviour:
 * - First visit: Expanded by default (`localStorage.getItem('mw_orientation_dock_collapsed') !== 'true'`).
 * - Minimised state: Collapses into a sleek 44px+ single-line utility strip persisted in
 *   `localStorage.getItem('mw_orientation_dock_collapsed')`.
 * - Eliminates the 320px vertical layout jump when stepping between Scene 1 and Scene 2+.
 *
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 12 0ms Optimistic UI, Rule 20 British English, Rule 26 44px+ Touch Targets)
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Monitor, Compass, ChevronUp, ChevronDown } from 'lucide-react';
import type { FiresideLanguage } from '@/types/fireside';
import { FIRESIDE_TOUCH_TARGETS } from '@/types/fireside';
import { FiresideWalkthroughCard } from './FiresideWalkthroughCard';
import { FiresideWarmupModal } from './FiresideWarmupModal';

export const ORIENTATION_DOCK_STORAGE_KEY = 'mw_orientation_dock_collapsed';

export interface OrientationSoundcheckDockProps {
  activeLanguage?: FiresideLanguage;
  warmupCompleted?: boolean;
  onWarmupComplete?: () => void;
  showDesktopBanner?: boolean;
  onDismissDesktopBanner?: () => void;
  className?: string;
}

export const OrientationSoundcheckDock: React.FC<OrientationSoundcheckDockProps> = ({
  activeLanguage = 'en',
  warmupCompleted: externalWarmupCompleted,
  onWarmupComplete,
  showDesktopBanner = true,
  onDismissDesktopBanner,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(ORIENTATION_DOCK_STORAGE_KEY) === 'true';
      }
    } catch {
      // Ignore storage access errors in restricted contexts
    }
    return false;
  });

  const [isWarmupOpen, setIsWarmupOpen] = useState<boolean>(false);
  const [internalWarmupCompleted, setInternalWarmupCompleted] = useState<boolean>(false);

  const warmupCompleted = externalWarmupCompleted ?? internalWarmupCompleted;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(ORIENTATION_DOCK_STORAGE_KEY) === 'true';
        setIsCollapsed(stored);
      }
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  const handleToggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ORIENTATION_DOCK_STORAGE_KEY, nextCollapsed ? 'true' : 'false');
      }
    } catch {
      // Ignore storage restrictions
    }
  };

  const handleOpenSoundcheck = () => {
    setIsWarmupOpen(true);
  };

  return (
    <section
      data-testid="HS_ORIENTATION_SOUNDCHECK_DOCK"
      aria-label="Studio Orientation and 30-Second Soundcheck Dock"
      className={`w-full max-w-2xl mx-auto transition-all duration-200 ${className}`}
    >
      {isCollapsed ? (
        /* Minimised Single-Line 44px+ Utility Strip */
        <div
          data-testid="HS_ORIENTATION_DOCK_COLLAPSED_STRIP"
          className="w-full min-h-[48px] px-3 py-1.5 rounded-2xl bg-stone-950/90 border border-amber-500/30 shadow-md flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/studio"
              data-testid="HS_ORIENTATION_LAUNCH_SOUNDSTAGE_BTN"
              data-hotspot-id="HS_FIRESIDE_BANNER_LAUNCH_STAGE_BTN"
              style={{ minHeight: 44 }}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Switch to the full 4-Act Desktop Theatrical Soundstage"
            >
              <Monitor className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>[ 🖥️ Desktop Soundstage ↗ ]</span>
            </Link>

            <button
              type="button"
              data-testid="HS_ORIENTATION_LAUNCH_SOUNDCHECK_BTN"
              data-hotspot-id="HS_FIRESIDE_WALKTHROUGH_COLLAPSED_PILL"
              onClick={handleOpenSoundcheck}
              style={{ minHeight: 44 }}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Launch 30-second rehearsal and microphone soundcheck without saving"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>[ 🎙️ 30s Soundcheck ]</span>
              {warmupCompleted && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  ✓ Ready
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            data-testid="HS_ORIENTATION_DOCK_MINIMISE_BTN"
            onClick={handleToggleCollapse}
            style={{ minHeight: 44 }}
            aria-expanded={false}
            aria-label="Expand Studio Orientation and Soundcheck Dock"
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-300 hover:text-white text-xs font-mono font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <span>[ + Expand ▾ ]</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Expanded Orientation & Soundcheck Dock (First-Visit Default) */
        <div className="w-full rounded-3xl bg-gradient-to-b from-stone-950/95 via-stone-900/90 to-stone-950/95 border border-amber-500/35 p-3.5 sm:p-4 shadow-2xl space-y-3">
          {/* Dock Header Bar with Minimise Option */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-800/80">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                🧭 Studio Orientation &amp; Soundcheck
              </span>
              <span className="hidden sm:inline text-[11px] text-stone-400 font-mono">
                • Surface Chooser &amp; 30s Rehearsal
              </span>
            </div>

            <button
              type="button"
              data-testid="HS_ORIENTATION_DOCK_MINIMISE_BTN"
              onClick={handleToggleCollapse}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              aria-expanded={true}
              aria-label="Minimise Studio Orientation and Soundcheck Dock"
              className="min-h-[44px] px-3 py-1 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-stone-300 hover:text-white text-xs font-mono font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>[ — Minimise ▴ ]</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Panel 1: Large Display / Desktop Soundstage Recommendation */}
            {showDesktopBanner && (
              <div
                data-testid="desktop-soundstage-banner"
                className="w-full bg-gradient-to-r from-amber-950/60 via-stone-900/90 to-amber-950/60 border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 shadow-lg relative"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-300">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          Large Display / Tablet Detected
                        </span>
                        <span className="text-[11px] text-stone-400">• Theatrical Experience Available</span>
                      </div>
                      <h2 className="text-sm sm:text-base font-serif font-medium text-white mt-1">
                        Recommend Flagship Desktop Theatrical Soundstage
                      </h2>
                      <p className="text-xs text-stone-300 mt-0.5 max-w-xl leading-relaxed">
                        You are viewing Fireside on a tablet, unfolded foldable, or desktop screen. For the full multi-act theatrical experience with teleprompter controls, live audio visualisation, and multi-track master reel editing, try the Desktop Stage (Acts I–IV).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                    <Link
                      href="/studio"
                      data-testid="HS_ORIENTATION_LAUNCH_SOUNDSTAGE_BTN"
                      data-hotspot-id="HS_FIRESIDE_BANNER_LAUNCH_STAGE_BTN"
                      style={{ minHeight: 44 }}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 font-sans shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <span>Launch Soundstage</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    {onDismissDesktopBanner && (
                      <button
                        type="button"
                        onClick={onDismissDesktopBanner}
                        data-hotspot-id="HS_FIRESIDE_BANNER_DISMISS_BTN"
                        className="p-2 text-stone-400 hover:text-stone-200 hover:bg-white/5 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Dismiss large display recommendation"
                        aria-label="Dismiss recommendation"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Panel 2: Fireside 30-Second Walkthrough & Soundcheck */}
            {!isWarmupOpen && (
              <div className="w-full flex flex-col gap-2">
                <FiresideWalkthroughCard
                  activeLanguage={activeLanguage}
                  warmupCompleted={warmupCompleted}
                  onLaunchWalkthrough={handleOpenSoundcheck}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    data-testid="HS_ORIENTATION_LAUNCH_SOUNDCHECK_BTN"
                    onClick={handleOpenSoundcheck}
                    style={{ minHeight: 44 }}
                    className="sr-only"
                  >
                    Launch 30-Second Soundcheck
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {warmupCompleted && !isWarmupOpen && (
        <div
          data-testid="warmup-exit-banner"
          className="w-full mt-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-xs sm:text-sm font-medium text-center"
          role="status"
        >
          Soundcheck complete. Entering Part I: Roots and Foundations.
        </div>
      )}

      {isWarmupOpen && (
        <div className="mt-2">
          <FiresideWarmupModal
            isOpen={isWarmupOpen}
            activeLanguage={activeLanguage}
            onClose={() => setIsWarmupOpen(false)}
            onComplete={() => {
              setInternalWarmupCompleted(true);
              setIsWarmupOpen(false);
              onWarmupComplete?.();
            }}
          />
        </div>
      )}
    </section>
  );
};

export default OrientationSoundcheckDock;
