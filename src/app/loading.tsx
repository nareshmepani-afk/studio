'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[2000] bg-[#020617] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05)_0%,transparent_70%)]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative w-24 h-24 bg-slate-900 border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl overflow-hidden group">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-sky-500/10 to-transparent"
            />
            <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-4 h-4 text-sky-400/60" />
            <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.5em] animate-pulse">
              Wiring Cinematic Engine
            </h2>
          </div>
          <p className="text-[10px] font-bold text-sky-500/30 uppercase tracking-[0.2em]">
            Syncing Narratives • Calibrating Optics
          </p>
        </div>
      </motion.div>

      {/* Decorative HUD Elements */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-12 opacity-20">
         <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
         <div className="flex flex-col gap-1 items-center">
            <span className="text-[8px] font-black text-white uppercase tracking-widest">Version // 4.0</span>
            <div className="flex gap-1">
               {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-sky-500/40" />)}
            </div>
         </div>
         <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}