import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCopy, ClipboardCheck, X, Sparkles, 
  Clock, FileText, ArrowRight, Eye, Video, Volume2, Heart,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StageDirection, BeatSheetItem } from '@/types';

interface ScriptLightBoxProps {
  isOpen: boolean;
  onClose: () => void;
  originalHook: string;
  originalHookLabel?: string;
  cleanScript: string;
  visionLabel: string;
  visionFocus: string;
  stageDirections?: StageDirection[];
  beatSheet?: string[];
  generatedSoundtrackUrl?: string;
  onApply: () => void;
  isSaving?: boolean;
}

export const ScriptLightBox: React.FC<ScriptLightBoxProps> = ({
  isOpen,
  onClose,
  originalHook,
  originalHookLabel,
  cleanScript,
  visionLabel,
  visionFocus,
  stageDirections = [],
  beatSheet = [],
  generatedSoundtrackUrl,
  onApply,
  isSaving = false
}) => {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedExpanded, setCopiedExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleCopy = async (text: string, isOriginal: boolean) => {
    await navigator.clipboard.writeText(text);
    if (isOriginal) {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedExpanded(true);
      setTimeout(() => setCopiedExpanded(false), 2000);
    }
    toast.success("Script Captured", {
      description: "Vision copied to directorial clipboard.",
    });
  };

  const wordCount = cleanScript.trim().split(/\s+/).length;
  const estDuration = Math.ceil(wordCount / 130); // Approx 130 wpm for dramatic pacing

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 lg:p-12 bg-slate-950/95 backdrop-blur-3xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 50, scale: 0.98, opacity: 0 }}
            className="w-full max-w-[100vw] lg:max-w-7xl h-full max-h-[95vh] bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_150px_rgba(0,0,0,0.9)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Moved inside relative container for better alignment or can stay outside with higher Z */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                console.log("[ScriptLightBox] X clicked");
                onClose();
              }}
              className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all z-[10050] cursor-pointer pointer-events-auto"
              aria-label="Close Review"
            >
              <X className="w-6 h-6 pointer-events-none" />
            </button>

            {/* --- PRODUCTION SLATE HEADER --- */}
            <div className="flex-none p-6 lg:px-12 border-b border-white/5 bg-slate-900/40 flex items-center justify-between z-20">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.4em]">Directorial Review</span>
                  </div>
                  <h2 className="text-2xl font-serif italic text-white/90">
                    {visionLabel}
                  </h2>
                </div>
                <div className="h-8 w-px bg-white/10 mx-2" />
                <p className="text-[11px] text-white/30 italic font-serif mt-1 hidden lg:block">"{visionFocus}"</p>
              </div>

              <div className="flex items-center gap-8 px-6 py-2 bg-black/40 rounded-2xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Duration</span>
                  <div className="flex items-center gap-2 text-sky-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono font-bold">~{estDuration}:00</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Scale</span>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono font-bold">{wordCount} words</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- DUAL PANE READING DESK --- */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Pane: The Director's Sidebar (30%) */}
              <div className="hidden lg:flex w-[32%] bg-slate-900/50 border-r border-white/5 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                  {/* 1. Original Spark */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">{originalHookLabel || "Original Spark"}</span>
                      <button 
                        onClick={() => handleCopy(originalHook, true)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/20 hover:text-white transition-all"
                      >
                        {copiedOriginal ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[12px] text-white/50 leading-relaxed italic font-serif border-l-2 border-white/5 pl-4">
                      "{originalHook}"
                    </p>
                  </div>

                  {/* 2. Beat Sheet (Emotional Arc) */}
                  {beatSheet.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-px bg-sky-500/30" />
                        <span className="text-[9px] font-black text-sky-400/60 uppercase tracking-[0.4em]">Emotional Arc</span>
                      </div>
                      <div className="space-y-4">
                        {beatSheet.map((b, i) => (
                          <div key={i} className="flex items-start gap-4 group/beat">
                            <div className="flex-none w-1 h-1 rounded-full bg-sky-500/40 mt-1.5 group-hover/beat:bg-sky-400 transition-colors" />
                            <p className="text-[11px] text-white/40 leading-relaxed font-serif group-hover/beat:text-white/60 transition-colors">
                              {b}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Stage Directions (Visual/Audio Cues) */}
                  {stageDirections.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-px bg-emerald-500/30" />
                        <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-[0.4em]">Production Cues</span>
                      </div>
                      <div className="space-y-4">
                        {stageDirections.map((dir, i) => (
                          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 hover:bg-white/10 transition-all cursor-default">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {dir.type === 'visual' && <Video className="w-3 h-3 text-emerald-400/60" />}
                                {dir.type === 'audio' && <Volume2 className="w-3 h-3 text-sky-400/60" />}
                                {dir.type === 'beat' && <Heart className="w-3 h-3 text-rose-400/60" />}
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{dir.type}</span>
                              </div>
                              <span className="text-[9px] font-mono text-white/20">{dir.timecode}</span>
                            </div>
                            <p className="text-[11px] text-white/60 leading-relaxed">{dir.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Pane: Clean Script (70%) */}
              <div className="flex-1 bg-[#0f1115] overflow-y-auto custom-scrollbar relative flex flex-col items-center">
                <div className="w-full max-w-4xl px-12 lg:px-24 py-20 space-y-16">
                  {/* Copy Facility */}
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleCopy(cleanScript, false)}
                      className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 rounded-2xl transition-all group"
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest">Copy Clean Script</span>
                      {copiedExpanded ? <ClipboardCheck className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4 opacity-40 group-hover:opacity-100" />}
                    </button>
                  </div>

                  <div className="space-y-12">
                    <div className="text-center opacity-10 flex items-center justify-center gap-8">
                       <div className="h-px w-24 bg-gradient-to-r from-transparent to-white" />
                       <p className="font-mono text-[9px] uppercase tracking-[0.6em] whitespace-nowrap">Scene I: The Vision</p>
                       <div className="h-px w-24 bg-gradient-to-l from-transparent to-white" />
                    </div>

                    <div className="font-serif text-[26px] lg:text-[34px] text-white/95 leading-[1.8] whitespace-pre-wrap select-text drop-shadow-2xl">
                      {cleanScript}
                    </div>

                    <div className="pt-32 text-center opacity-5">
                      <p className="font-mono text-[9px] uppercase tracking-[1em]">[ END OF NORTH STAR SCORE ]</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- ACTION FOOTER --- */}
            <div className="flex-none p-8 lg:px-12 border-t border-white/5 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between z-20">
              <button 
                onClick={() => {
                  console.log("[ScriptLightBox] Return clicked");
                  onClose();
                }}
                className="group flex items-center gap-3 text-[10px] font-black text-white/30 hover:text-white uppercase tracking-[0.2em] transition-all"
              >
                <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </div>
                Return to Selection Deck
              </button>

              <button 
                data-hotspot-id="HS_ACT2_COMMIT_PROSE_BTN"
                onClick={() => !isSaving && onApply()}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-6 px-12 py-5 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-2xl group overflow-hidden relative",
                  isSaving 
                    ? "bg-emerald-500/20 text-emerald-400 cursor-wait border border-emerald-500/30" 
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                )}
              >
                {!isSaving && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />}
                <span className="relative z-10 flex items-center gap-4">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preparing Review Area...
                    </>
                  ) : (
                    <>
                      CHOOSE THIS VISION
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
