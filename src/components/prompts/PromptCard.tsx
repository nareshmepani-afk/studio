"use client";

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Film,
  CheckCircle,
  Edit,
  Bookmark,
  Lock,
  Scan,
  X,
  Info,
  Rocket,
  PencilLine,
  Play,
  Clapperboard,
  Sparkles,
  ExternalLink,
  MapPin,
  Mic,
  AlertTriangle,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Prompt } from '@/types';
import StudioChapterContent from '../studio/StudioChapterContent';
import { resolveSceneFromPromptId } from '@/lib/curriculum/masterStoryStructure';

export type PromptCardProps = {
  promptId: string;
  memoryId?: string;
  promptText: string;
  promptSubtitle?: string;
  storyScript: string;
  isCompleted: boolean;
  isFlaggedForReuse: boolean;
  isLoading?: boolean;
  onStartChapter: (promptId: string, isCompleted: boolean) => void;
  onToggleFlagPrompt: (promptId: string) => void;
  canAccess: boolean;
  memoryDescription?: string;
  status?: 'draft' | 'cinematic-ready' | 'pre-release' | 'published' | 'completed';
  prompt?: Prompt;
  parentPrompt?: Prompt;
  isRecommended?: boolean;
  sceneNumber?: number;
  partLabel?: string;
  hasRecordedMedia?: boolean;
  mediaMode?: 'video' | 'audio' | null;
  mediaUrl?: string | null;
  posterUrl?: string | null;
  durationSeconds?: number | null;
  dateline?: string | null;
  originBadgeLabel?: string | null;
  activeVisionLabel?: string | null;
  onPlayReel?: () => void;
};

