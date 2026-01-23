'use client';

import { useRef, useEffect } from 'react';
import { Camera, RefreshCcw, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DirectorMonitorProps {
  facingMode: 'user' | 'environment';
  onFlip: () => void;
  isRecording: boolean;
}

export function DirectorMonitor({ facingMode, onFlip, isRecording }: DirectorMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
    setupCamera();
  }, [facingMode]);

  return (
    <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Tally Light (Recording Indicator) */}
      {isRecording && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-red-600/90 rounded-full animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
        </div>
      )}

      {/* Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Camera Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        <Button 
          variant="secondary" 
          size="icon" 
          type="button"
          onClick={onFlip}
          className="rounded-full bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20"
        >
          <RefreshCcw className="w-4 h-4 text-white" />
        </Button>
        <div className="flex items-center gap-2 px-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
          <Mic className="w-3 h-3 text-blue-400" />
          <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-blue-400" /> {/* Mock Audio Meter */}
          </div>
        </div>
      </div>
    </div>
  );
}
