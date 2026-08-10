'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStudioState } from '@/hooks/studio/useStudioState';

interface MentorshipHotspotProps {
  number: number;
  label: string;
  className?: string;
}

export const MentorshipHotspot: React.FC<MentorshipHotspotProps> = ({ number, label, className }) => {
  const { isCleanView, isProductionLocked } = useStudioState();
  if (isCleanView || isProductionLocked) return null;
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`absolute z-[500] w-7 h-7 cursor-help ${className}`}>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="w-full h-full bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center font-black text-[11px] shadow-[0_0_20px_rgba(16,185,129,0.8)] border border-white/40"
            >
              {number}
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-emerald-400"
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            </motion.div>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-950 border border-emerald-500/50 text-emerald-400 font-black uppercase tracking-[0.2em] text-[9px] py-2.5 px-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] text-white/40 tracking-[0.4em]">MENTOR STEP</span>
            {label}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
