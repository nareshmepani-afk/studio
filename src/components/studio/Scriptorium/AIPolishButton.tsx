"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIPolishButtonProps {
  charge: number;
  isReady: boolean;
  onClick: () => void;
  isPolishing?: boolean;
}

export const AIPolishButton: React.FC<AIPolishButtonProps> = ({ 
  charge, 
  isReady, 
  onClick,
  isPolishing = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const ignitionState = charge < 30 ? 'dormant' : charge < 60 ? 'spooling' : 'ignition';

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Non-Destructive Label */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black text-emerald-400/60 uppercase tracking-[0.2em]"
          >
            // NON-DESTRUCTIVE
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE CHARGE RING: Fills as you type */}
      <div className="absolute inset-[-4px] pointer-events-none">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white/5"
          />
          <motion.circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="289.02"
            animate={{ 
              strokeDashoffset: 289.02 - (289.02 * charge) / 100,
              opacity: ignitionState === 'dormant' ? 0.2 : 1
            }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className={cn(
              "transition-colors duration-1000",
              isReady ? "text-emerald-500 shadow-[0_0_15px_#10b981]" : 
              ignitionState === 'spooling' ? "text-emerald-500/60" : "text-emerald-500/20"
            )}
          />
        </svg>
      </div>

      {/* THE BUTTON BODY */}
      <button
        onClick={onClick}
        disabled={!isReady || isPolishing}
        className={cn(
          "relative z-10 flex items-center gap-3 px-8 py-3.5 rounded-full font-black text-[10px] uppercase tracking-[0.25em] transition-all duration-700 overflow-hidden",
          ignitionState === 'dormant' && "bg-slate-900/50 text-white/10 border border-white/5 opacity-40 grayscale pointer-events-none scale-95",
          ignitionState === 'spooling' && "bg-emerald-500/5 text-emerald-500/40 border border-emerald-500/10 opacity-80 scale-100",
          ignitionState === 'ignition' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] opacity-100 scale-100 hover:scale-105 active:scale-95"
        )}
      >
        {/* Spooling Pulse */}
        {ignitionState === 'spooling' && (
          <motion.div 
            className="absolute inset-0 bg-emerald-500/5"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Ignition Flare */}
        {ignitionState === 'ignition' && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}

        <AnimatePresence mode="wait">
          {isPolishing ? (
            <motion.div
              key="polishing"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {isReady ? (
                <Zap className="w-3.5 h-3.5 fill-emerald-400/20" />
              ) : ignitionState === 'spooling' ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                   <Wand2 className="w-3.5 h-3.5 opacity-40" />
                </motion.div>
              ) : (
                <Wand2 className="w-3.5 h-3.5 opacity-20" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <span className="relative z-10">
          {isPolishing ? "POLISHING..." : isReady ? "IGNITE AI POLISH" : `SPOOLING ${charge}%`}
        </span>

        {/* Ignition Glint */}
        {isReady && !isPolishing && (
          <motion.div 
            className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
            animate={{ x: ['-150%', '150%'] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        )}
      </button>

      {/* State Label */}
      {!isReady && !isPolishing && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full text-center">
          <div className={cn(
            "text-[7px] font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-700",
            ignitionState === 'spooling' ? "text-emerald-500/40" : "text-white/10"
          )}>
            {ignitionState === 'dormant' ? "System Dormant" : "Awaiting Clarity"}
          </div>
        </div>
      )}
    </div>
  );
};
