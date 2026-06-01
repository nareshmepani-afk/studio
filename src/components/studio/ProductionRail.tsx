'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Lock, 
  CheckCircle2, 
  Anchor, 
  PenTool, 
  Mic2, 
  Scissors, 
  Film,
  Layers,
  Radio,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ACT_TITLES } from './MemoryForm';

export interface Act {
  id: number;
  title: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

export const PRODUCTION_ACTS: Act[] = [
  { id: 0, title: 'The Inciting Memory', label: 'ACT I', description: 'Draft your narrative blueprint.', icon: Anchor },
  { id: 1, title: 'The Weave', label: 'ACT II', description: 'Deep-scripting and sensory tagging.', icon: Layers },
  { id: 2, title: 'Capture', label: 'ACT III', description: 'Vocal testimony and video recording.', icon: Radio },
  { id: 3, title: 'The Cut', label: 'ACT IV', description: 'Director\'s trimmings and final edits.', icon: Scissors },
  { id: 4, title: 'Premiere', label: 'ACT V', description: 'Cinematic showcase and archive.', icon: Film },
];

interface ProductionRailProps {
  currentStage: number;
  onStageChange: (stage: number) => void;
  isRetracted: boolean;
  onToggleRetract: () => void;
  modality: 'pen' | 'voice' | null;
  customWidth?: number;
  wordCount: number;
  mentorActive?: boolean;
  onToggleMentor?: (manual?: boolean) => void;
  isSaving?: boolean;
}

export const ProductionRail: React.FC<ProductionRailProps> = ({
  currentStage,
  onStageChange,
  isRetracted,
  onToggleRetract,
  modality,
  customWidth = 280,
  wordCount,
  mentorActive = false,
  onToggleMentor,
  isSaving = false
}) => {
  const [isFirstTimeAct2, setIsFirstTimeAct2] = React.useState(false);

  React.useEffect(() => {
    if (currentStage === 1) {
      const seen = localStorage.getItem('mw_mentor_act2_glow_seen');
      if (!seen) {
        setIsFirstTimeAct2(true);
      }
    } else {
      setIsFirstTimeAct2(false);
    }
  }, [currentStage]);

  const handleMentorClick = () => {
    if (currentStage === 1) {
      localStorage.setItem('mw_mentor_act2_glow_seen', 'true');
      setIsFirstTimeAct2(false);
    }
    onToggleMentor?.(true);
  };

  // Logic: "Soft-Locked" - Forward is locked until commit (simplified for now to currentStage)
  // Backward is always open.
  // Logic: "Tech Scout" Mode - All acts are clickable for "Peeking"
  // but acts beyond the current threshold will be guarded by a read-only UI in the stage.
  const isActAvailable = (id: number) => {
    // Acts are always available for peeking once in the studio
    return true; 
  };
  
  // Logic: Functional Unlock - Is the act fully functional (not a tech scout)?
  const isActFullyUnlocked = (id: number) => {
    if (id <= currentStage) return true;
    if (id === 1 && wordCount >= 150) return true; // Act II requires 150 words
    return false;
  };

  // Auto-hide completely during selection
  if (modality === null) return null;

  return (
    <div className="relative flex h-full z-[60]">
      {/* The Sidebar Body */}
      <motion.div
        initial={false}
        animate={{ 
          width: customWidth,
          opacity: 1, // Always visible (Icons)
          x: 0 // Always in frame
        }}
        className="h-full bg-slate-950 border-r border-white/5 flex flex-col overflow-hidden relative"
      >
        {/* Rail Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className={cn(
          "space-y-12 relative z-10 transition-all duration-500",
          customWidth <= 220 ? "p-4 flex flex-col items-center" : "p-8"
        )}>
          <div className="space-y-1">
            {customWidth > 220 && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.5em] whitespace-nowrap block"
                >
                  Production Rail
                </motion.span>
            )}
            {customWidth > 220 && (
              <motion.h2 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-xl font-headline text-white italic tracking-tight"
              >
                The Journey
              </motion.h2>
            )}
          </div>

          <div className="space-y-6">
            {PRODUCTION_ACTS.map((act, index) => {
              const active = currentStage === act.id;
              const available = isActAvailable(act.id) && !isSaving;
              const completed = act.id < currentStage;
              
              return (
                <div key={act.id} className="relative">
                  {/* Connector Line */}
                  {index !== PRODUCTION_ACTS.length - 1 && (
                    <div className="absolute left-[23.5px] top-10 bottom-[-24px] w-px bg-white/5">
                      <motion.div 
                        initial={false}
                        animate={{ height: completed ? '100%' : '0%' }}
                        className="w-full bg-emerald-500/30"
                      />
                    </div>
                  )}

                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => available && onStageChange(act.id)}
                          disabled={!available || isSaving}
                          className={cn(
                            "group flex items-start gap-4 text-left transition-all duration-300",
                            (!available || isSaving) && "opacity-30 cursor-not-allowed",
                            active && customWidth > 220 && "translate-x-2",
                            customWidth <= 220 ? "w-12 justify-center" : "w-full"
                          )}
                        >
                          <motion.div 
                            layoutId={act.id === 0 ? `modality-icon-${modality}` : undefined}
                            className={cn(
                              "relative z-10 w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-500 shrink-0",
                              active 
                                ? "bg-emerald-500 border-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                                : available 
                                  ? "bg-white/5 border-white/10 text-white/60 group-hover:border-emerald-500/50 group-hover:text-emerald-400" 
                                  : "bg-black/40 border-white/5 text-white/10"
                            )}
                          >
                            {completed ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              (() => {
                                if (act.id === 0) {
                                  if (modality === 'pen') return <PenTool className="w-6 h-6" />;
                                  if (modality === 'voice') return <Mic2 className="w-6 h-6" />;
                                  return <Anchor className="w-6 h-6" />;
                                }
                                return <act.icon className="w-6 h-6" />;
                              })()
                            )}
                          </motion.div>

