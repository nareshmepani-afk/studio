'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Tv, Cast, X, Volume2, VolumeX, Sparkles, Film, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function SmartTVPlayerContent() {
  const searchParams = useSearchParams();
  const memoryId = searchParams.get('id');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Fetch memory details
  useEffect(() => {
    let isMounted = true;
    const fetchMemory = async () => {
      if (!memoryId) {
        setLoading(false);
        return;
      }
      try {
        // Always fetch complete memory data from API
        // localStorage 'mw_saved_stories' only stores minimal card metadata (no videoUrl)
        
        // Fetch via API
        const res = await fetch(`/api/guest-access?id=${memoryId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setMemory(data);
        }
      } catch (err) {
        console.warn("[SmartTV] Error loading memory:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMemory();
    return () => { isMounted = false; };
  }, [memoryId]);

  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showHud, setShowHud] = useState(true);
  const [showCastGuide, setShowCastGuide] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ACT IV FORMULA: Exact 2-digit zero-padded time formatter
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
    const totalSeconds = Math.floor(seconds);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ACT IV FORMULA: Comprehensive Effective Video Duration Resolver
  const effectiveVideoDuration = React.useMemo(() => {
    // 1. Direct state duration if finite and > 0
    if (duration && isFinite(duration) && duration > 0) {
      return duration;
    }
    // 2. Direct video element duration
    if (videoRef.current?.duration && isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
      return videoRef.current.duration;
    }
    // 3. Sum of recordedSegments EDL tracks
    if (memory?.recordedSegments && memory.recordedSegments.length > 0) {
      const sum = memory.recordedSegments.reduce((acc: number, seg: any) => acc + (seg.duration || 0), 0);
      if (sum > 0) return sum;
    }
    // 4. Firestore data.videoDuration, duration, or mediaAttachments
    if ((memory as any)?.videoDuration && isFinite((memory as any).videoDuration) && (memory as any).videoDuration > 0) {
      return (memory as any).videoDuration;
    }
    if ((memory as any)?.duration && isFinite((memory as any).duration) && (memory as any).duration > 0) {
      return (memory as any).duration;
    }
    const mediaDur = memory?.mediaAttachments?.find((m: any) => m.duration)?.duration;
    if (mediaDur && isFinite(mediaDur) && mediaDur > 0) {
      return mediaDur;
    }
    // 5. Dynamic fallback: current playback time if video is playing
    return currentTime > 0 ? currentTime : 0;
  }, [duration, currentTime, memory]);

  // ACT IV FORMULA: Fast-seek WebM Chromium Duration Decoder Handler
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const vid = e.currentTarget;
    if (!vid) return;

    if (vid.duration && isFinite(vid.duration) && vid.duration > 0) {
      setDuration(vid.duration);
    } else if (vid.duration === Infinity) {
      try {
        vid.currentTime = 1e101;
        const onTimeUpdateTemp = () => {
          vid.removeEventListener('timeupdate', onTimeUpdateTemp);
          vid.currentTime = 0;
          if (vid.duration && isFinite(vid.duration) && vid.duration > 0) {
            setDuration(vid.duration);
          }
        };
        vid.addEventListener('timeupdate', onTimeUpdateTemp);
      } catch (err) {
        console.warn("[MediaEngine] WebM duration seek fallback:", err);
      }
    }
  };

  // ACT IV FORMULA: Time Update with duration sync
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const vid = e.currentTarget;
    const time = vid.currentTime;
    setCurrentTime(time);
    if (vid.duration && isFinite(vid.duration) && vid.duration > 0 && duration !== vid.duration) {
      setDuration(vid.duration);
    }
  };

  // Handle inactivity timer to auto-hide 10-foot HUD after 3 seconds
  const resetInactivityTimer = () => {
    setShowHud(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowHud(false);
      }
    }, 3000);
  };

  useEffect(() => {
    resetInactivityTimer();
    const handleMouseMove = () => resetInactivityTimer();
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying]);

  // Smart TV Remote Key Event Handler (Enter, Space, Arrows, Media Keys)
  useEffect(() => {
    const handleTVRemoteKey = (e: KeyboardEvent) => {
      resetInactivityTimer();

      if (e.key === 'Enter' || e.key === ' ' || e.key === 'MediaPlayPause') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleTVRemoteKey);
    return () => window.removeEventListener('keydown', handleTVRemoteKey);
  }, [duration, isPlaying, isMuted]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Aligned video URL resolution with MemoryCinematicViewer.tsx fallback chain
  const videoUrl = memory?.videoUrl
    || (memory as any)?.recordingUrl
    || (memory as any)?.video
    || memory?.mediaAttachments?.find(
        (m: any) => m.type === 'video' || m.url?.includes('.mp4') || m.url?.includes('.webm')
      )?.url;

  const posterImageUrl = memory?.posterImageUrl 
    || memory?.imageUrl 
    || (memory as any)?.posterUrl 
    || memory?.mediaAttachments?.find(
        (m: any) => m.type === 'image' || m.url?.endsWith('.jpg') || m.url?.endsWith('.png') || m.url?.endsWith('.webp')
      )?.url;

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans p-8">
        <div className="w-24 h-24 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-amber-300">Loading Smart TV Cinema...</h2>
        <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-2">Preparing 4K Master Reel Stream</p>
      </div>
    );
  }

  if (!memoryId || !memory) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
          <Tv className="w-12 h-12 text-amber-400" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-[0.3em] text-amber-300 mb-3">Living Room TV Cinema</h1>
        <p className="text-base text-zinc-400 max-w-md mb-8 leading-relaxed">
          No memory ID specified. Scan the QR code in Act V Premiere Showcase to cast directly to this television.
        </p>
        <Link
          href="/cinema"
          className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest transition-transform active:scale-95 shadow-xl"
        >
          Return to Cinema Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative font-sans select-none">
      {/* 4K Background Player */}
      {videoUrl ? (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterImageUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onDurationChange={handleLoadedMetadata}
            onLoadStart={() => setIsBuffering(true)}
            onWaiting={() => setIsBuffering(true)}
            onCanPlay={() => setIsBuffering(false)}
            onPlaying={() => {
              setIsPlaying(true);
              setIsBuffering(false);
            }}
            onPause={() => setIsPlaying(false)}
            autoPlay
            playsInline
            x-webkit-airplay="allow"
            controlsList="nodownload"
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />

          {/* Atmospheric Cinematic Buffering Overlay (Zero Blank Box) */}
          <AnimatePresence>
            {isBuffering && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-8 text-center pointer-events-none"
              >
                {/* Soft Poster Blur Backdrop */}
                {posterImageUrl && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-3xl scale-110 pointer-events-none"
                    style={{ backgroundImage: `url(${posterImageUrl})` }}
                  />
                )}
                
                {/* Ambient Center Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />

                {/* Animated Film Reel Spinner */}
                <div className="relative mb-6 z-10">
                  <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin shadow-[0_0_50px_rgba(245,158,11,0.25)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="w-8 h-8 text-amber-400 animate-pulse" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-3 z-10 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Buffering 4K Master Reel</span>
                </div>

                <h3 className="text-2xl md:text-4xl font-headline font-black text-white uppercase tracking-wider mb-2 z-10">
                  {memory.title || 'Family Heirloom'}
                </h3>
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest max-w-md z-10">
                  Synchronizing video stream & cinematic audio score...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 relative">
          <Film className="w-16 h-16 text-amber-400/60 mb-6" />
          <h2 className="text-4xl font-headline font-black text-amber-300 uppercase tracking-widest mb-3">{memory.title || 'Family Heirloom'}</h2>
          {(memory.prose || memory.originalHook || memory.description) && (
            <p className="text-lg text-zinc-300 max-w-2xl leading-relaxed italic font-serif">
              "{memory.prose || memory.originalHook || memory.description}"
            </p>
          )}
          <p className="mt-6 text-sm text-zinc-500 font-mono uppercase tracking-widest">No recorded video available for this memory</p>
        </div>
      )}

      {/* Auto-Hiding 10-Foot Smart TV HUD */}
      {/* Persistent Standard Cast Guide Button — always accessible */}
      <div className="absolute top-6 right-6 max-w-[calc(100vw-3rem)] z-50 flex flex-col items-end gap-3 pointer-events-auto">
        <button
          type="button"
          data-hotspot-id="HS_CINEMA_TV_CAST_GUIDE_BTN"
          onClick={() => setShowCastGuide(prev => !prev)}
          className="flex items-center gap-2.5 px-4 py-2 bg-slate-950/80 hover:bg-slate-900/95 backdrop-blur-xl border border-white/20 hover:border-amber-400/60 rounded-full text-xs font-mono font-bold text-white uppercase tracking-widest transition-all active:scale-95 shadow-2xl cursor-pointer"
          title="How to stream this memory to your TV"
        >
          <Cast className="w-4 h-4 text-amber-400" />
          <span>Cast to TV</span>
        </button>

        <AnimatePresence>
          {showCastGuide && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-950/95 backdrop-blur-2xl border border-amber-500/40 rounded-2xl p-5 shadow-2xl w-80 text-left"
            >
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <p className="text-[10px] font-mono tracking-[0.15em] text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Cast className="w-3.5 h-3.5 text-amber-400" />
                  How to Stream to Your TV
                </p>
                <button
                  type="button"
                  onClick={() => setShowCastGuide(false)}
                  className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <ul className="text-xs text-white/80 space-y-2.5 font-sans">
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold shrink-0 font-mono text-[11px]">Chrome:</span>
                  <span>Menu (⋮) → Cast… → Select TV / Chromecast</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold shrink-0 font-mono text-[11px]">Safari:</span>
                  <span>Tap AirPlay icon in video controls to mirror to Apple TV</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold shrink-0 font-mono text-[11px]">Smart TV:</span>
                  <span>Open this URL directly in your TV's browser</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold shrink-0 font-mono text-[11px]">HDMI:</span>
                  <span>Connect laptop to TV via HDMI cable</span>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showHud && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/80 p-12 flex flex-col justify-between pointer-events-none z-30"
          >
            {/* Top 10-Foot Header */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg">
                  <Tv className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white uppercase tracking-[0.25em]">Memory Weaver // TV Cinema</h1>
                  <p className="text-xs font-mono text-amber-400/80 uppercase tracking-widest">1080p / 4K Exhibition Mode</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest">Smart TV Remote Active</span>
              </div>
            </div>

            {/* Bottom 10-Foot Control Deck */}
            {videoUrl && (
              <div className="space-y-6 pointer-events-auto">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-[0.3em] block mb-1">
                    {memory.credits?.director ? `Directed by ${memory.credits.director}` : 'Official Family Premiere'}
                  </span>
                  <h2 className="text-4xl md:text-5xl font-headline font-black text-white uppercase tracking-wider shadow-sm">
                    {memory.title || 'Untitled Memory'}
                  </h2>
                </div>

                {/* Scrubber & Remote Hotspot Toggle */}
                <div className="flex items-center gap-6 bg-slate-950/80 border border-amber-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl">
                  <button
                    type="button"
                    data-hotspot-id="HS_CINEMA_TV_REMOTE_TOGGLE"
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-bold shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xl"
                    title="Press Enter or Space on TV remote"
                  >
                    {isPlaying ? <Pause className="w-7 h-7 fill-current text-slate-950" /> : <Play className="w-7 h-7 fill-current ml-1 text-slate-950" />}
                  </button>

                  <div className="flex-1 flex flex-col justify-center gap-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300 uppercase tracking-widest">
                      <span>Press [Enter / Space] to Play/Pause • [← / →] to Seek</span>
                      <span>{formatTime(currentTime)} / {formatTime(effectiveVideoDuration)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200"
                        style={{ width: `${(currentTime / (effectiveVideoDuration || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SmartTVPlayerPage() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-amber-300 font-mono text-sm uppercase tracking-widest">
        Initializing Smart TV Stream...
      </div>
    }>
      <SmartTVPlayerContent />
    </Suspense>
  );
}
