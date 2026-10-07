'use client';

/**
 * ChapterSpineRail — Unified Responsive Scene Navigation Rail (MW-100)
 *
 * Renders as:
 *  • Mobile  (<768px): Horizontal scrolling ribbon mounted above the active story card.
 *  • Desktop (≥768px): Vertical left-docked rail integrating with the production stage.
 *
 * State Dot Legend:
 *  ● Solid emerald   = Completed Reel (Act IV / takes.length > 0)
 *  ◐ Amber half-ring = In-Progress Draft (Act I–III, prose exists)
 *  ○ Muted hollow    = Unrecorded / Empty scene
 *  Active scene receives a luminous focus ring regardless of state.
 *
 * Constitutional Rules: Rule 20 (UK English), Rule 26 (44px+ touch targets).
 */

import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Circle, Disc } from 'lucide-react';

export interface ChapterSpineScene {
  id: string;
  index: number;
  title: string;
  partNumber: number;
  partTitle?: string;
  hasCompletedReel: boolean;
  hasDraftProse: boolean;
  takesCount: number;
  isNextRecommended?: boolean;
}

export interface ChapterSpineRailProps {
  scenes: ChapterSpineScene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  /** 'responsive' (default): horizontal on mobile, vertical on desktop.
   *  'horizontal': always a horizontal ribbon.
   *  'vertical': always a vertical sidebar rail. */
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  className?: string;
}

const PART_ROMAN_NUMERALS: Record<number, string> = {
  1: 'PART I',
  2: 'PART II',
  3: 'PART III',
  4: 'PART IV',
  5: 'PART V',
  6: 'PART VI',
};

function formatUprightPartLabel(partNumber: number, partTitle?: string): string {
  if (PART_ROMAN_NUMERALS[partNumber]) return PART_ROMAN_NUMERALS[partNumber];
  if (partTitle) {
    const prefix = partTitle.split(':')[0]?.trim().toUpperCase();
    if (prefix) return prefix;
  }
  return `PART ${partNumber}`;
}

// ─── Dot state resolver ───────────────────────────────────────────────────────

function resolveSceneState(
  scene: ChapterSpineScene,
  isActive: boolean
): 'completed' | 'draft' | 'empty' | 'active' {
  if (isActive) return 'active';
  if (scene.hasCompletedReel || scene.takesCount > 0) return 'completed';
  if (scene.hasDraftProse) return 'draft';
  return 'empty';
}

// ─── Individual scene token ───────────────────────────────────────────────────

interface SceneTokenProps {
  scene: ChapterSpineScene;
  isActive: boolean;
  isNextRecommended: boolean;
  orientation: 'horizontal' | 'vertical';
  onSelect: (sceneId: string) => void;
}

function SceneToken({ scene, isActive, isNextRecommended, orientation, onSelect }: SceneTokenProps) {
  const state = resolveSceneState(scene, isActive);

  // Dot icon and colour per state (Desktop /studio lockstep: Teal = Captured, Amber = Studio Draft)
  const dotStyles: Record<typeof state, string> = {
    active:    'text-emerald-300',
    completed: 'text-teal-400',
    draft:     'text-amber-400',
    empty:     isNextRecommended ? 'text-emerald-400' : 'text-stone-500',
  };
  const DotIcon =
    state === 'completed' ? CheckCircle2
    : state === 'draft'   ? Disc
    :                       Circle;

  // Container ring when active or Next Recommended
  const containerBase =
    'relative flex items-center justify-center cursor-pointer transition-all rounded-2xl select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';

  const containerActive = isActive
    ? 'ring-2 ring-emerald-400/80 bg-stone-800 shadow-md shadow-emerald-900/30'
    : isNextRecommended
      ? 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse bg-emerald-950/30 hover:bg-stone-800/60'
      : 'hover:bg-stone-800/60';

  if (orientation === 'horizontal') {
    // Mobile: compact pill — 44px min height, auto width
    return (
      <button
        type="button"
        data-testid={`HS_SPINE_SCENE_${scene.id}`}
        data-recommended={isNextRecommended ? 'true' : undefined}
        aria-label={`Navigate to scene ${scene.index + 1}: ${scene.title}${isNextRecommended ? ' (Next Recommended)' : ''}`}
        aria-current={isActive ? 'true' : undefined}
        onClick={() => onSelect(scene.id)}
        className={[
          containerBase,
          containerActive,
          'flex-col gap-0.5 px-3 py-1',
          'min-h-[44px]',
          isActive ? 'min-w-[120px] max-w-[200px]' : 'min-w-[44px]',
        ].join(' ')}
        style={{ minHeight: 44 }}
      >
        {/* Dot icon */}
        <DotIcon
          className={[
            'shrink-0 transition-all',
            dotStyles[state],
            state === 'draft' ? 'animate-pulse' : '',
            isActive ? 'w-4 h-4' : 'w-3.5 h-3.5',
          ].join(' ')}
          strokeWidth={isActive ? 2.5 : 2}
        />
        {/* Scene number + short label on active only (MW-113 anti-truncation geometry) */}
        {isActive && (
          <span
            data-testid="HS_SPINE_ACTIVE_SCENE"
            title={`${scene.index + 1} · ${scene.title}`}
            className="text-[10px] font-mono font-bold text-emerald-300 leading-tight text-center whitespace-nowrap max-w-[170px] truncate px-1"
          >
            {scene.index + 1} · {scene.title}
          </span>
        )}
        {!isActive && (
          <span className={`text-[9px] font-mono leading-none ${isNextRecommended ? 'text-emerald-300 font-bold' : 'text-stone-500'}`}>
            {scene.index + 1}
          </span>
        )}
      </button>
    );
  }

  // Desktop: full-width vertical row — 48px min height, shows title on hover/active
  return (
    <button
      type="button"
      data-testid={`HS_SPINE_SCENE_${scene.id}`}
      data-recommended={isNextRecommended ? 'true' : undefined}
      aria-label={`Navigate to scene ${scene.index + 1}: ${scene.title}${isNextRecommended ? ' (Next Recommended)' : ''}`}
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect(scene.id)}
      className={[
        containerBase,
        containerActive,
        'w-full justify-start gap-3 px-3 py-2.5 text-left',
      ].join(' ')}
      style={{ minHeight: 48 }}
    >
      <DotIcon
        className={[
          'shrink-0 w-4 h-4 transition-all',
          dotStyles[state],
          state === 'draft' ? 'animate-pulse' : '',
        ].join(' ')}
        strokeWidth={2}
      />
      <div className="flex flex-col min-w-0">
        <span className={[
          'text-xs font-medium leading-tight truncate',
          isActive ? 'text-emerald-300 font-bold' : 'text-stone-300',
        ].join(' ')}>
          {scene.title}
        </span>
        <span className="text-[10px] font-mono text-stone-500 leading-none mt-0.5">
          Sc {scene.index + 1} · Pt {scene.partNumber}
          {scene.takesCount > 0 ? ` · ${scene.takesCount} take${scene.takesCount > 1 ? 's' : ''}` : ''}
        </span>
      </div>
    </button>
  );
}

