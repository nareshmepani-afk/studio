'use client';

/**
 * FolioChapterDrawer.tsx — Full Chapter & Scene Folio Drawer Modal
 * Architecture Reference: ARCH-MW-139 / SPEC-MW-139
 *
 * Safeguards & Governance:
 *  • Safeguard 1: iOS safe-area bottom offset.
 *  • Safeguard 3 & Rule 26: Elder Typographic Baseline (minimum text-xs / 12px, zero text-[10px]).
 *  • Rule 20: Strict UK English orthography.
 */

import React, { useEffect, useMemo } from 'react';
import { X, BookOpen, CheckCircle2, Circle, Disc, Bookmark, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type FolioSceneToken,
  resolveFolioSceneState,
  toRomanNumeral,
  PART_ROMAN_NUMERALS,
  FOLIO_LAYOUT,
  FOLIO_TYPOGRAPHY,
} from './folioTokens';

export interface FolioChapterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: FolioSceneToken[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  className?: string;
  dataTestId?: string;
}

export function FolioChapterDrawer({
  isOpen,
  onClose,
  scenes,
  activeSceneId,
  onSelectScene,
  className,
  dataTestId = 'folio-chapter-drawer',
}: FolioChapterDrawerProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Group scenes by Part
  const groupedScenes = useMemo(() => {
    const groups: { partNumber: number; partTitle?: string; scenes: FolioSceneToken[] }[] = [];
    scenes.forEach((scene) => {
      let group = groups.find((g) => g.partNumber === scene.partNumber);
      if (!group) {
        group = {
          partNumber: scene.partNumber,
          partTitle: scene.partTitle,
          scenes: [],
        };
        groups.push(group);
      }
      group.scenes.push(scene);
    });
    return groups;
  }, [scenes]);

  if (!isOpen) return null;

  return (
    <div
      data-testid={dataTestId}
      role="dialog"
      aria-modal="true"
      aria-label="Story structure folio drawer"
      className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center items-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop tap to dismiss */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Surface */}
      <div
        className={cn(
          'relative w-full max-w-2xl max-h-[85vh] md:max-h-[80vh] flex flex-col',
          'bg-stone-950 border border-amber-500/30 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden',
          'ring-1 ring-amber-400/20 z-10',
          className
        )}
      >
        {/* Header Hallmark */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-semibold text-stone-100 flex items-center gap-2">
                <span>The Heirloom Folio</span>
                <span className="text-xs font-mono font-normal text-amber-400/90 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  {scenes.length} Scenes
                </span>
              </h2>
              <p className="text-xs text-stone-400 font-sans mt-0.5">
                Navigate any chapter across your family narrative
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="folio-drawer-close"
            onClick={onClose}
            aria-label="Close chapter folio drawer"
            className="min-h-[48px] min-w-[48px] rounded-full flex items-center justify-center text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Scene Groups */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
          {groupedScenes.map((group) => (
            <div key={`part-${group.partNumber}`} className="space-y-2.5">
              {/* Part Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-800/80">
                <span className={cn(FOLIO_TYPOGRAPHY.METADATA_PILL, 'text-amber-400')}>
                  {PART_ROMAN_NUMERALS[group.partNumber] || `PART ${group.partNumber}`}
                </span>
                {group.partTitle && (
                  <span className="text-xs font-serif text-stone-400">
                    {group.partTitle.split(':')[1]?.trim() || group.partTitle}
                  </span>
                )}
              </div>

              {/* Scene Grid / Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.scenes.map((scene) => {
                  const isActive = scene.id === activeSceneId;
                  const state = resolveFolioSceneState(scene, isActive);
                  const displaySceneNum = scene.sceneNumber ?? (scene.index + 1);

                  return (
                    <button
                      key={scene.id}
                      type="button"
                      data-testid={`folio-drawer-scene-${scene.id}`}
                      data-active={isActive}
                      onClick={() => {
                        onSelectScene(scene.id);
                        onClose();
                      }}
                      className={cn(
                        'min-h-[52px] p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                        isActive
                          ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800/80 hover:bg-stone-800/80 hover:border-amber-500/30'
                      )}
                    >
                      {/* State Icon */}
                      <div className="mt-0.5 shrink-0">
                        {state === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        ) : state === 'draft' ? (
                          <Disc className="w-4 h-4 text-amber-400" />
                        ) : isActive ? (
                          <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-600" />
                        )}
                      </div>

                      {/* Scene Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'text-xs font-mono font-bold',
                              isActive ? 'text-amber-300' : 'text-stone-300'
                            )}
                          >
                            Scene {displaySceneNum}
                          </span>
                          {scene.takesCount > 0 && (
                            <span className="text-xs font-mono text-teal-400/80 ml-auto">
                              {scene.takesCount} {scene.takesCount === 1 ? 'take' : 'takes'}
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-xs font-serif mt-0.5 truncate',
                            isActive ? 'text-stone-100 font-medium' : 'text-stone-400'
                          )}
                        >
                          {scene.title}
                        </p>
                      </div>

                      {isActive && (
                        <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 self-center" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info & close button */}
        <div className="p-3 bg-stone-900/40 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> Captured
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Draft
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-stone-600 inline-block" /> Unrecorded
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 font-mono font-semibold cursor-pointer py-1 px-2"
          >
            [ Close ]
          </button>
        </div>
      </div>
    </div>
  );
}
