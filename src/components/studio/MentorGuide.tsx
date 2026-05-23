'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Wind, Music, Eye, Zap } from 'lucide-react';
import { useStudioMentor, MentorWhisper } from '@/context/StudioMentorContext';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MentorGuideProps {
  active?: boolean;
  onClose?: () => void;
  whisper?: MentorWhisper;
  onApplySeed?: (seed: string) => void;
}

export const MentorGuide: React.FC<MentorGuideProps> = ({
  active,
  onClose,
  whisper,
  onApplySeed
}) => {
  const mentor = useStudioMentor();
  const state = useStudioState();

  const prevStageRef = React.useRef(state.currentStage);
  React.useEffect(() => {
    if (state.currentStage !== prevStageRef.current) {
      mentor.closeOverlay();
      prevStageRef.current = state.currentStage;
    }
  }, [state.currentStage, mentor]);

  React.useEffect(() => {
    if (state.currentStage === 1) {
      const seen = localStorage.getItem('mw_mentor_act2_toast_seen');
      if (!seen) {
        localStorage.setItem('mw_mentor_act2_toast_seen', 'true');
        toast("Whisper", {
          description: "The Architect has prepared your takes. Open the drawer below to choose your path.",
          icon: "🧠",
          duration: 8000,
        });
      }
    }
  }, [state.currentStage]);

  const isOverlayOpen = active !== undefined ? active : mentor.isOverlayOpen;
  const handleClose = onClose || mentor.closeOverlay;
  const currentWhisper = whisper || mentor.getWhisper(state.currentStage);

  return (
    <AnimatePresence>
      {isOverlayOpen && currentWhisper && (
        <>
          {/* Studio Dim Effect */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-[200] pointer-events-auto"
            onClick={handleClose}
          />

          {/* Mentor Persona & Whisper */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[210] pointer-events-none"
          >
            <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-[3rem] p-10 shadow-[0_30px_100px_rgba(16,185,129,0.2)] backdrop-blur-2xl pointer-events-auto relative overflow-hidden">
              {/* Animated Background Pulse */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]"
              />

              <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                {/* Mentor Avatar Icon */}
                <div className="relative">
                  <div className={cn(
                    "w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 transition-all",
                    state.currentStage === 1 && "shadow-[0_0_30px_rgba(16,185,129,0.6)] border-emerald-400 bg-emerald-500/20"
                  )}>
                    <Sparkles className={cn("w-10 h-10 text-emerald-400", state.currentStage === 1 && "animate-pulse")} />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-[-10px] inset-y-[-10px] border border-dashed border-emerald-500/20 rounded-full"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/60">Studio Mentor // Lifeline</h3>
                  <p className="text-2xl text-white font-medium leading-relaxed italic serif">
                    "{currentWhisper.whisper}"
                  </p>
                </div>

                {/* Contextual Tools */}
                {currentWhisper.seeds && (
                  <div className="grid grid-cols-3 gap-4 w-full">
                    {currentWhisper.seeds.map((seed, idx) => (
                      <button
                        key={idx}
                        onClick={() => onApplySeed?.(seed.label)}
                        className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 group-hover:bg-emerald-500/20 transition-all">
                          {seed.type === 'aroma' && <Wind className="w-4 h-4 text-amber-400" />}
                          {seed.type === 'soundscape' && <Music className="w-4 h-4 text-sky-400" />}
                          {seed.type === 'visual' && <Eye className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{seed.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {currentWhisper.act === 3 && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                       <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Clarity Calibration Active</span>
                    </div>
                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        className="h-full bg-emerald-500"
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                       />
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleClose}
                  className="px-8 py-3 bg-white text-slate-950 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl cursor-pointer"
                >
                  Return to Studio
                </button>
              </div>

              {/* Close Button Top Right */}
              <button 
                onClick={handleClose}
                className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
