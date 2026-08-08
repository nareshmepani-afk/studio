import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, MapPin, Heart, Share2, Download, Maximize2, Layers, Play, Pause, Volume2, VolumeX, Bookmark } from 'lucide-react';
import type { Memory } from '@/types';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';

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
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!memory) return null;

  // Resolve video, audio, and image assets across all memory schema fields
  const videoUrl = memory.videoUrl || (memory as any).recordingUrl || (memory as any).video || memory.mediaAttachments?.find(m => m.type === 'video' || m.url?.includes('.mp4') || m.url?.includes('.webm'))?.url;
  const audioUrl = (memory as any).audioUrl || memory.mediaAttachments?.find(m => m.type === 'audio' || m.url?.includes('.mp3') || m.url?.includes('.wav'))?.url;
  const imageUrl = memory.posterImageUrl || memory.imageUrl || (memory as any).posterUrl || memory.mediaAttachments?.find(m => m.type === 'image' || m.url?.endsWith('.jpg') || m.url?.endsWith('.png') || m.url?.endsWith('.webp'))?.url;

  const locationString = [memory.location, memory.country].filter(Boolean).join(', ');

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
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Media Section (Left/Top) */}
          <div className="w-full xl:w-2/3 h-[50vh] xl:h-full bg-slate-950 relative group flex items-center justify-center overflow-hidden">
            {videoUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                  preload="auto"
                  autoPlay={false}
                />

                {/* CUSTOM STUDIO-STANDARD PLAYBACK SCRUBBER PILL OVERLAY */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-slate-950/90 border border-amber-500/30 rounded-2xl p-3 backdrop-blur-xl shadow-2xl flex items-center gap-3 z-40 transition-all opacity-90 group-hover:opacity-100">
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
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
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
              /* Cinematic Monologue Storyboard Reel Fallback */
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

            {/* FLOATING STAGE CONTROLS TOOLBAR (Share & Save) */}
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
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>{isSaved ? 'Saved to Library' : 'Save Story'}</span>
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

                <div className="flex flex-wrap gap-4 text-white/60 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    {(memory.date && !isNaN(new Date(memory.date).getTime()))
                      ? format(new Date(memory.date), 'PPP', { locale: enGB }) 
                      : 'Date Unknown'}
                  </div>
                  {locationString && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {locationString}
                    </div>
                  )}
                </div>
              </div>

              {/* Director's Notepad */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Director's Notes</h3>
                </div>
                
                <div className="relative bg-white/[0.02] border border-white/10 p-6 md:p-8 rounded-2xl shadow-inner group transition-all hover:bg-white/[0.03]">
                   <div className="absolute top-4 left-4 text-6xl text-white/5 font-serif font-black leading-none pointer-events-none group-hover:text-primary/10 transition-colors">"</div>
                   <div className="prose prose-invert prose-slate max-w-none relative z-10 px-2 md:px-4">
                      <p className="text-xl md:text-2xl font-serif leading-relaxed text-slate-200/90 italic">
                        {memory.description}
                      </p>
                   </div>
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
