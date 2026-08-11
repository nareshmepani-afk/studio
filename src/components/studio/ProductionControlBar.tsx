'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MentorshipHotspot } from './MentorshipHotspot';
import { Video, Disc, Square, AlertTriangle, UploadCloud, CheckCircle2, Scissors, Play, Pause, Camera, Loader2, Mic2, MessageSquare, Volume2, Sparkles, UserCircle, Languages, Layout, Zap, Settings2, RefreshCw, CheckCircle, Rocket, Circle, ChevronLeft, ChevronRight, ChevronDown, AlertCircle, Eye, EyeOff, User, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useStudioState } from '@/hooks/studio/useStudioState';
import { useAudioFeedback } from '@/hooks/studio/useAudioFeedback';
import { toast } from 'sonner';

interface ProductionControlBarProps {
  currentStage: number;
  isComplete: boolean;
  onNext: () => void;
  onPrev: () => void;
  onRetake?: () => void;
  onPublish?: () => void;
  charge?: number;
  wordCount?: number;
  isDocked?: boolean;
  missingRequirements?: string[];
  isLowClarity?: boolean;
  mentorActive?: boolean;
  isSaving?: boolean;
  isProductionLocked?: boolean;
  isTheaterOpen?: boolean;
  activeRoom?: 'solo' | 'collaborative' | 'guest';
  onSelectRoom?: (room: 'solo' | 'collaborative' | 'guest') => void;
}

const SynapseTether = ({ type, xOffset = 0 }: { type: string, xOffset?: number }) => {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  
  React.useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (dimensions.width === 0) return null;

  const color = type === 'aroma' ? '#fbbf24' : type === 'soundscape' ? '#38bdf8' : '#10b981';
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[10000]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
      >
        <svg className="w-full h-full overflow-visible">
          <motion.line
            x1={dimensions.width / 2 + xOffset}
            y1={dimensions.height * 0.45} 
            x2={dimensions.width / 2 + 250} 
            y2={dimensions.height * 0.52} 
            stroke={color}
            strokeWidth="3"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0.7] }}
            transition={{ 
              pathLength: { duration: 0.4 },
              opacity: { repeat: Infinity, duration: 0.8 }
            }}
          />
          <circle cx={dimensions.width / 2 + 250} cy={dimensions.height * 0.52} r="4" fill={color} className="animate-pulse" />
        </svg>
      </motion.div>
    </div>
  );
};

