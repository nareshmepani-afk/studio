'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PenTool, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface InstrumentSelectionProps {
    onSelect: (modality: 'pen' | 'voice') => void;
    onHoverChange?: (id: string | null) => void;
}

export const InstrumentSelection: React.FC<InstrumentSelectionProps> = ({ 
    onSelect, 
    onHoverChange 
}) => {
    const [hovered, setHovered] = useState<'pen' | 'voice' | null>(null);

    const instruments = [
        {
            id: 'pen' as const,
            label: 'Narrative Scripting',
            subLabel: 'Precision Tip Pen',
            icon: PenTool,
            colorClass: 'text-sky-400',
            bgClass: 'bg-sky-500/10',
            hoverBg: 'hover:bg-sky-500/10',
            glowClass: 'glow-scribe',
            tooltip: "Narrative Scripting. Craft your memory with precision. Best for quiet reflection and weaving specific sensory notes into your story guide.",
            pulseColor: 'rgba(56, 189, 248, 0.5)'
        },
        {
            id: 'voice' as const,
            label: 'Vocal Testimony',
            subLabel: 'Atmospheric Dictation',
            icon: Mic,
            colorClass: 'text-amber-400',
            bgClass: 'bg-amber-500/10',
            hoverBg: 'hover:bg-amber-500/10',
            glowClass: 'glow-orator',
            tooltip: "Vocal Testimony. Capture the raw emotion of your voice. Speak freely while the AI listens and transcribes your natural cadence into a structured outline.",
            pulseColor: 'rgba(245, 158, 11, 0.5)'
        }
    ];

    return (
        <div className="absolute inset-0 z-[1001] flex flex-col items-center justify-center py-20 px-6 bg-black/40 backdrop-blur-md overflow-hidden">
            
            <div className="relative w-full max-w-6xl mx-auto space-y-24">
                {/* Protocol Header */}
                <div className="text-center space-y-8">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ 
                            y: 0, 
                            opacity: 1,
                            borderColor: hovered === 'pen' ? 'rgba(56, 189, 248, 0.5)' : 
                                        hovered === 'voice' ? 'rgba(245, 158, 11, 0.5)' : 
                                        'rgba(14, 165, 233, 0.3)',
                            backgroundColor: hovered === 'pen' ? 'rgba(56, 189, 248, 0.15)' : 
                                            hovered === 'voice' ? 'rgba(245, 158, 11, 0.15)' : 
                                            'rgba(14, 165, 233, 0.1)'
                        }}
                        className={cn(
                            "inline-flex items-center gap-4 px-8 py-2.5 border rounded-full transition-all duration-700",
                            hovered ? "pulse-protocol" : ""
                        )}
                    >
                        <Sparkles className={cn(
                            "w-5 h-5 transition-colors duration-500",
                            hovered === 'pen' ? "text-sky-400" : 
                            hovered === 'voice' ? "text-amber-400" : "text-sky-400"
                        )} />
                        <span className={cn(
                            "text-[12px] font-black uppercase tracking-[0.6em] transition-colors duration-500",
                            hovered === 'pen' ? "text-sky-400" : 
                            hovered === 'voice' ? "text-amber-400" : "text-sky-400"
                        )}>Studio Entrance: Select Medium</span>
                    </motion.div>
                    
                    <div className="space-y-4">
                        <h1 className="text-6xl md:text-8xl font-headline text-white italic tracking-tighter leading-[0.9]">Choose Your Instrument</h1>
                        <p className="text-base text-white/40 font-medium tracking-[0.4em] uppercase max-w-2xl mx-auto text-center leading-relaxed">
                            Choose how you will bridge the gap between memory and legacy.
                        </p>
                    </div>
                </div>

                {/* Instrument Cards */}
                <div className="flex flex-col md:flex-row gap-16 justify-center items-center">
                    <TooltipProvider delayDuration={100}>
                        {instruments.map((inst) => (
                            <Tooltip key={inst.id}>
                                <TooltipTrigger asChild>
                                    <motion.button 
                                        whileHover={{ scale: 1.05, translateY: -12 }}
                                        whileTap={{ scale: 0.95 }}
                                        onHoverStart={() => {
                                            setHovered(inst.id);
                                            onHoverChange?.(inst.id);
                                        }}
                                        onHoverEnd={() => {
                                            setHovered(null);
                                            onHoverChange?.(null);
                                        }}
                                        onClick={() => onSelect(inst.id)}
                                        className={cn(
                                            "group relative flex flex-col items-center gap-8 p-14 rounded-[3.5rem] bg-white/[0.03] border border-white/5 transition-all duration-500 w-80 shadow-[0_40px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl",
                                            hovered && hovered !== inst.id ? "opacity-30 grayscale-[0.5] scale-95" : "opacity-100",
                                            hovered === inst.id ? cn("border-opacity-50", inst.id === 'pen' ? "border-sky-500/50 glow-scribe bg-sky-500/10" : "border-amber-500/50 glow-orator bg-amber-500/10") : ""
                                        )}
                                    >
                                        <div className={cn(
                                            "p-8 rounded-3xl transition-all duration-500 shadow-[0_0_40px_rgba(0,0,0,0.2)]",
                                            inst.bgClass,
                                            inst.colorClass,
                                            hovered === inst.id ? (inst.id === 'pen' ? "bg-sky-500 text-white" : "bg-amber-500 text-slate-900") : ""
                                        )}>
                                            <inst.icon className="w-14 h-14" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-4xl font-headline text-white italic mb-2 tracking-tight">{inst.label}</span>
                                            <span className={cn(
                                                "block text-[12px] font-black uppercase tracking-[0.5em] transition-colors duration-500",
                                                inst.id === 'pen' ? "text-sky-400/60" : "text-amber-400/60",
                                                hovered === inst.id ? "text-white/80" : ""
                                            )}>{inst.subLabel}</span>
                                        </div>
                                    </motion.button>
                                </TooltipTrigger>
                                <TooltipContent 
                                    side="bottom" 
                                    sideOffset={20}
                                    className={cn(
                                        "max-w-xs p-5 bg-[#020617]/95 border-white/10 backdrop-blur-xl shadow-2xl rounded-2xl",
                                        inst.id === 'pen' ? "text-sky-100 border-sky-500/20" : "text-amber-100 border-amber-500/20"
                                    )}
                                >
                                    <p className="text-sm font-medium leading-relaxed italic opacity-90">
                                        {inst.tooltip}
                                    </p>
                                    <div className={cn(
                                        "absolute -top-1 left-1/2 -translate-x-1/2 border-l border-t w-2 h-2 rotate-45",
                                        inst.id === 'pen' ? "bg-[#020617] border-sky-500/20" : "bg-[#020617] border-amber-500/20"
                                    )} />
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
};
