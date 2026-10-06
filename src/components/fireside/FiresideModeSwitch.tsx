'use client';

/**
 * 🎛️ Fireside Mode Switch — Voice & Photos vs FaceTime Video Memo
 *
 * Milestone: MW-87 (Ticket #249 / MW-248)
 * Governing Rules: Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics
 * Target Route: /studio/fireside
 *
 * Provides an oversized, high-contrast toggle between:
 * - [ 🎙️ Voice & Photos ]: Armchair audio recording with physical album photo digitisation
 * - [ 🎥 Video Memo ]: Intimate front-camera FaceTime/WhatsApp-style video memoirs
 *
 * Features minimum 48px touch heights, subtle haptic pulses, and localStorage persistence.
 */

import React, { useCallback } from 'react';
import { Mic, Video, Sparkles } from 'lucide-react';
import { FiresideMediaMode, FIRESIDE_TOUCH_TARGETS } from '@/types/fireside';

export interface FiresideModeSwitchProps {
  mode: FiresideMediaMode;
  onModeChange: (mode: FiresideMediaMode) => void;
  className?: string;
  suggestedMode?: FiresideMediaMode | null;
}

export const FIRESIDE_PREFERRED_MODE_STORAGE_KEY = 'mw_fireside_preferred_mode';
export const FIRESIDE_MODE_STORAGE_KEY = 'mw_fireside_media_mode';

export function FiresideModeSwitch({
  mode,
  onModeChange,
  className = '',
  suggestedMode = null,
}: FiresideModeSwitchProps) {
  const handleSelectMode = useCallback(
    (newMode: FiresideMediaMode) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(FIRESIDE_PREFERRED_MODE_STORAGE_KEY, newMode);
          localStorage.setItem(FIRESIDE_MODE_STORAGE_KEY, newMode);
        } catch {
          // localStorage disabled or blocked
        }

        if ('vibrate' in navigator) {
          try {
            navigator.vibrate([25]);
          } catch {}
        }
      }
      onModeChange(newMode);
    },
    [onModeChange]
  );

  return (
    <div
      className={`w-full max-w-xl mx-auto flex flex-col items-center select-none ${className}`}
      role="region"
      aria-label="Storytelling Recording Mode"
    >
      <div
        data-testid="HS_ACT3_MODE_SELECTOR"
        className="w-full bg-stone-950/80 border border-stone-800/80 rounded-xl p-1 grid grid-cols-2 gap-1.5 shadow-inner"
        role="tablist"
        aria-label="Storytelling Modes"
      >
        {/* Tab 1: Voice & Photos */}
        <button
          type="button"
          role="tab"
          data-testid="HS_ACT3_MODE_VOICE_BTN"
          data-hotspot-id="HS_FIRESIDE_MODE_VOICE"
          aria-selected={mode === 'audio'}
          onClick={() => handleSelectMode('audio')}
          style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
          className={`relative rounded-lg px-3 py-1.5 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
            mode === 'audio'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-sm shadow-amber-950/40 font-bold border border-amber-400/80 ring-2 ring-emerald-400'
              : 'bg-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          <Mic className={`w-4 h-4 ${mode === 'audio' ? 'text-stone-950' : 'text-stone-400'}`} />
          <span>Voice & Photos</span>
          {suggestedMode === 'audio' && (
            <span
              className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full ml-0.5 flex items-center gap-1 shrink-0 transition-all ${
                mode === 'audio'
                  ? 'bg-stone-950 text-amber-300 border border-amber-400/50 font-bold'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Curriculum</span>
            </span>
          )}
        </button>

        {/* Tab 2: Video Memo */}
        <button
          type="button"
          role="tab"
          data-testid="HS_ACT3_MODE_VIDEO_BTN"
          data-hotspot-id="HS_FIRESIDE_MODE_VIDEO"
          aria-selected={mode === 'video'}
          onClick={() => handleSelectMode('video')}
          style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
          className={`relative rounded-lg px-3 py-1.5 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
            mode === 'video'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-sm shadow-amber-950/40 font-bold border border-amber-400/80 ring-2 ring-emerald-400'
              : 'bg-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          <Video className={`w-4 h-4 ${mode === 'video' ? 'text-stone-950' : 'text-stone-400'}`} />
          <span>Video Memo</span>
          {suggestedMode === 'video' && (
            <span
              className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full ml-0.5 flex items-center gap-1 shrink-0 transition-all ${
                mode === 'video'
                  ? 'bg-stone-950 text-amber-300 border border-amber-400/50 font-bold'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Recommended</span>
            </span>
          )}
        </button>
      </div>

      {/* Subtext description for narrator reassurance */}
      <p className="text-[11px] text-stone-500 text-center mt-1 px-2 leading-tight">
        {mode === 'audio'
          ? 'Armchair comfort: Record high-fidelity voice and digitise vintage family album prints.'
          : 'WhatsApp/FaceTime style: Intimate selfie video memo with the prompt pinned near the front camera.'}
      </p>
    </div>
  );
}

export default FiresideModeSwitch;