export const ProductionControlBar: React.FC<ProductionControlBarProps> = ({
  currentStage,
  isComplete,
  onNext,
  onPrev,
  onRetake,
  onPublish,
  charge = 0,
  wordCount = 0,
  isDocked = false,
  missingRequirements = [],
  isLowClarity = false,
  mentorActive = false,
  isSaving = false,
  isProductionLocked = false,
  isTheaterOpen = false,
  activeRoom = 'solo',
  onSelectRoom
}) => {
  const { 
    detectedAnchors, 
    draggingCatalyst, 
    actions,
    lastDetectedAnchor,
    isReviewing,
    isGeneratingDrafts,
    isDirectorOpen,
    isCleanView
  } = useStudioState();

  const getActModeLabel = (mode: 'solo' | 'collaborative' | 'guest', stage: number, isCompact: boolean = false) => {
    if (isCompact) {
      switch (mode) {
        case 'solo': return 'Solo';
        case 'collaborative': return 'Collab';
        case 'guest': return 'Guest Dir';
      }
    }
    switch (stage) {
      case 0:
        return mode === 'solo' ? '✍️ Solo Scripting' : mode === 'collaborative' ? '👥 Co-Scripting' : '🤖 AI Mentor';
      case 1:
        return mode === 'solo' ? '📐 Solo Weave' : mode === 'collaborative' ? '📱 Mobile Prompter' : '🎬 Remote Scout';
      case 2:
        return mode === 'solo' ? '📹 Solo Record' : mode === 'collaborative' ? '📱 Phone Remote' : '🎬 Remote Director';
      case 3:
        return mode === 'solo' ? '🍿 Solo Review' : mode === 'collaborative' ? '👥 Co-Review Cut' : '🎬 Retake Room';
      case 4:
        return mode === 'solo' ? '🌟 Solo Premiere' : mode === 'collaborative' ? '👥 Family Screening' : '🌐 Director Link';
      default:
        return mode === 'solo' ? 'Solo' : mode === 'collaborative' ? 'Collab' : 'Guest Dir';
    }
  };
  const [lastClickTime, setLastClickTime] = React.useState(0);
  const [isSurging, setIsSurging] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  // Reset pending state when stage or global loading states change
  React.useEffect(() => {
    setIsPending(false);
  }, [currentStage, isGeneratingDrafts, isReviewing, isSaving]);

  // Safety timeout guard: reset isPending after 5 seconds to prevent toolbar lockout on network delay/error
  React.useEffect(() => {
    if (isPending) {
      const safetyTimer = setTimeout(() => {
        setIsPending(false);
      }, 5000);
      return () => clearTimeout(safetyTimer);
    }
  }, [isPending]);

  // Sync surge effect with lastDetectedAnchor
  React.useEffect(() => {
    if (lastDetectedAnchor) {
      setIsSurging(true);
      const timer = setTimeout(() => setIsSurging(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastDetectedAnchor]);

  if (isTheaterOpen) return null;
  
  const steps = [
    { label: 'Inciting Memory', act: 'ACT I' },
    { label: 'Weave', act: 'ACT II' },
    { label: 'Capture', act: 'ACT III' },
    { label: "Director's Cut", act: 'ACT IV' },
    { label: 'Premiere', act: 'ACT V' },
  ];

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  };

  const handleNextClick = () => {
    console.log("[ProductionControlBar] handleNextClick triggered", {
      currentStage,
      isComplete,
      isLowClarity,
      isPending,
      isGeneratingDrafts,
      isReviewing
    });

    if (isPending || isGeneratingDrafts || isSaving) {
      console.log("[ProductionControlBar] Click blocked: isPending, isSaving or isGeneratingDrafts is true");
      return;
    }

    if (isLowClarity) {
      const now = Date.now();
      if (now - lastClickTime < 500) {
        // Double click override
        console.log("[ProductionControlBar] Double-click override detected");
        toast.success("MECHANICAL UNLATCH: Entry Forced", {
          description: "// OVERRIDE. The weave will proceed with raw silk.",
          icon: <Rocket className="w-4 h-4" />
        });
        setIsPending(true);
        console.log("[ProductionControlBar] Low Clarity Override: Setting isPending: true");
        onNext();
      } else {
        console.log("[ProductionControlBar] Low Clarity: First click detected.");
        toast.warning("// LOW CLARITY", {
          description: "The weave requires more raw silk (15% required).",
          icon: <AlertCircle className="w-4 h-4" />
        });
      }
      setLastClickTime(now);
      return;
    }

    if (!isComplete && currentStage !== 4) {
      console.log("[ProductionControlBar] Act Incomplete. Missing:", missingRequirements);
      toast.error("CATALYSTS REQUIRED", {
        description: "Mandatory fields are missing. Check the tooltips for details.",
        icon: <AlertTriangle className="w-4 h-4" />
      });
      return;
    }

    console.log("[ProductionControlBar] Primary Action Proceeding", { 
      currentStage, 
      isComplete, 
      isLowClarity, 
      isPending 
    });

    if (currentStage === 4 && onPublish) {
      onPublish();
    } else {
      setIsPending(true); // Immediate lock-out
      console.log("[ProductionControlBar] Setting isPending: true");
      onNext();
    }
  };

  const getRequirementTooltip = () => {
    if (isComplete && !isLowClarity) return "Ready for the next phase.";
    
    if (missingRequirements.length > 0) {
        return (
            <div className="space-y-2">
                <p className="text-rose-400 font-bold border-b border-rose-500/20 pb-1">INCOMPLETE CATALYSTS</p>
                <ul className="space-y-1">
                    {missingRequirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-2 text-white/70">
                            <div className="w-1 h-1 bg-rose-500 rounded-full" />
                            {req}
                        </li>
                    ))}
                </ul>
                <p className="text-[8px] text-white/30 pt-1 italic font-normal">Fill all mandatory fields to activate the Director's Cut ceremony.</p>
            </div>
        );
    }

    switch (currentStage) {
      case 0: return isLowClarity ? "Scene Clarity below 15% threshold." : "Title, Description, and Year are mandatory catalysts.";
      case 1: return "Selecting a Sensory Weave is required before recording.";
      case 2: return "A video recording is required to anchor this memory.";
      case 3: return "Final review pending.";
      default: return "Requirements not met.";
    }
  };

  const getActionLabel = () => {
    if (isSaving) return 'SAVING...';
    if (currentStage === 0) {
        if (isGeneratingDrafts || isPending) return 'SYNTHESIZING...';
        if (isReviewing) return 'SEAL THE MEMORY';
        if (isProductionLocked) return 'ENTER RECORDING STUDIO';

        return 'DRAFT COMPLETED';
    }
    
    switch (currentStage) {
      case 1: return 'Enter Recording Studio';
      case 2: return 'Finalize Footage';
      case 3: return 'Prepare Premiere';
      default: return 'Publish to Cinema';
    }
  };

  return (
    <div className={cn(
      "z-[9999] w-full max-w-4xl px-6 pointer-events-none transition-all duration-500 ease-in-out relative",
      isDocked ? "fixed bottom-6 left-1/2 -translate-x-1/2" : "fixed bottom-12 left-1/2 -translate-x-1/2",
      (isReviewing || isDirectorOpen) && "opacity-0 invisible blur-xl grayscale scale-95 select-none pointer-events-none"
    )}>
      {/* SCROLL AFFORDANCE CUE */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0.5, 0.95, 0.5], y: [0, 4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[8.5px] font-mono font-bold tracking-[0.25em] text-emerald-400 uppercase pointer-events-none select-none bg-slate-950/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
      >
        <span>Scroll For Stage Controls</span>
        <ChevronDown className="w-3 h-3 text-emerald-400 animate-bounce" />
      </motion.div>

      <motion.div 
        data-blueprint="ProductionControlBar"
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
          "bg-slate-950/85 backdrop-blur-3xl border border-white/10 p-3 sm:p-4 lg:p-5 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/5 flex items-center justify-between gap-3 md:gap-4 lg:gap-6 xl:gap-8 max-w-[95vw] xl:max-w-none mx-auto transition-all overflow-x-auto no-scrollbar",
          (isReviewing || isDirectorOpen) ? "pointer-events-none" : "pointer-events-auto",
          !isComplete && currentStage !== 4 && "border-rose-500/20"
        )}
      >
        <TooltipProvider>
          {/* --- ACT PROGRESSION & MODE SWITCHER (LEFT WING) --- */}
        <div className="flex items-center gap-3 md:gap-4 lg:gap-5 pl-1 sm:pl-2 shrink-0">
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[9px] text-emerald-400 uppercase tracking-[0.4em] font-black mb-1.5 ml-0.5 hidden sm:inline-block">Stage Controls</span>
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="flex gap-1 sm:gap-1.5">
                {steps.map((step, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "h-1 rounded-full transition-all duration-500",
                          currentStage === idx 
                            ? "bg-[var(--room-accent)] w-6 sm:w-10 shadow-[0_0_15px_rgba(var(--room-accent-rgb),0.5)]" 
                            : idx < currentStage 
                              ? "bg-emerald-500/40 w-2.5 sm:w-4" 
                              : "bg-white/10 w-2.5 sm:w-4"
                        )} />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-white/10 text-[10px] font-black uppercase tracking-widest py-2 px-4 mb-2">
                        {step.act}: {step.label}
                      </TooltipContent>
                    </Tooltip>
                ))}
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-white/60 uppercase tracking-[0.2em] min-w-[50px] sm:min-w-[60px]">
                {steps[currentStage].act}
              </span>
            </div>
          </div>

          {/* COMPACT SEGMENTED GLASSMORPHIC PILL SWITCHER */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 p-1 rounded-full shadow-inner gap-0.5 sm:gap-1 shrink-0">
            <button
              type="button"
              data-hotspot-id="HS_STAGE_CONTROL_MODE_SOLO_BTN"
              onClick={() => onSelectRoom?.('solo')}
              className={cn(
                "px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[9.5px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border whitespace-nowrap",
                activeRoom === 'solo'
                  ? "bg-emerald-400 text-slate-950 border-emerald-400 font-black shadow-md scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
              )}
              title="Solo Mode: Direct self-recording"
            >
              <User className="w-3 h-3" />
              <span>
                <span className="hidden xl:inline">{getActModeLabel('solo', currentStage)}</span>
                <span className="inline xl:hidden">{getActModeLabel('solo', currentStage, true)}</span>
              </span>
            </button>

            <button
              type="button"
              data-hotspot-id="HS_STAGE_CONTROL_MODE_COLLAB_BTN"
              onClick={() => onSelectRoom?.('collaborative')}
              className={cn(
                "px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[9.5px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border whitespace-nowrap",
                activeRoom === 'collaborative'
                  ? "bg-cyan-400 text-slate-950 border-cyan-400 font-black shadow-md scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
              )}
              title="Collaborative Mode: Mobile prompter & co-creation"
            >
              <Users className="w-3 h-3" />
              <span>
                <span className="hidden xl:inline">{getActModeLabel('collaborative', currentStage)}</span>
                <span className="inline xl:hidden">{getActModeLabel('collaborative', currentStage, true)}</span>
              </span>
            </button>

            <button
              type="button"
              data-hotspot-id="HS_STAGE_CONTROL_MODE_GUEST_DIR_BTN"
              onClick={() => onSelectRoom?.('guest')}
              className={cn(
                "px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[9.5px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border whitespace-nowrap",
                activeRoom === 'guest'
                  ? "bg-amber-400 text-slate-950 border-amber-400 font-black shadow-md scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
              )}
              title="Guest Director Mode: Remote camera & prompter control"
            >
              <Video className="w-3 h-3" />
              <span>
                <span className="hidden xl:inline">{getActModeLabel('guest', currentStage)}</span>
                <span className="inline xl:hidden">{getActModeLabel('guest', currentStage, true)}</span>
              </span>
            </button>
          </div>
        </div>

            {/* --- PRODUCTION STATUS HUD (CENTER) --- */}
        {currentStage === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 border-l border-r border-white/10 mx-4 relative">
             <div className="absolute inset-x-0 -top-[500px] pointer-events-none flex justify-center">
               <AnimatePresence mode="wait">
                 {lastDetectedAnchor && (
                   <SynapseTether 
                     key={lastDetectedAnchor.timestamp} 
                     type={lastDetectedAnchor.type} 
                     xOffset={(lastDetectedAnchor as any).xOffset}
                   />
                 )}
               </AnimatePresence>
             </div>
             
             <div className="flex items-center gap-6">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 cursor-pointer group">
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          charge >= 15 ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        )} />
                         <span className="font-mono text-[11px] tracking-[0.3em] text-white font-bold uppercase">
                          Clarity: {charge}%
                         </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-slate-900 border-white/10 text-xs font-black tracking-widest uppercase py-3 px-4 mb-2 min-w-[240px]">
                      <div className="space-y-3">
                         <p className="text-emerald-400 underline decoration-emerald-500/30 underline-offset-4 flex items-center justify-between">
                           Clarity Engine v2.0
                           <span className="text-[10px] text-zinc-400 font-mono no-underline">EST. DEPTH</span>
                         </p>
                         
                         <div className="space-y-1.5 font-mono text-xs">
                           <div className="flex justify-between items-center text-white/70">
                             <span>Narrative Density</span>
                             <span className="text-white font-bold">{Math.min(50, Math.floor((wordCount / 30) * 50))}%</span>
                           </div>
                           {detectedAnchors.length > 0 && (
                             <div className="pt-1 border-t border-white/10">
                               {Array.from(new Set(detectedAnchors.map(a => a.type))).map(type => (
                                 <div key={type} className="flex justify-between items-center py-0.5">
                                   <span className={cn(
                                     type === 'aroma' ? "text-amber-400 font-bold" :
                                     type === 'soundscape' ? "text-sky-400 font-bold" :
                                     "text-emerald-400 font-bold"
                                   )}>{type} Assets</span>
                                   <span className="text-white font-bold">+{detectedAnchors.filter(a => a.type === type).length * 10}%</span>
                                  </div>
                               ))}
                             </div>
                           )}
                           <div className="flex justify-between items-center pt-2 border-t border-white/10 text-emerald-400 font-bold">
                             <span>Total Scene Clarity</span>
                             <span>{charge}%</span>
                           </div>
                         </div>

                         <p className="text-zinc-300 leading-relaxed font-medium text-xs italic border-t border-white/10 pt-2">
                           Director's Tip: Detected anchors stabilize the narrative frequency.
                         </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="flex items-center gap-3">
                   <span className="font-mono text-[11px] tracking-[0.3em] text-white font-bold uppercase">
                     Script: <span className="text-emerald-400">{wordCount}</span> words
                   </span>
                </div>
             </div>
          </div>
        )}

        {currentStage === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 border-l border-r border-white/10 mx-4">
            <AnimatePresence mode="wait">
              <motion.div 
                key={detectedAnchors.length}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[11px] tracking-[0.3em] text-emerald-400 font-bold uppercase flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {detectedAnchors.length.toString().padStart(2, '0')} Sensory Assets Deployed
              </motion.div>
            </AnimatePresence>
             <div className={cn(
                "w-full h-[2px] bg-white/5 rounded-full overflow-hidden mt-1 transition-all",
                (draggingCatalyst || isSurging) && "h-1.5 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
             )}>
                <motion.div 
                   className={cn(
                     "h-full transition-colors",
                     (draggingCatalyst || isSurging) ? "bg-cyan-400 shadow-[0_0_15px_#22d3ee]" : "bg-emerald-500/40"
                   )}
                   initial={{ width: 0, opacity: 1 }}
                   animate={{ 
                     width: `${Math.min(charge, 100)}%`,
                     opacity: (draggingCatalyst || isSurging) ? [0.6, 1, 0.6] : 1
                   }}
                   transition={{ 
                     width: { type: "spring", damping: 20 },
                     opacity: (draggingCatalyst || isSurging) ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }
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
                {detectedAnchors.length.toString().padStart(2, '0')} Sensory Assets Deployed
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
                        <span className="inline-block">
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
                              initial={{ scale: 1, opacity: 0 }}
                              animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            
                            <span className="font-mono text-[9px] font-black uppercase tracking-widest">
                              {anchor.word}
                            </span>
                          </motion.button>
                        </span>
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
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">

          {/* Clean View toggle lives in the top header bar — removed from here to prevent
              the proceed button from being pushed off the right edge of the toolbar. */}



          <AnimatePresence mode="wait">
            {onRetake && (currentStage === 2 || currentStage === 3) && (
              <Tooltip key="retake-btn">
                <TooltipTrigger asChild>
                  <motion.button
                    data-hotspot-id="HS_STAGE_DOCK_RETAKE_BTN"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onClick={onRetake}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-3 sm:py-3.5 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:scale-105 shrink-0 whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                    <span>Retake</span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 border border-white/10 text-[10px] uppercase font-bold tracking-widest px-3 py-2">
                  <span>Return to Recording Studio to record another take</span>
                </TooltipContent>
              </Tooltip>
            )}

            {currentStage > 0 && (
              <motion.button
                key="prev-btn"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={onPrev}
                title="Return to previous stage"
                className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all border border-white/5 group shrink-0"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>

          <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative shrink-0">
                  {mentorActive && (
                    <MentorshipHotspot 
                      number={3} 
                      label={
                        currentStage === 0 ? "Seal & Weave Monologue" :
                        currentStage === 1 ? "Launch Recording Studio" :
                        currentStage === 2 ? "Finalize Footage & Submit Take" :
                        currentStage === 3 ? "Prepare Premiere Cut" :
                        "Share Cinema Package"
                      } 
                      hotspotId={
                        currentStage === 0 ? "HS_ACT1_MENTOR_STEP3" :
                        currentStage === 1 ? "HS_ACT2_MENTOR_STEP3" :
                        currentStage === 2 ? "HS_ACT3_MENTOR_STEP3" :
                        currentStage === 3 ? "HS_ACT4_MENTOR_STEP3" :
                        "HS_ACT5_MENTOR_STEP3"
                      }
                      isAct1Guard={currentStage === 0}
                      isCompleted={isComplete && !isLowClarity}
                      className="-top-4 -right-4" 
                    />
                  )}
                  <motion.button
                    data-hotspot-id={currentStage === 0 ? "HS_ACT1_DRAFT_COMPLETED_BTN" : "HS_ENTER_STUDIO_BTN"}
                    whileHover={(!isPending && !isGeneratingDrafts && !isSaving) ? { scale: 1.02 } : {}}
                    whileTap={(!isPending && !isGeneratingDrafts && !isSaving) ? { scale: 0.98 } : shakeAnimation}
                    disabled={isPending || isGeneratingDrafts || isSaving}
                    onClick={handleNextClick}
                    className={cn(
                      "relative px-5 sm:px-8 lg:px-10 py-3.5 sm:py-4 rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 sm:gap-3 overflow-hidden group/btn pointer-events-auto shrink-0 whitespace-nowrap min-w-max",
                      (isComplete && !isLowClarity) 
                        ? "bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:brightness-110 hover:shadow-[0_0_50px_rgba(16,185,129,0.6)]" 
                        : isLowClarity
                          ? "bg-white/5 text-white/40 border border-white/10 cursor-pointer hover:bg-white/10"
                          // Rule 7: Disabled buttons MUST remain visible — never use opacity-invisible styling.
                          // Rose-tinted disabled state clearly signals "requirements not met" to the user.
                          : "bg-rose-500/10 text-rose-300/60 border border-rose-500/30 cursor-not-allowed hover:bg-rose-500/15",
                      (isPending || isGeneratingDrafts || isSaving) && "opacity-80 cursor-wait brightness-90"
                    )}

                  >
                  {isComplete && !isLowClarity && (
                    <>
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        initial={{ x: '-100%' }}
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
                    (isPending || isGeneratingDrafts || isSaving) ? (
                      <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                    ) : currentStage === 4 ? (
                      <Rocket className="w-4 h-4 relative z-10" />
                    ) : (
                      <ChevronRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                    )
                  ) : isLowClarity ? (
                    <div className="relative">
                       <Circle className="w-4 h-4 relative z-10 opacity-20" />
                       <motion.div 
                        className="absolute inset-0 border-2 border-emerald-500 rounded-full"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                       />
                    </div>
                  ) : (
                    <AlertCircle className="w-4 h-4 relative z-10 text-rose-400/60" />

                  )}
                </motion.button>
              </div>
            </TooltipTrigger>
              <TooltipContent 
                side="top" 
                sideOffset={12} 
                className={cn(
                  "border text-[10px] font-bold uppercase tracking-widest px-4 py-3 mb-4 rounded-xl shadow-2xl z-[9999]",
                  (isComplete && !isLowClarity)
                    ? "bg-emerald-950 border-emerald-500/50 text-emerald-200"
                    : "bg-rose-950 border-rose-500/50 text-rose-200"
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    {isComplete && !isLowClarity ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {isComplete && !isLowClarity ? "Production Ready" : "Requirements Not Met"}
                  </span>
                  <span className="text-[9px] opacity-60 normal-case">
                    {getRequirementTooltip()}
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
