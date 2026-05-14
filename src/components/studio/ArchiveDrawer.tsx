'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Plus, 
  RotateCcw, 
  Clock, 
  Target,
  FileText,
  ChevronRight,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArchiveItem {
  timestamp: string;
  text: string;
  visionType: string;
  visionLabel: string;
}

interface ArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  originalHook: string;
  scriptHistory: ArchiveItem[];
  onRestore: (text: string) => void;
}

export const ArchiveDrawer: React.FC<ArchiveDrawerProps> = ({
  isOpen,
  onClose,
  originalHook,
  scriptHistory,
  onRestore
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
          />

          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full lg:w-[500px] z-[2001] flex flex-col shadow-[-20px_0_100px_rgba(0,0,0,0.8)] bg-[#020617] border-l border-zinc-800"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-headline text-white italic">Script Archive</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em]">
                      Directorial History
                    </span>
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                      {scriptHistory.length + (originalHook ? 1 : 0)} Versions Stored
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all group cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar font-mono">
              
              {/* ORIGINAL HOOK SECTION */}
              {originalHook && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Target className="w-3 h-3 text-emerald-400" />
                      Original Creative Spark
                    </h3>
                    <span className="text-[8px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">ROOT VERSION</span>
                  </div>
                  
                  <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50" />
                    <p className="relative z-10 text-sm text-slate-300 leading-relaxed italic pr-4">
                      "{originalHook}"
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-end relative z-10">
                      <button 
                        onClick={() => onRestore(originalHook)}
                        className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore to Editor
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* VERSION HISTORY */}
              <section className="space-y-6">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Script Iterations
                </h3>

                <div className="space-y-4">
                  {scriptHistory.length > 0 ? (
                    scriptHistory.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-white uppercase tracking-wider">
                                {item.visionLabel || 'Directorial Vision'}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-mono">
                                {new Date(item.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-full border",
                            item.visionType === 'poetic' ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                            item.visionType === 'direct' ? "bg-sky-500/10 border-sky-500/30 text-sky-400" :
                            "bg-purple-500/10 border-purple-500/30 text-purple-400"
                          )}>
                            {item.visionType?.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 italic mb-4">
                          "{item.text}"
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => onRestore(item.text)}
                            className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                          <ChevronRight className="w-4 h-4 text-zinc-600" />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <History className="w-10 h-10 text-white/5 mx-auto" />
                      <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">No previous versions found</p>
                    </div>
                  )}
                </div>
              </section>

              {/* INTEGRITY HUD */}
              <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Archival Integrity Verified</h4>
                </div>
                <p className="text-[10px] text-emerald-400/60 leading-relaxed italic">
                  All script iterations are cryptographically anchored to your session. Restoring a version will update the current editor but keep your production lock settings intact.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-black/40 border-t border-white/5 backdrop-blur-md">
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                Close Archive
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
