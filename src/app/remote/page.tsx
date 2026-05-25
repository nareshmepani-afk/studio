'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Play, Pause, FastForward, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function RemoteMobileController() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const connRef = useRef<any>(null);
  
  // Custom button feedback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRestartPressing, setIsRestartPressing] = useState(false);
  const [restartProgress, setRestartProgress] = useState(0);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sessionId || typeof window === 'undefined') return;

    let isMounted = true;
    let peerInstance: any = null;

    import('peerjs').then(({ Peer }) => {
      if (!isMounted) return;

      // Initialize mobile P2P Peer
      const peer = new Peer({
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('open', () => {
        if (!isMounted) { peer.destroy(); return; }
        
        console.log('[Remote Mobile] Peer established. Connecting to host...', sessionId);
        const conn = peer.connect(`solo-remote-${sessionId}-host`);
        
        conn.on('open', () => {
          if (!isMounted) { conn.close(); return; }
          connRef.current = conn;
          setStatus('connected');
          console.log('[Remote Mobile] Paired cleanly with Solo Stage host.');
        });

        conn.on('close', () => {
          if (isMounted) setStatus('connecting');
        });

        conn.on('error', (err) => {
          console.error('[Remote Mobile] Connection error:', err);
          if (isMounted) setStatus('error');
        });
      });

      peerInstance = peer;
    });

    return () => {
      isMounted = false;
      if (peerInstance) peerInstance.destroy();
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [sessionId]);

  const triggerHaptic = (duration: number = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const sendCommand = (type: 'PLAY_PAUSE' | 'NEXT_CUE' | 'RESTART_TAKE') => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type });
      triggerHaptic(type === 'RESTART_TAKE' ? 120 : 50);
      
      if (type === 'PLAY_PAUSE') {
        setIsPlaying(prev => !prev);
      }
    }
  };

  // 1-Second Long-Press "Hold to Confirm" logic for high-stakes Restart Take button
  const startRestartTimer = () => {
    triggerHaptic(20);
    setIsRestartPressing(true);
    setRestartProgress(0);

    const startTime = Date.now();
    const duration = 1000; // 1 second

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setRestartProgress(progress);

      if (progress >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
    }, 20);

    restartTimerRef.current = setTimeout(() => {
      sendCommand('RESTART_TAKE');
      resetRestartTimer();
    }, duration);
  };

  const resetRestartTimer = () => {
    setIsRestartPressing(false);
    setRestartProgress(0);
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-zinc-950 text-white flex flex-col justify-between p-8 select-none font-sans">
      {/* Dynamic paired status header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full transition-all duration-500",
            status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-bounce'
          )} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {status === 'connected' ? 'REMOTE AUTHORISED' : 'SYNCHRONISING CONSOLE'}
          </span>
        </div>
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Solo Controller</span>
      </div>

      {/* Central control deck */}
      <div className="flex-grow flex flex-col justify-center gap-8 py-6">
        {status === 'connected' ? (
          <>
            {/* Master Play / Pause tactile button */}
            <button
              onClick={() => sendCommand('PLAY_PAUSE')}
              className={cn(
                "w-full h-36 border rounded-[2rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl cursor-pointer select-none",
                isPlaying
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.15)]"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
              )}
            >
              {isPlaying ? <Pause className="w-10 h-10 animate-pulse" /> : <Play className="w-10 h-10" />}
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {isPlaying ? 'PAUSE SCROLLER' : 'PLAY CUE / SCROLL'}
              </span>
            </button>

            {/* Cue advance and safety restart buttons */}
            <div className="grid grid-cols-2 gap-6">
              {/* Advance Next Cue button */}
              <button
                onClick={() => sendCommand('NEXT_CUE')}
                className="h-32 bg-white/5 border border-white/10 hover:bg-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-white cursor-pointer select-none"
              >
                <FastForward className="w-6 h-6 text-zinc-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">NEXT CUE</span>
              </button>

              {/* Safety Long-Press Restart Button */}
              <div className="relative h-32 rounded-3xl overflow-hidden border border-rose-500/20 bg-white/5">
                {/* Visual loading bar behind button */}
                <div 
                  className="absolute bottom-0 left-0 w-full bg-rose-500/20 transition-all duration-75"
                  style={{ height: `${restartProgress}%` }}
                />

                <button
                  onMouseDown={startRestartTimer}
                  onMouseUp={resetRestartTimer}
                  onMouseLeave={resetRestartTimer}
                  onTouchStart={startRestartTimer}
                  onTouchEnd={resetRestartTimer}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-rose-400 cursor-pointer select-none"
                >
                  <RotateCcw className={cn("w-6 h-6", isRestartPressing && "animate-spin")} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">
                    {isRestartPressing ? `HOLDING...` : `HOLD TO\nRESTART TAKE`}
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              {status === 'error' ? 'Connection Error' : 'WAITING FOR CUE'}
            </p>
            <p className="text-[10px] text-zinc-600 max-w-xs leading-relaxed">
              Ensure you have scanned the QR code from the Solo Stage to synchronize console channels.
            </p>
          </div>
        )}
      </div>

      {/* Footer secure bar */}
      <div className="flex items-center justify-center gap-2 text-zinc-600 text-[8px] tracking-[0.2em] uppercase shrink-0 pt-6 border-t border-white/5">
        <ShieldCheck className="w-4 h-4 text-emerald-500/40" />
        P2P Encryption Active // Sealed Take Mode
      </div>
    </div>
  );
}

export default function RemotePage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-zinc-950 text-white flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <span className="text-xs uppercase tracking-widest text-zinc-500">Synchronising Console...</span>
      </div>
    }>
      <RemoteMobileController />
    </Suspense>
  );
}
