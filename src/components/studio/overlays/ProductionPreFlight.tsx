'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Activity, 
  Eye, 
  Wind, 
  Music,
  AlertCircle,
  X,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetectedAnchor } from '@/hooks/studio/useDirectorInk';

interface ProductionPreFlightProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  charge: number;
  anchors: DetectedAnchor[];
  dominantType: 'aroma' | 'soundscape' | 'visual' | 'none';
  storyData: {
    title: string;
    hook: string;
  };
}

export const ProductionPreFlight: React.FC<ProductionPreFlightProps> = ({
  isOpen,
  onClose,
  onConfirm,
  charge,
  anchors,
  dominantType,
  storyData
}) => {
  const [step, setStep] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsCalibrating(true);
      const timer = setTimeout(() => setIsCalibrating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isCalibrating && isOpen) {
      const interval = setInterval(() => {
        setStep(prev => Math.min(prev + 1, 4));
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isCalibrating, isOpen]);

  const getDominantIcon = () => {
    switch (dominantType) {
      case 'aroma': return <Wind className="w-5 h-5 text-amber-400" />;
      case 'soundscape': return <Music className="w-5 h-5 text-sky-400" />;
      case 'visual': return <Eye className="w-5 h-5 text-emerald-400" />;
      default: return <Activity className="w-5 h-5 text-white/40" />;
    }
  };

  const getGhostRecommendation = () => {
    if (charge < 50) return "The weave is thin. Add more sensory anchors to deepen the clarity.";
    if (anchors.length < 3) return "Specific details act as anchors. Mention a scent or a sound to ground the scene.";
    if (dominantType === 'none') return "The frequency is balanced, but lacks a dominant sensory lead.";
    return "The scene is harmonically balanced. Proceed to the Weave.";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-slate-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Header / Scanning Line */}
            <div className="relative h-1 w-full bg-white/5 overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="p-10 flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white">
                    {isCalibrating ? "Calibrating Clarity..." : "Pre-Flight Check"}
                  </h2>
                  <p className="text-[10px] font-mono text-emerald-500/50 tracking-widest uppercase">
                    Studio Diagnostic // Act I &rarr; Act II
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors group"
                >
                  <X className="w-5 h-5 text-white/20 group-hover:text-white" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Metrics */}
                <div className="flex flex-col gap-4">
                  <DiagnosticRow 
                    label="Clarity Lock" 
                    value={`${charge}%`} 
                    icon={<Zap className="w-4 h-4" />}
                    status={charge >= 40 ? 'success' : 'warning'}
                    show={step >= 1}
                  />
                  <DiagnosticRow 
                    label="Primary Frequency" 
                    value={dominantType === 'none' ? 'NEUTRAL' : dominantType.toUpperCase()} 
                    icon={getDominantIcon()}
                    status={dominantType !== 'none' ? 'success' : 'neutral'}
                    show={step >= 2}
                  />
                  <DiagnosticRow 
                    label="Sensory Anchors" 
                    value={`${anchors.length} Detected`} 
                    icon={<Activity className="w-4 h-4" />}
                    status={anchors.length > 0 ? 'success' : 'warning'}
                    show={step >= 3}
                  />
                  <DiagnosticRow 
                    label="Inciting Memory" 
                    value={storyData.title ? 'READY' : 'MISSING'} 
                    icon={<ShieldCheck className="w-4 h-4" />}
                    status={storyData.title ? 'success' : 'error'}
                    show={step >= 4}
                  />
                </div>

                {/* Director's Guide */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: step >= 2 ? 1 : 0, x: step >= 2 ? 0 : 20 }}
                  className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">Ghost's Whisper</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed italic">
                    "{getGhostRecommendation()}"
                  </p>
                  
                  {anchors.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {anchors.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-[8px] font-mono px-2 py-1 bg-white/5 border border-white/10 rounded-md text-white/40 uppercase">
                          // {a.word}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Action */}
              <div className="flex flex-col gap-4 mt-4">
                 <button
                   onClick={onConfirm}
                   disabled={isCalibrating || !storyData.title}
                   className={cn(
                     "w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 group/btn",
                     (charge >= 40 && storyData.title)
                      ? "bg-emerald-500 text-slate-950 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
                      : "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
                   )}
                 >
                   <Play className="w-5 h-5 fill-current" />
                   Initiate The Weave
                   <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]" />
                 </button>
                 <p className="text-[9px] text-center text-white/20 uppercase tracking-[0.2em] font-mono">
                    System Protocol: ACT-II-INIT // {new Date().toLocaleTimeString()}
                 </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DiagnosticRow = ({ label, value, icon, status, show }: { 
  label: string, 
  value: string, 
  icon: React.ReactNode, 
  status: 'success' | 'warning' | 'error' | 'neutral',
  show: boolean
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: show ? 1 : 0, x: show ? 0 : -10 }}
      className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          status === 'success' ? "bg-emerald-500/10 text-emerald-400" :
          status === 'warning' ? "bg-amber-500/10 text-amber-400" :
          status === 'error' ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-white/40"
        )}>
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/80 transition-colors">
          {label}
        </span>
      </div>
      <span className={cn(
        "font-mono text-xs font-bold",
        status === 'success' ? "text-emerald-400" :
        status === 'warning' ? "text-amber-400" :
        status === 'error' ? "text-rose-400" : "text-white/20"
      )}>
        {value}
      </span>
    </motion.div>
  );
};
