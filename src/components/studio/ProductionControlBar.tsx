'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MentorshipHotspot } from './MentorshipHotspot';
import { Video, Disc, Square, AlertTriangle, UploadCloud, CheckCircle2, Scissors, Play, Pause, Camera, Loader2, Mic2, MessageSquare, Volume2, Sparkles, UserCircle, Languages, Layout, Zap, Settings2, RefreshCw, CheckCircle, Rocket, Circle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useStudioState } from '@/hooks/studio/useStudioState';
import { toast } from 'sonner';

interface ProductionControlBarProps {
  currentStage: number;
  isComplete: boolean;
  onNext: () => void;
  onPrev: () => void;
  onPublish?: () => void;
  charge?: number;
  wordCount?: number;
  isDocked?: boolean;
}

const SynapsePulse = ({ type }: { type: string }) => {
  const color = type === 'aroma' ? '#fbbf24' : type === 'soundscape' ? '#38bdf8' : '#10b981';
  
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: -100, x: 0 }}
      animate={{ 
        scale: [0.5, 1.2, 1],
        opacity: [0, 1, 0],
        y: [0, 50, 100], // Travel down towards the meter
        filter: ['blur(0px)', 'blur(4px)', 'blur(0px)']
      }}
      transition={{ duration: 1.2, ease: "circOut" }}
      className="absolute pointer-events-none z-[1000]"
      style={{ top: '-150px', left: '50%' }}
    >
      <div 
        className="w-1 h-12 rounded-full" 
        style={{ 
          background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
          boxShadow: `0 0 20px ${color}` 
        }} 
      />
    </motion.div>
  );
};

