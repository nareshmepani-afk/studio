'use client';

import React, { useRef, useEffect } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { FlipHorizontal, Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Teleprompter: React.FC = () => {
  const { 
    selectedTake, 
    script,
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

  const textToPrompt = selectedTake || script || 'Awaiting script select...';
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth variable-speed auto-scroll using requestAnimationFrame
  useEffect(() => {
    if (!isScrolling) return;
    
    let animationId: number;
    const scroll = () => {
      if (containerRef.current) {
        // Variable scroll step based on current speed
        containerRef.current.scrollTop += scrollSpeed * 0.4;
        
        // Loop back if we reach the end
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop >= scrollHeight - clientHeight - 2) {
          // Stop scrolling at the end
          toggleScrolling();
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling, scrollSpeed, toggleScrolling]);

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Control Header: UK English Labels "Synchronised Speed" and "Optimised Layout" */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMirror}
            className={cn(
              "p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5",
              isMirrored ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            )}
            title="Mirror Mode"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Mirror</span>
          </button>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 px-1">Optimised Layout</span>
            <button onClick={decreaseFontSize} className="p-1 hover:bg-white/10 text-white/50 hover:text-white font-black text-xs px-2 cursor-pointer">-</button>
            <span className="text-[10px] font-mono font-bold text-white/70 w-8 text-center">{fontSize}px</span>
            <button onClick={increaseFontSize} className="p-1 hover:bg-white/10 text-white/50 hover:text-white font-black text-xs px-2 cursor-pointer">+</button>
          </div>
        </div>
      </div>

      {/* Main Script Scrolling Area */}
      <div 
        ref={containerRef}
        style={{ fontSize: `${fontSize}px` }}
        className={cn(
          "flex-grow overflow-y-auto pr-2 custom-scrollbar scroll-smooth leading-relaxed italic font-serif select-none",
          isMirrored && "transform -scale-x-100"
        )}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: textToPrompt }}
          className="prose-invert opacity-90 pb-[400px] whitespace-pre-wrap select-none"
        />
      </div>
    </div>
  );
};
