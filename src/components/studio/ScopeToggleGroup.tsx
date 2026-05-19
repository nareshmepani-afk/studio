'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TimeframeScope } from '@/types';
import { 
  Clock, 
  Calendar, 
  Layers, 
  History,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScopeToggleGroupProps {
  value: TimeframeScope;
  onChange: (scope: TimeframeScope) => void;
  durationQuantity: number;
  onDurationChange: (qty: number) => void;
  durationUnit: 'days' | 'months' | 'years';
  onUnitChange: (unit: 'days' | 'months' | 'years') => void;
  disabled?: boolean;
}

const SCOPES: Array<{
  id: TimeframeScope;
  label: string;
  icon: any;
  description: string;
}> = [
  { 
    id: 'Moment', 
    label: 'Moment', 
    icon: Clock, 
    description: 'A snapshot of a specific, crystalline second in time.' 
  },
  { 
    id: 'Year', 
    label: 'Year', 
    icon: Calendar, 
    description: 'A focused cinematic journey from the anchor date.' 
  },
  { 
    id: 'Generation', 
    label: 'Generation', 
    icon: Layers, 
    description: 'A wider lens covering decades of family transition.' 
  },
  { 
    id: 'Legacy', 
    label: 'Legacy', 
    icon: History, 
    description: 'An epic scope traversing ancestral roots to future heritage.' 
  }
];

export const ScopeToggleGroup: React.FC<ScopeToggleGroupProps> = ({
  value,
  onChange,
  durationQuantity,
  onDurationChange,
  durationUnit,
  onUnitChange,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      {/* Scope Selector Chips */}
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {SCOPES.map((scope) => {
            const Icon = scope.icon;
            const isActive = value === scope.id;

            return (
              <Tooltip key={scope.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !disabled && onChange(scope.id)}
                    disabled={disabled}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 group",
                      isActive 
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-white/60",
                      disabled && "opacity-40 grayscale-[0.5] cursor-not-allowed"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    <span className="text-[11px] font-bold tracking-widest uppercase">
                      {scope.label}
                    </span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="activeScopeGlow"
                        className="absolute inset-0 rounded-full border border-emerald-500/50"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#0a0a0a] border-emerald-500/30 text-emerald-100 text-[11px]">
                  <p>{scope.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Duration Bridge - Revealed when 'Year' is selected (or any scope needing precision) */}
      <AnimatePresence mode="wait">
        {value === 'Year' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-4 pl-4 border-l border-emerald-500/20 py-1"
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest mb-2">
                Span Duration
              </span>
              <div className="flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden h-9">
                  <button 
                    onClick={() => !disabled && onDurationChange(Math.max(1, durationQuantity - 1))}
                    disabled={disabled}
                    className={cn(
                      "px-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors border-r border-white/10",
                      disabled && "opacity-20 cursor-not-allowed"
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <input 
                    type="number" 
                    value={durationQuantity}
                    onChange={(e) => !disabled && onDurationChange(parseInt(e.target.value) || 1)}
                    disabled={disabled}
                    className={cn(
                      "w-12 bg-transparent text-center text-sm font-mono text-emerald-400 focus:outline-none",
                      disabled && "opacity-40"
                    )}
                  />
                  <button 
                    onClick={() => !disabled && onDurationChange(durationQuantity + 1)}
                    disabled={disabled}
                    className={cn(
                      "px-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors border-l border-white/10",
                      disabled && "opacity-20 cursor-not-allowed"
                    )}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                {/* Unit Toggle */}
                <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-lg h-9 items-center">
                  {(['days', 'months', 'years'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => !disabled && onUnitChange(unit)}
                      disabled={disabled}
                      className={cn(
                        "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all",
                        durationUnit === unit 
                          ? "bg-emerald-500/20 text-emerald-400 shadow-sm" 
                          : "text-white/20 hover:text-white/40",
                        disabled && "opacity-20 cursor-not-allowed"
                      )}
                    >
                      {unit === 'years' ? 'Yrs' : unit === 'months' ? 'Mths' : 'Days'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 border-t border-dashed border-white/10 mt-4 h-px" />
            
            <div className="flex flex-col items-end opacity-40 group hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-medium text-white/60">AI SHUTTER SPEED</span>
               <span className="text-[9px] font-mono text-emerald-500/80 uppercase">
                  {durationQuantity > 10 ? 'LONG EXPOSURE' : durationQuantity > 3 ? 'STREET PHOTO' : 'HIGH SPEED'}
               </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
