'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Film, Video, History, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

interface CinemaStageSwitchProps {
  currentStage: number;
  onStageChange: (stage: number) => void;
  children: React.ReactNode[];
  acts: { id: number; title: string; label: string }[];
}

export default function CinemaStageSwitch({ 
  currentStage, 
  onStageChange, 
  children,
  acts
}: CinemaStageSwitchProps) {
  const [direction, setDirection] = useState(0);
  const [prevStage, setPrevStage] = useState(currentStage);

  useEffect(() => {
    if (currentStage !== prevStage) {
      setDirection(currentStage > prevStage ? 1 : -1);
      setPrevStage(currentStage);
    }
  }, [currentStage, prevStage]);

  const variants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      filter: 'blur(20px) brightness(1.5)',
      scale: 1.1,
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px) brightness(1)',
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 100, damping: 20 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.6, ease: "easeOut" }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      filter: 'blur(20px) brightness(0.5)',
      scale: 0.9,
      transition: {
        x: { type: "spring" as const, stiffness: 100, damping: 20 },
        opacity: { duration: 0.5 }
      }
    })
  };

  return (
    <div className="relative w-full h-[100vh] bg-slate-950 overflow-hidden flex flex-col">
      {/* Cinematic HUD Header */}
      <div className="absolute top-0 left-0 w-full z-50 p-8 flex justify-between items-center pointer-events-none">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Scene Environment // V4.0</span>
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
             <h1 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
               {acts[currentStage]?.label}: {acts[currentStage]?.title}
             </h1>
          </div>
        </div>

        {/* Navigation Progress Bar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {acts.map((act, idx) => (
            <button
              key={act.id}
              onClick={() => onStageChange(act.id)}
              disabled={act.id > currentStage && currentStage < 2} // Lock future stages except for testing/director
              className={`h-1 transition-all rounded-full ${
                currentStage === act.id 
                  ? 'w-12 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                  : act.id < currentStage 
                    ? 'w-4 bg-emerald-500' 
                    : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Reel */}
      <div className="flex-1 relative">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentStage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {/* Reel Artifact Overlay (Cinematic Feel) */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.1)_40px,rgba(255,255,255,0.1)_41px)]" />
              <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_100px,rgba(255,255,255,0.05)_100px,rgba(255,255,255,0.05)_101px)]" />
            </div>

            <div className="w-full h-full pt-28 px-8 pb-32 overflow-y-auto custom-scrollbar flex flex-col items-center">
              {children[currentStage]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls (Implicit transitions) */}
      <div className="absolute bottom-0 left-0 w-full z-50 p-8 flex justify-between items-center bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none">
        {currentStage > 0 ? (
          <button 
            onClick={() => onStageChange(currentStage - 1)}
            className="pointer-events-auto flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {acts[currentStage - 1]?.title}
          </button>
        ) : <div />}
        
        {currentStage < acts.length - 1 && (
          <button 
            onClick={() => onStageChange(currentStage + 1)}
            className="pointer-events-auto flex items-center gap-3 px-10 py-5 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-110 active:scale-95 shadow-[0_15px_30px_rgba(244,63,94,0.3)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.4)]"
          >
            {currentStage === 0 ? 'Advance to Production' : currentStage === 1 ? 'Finalize Recording' : 'Review Production'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
