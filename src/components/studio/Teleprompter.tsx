'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { FlipHorizontal, Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeleprompterProps {
  modalityMode?: 'scripted' | 'interview';
  activeBeatIndex?: number;
  onActiveBeatChange?: (index: number) => void;
  isMini?: boolean;
}

const highlightSensoryAnchors = (text: string): string => {
  if (!text) return '';
  const soundWords = ['train', 'whistle', 'laughter', 'crackle', 'ticking', 'bell', 'chime', 'voice', 'sound', 'hum', 'whisper', 'rustle', 'thud'];
  const aromaWords = ['ozone', 'jasmine', 'rose', 'books', 'coffee', 'aroma', 'soil', 'scent', 'smell', 'spice', 'earth', 'rain', 'lavender'];
  const visualWords = ['sun', 'glow', 'light', 'amber', 'dust', 'gold', 'shadow', 'warmth', 'rough', 'damp', 'heat', 'bright', 'dark'];

  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const soundPattern = soundWords.map(escapeRegExp).join('|');
  const aromaPattern = aromaWords.map(escapeRegExp).join('|');
  const visualPattern = visualWords.map(escapeRegExp).join('|');

  let processed = text;

  const soundRegex = new RegExp(`\\b(${soundPattern})\\b`, 'gi');
  processed = processed.replace(soundRegex, `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold transition-all hover:bg-emerald-500/20" title="Sound Anchor">$1</span>`);

  const aromaRegex = new RegExp(`\\b(${aromaPattern})\\b`, 'gi');
  processed = processed.replace(aromaRegex, `<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold transition-all hover:bg-amber-500/20" title="Scent Anchor">$1</span>`);

  const visualRegex = new RegExp(`\\b(${visualPattern})\\b`, 'gi');
  processed = processed.replace(visualRegex, `<span class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-bold transition-all hover:bg-purple-500/20" title="Visual/Texture Anchor">$1</span>`);

  return processed;
};