// ─── Part group header (MW-100-BRUTAL: Strictly Upright 0deg Rotation) ──────

interface PartLabelProps {
  partNumber: number;
  partTitle: string;
  orientation: 'horizontal' | 'vertical';
}

function PartLabel({ partNumber, partTitle, orientation }: PartLabelProps) {
  if (orientation === 'horizontal') {
    return (
      <div
        data-testid="HS_SPINE_PART_LABEL"
        className="flex items-center shrink-0 px-1"
        aria-label={partTitle}
      >
        <span className="text-[10px] font-mono tracking-widest text-stone-500 select-none px-1.5 uppercase whitespace-nowrap">
          {formatUprightPartLabel(partNumber, partTitle)}
        </span>
        <div className="w-px h-6 bg-stone-800 ml-1" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div
      data-testid="HS_SPINE_PART_LABEL"
      className="px-3 pt-3 pb-1"
    >
      <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest">
        {partTitle}
      </span>
    </div>
  );
}

// ─── Main rail component ──────────────────────────────────────────────────────

export function ChapterSpineRail({
  scenes,
  activeSceneId,
  onSelectScene,
  orientation = 'responsive',
  className = '',
}: ChapterSpineRailProps) {
  const activeTokenRef = useRef<HTMLButtonElement | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Resolve Next Recommended scene ID (first unstarted scene, or first scene with 0 takes)
  const explicitRecommendedId = scenes.find((s) => s.isNextRecommended)?.id;
  const fallbackRecommendedId =
    scenes.find((s) => !s.hasCompletedReel && s.takesCount === 0 && !s.hasDraftProse)?.id ??
    scenes.find((s) => !s.hasCompletedReel && s.takesCount === 0)?.id ??
    null;
  const nextRecommendedSceneId = explicitRecommendedId ?? fallbackRecommendedId;

  // Auto-scroll to the active token when it changes (horizontal only)
  useEffect(() => {
    const handleScroll = () => {
      if (!railRef.current || !activeTokenRef.current) return;
      const rail = railRef.current;
      const token = activeTokenRef.current;
      const railRect = rail.getBoundingClientRect();
      const tokenRect = token.getBoundingClientRect();
      const offsetRelativeToRail = tokenRect.left - railRect.left;
      const targetScrollLeft =
        rail.scrollLeft + offsetRelativeToRail - rail.clientWidth / 2 + tokenRect.width / 2;
      rail.scrollTo?.({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
    };

    const timer = setTimeout(handleScroll, 50);
    return () => clearTimeout(timer);
  }, [activeSceneId]);

  // Group scenes by part for labelling
  const partGroups = scenes.reduce<Array<{ partNumber: number; partTitle: string; scenes: ChapterSpineScene[] }>>(
    (acc, scene) => {
      const existing = acc.find((g) => g.partNumber === scene.partNumber);
      if (existing) {
        existing.scenes.push(scene);
      } else {
        acc.push({ partNumber: scene.partNumber, partTitle: scene.partTitle ?? `Part ${scene.partNumber}`, scenes: [scene] });
      }
      return acc;
    },
    []
  );

  const activeSceneIndex = scenes.findIndex((s) => s.id === activeSceneId);

  const handleStepPrev = () => {
    if (scenes.length === 0) return;
    const currentIdx = activeSceneIndex >= 0 ? activeSceneIndex : 0;
    const prevIdx = (currentIdx - 1 + scenes.length) % scenes.length;
    onSelectScene(scenes[prevIdx].id);
  };

  const handleStepNext = () => {
    if (scenes.length === 0) return;
    const currentIdx = activeSceneIndex >= 0 ? activeSceneIndex : 0;
    const nextIdx = (currentIdx + 1) % scenes.length;
    onSelectScene(scenes[nextIdx].id);
  };

  // ── Horizontal rail (mobile) ─────────────────────────────────────────────
  const horizontalRail = (
    <div
      data-testid="HS_CHAPTER_SPINE_RAIL"
      aria-label="Chapter navigation rail"
      role="navigation"
      className={[
        'w-full flex flex-row items-center gap-1 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        'bg-stone-950/80 border-b border-stone-800/60 px-1.5 py-1.5',
        className,
      ].join(' ')}
      // Prevent vertical scroll capture on touch
      onTouchMove={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        data-testid="HS_SPINE_PREV_BTN"
        onClick={handleStepPrev}
        aria-label="Previous scene in chapter spine"
        title="Step to previous scene (‹)"
        style={{ minHeight: 44, minWidth: 44 }}
        className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 flex items-center justify-center text-lg font-mono font-bold transition-colors cursor-pointer select-none"
      >
        ‹
      </button>

      <div
        ref={railRef}
        data-testid="HS_CHAPTER_SPINE_TRACK"
        className="flex-1 flex flex-row items-center gap-1 overflow-x-auto py-1 spine-micro-scrollbar scroll-smooth"
      >
        {partGroups.map((group, gi) => (
          <React.Fragment key={group.partNumber}>
            {gi > 0 && <PartLabel partNumber={group.partNumber} partTitle={group.partTitle} orientation="horizontal" />}
            {gi === 0 && group.partNumber > 0 && (
              <PartLabel partNumber={group.partNumber} partTitle={group.partTitle} orientation="horizontal" />
            )}
            {group.scenes.map((scene) => {
              const isActive = scene.id === activeSceneId;
              return (
                <div
                  key={scene.id}
                  ref={isActive ? (el) => { (activeTokenRef as React.MutableRefObject<HTMLButtonElement | null>).current = el?.querySelector('button') ?? null; } : undefined}
                >
                  <SceneToken
                    scene={scene}
                    isActive={isActive}
                    isNextRecommended={scene.id === nextRecommendedSceneId}
                    orientation="horizontal"
                    onSelect={onSelectScene}
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <button
        type="button"
        data-testid="HS_SPINE_NEXT_BTN"
        onClick={handleStepNext}
        aria-label="Next scene in chapter spine"
        title="Step to next scene (›)"
        style={{ minHeight: 44, minWidth: 44 }}
        className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 flex items-center justify-center text-lg font-mono font-bold transition-colors cursor-pointer select-none"
      >
        ›
      </button>
    </div>
  );

  // ── Vertical rail (desktop) ──────────────────────────────────────────────
  const verticalRail = (
    <nav
      data-testid="HS_CHAPTER_SPINE_RAIL"
      aria-label="Chapter navigation rail"
      className={[
        'flex flex-col overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        'bg-stone-950/60 border-r border-stone-800/60 py-2 w-52',
        className,
      ].join(' ')}
    >
      {partGroups.map((group) => (
        <div key={group.partNumber} className="mb-2">
          <PartLabel partNumber={group.partNumber} partTitle={group.partTitle} orientation="vertical" />
          {group.scenes.map((scene) => (
            <SceneToken
              key={scene.id}
              scene={scene}
              isActive={scene.id === activeSceneId}
              isNextRecommended={scene.id === nextRecommendedSceneId}
              orientation="vertical"
              onSelect={onSelectScene}
            />
          ))}
        </div>
      ))}
    </nav>
  );

  // ── Responsive — choose based on breakpoint ──────────────────────────────
  if (orientation === 'horizontal') return horizontalRail;
  if (orientation === 'vertical') return verticalRail;

  // 'responsive': use Tailwind's md: classes to swap
  return (
    <>
      {/* Mobile: horizontal ribbon */}
      <div className="md:hidden">{horizontalRail}</div>
      {/* Desktop: vertical rail */}
      <div className="hidden md:flex">{verticalRail}</div>
    </>
  );
}

export default ChapterSpineRail;
