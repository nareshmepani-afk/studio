'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Rocket, 
  Circle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductionControlBarProps {
  currentStage: number;
  isComplete: boolean;
  onNext: () => void;
  onPrev: () => void;
  onPublish?: () => void;
}

export const ProductionControlBar: React.FC<ProductionControlBarProps> = ({
  currentStage,
  isComplete,
  onNext,
  onPrev,
  onPublish
}) => {
  const steps = [
    { label: 'Hook', act: 'ACT I' },
    { label: 'Weave', act: 'ACT II' },
    { label: 'Capture', act: 'ACT III' },
    { label: 'Cut', act: 'ACT IV' },
    { label: 'Premiere', act: 'ACT V' }
  ];

  const shakeAnimation = {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.4 }
  };

  const handleNextClick = () => {
    if (!isComplete) {
      // Logic handled by motion tap animation in button
      return;
    }
    onNext();
  };

  const getActionLabel = () => {
    switch (currentStage) {
      case 0: return 'Proceed to Scripting';
      case 1: return 'Enter Recording Studio';
      case 2: return 'Finalize Footage';
      case 3: return 'Prepare Premiere';
      default: return 'Publish to Cinema';
    }
  };

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-6 pointer-events-none">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto bg-slate-950/80 backdrop-blur-3xl border border-white/10 p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/5 flex items-center justify-between gap-8"
      >
        {/* --- ACT PROGRESSION (LEFT) --- */}
        <div className="flex items-center gap-6 pl-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/30 uppercase tracking-[0.4em] font-black mb-1.5 ml-0.5">Production Stage</span>
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                {steps.map((step, idx) => (
                  <TooltipProvider key={idx}>
                    <Tooltip>
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
                  </TooltipProvider>
                ))}
              </div>
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] min-w-[60px]">
                {steps[currentStage].act}
              </span>
            </div>
          </div>
        </div>

        {/* --- NAVIGATION (CENTER/RIGHT) --- */}
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

          <TooltipProvider>
            <Tooltip open={!isComplete && currentStage < 4 ? undefined : false}>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={isComplete ? { scale: 1.02 } : {}}
                  whileTap={isComplete ? { scale: 0.98 } : shakeAnimation}
                  onClick={handleNextClick}
                  className={cn(
                    "relative px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 overflow-hidden group/btn",
                    isComplete 
                      ? "bg-[var(--room-accent)] text-slate-950 shadow-[0_10px_30px_rgba(var(--room-accent-rgb),0.3)] hover:brightness-110" 
                      : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                  )}
                >
                  {isComplete && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  
                  <span className="relative z-10">{getActionLabel()}</span>
                  
                  {isComplete ? (
                    currentStage === 4 ? (
                      <Rocket className="w-4 h-4 relative z-10" />
                    ) : (
                      <ChevronRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                    )
                  ) : (
                    <AlertCircle className="w-4 h-4 relative z-10 opacity-50" />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12} className="bg-rose-950 border-rose-500/50 text-rose-200 text-[10px] font-bold uppercase tracking-widest px-4 py-3 mb-4 rounded-xl shadow-2xl z-[200]">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Requirements Not Met
                  </span>
                  <span className="text-[9px] opacity-60 normal-case">
                    {currentStage === 0 ? "Title & Hook required to ground the session" : 
                     currentStage === 1 ? "120 words needed to provide rich context" :
                     currentStage === 2 ? "A Video Capture is mandatory for production" : "Final review required"}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {currentStage === 4 && (
            <button 
              onClick={onPublish}
              className="px-8 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
            >
              Premiere NoW
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
