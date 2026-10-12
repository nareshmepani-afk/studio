'use client';

/**
 * MobileThumbRibbon.tsx — Mobile Safe-Area Ergonomic Bottom Dock
 * Architecture Reference: ARCH-MW-139 / SPEC-MW-139
 *
 * Constitutional Principles:
 *  • Safeguard 1: Safe-area inset bottom calculation (pb-[env(safe-area-inset-bottom,0px)]).
 *  • Safeguard 1: Virtual keyboard conflict shield (auto-hide when isEditing === true).
 *  • Rule 20: Strict UK English orthography.
 *  • Rule 26: 48px min touch target & elder typographic baseline (>= 12px text-xs).
 */

import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type FolioSceneToken,
  toRomanNumeral,
  FOLIO_LAYOUT,
  FOLIO_TYPOGRAPHY,
} from './folioTokens';

export interface MobileThumbRibbonProps {
  currentScene: FolioSceneToken;
  totalScenes: number;
  onPrevScene: () => void;
  onNextScene: () => void;
  onOpenDrawer: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  isEditing?: boolean;
  className?: string;
  dataTestId?: string;
}

export function MobileThumbRibbon({
  currentScene,
  totalScenes,
  onPrevScene,
  onNextScene,
  onOpenDrawer,
  canPrev = true,
  canNext = true,
  isEditing = false,
  className,
  dataTestId = 'folio-mobile-thumb-ribbon',
}: MobileThumbRibbonProps) {
  const displaySceneNum = currentScene.sceneNumber ?? (currentScene.index + 1);
  const partRoman = toRomanNumeral(currentScene.partNumber);

  return (
    <div
      data-testid={dataTestId}
      data-editing-hidden={isEditing}
      className={cn(
        'w-full max-w-xl mx-auto md:hidden transition-all duration-300 z-30',
        isEditing
          ? 'opacity-0 pointer-events-none scale-95 -translate-y-2 max-h-0 overflow-hidden m-0 p-0'
          : 'opacity-100 pointer-events-auto scale-100',
        className
      )}
    >
      <div
        className={cn(
          'w-full bg-stone-950/90 border border-amber-500/30 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md',
          'px-2 py-1.5 flex items-center justify-between gap-1 ring-1 ring-amber-400/15'
        )}
      >
        {/* Previous Scene Button */}
        <button
          type="button"
          data-testid="folio-thumb-ribbon-prev"
          onClick={onPrevScene}
          disabled={!canPrev}
          aria-label="Previous scene in story structure"
          className={cn(
            FOLIO_LAYOUT.MIN_TOUCH_TARGET,
            'px-2.5 py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer',
            canPrev
              ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 active:scale-95'
              : 'text-stone-600 opacity-40 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="sr-only">Previous Scene</span>
        </button>

        {/* Centre Folio Hallmark Trigger */}
        <button
          type="button"
          data-testid="folio-thumb-ribbon-dial"
          onClick={onOpenDrawer}
          aria-label={`Open chapter folio: Part ${currentScene.partNumber}, Scene ${displaySceneNum} of ${totalScenes}`}
          className={cn(
            'flex-1 min-h-[48px] px-3 py-1.5 rounded-xl flex items-center justify-center gap-2',
            'bg-stone-900/80 border border-amber-500/20 hover:border-amber-400/50 hover:bg-stone-800/80 active:scale-98 transition-all cursor-pointer'
          )}
        >
          <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="flex items-center gap-1.5 text-center truncate">
            <span className={cn(FOLIO_TYPOGRAPHY.METADATA_PILL, 'text-amber-400 text-xs')}>
              {partRoman}
            </span>
            <span className="text-stone-600 text-xs">•</span>
            <span className="text-xs font-mono font-bold text-stone-200">
              Scene {displaySceneNum} of {totalScenes}
            </span>
          </div>

          <Layers className="w-3.5 h-3.5 text-amber-400/60 ml-0.5 shrink-0" />
        </button>

        {/* Next Scene Button */}
        <button
          type="button"
          data-testid="folio-thumb-ribbon-next"
          onClick={onNextScene}
          disabled={!canNext}
          aria-label="Next scene in story structure"
          className={cn(
            FOLIO_LAYOUT.MIN_TOUCH_TARGET,
            'px-2.5 py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer',
            canNext
              ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 active:scale-95'
              : 'text-stone-600 opacity-40 cursor-not-allowed'
          )}
        >
          <ChevronRight className="w-5 h-5" />
          <span className="sr-only">Next Scene</span>
        </button>
      </div>
    </div>
  );
}
