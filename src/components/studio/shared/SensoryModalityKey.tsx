"use client";

import React, { useMemo } from 'react';
import { Headphones, Eye, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { filterDominantSensoryAnchors, type DetectedAnchor } from '@/utils/sensoryAnchors';
import type { SensoryScriptEditorRef } from './SensoryScriptEditor';

export interface SensoryModalityKeyProps {
  editorRef?: React.RefObject<SensoryScriptEditorRef | null>;
  detectedAnchors: DetectedAnchor[];
  onAnchorClick?: (modality: 'soundscape' | 'visual' | 'aroma', word: string) => void;
  className?: string;
  activeModality?: 'soundscape' | 'visual' | 'aroma' | null;
  showLabel?: boolean;
  label?: string;
  testIdPrefix?: string;
}

export const SensoryModalityKey: React.FC<SensoryModalityKeyProps> = ({
  editorRef,
  detectedAnchors,
  onAnchorClick,
  className,
  activeModality,
  showLabel = true,
  label = 'Live Sensory Anchors:',
  testIdPrefix = 'sensory-modality-key',
}) => {
  const dominantAnchors = useMemo(() => {
    return filterDominantSensoryAnchors(detectedAnchors);
  }, [detectedAnchors]);

  const soundscapeAnchor = dominantAnchors.find((a) => a.type === 'soundscape');
  const visualAnchor = dominantAnchors.find((a) => a.type === 'visual');
  const aromaAnchor = dominantAnchors.find((a) => a.type === 'aroma');

  const soundscapeCount = detectedAnchors.filter((a) => a.type === 'soundscape').length;
  const visualCount = detectedAnchors.filter((a) => a.type === 'visual').length;
  const aromaCount = detectedAnchors.filter((a) => a.type === 'aroma').length;

  const handleModalityClick = (modality: 'soundscape' | 'visual' | 'aroma', targetWord?: string) => {
    if (!targetWord) return;
    editorRef?.current?.pulseAndSelectWord(targetWord, modality);
    onAnchorClick?.(modality, targetWord);
  };

  return (
    <div
      data-testid={testIdPrefix}
      className={cn('flex items-center gap-2 flex-wrap text-xs font-mono', className)}
    >
      {showLabel && (
        <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 shrink-0">
          <span>✨</span>
          <span>{label}</span>
        </span>
      )}

      <div className="inline-flex items-center gap-1.5 flex-wrap">
        {/* SOUNDSCAPE (Sky Blue - Rule 45 / Rule 48.3) */}
        <button
          type="button"
          data-testid={`${testIdPrefix}-soundscape`}
          onClick={() => handleModalityClick('soundscape', soundscapeAnchor?.word)}
          disabled={soundscapeCount === 0}
          aria-pressed={activeModality === 'soundscape'}
          title={
            soundscapeAnchor
              ? `Jump to soundscape anchor: "${soundscapeAnchor.word}"`
              : 'Acoustic cues (whispers, laughter, music, bells, etc.)'
          }
          className={cn(
            'min-h-[36px] sm:min-h-[32px] px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 transition-all border cursor-pointer',
            soundscapeCount > 0
              ? 'bg-sky-500/20 text-sky-200 border-sky-400/50 ring-1 ring-sky-400/30 hover:bg-sky-500/30 hover:border-sky-300 font-bold active:scale-95'
              : 'bg-white/5 text-stone-500 border-white/10 opacity-60 cursor-not-allowed'
          )}
        >
          <Headphones className={cn('w-3.5 h-3.5', soundscapeCount > 0 ? 'text-sky-400' : 'text-stone-500')} />
          <span>Soundscape ({soundscapeCount})</span>
          {soundscapeAnchor && (
            <span className="hidden sm:inline text-[10px] text-sky-300/80 font-normal pl-0.5">
              &ldquo;{soundscapeAnchor.word}&rdquo;
            </span>
          )}
        </button>

        {/* VISUAL (Emerald Green - Rule 45 / Rule 48.3) */}
        <button
          type="button"
          data-testid={`${testIdPrefix}-visual`}
          onClick={() => handleModalityClick('visual', visualAnchor?.word)}
          disabled={visualCount === 0}
          aria-pressed={activeModality === 'visual'}
          title={
            visualAnchor
              ? `Jump to visual anchor: "${visualAnchor.word}"`
              : 'Visual imagery cues (shadows, radiant colors, textures, etc.)'
          }
          className={cn(
            'min-h-[36px] sm:min-h-[32px] px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 transition-all border cursor-pointer',
            visualCount > 0
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30 hover:border-emerald-300 font-bold active:scale-95'
              : 'bg-white/5 text-stone-500 border-white/10 opacity-60 cursor-not-allowed'
          )}
        >
          <Eye className={cn('w-3.5 h-3.5', visualCount > 0 ? 'text-emerald-400' : 'text-stone-500')} />
          <span>Visual ({visualCount})</span>
          {visualAnchor && (
            <span className="hidden sm:inline text-[10px] text-emerald-300/80 font-normal pl-0.5">
              &ldquo;{visualAnchor.word}&rdquo;
            </span>
          )}
        </button>

        {/* AROMA / TASTE (Amber Gold - Rule 45 / Rule 48.3) */}
        <button
          type="button"
          data-testid={`${testIdPrefix}-aroma`}
          onClick={() => handleModalityClick('aroma', aromaAnchor?.word)}
          disabled={aromaCount === 0}
          aria-pressed={activeModality === 'aroma'}
          title={
            aromaAnchor
              ? `Jump to aroma anchor: "${aromaAnchor.word}"`
              : 'Culinary, scent, and taste cues (spices, soil, fresh, chai, etc.)'
          }
          className={cn(
            'min-h-[36px] sm:min-h-[32px] px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 transition-all border cursor-pointer',
            aromaCount > 0
              ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 ring-1 ring-amber-400/30 hover:bg-amber-500/30 hover:border-amber-300 font-bold active:scale-95'
              : 'bg-white/5 text-stone-500 border-white/10 opacity-60 cursor-not-allowed'
          )}
        >
          <Coffee className={cn('w-3.5 h-3.5', aromaCount > 0 ? 'text-amber-400' : 'text-stone-500')} />
          <span>Aroma ({aromaCount})</span>
          {aromaAnchor && (
            <span className="hidden sm:inline text-[10px] text-amber-300/80 font-normal pl-0.5">
              &ldquo;{aromaAnchor.word}&rdquo;
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
