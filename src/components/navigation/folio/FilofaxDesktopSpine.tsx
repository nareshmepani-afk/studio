'use client';

/**
 * FilofaxDesktopSpine.tsx — Viewport-Adaptive Heirloom Folio Spine (Desktop & Tablet)
 * Architecture Reference: ARCH-MW-139 / SPEC-MW-139
 *
 * Safeguards & Governance:
 *  • Safeguard 2: Viewport-Adaptive (Micro-Spine w-14 on 768px–1023px, Full Ledger w-64 on >= 1024px).
 *  • Safeguard 4: Protruding Tab Clipping Shield (-translate-x-1 with overflow-visible parent).
 *  • Safeguard 3 & Rule 26: Elder Typographic Baseline (minimum text-xs / 12px, zero text-[10px]).
 *  • Rule 20: Strict UK English orthography.
 */

import React, { useEffect, useRef } from 'react';
import { BookOpen, CheckCircle2, Circle, Disc, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type FolioSceneToken,
  resolveFolioSceneState,
  toRomanNumeral,
  PART_ROMAN_NUMERALS,
  FOLIO_LAYOUT,
  FOLIO_TYPOGRAPHY,
  FOLIO_CHROMA,
} from './folioTokens';

export interface FilofaxDesktopSpineProps {
  scenes: FolioSceneToken[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  className?: string;
  dataTestId?: string;
}

export function FilofaxDesktopSpine({
  scenes,
  activeSceneId,
  onSelectScene,
  className,
  dataTestId = 'folio-filofax-desktop-spine',
}: FilofaxDesktopSpineProps) {
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll active tab into view smoothly
  useEffect(() => {
    if (activeTabRef.current && typeof activeTabRef.current.scrollIntoView === 'function') {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeSceneId]);

  return (
    <aside
      data-testid={dataTestId}
      aria-label="Story structure folio spine"
      className={cn(
        // Hidden on mobile (<768px), adaptive w-14 on tablet, w-64 on desktop
        'hidden md:flex flex-col',
        'fixed top-20 right-0 bottom-6 z-30',
        'transition-all duration-300 ease-in-out',
        'w-14 lg:w-64',
        // Safeguard 4: Overflow-visible parent to prevent clipping protruding active tabs
        'overflow-visible',
        className
      )}
    >
      {/* Folio Ledger Container */}
      <div
        className={cn(
          'h-full flex flex-col',
          'bg-stone-950/95 border-l border-y border-amber-500/25 rounded-l-2xl shadow-[-8px_0_30px_rgba(0,0,0,0.6)] backdrop-blur-md',
          'overflow-visible'
        )}
      >
        {/* Header Hallmark */}
        <div className="p-3 border-b border-stone-800/80 flex items-center gap-2.5 overflow-hidden shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="hidden lg:flex flex-col truncate">
            <span className={cn(FOLIO_TYPOGRAPHY.METADATA_PILL, 'text-amber-400')}>
              HEIRLOOM FOLIO
            </span>
            <span className="text-xs text-stone-400 font-serif truncate">
              Master Story Structure
            </span>
          </div>
        </div>

        {/* Scrollable Scene Index Spine */}
        <div
          data-testid="folio-spine-scroll-area"
          className={cn(
            'flex-1 py-2 overflow-y-auto overflow-x-visible',
            'scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent',
            'px-1.5 space-y-1'
          )}
        >
          {scenes.map((scene, idx) => {
            const isActive = scene.id === activeSceneId;
            const state = resolveFolioSceneState(scene, isActive);
            const displaySceneNum = scene.sceneNumber ?? (scene.index + 1);
            const romanScene = toRomanNumeral(displaySceneNum);

            // Group separator for Part boundaries
            const isFirstSceneOfPart =
              idx === 0 || scenes[idx - 1].partNumber !== scene.partNumber;

            return (
              <React.Fragment key={scene.id}>
                {isFirstSceneOfPart && (
                  <div
                    className={cn(
                      'pt-3 pb-1 px-1 border-t border-stone-800/60 first:border-t-0',
                      'hidden lg:flex items-center justify-between'
                    )}
                  >
                    <span className="text-xs font-mono font-bold tracking-[0.15em] text-amber-500/80">
                      {PART_ROMAN_NUMERALS[scene.partNumber] || `PART ${scene.partNumber}`}
                    </span>
                    {scene.partTitle && (
                      <span className="text-xs font-serif text-stone-500 truncate max-w-[120px]">
                        {scene.partTitle.split(':')[1]?.trim() || scene.partTitle}
                      </span>
                    )}
                  </div>
                )}

                {/* Filofax Indexed Tab Button */}
                <button
                  type="button"
                  ref={isActive ? activeTabRef : null}
                  data-testid={`folio-tab-${scene.id}`}
                  data-active={isActive}
                  data-state={state}
                  onClick={() => onSelectScene(scene.id)}
                  title={`Scene ${displaySceneNum}: ${scene.title} (${state})`}
                  aria-label={`Select Scene ${displaySceneNum}: ${scene.title}`}
                  className={cn(
                    'w-full group rounded-lg text-left transition-all duration-200 cursor-pointer',
                    'flex items-center gap-2',
                    // Minimum touch target (44px on desktop/tablet)
                    'min-h-[44px] px-2 py-2',
                    // Safeguard 4: Protruding active tab with negative translation
                    isActive
                      ? [
                          '-translate-x-1.5 z-20',
                          'bg-stone-900 border border-amber-400/60 text-amber-200',
                          'shadow-[-4px_2px_12px_rgba(245,158,11,0.25)]',
                          'ring-1 ring-amber-400/40',
                        ]
                      : [
                          'hover:bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-transparent',
                        ]
                  )}
                >
                  {/* State Dot / Roman Numeral (Visible on both Tablet w-14 and Desktop w-64) */}
                  <div className="flex items-center justify-center shrink-0 w-7 h-7 rounded-md bg-stone-950/60 border border-stone-800">
                    {state === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    ) : state === 'draft' ? (
                      <Disc className="w-3.5 h-3.5 text-amber-400" />
                    ) : isActive ? (
                      <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                    ) : (
                      <Circle className="w-3 h-3 text-stone-600" />
                    )}
                  </div>

                  {/* Tablet Micro-Spine Label (768px-1023px): Roman Numeral */}
                  <span className="lg:hidden text-xs font-mono font-bold text-stone-300 group-hover:text-amber-200">
                    {romanScene}
                  </span>

                  {/* Desktop Full Ledger Label (>=1024px): Arabic Scene Number & Title */}
                  <div className="hidden lg:flex flex-col flex-1 truncate">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-xs font-mono font-semibold',
                          isActive ? 'text-amber-300' : 'text-stone-400'
                        )}
                      >
                        {displaySceneNum}.
                      </span>
                      <span
                        className={cn(
                          'text-xs font-serif truncate',
                          isActive ? 'text-stone-100 font-medium' : 'text-stone-300'
                        )}
                      >
                        {scene.title}
                      </span>
                    </div>

                    {/* Meta indicator */}
                    <div className="flex items-center gap-2 mt-0.5">
                      {scene.takesCount > 0 && (
                        <span className="text-xs font-mono text-teal-400/80">
                          {scene.takesCount} {scene.takesCount === 1 ? 'take' : 'takes'}
                        </span>
                      )}
                      {scene.isNextRecommended && !scene.hasCompletedReel && (
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          Next
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
