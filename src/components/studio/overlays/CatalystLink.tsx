'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Music, Sparkles, Eye, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CatalystType } from '@/types';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { useAudioFeedback } from '@/hooks/studio/useAudioFeedback';

interface CatalystLinkProps {
  blockId: string;
  type: CatalystType;
  value: string;
  reasoning: string;
}

const typeConfig = {
  aroma: {
    icon: Sparkles,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    hoverBorder: 'group-hover:border-amber-500/40',
    hoverBg: 'hover:bg-amber-500/20',
    shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.1)]',
    label: 'Aroma Catalyst'
  },
  soundscape: {
    icon: Music,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    hoverBorder: 'group-hover:border-sky-500/40',
    hoverBg: 'hover:bg-sky-500/20',
    shadow: 'shadow-[0_0_10px_rgba(14,165,233,0.1)]',
    label: 'Soundscape Catalyst'
  },
  visual: {
    icon: Eye,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    hoverBorder: 'group-hover:border-emerald-500/40',
    hoverBg: 'hover:bg-emerald-500/20',
    shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    label: 'Visual Catalyst'
  },
  polish: {
    icon: PenTool,
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20',
    hoverBorder: 'group-hover:border-fuchsia-500/40',
    hoverBg: 'hover:bg-fuchsia-500/20',
    shadow: 'shadow-[0_0_10px_rgba(192,38,211,0.1)]',
    label: 'Prose Polish'
  },
  clarity: {
    icon: Sparkles,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    hoverBorder: 'group-hover:border-rose-500/40',
    hoverBg: 'hover:bg-rose-500/20',
    shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.1)]',
    label: 'Narrative Clarity'
  }
};

export const CatalystLink: React.FC<CatalystLinkProps> = ({ blockId, type, value, reasoning }) => {
  const { dispatcher } = useStudioState();
  const { playError } = useAudioFeedback();
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleDeploy = () => {
    if (dispatcher?.addCatalyst) {
      const { collisionDetected } = dispatcher.addCatalyst(blockId, type, value);
      if (collisionDetected) {
        playError();
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 my-2">
      <span className="text-white/70 leading-relaxed text-sm italic border-l-2 border-white/10 pl-4">
        {reasoning}
      </span>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDeploy}
        className={cn(
          "inline-flex items-center self-start gap-1.5 px-3 py-1 mt-1 rounded-full border cursor-pointer transition-all group",
          config.bg,
          config.border,
          config.hoverBg,
          config.hoverBorder,
          config.shadow
        )}
      >
        <Icon className={cn("w-3.5 h-3.5", config.color)} />
        <span className={cn("text-[10px] font-black uppercase tracking-widest", config.color)}>
          {config.label}: {value}
        </span>
      </motion.button>
    </div>
  );
};
