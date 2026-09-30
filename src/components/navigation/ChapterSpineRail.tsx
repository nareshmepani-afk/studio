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
  orientation: 'horizontal' | 'vertical';
  onSelect: (sceneId: string) => void;
}

function SceneToken({ scene, isActive, orientation, onSelect }: SceneTokenProps) {
  const state = resolveSceneState(scene, isActive);

  // Dot icon and colour per state
  const dotStyles: Record<typeof state, string> = {
    active:    'text-emerald-300',
    completed: 'text-emerald-400',
    draft:     'text-amber-400',
    empty:     'text-stone-500',
  };
  const DotIcon =
    state === 'completed' ? CheckCircle2
    : state === 'draft'   ? Disc
    :                       Circle;

  // Container ring when active
  const containerBase =
    'relative flex items-center justify-center cursor-pointer transition-all rounded-2xl select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';

  const containerActive = isActive
    ? 'ring-2 ring-emerald-400/80 bg-stone-800 shadow-md shadow-emerald-900/30'
    : 'hover:bg-stone-800/60';

  if (orientation === 'horizontal') {
    // Mobile: compact pill — 44px min height, auto width
    return (
      <button
        type="button"
        data-testid={`HS_SPINE_SCENE_${scene.id}`}
        aria-label={`Navigate to scene ${scene.index + 1}: ${scene.title}`}
        aria-current={isActive ? 'true' : undefined}
        onClick={() => onSelect(scene.id)}
        className={[
          containerBase,
          containerActive,
          'flex-col gap-0.5 px-2.5 py-1',
          'min-h-[44px] min-w-[44px]',
          isActive ? 'min-w-[80px]' : 'min-w-[44px]',
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
        {/* Scene number + short label on active only */}
        {isActive && (
          <span
            data-testid="HS_SPINE_ACTIVE_SCENE"
            className="text-[10px] font-mono font-bold text-emerald-300 leading-tight text-center whitespace-nowrap max-w-[72px] truncate"
          >
            {scene.index + 1} · {scene.title}
          </span>
        )}
        {!isActive && (
          <span className="text-[9px] font-mono text-stone-500 leading-none">
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
      aria-label={`Navigate to scene ${scene.index + 1}: ${scene.title}`}
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

// ─── Part group header ────────────────────────────────────────────────────────

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
        className="flex items-center shrink-0 px-1.5"
        aria-label={partTitle}
      >
        <span className="text-[9px] font-mono font-bold text-stone-600 uppercase tracking-widest writing-mode-vertical rotate-180 select-none">
          P{partNumber}
        </span>
        <div className="w-px h-6 bg-stone-800 ml-1.5" aria-hidden="true" />
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

  // Auto-scroll to the active token when it changes (horizontal only)
  useEffect(() => {
    if (!railRef.current || !activeTokenRef.current) return;
    const rail = railRef.current;
    const token = activeTokenRef.current;
    const railRect = rail.getBoundingClientRect();
    const tokenRect = token.getBoundingClientRect();
    const scrollLeft =
      token.offsetLeft - rail.clientWidth / 2 + token.offsetWidth / 2;
    rail.scrollTo?.({ left: scrollLeft, behavior: 'smooth' });
    void railRect; void tokenRect; // satisfy linter
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

  // ── Horizontal rail (mobile) ─────────────────────────────────────────────
  const horizontalRail = (
    <div
      ref={railRef}
      data-testid="HS_CHAPTER_SPINE_RAIL"
      aria-label="Chapter navigation rail"
      role="navigation"
      className={[
        'w-full flex flex-row items-center gap-0.5 overflow-x-auto no-scrollbar',
        'bg-stone-950/80 border-b border-stone-800/60 px-2 py-1.5',
        className,
      ].join(' ')}
      // Prevent vertical scroll capture on touch
      onTouchMove={(e) => e.stopPropagation()}
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
                  orientation="horizontal"
                  onSelect={onSelectScene}
                />
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Vertical rail (desktop) ──────────────────────────────────────────────
  const verticalRail = (
    <nav
      data-testid="HS_CHAPTER_SPINE_RAIL"
      aria-label="Chapter navigation rail"
      className={[
        'flex flex-col overflow-y-auto no-scrollbar',
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
