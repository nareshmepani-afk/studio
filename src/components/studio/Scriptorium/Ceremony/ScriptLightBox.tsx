import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCopy, ClipboardCheck, X, Sparkles, 
  Clock, FileText, ArrowRight, Eye, Video, Volume2, Heart,
  Loader2, Pencil, RotateCcw, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StageDirection, BeatSheetItem } from '@/types';
import { checkAndPolishGrammar } from '@/actions/aiWeaver';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { stripScreenplayCues } from '@/lib/sanitizer';

interface ScriptLightBoxProps {
  isOpen: boolean;
  onClose: (updatedScript?: string) => void;
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
  allDrafts?: any[];
  currentIndex?: number;
  onNavigateVision?: (newIndex: number, updatedScript?: string) => void;
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
  isSaving = false,
  allDrafts = [],
  currentIndex = 0,
  onNavigateVision
}) => {
  const sanitizedCleanScript = stripScreenplayCues(cleanScript || '');
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedExpanded, setCopiedExpanded] = useState(false);
  const [userScript, setUserScript] = useState(sanitizedCleanScript);
  const [isEditing, setIsEditing] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const teleprompterRef = useRef<HTMLDivElement>(null);

  const totalVisions = allDrafts.length || 5;
  const activeIndex = currentIndex;

  useEffect(() => {
    setUserScript(stripScreenplayCues(cleanScript || ''));
    setIsEditing(false);
    if (teleprompterRef.current) {
      teleprompterRef.current.scrollTop = 0;
    }
  }, [cleanScript, isOpen, activeIndex]);

  const handleCloseWithSave = () => {
    const isEdited = userScript.trim() !== cleanScript.trim();
    if (isEdited) {
      toast.success("Draft Edits Preserved", {
        description: "Your custom script updates have been saved to the Selection Deck."
      });
      onClose(userScript);
    } else {
      onClose();
    }
  };

  const handlePrevVision = () => {
    if (!onNavigateVision || totalVisions <= 1) return;
    const newIndex = (activeIndex - 1 + totalVisions) % totalVisions;
    const isEdited = userScript.trim() !== cleanScript.trim();
    onNavigateVision(newIndex, isEdited ? userScript : undefined);
  };

  const handleNextVision = () => {
    if (!onNavigateVision || totalVisions <= 1) return;
    const newIndex = (activeIndex + 1) % totalVisions;
    const isEdited = userScript.trim() !== cleanScript.trim();
    onNavigateVision(newIndex, isEdited ? userScript : undefined);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInputFocused = targetTag === 'INPUT' || targetTag === 'TEXTAREA';

      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        handleCloseWithSave();
      } else if (!isEditing && !isInputFocused) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevVision();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextVision();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, userScript, cleanScript, activeIndex, totalVisions, isEditing, onNavigateVision]);

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
    } catch (e: any) {
      console.error("[ScriptLightBox] handleCheckGrammar error:", e);
      const isActionMismatch = e?.message?.includes("Server Action") || e?.message?.includes("deployment") || String(e).includes("Server Action");
      if (isActionMismatch) {
        toast.error("New Deployment Active", { 
          description: "A new deployment was completed. Please refresh your browser tab to sync with the latest build." 
        });
      } else {
        toast.error("Grammar Check Skipped", { description: "Unable to run AI proofreader right now." });
      }
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const wordCount = userScript.trim().split(/\s+/).filter(Boolean).length;
  const estDuration = Math.ceil(wordCount / 130); 

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 lg:p-12 bg-slate-950/95 backdrop-blur-3xl"
          onClick={() => handleCloseWithSave()}
        >
          {totalVisions > 1 && (
            <>
              <button
                data-hotspot-id="HS_ACT2_LIGHTBOX_PREV_BTN"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevVision();
                }}
                title="Previous Vision (← Arrow Key)"
                className="absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 p-3.5 lg:p-4 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-full text-white/60 hover:text-white transition-all z-[10060] cursor-pointer shadow-2xl backdrop-blur-xl hover:scale-110 active:scale-95 group pointer-events-auto"
                aria-label="Previous Vision"
              >
                <ChevronLeft className="w-6 h-6 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <button
                data-hotspot-id="HS_ACT2_LIGHTBOX_NEXT_BTN"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextVision();
                }}
                title="Next Vision (→ Arrow Key)"
                className="absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 p-3.5 lg:p-4 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-full text-white/60 hover:text-white transition-all z-[10060] cursor-pointer shadow-2xl backdrop-blur-xl hover:scale-110 active:scale-95 group pointer-events-auto"
                aria-label="Next Vision"
              >
                <ChevronRight className="w-6 h-6 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}

          <motion.div
            initial={{ y: 50, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 50, scale: 0.98, opacity: 0 }}
            className="w-full max-w-[100vw] lg:max-w-7xl h-full max-h-[95vh] bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_150px_rgba(0,0,0,0.9)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                console.log("[ScriptLightBox] X clicked");
                handleCloseWithSave();
              }}
              className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all z-[10050] cursor-pointer pointer-events-auto"
              aria-label="Close Review"
            >
              <X className="w-6 h-6 pointer-events-none" />
            </button>

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
                <p className="text-xs text-emerald-300/90 font-medium italic font-serif mt-1 hidden lg:block">"{visionFocus}"</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-mono font-black text-emerald-400 tracking-widest">
                  <span>[ {String(activeIndex + 1).padStart(2, '0')} / {String(totalVisions).padStart(2, '0')} ]</span>
                </div>

                <div className="flex items-center gap-8 px-6 py-2 bg-black/40 rounded-2xl border border-white/5 mr-12">
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
            </div>

            {/* --- DUAL PANE READING DESK --- */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Pane: The Director's Sidebar (32%) */}
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
                            <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                              {dir.type} Anchor
                            </span>
                            <p className="text-[11px] text-white/70 italic font-serif">
                              "{dir.content || (dir as any).instruction || ''}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Pane: Teleprompter (68%) */}
              <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden relative">
                {/* Teleprompter Action Bar */}
                <div className="flex-none p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        isEditing 
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <Pencil className="w-3.5 h-3.5 text-purple-400" />
                      <span>{isEditing ? "Editing Mode Active" : "Fine-Tune Script"}</span>
                    </button>

                    <button
                      onClick={handleCheckGrammar}
                      disabled={isCheckingGrammar}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        isCheckingGrammar 
                          ? "bg-sky-500/20 border-sky-500/50 text-sky-300 cursor-wait"
                          : "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
                      )}
                    >
                      {isCheckingGrammar ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Proofreading...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Grammar & Polish</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button 
                    onClick={() => handleCopy(userScript, false)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono font-bold text-white/40 hover:text-white transition-all"
                  >
                    {copiedExpanded ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                    <span>{copiedExpanded ? "COPIED TO CLIPBOARD" : "COPY CLEAN SCRIPT"}</span>
                  </button>
                </div>

                {/* Teleprompter Text Display */}
                <div ref={teleprompterRef} className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-16">
                  <div className="max-w-3xl mx-auto space-y-12">
                    <div className="text-[10px] font-mono font-bold text-amber-500/40 uppercase tracking-[0.4em] text-center border-b border-white/5 pb-6">
                      SCENE I : THE VISION
                    </div>

                    {isEditing ? (
                      <div className="space-y-4">
                        <textarea
                          value={userScript}
                          onChange={(e) => setUserScript(e.target.value)}
                          className="w-full min-h-[50vh] bg-slate-900/60 border border-purple-500/30 rounded-3xl p-8 font-serif text-[24px] lg:text-[30px] text-white leading-[1.8] focus:outline-none focus:border-purple-500/60 transition-all custom-scrollbar resize-none shadow-inner"
                          placeholder="Edit your screenplay text here..."
                        />
                        <div className="flex justify-between items-center px-4 text-[10px] font-mono text-white/30">
                          <span>Manual Teleprompter Fine-Tuning Active</span>
                          <button 
                            onClick={() => setUserScript(sanitizedCleanScript)}
                            className="text-amber-400/60 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset to Original</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setIsEditing(true)}
                        title="Click to edit or fine-tune script text"
                        className="font-serif text-[26px] lg:text-[34px] text-white/95 leading-[1.8] whitespace-pre-wrap select-text cursor-pointer hover:text-purple-100 transition-colors p-4 -m-4 border border-transparent hover:border-purple-500/20 hover:bg-purple-500/5 rounded-3xl"
                      >
                        {stripScreenplayCues(userScript || '')}
                      </div>
                    )}

                    <div className="pt-24 pb-8 text-center flex items-center justify-center gap-4">
                      <div className="h-px w-12 bg-emerald-500/30" />
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-400/80 drop-shadow-sm">[ END OF NORTH STAR SCORE ]</p>
                      <div className="h-px w-12 bg-emerald-500/30" />
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
                  handleCloseWithSave();
                }}
                className="group flex items-center gap-3 text-[10px] font-black text-white/30 hover:text-white uppercase tracking-[0.2em] transition-all"
              >
                <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </div>
                Return to Selection Deck
              </button>

              <button 
                data-hotspot-id="HS_ACT2_LIGHTBOX_CHOOSE_BTN"
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
