'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BeatSheetProps {
  beats: string[];
  activeBeatIndex: number;
  onBeatClick?: (index: number) => void;
}

export function BeatSheet({ beats, activeBeatIndex, onBeatClick }: BeatSheetProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sky-400/60 select-none">
        <Sparkles className="w-3 h-3" />
        <span className="text-[9px] font-black uppercase tracking-widest text-sky-400/70">Beat Sheet</span>
      </div>
      <div className="space-y-2.5">
        {beats.map((item, i) => {
          const isActive = i === activeBeatIndex;
          return (
            <motion.button
              key={i}
              onClick={() => onBeatClick?.(i)}
              whileHover={{ x: 4 }}
              className={cn(
                "w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all duration-300 cursor-pointer select-none",
                isActive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.02]"
                  : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:border-white/10 hover:text-white/80"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mt-1.5 transition-colors shrink-0",
                isActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-sky-500/30"
              )} />
              <span className={cn(
                "text-[10px] font-bold leading-tight font-sans tracking-wide transition-colors",
                isActive ? "text-emerald-300 font-extrabold" : "text-zinc-300/80"
              )}>
                {item}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
