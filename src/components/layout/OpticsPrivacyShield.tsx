'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function OpticsPrivacyShield() {
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const muted = localStorage.getItem('privacy_optics_muted') === 'true';
    setIsMuted(muted);

    const handleMuteChange = () => {
      setIsMuted(localStorage.getItem('privacy_optics_muted') === 'true');
    };
    window.addEventListener('privacy-optics-changed', handleMuteChange);
    return () => window.removeEventListener('privacy-optics-changed', handleMuteChange);
  }, []);

  const handleToggle = () => {
    const newValue = !isMuted;
    localStorage.setItem('privacy_optics_muted', String(newValue));
    setIsMuted(newValue);
    // Dispatch the custom event to notify all useCamera hooks instantly!
    window.dispatchEvent(new Event('privacy-optics-changed'));
  };

  if (!mounted) {
    return (
      <div className="h-9 w-28 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleToggle}
          className={cn(
            "px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer select-none",
            isMuted 
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:bg-rose-500/20"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20"
          )}
        >
          {isMuted ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-rose-400" />
              <span className="hidden sm:inline text-[9px] font-bold tracking-widest text-rose-400">Optics Muted</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[9px] font-bold tracking-widest text-emerald-400">Optics Active</span>
            </>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
        {isMuted 
          ? "Camera & Mic Securely Disabled // Click to Enable"
          : "Camera & Mic Live in Studio // Click to Mute & Secure"
        }
      </TooltipContent>
    </Tooltip>
  );
}