export const ProductionControlBar: React.FC<ProductionControlBarProps> = ({
  currentStage,
  isComplete,
  onNext,
  onPrev,
  onPublish,
  charge = 0,
  wordCount = 0,
  isDocked = false
}) => {
  const { detectedAnchors, draggingCatalyst, actions, lastDetectedAnchor } = useStudioState();
  const [lastClickTime, setLastClickTime] = React.useState(0);
  
  const steps = [
    { label: 'Hook', act: 'ACT I' },
    { label: 'Weave', act: 'ACT II' },
    { label: 'Capture', act: 'ACT III' },
    { label: 'Cut', act: 'ACT IV' },
    { label: 'Premiere', act: 'ACT V' }
  ];

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  };

  const isLowClarity = currentStage === 0 && charge < 15;

  const handleNextClick = () => {
    if (isLowClarity) {
      const now = Date.now();
      if (now - lastClickTime < 500) {
        // Double click override
        toast.success("MECHANICAL UNLATCH: Entry Forced", {
          description: "// OVERRIDE. The weave will proceed with raw silk.",
          icon: <Rocket className="w-4 h-4" />
        });
        onNext();
      } else {
        toast.warning("// LOW CLARITY", {
          description: "The weave requires more raw silk (15% required).",
          icon: <AlertCircle className="w-4 h-4" />
        });
      }
      setLastClickTime(now);
      return;
    }

    if (currentStage === 4 && onPublish) {
      onPublish();
    } else {
      onNext();
    }
  };

  const getIncompleteReason = () => {
    switch (currentStage) {
      case 0: return isLowClarity ? "Scene Clarity below 15% threshold." : "Title, Description, and Year are mandatory catalysts.";
      case 1: return "The weave requires at least 150 words of cinematic prose.";
      case 2: return "A video recording is required to anchor this memory.";
      case 3: return "Final review pending.";
      default: return "Requirements not met.";
    }
  };

  const getActionLabel = () => {
    switch (currentStage) {
      case 0: return 'ENTER THE WEAVE';
      case 1: return 'Enter Recording Studio';
      case 2: return 'Finalize Footage';
      case 3: return 'Prepare Premiere';
      default: return 'Publish to Cinema';
    }
  };

  return (
    <div className={cn(
      "z-[600] w-full max-w-4xl px-6 pointer-events-none transition-all duration-700",
      isDocked ? "relative mx-auto -mt-12 pb-2" : "fixed bottom-12 left-1/2 -translate-x-1/2"
    )}>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ 
          y: [0, -8, 0], // Subtle float
          opacity: 1 
        }}
        transition={{
          y: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          },
          opacity: { duration: 0.3 }
        }}
        className={cn(
          "pointer-events-auto bg-slate-950/80 backdrop-blur-3xl border border-white/10 p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/5 flex items-center justify-between gap-8 transition-all",
          !isComplete && currentStage !== 4 && "border-rose-500/20"
        )}
      >
        <TooltipProvider>
          {/* --- ACT PROGRESSION (LEFT) --- */}
        <div className="flex items-center gap-6 pl-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/90 uppercase tracking-[0.4em] font-black mb-1.5 ml-0.5">Production Stage</span>
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                {steps.map((step, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "h-1 rounded-full transition-all duration-500",
                          currentStage === idx 
                            ? "bg-[var(--room-accent)] w-10 shadow-[0_0_15px_rgba(var(--room-accent-rgb),0.5)]" 
                            : idx < currentStage 
                              ? "bg-emerald-500/40 w-4" 
                              : "bg-white/10 w-4"
                        )} />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-white/10 text-[10px] font-black uppercase tracking-widest py-2 px-4 mb-2">
                        {step.act}: {step.label}
                      </TooltipContent>
                    </Tooltip>
                ))}
              </div>
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] min-w-[60px]">
                {steps[currentStage].act}
              </span>
            </div>
          </div>
        </div>

        {/* --- PRODUCTION STATUS HUD (CENTER) --- */}
        {currentStage === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 border-l border-r border-white/5 mx-4 relative">
             <AnimatePresence>
               {lastDetectedAnchor && (
                 <SynapsePulse key={lastDetectedAnchor.timestamp} type={lastDetectedAnchor.type} />
               )}
             </AnimatePresence>
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <div className="flex items-center gap-3 cursor-help">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        charge >= 15 ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-white/10"
                      )} />
                       <span className="font-mono text-[9px] tracking-[0.4em] text-white/80 uppercase">
                        Clarity: {charge}%
                      </span>
                   </div>
                 </TooltipTrigger>
                  <TooltipContent side="top" className="bg-slate-900 border-white/10 text-[10px] font-black tracking-widest uppercase py-3 px-4 mb-2 min-w-[240px]">
                    <div className="space-y-3">
                       <p className="text-emerald-400 underline decoration-emerald-500/30 underline-offset-4 flex items-center justify-between">
                         Clarity Engine v2.0
                         <span className="text-[8px] opacity-40 font-mono no-underline">EST. DEPTH</span>
                       </p>
                       
                       <div className="space-y-1.5 font-mono text-[9px]">
                         <div className="flex justify-between items-center text-white/40">
                           <span>Narrative Density</span>
                           <span className="text-white">{Math.min(45, Math.floor((wordCount / 30) * 45))}%</span>
                         </div>
                         {detectedAnchors.length > 0 && (
                           <div className="pt-1 border-t border-white/5">
                             {Array.from(new Set(detectedAnchors.map(a => a.type))).map(type => (
                               <div key={type} className="flex justify-between items-center py-0.5">
                                 <span className={cn(
                                   type === 'aroma' ? "text-amber-400" :
                                   type === 'soundscape' ? "text-sky-400" :
                                   "text-emerald-400"
                                 )}>{type} Assets</span>
                                 <span className="text-white">+{detectedAnchors.filter(a => a.type === type).length * 10}%</span>
                                </div>
                             ))}
                           </div>
                         )}
                         <div className="flex justify-between items-center pt-2 border-t border-white/10 text-emerald-500">
                           <span>Total Scene Clarity</span>
                           <span>{charge}%</span>
                         </div>
                       </div>

                       <p className="text-white/30 leading-relaxed font-medium text-[8px] italic border-t border-white/5 pt-2">
                         Director's Tip: Detected anchors stabilize the narrative frequency.
                       </p>
                    </div>
                  </TooltipContent>
               </Tooltip>
             </TooltipProvider>
             
             <div className={cn(
                "w-full h-[2px] bg-white/5 rounded-full overflow-hidden mt-1 transition-all",
                draggingCatalyst && "h-1.5 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
             )}>
                <motion.div 
                  className={cn(
                    "h-full transition-colors",
                    draggingCatalyst ? "bg-cyan-400 shadow-[0_0_15px_#22d3ee]" : "bg-emerald-500/40"
                  )}
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min(charge, 100)}%`,
                    opacity: draggingCatalyst ? [0.6, 1, 0.6] : 1
                  }}
                  transition={{ 
                    width: { type: "spring", damping: 20 },
                    opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                />
             </div>
             
             <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] tracking-[0.4em] text-white/80 uppercase">
                  Script: <span className="text-white/90">{wordCount}</span> words
                </span>
             </div>
          </div>
        )}

        {currentStage === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 border-l border-r border-white/5 mx-4">
            <AnimatePresence mode="wait">
              <motion.div 
                key={detectedAnchors.length}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[8px] tracking-[0.4em] text-emerald-500/40 uppercase flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                // {detectedAnchors.length.toString().padStart(2, '0')} Sensory Assets Deployed
              </motion.div>
            </AnimatePresence>
            
            <div className="flex items-center gap-2.5">
              {detectedAnchors.slice(-5).map((anchor, i) => {
                let btnClass = "border-emerald-500/20 bg-emerald-500/5 text-emerald-400/90";
                let pulseColor = "rgba(16, 185, 129, 0.4)";

                if (anchor.type === 'aroma') {
                  btnClass = "border-amber-500/20 bg-amber-500/5 text-amber-400/90 shadow-[0_0_15px_rgba(251,191,36,0.1)]";
                  pulseColor = "rgba(251, 191, 36, 0.4)";
                } else if (anchor.type === 'soundscape') {
                  btnClass = "border-sky-500/20 bg-sky-500/5 text-sky-400/90 shadow-[0_0_15px_rgba(56,189,248,0.1)]";
                  pulseColor = "rgba(56, 189, 248, 0.4)";
                }

                return (
                    <Tooltip key={`${anchor.word}-${i}`}>
                      <TooltipTrigger asChild>
                        <motion.button
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ 
                            scale: 1, 
                            opacity: 1,
                            boxShadow: [`0 0 0px ${pulseColor}`, `0 0 10px ${pulseColor}`, `0 0 0px ${pulseColor}`]
                          }}
                          transition={{ 
                            scale: { type: "spring", damping: 15 },
                            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                          }}
                          onClick={() => actions.primeCatalyst(anchor.word, anchor.type)}
                          className={cn(
                            "group relative flex items-center gap-2 rounded-lg border px-3 py-1 transition-all hover:brightness-125 active:scale-95",
                            btnClass
                          )}
                        >
                          <motion.div 
                            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100"
                            animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          
                          <span className="font-mono text-[9px] font-black uppercase tracking-widest">
                            {anchor.word}
                          </span>
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-slate-900 border-white/10 text-[10px] font-bold tracking-widest uppercase py-2 px-3 mb-2 shadow-2xl">
                        <div className="flex flex-col gap-1">
                          <span className="text-emerald-400">Captured Asset</span>
                          <span className="text-white/60 normal-case font-normal text-[9px]">
                            {anchor.type === 'visual' ? "Visual anchor detected in your narrative." :
                             anchor.type === 'soundscape' ? "Auditory clarity detected in your prose." :
                             "Olfactory memory anchor detected."}
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                );
              })}
              
              {detectedAnchors.length === 0 && (
                <div className="text-[10px] text-white/10 italic font-mono uppercase tracking-widest py-1">
                  Awaiting Narrative Input...
                </div>
              )}
            </div>
          </div>
        )}




        {/* --- NAVIGATION (RIGHT) --- */}
        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {currentStage > 0 && (
              <motion.button
                key="prev-btn"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={onPrev}
                className="p-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all border border-white/5 group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>

          <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <motion.button
                    whileHover={(isComplete && !isLowClarity) ? { scale: 1.02 } : {}}
                    whileTap={(isComplete && !isLowClarity) ? { scale: 0.98 } : shakeAnimation}
                    onClick={handleNextClick}
                    className={cn(
                      "relative px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 overflow-hidden group/btn pointer-events-auto",
                      (isComplete && !isLowClarity) 
                        ? "bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:brightness-110 hover:shadow-[0_0_50px_rgba(16,185,129,0.6)]" 
                        : isLowClarity
                          ? "bg-white/5 text-white/40 border border-white/10 cursor-pointer hover:bg-white/10"
                          : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                    )}
                  >
                  {isComplete && !isLowClarity && (
                    <>
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* Premium Sparkles Badge */}
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_white]"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                      </motion.div>
                    </>
                  )}
                  
                  <span className="relative z-10">{getActionLabel()}</span>
                  
                  {isComplete && !isLowClarity ? (
                    currentStage === 4 ? (
                      <Rocket className="w-4 h-4 relative z-10" />
                    ) : (
                      <ChevronRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                    )
                  ) : isLowClarity ? (
                    <div className="relative">
                       <Circle className="w-4 h-4 relative z-10 opacity-20" />
                       <motion.div 
                        className="absolute inset-0 border-2 border-emerald-500 rounded-full"
                        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                       />
                    </div>
                  ) : (
                    <AlertCircle className="w-4 h-4 relative z-10 opacity-50" />
                  )}
                </motion.button>
              </div>
            </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12} className="bg-rose-950 border-rose-500/50 text-rose-200 text-[10px] font-bold uppercase tracking-widest px-4 py-3 mb-4 rounded-xl shadow-2xl z-[200]">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Requirements Not Met
                  </span>
                  <span className="text-[9px] opacity-60 normal-case">
                    {getIncompleteReason()}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>

          {/* Act V publishing is now handled by the primary button */}
        </div>
        </TooltipProvider>
      </motion.div>
    </div>
  );
};
