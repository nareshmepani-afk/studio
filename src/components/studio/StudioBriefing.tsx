'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Sparkles, X, ChevronRight, ChevronLeft, Smartphone, 
  Volume2, HelpCircle, Film, ShieldCheck, Play 
} from 'lucide-react';
import { toast } from 'sonner';

interface StudioBriefingProps {
  isOpen: boolean;
  onClose: (completed: boolean) => void;
  cameraPairingUrl: string;
  peerState: 'idle' | 'syncing' | 'authorised';
  hostIP: string;
  setHostIP: (ip: string) => void;
}

interface TourStep {
  id: 'remote-bridge' | 'table-rehearse' | 'wireless-lens' | 'directors-hud';
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const StudioBriefing: React.FC<StudioBriefingProps> = ({
  isOpen,
  onClose,
  cameraPairingUrl,
  peerState,
  hostIP,
  setHostIP
}) => {
  const [currentStep, setCurrentStep] = useState<number | null>(null); // null means intro modal
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  
  const steps: TourStep[] = [
    {
      id: 'remote-bridge',
      title: '📱 The Remote Bridge',
      description: 'Your phone is a tactile remote. Scan this QR code now to step away from the keyboard and control prompter scrolling and beat cards from across the room.',
      icon: <Smartphone className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'table-rehearse',
      title: '🎙️ Acoustic Table Read',
      description: 'Find your rhythm. Toggle the Rehearsal tab to engage a zero-distraction workspace, practicing vocal delivery with our intelligent WPM pace dial dial.',
      icon: <Volume2 className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'wireless-lens',
      title: '🎥 Wireless Lens Bridge',
      description: 'Professional stage optics. Scan the bridge code to leverage your smartphone’s high-fidelity 4K lens as a premium wireless video source.',
      icon: <Film className="w-5 h-5 text-purple-400" />
    },
    {
      id: 'directors-hud',
      title: '🎬 Director\'s HUD',
      description: 'Your live backstage coach. Consolidating composition rules, eye-contact tracking, and instant rules linter in one cohesive container.',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />
    }
  ];

  // Monitor peer state for active remote pairing auto-advance
  useEffect(() => {
    if (isOpen && currentStep === 0 && peerState === 'authorised') {
      toast.success("Remote Bridge Synchronised!", {
        description: "Tactile link established. Auto-advancing your tour...",
        icon: <Smartphone className="w-5 h-5 text-emerald-400 animate-bounce" />
      });
      // Play a short digital success sound
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, context.currentTime); // D5
        osc.frequency.setValueAtTime(880, context.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.05, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
        osc.start();
        osc.stop(context.currentTime + 0.35);
      } catch (e) {
        console.warn("Tour feedback chime failed:", e);
      }
      
      // Auto-advance
      setTimeout(() => {
        setCurrentStep(1);
      }, 1000);
    }
  }, [peerState, currentStep, isOpen]);

