'use client';

/**
 * 🎭 Story Mood Dropdown — Cinematic Resonance Selector
 *
 * Desktop studio dropdown providing emotional mood tagging for memoir scenes.
 * Designed for seamless integration into Act I Scriptorium and Act III Review.
 *
 * Milestone: MW-88-T2 (Ticket #263)
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 8 Zero-Footprint)
 */

import React, { useCallback } from 'react';
import { StoryMoodTag } from '@/types/curriculum';
import { ChevronDown, Sparkles } from 'lucide-react';

export interface StoryMoodDropdownProps {
  value?: StoryMoodTag;
  onChange: (mood: StoryMoodTag) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

interface MoodEntry {
  id: StoryMoodTag;
  label: string;
  emoji: string;
  description: string;
}

const MOOD_ENTRIES: MoodEntry[] = [
  {
    id: 'joyful',
    label: 'Joyful',
    emoji: '✨',
    description: 'Celebratory, uplifting, and lively memories',
  },
  {
    id: 'reflective',
    label: 'Reflective',
    emoji: '🕊️',
    description: 'Contemplative, peaceful, and profound memories',
  },
  {
    id: 'nostalgic',
    label: 'Nostalgic',
    emoji: '⏳',
    description: 'Fond remembrances, ancestral roots, and bygone eras',
  },
];

export const StoryMoodDropdown: React.FC<StoryMoodDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  size = 'md',
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = e.target.value as StoryMoodTag;
      if (selected === 'joyful' || selected === 'reflective' || selected === 'nostalgic') {
        onChange(selected);
      }
    },
    [onChange]
  );

  const selectedEntry = MOOD_ENTRIES.find((m) => m.id === value);

  const isSmall = size === 'sm';

  return (
    <div
      className={`relative inline-flex items-center group ${className}`}
      title={
        selectedEntry
          ? `Story Resonance: ${selectedEntry.label} (${selectedEntry.description})`
          : 'Select emotional mood resonance for this story scene'
      }
    >
      <div
        className={`relative flex items-center gap-2 rounded-full border transition-all duration-300 pointer-events-none ${
          isSmall ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2.5 text-xs'
        } ${
          value
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:border-amber-400'
            : 'bg-zinc-900/90 border-white/10 text-stone-300 group-hover:border-white/25 group-hover:text-stone-100'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <span className="shrink-0 text-sm" aria-hidden="true">
          {selectedEntry ? selectedEntry.emoji : '🎭'}
        </span>
        <span className="font-semibold tracking-wide select-none">
          {selectedEntry ? selectedEntry.label : 'Mood'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 transition-transform group-hover:text-amber-400 ${
            value ? 'text-amber-400' : ''
          }`}
          aria-hidden="true"
        />
      </div>

      {/* Accessible native select layered over custom styled button */}
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        data-hotspot-id="HS_DESKTOP_MOOD_DROPDOWN"
        aria-label="Select story emotional mood resonance"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed text-black"
      >
        <option value="" disabled>
          Select Story Mood...
        </option>
        {MOOD_ENTRIES.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.emoji} {entry.label} — {entry.description}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StoryMoodDropdown;
