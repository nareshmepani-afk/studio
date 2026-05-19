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
    <div className="w-full h-full relative overflow-hidden flex flex-col font-sans">
      {/* HUD Header removed - Navigation handled by ProductionRail */}

      {/* Main Content Reel */}
      <div className="flex-1 relative">
        {/* Dynamic Atmospheric Spotlight */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className={`absolute inset-0 transition-all duration-1000 ${
            currentStage === 0 ? 'bg-sky-500/5' :
            currentStage === 1 ? 'bg-amber-500/5' :
            currentStage === 2 ? 'bg-emerald-500/5' :
            'bg-rose-500/5'
          }`} />
          <div className={`absolute top-0 left-1/4 w-[50%] h-[50%] blur-[120px] rounded-full transition-all duration-1000 opacity-20 ${
            currentStage === 0 ? 'bg-sky-400' :
            currentStage === 1 ? 'bg-amber-400' :
            currentStage === 2 ? 'bg-emerald-400' :
            'bg-rose-400'
          }`} />
        </div>

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentStage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className={`absolute inset-0 w-full h-full ${currentStage === 0 ? 'z-[2000]' : 'z-20'}`}
          >
            {/* Reel Artifact Overlay (Cinematic Feel) */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.03]">
              <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.1)_40px,rgba(255,255,255,0.1)_41px)]" />
              <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_100px,rgba(255,255,255,0.05)_100px,rgba(255,255,255,0.05)_101px)]" />
            </div>

            <div className="w-full h-full pt-28 px-8 pb-32 overflow-y-auto custom-scrollbar flex flex-col items-center relative z-20">
              {children[currentStage]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
