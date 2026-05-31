'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Music, Volume2, Settings2, HelpCircle, AlertCircle, RefreshCw, Languages, Play } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TableReadPanelProps {
  isMinimised: boolean;
  onMinimiseToggle: (val: boolean) => void;
  isTableReadActive: boolean;
  onEngageRehearsal: () => void;
  rehearsalSpeed: number;
  onRehearsalSpeedChange: (speed: number) => void;
  interviewLanguage?: 'en' | 'gu';
  videoContainerRef: React.RefObject<any>;
}

export const TableReadPanel: React.FC<TableReadPanelProps> = ({
  isMinimised,
  onMinimiseToggle,
  isTableReadActive,
  onEngageRehearsal,
  rehearsalSpeed,
  onRehearsalSpeedChange,
  interviewLanguage = 'en',
  videoContainerRef
}) => {
  return (
    <motion.div
      drag
      dragConstraints={videoContainerRef}
      dragElastic={0.05}
      dragMomentum={false}
      initial={{ 
        scale: 0.9, 
        opacity: 0,
        height: isMinimised ? '56px' : '420px',
        width: isMinimised ? '200px' : '288px'
      }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        height: isMinimised ? '56px' : '420px',
        width: isMinimised ? '200px' : '288px',
        borderRadius: isMinimised ? '9999px' : '2.5rem'
      }}
      transition={{ 
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        height: { type: "spring", stiffness: 150, damping: 20 },
        width: { type: "spring", stiffness: 150, damping: 20 },
        borderRadius: { type: "spring", stiffness: 150, damping: 20 }
      }}
      style={{ touchAction: 'none' }}
      className={cn(
        "bg-zinc-950/85 backdrop-blur-3xl border border-white/10 p-6 shadow-2xl flex flex-col justify-between hover:bg-zinc-900/90 transition-colors duration-700 select-none cursor-grab active:cursor-grabbing",
        isMinimised && "p-3 px-4 flex-row items-center justify-between"
      )}
    >
      {isMinimised ? (
        <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">Table Read</span>
          </div>
          <button 
            onClick={() => onMinimiseToggle(false)}
            className="p-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 rounded-full transition-all cursor-pointer"
            title="Restore Panel"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar select-none">
            {/* Drag Handle */}
            <div className="w-12 h-1 rounded-full bg-white/10 mx-auto hover:bg-white/20 mb-2 transition-colors shrink-0" />

            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 text-sky-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Table Read active</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimiseToggle(true);
                }}
                className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer"
                title="Minimise Panel"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  🎙️ Voice Shadowing
                </span>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Engage rhythm-shadowing with director <strong className="text-sky-400">Achernar</strong>. Follow the synthesized flow to calibrate voice pitch.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Languages className="w-3 h-3 text-sky-400" /> Bilingual Pacing Status
                </span>
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 rounded-xl border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                    {interviewLanguage === 'gu' ? 'Gujarati (WaveNet-A)' : 'UK English (Achernar)'}
                  </span>
                </div>
              </div>

              {/* Pace Dial (Words Per Minute / Speed multiplier) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                    🎛️ Rehearsal Pace Dial
                  </span>
                  <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
                    {(rehearsalSpeed * 100).toFixed(0)} WPM
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-white/30 font-bold">Slow</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={rehearsalSpeed}
                    onChange={(e) => onRehearsalSpeedChange(Number(e.target.value))}
                    className="flex-grow accent-sky-400 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-white/30 font-bold">Fast</span>
                </div>
                <p className="text-[8.5px] text-white/40 italic leading-normal">
                  Adjust pacing specifically for the table read without altering production speed.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-2">
            <button
              onClick={onEngageRehearsal}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 active:scale-95 transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-slate-950" />
              <span>Engage Rehearsal</span>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};
