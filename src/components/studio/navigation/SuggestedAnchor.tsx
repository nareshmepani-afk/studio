"use client";

import { motion } from 'framer-motion';
import { CatalystType } from '@/types';

interface SuggestedAnchorProps {
  type: CatalystType;
  intensity: number; // 0 to 1, controlled by the "Studio Mode"
}

export const SuggestedAnchor = ({ type, intensity }: SuggestedAnchorProps) => {
  const colorClass = type === 'soundscape' ? 'bg-sky-400' : type === 'visual' ? 'bg-emerald-400' : type === 'polish' ? 'bg-fuchsia-400' : 'bg-amber-400';
  const shadowClass = type === 'soundscape' ? 'shadow-sky-500/50' : type === 'visual' ? 'shadow-emerald-500/50' : type === 'polish' ? 'shadow-fuchsia-500/50' : 'shadow-amber-500/50';

  return (
    <div className="relative flex items-center justify-center w-4 h-4">
      {/* 1. THE CORE: Constant and grounded */}
      <motion.div
        animate={{ opacity: intensity }}
        className={`h-1.5 w-1.5 rounded-full ${colorClass} ${shadowClass} shadow-sm z-10`}
      />

      {/* 2. THE RIPPLE: The "Sonar" effect */}
      <motion.div
        animate={{
          scale: [1, 2.5],
          opacity: [intensity * 0.6, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className={`absolute h-1.5 w-1.5 rounded-full ${colorClass} blur-[1px]`}
      />
    </div>
  );
};
