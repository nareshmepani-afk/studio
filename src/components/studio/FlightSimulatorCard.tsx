'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, X, Coffee } from 'lucide-react';
import { FIRST_FLIGHT_FIXTURE } from '@/lib/fixtures/firstFlightFixture';

const DISMISS_KEY = 'mw_dismiss_flight_simulator';

export function FlightSimulatorCard() {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem(DISMISS_KEY) === 'true';
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setIsDismissed(true);
  };

  const handleLaunchFlight = () => {
    router.push('/studio/production/first_flight_rehearsal');
  };

  if (!mounted || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full mb-8 relative rounded-3xl overflow-hidden bg-slate-950/80 backdrop-blur-2xl border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] group"
      >
        {/* Specular Edge Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Ambient Warm Gradient Backdrop */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 via-transparent to-sky-500/10 blur-2xl opacity-50 pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Badge, Title & Sensory Script Excerpt */}
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-500/15 border border-amber-500/35 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Compass className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                🚀 FLIGHT SIMULATOR // 60s REHEARSAL
              </span>
              <span className="text-[11px] font-mono text-amber-200/90 font-semibold uppercase tracking-wider">
                Zero-Friction Practice Flight
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold text-white italic tracking-tight">
              Free Walkthrough &mdash; Experience the 5 Acts of Memory Weaver Without Writing
            </h2>

            {/* The 3-Sentence Universal Script Excerpt */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-white/90 shadow-inner">
              <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-serif italic leading-relaxed text-zinc-100">
                &ldquo;{FIRST_FLIGHT_FIXTURE.prose}&rdquo;
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              Step through the entire theatrical arc: <span className="text-amber-300 font-semibold">Hook</span> &rarr; <span className="text-amber-300 font-semibold">1-Click AI Weave</span> &rarr; <span className="text-amber-300 font-semibold">15s Prompter Take</span> &rarr; <span className="text-amber-300 font-semibold">4K Exhibition Premiere</span>. <span className="text-emerald-300/90 font-medium">Your Generational Vault progress remains untouched.</span>
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={handleLaunchFlight}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🎬 Step into Practice Flight ↗</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 text-white/40 hover:text-white/80 font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>✕ Dismiss</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
