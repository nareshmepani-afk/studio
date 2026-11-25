'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Film, MapPin, CalendarDays, Sparkles, SkipForward } from 'lucide-react';

export interface RawCinemaSlateInput {
  title?: string | null;
  chapterTitle?: string | null;
  sceneNumber?: number | null;
  location?: string | null;
  country?: string | null;
  year?: string | number | null;
  age?: number | string | null;
  narratorName?: string | null;
  backdropUrl?: string | null;
  hasBurnedInTitleSlate?: boolean;
}

export interface NormalisedCinemaSlateMeta {
  title: string;
  chapterOverline: string;
  locationLabel: string | null;
  yearLabel: string | null;
  ageLabel: string | null;
  coordinatesLine: string | null;
  narratorName: string | null;
  narratorAttribution: string | null;
  backdropImageUrl: string | null;
  hasBurnedInTitleSlate: boolean;
}

const INVALID_META_TOKENS = new Set([
  '',
  'none',
  '-',
  '--',
  'undefined',
  'null',
  'n/a',
  'unknown',
  'date unknown',
]);

export function cleanSlateToken(value?: string | number | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (INVALID_META_TOKENS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export function isStaticImageBackdropUrl(url?: string | null): boolean {
  const cleaned = cleanSlateToken(url);
  if (!cleaned) return false;
  const pathPart = cleaned.split('?')[0].toLowerCase();
  if (/\.(webm|mp4|mov|ogg|mp3|wav|m4a)$/.test(pathPart)) return false;
  return true;
}

export function normaliseCinemaSlateMeta(input: RawCinemaSlateInput): NormalisedCinemaSlateMeta {
  const title = cleanSlateToken(input.title) || 'Family Memory';
  const rawChapter = cleanSlateToken(input.chapterTitle);
  const sceneNum =
    typeof input.sceneNumber === 'number' && Number.isFinite(input.sceneNumber) && input.sceneNumber > 0
      ? input.sceneNumber
      : null;

  const chapterOverline = rawChapter
    ? sceneNum && !/scene\s+\d+/i.test(rawChapter)
      ? `${rawChapter} • Scene ${sceneNum}`
      : rawChapter
    : sceneNum
    ? `Scene ${sceneNum} • Family Memoir`
    : 'A Memory Weaver Heirloom Film';

  const loc = cleanSlateToken(input.location);
  const country = cleanSlateToken(input.country);
  const locationParts: string[] = [];
  if (loc) locationParts.push(loc);
  if (country && (!loc || !loc.toLowerCase().includes(country.toLowerCase()))) {
    locationParts.push(country);
  }
  const locationLabel = locationParts.length > 0 ? locationParts.join(', ') : null;

  const yearLabel = cleanSlateToken(input.year);
  const rawAge = cleanSlateToken(input.age);
  const numericAge = rawAge !== null ? Number(rawAge) : NaN;
  const ageLabel =
    Number.isFinite(numericAge) && numericAge > 0
      ? `Age ${Math.round(numericAge)}`
      : rawAge && /^age\s+\d+/i.test(rawAge)
      ? rawAge
      : null;

  const coordSegments = [locationLabel, yearLabel, ageLabel].filter(Boolean) as string[];
  const coordinatesLine = coordSegments.length > 0 ? coordSegments.join(' · ') : null;

  const narratorName = cleanSlateToken(input.narratorName);
  const narratorAttribution = narratorName ? `Told by ${narratorName}` : null;

  const backdropImageUrl = isStaticImageBackdropUrl(input.backdropUrl)
    ? cleanSlateToken(input.backdropUrl)
    : null;

  return {
    title,
    chapterOverline,
    locationLabel,
    yearLabel,
    ageLabel,
    coordinatesLine,
    narratorName,
    narratorAttribution,
    backdropImageUrl,
    hasBurnedInTitleSlate: Boolean(input.hasBurnedInTitleSlate),
  };
}

export function formatSpokenSlateCueText(input: RawCinemaSlateInput): string {
  const meta = normaliseCinemaSlateMeta(input);
  const contextParts = [meta.locationLabel, meta.yearLabel].filter(Boolean);
  if (contextParts.length > 0) {
    return `${meta.title} — ${contextParts.join(', ')}.`;
  }
  return `${meta.title}.`;
}

export type CinemaPreRollPhase = 'idle' | 'preroll' | 'dissolving' | 'playing';

export interface UseCinemaPreRollOptions {
  sessionKey: string;
  isOpen?: boolean;
  hasBurnedInTitleSlate?: boolean;
  preRollDurationMs?: number;
  crossDissolveMs?: number;
  getMediaElement: () => HTMLMediaElement | null;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

export function useCinemaPreRollController({
  sessionKey,
  isOpen = true,
  hasBurnedInTitleSlate = false,
  preRollDurationMs = 3000,
  crossDissolveMs = 400,
  getMediaElement,
  onPlaybackStateChange,
}: UseCinemaPreRollOptions) {
  const [phase, setPhase] = useState<CinemaPreRollPhase>('idle');
  const phaseRef = useRef<CinemaPreRollPhase>('idle');
  const hasShownPreRollRef = useRef<boolean>(false);
  const dissolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedMutedRef = useRef<boolean | null>(null);

  const updatePhase = useCallback((next: CinemaPreRollPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (dissolveTimerRef.current) {
      clearTimeout(dissolveTimerRef.current);
      dissolveTimerRef.current = null;
    }
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  }, []);

  const restoreMutedIfNeeded = useCallback((media: HTMLMediaElement | null) => {
    if (media && savedMutedRef.current !== null) {
      media.muted = savedMutedRef.current;
      savedMutedRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimers();
    hasShownPreRollRef.current = false;
    savedMutedRef.current = null;
    updatePhase('idle');
  }, [sessionKey, isOpen, clearTimers, updatePhase]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const startActualMedia = useCallback(() => {
    const media = getMediaElement();
    restoreMutedIfNeeded(media);
    if (media) {
      const playPromise = media.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          updatePhase('idle');
          onPlaybackStateChange?.(false);
        });
      }
    }
    onPlaybackStateChange?.(true);
  }, [getMediaElement, onPlaybackStateChange, restoreMutedIfNeeded, updatePhase]);

  const skipPreRoll = useCallback(() => {
    clearTimers();
    hasShownPreRollRef.current = true;
    updatePhase('playing');
    startActualMedia();
  }, [clearTimers, startActualMedia, updatePhase]);

  const triggerPlay = useCallback(() => {
    const media = getMediaElement();
    const isNearStart = !media || !(media.currentTime > 0.5);
    const shouldRunPreRoll =
      !hasShownPreRollRef.current && !hasBurnedInTitleSlate && isNearStart;

    if (!shouldRunPreRoll) {
      clearTimers();
      updatePhase('playing');
      startActualMedia();
      return;
    }

    hasShownPreRollRef.current = true;
    clearTimers();
    updatePhase('preroll');
    onPlaybackStateChange?.(true);

    // Synchronous mobile gesture unlock: prime the media element muted at t=0ms so
    // iOS Safari / Android Chrome retain user-gesture playback authority across the 3.0s slate.
    if (media) {
      savedMutedRef.current = media.muted;
      media.muted = true;
      try {
        const unlockPromise = media.play();
        if (unlockPromise && typeof unlockPromise.then === 'function') {
          unlockPromise
            .then(() => {
              if (phaseRef.current === 'preroll') {
                media.pause();
                try {
                  media.currentTime = 0;
                } catch {}
              }
              restoreMutedIfNeeded(media);
            })
            .catch(() => {
              restoreMutedIfNeeded(media);
            });
        } else {
          media.pause();
          restoreMutedIfNeeded(media);
        }
      } catch {
        restoreMutedIfNeeded(media);
      }
    }

    const dissolveDelay = Math.max(0, preRollDurationMs - crossDissolveMs);
    dissolveTimerRef.current = setTimeout(() => {
      updatePhase('dissolving');
      startActualMedia();
    }, dissolveDelay);

    endTimerRef.current = setTimeout(() => {
      updatePhase('playing');
    }, preRollDurationMs);
  }, [
    clearTimers,
    crossDissolveMs,
    getMediaElement,
    hasBurnedInTitleSlate,
    onPlaybackStateChange,
    preRollDurationMs,
    restoreMutedIfNeeded,
    startActualMedia,
    updatePhase,
  ]);

  const pausePlayback = useCallback(() => {
    clearTimers();
    const media = getMediaElement();
    restoreMutedIfNeeded(media);
    if (media) {
      media.pause();
    }
    updatePhase('idle');
    onPlaybackStateChange?.(false);
  }, [clearTimers, getMediaElement, onPlaybackStateChange, restoreMutedIfNeeded, updatePhase]);

  const resetSessionForReplay = useCallback(() => {
    clearTimers();
    hasShownPreRollRef.current = false;
    updatePhase('idle');
  }, [clearTimers, updatePhase]);

  return {
    phase,
    isPreRollVisible: phase === 'preroll' || phase === 'dissolving',
    triggerPlay,
    skipPreRoll,
    pausePlayback,
    resetSessionForReplay,
  };
}

export function toggleStageFullscreen(
  stageEl: HTMLElement | null,
  fallbackVideoEl?: HTMLVideoElement | null
): void {
  if (typeof document === 'undefined') return;
  const docAny = document as any;
  const activeFs = document.fullscreenElement || docAny.webkitFullscreenElement;

  if (activeFs) {
    if (typeof document.exitFullscreen === 'function') {
      document.exitFullscreen().catch(() => {});
    } else if (typeof docAny.webkitExitFullscreen === 'function') {
      docAny.webkitExitFullscreen();
    }
    return;
  }

  if (stageEl && typeof stageEl.requestFullscreen === 'function') {
    const req = stageEl.requestFullscreen();
    if (req && typeof req.catch === 'function') {
      req.catch(() => {
        if (fallbackVideoEl && typeof (fallbackVideoEl as any).webkitEnterFullscreen === 'function') {
          (fallbackVideoEl as any).webkitEnterFullscreen();
        }
      });
    }
    return;
  }

  if (stageEl && typeof (stageEl as any).webkitRequestFullscreen === 'function') {
    (stageEl as any).webkitRequestFullscreen();
    return;
  }

  if (fallbackVideoEl && typeof (fallbackVideoEl as any).webkitEnterFullscreen === 'function') {
    (fallbackVideoEl as any).webkitEnterFullscreen();
  }
}

export interface CinemaTitleOverlaysProps {
  meta: RawCinemaSlateInput;
  phase: CinemaPreRollPhase;
  isPlaying: boolean;
  currentTime: number;
  onSkipPreRoll: () => void;
  showTopMarquee?: boolean;
  marqueeClassName?: string;
  lowerThirdClassName?: string;
}

export const CinemaTitleOverlays: React.FC<CinemaTitleOverlaysProps> = ({
  meta: rawMeta,
  phase,
  isPlaying,
  currentTime,
  onSkipPreRoll,
  showTopMarquee = true,
  marqueeClassName = 'top-5 inset-x-16 sm:inset-x-40',
  lowerThirdClassName = 'bottom-40 left-5 sm:left-8',
}) => {
  const meta = useMemo(() => normaliseCinemaSlateMeta(rawMeta), [rawMeta]);

  const showPreRoll = phase === 'preroll' || phase === 'dissolving';
  const showLowerThird =
    !showPreRoll &&
    isPlaying &&
    currentTime >= 1.2 &&
    currentTime <= 6.2;

  const dimMarquee = isPlaying && !showPreRoll && currentTime > 7;

  return (
    <>
      {/* 1. Top Cinema Stage Marquee (Eliminates bare dark void & preserves title context) */}
      {showTopMarquee && !showPreRoll && (
        <div
          data-testid="HS_CINEMA_TOP_MARQUEE"
          data-hotspot-id="HS_CINEMA_TOP_MARQUEE"
          className={`absolute ${marqueeClassName} z-30 pointer-events-none flex flex-col items-center text-center transition-opacity duration-700 ${
            dimMarquee ? 'opacity-35 group-hover:opacity-95' : 'opacity-95'
          }`}
        >
          <div className="inline-flex flex-col items-center px-4 py-2 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-amber-500/25 shadow-[0_8px_32px_rgba(0,0,0,0.55)] max-w-full">
            <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-amber-300/90 truncate max-w-[72vw] sm:max-w-lg">
              {meta.chapterOverline}
            </span>
            <h3 className="text-sm sm:text-lg font-serif italic text-white leading-snug truncate max-w-[76vw] sm:max-w-xl">
              {meta.title}
            </h3>
            {(meta.coordinatesLine || meta.narratorAttribution) && (
              <p className="text-[10px] font-mono text-stone-300/85 truncate max-w-[74vw] sm:max-w-lg mt-0.5">
                {[meta.coordinatesLine, meta.narratorAttribution].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 2. 3.0s Heirloom Pre-Roll Opening Title Slate */}
      {showPreRoll && (
        <div
          data-testid="HS_CINEMA_PREROLL_SLATE"
          data-hotspot-id="HS_CINEMA_PREROLL_SLATE"
          role="region"
          aria-label={`Opening title card: ${meta.title}`}
          onClick={(e) => e.stopPropagation()}
          className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 sm:p-10 text-center overflow-hidden select-none transition-opacity duration-500 ${
            phase === 'dissolving' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Blurred Archival Photo / Poster Backdrop with Obsidian & Gold Fallback */}
          {meta.backdropImageUrl ? (
            <>
              <img
                src={meta.backdropImageUrl}
                alt=""
                aria-hidden="true"
                data-testid="HS_CINEMA_PREROLL_BACKDROP_IMG"
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-slate-950/95 pointer-events-none" />
            </>
          ) : (
            <div
              data-testid="HS_CINEMA_PREROLL_OBSIDIAN_FALLBACK"
              className="absolute inset-0 bg-gradient-to-br from-slate-950 via-stone-950 to-amber-950/35 pointer-events-none"
            />
          )}

          {/* Subtle Radial Candlelight Glow & Filmic Hairline Frame */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-4 sm:inset-6 rounded-2xl border border-amber-400/20 pointer-events-none" />

          {/* Centre Heirloom Typography Stack */}
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.3em]">
              <Film className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{meta.chapterOverline}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif italic text-white tracking-wide leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">
              {meta.title}
            </h2>

            <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

            {meta.coordinatesLine && (
              <p className="text-xs sm:text-sm font-mono font-semibold uppercase tracking-[0.25em] text-amber-200/95 flex items-center justify-center gap-2 flex-wrap">
                {meta.locationLabel && <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                {!meta.locationLabel && meta.yearLabel && (
                  <CalendarDays className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span>{meta.coordinatesLine}</span>
              </p>
            )}

            {meta.narratorAttribution && (
              <p className="text-xs sm:text-sm font-serif italic text-stone-300">
                {meta.narratorAttribution}
              </p>
            )}
          </div>

          {/* Skip Intro Trigger */}
          <button
            type="button"
            data-testid="HS_CINEMA_SKIP_INTRO_BTN"
            data-hotspot-id="HS_CINEMA_SKIP_INTRO_BTN"
            onClick={(e) => {
              e.stopPropagation();
              onSkipPreRoll();
            }}
            className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-20 min-h-[40px] px-3.5 py-1.5 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-amber-400/40 text-amber-200 hover:text-white text-[11px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
          >
            <span>Skip Intro</span>
            <SkipForward className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      )}

      {/* 3. 5.0s Documentary Lower-Third Chyron */}
      {showLowerThird && (
        <div
          data-testid="HS_CINEMA_LOWER_THIRD"
          data-hotspot-id="HS_CINEMA_LOWER_THIRD"
          className={`absolute ${lowerThirdClassName} z-30 max-w-[82%] sm:max-w-md pointer-events-none animate-in fade-in slide-in-from-left-4 duration-500`}
        >
          <div className="flex items-stretch rounded-xl bg-slate-950/80 backdrop-blur-md border border-amber-500/30 shadow-2xl overflow-hidden">
            <div className="w-1 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 shrink-0" />
            <div className="px-3.5 py-2.5 text-left space-y-0.5 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-amber-300 truncate">
                {meta.narratorName || meta.chapterOverline}
              </p>
              <p className="text-xs sm:text-sm font-serif italic text-white truncate">
                {meta.title}
              </p>
              {meta.coordinatesLine && (
                <p className="text-[10px] font-mono text-stone-300/90 truncate">
                  {meta.coordinatesLine}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export interface SpokenSlatePrompterCueProps {
  meta: RawCinemaSlateInput;
  enabled: boolean;
  onToggle: (nextEnabled: boolean) => void;
  isLeadInHolding?: boolean;
  compact?: boolean;
}

export const SpokenSlatePrompterCue: React.FC<SpokenSlatePrompterCueProps> = ({
  meta,
  enabled,
  onToggle,
  isLeadInHolding = false,
  compact = false,
}) => {
  const spokenLine = useMemo(() => formatSpokenSlateCueText(meta), [meta]);

  return (
    <div
      data-testid="HS_TELEPROMPTER_SPOKEN_SLATE_HEADER"
      data-hotspot-id="HS_TELEPROMPTER_SPOKEN_SLATE_HEADER"
      className={`not-italic font-sans rounded-2xl border transition-all select-none ${
        enabled
          ? isLeadInHolding
            ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.28)]'
            : 'bg-amber-950/30 border-amber-500/35'
          : 'bg-zinc-950/50 border-white/10 opacity-75'
      } ${compact ? 'p-3 mb-3' : 'p-4 mb-6'}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300">
          <span aria-hidden="true" className="text-amber-400 shrink-0 text-xs">🎬</span>
          <span>
            {isLeadInHolding
              ? 'Speak Title Aloud Now (2.5s Lead-In)...'
              : 'Optional Spoken Opening Slate'}
          </span>
        </div>

        <button
          type="button"
          data-testid="HS_TELEPROMPTER_SPOKEN_SLATE_TOGGLE"
          data-hotspot-id="HS_TELEPROMPTER_SPOKEN_SLATE_TOGGLE"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(!enabled);
          }}
          aria-pressed={enabled}
          className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
            enabled
              ? 'bg-amber-400/20 border-amber-400/50 text-amber-200 hover:bg-amber-400/30'
              : 'bg-white/5 border-white/15 text-zinc-400 hover:text-white'
          }`}
        >
          {enabled ? 'Speak Title: ON' : 'Speak Title: OFF'}
        </button>
      </div>

      {enabled && (
        <div className="mt-2 space-y-1">
          <p
            data-testid="HS_TELEPROMPTER_SPOKEN_SLATE_LINE"
            className={`${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-serif italic text-amber-100 leading-snug`}
          >
            &ldquo;{spokenLine}&rdquo;
          </p>
          <div className="text-[11px] font-mono text-amber-200/75 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Pause one calm breath, then begin your story below (not saved into printed prose).</span>
          </div>
        </div>
      )}
    </div>
  );
};
