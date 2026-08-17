import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, MapPin, Heart, Share2, Download, Maximize2, Layers, Play, Pause, Volume2, VolumeX, Bookmark, Music, Sparkles, Eye, Smile, FileText, Cast, Airplay, Tv } from 'lucide-react';
import type { Memory } from '@/types';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';
import { CinemaPoster } from '@/components/memory/CinemaPoster';
import { downloadFusedAutobiography } from '@/utils/autobiographyExporter';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';

interface MemoryCinematicViewerProps {
  memory: Memory | null;
  onClose: () => void;
}

export function MemoryCinematicViewer({ memory, onClose }: MemoryCinematicViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [activeViewMode, setActiveViewMode] = useState<'media' | 'poster'>('media');
  const { user } = useAuth();
  const isDirector = !!user;
  const [isAirPlayAvailable, setIsAirPlayAvailable] = useState<boolean>(false);
  const [isChromecastAvailable, setIsChromecastAvailable] = useState<boolean>(false);
  const [isCasting, setIsCasting] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // AirPlay Target Listener
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if ((window as any).WebKitPlaybackTargetAvailabilityEvent) {
      const handleAvailability = (event: any) => {
        setIsAirPlayAvailable(event.availability === 'available');
      };
      videoEl.addEventListener('webkitplaybacktargetavailabilitychanged', handleAvailability);
      return () => {
        videoEl.removeEventListener('webkitplaybacktargetavailabilitychanged', handleAvailability);
      };
    } else if ((videoEl as any).webkitShowPlaybackTargetPicker) {
      setIsAirPlayAvailable(true);
    }
  }, [videoRef.current]);

  // Google Cast Sender SDK Loader
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initCast = () => {
      if ((window as any).chrome?.cast && (window as any).cast?.framework) {
        try {
          const context = (window as any).cast.framework.CastContext.getInstance();
          context.setOptions({
            receiverApplicationId: (window as any).chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: (window as any).chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
          });
          setIsChromecastAvailable(true);
          context.addEventListener(
            (window as any).cast.framework.CastContextEventType.CAST_STATE_CHANGED,
            (event: any) => {
              const state = event.castState;
              setIsCasting(state === (window as any).cast.framework.CastState.CONNECTED);
            }
          );
        } catch (err) {
          console.warn("[CastSDK] Initialization error:", err);
        }
      }
    };

    (window as any).__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable) initCast();
    };

    if ((window as any).cast?.framework) {
      initCast();
    } else {
      const existingScript = document.getElementById('cast-sender-sdk');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'cast-sender-sdk';
        script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  const triggerAirPlay = () => {
    if (videoRef.current && (videoRef.current as any).webkitShowPlaybackTargetPicker) {
      (videoRef.current as any).webkitShowPlaybackTargetPicker();
      toast.info("AirPlay Target Picker Triggered", {
        description: "Select your Apple TV or AirPlay compatible smart speaker."
      });
    } else {
      toast.info("AirPlay Launcher", {
        description: "AirPlay is supported natively on Safari, iOS, and macOS devices."
      });
    }
  };

  const triggerChromecast = () => {
    if ((window as any).cast?.framework) {
      try {
        const context = (window as any).cast.framework.CastContext.getInstance();
        context.requestSession().then(
          () => {
            setIsCasting(true);
            toast.success("Chromecast Session Started", {
              description: "Casting memory reel directly to your living room TV."
            });
          },
          (err: any) => {
            if (err !== 'cancel') {
              toast.error("Chromecast Connection Failed", {
                description: "Ensure your Chromecast device is powered on and on the same Wi-Fi network."
              });
            }
          }
        );
      } catch (e) {
        console.warn("[CastSDK] Request session failure:", e);
      }
    } else {
      toast.info("Chromecast Launcher", {
        description: "Cast directly from Chrome desktop, Android, or Smart TV browser."
      });
    }
  };

  // Automatic Zero-Tap Story Ingest to Local Cinema Library
  useEffect(() => {
    if (!memory?.id) return;
    try {
      const rawSaved = localStorage.getItem('mw_saved_stories');
      const savedList: Array<any> = rawSaved ? JSON.parse(rawSaved) : [];
      if (!savedList.some(item => item.id === memory.id)) {
        savedList.unshift({
          id: memory.id,
          title: memory.title,
          director: memory.credits?.director || memory.credits?.starring || 'Naresh Mepani',
          posterImageUrl: memory.posterImageUrl || memory.imageUrl || '',
          savedAt: new Date().toISOString()
        });
        localStorage.setItem('mw_saved_stories', JSON.stringify(savedList));
      }
    } catch (err) {
      console.warn('[MemoryCinematicViewer] Auto-save error:', err);
    }
  }, [memory?.id]);

  if (!memory) return null;

  // Resolve video, audio, and image assets across all memory schema fields
  const videoUrl = memory.videoUrl || (memory as any).recordingUrl || (memory as any).video || memory.mediaAttachments?.find(m => m.type === 'video' || m.url?.includes('.mp4') || m.url?.includes('.webm'))?.url;
  const audioUrl = (memory as any).audioUrl || memory.mediaAttachments?.find(m => m.type === 'audio' || m.url?.includes('.mp3') || m.url?.includes('.wav'))?.url;
  const imageUrl = memory.posterImageUrl || memory.imageUrl || (memory as any).posterUrl || memory.mediaAttachments?.find(m => m.type === 'image' || m.url?.endsWith('.jpg') || m.url?.endsWith('.png') || m.url?.endsWith('.webp'))?.url;

  const locationString = [memory.location, memory.country].filter(Boolean).join(', ');

  // Robust Date Resolution (Year, Date, Timeframe Scope)
  const formattedDate = (() => {
    if (memory.date) {
      const rawDateStr = String(memory.date).trim();
      if (/^\d{4}$/.test(rawDateStr)) {
        return rawDateStr;
      }
      const d = new Date(rawDateStr);
      if (!isNaN(d.getTime())) {
        return format(d, 'd MMMM yyyy', { locale: enGB });
      }
    }
    if ((memory as any).year) {
      const year = (memory as any).year;
      const month = (memory as any).month;
      const day = (memory as any).day;
      if (month && day) return `${day} ${month} ${year}`;
      if (month) return `${month} ${year}`;
      return `${year}`;
    }
    if ((memory as any).timeframeScope) {
      return (memory as any).timeframeScope;
    }
    return 'Date Unknown';
  })();

  const narrativeText = memory.prose || memory.originalHook || memory.description || '';

  const fusionManifest = (memory as any).fusionManifest || {
    audioMood: (memory as any).cinematicScore || (memory as any).audioMood || "Nostalgic Acoustic Guitar & Soft String Ensemble // 72 BPM",
    sensoryPalette: (memory as any).sensoryPalette || ((memory as any).sensoryValues ? Object.entries((memory as any).sensoryValues).map(([k,v]) => `${k}: ${v}`).join(', ') : "Smell of fresh Kutch rain, sound of steam train whistle in 1956"),
    emotionalTone: (memory as any).emotionalTone || (memory.emotionTags ? memory.emotionTags.join(', ') : "Reverent, Courageous, Ancestral Gratitude"),
    cohesiveScript: (memory as any).cohesiveScript || narrativeText
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 md:p-8"
      >
        {/* Ambient Phone Screen Dimming Overlay during active casting */}
        {isCasting && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl z-[60] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-6 animate-pulse shadow-[0_0_50px_rgba(245,158,11,0.3)]">
              <Cast className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="font-headline text-2xl font-black text-white uppercase tracking-widest mb-2">Casting to Living Room TV</h3>
            <p className="text-xs text-zinc-400 max-w-md mb-8 leading-relaxed font-mono uppercase tracking-wider">
              Screen dimmed to conserve battery. Control playback directly on your smart TV remote or stop the session below.
            </p>
            <button
              onClick={() => setIsCasting(false)}
              className="px-8 py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg active:scale-95"
            >
              Stop Casting
            </button>
          </div>
        )}

        {/* Backdrop Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full" />
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-7xl h-full max-h-[90vh] bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col xl:flex-row"
        >
          {/* Back to Studio (Director Only) */}
          {isDirector && (
            <button
              onClick={() => window.history.back()}
              className="absolute top-6 left-6 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/60 hover:bg-slate-950/80 text-white/60 hover:text-amber-400 transition-all backdrop-blur-md border border-white/10 text-[11px] font-mono uppercase tracking-wider cursor-pointer"
              title="Return to Studio"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Studio</span>
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Media Section (Left/Top) */}
          <div className="w-full xl:w-2/3 h-[50vh] xl:h-full bg-slate-950 relative group flex items-center justify-center overflow-hidden">
            {activeViewMode === 'poster' ? (
              <div className="w-full h-full p-4 flex items-center justify-center bg-slate-950/90 relative z-30">
                <CinemaPoster memory={memory} className="h-full max-h-[78vh] w-auto aspect-[2/3] shadow-[0_0_50px_rgba(245,158,11,0.2)]" />
              </div>
            ) : videoUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                  x-webkit-airplay="allow"
                  controlsList="nodownload"
                  className="w-full h-full object-contain cursor-pointer"
                  preload="auto"
                  autoPlay={false}
                />

                {/* CUSTOM STUDIO-STANDARD PLAYBACK SCRUBBER PILL OVERLAY */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-slate-950/90 border border-amber-500/30 rounded-2xl p-3 backdrop-blur-xl shadow-2xl flex items-center gap-3 z-40 transition-all opacity-90 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-bold shrink-0 transition-transform active:scale-95 cursor-pointer shadow-lg"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current text-slate-950" /> : <Play className="w-4 h-4 fill-current ml-0.5 text-slate-950" />}
                  </button>

                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <div className="flex items-center justify-between text-[9px] font-mono font-bold text-amber-300/80 uppercase tracking-widest">
                      <span>Playback Scrubber</span>
                      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Toggle Mute"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      data-hotspot-id="HS_CINEMA_CAST_AIRPLAY_BTN"
                      onClick={triggerAirPlay}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white/80 hover:text-amber-300 transition-all cursor-pointer"
                      title="Cast via Apple AirPlay"
                    >
                      <Airplay className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      data-hotspot-id="HS_CINEMA_CAST_CHROMECAST_BTN"
                      onClick={triggerChromecast}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white/80 hover:text-amber-300 transition-all cursor-pointer"
                      title="Cast via Google Chromecast"
                    >
                      <Cast className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : audioUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30">
                <div className="w-32 h-32 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 animate-pulse">
                   <Layers className="w-12 h-12 text-amber-400" />
                </div>
                <audio src={audioUrl} controls className="w-full max-w-md" />
              </div>
            ) : imageUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={imageUrl}
                  alt={memory.title}
                  fill
                  sizes="(max-width: 1280px) 100vw, 66vw"
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 md:p-12 text-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-[0_0_40px_rgba(245,158,11,0.3)] mb-6 border-2 border-amber-300">
                  {memory.credits?.director?.[0] || 'N'}
                </div>

                <Badge className="bg-amber-400/20 text-amber-300 border border-amber-500/30 mb-3 px-3 py-1 font-mono font-bold tracking-widest uppercase text-[10px]">
                  🎬 Cinematic Storyboard Reel
                </Badge>

                <h3 className="text-2xl md:text-4xl font-headline italic text-white max-w-lg mb-3">
                  {memory.title}
                </h3>

                <p className="text-xs text-amber-200/70 font-mono mb-8">
                  Storyteller: {memory.credits?.director || memory.credits?.starring || 'Naresh Mepani'}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    const textToSpeak = memory.prose || memory.originalHook || memory.description;
                    if (!textToSpeak) return;
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      const utterance = new SpeechSynthesisUtterance(textToSpeak);
                      utterance.rate = 0.9;
                      utterance.pitch = 1.0;
                      window.speechSynthesis.speak(utterance);
                    }
                  }}
                  className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                >
                  <span>🔊 Listen to Spoken Monologue</span>
                </button>
              </div>
            )}

            {/* FLOATING STAGE CONTROLS TOOLBAR — Director Mode Only */}
            {isDirector && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-amber-500/40 rounded-full px-4 py-2 backdrop-blur-2xl shadow-[0_0_40px_rgba(245,158,11,0.25)] flex items-center gap-3 z-50">
              <div className="flex items-center gap-2 pr-3 border-r border-white/10 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Stage Controls</span>
              </div>

              {/* Share Link Button */}
              <button
                type="button"
                onClick={() => {
                  const shareUrl = window.location.href;
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Share Link Copied to Clipboard!', {
                    description: 'You can now share this direct family story link with loved ones.'
                  });
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-white/10 hover:scale-105"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Share</span>
              </button>

              {/* Movie Poster View Toggle */}
              <button
                type="button"
                onClick={() => setActiveViewMode(prev => prev === 'media' ? 'poster' : 'media')}
                data-hotspot-id="HS_CINEMA_TOGGLE_POSTER_BTN"
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border hover:scale-105 ${
                  activeViewMode === 'poster' 
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-md' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${activeViewMode === 'poster' ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{activeViewMode === 'poster' ? '▶ Watch Video' : '🖼️ Movie Poster'}</span>
              </button>

              {/* Fused Offline Autobiography PDF Download */}
              <button
                type="button"
                data-hotspot-id="HS_CINEMA_DOWNLOAD_AUTOBIOGRAPHY_BTN"
                onClick={() => {
                  downloadFusedAutobiography(memory);
                  toast.success('Generating Offline Autobiography Keepsake...', {
                    description: "Your 2-page heirloom document is ready! Select 'Save as PDF' to download or choose your printer to print.",
                    duration: 6000,
                    dismissible: true
                  });
                }}
                className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-500/30 hover:scale-105"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print / Save PDF</span>
              </button>

              {/* Living Room TV Launcher Button */}
              <button
                type="button"
                data-hotspot-id="HS_CINEMA_TV_LAUNCHER_BTN"
                onClick={() => {
                  if (videoRef.current && (videoRef.current as any).webkitShowPlaybackTargetPicker) {
                    triggerAirPlay();
                  } else if ((window as any).cast?.framework) {
                    triggerChromecast();
                  } else {
                    window.open(`/cinema/tv?id=${memory.id}`, '_blank');
                    toast.info("Smart TV Cinema Mode Launched", {
                      description: "Opened 10-foot player route (/cinema/tv) optimized for Smart TV remotes."
                    });
                  }
                }}
                className="px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-amber-500/40 hover:scale-105"
                title="Cast to Living Room TV or launch Smart TV mode"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Cast to TV</span>
              </button>

              {/* Save / Bookmark Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSaved(!isSaved);
                  if (!isSaved) {
                    toast.success('Saved to My Family Cinema Library!', {
                      description: `"${memory.title}" has been bookmarked to your family library.`
                    });
                  } else {
                    toast.info('Removed from My Family Cinema Library');
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border hover:scale-105 ${
                  isSaved 
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 fill-current ${isSaved ? 'text-slate-950' : 'text-amber-400'}`} />
                <span className={`font-bold ${isSaved ? 'text-slate-950' : 'text-amber-400'}`}>{isSaved ? 'Saved to Library ✓' : 'Save Story'}</span>
              </button>

              {/* Offline 4K Video Download Button */}
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = videoUrl;
                    a.download = `${memory.title.replace(/\s+/g, '_')}_4K_Reel.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    toast.success('4K Archival Video Download Started');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-amber-500/30 hover:scale-105"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save 4K Video</span>
                </button>
              )}
            </div>
            )}

            {/* GUEST VIEWER TOOLBAR — Share & Bookmark only */}
            {!isDirector && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-amber-500/40 rounded-full px-4 py-2 backdrop-blur-2xl shadow-[0_0_40px_rgba(245,158,11,0.25)] flex items-center gap-3 z-50">
              <button
                type="button"
                onClick={() => {
                  const shareUrl = window.location.href;
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Share Link Copied!', { description: 'Share this link with family.' });
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-white/10 hover:scale-105"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Share</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSaved(!isSaved);
                  if (!isSaved) {
                    toast.success('Saved to My Family Cinema Library!', {
                      description: `"${memory.title}" has been bookmarked.`
                    });
                  } else {
                    toast.info('Removed from Library');
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border hover:scale-105 ${
                  isSaved 
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 fill-current ${isSaved ? 'text-slate-950' : 'text-amber-400'}`} />
                <span className={`font-bold ${isSaved ? 'text-slate-950' : 'text-amber-400'}`}>{isSaved ? 'Saved ✓' : 'Save Story'}</span>
              </button>
            </div>
            )}
          </div>

          {/* Narrative Content Section (Right/Bottom) */}
          <div className="w-full xl:w-1/3 h-full overflow-y-auto bg-slate-900/60 backdrop-blur-xl border-l border-white/5 p-8 md:p-10 custom-scrollbar">
            <div className="max-w-xl mx-auto space-y-10">
              
              {/* Header Info */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                   <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-3 py-1 font-bold tracking-wider uppercase text-[10px]">
                     Cinematic Experience
                   </Badge>
                    <h1 className="text-4xl md:text-5xl font-headline leading-tight text-white font-bold mb-4">
                      {memory.title}
                    </h1>

                    {/* Storyteller / Director Attribution */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                        {memory.credits?.director?.[0] || 'N'}
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                          Storyteller / Director
                        </span>
                        <p className="text-xs font-bold text-white tracking-wide">
                          {memory.credits?.director || memory.credits?.starring || 'Naresh Mepani'}
                        </p>
                      </div>
                    </div>
                </motion.div>

                <div className="flex flex-wrap gap-3 text-white/80 text-sm font-medium">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-amber-300">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                    <span>{formattedDate}</span>
                  </div>
                  {locationString && (
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-amber-300">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{locationString}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* GUEST LAYER 1: CINEMATIC SCORE & AUDIO MOOD PILL */}
              {fusionManifest?.audioMood && (
                <div 
                  data-hotspot-id="HS_CINEMA_SCORE_PILL"
                  className="p-3.5 bg-slate-950/90 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">
                        🎼 Cinematic Score &amp; Audio Mood
                      </span>
                      <p className="text-xs font-mono font-bold text-emerald-200 tracking-wide">
                        {fusionManifest.audioMood}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              )}

              {/* Director's Notepad */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em]">Director's Notes</h3>
                  </div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Act Narrative</span>
                </div>
                
                <div className="relative bg-slate-950/80 border border-amber-500/30 p-6 md:p-8 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.08)] group transition-all">
                   <div className="absolute top-3 left-4 text-6xl text-amber-500/10 font-serif font-black leading-none pointer-events-none">"</div>
                   <div className="relative z-10 space-y-4">
                      <p className="text-base md:text-lg font-sans leading-relaxed text-slate-100 font-normal">
                        {narrativeText}
                      </p>
                   </div>
                </div>
              </div>

              {/* GUEST LAYER 2: FUSION COHESIVE NARRATIVE BLUEPRINT CARD */}
              <div 
                data-hotspot-id="HS_CINEMA_FUSION_CARD"
                className="space-y-4 pt-4 border-t border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em]">Fusion Cohesive Narrative Blueprint</h3>
                  </div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Docu-Legacy Synthesis</span>
                </div>

                <div className="bg-slate-950/90 border border-amber-500/30 p-5 rounded-2xl space-y-3.5 shadow-2xl text-left">
                  {fusionManifest?.sensoryPalette && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span>Sensory Palette</span>
                      </span>
                      <p className="text-xs text-white/80 font-mono italic pl-3 border-l border-amber-500/30">
                        "{fusionManifest.sensoryPalette}"
                      </p>
                    </div>
                  )}

                  {fusionManifest?.emotionalTone && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Smile className="w-3 h-3 text-amber-400" />
                        <span>Emotional Tone</span>
                      </span>
                      <p className="text-xs text-white/80 font-mono italic pl-3 border-l border-amber-500/30">
                        "{fusionManifest.emotionalTone}"
                      </p>
                    </div>
                  )}

                  {fusionManifest?.cohesiveScript && (
                    <div className="space-y-1 pt-2 border-t border-white/10">
                      <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest block">
                        📜 Cohesive Spoken Monologue
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans line-clamp-3">
                        "{fusionManifest.cohesiveScript}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Production Metadata */}
              <div className="space-y-6 pt-10 border-t border-white/5">
                <div className="grid grid-cols-1 gap-6">
                  {memory.emotionTags && memory.emotionTags.length > 0 && (
                     <div>
                       <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-3">Thematic Tones</h4>
                       <div className="flex flex-wrap gap-2 text-white">
                         {memory.emotionTags.map(tag => (
                           <Badge key={tag} variant="outline" className="bg-white/5 border-white/10 hover:border-primary/50 transition-colors py-1.5 px-3 rounded-full text-xs font-medium">
                             <Heart className="w-3 h-3 mr-1.5 text-primary/70" />
                             {tag}
                           </Badge>
                         ))}
                       </div>
                     </div>
                  )}

                  {memory.category && (
                    <div>
                       <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">Sequence</h4>
                       <span className="text-white font-serif text-lg opacity-80 italic">
                         {typeof memory.category === 'string' ? memory.category : memory.category.label}
                       </span>
                    </div>
                  )}

                  {/* Lifetime Heirloom Vault Dynamic PPP Badge */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-1.5 mt-4">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                      Lifetime Heirloom Vault Active
                    </span>
                    <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-block">
                      ☕ Equivalent to 60 local coffees — zero monthly rent forever
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
