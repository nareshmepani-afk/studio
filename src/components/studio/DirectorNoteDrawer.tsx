'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Plus, 
  PenTool, 
  Mic, 
  Wand2, 
  Loader2, 
  Zap, 
  Target, 
  Activity,
  MessageSquare,
  Volume2,
  Music,
  ShieldCheck,
  AlertCircle,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScriptBlock } from '@/types';
import { analyzeCompositionAnchors, proofreadScript } from '@/actions/aiWeaver';
import { CatalystLink } from './overlays/CatalystLink';
import { TimelineMiniMap } from './navigation/TimelineMiniMap';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { toast } from 'sonner';

interface DirectorNoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  modality: 'pen' | 'voice' | null;
  onPolish: () => void;
  isPolishing: boolean;
  wordCount: number;
  scriptBlocks?: ScriptBlock[];
}

interface CatalystSuggestion {
  blockId: string;
  type: 'aroma' | 'soundscape' | 'visual' | 'polish';
  value: string;
  reasoning: string;
}

export const DirectorNoteDrawer: React.FC<DirectorNoteDrawerProps> = ({
  isOpen,
  onClose,
  modality,
  onPolish,
  isPolishing,
  wordCount,
  scriptBlocks = []
}) => {
  const isScribe = modality === 'pen';
  const { directorialNote, dispatcher, actions: globalActions } = useStudioState();
  
  const [catalystSuggestions, setCatalystSuggestions] = useState<CatalystSuggestion[]>([]);
  const [clarityAlerts, setClarityAlerts] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false);

  useEffect(() => {
    // Automatically trigger analysis when the drawer is opened and we have blocks
    if (isOpen && scriptBlocks.length > 0 && catalystSuggestions.length === 0) {
      handleAnalyze();
    }
  }, [isOpen, scriptBlocks.length]);

  const handleAnalyze = async () => {
    if (scriptBlocks.length === 0) return;
    setIsAnalyzing(true);
    try {
      const suggestions = await analyzeCompositionAnchors(scriptBlocks);
      setCatalystSuggestions(suggestions);
    } catch (error) {
      console.error("Failed to analyze composition anchors:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProofread = async () => {
    if (scriptBlocks.length === 0) return;
    setIsProofreading(true);
    try {
      const alerts = await proofreadScript(scriptBlocks);
      setClarityAlerts(alerts);
      if (alerts.length === 0) {
        toast.success("Scene is Crystal Clear", {
          description: "No AI clichés or grammar issues detected."
        });
      }
    } catch (error) {
      toast.error("Clarity Check Failed");
    } finally {
      setIsProofreading(false);
    }
  };

  const typeHeaders = {
    polish: { title: "// PROSE CRITIQUE", desc: "Analyzes syntax and sensory weight." },
    aroma: { title: "// ATMOSPHERIC PROBE (AROMA)", desc: "Detects environmental anchors." },
    soundscape: { title: "// ATMOSPHERIC PROBE (SOUND)", desc: "Detects acoustic elements." },
    visual: { title: "// VISUAL DEEPENING", desc: "Suggests lighting or visual cues." },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>


          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full lg:w-[450px] z-[1000] flex flex-col shadow-[-20px_0_100px_rgba(0,0,0,0.8)] bg-slate-950/95 backdrop-blur-2xl border-l border-emerald-400/20"
          >
            {/* Drawer Edge Glow */}
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-emerald-400/40 to-transparent" />

            {/* Header: The Auteur Badge */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  isScribe ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/10 text-amber-400"
                )}>
                  {isScribe ? <PenTool className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-headline text-white italic">Director's Note</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">
                      Director: Active
                    </span>
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                      {isScribe ? 'Precision Tip Pen' : 'Vocal Capture'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all group cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Content: Space Mono Feedback */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar font-mono">
              
              {/* THE DIRECTOR'S GUIDE: Directorial Whispers */}
              {directorialNote && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <MessageSquare className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Directorial Prompt</h4>
                  <p className="text-sm text-white/70 leading-relaxed italic pr-8">
                    "{directorialNote}"
                  </p>
                </motion.div>
              )}

              {/* Momentum Status */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Narrative Momentum</h3>
                  <span className="text-[10px] font-bold text-emerald-400">{wordCount}/150 words</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((wordCount / 150) * 100, 100)}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>

              {/* Consultation Sections: Timeline Mini-map */}
              <div className="space-y-6">
                <TimelineMiniMap blocks={scriptBlocks} suggestions={catalystSuggestions} />
                
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-5">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Cinematic Integrity HUD</h4>
                     <Sparkles className="w-3 h-3 text-emerald-500/50" />
                   </div>
                   
                   <div className="space-y-4">
                     {/* Checklist Item 1: Foundations */}
                     <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          wordCount > 10 ? "bg-emerald-500/20 border-emerald-500/50" : "border-white/10"
                        )}>
                          {wordCount > 10 && <Zap className="w-2.5 h-2.5 text-emerald-400" />}
                        </div>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider",
                          wordCount > 10 ? "text-white/80" : "text-white/20"
                        )}>Scene Foundations established</span>
                     </div>

                     {/* Checklist Item 2: Sensory Density */}
                     <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          wordCount >= 25 ? "bg-amber-500/20 border-amber-500/50" : "border-white/10"
                        )}>
                          {wordCount >= 25 && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
                        </div>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider",
                          wordCount >= 25 ? "text-white/80" : "text-white/20"
                        )}>First Sensory Catalyst Earned (25w)</span>
                     </div>

                     {/* Checklist Item 3: Narrative Clarity */}
                     <div className="flex items-center gap-3 group/item">
                        <div className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-500",
                          wordCount >= 100 ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/10 text-white/20"
                        )}>
                          {wordCount >= 100 ? <Check className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest transition-colors",
                          wordCount >= 100 ? "text-white" : "text-white/20"
                        )}>Deep Narrative Clarity (100w)</span>
                     </div>
                   </div>

                   {catalystSuggestions.length === 0 && !isAnalyzing && (
                        <p className="text-[9px] text-white/40 italic leading-relaxed pt-2 border-t border-white/5">
                        The Director awaits more prose to generate structural anchors.
                      </p>
                   )}
                </div>
                {catalystSuggestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Directorial Refinements</h3>
                    <div className="space-y-3">
                      {catalystSuggestions.map((suggestion, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[8px] font-black px-2 py-0.5 rounded-full border",
                                  suggestion.type === 'aroma' ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                                  suggestion.type === 'soundscape' ? "bg-sky-500/10 border-sky-500/30 text-sky-400" :
                                  suggestion.type === 'visual' ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                                  "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                )}>
                                  {suggestion.type.toUpperCase()}
                                </span>
                                <span className="text-xs font-bold text-white/90">"{suggestion.value}"</span>
                              </div>
                              <p className="text-[10px] text-white/40 leading-relaxed italic">
                                {suggestion.reasoning}
                              </p>
                            </div>
                            <button 
                              onClick={() => {
                                dispatcher?.addCatalyst?.(suggestion.blockId, suggestion.type, suggestion.value);
                                // Remove suggestion after apply
                                setCatalystSuggestions(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {clarityAlerts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Scribe's Clarity Alerts</h3>
                    <div className="space-y-3">
                      {clarityAlerts.map((alert, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-3 h-3 text-red-400" />
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{alert.reason}</span>
                              </div>
                              <p className="text-xs text-white/90">
                                <span className="line-through text-white/20 mr-2">{alert.original}</span>
                                <span className="text-emerald-400">{alert.corrected}</span>
                              </p>
                            </div>
                            <button 
                              onClick={() => {
                                dispatcher?.addCatalyst?.(alert.blockId, 'polish', alert.corrected);
                                setClarityAlerts(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* THE FIELD GUIDE: Decoding the Cinematic Ink */}
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Scribe's Field Guide</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[9px] text-white/60 uppercase tracking-wider font-bold">Visual Anchor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      <span className="text-[9px] text-white/60 uppercase tracking-wider font-bold">Aroma Anchor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                      <span className="text-[9px] text-white/60 uppercase tracking-wider font-bold">Soundscape Anchor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      <span className="text-[9px] text-white/60 uppercase tracking-wider font-bold">Clarity Alert</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-white/30 leading-relaxed italic border-t border-white/5 pt-3">
                    The Director highlights these "Soul-Anchors" to help you build a sensory-rich cinematic memory.
                  </p>
                </div>
              </div>

              {(isPolishing || isAnalyzing || isProofreading) && (
                <div className="pt-4 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-emerald-300 animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                    {isPolishing ? "Narrative Architect is infusing details..." : isProofreading ? "Scribe is polishing the ink..." : "Director is analyzing the soul-print..."}
                  </p>
                </div>
              )}
            </div>

        {/* Footer Action: The Refresh */}
        <div className="p-8 bg-black/40 border-t border-white/5 backdrop-blur-md flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || isProofreading || scriptBlocks.length === 0}
                    className={cn(
                      "py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border cursor-pointer active:scale-95",
                      isAnalyzing 
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-400" 
                        : "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border-sky-400/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                    )}
                  >
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                    ANALYSE
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 border-white/10 text-[10px] font-black tracking-widest uppercase py-2 px-3 mb-2 max-w-[200px] text-center">
                  Ask the AI to find descriptive details and patterns in your writing.
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleProofread}
                    disabled={isAnalyzing || isProofreading || scriptBlocks.length === 0}
                    className={cn(
                      "py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border cursor-pointer active:scale-95",
                      isProofreading 
                        ? "bg-red-500/10 border-red-500/30 text-red-400" 
                        : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-400/50 hover:shadow-[0_0_20px_rgba(248,113,113,0.2)]"
                    )}
                  >
                    {isProofreading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                    CLARITY
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 border-white/10 text-[10px] font-black tracking-widest uppercase py-2 px-3 mb-2 max-w-[200px] text-center">
                  Check your story for clichés, grammar mistakes, and distracting details. (Red shows where you need to focus on clarity).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onPolish}
                  disabled={isPolishing}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] border cursor-pointer active:scale-95",
                    isPolishing 
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
                      : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 border-emerald-400/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                  )}
                >
                  {isPolishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  REFRESH AI POLISH
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900 border-white/10 text-[10px] font-black tracking-widest uppercase py-2 px-3 mb-2 max-w-[300px] text-center">
                Let the AI help you sharpen your story so it feels more powerful and visual.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