export const Teleprompter: React.FC<TeleprompterProps> = ({
  modalityMode = 'scripted',
  activeBeatIndex: externalActiveBeatIndex,
  onActiveBeatChange,
  isMini = false
}) => {
  const { 
    selectedTake, 
    isScrolling,
    scrollSpeed,
    fontSize,
    isMirrored,
    actions: {
      toggleScrolling,
      setScrollSpeed,
      toggleMirror,
      increaseFontSize,
      decreaseFontSize
    }
  } = useStudioState();

  const [localActiveBeatIndex, setLocalActiveBeatIndex] = useState(0);
  const activeBeatIndex = externalActiveBeatIndex !== undefined ? externalActiveBeatIndex : localActiveBeatIndex;

  const textToPrompt = selectedTake 
    ? selectedTake 
    : "Please select an authorised take in the Architect's Drawer.";

  const paragraphs = useMemo(() => {
    return textToPrompt.split(/\n\s*\n/).filter(Boolean);
  }, [textToPrompt]);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastActiveIndexRef = useRef<number>(-1);

  // Smooth variable-speed auto-scroll using requestAnimationFrame with sub-pixel accumulator
  useEffect(() => {
    if (!isScrolling || modalityMode === 'interview') return;
    
    let animationId: number;
    const scrollPosRef = { current: containerRef.current ? containerRef.current.scrollTop : 0 };
    
    const scroll = () => {
      if (containerRef.current) {
        scrollPosRef.current += scrollSpeed * 0.4;
        containerRef.current.scrollTop = Math.floor(scrollPosRef.current);
        
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop >= scrollHeight - clientHeight - 2) {
          toggleScrolling();
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling, scrollSpeed, toggleScrolling, modalityMode]);

  // Listener to scroll programmatically to a specific beat index
  useEffect(() => {
    const handleScrollToBeat = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      const index = customEvent.detail?.index;
      if (index === undefined || !containerRef.current) return;
      
      const container = containerRef.current;
      const blocks = Array.from(container.querySelectorAll('.prose-block'));
      const nextBlock = blocks[index] as HTMLElement;
      if (nextBlock) {
        const targetScrollTop = nextBlock.offsetTop - (container.clientHeight / 2) + (nextBlock.clientHeight / 2);
        const finalScrollTop = Math.max(0, targetScrollTop);
        
        import('framer-motion').then(({ animate }) => {
          animate(container.scrollTop, finalScrollTop, {
            type: 'spring',
            stiffness: 90,
            damping: 18,
            mass: 0.8,
            onUpdate: (value) => {
              if (container) container.scrollTop = value;
            }
          });
        }).catch(() => {
          container.scrollTo({
            top: finalScrollTop,
            behavior: 'smooth'
          });
        });
        
        if (onActiveBeatChange) {
          onActiveBeatChange(index);
        } else {
          setLocalActiveBeatIndex(index);
        }
      }
    };

    window.addEventListener('studio-scroll-to-beat', handleScrollToBeat);
    return () => window.removeEventListener('studio-scroll-to-beat', handleScrollToBeat);
  }, [onActiveBeatChange]);

  // Listener to step forward when NEXT_CUE is triggered
  useEffect(() => {
    const handleNextCue = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const blocks = Array.from(container.querySelectorAll('.prose-block'));
      if (blocks.length === 0) return;

      const containerCenter = container.scrollTop + container.clientHeight / 2;
      let nextBlockIndex = blocks.findIndex((block: any) => block.offsetTop > containerCenter + 5);
      
      if (nextBlockIndex === -1) {
        nextBlockIndex = 0;
      }
      
      const nextBlock = blocks[nextBlockIndex] as HTMLElement;
      if (nextBlock) {
        const targetScrollTop = nextBlock.offsetTop - (container.clientHeight / 2) + (nextBlock.clientHeight / 2);
        const finalScrollTop = Math.max(0, targetScrollTop);
        
        import('framer-motion').then(({ animate }) => {
          animate(container.scrollTop, finalScrollTop, {
            type: 'spring',
            stiffness: 90,
            damping: 18,
            mass: 0.8,
            onUpdate: (value) => {
              if (container) container.scrollTop = value;
            }
          });
        }).catch(() => {
          container.scrollTo({
            top: finalScrollTop,
            behavior: 'smooth'
          });
        });
        
        if (onActiveBeatChange) {
          onActiveBeatChange(nextBlockIndex);
        } else {
          setLocalActiveBeatIndex(nextBlockIndex);
        }
      }
    };

    window.addEventListener('studio-next-cue', handleNextCue);
    return () => window.removeEventListener('studio-next-cue', handleNextCue);
  }, [onActiveBeatChange]);

  // Listener to reset when RESTART_TAKE is triggered
  useEffect(() => {
    const handleRestartTake = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      if (onActiveBeatChange) {
        onActiveBeatChange(0);
      } else {
        setLocalActiveBeatIndex(0);
      }
      lastActiveIndexRef.current = 0;
    };
    
    window.addEventListener('studio-restart-take', handleRestartTake);
    return () => window.removeEventListener('studio-restart-take', handleRestartTake);
  }, [onActiveBeatChange]);

  // Track scrolling to sync active beat back to BeatSheet
  const handleScrollTelemetry = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const blocks = Array.from(container.querySelectorAll('.prose-block'));
    if (blocks.length === 0) return;
    
    const containerCenter = container.scrollTop + container.clientHeight / 2;
    
    let activeIdx = 0;
    let closestDist = Infinity;
    
    blocks.forEach((block: any, idx) => {
      const blockCenter = block.offsetTop + block.clientHeight / 2;
      const dist = Math.abs(blockCenter - containerCenter);
      if (dist < closestDist) {
        closestDist = dist;
        activeIdx = idx;
      }
    });
    
    if (activeIdx !== lastActiveIndexRef.current) {
      lastActiveIndexRef.current = activeIdx;
      if (onActiveBeatChange) {
        onActiveBeatChange(activeIdx);
      } else {
        setLocalActiveBeatIndex(activeIdx);
      }
      window.dispatchEvent(new CustomEvent('active-beat-changed', { detail: { index: activeIdx } }));
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Control Header: UK English Labels */}
      {!isMini && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          {modalityMode !== 'interview' && (
            <button 
              onClick={toggleScrolling}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                isScrolling ? "bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
              )}
            >
              {isScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isScrolling ? 'Scrolling' : 'Scroll'}
            </button>
          )}

          {modalityMode === 'interview' && (
            <button 
              onClick={() => window.dispatchEvent(new Event('studio-next-cue'))}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-600 text-slate-900 shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all flex items-center gap-2 cursor-pointer"
            >
              Next Cue
            </button>
          )}
          
          {modalityMode !== 'interview' && (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap">Synchronised Speed</span>
              <button 
                onClick={() => setScrollSpeed(Math.max(0.5, scrollSpeed - 0.5))}
                className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono font-bold text-emerald-400 w-6 text-center">{scrollSpeed.toFixed(1)}x</span>
              <button 
                onClick={() => setScrollSpeed(scrollSpeed + 0.5)}
                className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleMirror}
                  title="Mirror Mode"
                  className={cn(
                    "p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5",
                    isMirrored ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  )}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Mirror</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-neutral-950 border-white/5 max-w-[280px] p-3 text-xs leading-relaxed text-zinc-300">
                <div className="space-y-2">
                  <p className="font-bold text-[9px] uppercase tracking-widest text-amber-400">Mirror Mode Guidance</p>
                  <p className="text-[11px] text-zinc-400">Flips script text horizontally so it appears normal when reflected on a physical teleprompter glass hood.</p>
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex gap-1.5 items-start">
                      <span>🔴</span>
                      <p><strong className="text-white">ON:</strong> Using a physical teleprompter glass hood in front of the camera lens.</p>
                    </div>
                    <div className="flex gap-1.5 items-start">
                      <span>⚪</span>
                      <p><strong className="text-white">OFF:</strong> Reading straight off a computer, laptop, or mobile screen.</p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 px-1">Optimised Layout</span>
            <button onClick={decreaseFontSize} className="p-1 hover:bg-white/10 text-white/50 hover:text-white font-black text-xs px-2 cursor-pointer">-</button>
            <span className="text-[10px] font-mono font-bold text-white/70 w-8 text-center">{fontSize}px</span>
            <button onClick={increaseFontSize} className="p-1 hover:bg-white/10 text-white/50 hover:text-white font-black text-xs px-2 cursor-pointer">+</button>
          </div>
        </div>
      </div>
      )}

      <div 
        ref={containerRef}
        onScroll={handleScrollTelemetry}
        style={{ fontSize: isMini ? '16px' : `${fontSize}px` }}
        className={cn(
          "flex-grow overflow-y-auto pr-2 custom-scrollbar leading-relaxed italic font-serif select-none relative",
          isMirrored && "transform -scale-x-100"
        )}
      >
        <div className={cn("prose-invert opacity-90 select-none", isMini ? "pb-[150px] space-y-4" : "pb-[400px] space-y-8")}>
          {paragraphs.map((para, idx) => {
            const html = highlightSensoryAnchors(para);
            const isActive = idx === activeBeatIndex;
            return (
              <p
                key={idx}
                className={cn(
                  "prose-block transition-all duration-700",
                  modalityMode === 'interview'
                    ? isActive
                      ? 'opacity-100 scale-100 text-emerald-300 font-bold shadow-teal-500/10'
                      : idx < activeBeatIndex
                      ? 'opacity-10 scale-95 duration-100'
                      : 'opacity-30 scale-95'
                    : 'opacity-90'
                )}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
