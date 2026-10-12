'use client';

/**
 * FloatingChapterDial.tsx — Safe-Area & Keyboard-Shielded Mobile Chapter Dial
 * Architecture Reference: ARCH-MW-139 / SPEC-MW-139 (Safeguard 1)
 *
 * Constitutional Principles:
 *  • Safeguard 1: Safe-Area Inset Bottom (bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]).
 *  • Safeguard 1: Virtual Keyboard Conflict Shield (auto-hide when isEditing === true).
 *  • Rule 20: Strict UK English orthography.
 *  • Rule 26: 48px min touch target & elder typographic baseline (>= 12px text-xs).
 */

import React from 'react';
import { BookOpen, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type FolioSceneToken,
  toRomanNumeral,
  FOLIO_LAYOUT,
  FOLIO_TYPOGRAPHY,
} from './folioTokens';

export interface FloatingChapterDialProps {
  currentScene: FolioSceneToken;
  totalScenes: number;
  isEditing?: boolean;
  onOpenDrawer: () => void;
  className?: string;
  dataTestId?: string;
}

export function FloatingChapterDial({
  currentScene,
  totalScenes,
  isEditing = false,
  onOpenDrawer,
  className,
  dataTestId = 'folio-floating-chapter-dial',
}: FloatingChapterDialProps) {
  const displaySceneNum = currentScene.sceneNumber ?? (currentScene.index + 1);
  const partRoman = toRomanNumeral(currentScene.partNumber);

  return (
    <div
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 md:hidden',
        FOLIO_LAYOUT.SAFE_AREA_DIAL_BOTTOM,
        isEditing ? 'opacity-0 pointer-events-none scale-90 -translate-y-2' : 'opacity-100 pointer-events-auto scale-100',
        className
      )}
    >
      <button
        type="button"
        data-testid={dataTestId}
        data-editing-hidden={isEditing}
        onClick={onOpenDrawer}
        aria-label={`Open chapter folio: Part ${currentScene.partNumber}, Scene ${displaySceneNum} of ${totalScenes}`}
        className={cn(
          'min-h-[48px] px-4 py-2 rounded-full flex items-center gap-2.5',
          'bg-stone-950/90 border border-amber-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.7)] backdrop-blur-md',
          'hover:border-amber-400 hover:bg-stone-900 active:scale-95 transition-all cursor-pointer',
          'ring-1 ring-amber-400/20'
        )}
      >
        <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
        </div>

        <div className="flex items-center gap-1.5 text-left">
          <span className={cn(FOLIO_TYPOGRAPHY.METADATA_PILL, 'text-amber-400')}>
            {partRoman}
          </span>
          <span className="text-stone-600 text-xs">•</span>
          <span className="text-xs font-mono font-bold text-stone-200">
            Scene {displaySceneNum} of {totalScenes}
          </span>
        </div>

        <ChevronUp className="w-3.5 h-3.5 text-amber-400/70 ml-0.5 animate-bounce shrink-0" />
      </button>
    </div>
  );
}
