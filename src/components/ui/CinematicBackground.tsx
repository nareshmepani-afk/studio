"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CinematicBackgroundProps {
  children: React.ReactNode;
  theme?: 'amber' | 'blue' | 'default';
  className?: string;
}

export const CinematicBackground = ({ 
  children, 
  theme = 'default',
  className 
}: CinematicBackgroundProps) => {
  return (
    <div className={cn(
      "min-h-screen w-full relative overflow-x-hidden bg-[#030303] text-white selection:bg-primary/30",
      className
    )}>
      {/* Cinematic Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Primary Glow (Teal/Blue ish - The "Studio" Base) */}
        <div className={cn(
          "absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[120px] transition-all duration-1000",
          theme === 'blue' ? "bg-sky-500/15" : "bg-primary/10"
        )} />

        {/* Accent Glow (Amber/Rose - The "Warmer" Production Side) */}
        <div className={cn(
          "absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-all duration-1000",
          theme === 'amber' ? "bg-amber-500/15" : "bg-amber-600/5"
        )} />

        {/* Texture Overlay (Optional subtle noise for "Film Grain" feel) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
