'use client';

import React, { useMemo, useState } from 'react';
import {
  Film,
  Flame,
  Play,
  Share2,
  Rocket,
  Sparkles,
  PencilLine,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { MASTER_STORY_STRUCTURE } from '@/lib/curriculum/masterStoryStructure';
import type { UnifiedCurriculumMemory } from '@/types/curriculum';
import { isSceneCompleted } from '@/hooks/useCurriculumVault';
import { toast } from 'sonner';

export interface FiresideCinemaViewProps {
  directorName?: string | null;
  isLoading?: boolean;
  wovenCount: number;
  totalScenes: number;
  wovenPercent: number;
  premieredCount: number;
  getSceneMemory: (sceneId: string) => UnifiedCurriculumMemory | undefined;
  resolveDocIdForScene: (sceneId: string) => string;
  onWatchSceneReel: (sceneId: string) => void;
  onOpenSceneInStudio: (sceneId: string) => void;
}

export const FiresideCinemaView: React.FC<FiresideCinemaViewProps> = ({
  directorName,
  isLoading = false,
  wovenCount,
  totalScenes,
  wovenPercent,
  premieredCount,
  getSceneMemory,
  resolveDocIdForScene,
  onWatchSceneReel,
  onOpenSceneInStudio,
}) => {
  const [filter, setFilter] = useState<'all' | 'premiered'>('all');

  const recordedItems = useMemo(() => {
    const items: Array<{
      sceneId: string;
      partTitle: string;
      sceneNumber: number;
      title: string;
      subtitle?: string;
      memory: UnifiedCurriculumMemory;
      isPublished: boolean;
    }> = [];

    MASTER_STORY_STRUCTURE.filter((p) => !p.isDemo).forEach((part) => {
      part.scenes.forEach((scene) => {
        const mem = getSceneMemory(scene.id);
        if (!mem || !isSceneCompleted(mem)) return;
        const activeTakes = (mem.takes || []).filter(
          (t) => t.status !== 'outtake' && t.status !== 'purged'
        );
        const hasPlayableMedia =
          activeTakes.length > 0 || Boolean(mem.videoUrl || mem.audioUrl);
        if (!hasPlayableMedia) return;

        items.push({
          sceneId: scene.id,
          partTitle: part.title,
          sceneNumber: scene.sceneNumber,
          title: mem.sceneTitle || scene.title,
          subtitle: scene.localizedTitles?.gu,
          memory: mem,
          isPublished: mem.status === 'published',
        });
      });
    });

    return items;
  }, [getSceneMemory]);

  const visibleItems = useMemo(
    () =>
      filter === 'premiered'
        ? recordedItems.filter((item) => item.isPublished)
        : recordedItems,
    [recordedItems, filter]
  );

  const handleShareScene = async (sceneId: string, title: string) => {
    const docId = resolveDocIdForScene(sceneId);
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/cinema?id=${encodeURIComponent(docId)}`
        : `https://memoryweaver.studio/cinema?id=${encodeURIComponent(docId)}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${title} — Family Cinema`,
          text: `Watch "${title}" in our Family Cinema:`,
          url,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Family Cinema screening link copied!');
    } catch {
      toast.info(url);
    }
  };

  const formatDuration = (secs?: number) => {
    if (!secs || !Number.isFinite(secs) || secs <= 0) return 'Recorded Reel';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <section
      data-testid="HS_FIRESIDE_CINEMA_VIEW"
      aria-label="Fireside Family Cinema"
      className="w-full max-w-xl mx-auto space-y-4 pb-6"
    >
      {/* Warm Candlelit Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-950/35 via-stone-950/95 to-stone-950 border border-amber-500/35 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 font-bold">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>Fireside Family Cinema</span>
          </span>
          <span
            data-testid="fireside-cinema-progress-pill"
            className="text-[11px] font-mono text-amber-200/90"
          >
            {wovenCount} of {totalScenes} Woven ({wovenPercent}%)
            {premieredCount > 0 ? ` · ${premieredCount} Premiered` : ''}
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-white leading-tight">
            {directorName ? `${directorName}’s Heirloom Screening Room` : 'Heirloom Screening Room'}
          </h1>
          <p className="text-xs text-stone-300 mt-1 leading-relaxed">
            Watch your recorded stories in warm armchair comfort or share unified screening links directly with family.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="inline-flex rounded-xl bg-stone-900 p-1 border border-stone-800">
            <button
              type="button"
              data-testid="HS_FIRESIDE_CINEMA_FILTER_ALL"
              onClick={() => setFilter('all')}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              All Reels ({recordedItems.length})
            </button>
            <button
              type="button"
              data-testid="HS_FIRESIDE_CINEMA_FILTER_PREMIERED"
              onClick={() => setFilter('premiered')}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                filter === 'premiered'
                  ? 'bg-emerald-500 text-stone-950'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Premiered ({recordedItems.filter((i) => i.isPublished).length})
            </button>
          </div>

          {visibleItems.length > 0 && (
            <button
              type="button"
              data-testid="HS_FIRESIDE_CINEMA_PLAY_FIRST_BTN"
              onClick={() => onWatchSceneReel(visibleItems[0].sceneId)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>Play Feature</span>
            </button>
          )}
        </div>
      </div>

      {/* Reel Cards */}
      {isLoading && visibleItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-stone-950/90 border border-stone-800 text-center space-y-3">
          <div className="w-7 h-7 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono text-amber-200/80">
            Loading your Heirloom Screening Room...
          </p>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-stone-950/90 border border-stone-800 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-base font-serif text-white">
            {filter === 'premiered'
              ? 'No Scenes Premiered Yet'
              : 'Your Family Screening Room Awaits Its First Take'}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            {filter === 'premiered'
              ? 'Open any recorded story in Act V (Premiere) to publish it to your Family Cinema.'
              : 'Switch to the Studio tab below to record your first spoken voice or selfie video memory.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {visibleItems.map((item) => {
            const activeTake =
              (item.memory.takes || []).find(
                (t) => t.isPreferred && t.status !== 'outtake' && t.status !== 'purged'
              ) ||
              (item.memory.takes || []).find(
                (t) => t.status !== 'outtake' && t.status !== 'purged'
              );
            const firstPhoto = item.memory.photos?.[0];
            const thumbUrl = firstPhoto
              ? typeof firstPhoto === 'string'
                ? firstPhoto
                : (firstPhoto as any).storageUrl ||
                  (firstPhoto as any).localUri ||
                  (firstPhoto as any).url
              : null;

            return (
              <article
                key={item.sceneId}
                data-testid={`fireside-cinema-card-${item.sceneId}`}
                className="rounded-3xl overflow-hidden bg-stone-950/95 border border-amber-500/30 shadow-xl"
              >
                {/* Poster / Theatrical Banner */}
                <div
                  onClick={() => onWatchSceneReel(item.sceneId)}
                  className="relative aspect-[16/9] w-full bg-gradient-to-br from-stone-900 via-amber-950/30 to-black flex flex-col justify-between p-4 cursor-pointer group overflow-hidden"
                >
                  {thumbUrl && (
                    <img
                      src={thumbUrl}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30" />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/60 border border-white/15 text-amber-200">
                      {item.partTitle.split(':')[0]} · Scene {item.sceneNumber}
                    </span>

                    {item.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200">
                        <Rocket className="w-3 h-3 text-amber-300" />
                        <span>Premiered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-400/40 text-purple-200">
                        <span>Pre-Release</span>
                      </span>
                    )}
                  </div>

                  {/* Centred Play Medallion */}
                  <div className="relative z-10 my-auto mx-auto w-14 h-14 rounded-full bg-amber-500/90 group-hover:bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                    <Play className="w-6 h-6 fill-stone-950 ml-0.5" />
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-lg font-serif text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[11px] font-mono text-amber-300/90">
                      {[
                        item.memory.location &&
                        item.memory.location !== 'undefined' &&
                        item.memory.location !== 'none'
                          ? item.memory.location
                          : null,
                        item.memory.year &&
                        String(item.memory.year) !== 'undefined' &&
                        String(item.memory.year) !== 'none'
                          ? String(item.memory.year)
                          : null,
                        formatDuration(activeTake?.durationSeconds),
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3.5 bg-stone-950 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onWatchSceneReel(item.sceneId)}
                    className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-stone-950" />
                    <span>Watch Reel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareScene(item.sceneId, item.title)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-200 font-mono font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenSceneInStudio(item.sceneId)}
                    aria-label={`Open ${item.title} in Fireside Studio`}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white font-mono text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <PencilLine className="w-3.5 h-3.5" />
                    <span>Studio</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export interface FiresideBottomBarProps {
  activeView: 'studio' | 'cinema';
  recordedCount: number;
  primaryCtaLabel?: string;
  isLockedPreview?: boolean;
  isRecording?: boolean;
  onSelectView: (view: 'studio' | 'cinema') => void;
  onPrimaryAction?: () => void;
}

/**
 * Sticky Thumb-Zone Bottom Navigation & Primary Action Bar (< 768px mobile + optional desktop pill)
 * Houses 🔥 Studio | [Contextual Primary CTA] | 🎞️ Cinema
 */
export const FiresideBottomBar: React.FC<FiresideBottomBarProps> = ({
  activeView,
  recordedCount,
  primaryCtaLabel,
  isLockedPreview = false,
  isRecording = false,
  onSelectView,
  onPrimaryAction,
}) => {
  if (isRecording) return null;

  return (
    <nav
      data-testid="HS_FIRESIDE_MOBILE_BOTTOM_BAR"
      aria-label="Fireside Studio and Cinema navigation"
      className="sticky bottom-0 z-40 w-full bg-stone-950/95 backdrop-blur-xl border-t border-stone-800/90 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        <button
          type="button"
          data-testid="HS_FIRESIDE_TAB_STUDIO"
          aria-pressed={activeView === 'studio'}
          onClick={() => onSelectView('studio')}
          className={`min-h-[46px] px-3.5 py-1.5 rounded-2xl border font-mono text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeView === 'studio'
              ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-sm'
              : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Studio</span>
        </button>

        {activeView === 'studio' && primaryCtaLabel && onPrimaryAction && (
          <button
            type="button"
            data-testid="HS_FIRESIDE_BOTTOM_PRIMARY_CTA"
            onClick={onPrimaryAction}
            className={`flex-1 min-w-0 min-h-[46px] px-3 py-1.5 rounded-2xl font-mono text-xs font-black inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md truncate ${
              isLockedPreview
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                : 'bg-sky-500 hover:bg-sky-400 text-stone-950'
            }`}
          >
            {isLockedPreview ? (
              <Lock className="w-3.5 h-3.5 shrink-0" />
            ) : null}
            <span className="truncate">{primaryCtaLabel}</span>
            {!isLockedPreview && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
          </button>
        )}

        <button
          type="button"
          data-testid="HS_FIRESIDE_TAB_CINEMA"
          aria-pressed={activeView === 'cinema'}
          onClick={() => onSelectView('cinema')}
          className={`min-h-[46px] px-3.5 py-1.5 rounded-2xl border font-mono text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeView === 'cinema'
              ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 shadow-sm'
              : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          <Film className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Cinema</span>
          {recordedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 text-[10px] leading-none">
              {recordedCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default FiresideCinemaView;
