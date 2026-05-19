'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Plus, 
  RotateCcw, 
  Clock, 
  Target,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
  Sparkles,
  Heart,
  Film,
  Eye,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArchiveItem {
  timestamp: string;
  text: string;
  visionType: string;
  visionLabel: string;
}

interface ArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  originalHook: string;
  scriptHistory: ArchiveItem[];
  onRestore: (text: string) => void;
  isProductionLocked?: boolean;
  isMediaLocked?: boolean;
  currentScript?: string;
  highestClarityScript?: string;
  promptTemplate?: string;
  lastEchoScript?: string;
}

const ACCENT_STYLES: Record<string, {
  border: string;
  text: string;
  bgActive: string;
  borderActive: string;
  textActive: string;
  glow: string;
}> = {
  amber: {
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    bgActive: 'bg-amber-500/10 border-amber-500/30',
    borderActive: 'border-amber-500/40',
    textActive: 'text-amber-400',
    glow: 'rgba(245, 158, 11, 0.15)'
  },
  emerald: {
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    bgActive: 'bg-emerald-500/10 border-emerald-500/30',
    borderActive: 'border-emerald-500/40',
    textActive: 'text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  purple: {
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    bgActive: 'bg-purple-500/10 border-purple-500/30',
    borderActive: 'border-purple-500/40',
    textActive: 'text-purple-400',
    glow: 'rgba(139, 92, 246, 0.15)'
  },
  sky: {
    border: 'border-sky-500/20',
    text: 'text-sky-400',
    bgActive: 'bg-sky-500/10 border-sky-500/30',
    borderActive: 'border-sky-500/40',
    textActive: 'text-sky-400',
    glow: 'rgba(14, 165, 233, 0.15)'
  },
  rose: {
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    bgActive: 'bg-rose-500/10 border-rose-500/30',
    borderActive: 'border-rose-500/40',
    textActive: 'text-rose-400',
    glow: 'rgba(244, 63, 94, 0.15)'
  }
};

