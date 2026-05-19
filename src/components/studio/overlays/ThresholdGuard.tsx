'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThresholdGuardProps {
    currentCount: number;
    threshold: number;
    actTitle: string;
    description?: string;
}

export const ThresholdGuard: React.FC<ThresholdGuardProps> = ({
    currentCount,
    threshold,
    actTitle,
    description = "Drafting Requirements Pending"
}) => {
    const progress = Math.min((currentCount / threshold) * 100, 100);

    return (
        <div data-blueprint="ThresholdGuard" className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-12 overflow-hidden">
            {/* Glassmorphic Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[12px] surface-depth" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-xl bg-slate-900/40 border border-white/10 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sky-500/10 blur-[100px] rounded-full" />

                <div className="relative space-y-10 text-center">
                    {/* Visual Anchor */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="relative w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
                                <Lock className="w-8 h-8 text-white/20" />
                            </div>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-8px] border border-dashed border-white/10 rounded-[2.5rem]"
                            />
                        </div>
                    </div>

                    {/* Messaging */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">
                            <Wand2 className="w-3 h-3" />
                            Stage Restricted
                        </div>
                        <h2 className="text-4xl font-serif text-white italic tracking-tight">
                            {actTitle}
                        </h2>
                        <p className="text-sm text-white/40 font-medium max-w-sm mx-auto leading-relaxed">
                            {description}. The Stage is currently set for a <span className="text-white/60 text-bold italic">'Tech Scout'</span> mode.
                        </p>
                    </div>

                    {/* Progress Bar (Prestige Style) */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest px-1">
                            <span className="text-white/20">Progression</span>
                            <span className="text-emerald-400">
                                {currentCount} <span className="text-white/20">/ {threshold} Words</span>
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-emerald-500/40 via-emerald-400 to-sky-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                            />
                        </div>
                    </div>

                    {/* Action Hint */}
                    <div className="pt-4">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-white/40 uppercase tracking-widest animate-pulse">
                            <Sparkles className="w-3 h-3 text-sky-400" />
                            Return to The Scribe to Unlock
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
