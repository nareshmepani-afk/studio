'use client';

import React, { useState } from 'react';
import {
  Info,
  Laptop,
  Smartphone,
  Sparkles,
  Lock,
  Check,
  Video,
  Mic,
  ArrowRight,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useAdaptiveSurface,
  StudioSurface,
} from '@/hooks/useAdaptiveSurface';

export interface StudioSurfaceSwitcherProps {
  currentSurface: StudioSurface;
  currentSceneId?: string;
  actStage?: string | number;
  isRecording?: boolean;
  className?: string;
}

export const StudioSurfaceSwitcher: React.FC<StudioSurfaceSwitcherProps> = ({
  currentSurface,
  currentSceneId,
  actStage,
  isRecording = false,
  className = '',
}) => {
  const {
    recommendedSurface,
    isPureTouchDevice,
    preferredSurface,
    setPreferredSurface,
    switchToSurface,
  } = useAdaptiveSurface();

  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleSelectSurface = (surface: StudioSurface) => {
    if (surface === currentSurface) return;
    switchToSurface(surface, currentSceneId, actStage, isRecording);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 p-1 rounded-full bg-stone-950/85 backdrop-blur-md border border-stone-800/80 shadow-lg select-none',
        className
      )}
      data-testid="studio-surface-switcher"
    >
      {/* Soundstage Surface Segment */}
      <button
        type="button"
        onClick={() => handleSelectSurface('soundstage')}
        disabled={isRecording}
        title={
          isRecording
            ? 'Surface switching disabled while recording'
            : currentSurface === 'soundstage'
            ? 'Currently on Desktop Soundstage'
            : 'Switch to Theatrical Soundstage'
        }
        data-testid="switcher-soundstage-btn"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono transition-all duration-300 cursor-pointer',
          currentSurface === 'soundstage'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            : 'text-stone-400 hover:text-stone-200 hover:bg-white/5 border border-transparent',
          isRecording && 'opacity-40 cursor-not-allowed hover:bg-transparent'
        )}
      >
        <span className="text-sm">🎬</span>
        <span className="hidden sm:inline">Soundstage</span>
        {currentSurface === 'soundstage' && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline" />
        )}
      </button>

      {/* Fireside Surface Segment */}
      <button
        type="button"
        onClick={() => handleSelectSurface('fireside')}
        disabled={isRecording}
        title={
          isRecording
            ? 'Surface switching disabled while recording'
            : currentSurface === 'fireside'
            ? 'Currently in Fireside Studio'
            : 'Switch to Fireside Mobile Studio'
        }
        data-testid="switcher-fireside-btn"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono transition-all duration-300 cursor-pointer',
          currentSurface === 'fireside'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
            : 'text-stone-400 hover:text-stone-200 hover:bg-white/5 border border-transparent',
          isRecording && 'opacity-40 cursor-not-allowed hover:bg-transparent'
        )}
      >
        <span className="text-sm">🔥</span>
        <span className="hidden sm:inline">Fireside</span>
        {currentSurface === 'fireside' && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse hidden sm:inline" />
        )}
      </button>

      {/* Recording Lock Indicator (Surfaced only during active take) */}
      {isRecording && (
        <span
          className="inline-flex items-center px-1.5 text-rose-400 text-[10px] font-mono font-bold animate-pulse"
          title="Surface lock engaged: stop recording to switch"
        >
          <Lock className="w-3 h-3 mr-0.5" />
          <span className="hidden md:inline">LOCKED</span>
        </span>
      )}

      {/* (i) Benefits Popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Studio Surface Benefits and Recommendations"
            className="p-1 rounded-full text-stone-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
            data-testid="switcher-info-popover-trigger"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          className="w-80 sm:w-96 p-4 bg-stone-950/95 border border-amber-500/30 text-stone-100 shadow-2xl rounded-2xl backdrop-blur-xl z-[120]"
          data-testid="switcher-info-popover-content"
        >
          <div className="space-y-3.5">
            {/* Header & Detected Recommendation */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-serif text-sm font-bold text-white">
                  Studio Surface Guide
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                {isPureTouchDevice ? 'Touch Device' : 'Desktop / Pointer'}
              </span>
            </div>

            {/* Hardware Recommendation Pill */}
            <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-300">
                {recommendedSurface === 'soundstage' ? (
                  <Monitor className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>
                  Recommended for this screen:
                  <strong className="text-white ml-1">
                    {recommendedSurface === 'soundstage'
                      ? 'Theatrical Soundstage'
                      : 'Fireside Mobile'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="space-y-2.5 text-xs">
              {/* Soundstage Card */}
              <div
                className={cn(
                  'p-2.5 rounded-xl border transition-all',
                  currentSurface === 'soundstage'
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-stone-900/40 border-stone-800 text-stone-300'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-white text-[11px]">
                    <span>🎬 Soundstage (Theatrical)</span>
                  </div>
                  <span className="text-[9px] font-mono text-stone-400">
                    Tablets • Laptops • Desktops
                  </span>
                </div>
                <ul className="text-[11px] space-y-0.5 list-disc list-inside text-stone-400">
                  <li>Full teleprompter glass with variable scroll pacing</li>
                  <li>Multi-track master reel editing & scrub timeline</li>
                  <li>4K wireless optical camera linking (Remote Lens)</li>
                </ul>
              </div>

              {/* Fireside Card */}
              <div
                className={cn(
                  'p-2.5 rounded-xl border transition-all',
                  currentSurface === 'fireside'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-stone-900/40 border-stone-800 text-stone-300'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-white text-[11px]">
                    <span>🔥 Fireside (Intimate)</span>
                  </div>
                  <span className="text-[9px] font-mono text-stone-400">
                    Smartphones • Armchair
                  </span>
                </div>
                <ul className="text-[11px] space-y-0.5 list-disc list-inside text-stone-400">
                  <li>Distraction-free single-card storytelling carousel</li>
                  <li>Tactile voice & video memo recording with audio meter</li>
                  <li>Family heirloom photo digitisation tray</li>
                </ul>
              </div>
            </div>

            {/* Persistence & Switch Action */}
            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  const target: StudioSurface =
                    currentSurface === 'soundstage' ? 'fireside' : 'soundstage';
                  setPreferredSurface(target);
                  setPopoverOpen(false);
                  handleSelectSurface(target);
                }}
                disabled={isRecording}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold uppercase tracking-wider text-[11px] font-mono flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
              >
                <span>
                  Switch to {currentSurface === 'soundstage' ? 'Fireside' : 'Soundstage'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default StudioSurfaceSwitcher;