export const ArchiveDrawer: React.FC<ArchiveDrawerProps> = ({
  isOpen,
  onClose,
  originalHook = "",
  scriptHistory = [],
  onRestore,
  isProductionLocked = false,
  isMediaLocked = false,
  currentScript = "",
  highestClarityScript = "",
  promptTemplate = "",
  lastEchoScript = ""
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Determine active slide index matching the current active script, default to 0
  useEffect(() => {
    if (!isOpen) return;

    if (currentScript === originalHook) {
      setActiveIndex(1); // The Soil
    } else if (highestClarityScript && currentScript === highestClarityScript) {
      setActiveIndex(2); // Soul-Print
    } else if (promptTemplate && currentScript === promptTemplate) {
      setActiveIndex(3); // Director's Lexicon
    } else if (lastEchoScript && currentScript === lastEchoScript) {
      setActiveIndex(4); // The Echo
    } else {
      setActiveIndex(0); // SELECTED
    }
  }, [isOpen, currentScript, originalHook, highestClarityScript, promptTemplate, lastEchoScript]);

  if (!mounted) return null;

  const slides = [
    {
      id: 'selected',
      title: 'SELECTED',
      subtitle: 'The Active Directorial Cut',
      description: 'The current locked Cinematic Cut/Vision.',
      text: currentScript || (scriptHistory && scriptHistory.length > 0 ? scriptHistory[scriptHistory.length - 1].text : ''),
      icon: <Sparkles className="w-5 h-5" />,
      colorKey: 'amber',
      badge: 'ACTIVE VISION'
    },
    {
      id: 'soil',
      title: 'THE SOIL',
      subtitle: 'Your Original Raw Spark',
      description: "The user's original raw hook input.",
      text: originalHook || '',
      icon: <BookOpen className="w-5 h-5" />,
      colorKey: 'emerald',
      badge: 'CREATIVE SPARK'
    },
    {
      id: 'soul-print',
      title: 'SOUL-PRINT',
      subtitle: 'Peak Clarity Remembrance',
      description: 'The historical draft with the highest recorded hotClarity metric.',
      text: highestClarityScript || 'Peak clarity remembrance pathway has not been realised yet.',
      icon: <Heart className="w-5 h-5" />,
      colorKey: 'purple',
      badge: highestClarityScript ? 'HIGHEST CLARITY' : 'UNREALISED'
    },
    {
      id: 'directors-lexicon',
      title: "DIRECTOR'S LEXICON",
      subtitle: 'The Original Prompt Template',
      description: 'The prompt instructions driving the cinematic synthesis engine.',
      text: promptTemplate || 'No active prompt template found.',
      icon: <FileText className="w-5 h-5" />,
      colorKey: 'sky',
      badge: 'ENGINE BLUEPRINT'
    },
    {
      id: 'echo',
      title: 'THE ECHO',
      subtitle: 'Last Recorded Local Draft',
      description: 'The last updated prose from the local draft history.',
      text: lastEchoScript || 'No local draft history found.',
      icon: <History className="w-5 h-5" />,
      colorKey: 'rose',
      badge: 'LOCAL DRAFT'
    }
  ];

  const handlePrev = () => setActiveIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  const handleNext = () => setActiveIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));

  const activeSlide = slides[activeIndex];
  const activeStyles = ACCENT_STYLES[activeSlide.colorKey];
  const isSelectedActive = activeSlide.text === currentScript;
  const isTextEmpty = !activeSlide.text || activeSlide.text.includes("has not been realised") || activeSlide.text.includes("No active prompt template found") || activeSlide.text.includes("No local draft history found");

  // Determine button state:
  let buttonLabel = "SWAP ACTIVE VISION";
  let isButtonDisabled = false;
  let buttonIcon = <RotateCcw className="w-4 h-4" />;
  let buttonColorClass = "bg-emerald-500 hover:bg-emerald-400 text-slate-950";
  let lockReason = "";

  if (isSelectedActive) {
    buttonLabel = "Active Vision Selected";
    isButtonDisabled = true;
    buttonIcon = <ShieldCheck className="w-4 h-4" />;
    buttonColorClass = "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed";
  } else if (isTextEmpty) {
    buttonLabel = "Pathway Unrealised";
    isButtonDisabled = true;
    buttonIcon = <Lock className="w-4 h-4 text-zinc-500" />;
    buttonColorClass = "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed";
  } else if (isMediaLocked) {
    buttonLabel = "VISION SWAP LOCKED";
    isButtonDisabled = true;
    buttonIcon = <Lock className="w-4 h-4 text-amber-500" />;
    buttonColorClass = "bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-not-allowed";
    lockReason = "MEDIA LOCK ACTIVE: Vision swapping is locked because a video is committed to this Remembrance.";
  } else if (isProductionLocked) {
    buttonLabel = "VISION SWAP LOCKED";
    isButtonDisabled = true;
    buttonIcon = <Lock className="w-4 h-4 text-amber-500" />;
    buttonColorClass = "bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-not-allowed";
    lockReason = "PICTURE LOCK ACTIVE: Release Picture Lock in Act I to swap visions.";
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9000]"
          />

          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            className="fixed inset-y-0 right-0 w-full lg:w-[650px] z-[9001] flex flex-col shadow-[-20px_0_100px_rgba(0,0,0,0.95)] bg-[#020617] border-l border-zinc-800/80 overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01] relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-headline text-white italic">Studio Archivist</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em]">
                      Directorial History
                    </span>
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                      5-Script Carousel Console
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all group cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Main Interactive Carousel Area */}
            <div className="flex-1 flex flex-col overflow-y-auto p-8 relative space-y-6 custom-scrollbar justify-between">
              
              {/* Dynamic Theme Glow in Background */}
              <div 
                className="absolute inset-x-0 top-1/4 h-[300px] transition-all duration-700 opacity-20 pointer-events-none filter blur-[120px] rounded-full"
                style={{ background: `radial-gradient(circle, ${activeStyles.glow} 0%, transparent 70%)` }}
              />

              {/* Top Slot: The Archivist Alert Banner if Locked */}
              <div className="relative z-10">
                {isMediaLocked && (
                  <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex gap-4 items-start">
                    <Lock className="w-5 h-5 text-amber-500 mt-0.5 animate-pulse shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">FUSION PROTOCOL ACTIVE</h4>
                      <p className="text-[10px] text-amber-500/60 leading-relaxed italic">
                        This cut is locked because an Act II video recording exists. Restoring other script versions is locked to prevent synchronisation desync.
                      </p>
                    </div>
                  </div>
                )}

                {!isMediaLocked && isProductionLocked && (
                  <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex gap-4 items-start">
                    <Lock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">SCENE TIMELINE LOCKED</h4>
                      <p className="text-[10px] text-amber-500/60 leading-relaxed italic">
                        This scene is locked to protect your recording alignments. To restore an earlier script version, release the lock using the low-profile button in the Editor first.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Carousel Stage */}
              <div className="relative z-10 flex items-center justify-between py-4 select-none">
                {/* Left Arrow */}
                <button
                  onClick={handlePrev}
                  className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Main Card Slot */}
                <div className="w-[78%] overflow-hidden relative px-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide.id}
                      initial={{ opacity: 0, x: 50, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -50, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={cn(
                        "w-full rounded-[2.5rem] bg-slate-900/60 backdrop-blur-md border p-8 space-y-6 flex flex-col min-h-[480px] shadow-2xl relative overflow-hidden",
                        activeStyles.borderActive
                      )}
                    >
                      {/* Top Row: Icon and Badge */}
                      <div className="flex items-center justify-between">
                        <div className={cn("p-3 rounded-2xl bg-white/5", activeStyles.text)}>
                          {activeSlide.icon}
                        </div>
                        <span className={cn(
                          "text-[8px] font-black font-mono tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10",
                          activeStyles.text
                        )}>
                          {activeSlide.badge}
                        </span>
                      </div>

                      {/* Headings */}
                      <div className="space-y-1">
                        <h3 className="text-2xl font-headline italic text-white leading-none">
                          {activeSlide.title}
                        </h3>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest font-mono", activeStyles.text)}>
                          {activeSlide.subtitle}
                        </p>
                      </div>

                      {/* Descriptive Info */}
                      <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                        {activeSlide.description}
                      </p>

                      {/* Content Preview Box */}
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 font-serif text-sm leading-relaxed text-zinc-300 h-48 overflow-y-auto custom-scrollbar italic relative select-text">
                        {isTextEmpty ? (
                          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                            <Lock className="w-5 h-5 text-white/10" />
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                              {activeSlide.text}
                            </p>
                          </div>
                        ) : (
                          `"${activeSlide.text}"`
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={handleNext}
                  className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Indicators & Jump Controls */}
              <div className="relative z-10 space-y-8">
                {/* Visual Indicators of Cards */}
                <div className="grid grid-cols-5 gap-2 px-2">
                  {slides.map((slide, idx) => {
                    const styles = ACCENT_STYLES[slide.colorKey];
                    const isSlideActive = activeIndex === idx;
                    const isSlideEmpty = !slide.text || slide.text.includes("pathway has not been realised");
                    return (
                      <button
                        key={slide.id}
                        onClick={() => setActiveIndex(idx)}
                        className={cn(
                          "flex flex-col items-center gap-2 py-3 rounded-2xl border transition-all text-center group cursor-pointer relative overflow-hidden",
                          isSlideActive 
                            ? `${styles.bgActive} border-white/20 text-white scale-105 shadow-lg`
                            : "bg-white/[0.01] border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                        )}
                      >
                        {isSlideActive && (
                          <div 
                            className="absolute bottom-0 inset-x-0 h-1 bg-current" 
                            style={{ color: styles.glow }}
                          />
                        )}
                        <span className={cn(
                          "text-[7px] font-black uppercase tracking-[0.1em] font-mono whitespace-nowrap",
                          isSlideActive && styles.text
                        )}>
                          {slide.title}
                        </span>
                        {isSlideEmpty && !isSlideActive && (
                          <Lock className="w-2.5 h-2.5 text-zinc-700" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Detailed Lock Explanation Box */}
                {lockReason && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-[9px] font-mono italic text-amber-500/80 leading-relaxed text-center px-8"
                  >
                    "{lockReason}"
                  </motion.div>
                )}

                {/* Restore / Apply Action Button */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (!isButtonDisabled) {
                        onRestore(activeSlide.text);
                      }
                    }}
                    disabled={isButtonDisabled}
                    className={cn(
                      "w-full py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                      buttonColorClass
                    )}
                  >
                    {buttonIcon}
                    {buttonLabel}
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-8 bg-black/40 border-t border-white/5 backdrop-blur-md relative z-10">
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Close Archive Console
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
