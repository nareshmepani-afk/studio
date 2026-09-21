'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ShieldAlert, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHardwarePrivacy } from '@/context/HardwarePrivacyContext';

interface OpticsPrivacyShieldProps {
  className?: string;
  compact?: boolean;
}

export function OpticsPrivacyShield({ className, compact = false }: OpticsPrivacyShieldProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { status, killAllHardwareFeeds, rearmHardware } = useHardwarePrivacy();

  const isSoundstageRoute = Boolean(
    pathname?.startsWith('/studio/production') ||
    pathname?.startsWith('/studio/remote-camera') ||
    pathname?.startsWith('/interviewer')
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 animate-pulse flex items-center justify-center',
          className
        )}
      />
    );
  }

  const isLive = status === 'live';
  const isSevered = status === 'severed';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLive) {
      killAllHardwareFeeds();
    } else if (isSevered) {
      rearmHardware();
      if (!isSoundstageRoute) {
        toast.success('Optics Re-Armed', {
          description: 'Hardware permissions restored. Feeds will activate automatically upon entering the Soundstage.',
        });
      }
    }
  };

  const getTooltipContent = () => {
    if (isLive) {
      return 'Hardware camera and microphone live. Click to sever all hardware feeds immediately.';
    }
    if (isSevered) {
      if (!isSoundstageRoute) {
        return 'Hardware policy severed. Click to re-arm camera permissions for the Soundstage.';
      }
      return 'Hardware feeds severed. Click to restore camera and microphone access.';
    }
    return 'Optics inactive. Feeds initialise automatically upon entering the soundstage.';
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-testid="optics-privacy-shield-btn"
            data-status={status}
            onClick={handleClick}
            className={cn(
              'min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl border text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 select-none shrink-0 shadow-lg',
              // State 1: Inactive (Muted slate)
              status === 'inactive' &&
                'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-700/50 text-zinc-400 cursor-default shadow-black/40',
              // State 2: Live (Pulsing red dot, amber text, cursor pointer)
              isLive &&
                'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/50 text-amber-300 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse',
              // State 3: Severed (Rose pill, cursor pointer)
              isSevered &&
                'bg-rose-950/50 hover:bg-rose-900/60 border-rose-500/50 text-rose-300 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.3)]',
              className
            )}
          >
            {status === 'inactive' && (
              <>
                <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className={cn('tracking-widest font-bold', compact && 'hidden md:inline')}>
                  🛡️ Optics Inactive
                </span>
              </>
            )}

            {isLive && (
              <>
                <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </div>
                <span className={cn('tracking-widest font-black text-amber-300', compact && 'hidden sm:inline')}>
                  🔴 CAMERA LIVE • Sever Feed ✕
                </span>
              </>
            )}

            {isSevered && (
              <>
                <Ban className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                <span className={cn('tracking-widest font-black text-rose-300', compact && 'hidden sm:inline')}>
                  {isSoundstageRoute
                    ? (compact ? '🚫 Severed • Restore' : '🚫 Optics Severed • Click to Restore')
                    : (compact ? '🚫 Severed • Re-Arm' : '🚫 Optics Severed • Re-Arm Permissions')}
                </span>
              </>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={8}
          className="bg-neutral-950 border border-white/15 text-[10px] font-bold uppercase tracking-widest px-3 py-2 text-zinc-200 shadow-2xl z-[9999]"
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
