'use client';

/**
 * 📍 MemoryCoordinatesBar
 *
 * Shared Narrative Primitive extracting:
 * 1. MEMORY COORDINATES: City / Venue, Country
 * 2. MEMORY MARK: Day, Month, Year, I Was (Age Stepper)
 *
 * Unified across:
 * - Desktop Soundstage (MemoryForm.tsx Act I Scriptorium)
 * - Fireside Mobile Studio (SingleCardPromptCarousel.tsx)
 *
 * Governance:
 * - Rule 14: Story Hook Fallback & Text Preservation Hierarchy
 * - Rule 20: British English Orthography Standard
 * - Item 51.1: Shared Narrative Primitives & Cross-Surface Parity
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Lock,
  Minus,
  Plus,
  ChevronDown,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MONTHS } from '@/utils/dateFormatter';
import { AnimatePresence, motion } from 'framer-motion';

export const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
export const YEARS = Array.from({ length: 150 }, (_, i) => (2026 - i).toString());

export const RequiredIndicator = () => (
  <span className="ml-2 text-[9px] font-black text-rose-500/60 uppercase tracking-[0.2em]">
    * Required
  </span>
);

export interface StudioSelectProps {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  dataTestId?: string;
}

export const StudioSelect = ({
  value,
  onChange,
  items,
  placeholder = '-',
  disabled = false,
  dataTestId,
}: StudioSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedItem = items.find(
    (i) =>
      i.value === value ||
      i.label.toLowerCase() === value?.toLowerCase() ||
      (typeof value === 'string' &&
        value.length >= 3 &&
        i.label.toLowerCase() === value.substring(0, 3).toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef} data-testid={dataTestId}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 text-[12px] sm:text-[13px] font-black uppercase tracking-[0.25em] text-white hover:text-emerald-400 transition-all focus:outline-none min-w-[28px] justify-start cursor-pointer',
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
        )}
      >
        <span className={cn(value === 'none' && 'text-white/20')}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-white/20 transition-transform duration-300',
            isOpen && 'rotate-180 text-emerald-400'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-3 z-[100] min-w-[120px] max-h-64 overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 custom-scrollbar"
          >
            <div className="p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onChange('none');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:bg-white/5 hover:text-white/60 rounded-lg transition-all cursor-pointer"
              >
                {placeholder}
              </button>
              {items.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-between group cursor-pointer',
                    value === item.value
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {item.label}
                  {value === item.value && (
                    <motion.div
                      layoutId="active-dot"
                      className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface MemoryCoordinatesBarProps {
  location: string;
  country: string;
  day: string;
  month: string;
  year: string;
  narratorAgeAtTime: number;
  onChangeLocation: (val: string) => void;
  onChangeCountry: (val: string) => void;
  onChangeDay: (val: string) => void;
  onChangeMonth: (val: string) => void;
  onChangeYear: (val: string) => void;
  onChangeAge: (val: number) => void;
  isProductionLocked?: boolean;
  onActivity?: () => void;
  onFocusField?: (field: 'metadata') => void;
  variant?: 'soundstage' | 'fireside';
  className?: string;
}

export const MemoryCoordinatesBar: React.FC<MemoryCoordinatesBarProps> = ({
  location,
  country,
  day,
  month,
  year,
  narratorAgeAtTime,
  onChangeLocation,
  onChangeCountry,
  onChangeDay,
  onChangeMonth,
  onChangeYear,
  onChangeAge,
  isProductionLocked = false,
  onActivity,
  onFocusField,
  variant = 'soundstage',
  className,
}) => {
  const isFireside = variant === 'fireside';

  return (
    <div
      data-testid="memory-coordinates-bar"
      id="memory-coordinates-bar"
      className={cn(
        'w-full transition-all',
        isFireside
          ? 'bg-stone-950/80 border border-stone-800/80 rounded-2xl p-3 sm:p-4 shadow-lg backdrop-blur-md'
          : 'flex flex-wrap gap-x-16 gap-y-10 pl-2 relative z-[1010]',
        className
      )}
    >
      {isFireside && <div data-testid="fireside-memory-coordinates-bar" className="sr-only" />}
      <div
        className={cn(
          'flex flex-wrap items-center',
          isFireside ? 'gap-4 sm:gap-6 justify-between' : 'gap-x-16 gap-y-10'
        )}
      >
        {/* --- 1. MEMORY COORDINATES (City & Country) --- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black text-emerald-400/80 uppercase tracking-[0.3em] flex items-center">
              Memory Coordinates <RequiredIndicator />
            </span>
            {isFireside && (
              <span className="sr-only" data-testid="fireside-meta-city">
                {location?.toUpperCase()}
              </span>
            )}
            {isFireside && (
              <span className="sr-only" data-testid="fireside-meta-country">
                {country?.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 group/meta relative z-[1020] pointer-events-auto">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/meta:border-emerald-500/50 transition-all shrink-0">
              <MapPin className="w-4 h-4 text-emerald-400/70 group-hover/meta:text-emerald-400 transition-colors" />
            </div>

            <div
              className={cn(
                'flex items-center gap-2 sm:gap-3 transition-all',
                isProductionLocked && 'opacity-30 blur-[0.5px]'
              )}
            >
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col">
                      <span className="text-[9px] sm:text-[10px] text-white/60 font-black uppercase tracking-widest mb-0.5">
                        City / Venue
                      </span>
                      <input
                        id="catalyst-location"
                        data-testid="memory-coordinates-city"
                        value={location}
                        onChange={(e) => {
                          onChangeLocation(e.target.value);
                          onActivity?.();
                        }}
                        onFocus={() => onFocusField?.('metadata')}
                        placeholder="WHERE DID IT HAPPEN?"
                        readOnly={isProductionLocked}
                        className={cn(
                          'bg-transparent border-none text-[11px] font-black uppercase tracking-[0.15em] text-white focus:text-emerald-400 focus:outline-none w-44 sm:w-56 placeholder:text-white/40 transition-all',
                          isProductionLocked && 'cursor-not-allowed'
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  {isProductionLocked && (
                    <TooltipContent className="bg-amber-950 border-amber-500/30 text-amber-200 text-[10px] font-bold uppercase tracking-widest px-4 py-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        FIELD LOCKED BY PRODUCTION
                      </div>
                      <p className="text-[8px] opacity-60 font-normal mt-1 lowercase">
                        Release lock to edit coordinates
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>

                <div className="w-px h-7 sm:h-8 bg-white/10 mx-1 sm:mx-2" />

                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col">
                      <span className="text-[9px] sm:text-[10px] text-white/60 font-black uppercase tracking-widest mb-0.5">
                        Country
                      </span>
                      <input
                        id="catalyst-country"
                        data-testid="memory-coordinates-country"
                        value={country}
                        onChange={(e) => {
                          onChangeCountry(e.target.value);
                          onActivity?.();
                        }}
                        onFocus={() => onFocusField?.('metadata')}
                        placeholder="REGION"
                        readOnly={isProductionLocked}
                        className={cn(
                          'bg-transparent border-none text-[11px] font-black uppercase tracking-[0.15em] text-white focus:text-emerald-400 focus:outline-none w-24 sm:w-32 placeholder:text-white/40 transition-all',
                          isProductionLocked && 'cursor-not-allowed'
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  {isProductionLocked && (
                    <TooltipContent className="bg-amber-950 border-amber-500/30 text-amber-200 text-[10px] font-bold uppercase tracking-widest px-4 py-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        FIELD LOCKED BY PRODUCTION
                      </div>
                      <p className="text-[8px] opacity-60 font-normal mt-1 lowercase">
                        Release lock to edit coordinates
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* --- 2. MEMORY MARK (Day, Month, Year, I Was) --- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black text-emerald-400/80 uppercase tracking-[0.3em] flex items-center">
              Memory Mark <RequiredIndicator />
            </span>
            {isFireside && (
              <span className="sr-only" data-testid="fireside-meta-year">
                {year}
              </span>
            )}
            {isFireside && (
              <span className="sr-only" data-testid="fireside-meta-age">
                I WAS: {narratorAgeAtTime ? narratorAgeAtTime : '-'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 group/meta relative z-[1005] pointer-events-auto">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/meta:border-emerald-500/50 transition-all shrink-0">
              <Calendar className="w-4 h-4 text-emerald-400/70 group-hover/meta:text-emerald-400 transition-colors" />
            </div>

            <div
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 transition-all',
                isProductionLocked && 'opacity-30 blur-[0.5px]'
              )}
            >
              <TooltipProvider>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                  {/* Day */}
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-white/60 font-black uppercase tracking-widest mb-0.5">
                      Day
                    </span>
                    <StudioSelect
                      dataTestId="memory-mark-day"
                      value={day}
                      onChange={(v) => {
                        onChangeDay(v);
                        onActivity?.();
                      }}
                      items={DAYS.map((d) => ({ value: d, label: d }))}
                      disabled={isProductionLocked}
                    />
                  </div>

                  <div className="w-px h-7 sm:h-8 bg-white/10 mx-0.5 sm:mx-1" />

                  {/* Month */}
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-white/60 font-black uppercase tracking-widest mb-0.5">
                      Month
                    </span>
                    <StudioSelect
                      dataTestId="memory-mark-month"
                      value={month}
                      onChange={(v) => {
                        onChangeMonth(v);
                        onActivity?.();
                      }}
                      items={MONTHS.map((m, i) => ({
                        value: (i + 1).toString(),
                        label: m.substring(0, 3).toUpperCase(),
                      }))}
                      disabled={isProductionLocked}
                    />
                  </div>

                  <div className="w-px h-7 sm:h-8 bg-white/10 mx-0.5 sm:mx-1" />

                  {/* Year */}
                  <div id="catalyst-year" className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-white/60 font-black uppercase tracking-widest mb-0.5">
                      Year
                    </span>
                    <StudioSelect
                      dataTestId="memory-mark-year"
                      value={year}
                      onChange={(v) => {
                        onChangeYear(v);
                        onActivity?.();
                      }}
                      items={YEARS.map((y) => ({ value: y, label: y }))}
                      disabled={isProductionLocked}
                    />
                  </div>

                  <div className="w-px h-7 sm:h-8 bg-white/10 mx-0.5 sm:mx-1" />

                  {/* I Was (Age Stepper) */}
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-white/60 font-black uppercase tracking-widest mb-0.5">
                      I Was
                    </span>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          data-testid="memory-mark-age"
                          className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-1 hover:border-emerald-500/50 transition-all h-[32px] sm:h-[34px] relative z-[1020] pointer-events-auto"
                        >
                          <button
                            type="button"
                            data-testid="memory-mark-age-minus"
                            onClick={() => {
                              if (isProductionLocked) return;
                              const newAge = Math.max(0, narratorAgeAtTime - 1);
                              onChangeAge(newAge);
                              onActivity?.();
                            }}
                            className={cn(
                              'text-white/40 hover:text-white transition-all active:scale-75 disabled:opacity-20 cursor-pointer p-0.5 relative z-[1030] pointer-events-auto',
                              isProductionLocked && 'cursor-not-allowed'
                            )}
                            disabled={isProductionLocked}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span
                            className="text-[11px] font-black text-white min-w-[18px] text-center select-none"
                            data-testid="memory-mark-age-value"
                          >
                            {narratorAgeAtTime ? narratorAgeAtTime : '-'}
                          </span>
                          <button
                            type="button"
                            data-testid="memory-mark-age-plus"
                            onClick={() => {
                              if (isProductionLocked) return;
                              const newAge = Math.min(120, narratorAgeAtTime + 1);
                              onChangeAge(newAge);
                              onActivity?.();
                            }}
                            className={cn(
                              'text-white/40 hover:text-white transition-all active:scale-75 disabled:opacity-20 cursor-pointer p-0.5 relative z-[1030] pointer-events-auto',
                              isProductionLocked && 'cursor-not-allowed'
                            )}
                            disabled={isProductionLocked}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </TooltipTrigger>
                      {isProductionLocked && (
                        <TooltipContent className="bg-amber-950 border-amber-500/30 text-amber-200 text-[10px] font-bold uppercase tracking-widest px-4 py-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Lock className="w-3 h-3" />
                            AGE STEPPER LOCKED
                          </div>
                          <p className="text-[8px] opacity-60 font-normal mt-1 lowercase">
                            Release lock to edit age
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryCoordinatesBar;
