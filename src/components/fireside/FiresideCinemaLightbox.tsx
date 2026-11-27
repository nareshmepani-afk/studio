'use client';

/**
 * 🍿 Fireside Cinema Lightbox — Full-Screen 2.39:1 Theatrical Previewer
 *
 * Immersive widescreen theatrical viewer for armchair narrators and families.
 * Renders completed master reels with:
 * - 2.39:1 Anamorphic cinema aspect ratio letterbox
 * - Front-camera video playback OR Ken Burns photo slideshow with audio
 * - Dedicated play/pause, timecode scrubber, and volume controls
 * - Ambient orchestral score accompaniment if active
 * - Hotspot telemetry integration (HS_FIRESIDE_LIGHTBOX_*)
 * - Keyboard listeners (Escape to close, Space to toggle play/pause)
 *
 * Milestone: MW-88-T2 (Ticket #259)
 * Route: /studio/fireside
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English, Rule 26 Elder Ergonomics, Rule 39 Armchair Powerhouse)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Music,
  Film,
  Camera,
  PlusCircle,
  Trash2,
  Lock,
  AlertCircle,
  AlertTriangle,
  Mic,
} from 'lucide-react';
import { HeirloomPhotoAttachment } from '@/types/fireside';
import { StoryMoodTag, EditingAuthority } from '@/types/curriculum';
import {
  CinemaTitleOverlays,
  toggleStageFullscreen,
  useCinemaPreRollController,
  type RawCinemaSlateInput,
} from '@/components/cinema/CinemaTitleOverlays';

export interface FiresideCinemaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBonusDrawer?: () => void;
  onDiscardTake?: () => void;
  onRecordAlternateTake?: () => void;
  isProtectedMasterReel?: boolean;
  isPublishedInCinema?: boolean;
  activeWeaveLabel?: string | null;
  editingAuthority?: EditingAuthority;
  sceneTitle: string;
  chapterTitle?: string | null;
  sceneNumber?: number | null;
  location?: string | null;
  year?: string | number | null;
  age?: number | string | null;
  narratorName?: string | null;
  hasBurnedInTitleSlate?: boolean;
  mediaUrl?: string | null;
  mediaMode?: 'audio' | 'video';
  photos?: HeirloomPhotoAttachment[] | { url: string; caption?: string }[];
  durationSeconds?: number;
  soundtrackUrl?: string | null;
  moodTag?: StoryMoodTag;
  posterUrl?: string | null;
}

export const FiresideCinemaLightbox: React.FC<FiresideCinemaLightboxProps> = ({
  isOpen,
  onClose,
  onOpenBonusDrawer,
  onDiscardTake,
  onRecordAlternateTake,
  isProtectedMasterReel = false,
  isPublishedInCinema = false,
  activeWeaveLabel = null,
  editingAuthority = 'fireside_flexible',
  sceneTitle,
  chapterTitle,
  sceneNumber,
  location,
  year,
  age,
  narratorName,
  hasBurnedInTitleSlate = false,
  mediaUrl,
  mediaMode = 'video',
  photos = [],
  durationSeconds = 0,
  soundtrackUrl,
  moodTag,
  posterUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0
  );
  const [isMuted, setIsMuted] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [isStageFullscreen, setIsStageFullscreen] = useState(false);
  const isDesktopLocked = editingAuthority === 'desktop_locked';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundtrackAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getActiveMedia = useCallback(
    () => (mediaMode === 'video' ? videoRef.current : audioRef.current),
    [mediaMode]
  );

  const {
    phase: preRollPhase,
    isPreRollVisible,
    triggerPlay,
    skipPreRoll,
    pausePlayback,
    resetSessionForReplay,
  } = useCinemaPreRollController({
    sessionKey: `${sceneTitle}_${mediaUrl || ''}`,
    isOpen,
    hasBurnedInTitleSlate,
    getMediaElement: getActiveMedia,
    onPlaybackStateChange: setIsPlaying,
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleFs = () => {
      setIsStageFullscreen(
        Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement)
      );
    };
    document.addEventListener('fullscreenchange', handleFs);
    document.addEventListener('webkitfullscreenchange', handleFs);
    return () => {
      document.removeEventListener('fullscreenchange', handleFs);
      document.removeEventListener('webkitfullscreenchange', handleFs);
    };
  }, []);

  // Sync finite duration from prop whenever it updates
  useEffect(() => {
    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  // Auto-play with 3.0s Title Slate pre-roll when opened on valid cloud media
  useEffect(() => {
    setShowDiscardConfirm(false);
    if (isOpen) {
      const isStaleBlob = typeof mediaUrl === 'string' && mediaUrl.startsWith('blob:');
      if (isStaleBlob) {
        setMediaLoadError(
          'This take was recorded in an earlier local session. Please record a fresh take to secure permanently in the Generational Vault.'
        );
        setIsPlaying(false);
      } else {
        setMediaLoadError(null);
      }
      setCurrentTime(0);
      setPhotoIndex(0);
      if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
        setDuration(durationSeconds);
      }

      if (!isStaleBlob && mediaUrl) {
        const startTimer = setTimeout(() => {
          triggerPlay();
        }, 60);
        return () => clearTimeout(startTimer);
      }
    } else {
      pausePlayback();
      setMediaLoadError(null);
      if (soundtrackAudioRef.current) soundtrackAudioRef.current.pause();
    }
  }, [isOpen, mediaMode, durationSeconds, mediaUrl, triggerPlay, pausePlayback]);

  // Slideshow timer for audio mode with photos
  useEffect(() => {
    if (!isOpen || mediaMode !== 'audio' || photos.length <= 1 || !isPlaying) return;

    const interval = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isOpen, mediaMode, photos.length, isPlaying]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying || isPreRollVisible) {
      pausePlayback();
    } else if (mediaUrl && !mediaLoadError) {
      triggerPlay();
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [isPlaying, isPreRollVisible, mediaUrl, mediaLoadError, pausePlayback, triggerPlay]);

  // Keyboard navigation guard (Esc dismisses active confirmation modal before closing Lightbox; Space locked while modal is open)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
          return;
        }
        onClose();
      } else if (e.key === ' ' && e.target === document.body && !showDiscardConfirm) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showDiscardConfirm, togglePlayPause]);

  const handleToggleFullscreen = useCallback(() => {
    toggleStageFullscreen(containerRef.current, videoRef.current);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
    const el = e.currentTarget;
    if (Number.isFinite(el.duration) && el.duration > 0) {
      setDuration(el.duration);
    } else if (el.duration === Infinity) {
      el.currentTime = 1e101;
      const resolveWebmDuration = () => {
        el.removeEventListener('timeupdate', resolveWebmDuration);
        if (Number.isFinite(el.duration) && el.duration > 0) {
          setDuration(el.duration);
        }
        el.currentTime = 0;
      };
      el.addEventListener('timeupdate', resolveWebmDuration);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaMode === 'video' && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (Number.isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
        setDuration(videoRef.current.duration);
      }
    } else if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (!Number.isFinite(target)) return;
    setCurrentTime(target);
    if (mediaMode === 'video' && videoRef.current) {
      videoRef.current.currentTime = target;
    } else if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const formatMMSS = (secs: number) => {
    if (!Number.isFinite(secs) || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  const currentPhoto = photos[photoIndex] || photos[0];
  const photoUrl = currentPhoto
    ? typeof currentPhoto === 'string'
      ? currentPhoto
      : (currentPhoto as any).localUri ||
        (currentPhoto as any).storageUrl ||
        (currentPhoto as any).previewUrl ||
        (currentPhoto as any).url ||
        null
    : null;

  const effectiveDuration =
    Number.isFinite(duration) && duration > 0
      ? duration
      : Number.isFinite(durationSeconds) && durationSeconds > 0
      ? durationSeconds
      : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Cinema preview: ${sceneTitle}`}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none animate-in fade-in duration-300"
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-20 py-2 border-b border-stone-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Film className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                2.39:1 Cinema Master Reel
              </span>
              {moodTag && (
                <span className="text-[10px] font-mono text-stone-400 capitalize">
                  • {moodTag}
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-serif font-normal text-white truncate max-w-xs sm:max-w-md">
              {sceneTitle}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          data-hotspot-id="HS_FIRESIDE_LIGHTBOX_CLOSE"
          className="min-w-[44px] min-h-[44px] rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          title="Close theatrical cinema preview (Esc)"
          aria-label="Close theatrical preview"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main 2.39:1 Widescreen Cinema Stage */}
      <main className="w-full max-w-6xl mx-auto flex-1 flex items-center justify-center my-4 overflow-hidden relative">
        <div
          ref={containerRef}
          data-testid="HS_FIRESIDE_LIGHTBOX_STAGE"
          className="w-full aspect-[16/9] sm:aspect-[2.39/1] max-h-[70vh] bg-stone-950 rounded-2xl sm:rounded-3xl border border-stone-800/80 shadow-2xl relative overflow-hidden flex items-center justify-center group"
        >
          {!mediaLoadError && Boolean(mediaUrl) && (
            <CinemaTitleOverlays
              meta={{
                title: sceneTitle,
                chapterTitle,
                sceneNumber,
                location,
                year,
                age,
                narratorName,
                backdropUrl: posterUrl || photoUrl,
                hasBurnedInTitleSlate,
              }}
              phase={preRollPhase}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onSkipPreRoll={skipPreRoll}
              showTopMarquee={isStageFullscreen}
              marqueeClassName="top-4 inset-x-10 sm:inset-x-24"
              lowerThirdClassName="bottom-6 left-4 sm:left-6"
            />
          )}

          {mediaMode === 'video' && mediaUrl ? (
            <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-stone-900 via-stone-950 to-black">
              <video
                ref={videoRef}
                src={mediaUrl}
                poster={posterUrl || photoUrl || undefined}
                playsInline
                preload="auto"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  setIsPlaying(false);
                  resetSessionForReplay();
                }}
                onError={() => {
                  setMediaLoadError(
                    'This take was recorded in an earlier local session or the media link is unavailable. Please record a fresh take to secure permanently in the Generational Vault.'
                  );
                  setIsPlaying(false);
                }}
                className="w-full h-full object-cover sm:object-contain bg-black"
              />
              {photoUrl && (
                <div
                  data-testid="lightbox-video-photo-inset"
                  className="absolute bottom-4 left-4 z-20 w-24 sm:w-32 aspect-[4/3] rounded-xl overflow-hidden border-2 border-amber-400/70 shadow-2xl bg-stone-950"
                >
                  <img
                    src={photoUrl}
                    alt="Attached heirloom photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Audio Performance + Scanned Heirloom Photo Slideshow */
            <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-stone-900 to-black">
              {photoUrl ? (
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                  {/* Ambient blurred background fill */}
                  <img
                    src={photoUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110"
                  />
                  {/* Foreground Heirloom Photo with Ken Burns subtle zoom */}
                  <img
                    src={photoUrl}
                    alt="Heirloom photo memory"
                    data-testid="lightbox-heirloom-photo"
                    className="relative z-10 w-full h-full object-contain sm:object-cover transition-transform duration-10000 ease-out transform scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 z-10 pointer-events-none" />
                  <div className="absolute bottom-3 left-4 z-20 bg-stone-950/80 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-mono text-amber-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Vintage Photo {photoIndex + 1} of {photos.length} • Spoken Voice Memoir
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 z-10">
                  <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-serif text-amber-200 mb-1">{sceneTitle}</h3>
                  <p className="text-xs text-stone-400 font-mono">Spoken Oral History Monologue</p>
                </div>
              )}

              {/* Hidden Audio Player */}
              {mediaUrl && (
                <audio
                  ref={audioRef}
                  src={mediaUrl}
                  preload="metadata"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => {
                    setIsPlaying(false);
                    resetSessionForReplay();
                  }}
                  onError={() => {
                    setMediaLoadError(
                      'This take was recorded in an earlier local session or the media link is unavailable. Please record a fresh take to secure permanently in the Generational Vault.'
                    );
                    setIsPlaying(false);
                  }}
                />
              )}
            </div>
          )}

          {/* Expired Blob / Media Playback Guidance Banner (AUDIT-MW-147) */}
          {mediaLoadError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] bg-stone-900/95 border border-amber-500/70 text-amber-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-sans">{mediaLoadError}</p>
            </div>
          )}

          {/* Optional Ambient Soundtrack Player */}
          {soundtrackUrl && (
            <audio ref={soundtrackAudioRef} src={soundtrackUrl} loop />
          )}

          {/* Center Overlay Play/Pause Trigger */}
          <button
            type="button"
            onClick={togglePlayPause}
            data-hotspot-id="HS_FIRESIDE_LIGHTBOX_PLAY"
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-all cursor-pointer group z-20"
            aria-label={isPlaying ? 'Pause master reel' : 'Play master reel'}
          >
            {!isPlaying && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500/90 hover:bg-amber-400 text-stone-950 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.6)] transform group-hover:scale-105 transition-all">
                <Play className="w-10 h-10 fill-stone-950 ml-1.5" />
              </div>
            )}
          </button>
        </div>
      </main>

      {/* Directorial Playback Controls Bar */}
      <footer className="w-full max-w-6xl mx-auto z-20 bg-stone-950/80 border border-stone-800 rounded-2xl p-4 sm:p-5 backdrop-blur-lg flex flex-col gap-3">
        {/* Scrubber Slider */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs font-mono text-stone-400 shrink-0 w-12 text-right">
            {formatMMSS(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={effectiveDuration > 0 ? effectiveDuration : 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek timeline position"
            className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
          />
          <span className="text-xs font-mono text-stone-400 shrink-0 w-12">
            {formatMMSS(effectiveDuration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            <button
              type="button"
              onClick={togglePlayPause}
              className="min-w-[48px] min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center transition cursor-pointer active:scale-95 shadow"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-stone-950" />
              ) : (
                <Play className="w-5 h-5 fill-stone-950 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="min-w-[48px] min-h-[48px] rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              type="button"
              data-testid="HS_FIRESIDE_LIGHTBOX_FULLSCREEN_BTN"
              data-hotspot-id="HS_FIRESIDE_LIGHTBOX_FULLSCREEN_BTN"
              onClick={handleToggleFullscreen}
              className="min-w-[48px] min-h-[48px] rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95"
              aria-label={isStageFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isStageFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isStageFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            {onOpenBonusDrawer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBonusDrawer();
                }}
                data-hotspot-id="HS_FIRESIDE_LIGHTBOX_BONUS_BTN"
                className="min-h-[48px] px-3 sm:px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer active:scale-95"
                title="Open Bonus Memory Drawer to add a recollection note or photo"
              >
                <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="sm:hidden">Bonus Note</span>
                <span className="hidden sm:inline">Open Bonus Memory Drawer</span>
              </button>
            )}

            {/* Discard Take Trigger (Opens Root Full-Card Protected Master Modal or Outtake Safety Modal — MW-430) */}
            <button
              type="button"
              data-testid="HS_FIRESIDE_LIGHTBOX_DISCARD_BTN"
              data-hotspot-id="HS_FIRESIDE_LIGHTBOX_DISCARD_BTN"
              onClick={() => {
                pausePlayback();
                if (videoRef.current) videoRef.current.pause();
                if (audioRef.current) audioRef.current.pause();
                if (soundtrackAudioRef.current) soundtrackAudioRef.current.pause();
                setIsPlaying(false);
                setShowDiscardConfirm(true);
              }}
              className="min-h-[48px] px-3.5 rounded-xl bg-stone-900 hover:bg-rose-950/40 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Discard Take</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-stone-400">
            {photos.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>{photos.length} Vintage {photos.length === 1 ? 'Photo' : 'Photos'}</span>
              </span>
            )}
            <span className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-300">
              Theatrical Cut
            </span>
          </div>
        </div>
      </footer>

      {/* Root Full-Card Protected Master Modal & Outtake Safety Modal (MW-430) */}
      {showDiscardConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          data-testid={
            isProtectedMasterReel
              ? 'HS_FIRESIDE_LIGHTBOX_PROTECTED_MASTER_MODAL'
              : 'HS_FIRESIDE_LIGHTBOX_OUTTAKE_MODAL'
          }
          onClick={(e) => {
            e.stopPropagation();
            setShowDiscardConfirm(false);
          }}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {isProtectedMasterReel ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-amber-500/45 bg-stone-950/95 p-6 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.2)] text-left space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/45 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {isDesktopLocked && isPublishedInCinema
                    ? 'Soundstage Master · Live in Cinema'
                    : isDesktopLocked
                    ? 'Soundstage Master · Protected Reel'
                    : isPublishedInCinema
                    ? 'Published in Family Cinema'
                    : 'Master Reel · Protected'}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif text-white leading-snug">
                Keep &ldquo;{sceneTitle}&rdquo; Master Reel Safe?
              </h3>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {isDesktopLocked ? (
                  <>
                    This chapter&apos;s Master Reel
                    {activeWeaveLabel ? (
                      <>
                        {' '}
                        (<span className="text-amber-300 font-semibold">{activeWeaveLabel.toUpperCase()}</span>)
                      </>
                    ) : null}{' '}
                    was mastered{isPublishedInCinema ? ' and premiered' : ''} in{' '}
                    <strong className="text-white">Desktop Soundstage</strong>.
                  </>
                ) : (
                  <>
                    This chapter&apos;s Master Reel is live in your{' '}
                    <strong className="text-white">Family Cinema</strong>.
                  </>
                )}
              </p>

              <div className="rounded-2xl border border-amber-500/35 bg-amber-950/25 p-4 text-xs sm:text-sm text-stone-200 leading-relaxed">
                Protected Master Reels cannot be deleted from Fireside mobile —{' '}
                <strong className="text-amber-200">
                  your recorded film, written prose, and memory coordinates stay 100% safe.
                </strong>{' '}
                You can record a separate alternate take or attach a bonus recollection below.
              </div>

              <div className="pt-1 flex flex-col gap-2.5">
                <button
                  type="button"
                  data-testid="HS_FIRESIDE_LIGHTBOX_KEEP_MASTER_BTN"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <span>Keep Master Reel Safe</span>
                </button>

                {onRecordAlternateTake && (
                  <button
                    type="button"
                    data-testid="HS_FIRESIDE_LIGHTBOX_ALT_TAKE_BTN"
                    onClick={() => {
                      setShowDiscardConfirm(false);
                      onRecordAlternateTake();
                    }}
                    className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-amber-500/45 text-amber-200 font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Record Alternate Take Instead</span>
                  </button>
                )}

                {onOpenBonusDrawer && (
                  <button
                    type="button"
                    data-testid="HS_FIRESIDE_LIGHTBOX_MODAL_BONUS_BTN"
                    onClick={() => {
                      setShowDiscardConfirm(false);
                      onClose();
                      onOpenBonusDrawer();
                    }}
                    className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-amber-500/35 text-amber-300 font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Add Bonus Note or Photo Instead</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-rose-500/45 bg-stone-950/95 p-6 sm:p-7 shadow-2xl text-left space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300">
                <Film className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Fireside Take · Safety Check</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif text-white leading-snug">
                Move Take to Outtakes?
              </h3>

              <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4 text-xs sm:text-sm text-stone-200 leading-relaxed">
                <strong className="text-emerald-300">
                  Your written script, memory coordinates, and heirloom photos stay 100% untouched.
                </strong>{' '}
                This recording moves safely to your Cutting Room Floor outtakes and can be restored at any time.
              </div>

              <div className="pt-1 flex flex-col gap-2.5">
                <button
                  type="button"
                  data-testid="HS_FIRESIDE_DISCARD_CANCEL_BTN"
                  data-hotspot-id="HS_FIRESIDE_DISCARD_CANCEL_BTN"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition cursor-pointer shadow-md"
                >
                  Cancel · Keep This Take
                </button>

                <button
                  type="button"
                  data-testid="HS_FIRESIDE_DISCARD_CONFIRM_BTN"
                  data-hotspot-id="HS_FIRESIDE_DISCARD_CONFIRM_BTN"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onDiscardTake?.();
                    onClose();
                  }}
                  className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition cursor-pointer"
                >
                  Confirm Discard (Move to Outtakes)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FiresideCinemaLightbox;
