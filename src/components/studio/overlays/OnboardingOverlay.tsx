'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: (quiet?: boolean) => void;
}

export function OnboardingOverlay({ isOpen, onClose }: OnboardingOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose(true); // Quiet Dismiss on ESC
      } else if (e.key === 'Enter' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onClose(false); // Begin Production on ENTER
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            transition: { 
              delay: 0.4, // Backdrop stays slightly longer
              duration: 0.8,
              ease: "easeInOut" 
            } 
          }}
          onClick={() => onClose(true)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-[40px] cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full p-12 relative cursor-default"
          >
            {/* Top-Right Dismiss 'X' Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose(true);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-all cursor-pointer z-20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              aria-label="Dismiss Director Briefing"
              data-hotspot-id="HS_BRIEFING_CLOSE_X_BTN"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cinematic Background Glow */}
            <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ 
                opacity: 0, 
                y: -10, 
                filter: "blur(10px)",
                transition: { duration: 0.4, ease: "easeIn" } 
              }}
              className="relative z-10 space-y-12 text-center"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <Sparkles className="w-8 h-8 text-emerald-400" />
                  </div>
                </motion.div>
                
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/60">Production Intelligence</h4>
                  <h1 className="text-5xl font-headline text-white tracking-tight">Director’s Briefing</h1>
                </div>
              </div>

              <div className="space-y-8 text-zinc-400 text-lg leading-relaxed font-light">
                <div className="space-y-4">
                  <p>Welcome to the Stage, Director.</p>
                  <div className="space-y-1.5 border-l-2 border-emerald-500/20 pl-6 py-1 max-w-fit mx-auto text-left">
                    <p className="text-white font-medium italic">
                      "Act I: The Inciting Memory is your film’s script."
                    </p>
                    <p className="text-emerald-400/70 font-medium italic text-[15px]">
                      "Act II: The Weave is the fusion of the script and stage performance."
                    </p>
                  </div>
                </div>
                
                <p className="max-w-md mx-auto">
                  Every sensory detail you anchor here—a <span className="text-emerald-400/80 font-medium">scent</span>, a <span className="text-emerald-400/80 font-medium">sound</span>, a <span className="text-emerald-400/80 font-medium">specific color</span>—will power the cinematic weave in <span className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-[13px] border-b border-emerald-500/30 pb-0.5">Act II</span>. 
                </p>
                
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-black">
                  Invest your vision now to build the foundation of your theatrical masterpiece.
                </p>
              </div>

              <div className="space-y-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(false);
                  }}
                  data-hotspot-id="HS_BRIEFING_BEGIN_PRODUCTION_BTN"
                  className="group relative px-8 py-4 bg-emerald-500 text-slate-950 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 mx-auto shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all hover:shadow-[0_25px_50px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  Begin Production
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.button>

                <div className="flex items-center justify-center gap-4 text-[9px] text-zinc-500 uppercase tracking-[0.25em] font-black">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(false);
                    }}
                    data-hotspot-id="HS_BRIEFING_ENTER_BEGIN_BTN"
                    className="hover:text-emerald-400 transition-colors cursor-pointer group flex items-center gap-1.5 focus:outline-none"
                  >
                    <span>Press</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono group-hover:border-emerald-500/50 group-hover:text-emerald-300 transition-colors">ENTER</kbd>
                    <span>to Begin</span>
                  </button>

                  <span className="text-zinc-700">•</span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(true);
                    }}
                    data-hotspot-id="HS_BRIEFING_ESC_DISMISS_BTN"
                    className="hover:text-zinc-200 transition-colors cursor-pointer group flex items-center gap-1.5 focus:outline-none"
                  >
                    <span>Press</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono group-hover:border-zinc-500 group-hover:text-white transition-colors">ESC</kbd>
                    <span>to Dismiss</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
