'use client';

/**
 * 🏷️ Fireside Mood Chips — Tactile Elder Story Resonance Selector
 *
 * Designed for elderly storytellers resting in armchairs.
 * Features:
 * - 56px minimum touch target envelope (Rule 26 Elder Ergonomics)
 * - Luminous glowing amber active state with warm border halo
 * - Dual-surface bridge compatibility with Act I & Act III desktop studio
 * - Tactile haptic feedback pulse on mobile devices (25ms)
 * - Canonical hotspot telemetry integration (HS_FIRESIDE_MOOD_*)
 *
 * Milestone: MW-88-T2 (Ticket #263)
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English, Rule 26 Elder Ergonomics, Rule 39 Armchair Powerhouse)
 */

import React, { useCallback } from 'react';
import { StoryMoodTag } from '@/types/curriculum';

export interface FiresideMoodChipsProps {
  activeMood?: StoryMoodTag;
  onMoodChange: (mood: StoryMoodTag) => void;
  disabled?: boolean;
  className?: string;
}

interface MoodOption {
  id: StoryMoodTag;
  label: string;
  emoji: string;
  hotspotId: string;
  subtext: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'joyful',
    label: 'Joyful',
    emoji: '✨',
    hotspotId: 'HS_FIRESIDE_MOOD_JOYFUL',
    subtext: 'Celebratory & warm',
  },
  {
    id: 'reflective',
    label: 'Reflective',
    emoji: '🕊️',
    hotspotId: 'HS_FIRESIDE_MOOD_REFLECTIVE',
    subtext: 'Contemplative & quiet',
  },
  {
    id: 'nostalgic',
    label: 'Nostalgic',
    emoji: '⏳',
    hotspotId: 'HS_FIRESIDE_MOOD_NOSTALGIC',
    subtext: 'Fond memories & roots',
  },
];

export const FiresideMoodChips: React.FC<FiresideMoodChipsProps> = ({
  activeMood,
  onMoodChange,
  disabled = false,
  className = '',
}) => {
  const handleSelectMood = useCallback(
    (mood: StoryMoodTag) => {
      if (disabled) return;

      // Tactile haptic confirmation pulse for mobile performers
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {
          // Non-blocking fallback for browsers restricting vibrations
        }
      }

      onMoodChange(mood);
    },
    [disabled, onMoodChange]
  );

  return (
    <div
      role="group"
      aria-label="Story resonance mood options"
      className={`w-full grid grid-cols-3 gap-2 max-w-md mx-auto ${className}`}
    >
      {MOOD_OPTIONS.map((option) => {
        const isSelected = activeMood === option.id;

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            data-hotspot-id={option.hotspotId}
            onClick={() => handleSelectMood(option.id)}
            aria-pressed={isSelected}
            title={`${option.label} mood: ${option.subtext}`}
            className={`min-h-[56px] px-2 py-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 select-none ${
              disabled ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              isSelected
                ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
                : 'bg-stone-900/80 hover:bg-stone-800/90 border border-stone-700/70 text-stone-300 hover:border-amber-500/40 hover:text-stone-100'
            }`}
          >
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-base sm:text-lg" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                {option.label}
              </span>
            </div>
            <span
              className={`text-[10px] mt-1 font-medium transition-colors hidden xs:block ${
                isSelected ? 'text-amber-300/90' : 'text-stone-400'
              }`}
            >
              {option.subtext}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default FiresideMoodChips;
