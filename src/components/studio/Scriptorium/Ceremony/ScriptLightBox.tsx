import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCopy, ClipboardCheck, X, Sparkles, 
  Clock, FileText, ArrowRight, Eye, Video, Volume2, Heart,
  Loader2, Pencil, RotateCcw, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StageDirection, BeatSheetItem } from '@/types';
import { checkAndPolishGrammar } from '@/actions/aiWeaver';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

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
  onApply: (customScript?: string) => void;
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
  const [userScript, setUserScript] = useState(cleanScript);
  const [isEditing, setIsEditing] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);

  useEffect(() => {
    setUserScript(cleanScript);
    setIsEditing(false);
  }, [cleanScript, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const handleCheckGrammar = async () => {
    setIsCheckingGrammar(true);
    toast("Proofreading Script...", {
      description: "Checking spelling, grammar, and agreement while preserving your voice.",
      icon: <Sparkles className="w-4 h-4 text-sky-400" />
    });
    try {
      const polished = await checkAndPolishGrammar(userScript);
      if (polished && polished !== userScript) {
        setUserScript(polished);
        toast.success("Spelling & Grammar Polished!", {
          description: "Typos and agreement errors corrected."
        });
      } else {
        toast.success("Script Clean & Performance Ready", {
          description: "No spelling or grammar errors detected."
        });
      }
    } catch (e) {
      toast.error("Grammar Check Skipped", { description: "Unable to run AI proofreader right now." });
    } finally {
      setIsCheckingGrammar(false);
    }
  };
  const isEdited = userScript.trim() !== cleanScript.trim();
  const wordCount = userScript.trim().split(/\s+/).filter(Boolean).length;
  const estDuration = Math.ceil(wordCount / 130); // Approx 130 wpm for dramatic pacing

  if (typeof window === 'undefined') return null;

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
                  {/* Copy & Edit Action Bar */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <TooltipProvider>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={() => setIsEditing(prev => !prev)}
                              title={isEditing ? "Exit direct editing mode" : "Manually edit and fine-tune your prose text"}
                              className={cn(
                                "flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border shadow-lg cursor-pointer",
                                isEditing 
                                  ? "bg-purple-500 text-white border-purple-400 shadow-purple-500/20" 
                                  : "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300"
                              )}
                            >
                              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                              <span>{isEditing ? "Done Editing" : "Fine-Tune Script"}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-slate-900 border border-white/10 text-[10px] font-bold uppercase tracking-widest px-3 py-2 text-purple-200">
                            <span>{isEditing ? "Click to finish and exit text editing mode" : "Click to manually edit and fine-tune your narrative script"}</span>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={handleCheckGrammar}
                              disabled={isCheckingGrammar}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-[9px] font-black uppercase tracking-widest shadow-lg cursor-pointer",
                                isCheckingGrammar 
                                  ? "bg-sky-500/20 border-sky-500/40 text-sky-300 cursor-wait" 
                                  : "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300"
                              )}
                              title="Check spelling and grammar using AI proofreader"
                            >
                              {isCheckingGrammar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-sky-400" />}
                              <span>{isCheckingGrammar ? "Checking..." : "Grammar & Polish"}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-slate-900 border border-white/10 text-[10px] font-bold uppercase tracking-widest px-3 py-2 text-sky-200">
                            <span>Proofread spelling, grammar, and UK English compliance using AI</span>
                          </TooltipContent>
                        </Tooltip>

                        {isEdited && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={() => {
                                  setUserScript(cleanScript);
                                  toast.info("Reverted to Original Take");
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 rounded-2xl transition-all text-[9px] font-black uppercase tracking-widest"
                                title="Reset to AI generated draft"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Draft</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 border border-white/10 text-[10px] font-bold uppercase tracking-widest px-3 py-2 text-white/70">
                              <span>Discard manual edits and restore original AI generated vision</span>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {isEdited && (
                          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-black uppercase tracking-widest rounded-full animate-fade-in">
                            ✏️ Custom Tuned
                          </div>
                        )}
                      </div>
                    </TooltipProvider>

                    <button 
                      onClick={() => handleCopy(userScript, false)}
                      className="flex items-center gap-3 px-6 py-2.5 bg-white/5 hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 rounded-2xl transition-all group"
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest">Copy Clean Script</span>
                      {copiedExpanded ? <ClipboardCheck className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4 opacity-40 group-hover:opacity-100" />}
                    </button>
                  </div>

                  <div className="space-y-12">
                    <div className="text-center flex items-center justify-center gap-8">
                       <div className="h-px w-28 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                       <p className="font-mono text-[10px] font-black uppercase tracking-[0.5em] text-amber-300/90 whitespace-nowrap drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">Scene I: The Vision</p>
                       <div className="h-px w-28 bg-gradient-to-l from-transparent via-amber-400/40 to-transparent" />
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={userScript}
                          onChange={(e) => setUserScript(e.target.value)}
                          spellCheck={true}
                          autoCorrect="on"
                          className="w-full min-h-[360px] bg-slate-900/90 border border-purple-500/40 focus:border-purple-400 rounded-3xl p-8 text-white font-serif text-[22px] lg:text-[28px] leading-[1.8] focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-y shadow-2xl transition-all"
                          placeholder="Fine-tune your narrative prose..."
                          autoFocus
                        />
                        <p className="text-[10px] font-mono text-white/30 text-right">
                          Direct editing mode active • Click "Grammar & Polish" to proofread, or "Choose This Vision" to apply.
                        </p>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setIsEditing(true)}
                        title="Click to edit or fine-tune script text"
                        className="font-serif text-[26px] lg:text-[34px] text-white/95 leading-[1.8] whitespace-pre-wrap select-text drop-shadow-2xl cursor-pointer hover:text-purple-100 transition-colors group relative rounded-3xl p-4 -m-4 border border-transparent hover:border-purple-500/20 hover:bg-purple-500/5"
                      >
                        {userScript}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-[9px] font-mono text-purple-300 bg-purple-950/80 border border-purple-500/30 px-3 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-lg">
                          <Pencil className="w-3 h-3 text-purple-400" />
                          <span>Click to Edit Text</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-24 text-center opacity-30">
                      <p className="font-mono text-[9px] uppercase tracking-[1em] text-white/60">[ END OF NORTH STAR SCORE ]</p>
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
                onClick={() => !isSaving && onApply(userScript)}
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