                          {customWidth > 220 && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex flex-col pt-1 overflow-hidden"
                            >
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest leading-none mb-1 whitespace-nowrap",
                                active ? "text-emerald-400" : "text-white/70"
                              )}>
                                {act.label}
                              </span>
                              <span className={cn(
                                "text-sm font-bold tracking-tight transition-colors whitespace-nowrap",
                                active ? "text-white" : "text-white/90 group-hover:text-white"
                              )}>
                                {act.title}
                              </span>
                              {active && customWidth > 240 && (
                                <motion.p 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="text-[11px] text-white/30 font-medium leading-relaxed mt-2 pr-4 italic"
                                >
                                  {act.description}
                                </motion.p>
                              )}
                            </motion.div>
                          )}

                          {!isActFullyUnlocked(act.id) && !active && customWidth > 220 && (
                            <Lock className="w-2.5 h-2.5 text-white/5 ml-auto mt-1.5" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10} className="bg-slate-950 border-white/10 text-white p-3 rounded-xl shadow-2xl max-w-[200px] z-[1002]">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{act.title}</span>
                          <p className="text-[10px] text-white/50 leading-relaxed italic">{act.description}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}

            {/* Separator Line */}
            <div className="h-px bg-white/10 my-4" />

            {/* Mentor Toggle Button placed nearer to the Acts */}
            {customWidth > 220 ? (
              <div className="space-y-3">
                <button
                  onClick={handleMentorClick}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 group pointer-events-auto",
                    isFirstTimeAct2
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse"
                      : mentorActive 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-emerald-400 hover:border-emerald-500/30"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
                    isFirstTimeAct2
                      ? "bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-bounce"
                      : mentorActive ? "bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-white/5 text-white/40"
                  )}>
                    <Sparkles className={cn("w-4 h-4", (mentorActive || isFirstTimeAct2) && "animate-pulse")} />
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-left">Mentor Guide</span>
                    <span className="text-[8px] opacity-40 font-medium text-left">{mentorActive ? 'Retract Assistance' : 'Engage Lifeline'}</span>
                  </div>
                </button>
              </div>
            ) : (
              /* Compact Icon-Only Mentor Toggle for Narrow/Collapsed Sidebar */
              <div className="flex justify-center w-full">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleMentorClick}
                        className={cn(
                          "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-500 shrink-0 cursor-pointer pointer-events-auto",
                          isFirstTimeAct2
                            ? "bg-emerald-500 border-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse"
                            : mentorActive 
                              ? "bg-emerald-500 border-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                              : "bg-white/5 border-white/10 text-white/40 hover:border-emerald-500/50 hover:text-emerald-400"
                        )}
                      >
                        <Sparkles className={cn("w-5 h-5", (mentorActive || isFirstTimeAct2) && "animate-pulse")} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10} className="bg-slate-950 border-white/10 text-white p-3 rounded-xl shadow-2xl z-[1002]">
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Mentor Guide</span>
                        <p className="text-[10px] text-white/50 leading-relaxed italic">{mentorActive ? 'Retract Assistance' : 'Engage Lifeline'}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        {customWidth > 220 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-auto p-8 border-t border-white/5 space-y-3 bg-black/40 w-full shrink-0"
          >
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Protocol: Ready</span>
            </div>
          </motion.div>
        ) : (
          /* Compact Protocol indicator for narrow/collapsed sidebar */
          <div className="mt-auto p-4 border-t border-white/5 flex flex-col items-center justify-center bg-black/40 w-full shrink-0">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Protocol: Ready" />
          </div>
        )}
      </motion.div>

      {/* Retract Toggle Button */}
      <div className="h-full flex items-center relative group">
        {/* Subtle Edge Glow Cue */}
        {isRetracted && (
          <div className="absolute left-0 w-1 h-32 bg-emerald-500/20 blur-md rounded-full -translate-x-1/2" />
        )}
        
        <button
          onClick={onToggleRetract}
          className={cn(
            "z-20 w-8 h-16 bg-slate-950 border border-l-0 border-white/10 flex items-center justify-center rounded-r-xl transition-all hover:bg-slate-900 group-hover:border-emerald-500/30 shadow-[4px_0_15px_rgba(0,0,0,0.3)]",
            isRetracted ? "opacity-40 hover:opacity-100" : "opacity-100"
          )}
        >
          {isRetracted ? (
            <ChevronRight className="w-4 h-4 text-emerald-500/60 group-hover:text-emerald-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white/20 group-hover:text-white/60" />
          )}
        </button>
      </div>

      {/* ACT CAPTURE Specific Overlay to trigger hide in parent if needed */}
    </div>
  );
};
