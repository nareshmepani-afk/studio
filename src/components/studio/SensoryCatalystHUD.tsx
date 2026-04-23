'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wind, 
  Music, 
  Layers, 
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SensoryCatalystHUDProps {
  wordCount: number;
  onCatalystDrop?: (type: 'aroma' | 'soundscape' | 'texture') => void;
}

export const SensoryCatalystHUD: React.FC<SensoryCatalystHUDProps> = ({
  wordCount,
  onCatalystDrop
}) => {
  const [lastMilestone, setLastMilestone] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);

  // Milestone logic: Pulse every 40 words as "Sensory Credits"
  useEffect(() => {
    const currentMilestone = Math.floor(wordCount / 40);
    if (currentMilestone > lastMilestone && wordCount > 0) {
      setLastMilestone(currentMilestone);
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 2000);
    }
  }, [wordCount, lastMilestone]);

  const catalysts = [
    { 
      id: 'aroma', 
      label: 'Aroma Catalyst', 
      icon: Wind, 
      color: 'text-sky-400', 
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.2)]',
      description: 'Studio Grade: Olfactory mapping. Define environmental notes: forest rain, ozone, or antique parchment.'
    },
    { 
      id: 'soundscape', 
      label: 'Soundscape Catalyst', 
      icon: Music, 
      color: 'text-amber-400', 
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      description: 'Aural Texture: Spatial audio layering. Design atmospheric depth: city rhythm, distant hum, or quiet wind.'
    },
    { 
      id: 'texture', 
      label: 'Texture Catalyst', 
      icon: Layers, 
      color: 'text-indigo-400', 
      glow: 'shadow-[0_0_20px_rgba(129,140,248,0.2)]',
      description: 'Tactile Imprint: Material surfacing. Render physical contact: grain of wood, cold stone, or raw silk.'
    }
  ];

  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
      {/* Sidebar Label / Milestone Indicator */}
      <motion.div 
        animate={pulseActive ? { scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] } : {}}
        className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap"
      >
        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">
          Sensory Catalysts // {wordCount} words
        </span>
      </motion.div>

      {/* The Dock */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-3 rounded-[2rem] flex flex-col gap-4 shadow-2xl transition-all duration-700",
          pulseActive ? "ring-2 ring-[var(--room-accent)]/50 shadow-[0_0_40px_rgba(var(--room-accent-rgb),0.2)]" : "ring-1 ring-white/5"
        )}
      >
        <TooltipProvider delayDuration={100}>
          {catalysts.map((cat, idx) => (
            <Tooltip key={cat.id}>
              <TooltipTrigger asChild>
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.8}
                  onDragEnd={() => onCatalystDrop?.(cat.id as any)}
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileDrag={{ scale: 1.2, zIndex: 60 }}
                  className={cn(
                    "w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors hover:bg-white/10 group relative",
                    cat.glow
                  )}
                >
                  {/* Subtle Glow Pulse for active catalyst */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity",
                    cat.id === 'aroma' ? 'bg-sky-500' : cat.id === 'soundscape' ? 'bg-amber-500' : 'bg-indigo-500'
                  )} />
                  
                  <cat.icon className={cn("w-6 h-6", cat.color)} />
                  
                  {/* Visual indication of "credits" */}
                  {wordCount >= (idx + 1) * 40 && (
                    <motion.div 
                      layoutId={`milestone-${cat.id}`}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Sparkles className="w-2 h-2 text-slate-950" />
                    </motion.div>
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={20} className="bg-slate-950 border-white/10 text-white p-4 rounded-xl shadow-2xl max-w-[200px]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-black text-[10px] uppercase tracking-widest", cat.color)}>{cat.label}</span>
                    <Zap className="w-3 h-3 text-white/20" />
                  </div>
                  <p className="text-[10px] leading-relaxed text-white/50 italic">{cat.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        <div className="h-px w-8 bg-white/10 mx-auto my-1" />

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                disabled={wordCount < 50}
                className={cn(
                  "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-500",
                  wordCount >= 50 
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 glow-scribe hover:bg-emerald-500/20" 
                    : "bg-white/5 border-white/5 text-white/10 cursor-not-allowed"
                )}
              >
                <Sparkles className={cn("w-5 h-5", wordCount >= 50 ? "animate-pulse" : "")} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-slate-950 border-white/10 text-white p-4 rounded-xl shadow-2xl max-w-[200px]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[10px] uppercase tracking-widest text-emerald-400">AI Polish (Logic)</span>
                  <Sparkles className="w-3 h-3 text-emerald-400/40" />
                </div>
                <p className="text-[10px] leading-relaxed text-white/50 italic">
                  {wordCount < 50 
                    ? `Instrument Restricted: Access requires 50 narrative units. Progress: ${wordCount}/50` 
                    : "Studio Intelligence: Synthesize and polish sensory prose with cinematic flow."}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </div>
  );
};
