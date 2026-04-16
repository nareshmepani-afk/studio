'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck } from 'lucide-react';

interface SessionIdWitnessProps {
  sessionId: string | null | undefined;
}

const SessionIdWitness: React.FC<SessionIdWitnessProps> = ({ sessionId }) => {
  if (!sessionId) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed top-6 right-6 z-[9999] flex items-center gap-4 px-4 py-2.5 
                 bg-neutral-950/80 backdrop-blur-xl border border-primary/20 
                 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                 group cursor-default"
    >
      {/* Pulse indicator */}
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-primary/60" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            Secure Session
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-white tracking-wider">
            {sessionId}
          </span>
          <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
        </div>
      </div>

      {/* Decorative inner glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

export default SessionIdWitness;