function formatReelDuration(totalSeconds?: number | null): string | null {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

export function PromptCard(props: PromptCardProps) {
  const router = useRouter();
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [isEditWarnOpen, setIsEditWarnOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState<boolean>(
    () => typeof IntersectionObserver === 'undefined'
  );
  const mediaStageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const syncViewport = () => {
      if (typeof window !== 'undefined') {
        setIsMobileScreen(window.innerWidth < 768);
      }
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  // Option 4: JSDOM-safe IntersectionObserver lazy #t=0.5 video decoding (250px lookahead)
  useEffect(() => {
    if (isNearViewport) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }
    const target = mediaStageRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [isNearViewport, props.mediaUrl, props.hasRecordedMedia, props.status]);

  if (props.isLoading) {
    return (
      <Card className="shadow-lg flex flex-col h-full bg-neutral-900/50 border-white/5">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-24 mb-2 bg-white/5" />
          <Skeleton className="h-5 w-3/4 bg-white/5" />
          <Skeleton className="h-5 w-1/2 bg-white/5" />
        </CardHeader>
        <CardContent className="flex-grow" />
        <CardFooter className="flex justify-between items-center mt-auto">
          <div className="flex items-center space-x-1">
            <Skeleton className="h-8 w-8 rounded-md bg-white/5" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-md mr-2 bg-white/5" />
            <Skeleton className="h-9 w-24 rounded-md bg-white/5" />
          </div>
        </CardFooter>
      </Card>
    );
  }

  const {
    promptId,
    memoryId,
    promptText,
    promptSubtitle,
    isCompleted,
    isFlaggedForReuse,
    onToggleFlagPrompt,
    canAccess,
    memoryDescription,
    status,
    isRecommended,
    sceneNumber,
    partLabel,
    hasRecordedMedia,
    mediaMode,
    mediaUrl,
    posterUrl,
    durationSeconds,
    dateline,
    originBadgeLabel,
    activeVisionLabel,
    onPlayReel,
  } = props;

  const matchedScene = resolveSceneFromPromptId(promptId);
  const resolvedSceneNumber = sceneNumber ?? matchedScene?.sceneNumber;
  const resolvedPartLabel = partLabel ?? (matchedScene ? matchedScene.partTitle.split(':')[0] : undefined);
  const sceneBadgeText = resolvedSceneNumber
    ? resolvedPartLabel
      ? `${resolvedPartLabel} • Scene ${resolvedSceneNumber}`
      : `Scene ${resolvedSceneNumber}`
    : null;

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.innerWidth < 768;

  const isInCinema = Boolean(isCompleted && status === 'published' && memoryId);
  const hasPlayableReel = Boolean(hasRecordedMedia || mediaUrl);
  const showMovieStage = Boolean(isInCinema || (isCompleted && hasPlayableReel));
  const isScriptOnlyDraft = Boolean(
    isCompleted && !isInCinema && hasRecordedMedia === false && !mediaUrl
  );
  const formattedDuration = formatReelDuration(durationSeconds);
  const canUseVideoFrame = Boolean(
    !posterUrl &&
      mediaMode !== 'audio' &&
      mediaUrl &&
      /^https?:\/\//i.test(mediaUrl)
  );

  const handleAction = (e: React.MouseEvent) => {
    if (props.isLoading) {
      e.preventDefault();
      return;
    }
    if (!canAccess) {
      e.preventDefault();
      router.push('/settings');
      return;
    }
    // Fireside 2.0 Mobile Routing: route < 768px taps directly into Fireside Studio / Fireside Cinema
    if (isMobileViewport()) {
      e.preventDefault();
      if (isInCinema) {
        router.push(`/studio/fireside?view=cinema&id=${encodeURIComponent(promptId)}`);
      } else {
        router.push(`/studio/fireside?id=${encodeURIComponent(promptId)}`);
      }
      return;
    }
    // MW-431 (2A): On desktop (>= 768px), open instant 0ms 2.39:1 Cinema Lightbox right over /studio
    if (
      isInCinema &&
      onPlayReel &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      e.button === 0
    ) {
      e.preventDefault();
      onPlayReel();
      return;
    }
    // Desktop fallback: let Link handle navigation (/cinema/tv or /studio/production)
  };

  const toggleBrief = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBriefOpen(!isBriefOpen);
  };

  const handleFlagToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.isLoading || !canAccess) return;
    e.stopPropagation();
    onToggleFlagPrompt(promptId);
  };

  const cardClasses = cn(
    "transition-all duration-500 flex flex-col h-full relative group cursor-pointer overflow-hidden rounded-2xl border backdrop-blur-sm",
    isInCinema
      ? 'bg-gradient-to-b from-emerald-950/35 via-neutral-950/75 to-amber-950/15 border-emerald-500/45 hover:border-amber-400/60 shadow-[0_0_28px_rgba(16,185,129,0.16)]'
      : showMovieStage
      ? 'bg-gradient-to-b from-amber-950/20 via-neutral-950/70 to-neutral-950 border-amber-500/35 hover:border-amber-400/60 shadow-[0_0_24px_rgba(245,158,11,0.1)]'
      : isCompleted
      ? 'bg-primary/[0.03] border-primary/20 hover:border-primary/40 shadow-2xl shadow-primary/5'
      : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]',
    isRecommended && !isCompleted && "border-emerald-500/40 ring-1 ring-emerald-500/20 bg-emerald-500/[0.03] shadow-[0_0_30px_rgba(16,185,129,0.1)]",
    isBriefOpen && "border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.1)]",
    !canAccess && "opacity-30 grayscale blur-[0.5px]"
  );

  const cardTitleClasses = cn(
    "font-headline font-bold text-lg leading-tight transition-colors mb-1 italic",
    isCompleted ? 'text-white' : 'text-white/70 group-hover:text-white',
    !canAccess && 'text-white/20'
  );

  const targetRouteId = isCompleted && memoryId ? memoryId : promptId;
  const primaryHref = isMobileScreen && canAccess
    ? isInCinema
      ? `/studio/fireside?view=cinema&id=${encodeURIComponent(promptId)}`
      : `/studio/fireside?id=${encodeURIComponent(promptId)}`
    : isInCinema
    ? `/cinema/tv?id=${memoryId}`
    : `/studio/production/${targetRouteId}${isCompleted ? '?act=1' : ''}`;
  const secondaryEditHref = isMobileScreen
    ? `/studio/fireside?id=${encodeURIComponent(promptId)}&edit=true`
    : `/studio/production/${targetRouteId}?act=1`;

  const mainButton = (
    <Button
      size="sm"
      variant={!canAccess ? "secondary" : isInCinema ? "default" : isCompleted ? "outline" : "default"}
      className={cn(
        "rounded-full px-4 h-9 font-bold tracking-tight transform active:scale-95 transition-all relative z-10 pointer-events-none",
        isInCinema
          ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          : isCompleted && "border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-xl transition-all duration-300"
      )}
      disabled={props.isLoading}
    >
      {!canAccess ? (
        <>
          <Lock className="mr-2 h-3.5 w-3.5" /> Upgrade
        </>
      ) : isInCinema ? (
        <>
          <Film className="mr-1.5 h-3.5 w-3.5" /> Watch in Cinema{' '}
          {onPlayReel ? (
            <Play className="ml-1 h-3 w-3 fill-slate-950" />
          ) : (
            <ExternalLink className="ml-1 h-3 w-3" />
          )}
        </>
      ) : isCompleted ? (
        <>
          <Edit className="mr-2 h-3.5 w-3.5" /> Edit Scene
        </>
      ) : (
        <>
          <Play className="mr-2 h-3.5 w-3.5 fill-current" /> Action
        </>
      )}
    </Button>
  );

  const cardContent = (
    <div className={cardClasses} data-hotspot-id={`HS_PROMPT_CARD_${promptId}`}>
      {/* Top subtle emerald/gold glow bar for published Cinema scenes */}
      {isInCinema && (
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-400/80 via-amber-300/90 to-emerald-400/80 pointer-events-none z-20" />
      )}

      {/* Primary Link Overlay (Preserves Next.js routes, Cmd+Click /cinema/tv, and zero nested anchors) */}
      <Link
        href={primaryHref}
        onClick={handleAction}
        className="absolute inset-0 z-10"
        prefetch={true}
      />

      {isRecommended && !isCompleted && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-emerald-500 text-slate-900 text-[8px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-b-xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center gap-2">
            <Sparkles className="w-2.5 h-2.5" />
            Next Recommended
          </div>
        </div>
      )}

      {/* Film Frame Aesthetic Overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px)] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px)]" />

      <div className="flex flex-col h-full p-6">
        <header className="mb-3.5">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            {isCompleted ? (
              <div className="flex items-center gap-2 flex-wrap">
                {isInCinema ? (
                  <div
                    data-testid={`prompt-card-in-cinema-badge-${promptId}`}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-[9px] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  >
                    <Rocket className="w-2.5 h-2.5 text-amber-300" /> In Cinema
                  </div>
                ) : isScriptOnlyDraft ? (
                  <div
                    data-testid={`prompt-card-script-draft-badge-${promptId}`}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35 text-[9px] font-black uppercase tracking-widest"
                  >
                    <PencilLine className="w-2.5 h-2.5 text-amber-400" /> Script Draft
                  </div>
                ) : (
                  <>
                    <div className="flex items-center bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                      <CheckCircle className="h-2.5 w-2.5 mr-1" />
                      Captured
                    </div>
                    {status === 'pre-release' || status === 'cinematic-ready' || hasPlayableReel ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[9px] font-black uppercase tracking-widest">
                        <Film className="w-2.5 h-2.5" /> Pre-Release
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[9px] font-black uppercase tracking-widest">
                        <PencilLine className="w-2.5 h-2.5" /> Studio Draft
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em]">
                <Clapperboard className="h-3 w-3 mr-1.5 opacity-70" />
                READY FOR ACTION
              </div>
            )}

            <div className="flex items-center gap-1.5">
              {sceneBadgeText && (
                <span
                  data-testid={`prompt-card-scene-badge-${promptId}`}
                  className="text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold"
                >
                  {sceneBadgeText}
                </span>
              )}
              {!canAccess && (
                <div className="flex items-center bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                  <Lock className="h-2.5 w-2.5 mr-1" /> Premium
                </div>
              )}
            </div>
          </div>

          <h3 className={cardTitleClasses}>
            {promptText}
          </h3>
          {promptSubtitle && (
            <p className="text-xs text-primary/80 font-medium italic -mt-0.5 mb-2">
              {promptSubtitle}
            </p>
          )}
        </header>

        <section className="flex-grow flex flex-col justify-between gap-2.5">
          {showMovieStage ? (
            <>
              {/* MW-431 (1A + 2A + 4): Harmonised 16:9 Movie / Reel Screening Stage */}
              <div
                ref={mediaStageRef}
                data-testid={`prompt-card-media-stage-${promptId}`}
                className={cn(
                  "relative w-full aspect-[16/9] rounded-xl overflow-hidden border bg-stone-950 shadow-inner",
                  isInCinema
                    ? "border-emerald-500/45 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
                    : "border-amber-500/35"
                )}
              >
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt=""
                    aria-hidden="true"
                    data-testid={`prompt-card-poster-img-${promptId}`}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : canUseVideoFrame ? (
                  <video
                    data-testid={`prompt-card-video-frame-${promptId}`}
                    src={isNearViewport ? `${mediaUrl}#t=0.5` : undefined}
                    preload={isNearViewport ? 'metadata' : 'none'}
                    muted
                    playsInline
                    aria-hidden="true"
                    className="w-full h-full object-cover opacity-85 group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : (
                  <div
                    data-testid={`prompt-card-slate-fallback-${promptId}`}
                    className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-950 to-emerald-950/35 flex items-center justify-center"
                  >
                    {mediaMode === 'audio' ? (
                      <div className="flex flex-col items-center gap-1 opacity-40">
                        <Mic className="w-7 h-7 text-amber-300" />
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45 pointer-events-none" />

                {/* Top Provenance Pill */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 pointer-events-none">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border backdrop-blur-md",
                      isInCinema
                        ? "bg-emerald-950/80 border-emerald-400/45 text-emerald-300"
                        : "bg-stone-950/80 border-amber-500/40 text-amber-300"
                    )}
                  >
                    {mediaMode === 'audio'
                      ? '🎙️ Voice Reel'
                      : isInCinema
                      ? '2.39:1 Screening'
                      : '🎬 Recorded Take'}
                  </span>

                  {originBadgeLabel && (
                    <span
                      data-testid={`prompt-card-origin-badge-${promptId}`}
                      className="px-2 py-0.5 rounded-full bg-stone-950/85 border border-amber-500/35 text-[9px] font-mono uppercase tracking-wider text-amber-200 truncate max-w-[58%]"
                    >
                      {originBadgeLabel}
                    </span>
                  )}
                </div>

                {/* Centre Play Medallion (Clickable preview button on pre-release cards; visual medallion for IN CINEMA primary overlay) */}
                {!isInCinema && onPlayReel && canAccess ? (
                  <button
                    type="button"
                    data-testid={`prompt-card-preview-reel-btn-${promptId}`}
                    aria-label={`Preview recorded take for ${promptText}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isMobileViewport()) {
                        router.push(`/studio/fireside?id=${encodeURIComponent(promptId)}`);
                        return;
                      }
                      onPlayReel();
                    }}
                    className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer group/play"
                  >
                    <span
                      data-testid={`prompt-card-play-medallion-${promptId}`}
                      className="w-12 h-12 rounded-full bg-amber-500/95 group-hover/play:bg-amber-400 text-stone-950 flex items-center justify-center shadow-[0_0_26px_rgba(245,158,11,0.55)] ring-4 ring-amber-400/25 group-hover/play:scale-105 transition-all"
                    >
                      <Play className="w-5 h-5 fill-stone-950 ml-0.5" />
                    </span>
                  </button>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span
                      data-testid={`prompt-card-play-medallion-${promptId}`}
                      className="w-14 h-14 rounded-full bg-emerald-500/95 group-hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)] ring-4 ring-emerald-400/25 group-hover:scale-105 transition-all"
                    >
                      <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                    </span>
                  </div>
                )}

                {/* Bottom Dateline & Duration Strip */}
                {(dateline || formattedDuration) && (
                  <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between gap-2 pointer-events-none">
                    {dateline ? (
                      <span
                        data-testid={`prompt-card-dateline-${promptId}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 border border-white/10 text-[10px] font-mono text-stone-200 truncate"
                      >
                        <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{dateline}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    {formattedDuration && (
                      <span
                        data-testid={`prompt-card-duration-${promptId}`}
                        className="px-2 py-0.5 rounded-full bg-black/80 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300 shrink-0"
                      >
                        {formattedDuration}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {memoryDescription && (
                <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <p className="text-xs text-white/65 line-clamp-2 italic leading-relaxed">
                    &ldquo;{memoryDescription}&rdquo;
                  </p>
                </div>
              )}
            </>
          ) : isCompleted && memoryDescription ? (
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 relative group/desc flex-grow flex items-center">
              <p className="text-xs text-white/60 line-clamp-3 italic leading-relaxed">
                &ldquo;{memoryDescription}&rdquo;
              </p>
              <div className="absolute top-1.5 right-2 opacity-0 group-hover/desc:opacity-100 transition-opacity">
                <Scan className="w-3 h-3 text-primary/40" />
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[120px] flex items-center justify-center border border-dashed border-white/5 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity">
              <Film className="w-8 h-8" />
            </div>
          )}
        </section>

        <footer className="flex justify-between items-center mt-5 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative z-20">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 transition-colors",
                        isBriefOpen ? "text-amber-400 bg-amber-400/10" : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                      onClick={toggleBrief}
                      aria-label="View scene details"
                      disabled={props.isLoading || !canAccess}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                  Review Scene Brief <span className="text-white/40 tracking-normal text-[9px] ml-1 normal-case">(Click to expand)</span>
                </TooltipContent>
              </Tooltip>

              <Dialog open={mounted && isBriefOpen} onOpenChange={setIsBriefOpen}>
                <DialogContent
                  className="!fixed !inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !w-screen !h-[100dvh] !max-w-none !border-0 !bg-transparent !p-0 !m-0 !rounded-none !shadow-none z-[1000] focus:outline-none [&>button.absolute]:hidden block"
                >
                  <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsBriefOpen(false)}
                  />

                  <div className="relative z-10 h-full w-full flex items-center justify-center p-[5vh] pointer-events-none">
                    <div
                      className="flex flex-col h-full w-full lg:w-[80vw] max-w-[1600px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-[2.5rem] pointer-events-auto"
                    >
                      <div className="bg-black/95 px-8 py-5 border border-white/10 border-b-0 rounded-t-[2.5rem] flex justify-between items-center backdrop-blur-2xl shrink-0">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                          <div>
                            <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase italic pb-1 leading-none">Production Brief</DialogTitle>
                            <DialogDescription className="sr-only">Detailed description of the cinematic scene and production requirements.</DialogDescription>
                            <p className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.4em]">Scene Exploration • Zen Mode Focus</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsBriefOpen(false); }}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all group border border-white/10"
                          >
                            <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-grow w-full bg-neutral-950/95 px-6 py-3 border border-white/10 border-t-0 rounded-b-[2.5rem] shadow-2xl overflow-y-auto backdrop-blur-3xl custom-scrollbar relative">
                        <div className="max-w-4xl mx-auto">
                          {props.prompt && (
                            <StudioChapterContent
                              prompt={props.prompt}
                              parentPrompt={props.parentPrompt}
                              script={props.storyScript}
                              isModal={true}
                              isCompleted={isCompleted}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative z-20">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleFlagToggle}
                      className="h-8 w-8 text-white/40 hover:text-primary hover:bg-primary/5 shrink-0"
                      aria-label={isFlaggedForReuse ? "Remove Bookmark" : "Bookmark Scene"}
                      disabled={props.isLoading || !canAccess}
                    >
                      <Bookmark className={cn("h-4 w-4 transition-all", isFlaggedForReuse ? 'fill-primary text-primary' : '')} />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent align="start" side="top" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest relative z-50">
                  {isFlaggedForReuse ? "Remove Bookmark" : "Bookmark Scene"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2">
            {isInCinema && canAccess && (
              <Link
                href={secondaryEditHref}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMobileViewport()) {
                    e.preventDefault();
                    router.push(`/studio/fireside?id=${encodeURIComponent(promptId)}&edit=true`);
                    return;
                  }
                  // MW-431 (3A): Harmonised Desktop Continuity Warning Modal before entering Act I on published scenes
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    setIsEditWarnOpen(true);
                  }
                }}
                data-testid={`prompt-card-edit-secondary-${promptId}`}
                className="relative z-20 pointer-events-auto inline-flex items-center gap-1 px-3 h-9 rounded-full border border-amber-500/30 bg-stone-950/70 hover:bg-stone-900 hover:border-amber-400/60 text-xs font-semibold text-amber-200/90 hover:text-amber-100 transition-colors"
                title="Protected Cinema scene — review continuity notice before editing"
              >
                <Lock className="h-3 w-3 text-amber-300" />
                <span>Edit</span>
              </Link>
            )}
            {mainButton}
          </div>
        </footer>
      </div>

      {/* Glow effect on hover */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-5 blur-[80px] transition-opacity pointer-events-none",
          isRecommended && !isCompleted ? "bg-emerald-500 opacity-[0.03]" : "bg-primary"
        )}
      />

      {/* MW-431 (3A): Harmonised Desktop Continuity Warning Modal for IN CINEMA Cards */}
      {isEditWarnOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          data-testid={`prompt-card-continuity-modal-${promptId}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsEditWarnOpen(false);
          }}
          className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-default animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="w-full max-w-md rounded-3xl border border-amber-500/45 bg-stone-950/95 p-6 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.2)] text-left space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/45 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {originBadgeLabel?.toUpperCase().includes('FIRESIDE')
                  ? 'Published in Family Cinema'
                  : 'Soundstage Master · Live in Cinema'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-serif text-white leading-snug">
              Edit &ldquo;{promptText}&rdquo; in Desktop Studio?
            </h3>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              This chapter
              {activeVisionLabel ? (
                <>
                  {' '}
                  (<span className="text-amber-300 font-semibold">{activeVisionLabel.toUpperCase()}</span>)
                </>
              ) : null}{' '}
              is premiered in your <strong className="text-white">Family Cinema</strong>.
            </p>

            <div className="rounded-2xl border border-amber-500/35 bg-amber-950/25 p-4 text-xs sm:text-sm text-stone-200 leading-relaxed">
              Editing written prose or memory coordinates updates your live story card, Pre-Roll
              Title Slate, and Lower-Third immediately —{' '}
              <strong className="text-amber-200">
                without changing the spoken words already recorded in your video or voice reel
              </strong>{' '}
              (unless you record a new cut in Act III / IV).
            </div>

            <div className="pt-1 flex flex-col gap-2.5">
              <button
                type="button"
                data-testid={`prompt-card-warn-keep-safe-${promptId}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditWarnOpen(false);
                }}
                className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition cursor-pointer shadow-md"
              >
                Keep Safe (Stay on Production Board)
              </button>

              {onPlayReel && (
                <button
                  type="button"
                  data-testid={`prompt-card-warn-watch-${promptId}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditWarnOpen(false);
                    onPlayReel();
                  }}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Film className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Watch Film in Screening Room ▶</span>
                </button>
              )}

              <button
                type="button"
                data-testid={`prompt-card-warn-unlock-${promptId}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditWarnOpen(false);
                  router.push(secondaryEditHref);
                }}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white font-mono font-semibold text-xs sm:text-sm flex items-center justify-center transition cursor-pointer"
              >
                Unlock Desktop Studio Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!canAccess) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent className="bg-primary text-primary-foreground border-none shadow-2xl p-5 max-w-[300px] rounded-2xl">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20"><Lock className="h-4 w-4" /></div>
                <p className="font-headline text-lg italic">Premium Chapter</p>
              </div>
              <p className="text-xs leading-relaxed opacity-90 italic">
                This chapter is part of the Premium Life Journey production suite. Upgrade your Host Pass to weave this memory into your legacy.
              </p>
              <div className="pt-3 border-t border-white/20">
                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Click card to upgrade
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