  // RequestAnimationFrame spotlight tracking
  useEffect(() => {
    if (!isOpen || currentStep === null) {
      setSpotlightRect(null);
      return;
    }

    let active = true;
    const updateSpotlight = () => {
      if (!active) return;
      const stepId = steps[currentStep].id;
      const element = document.querySelector(`[data-tour="${stepId}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setSpotlightRect(rect);
      } else {
        setSpotlightRect(null);
      }
      requestAnimationFrame(updateSpotlight);
    };

    updateSpotlight();
    return () => {
      active = false;
    };
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        onClose(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentStep === null) {
          setCurrentStep(0);
        } else if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          onClose(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, onClose, steps.length]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep === null) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose(true); // Completed tour
    }
  };

  const handleBack = () => {
    if (currentStep === null) return;
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center overflow-hidden select-none">
      {/* Dim Overlay */}
      {(currentStep === null || !spotlightRect) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(2, 2, 2, 0.85)', backdropFilter: 'blur(1.5px)' }}
        />
      )}

      {/* Dynamic X-Ray Spotlight Overlay */}
      {currentStep !== null && spotlightRect && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[101]">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect 
                x={spotlightRect.left - 8} 
                y={spotlightRect.top - 8} 
                width={spotlightRect.width + 16} 
                height={spotlightRect.height + 16} 
                rx={16}
                fill="black" 
              />
            </mask>
          </defs>
          <rect 
            width="100%" 
            height="100%" 
            fill="#020202" 
            opacity="0.8" 
            mask="url(#spotlight-mask)" 
          />
        </svg>
      )}

      {/* Target spotlight glowing outline */}
      {currentStep !== null && spotlightRect && (
        <div 
          style={{
            position: 'absolute',
            left: spotlightRect.left - 8,
            top: spotlightRect.top - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
          }}
          className="border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.45)] rounded-2xl pointer-events-none z-[102] transition-all duration-300 animate-pulse"
        />
      )}

      {/* Onboarding Dialog Cards */}
      <AnimatePresence mode="wait">
        {currentStep === null ? (
          /* Choice Entry Dialog */
          <motion.div
            key="intro-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-lg bg-zinc-950/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between items-center text-center select-none z-[105] relative mx-4"
          >
            <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(56,189,248,0.15)] animate-pulse">
              <Film className="w-8 h-8 text-sky-400" />
            </div>

            <h2 className="font-headline text-2xl font-bold text-white uppercase tracking-widest mb-2">
              The Grand Tour // Solo Stage
            </h2>
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-[0.25em] mb-4">
              Onboarding Briefing & Calibration
            </p>
            <p className="text-xs text-white/60 leading-relaxed font-sans font-medium mb-8 max-w-sm">
              Welcome to Act III: The Capture. Before ignition, take our X-Ray walkthrough to master live remote pairing, teleprompter layouts, and AI coaching.
            </p>

            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onClose(false)}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
              >
                Fast Start
              </button>
              <button
                onClick={() => setCurrentStep(0)}
                className="flex-1 py-4 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Planning Tour
              </button>
            </div>
          </motion.div>
        ) : (
          /* Tour Steps Walking Card */
          <motion.div
            key={`tour-step-${currentStep}`}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            className={cn(
              "absolute bg-zinc-950/90 backdrop-blur-3xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col justify-between select-none z-[105] w-80 max-w-md mx-4",
              // Positioning logic next to highlighted elements
              currentStep === 0 && "left-6 top-32 xl:left-24", // Remote bridge (next to top actions)
              currentStep === 1 && "left-12 top-48",           // Table Read (next to HUD)
              currentStep === 2 && "right-12 top-48",          // Wireless lens (next to optics)
              currentStep === 3 && "left-12 top-32"            // HUD
            )}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                  {steps[currentStep].icon}
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                    {steps[currentStep].title}
                  </h3>
                  <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-white/70 leading-relaxed font-medium font-sans text-left">
                {steps[currentStep].description}
              </p>

              {/* Special interactive QR code rendered inside step 0 tooltip */}
              {currentStep === 0 && cameraPairingUrl && (
                <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 gap-3 my-2 animate-fade-in shrink-0 w-full">
                  {/* Host IP Address input hack for Localhost over Wi-Fi */}
                  <div className="w-full space-y-1">
                    <label className="text-[8px] font-black text-white/50 uppercase tracking-widest text-left block">
                      Local Host LAN IP
                    </label>
                    <input 
                      type="text" 
                      value={hostIP}
                      onChange={(e) => setHostIP(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-sky-500/50 text-center"
                      placeholder="e.g. 192.168.1.50"
                    />
                    <p className="text-[7.5px] text-white/40 leading-snug text-center">
                      Replace "localhost" with your computer's Wi-Fi IP so your phone can pair.
                    </p>
                  </div>

                  <div className="p-2 bg-white rounded-xl mt-1">
                    <QRCodeCanvas value={cameraPairingUrl} size={110} level="H" includeMargin={false} className="rounded" />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-sky-400">
                        {peerState === 'syncing' ? 'Awaiting QR Scan...' : 'Standby Pair'}
                      </span>
                    </div>
                    <div className="text-[7.5px] leading-relaxed text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-center mt-1">
                      <strong>⚠️ SSL Cert Warning:</strong> Over Wi-Fi, modern mobile browsers require HTTPS for camera access. If blocked, tap <strong>"Advanced" ➔ "Proceed"</strong> (or visit <span className="underline font-mono">https://{hostIP || '192.168.x.x'}:3000</span> first to accept the local dev certificate).
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/5 shrink-0">
              <button
                onClick={() => onClose(false)}
                className="text-[9px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
              >
                Skip Tour
              </button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="p-1.5 bg-white/5 border border-white/10 text-white/70 hover:text-white rounded-lg transition-all cursor-pointer"
                    title="Back Step"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
