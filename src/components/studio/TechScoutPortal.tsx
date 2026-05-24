'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2, Mic, MicOff } from 'lucide-react';

interface TechScoutPortalProps {
  isMirrored?: boolean;
}

export const TechScoutPortal: React.FC<TechScoutPortalProps> = ({ isMirrored = true }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micActive, setMicActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    // Ask for both Video and Audio to perform camera scout and mic check
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 }, 
        height: { ideal: 480 },
        facingMode: 'user'
      }, 
      audio: true 
    })
    .then(s => {
      activeStream = s;
      setStream(s);
      setLoading(false);
      
      // Bind video element
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }

      // Initialize Web Audio API for Mic Check
      const audioTracks = s.getAudioTracks();
      if (audioTracks.length > 0) {
        setMicActive(true);
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(s);
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            setAudioLevel(average); // Range ~ 0 to 255
            animationFrameRef.current = requestAnimationFrame(checkVolume);
          };

          checkVolume();
        } catch (e) {
          console.warn("[TechScout] Audio Context creation failed:", e);
        }
      }
    })
    .catch(err => {
      console.warn("[TechScout] Camera/Mic access denied or unavailable:", err);
      setError(true);
      setLoading(false);
    });

    // Cleanup: Securely release all camera/microphone hardware slots
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.warn("Failed to close AudioContext:", err));
      }
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  // Compute mic pulse scale based on real-time audio input
  // Map range [0, 80] to pulse width scale
  const micPulseScale = Math.min(1 + (audioLevel / 120), 1.6);
  // Is user currently speaking at a noticeable volume?
  const isSpeaking = audioLevel > 15;

  return (
    <div className="relative w-44 h-44 rounded-full overflow-hidden border border-emerald-500/20 bg-slate-950 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.12)] group-hover:border-emerald-500/40 transition-all duration-700">
      
      {/* 1. Mirrored Live Video Stream */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 pointer-events-none ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />
      )}

      {/* 2. Backdrop Blur & Gradient Layer to make it "backstage / dreamlike" */}
      <div 
        className="absolute inset-0 backdrop-blur-[14px] bg-gradient-to-t from-slate-950/85 via-slate-900/10 to-transparent pointer-events-none transition-all duration-700 group-hover:backdrop-blur-[8px]"
        style={{ mixBlendMode: 'normal' }}
      />

      {/* 3. Tech-Scout HUD Watermarks */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center p-4">
        {loading && (
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400/80" />
        )}
        
        {error && (
          <div className="flex flex-col items-center gap-1">
            <CameraOff className="w-5 h-5 text-rose-500/70" />
            <span className="text-[8px] font-mono tracking-widest text-white/30 uppercase">Offline</span>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col items-center gap-2 transition-all duration-500">
            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-lg">
              <Camera className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-[8px] font-mono tracking-[0.2em] text-emerald-400 uppercase font-bold">Scouting</span>
            </div>
            
            {/* Dynamic Mic Level HUD */}
            <div className="flex items-center gap-1">
              {micActive ? (
                <div className="flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded-md border border-white/5">
                  <Mic className={`w-2.5 h-2.5 transition-colors ${isSpeaking ? 'text-emerald-400' : 'text-white/40'}`} />
                  {/* The Audio level pulse indicator dot */}
                  <div className="relative w-1.5 h-1.5 rounded-full bg-white/20 flex items-center justify-center">
                    <div 
                      className={`absolute w-full h-full rounded-full transition-all duration-75 ${isSpeaking ? 'bg-emerald-400' : 'bg-emerald-500/40'}`}
                      style={{ 
                        transform: `scale(${micPulseScale})`,
                        boxShadow: isSpeaking ? '0 0 8px #34d399' : 'none'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-md">
                  <MicOff className="w-2.5 h-2.5 text-rose-400/60" />
                  <span className="text-[6px] font-mono tracking-wider text-rose-400/60 uppercase">Muted</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Aesthetic rotating dial */}
      <div className="absolute inset-1.5 rounded-full border border-dashed border-white/5 pointer-events-none animate-[spin_150s_linear_infinite]" />
    </div>
  );
};
