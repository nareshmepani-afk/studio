'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Users, Video, Volume2, ShieldAlert } from 'lucide-react';
import { TechScoutPortal } from './TechScoutPortal';
import { useStudioState } from '@/hooks/studio/useStudioState';

interface StudioLobbyProps {
  onConfirm: (mode: 'solo' | 'collaborative' | 'guest') => void;
}

export const StudioLobby: React.FC<StudioLobbyProps> = ({ onConfirm }) => {
  const { currentStage } = useStudioState();
  const [selectedStation, setSelectedStation] = useState<'solo' | 'collaborative' | 'guest'>('solo');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Circle Dimensions for Film Leader Radial SVG Progress
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 30) * circumference;

  // Start the countdown on mount
  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.05) {
            clearInterval(countdownIntervalRef.current!);
            setIsPaused(true);
            return 0;
          }
          return Number((prev - 0.05).toFixed(2));
        });
      }, 50); // 20 frames per second for ultra-smooth circular drain
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isPaused, timeLeft]);

  const handlePause = () => {
    setIsPaused(true);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  const handleResume = () => {
    if (timeLeft > 0 && selectedStation === 'solo') {
      setIsPaused(false);
    }
  };

  const handleStationHover = (station: 'solo' | 'collaborative' | 'guest') => {
    if (station !== 'solo') {
      // Pause immediately when hovering over secondary modalities
      handlePause();
    } else {
      // Resume if they return to Solo Booth
      handleResume();
    }
  };

  const handleSelectStation = (station: 'solo' | 'collaborative' | 'guest') => {
    if (selectedStation === station) {
      handlePause();
      onConfirm(station);
    } else {
      setSelectedStation(station);
      handlePause(); // Once manually clicked/focused, disable auto-roll
    }
  };

  const handleProceed = () => {
    handlePause();
    onConfirm(selectedStation);
  };

  // Compute film leader integer for vintage display
  const filmLeaderNumber = Math.max(1, Math.ceil(timeLeft));

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 pb-36 bg-gradient-to-b from-slate-950 via-[#04040a] to-slate-950 min-h-[calc(100vh-160px)]">
      
      {/* Title Header */}
      <div className="text-center max-w-2xl mb-8 select-none">
        <span className="font-mono text-[9px] tracking-[0.5em] text-white/40 uppercase block mb-3">ACT III // PREPARATION</span>
        <h1 className="text-4xl font-headline tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-purple-400 uppercase mb-4">
          THE STAGE DOOR
        </h1>
        <p className="text-sm font-light text-white/50 tracking-wide">
          Your narrative blueprint is secured. Settle in, calibrate your coordinates, and step up to your recording station.
        </p>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full mb-8">

        {/* 1. SOLO BOOTH (Primary Stage) */}
        <div
          onMouseEnter={() => handleStationHover('solo')}
          onClick={() => handleSelectStation('solo')}
          className={`relative rounded-3xl p-6 border transition-all duration-700 cursor-pointer overflow-hidden group flex flex-col items-center text-center ${
            selectedStation === 'solo'
              ? 'bg-gradient-to-b from-emerald-500/10 via-purple-500/5 to-slate-950 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.15)] scale-[1.03]'
              : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.04]'
          }`}
        >
          {/* Glowing Ambient Backdrop */}
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent opacity-40 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          
          {/* Tech Scout Portal Container */}
          <div className="mb-6 z-10">
            <TechScoutPortal isMirrored={true} />
          </div>

          <div className="z-10 mt-2 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <h2 className="text-lg font-headline tracking-widest text-emerald-400 uppercase">SOLO BOOTH</h2>
            </div>
            <span className="font-mono text-[9px] tracking-widest text-purple-400/80 uppercase px-2 py-0.5 rounded-md border border-purple-500/10 bg-purple-950/20">Authorized Path</span>
          </div>

          <p className="text-xs text-white/50 leading-relaxed font-light mb-6 px-4 z-10">
            A quiet space for solitary reflection. Use the aligned prompter system and capture your memory in absolute authenticity.
          </p>

          {/* Radial SVG Countdown Indicator */}
          {selectedStation === 'solo' && timeLeft > 0 && !isPaused ? (
            <div className="flex items-center gap-3 bg-black/40 border border-emerald-500/20 py-2 px-4 rounded-full z-10 backdrop-blur-md">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="2.5"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-75"
                  />
                </svg>
                
                {/* Film Leader Number Fading In/Out */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={filmLeaderNumber}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      transition={{ duration: 0.15 }}
                      className="font-serif text-sm font-bold text-white/80"
                    >
                      {filmLeaderNumber}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase animate-pulse">Auto-rolling</span>
            </div>
          ) : (
            selectedStation === 'solo' && (
              timeLeft === 0 ? (
                <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 py-1.5 px-4 rounded-full z-10 backdrop-blur-md animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                  <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">
                    Setup Complete // Ready
                  </span>
                </div>
              ) : (
                <div className="text-[9px] font-mono tracking-widest text-white/30 uppercase bg-white/5 py-1 px-3 rounded-full z-10 border border-white/5">
                  Setup paused
                </div>
              )
            )
          )}
        </div>

        {/* 2. COLLABORATIVE STAGE (The Ensemble) */}
        <div
          onMouseEnter={() => handleStationHover('collaborative')}
          onClick={() => handleSelectStation('collaborative')}
          className={`relative rounded-3xl p-6 border transition-all duration-700 cursor-pointer overflow-hidden group flex flex-col items-center justify-between text-center ${
            selectedStation === 'collaborative'
              ? 'bg-gradient-to-b from-cyan-500/10 via-slate-900/5 to-slate-950 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.15)] scale-[1.03]'
              : 'bg-white/[0.02] border-white/5 hover:border-cyan-500/20 hover:bg-white/[0.04]'
          }`}
        >
          {/* Glowing Ambient Backdrop */}
          <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 via-transparent to-transparent opacity-20 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          
          <div className="flex flex-col items-center z-10 mt-4 w-full">
            <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(6,182,212,0.05)] group-hover:border-cyan-400/50 transition-all duration-500">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
              <h2 className="text-lg font-headline tracking-widest text-cyan-400 uppercase">COLLAB SUITE</h2>
            </div>
            <span className="font-mono text-[9px] tracking-widest text-cyan-400/60 uppercase">Ensemble Session</span>

            <p className="text-xs text-white/50 leading-relaxed font-light mt-6 mb-4 px-4">
              A shared screen architecture. Invite co-narrators, merge video feeds, and sync peer-to-peer audio to paint group timelines.
            </p>
          </div>

          <div className="w-full px-4 mb-4 z-10">
            <div className="text-[9px] font-mono text-cyan-400/60 border border-cyan-500/10 bg-cyan-950/10 py-1.5 rounded-xl uppercase tracking-wider">
              Dual-Weave Enabled
            </div>
          </div>
        </div>

        {/* 3. GUEST DIRECTOR (The Masterclass) */}
        <div
          onMouseEnter={() => handleStationHover('guest')}
          onClick={() => handleSelectStation('guest')}
          className={`relative rounded-3xl p-6 border transition-all duration-700 cursor-pointer overflow-hidden group flex flex-col items-center justify-between text-center ${
            selectedStation === 'guest'
              ? 'bg-gradient-to-b from-amber-500/10 via-slate-900/5 to-slate-950 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.15)] scale-[1.03]'
              : 'bg-white/[0.02] border-white/5 hover:border-amber-500/20 hover:bg-white/[0.04]'
          }`}
        >
          {/* Glowing Ambient Backdrop */}
          <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 via-transparent to-transparent opacity-20 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          
          <div className="flex flex-col items-center z-10 mt-4 w-full">
            <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-amber-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.05)] group-hover:border-amber-400/50 transition-all duration-500">
              <Video className="w-6 h-6 text-amber-400" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
              <h2 className="text-lg font-headline tracking-widest text-amber-400 uppercase">DIRECTOR CHAIR</h2>
            </div>
            <span className="font-mono text-[9px] tracking-widest text-amber-400/60 uppercase">Remote Guidance</span>

            <p className="text-xs text-white/50 leading-relaxed font-light mt-6 mb-4 px-4">
              Step back and let a professional take the helm. A remote director manages your prompter speed, cues your takes, and directs your setup.
            </p>
          </div>

          <div className="w-full px-4 mb-4 z-10">
            <div className="text-[9px] font-mono text-amber-400/60 border border-amber-500/10 bg-amber-950/10 py-1.5 rounded-xl uppercase tracking-wider">
              Perfect for Legacies
            </div>
          </div>
        </div>

      </div>

      {/* Manual Action Gate */}
      <div className="flex flex-col items-center gap-3 z-10">
        <button
          onClick={handleProceed}
          className={`flex items-center gap-3 px-8 py-3.5 rounded-full font-bold uppercase tracking-widest border transition-all duration-500 scale-100 hover:scale-105 ${
            selectedStation === 'solo'
              ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.55)]'
              : selectedStation === 'collaborative'
              ? 'bg-cyan-500 border-cyan-400 text-slate-900 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.55)]'
              : 'bg-amber-500 border-amber-400 text-slate-900 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.55)]'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>
            {selectedStation === 'solo'
              ? 'Step into Solo Booth'
              : selectedStation === 'collaborative'
              ? 'Launch Collaborative Suite'
              : "Take Director's Chair"}
          </span>
        </button>
        
        {timeLeft > 0 && selectedStation === 'solo' && !isPaused ? (
          <button 
            onClick={handlePause}
            className="text-[10px] font-mono text-white/30 hover:text-white/70 transition-colors uppercase tracking-widest"
          >
            Pause setup countdown
          </button>
        ) : timeLeft === 0 ? (
          <span className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-widest animate-pulse">
            Calibration Complete // Directorial Consent Engaged
          </span>
        ) : (
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
            Manual Override Engaged
          </span>
        )}
      </div>

    </div>
  );
};
