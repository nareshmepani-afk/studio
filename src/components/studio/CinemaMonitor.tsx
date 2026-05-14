'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Video, Volume2, Heart, Clock, 
  ChevronRight, Sparkles, Eye, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StructuredScript, StageDirection, BeatSheetItem } from '@/types';

interface CinemaMonitorProps {
  structuredScript: StructuredScript;
  onActivity?: () => void;
  onNext?: () => void;
  isSaving?: boolean;
  className?: string;
}

export const CinemaMonitor: React.FC<CinemaMonitorProps> = ({
  structuredScript,
  onActivity,
  onNext,
  isSaving = false,
  className
}) => {
  const { cleanScript, stageDirections = [], beatSheet = [], generatedSoundtrackUrl } = structuredScript;
  const [audioStatus, setAudioStatus] = React.useState<'loading' | 'playing' | 'error' | 'none'>('none');

  // --- CINEMATIC SOUNDSTACK ORCHESTRATION ---
  React.useEffect(() => {
    if (!generatedSoundtrackUrl) {
      setAudioStatus('none');
      return;
    }

    setAudioStatus('loading');
    const audio = new Audio(generatedSoundtrackUrl);
    audio.loop = true;
    audio.volume = 0;

    const startAudio = async () => {
      try {
        await audio.play();
        setAudioStatus('playing');
        
        // 5-Second Cinematic Fade-in (0.0 -> 0.4)
        const duration = 5000;
        const targetVolume = 0.4;
        const interval = 50; // ms
        const steps = duration / interval;
        const increment = targetVolume / steps;

        const fadeTimer = setInterval(() => {
          if (audio.volume < targetVolume) {
            audio.volume = Math.min(targetVolume, audio.volume + increment);
          } else {
            clearInterval(fadeTimer);
          }
        }, interval);

        return () => clearInterval(fadeTimer);
      } catch (err) {
        console.warn("[CinemaMonitor] Autoplay prevented. Audio requires user interaction.", err);
        setAudioStatus('error');
      }
    };

    const fadeCleanup = startAudio();

    return () => {
      fadeCleanup.then(cleanup => cleanup?.());
      audio.pause();
      audio.src = "";
      setAudioStatus('none');
    };
  }, [generatedSoundtrackUrl]);

  return (
    <div className={cn("w-full h-full flex overflow-hidden bg-black/20 rounded-[3rem] border border-white/5", className)} onMouseMove={onActivity}>
      {/* --- DIRECTORIAL SIDEBAR (Left) --- */}
      <div className="w-[30%] border-r border-white/5 bg-slate-900/40 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Director's HUD</span>
          </div>
          <div className="flex items-center gap-3">
            {audioStatus === 'playing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="flex gap-0.5 items-end h-3">
                  {[1, 2, 3].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: ["20%", "100%", "20%"] }}
                      transition={{ duration: 0.5 + i * 0.2, repeat: Infinity }}
                      className="w-0.5 bg-sky-400"
                    />
                  ))}
                </div>
                <span className="text-[8px] font-bold text-sky-400 uppercase tracking-widest">Score Live</span>
              </motion.div>
            )}
            <div className="px-2 py-1 bg-sky-500/10 rounded text-[8px] font-bold text-sky-400 uppercase tracking-widest border border-sky-500/20">
              Live Metadata
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
          {/* 1. Emotional Beat Sheet */}
          {beatSheet.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-px bg-sky-500/30" />
                <span className="text-[9px] font-black text-sky-400/60 uppercase tracking-[0.4em]">Emotional Arc</span>
              </div>
              <div className="space-y-4">
                {beatSheet.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 group/beat"
                  >
                    <div className="flex-none w-1.5 h-1.5 rounded-full bg-sky-500/40 mt-1.5 shadow-[0_0_8px_rgba(56,189,248,0.3)] group-hover/beat:bg-sky-400 transition-colors" />
                    <p className="text-[11px] text-white/50 leading-relaxed font-serif group-hover/beat:text-white/70 transition-colors">
                      {item}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Production Stage Directions */}
          {stageDirections.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-px bg-emerald-500/30" />
                <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-[0.4em]">Production Cues</span>
              </div>
              <div className="space-y-4">
                {stageDirections.map((dir, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 hover:bg-white/10 transition-all group/cue"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {dir.type === 'visual' && <Video className="w-3 h-3 text-emerald-400/60" />}
                        {dir.type === 'audio' && <Volume2 className="w-3 h-3 text-sky-400/60" />}
                        {dir.type === 'beat' && <Heart className="w-3 h-3 text-rose-400/60" />}
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{dir.type}</span>
                      </div>
                      <span className="text-[9px] font-mono text-white/20 group-hover/cue:text-white/40 transition-colors">{dir.timecode}</span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed group-hover/cue:text-white/80 transition-colors">{dir.content}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- NARRATIVE CANVAS (Right) --- */}
      <div className="flex-1 bg-zinc-950/40 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-3xl mx-auto px-12 py-16 space-y-12">
          <div className="flex items-center justify-between opacity-20">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Clean Script View</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-mono">SCENE 01 // TAKE 01</span>
            </div>
          </div>

          <div className="font-serif text-[22px] lg:text-[28px] text-white/80 leading-[1.8] whitespace-pre-wrap select-text selection:bg-sky-500/30">
            {cleanScript}
          </div>

          <div className="pt-24 pb-12 flex flex-col items-center gap-8">
            <div className="w-12 h-px bg-white/20" />
            
            {onNext && (
              <button 
                onClick={onNext}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-6 px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[12px] font-black uppercase tracking-[0.4em] rounded-2xl transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] group",
                  isSaving && "opacity-50 cursor-wait"
                )}
              >
                <span className="relative z-10 flex items-center gap-4">
                  {isSaving ? "Syncing to Studio..." : "APPLY VISION & SEAL"}
                  {!isSaving && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
              </button>
            )}

            <p className="text-[9px] font-mono uppercase tracking-[1em] opacity-10">[ END OF PRODUCTION SCORE ]</p>
          </div>
        </div>
        
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
      </div>
    </div>
  );
};
