"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CinematicBackgroundProps {
  children: React.ReactNode;
  theme?: 'amber' | 'blue' | 'default' | 'aroma' | 'soundscape' | 'visual';
  className?: string;
  minFullHeight?: boolean;
}

export const CinematicBackground = ({ 
  children, 
  theme = 'default',
  className,
  minFullHeight = true
}: CinematicBackgroundProps) => {
  return (
    <div className={cn(
      minFullHeight ? "min-h-screen" : "min-h-full",
      "w-full relative overflow-x-hidden bg-[#030303] text-white selection:bg-primary/30",
      className
    )}>
      {/* Cinematic Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Primary Glow (Teal/Blue ish - The "Studio" Base) */}
        <div className={cn(
          "absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[120px] transition-all duration-1000",
          theme === 'blue' || theme === 'soundscape' ? "bg-sky-500/15" : 
          theme === 'visual' ? "bg-emerald-500/15" :
          "bg-primary/10"
        )} />

        {/* Accent Glow (Amber/Rose - The "Warmer" Production Side) */}
        <div className={cn(
          "absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-all duration-1000",
          theme === 'amber' || theme === 'aroma' ? "bg-amber-500/15" : 
          theme === 'visual' ? "bg-emerald-600/10" :
          "bg-amber-600/5"
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
