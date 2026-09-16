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
        className="w-full bg-[#141414] border border-stone-800 rounded-2xl p-1.5 grid grid-cols-2 gap-2 shadow-inner"
        role="tablist"
        aria-label="Storytelling Modes"
      >
        {/* Tab 1: Voice & Photos */}
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'audio'}
          onClick={() => handleSelectMode('audio')}
          style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
          className={`relative rounded-xl px-4 py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 ${
            mode === 'audio'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-md shadow-amber-950/40 font-bold border border-amber-400/40'
              : 'bg-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          <Mic className={`w-5 h-5 ${mode === 'audio' ? 'text-stone-950' : 'text-stone-400'}`} />
          <span>Voice & Photos</span>
          {suggestedMode === 'audio' && (
            <span
              className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ml-1 flex items-center gap-1 shrink-0 transition-all ${
                mode === 'audio'
                  ? 'bg-stone-950 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-950/50 font-bold'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
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
          aria-selected={mode === 'video'}
          onClick={() => handleSelectMode('video')}
          style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
          className={`relative rounded-xl px-4 py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 ${
            mode === 'video'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-md shadow-amber-950/40 font-bold border border-amber-400/40'
              : 'bg-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
          }`}
        >
          <Video className={`w-5 h-5 ${mode === 'video' ? 'text-stone-950' : 'text-stone-400'}`} />
          <span>Video Memo</span>
          {suggestedMode === 'video' && (
            <span
              className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ml-1 flex items-center gap-1 shrink-0 transition-all ${
                mode === 'video'
                  ? 'bg-stone-950 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-950/50 font-bold'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Recommended</span>
            </span>
          )}
        </button>
      </div>

      {/* Subtext description for narrator reassurance */}
      <p className="text-xs text-stone-400 text-center mt-2.5 px-2">
        {mode === 'audio'
          ? 'Armchair comfort: Record high-fidelity voice and digitise vintage family album prints.'
          : 'FaceTime style: Intimate selfie video memo with the prompt pinned near the front camera.'}
      </p>
    </div>
  );
}

export default FiresideModeSwitch;
