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
} from 'lucide-react';
import { HeirloomPhotoAttachment } from '@/types/fireside';
import { StoryMoodTag } from '@/types/curriculum';

export interface FiresideCinemaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBonusDrawer?: () => void;
  sceneTitle: string;
  mediaUrl?: string | null;
  mediaMode?: 'audio' | 'video';
  photos?: HeirloomPhotoAttachment[] | { url: string; caption?: string }[];
  durationSeconds?: number;
  soundtrackUrl?: string | null;
  moodTag?: StoryMoodTag;
}

export const FiresideCinemaLightbox: React.FC<FiresideCinemaLightboxProps> = ({
  isOpen,
  onClose,
  onOpenBonusDrawer,
  sceneTitle,
  mediaUrl,
  mediaMode = 'video',
  photos = [],
  durationSeconds = 0,
  soundtrackUrl,
  moodTag,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0
  );
  const [isMuted, setIsMuted] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundtrackAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync finite duration from prop whenever it updates
  useEffect(() => {
    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  // Auto-play when opened
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      setCurrentTime(0);
      setPhotoIndex(0);
      if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
        setDuration(durationSeconds);
      }

      // Play media on open
      setTimeout(() => {
        if (mediaMode === 'video' && videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        } else if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }, 100);
    } else {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      if (soundtrackAudioRef.current) soundtrackAudioRef.current.pause();
    }
  }, [isOpen, mediaMode, durationSeconds]);

  // Slideshow timer for audio mode with photos
  useEffect(() => {
    if (!isOpen || mediaMode !== 'audio' || photos.length <= 1 || !isPlaying) return;

    const interval = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isOpen, mediaMode, photos.length, isPlaying]);

  // Keyboard navigation guard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const togglePlayPause = useCallback(() => {
    if (mediaMode === 'video' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [mediaMode]);

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
          className="w-full aspect-[16/9] sm:aspect-[2.39/1] max-h-[70vh] bg-stone-950 rounded-2xl sm:rounded-3xl border border-stone-800/80 shadow-2xl relative overflow-hidden flex items-center justify-center"
        >
          {mediaMode === 'video' && mediaUrl ? (
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={mediaUrl}
                playsInline
                preload="metadata"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
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
                  onEnded={() => setIsPlaying(false)}
                />
              )}
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
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

            {onOpenBonusDrawer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBonusDrawer();
                }}
                data-hotspot-id="HS_FIRESIDE_LIGHTBOX_BONUS_BTN"
                className="min-h-[48px] px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer active:scale-95"
                title="Open Bonus Memory Drawer to add a recollection note or photo"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Open Bonus Memory Drawer</span>
              </button>
            )}
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
    </div>
  );
};

export default FiresideCinemaLightbox;
