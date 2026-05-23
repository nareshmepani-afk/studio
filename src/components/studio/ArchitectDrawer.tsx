'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Sparkles, Compass } from 'lucide-react';

interface ArchitectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  originalHook: string;
  activeVisionLabel?: string;
  activeVision?: string;
}

export const ArchitectDrawer: React.FC<ArchitectDrawerProps> = ({
  isOpen,
  onClose,
  originalHook,
  activeVisionLabel,
  activeVision
}) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full lg:w-[450px] z-[1000] flex flex-col shadow-[-20px_0_100px_rgba(0,0,0,0.8)] bg-slate-950/95 backdrop-blur-3xl border-l border-white/10"
    >
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-headline text-white italic">Architect's Drawer</h2>
            <p className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.3em]">Committed Script</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all cursor-pointer"
          aria-label="Close Architect's Drawer"
        >
          <Plus className="w-6 h-6 rotate-45" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400/80" />
            {activeVisionLabel || activeVision ? (
              (activeVisionLabel || activeVision || '').replace(/-/g, ' ').toUpperCase()
            ) : (
              "Act I Core Hook"
            )}
          </h3>
          
          <div className="relative group">
            {/* Ambient background glow */}
            <div className="absolute -inset-px bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />
            
            <div className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-6 text-white/80 min-h-[150px] leading-relaxed text-sm italic font-serif shadow-inner">
              {originalHook ? (
                originalHook
              ) : (
                <span className="text-white/30">No committed script has been side-loaded. Return to Act I to draft your hook.</span>
              )}
            </div>
          </div>
        </div>

        {/* Guidance and insights */}
        <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-3xl p-6 space-y-3">
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Architect's Notes
          </h4>
          <p className="text-xs text-white/60 leading-relaxed font-sans">
            This drawer preserves your original script from Act I. Use it to keep your sensory weaving grounded. As you synthesise new elements, make sure they align with this core narrative vision.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
