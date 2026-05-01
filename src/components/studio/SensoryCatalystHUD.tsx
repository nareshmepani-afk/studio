'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MentorshipHotspot } from './MentorshipHotspot';
import { 
  Wind, 
  Music, 
  Layers, 
  Sparkles,
  Zap,
  Lock,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStudioState } from '@/hooks/studio/useStudioState';

interface SensoryCatalystHUDProps {
  wordCount: number;
  isDirectorOpen?: boolean;
  onCatalystDrop?: (type: 'aroma' | 'soundscape' | 'texture') => void;
  mentorActive?: boolean;
  currentStage?: number;
}

export const SensoryCatalystHUD: React.FC<SensoryCatalystHUDProps> = ({
  wordCount,
  isDirectorOpen = false,
  onCatalystDrop,
  mentorActive = false,
  currentStage = 0
}) => {
  const { actions, draggingCatalyst, dispatcher, activeAnchorTypes, appliedCatalystTypes } = useStudioState();
  const [lastMilestone, setLastMilestone] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [discoveredTypes, setDiscoveredTypes] = useState<Set<string>>(new Set());
  const [justDiscovered, setJustDiscovered] = useState<string | null>(null);

  // Milestone logic: Pulse every 25 words as "Sensory Credits"
  useEffect(() => {
    const currentMilestone = Math.floor(wordCount / 25);
    if (currentMilestone > lastMilestone && wordCount > 0) {
      setLastMilestone(currentMilestone);
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 2000);
    }
  }, [wordCount, lastMilestone]);

  // Discovery logic: Pulse when a new anchor type is detected in the text
  useEffect(() => {
    activeAnchorTypes.forEach(type => {
      if (!discoveredTypes.has(type)) {
        setDiscoveredTypes(prev => new Set(prev).add(type));
        setJustDiscovered(type);
        setTimeout(() => setJustDiscovered(null), 3000);
      }
    });
  }, [activeAnchorTypes, discoveredTypes]);

  const catalysts = [
    { 
      id: 'aroma' as const, 
      label: 'Aroma Catalyst', 
      icon: Wind, 
      color: 'text-amber-400', 
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      description: 'Drag to anchor olfactory mapping. Define environmental notes: forest rain, ozone, or antique parchment.'
    },
    { 
      id: 'soundscape' as const, 
      label: 'Soundscape Catalyst', 
      icon: Music, 
      color: 'text-sky-400', 
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.2)]',
      description: 'Drag to anchor aural texture. Design atmospheric depth: city rhythm, distant hum, or quiet wind.'
    },
    { 
      id: 'visual' as const, 
      label: 'Texture Catalyst', 
      icon: Layers, 
      color: 'text-emerald-400', 
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      description: 'Drag to anchor tactile imprints. Render physical contact: grain of wood, cold stone, or raw silk.'
    }

  ];

  // The "Left-Flip" Logic: Orientation pivots based on drawer state to ensure
  // tooltips always point toward the workspace and never obscure the "Director's Note".
  const tooltipSide = isDirectorOpen ? "left" : "right";
  const tooltipOffset = isDirectorOpen ? 24 : 12;

  return (
    <motion.div 
      animate={{ 
        right: isDirectorOpen ? 480 : 24,
        gap: isDirectorOpen ? '1rem' : '1.5rem' 
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-1/2 -translate-y-1/2 z-[9000] flex flex-col items-center"
    >
      <AnimatePresence>
        {justDiscovered && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className={cn(
              "absolute -top-12 right-0 whitespace-nowrap px-4 py-2 rounded-full border shadow-xl flex items-center gap-2 z-[10001]",
              justDiscovered === 'aroma' ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
              justDiscovered === 'soundscape' ? "bg-sky-500/20 border-sky-500/40 text-sky-400" :
              "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
            )}
          >
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {justDiscovered} Anchor Detected
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docking Pill Backdrop (Consultation Mode) */}
      <AnimatePresence>
        {isDirectorOpen && (
          <motion.div 
            initial={{ opacity: 0, scaleY: 0.8 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.8 }}
            className="absolute inset-x-[-8px] inset-y-[-12px] bg-emerald-500/5 backdrop-blur-md border border-emerald-500/20 rounded-full z-[-1]"
          />
        )}
      </AnimatePresence>

      {/* The Dock */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-3 rounded-[2rem] flex flex-col gap-6 shadow-2xl transition-all duration-700 relative",
          isDirectorOpen && "bg-transparent border-transparent shadow-none gap-4",
          // HUD Shadow: Casting a soft emerald glow onto the drawer's glass surface when docked
          isDirectorOpen && "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
          pulseActive ? "ring-2 ring-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]" : "ring-1 ring-white/5"
        )}
      >
        {mentorActive && currentStage === 1 && (
          <MentorshipHotspot 
            number={1} 
            label="Select a Catalyst" 
            className="-top-4 -left-4" 
          />
        )}
        <TooltipProvider delayDuration={100}>
          {catalysts.map((cat, idx) => (
            <Tooltip key={cat.id}>
              <TooltipTrigger asChild>
                <motion.div
                  drag={wordCount >= (idx + 1) * 25 && !appliedCatalystTypes.includes(cat.id as any)}
                  dragSnapToOrigin
                  dragElastic={0.8}
                  onDragStart={() => actions.setDraggingCatalyst(cat.id)}
                  onDragEnd={(e, info) => {
                    actions.setDraggingCatalyst(null);
                    
                    // Temporarily hide the catalyst to allow hit-testing the element underneath
                    const target = e.target as HTMLElement;
                    const originalPointerEvents = target.style.pointerEvents;
                    target.style.pointerEvents = 'none';
                    
                    const element = document.elementFromPoint(info.point.x, info.point.y);
                    target.style.pointerEvents = originalPointerEvents;
                    
                    const targetBlock = element?.closest('[data-block-id]');
                    
                    if (targetBlock) {
                      dispatcher?.addCatalyst?.(
                        targetBlock.getAttribute('data-block-id')!,
                        cat.id as any
                      );
                    }
                  }}
                  whileHover={wordCount >= (idx + 1) * 25 && !appliedCatalystTypes.includes(cat.id as any) ? { scale: 1.1, x: -5 } : {}}
                  whileDrag={{ 
                    scale: 1.3, 
                    zIndex: 10000, 
                    pointerEvents: 'none',
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(var(--room-accent-rgb), 0.3)"
                  }}
                  className={cn(
                    "w-14 h-14 rounded-2xl border transition-all group relative flex items-center justify-center",
                    isDirectorOpen && "w-12 h-12 rounded-xl",
                    
                    // 1. DORMANT STATE
                    wordCount < (idx + 1) * 25 && "bg-slate-900/50 border-white/5 grayscale opacity-40 cursor-not-allowed",
                    
                    // 2. IGNITED STATE (Charged & Not Used)
                    wordCount >= (idx + 1) * 25 && !appliedCatalystTypes.includes(cat.id as any) && cn(
                      "bg-white/5 border-white/10 cursor-grab active:cursor-grabbing hover:bg-white/10",
                      cat.glow,
                      "animate-pulse-subtle"
                    ),
                    
                    // 3. APPLIED STATE (Used)
                    appliedCatalystTypes.includes(cat.id as any) && "bg-emerald-500/10 border-emerald-500/30 cursor-default opacity-80",

                    // 4. MENTOR HIGHLIGHT (Onboarding)
                    mentorActive && currentStage === 1 && !appliedCatalystTypes.includes(cat.id as any) && wordCount >= (idx + 1) * 25 &&
                    "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse"
                  )}
                >
                  {/* Status Indicators */}
                  {appliedCatalystTypes.includes(cat.id as any) ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-slate-950/40 rounded-inherit backdrop-blur-[1px]"
                    >
                      <Check className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                  ) : wordCount < (idx + 1) * 25 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white/20" />
                    </div>
                  )}

                  {/* THE WHISPER: Pulsing glow when an anchor is detected in the script */}
                  {activeAnchorTypes.includes(cat.id) && !appliedCatalystTypes.includes(cat.id as any) && (
                    <motion.div
                      className={cn(
                        "absolute -inset-1 rounded-2xl border-2 border-current opacity-40",
                        isDirectorOpen && "rounded-xl",
                        cat.color.replace('text-', 'border-')
                      )}
                      animate={justDiscovered === cat.id ? {
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 0.8, 0.4],
                        borderWidth: [2, 4, 2]
                      } : {
                        scale: [1, 1.15, 1],
                        opacity: [0.4, 0.1, 0.4]
                      }}
                      transition={{ 
                        duration: justDiscovered === cat.id ? 1 : 2.5, 
                        repeat: justDiscovered === cat.id ? 2 : Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                  )}

                  {/* Discovery Floating Label */}
                  <AnimatePresence>
                    {justDiscovered === cat.id && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: -60 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute whitespace-nowrap pointer-events-none"
                      >
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md shadow-xl",
                          cat.id === 'aroma' ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
                          cat.id === 'soundscape' ? "bg-sky-500/20 border-sky-500/40 text-sky-400" :
                          "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        )}>
                          {cat.id} Anchor Detected
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Subtle Glow Pulse for active catalyst */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity",
                    isDirectorOpen && "rounded-xl",
                    cat.id === 'aroma' ? 'bg-amber-500' : cat.id === 'soundscape' ? 'bg-sky-500' : 'bg-emerald-500'
                  )} />
                  
                  <cat.icon className={cn("transition-all", isDirectorOpen ? "w-5 h-5" : "w-6 h-6", cat.color)} />
                  
                  {/* Visual indication of "credits" */}
                      {wordCount >= (idx + 1) * 25 && !appliedCatalystTypes.includes(cat.id as any) && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "absolute -top-1 -right-1 rounded-full flex flex-col items-center",
                          )}
                        >
                          <div className={cn(
                            "w-3 h-3 rounded-full flex items-center justify-center shadow-lg mb-1",
                            cat.id === 'aroma' ? "bg-amber-500 shadow-amber-500/40" : 
                            cat.id === 'soundscape' ? "bg-sky-500 shadow-sky-500/40" : 
                            "bg-emerald-500 shadow-emerald-500/40"
                          )}>
                             <Sparkles className="w-2 h-2 text-white" />
                          </div>
                          
                          <motion.span 
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-6 whitespace-nowrap text-[6px] font-black tracking-widest text-white/40 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm"
                          >
                            READY TO DRAG
                          </motion.span>
                        </motion.div>
                      )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent 
                side={isDirectorOpen ? "left" : "right"} 
                sideOffset={isDirectorOpen ? 24 : 12} 
                className="bg-slate-950 border-white/10 text-white p-4 rounded-xl shadow-2xl max-w-[200px] z-[10000]"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("font-black text-[10px] uppercase tracking-widest", cat.color)}>
                      {cat.label}
                      {appliedCatalystTypes.includes(cat.id as any) && " (Applied)"}
                      {wordCount < (idx + 1) * 25 && " (Locked)"}
                    </span>
                    {appliedCatalystTypes.includes(cat.id as any) ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : wordCount < (idx + 1) * 25 ? (
                      <Lock className="w-3 h-3 text-white/20" />
                    ) : (
                      <Zap className="w-3 h-3 text-white/20" />
                    )}
                  </div>
                  <p className="text-[10px] leading-relaxed text-white/50 italic">
                    {appliedCatalystTypes.includes(cat.id as any) 
                      ? "This sensory layer is permanently infused into the current beat." 
                      : wordCount < (idx + 1) * 25 
                        ? `Clarity Threshold: Write ${((idx + 1) * 25) - wordCount} more words to unlock.`
                        : cat.description}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        <div className="h-px w-8 bg-white/10 mx-auto my-1" />

        <div className="h-px w-8 bg-white/10 mx-auto my-1" />

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                drag={wordCount >= 50}
                dragSnapToOrigin
                onDragStart={() => actions.setDraggingCatalyst('polish')}
                onDragEnd={(e, info) => {
                  actions.setDraggingCatalyst(null);
                  
                  // Temporarily hide the catalyst to allow hit-testing the element underneath
                  const target = e.target as HTMLElement;
                  const originalPointerEvents = target.style.pointerEvents;
                  target.style.pointerEvents = 'none';
                  
                  const element = document.elementFromPoint(info.point.x, info.point.y);
                  target.style.pointerEvents = originalPointerEvents;
                  
                  const targetBlock = element?.closest('[data-block-id]');
                  
                  if (targetBlock) {
                    dispatcher?.addCatalyst?.(
                      targetBlock.getAttribute('data-block-id')!,
                      'polish'
                    );
                  }
                }}
                whileHover={wordCount >= 50 ? { scale: 1.1 } : {}}
                whileDrag={{ scale: 1.2, zIndex: 10000 }}
                className={cn(
                  "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-500 cursor-grab active:cursor-grabbing relative overflow-hidden",
                  isDirectorOpen && "w-12 h-12 rounded-xl",
                  wordCount >= 50 
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 glow-scribe hover:bg-emerald-500/20" 
                    : "bg-slate-950/40 border-white/5 text-white/5 opacity-80"
                )}
              >
                {wordCount < 50 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
                    <div className="w-5 h-5 border border-white/10 rounded-full flex items-center justify-center bg-slate-900 shadow-xl">
                       <span className="text-[8px] font-black">LOCKED</span>
                    </div>
                  </div>
                )}
                <Sparkles className={cn("transition-all", wordCount >= 50 ? "animate-pulse" : "opacity-20", isDirectorOpen ? "w-4 h-4" : "w-5 h-5")} />
              </motion.div>
            </TooltipTrigger>
            <TooltipContent 
              side={isDirectorOpen ? "left" : "right"} 
              sideOffset={isDirectorOpen ? 24 : 12} 
              className="bg-slate-950 border-white/10 text-white p-4 rounded-xl shadow-2xl max-w-[200px] z-[10000]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[10px] uppercase tracking-widest text-emerald-400">AI Polish (Logic)</span>
                  <Sparkles className="w-3 h-3 text-emerald-400/40" />
                </div>
                <p className="text-[10px] leading-relaxed text-white/50 italic">
                  {wordCount < 50 
                    ? `Instrument Restricted: Access requires 50 narrative units. Progress: ${wordCount}/50` 
                    : "Drag onto a story beat to synthesize and polish sensory prose with cinematic flow."}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </motion.div>
  );
};
