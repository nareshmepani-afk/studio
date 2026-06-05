'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { FlipHorizontal, Play, Pause, ChevronUp, ChevronDown, Layout, Music, Volume2, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { synthesizeStudioSpeech } from '@/actions/studio-vocal';
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
  stream?: MediaStream | null;
  prompterLayout?: 'side' | 'center';
  onPrompterLayoutToggle?: () => void;
  isTableReadActive?: boolean;
  onTableReadToggle?: () => void;
  rehearsalSpeed?: number;
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

  // Sound Anchors (Exclude matching inside HTML tags/attributes)
  const soundRegex = new RegExp(`(<[^>]*>)|\\b(${soundPattern})\\b`, 'gi');
  processed = processed.replace(soundRegex, (match, tag, word) => {
    if (tag) return tag;
    return `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold transition-all hover:bg-emerald-500/20" title="Sound Anchor">${word}</span>`;
  });

  // Aroma Anchors (Exclude matching inside HTML tags/attributes)
  const aromaRegex = new RegExp(`(<[^>]*>)|\\b(${aromaPattern})\\b`, 'gi');
  processed = processed.replace(aromaRegex, (match, tag, word) => {
    if (tag) return tag;
    return `<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold transition-all hover:bg-amber-500/20" title="Scent Anchor">${word}</span>`;
  });

  // Visual Anchors (Exclude matching inside HTML tags/attributes)
  const visualRegex = new RegExp(`(<[^>]*>)|\\b(${visualPattern})\\b`, 'gi');
  processed = processed.replace(visualRegex, (match, tag, word) => {
    if (tag) return tag;
    return `<span class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-bold transition-all hover:bg-purple-500/20" title="Visual/Texture Anchor">${word}</span>`;
  });

  return processed;
};

export const Teleprompter: React.FC<TeleprompterProps> = ({
  modalityMode = 'scripted',
  activeBeatIndex: externalActiveBeatIndex,
  onActiveBeatChange,
  isMini = false,
  stream = null,
  prompterLayout = 'side',
  onPrompterLayoutToggle,
  isTableReadActive = false,
  onTableReadToggle,
  rehearsalSpeed = 1.5
}) => {
  const { 
    sessionId,
    selectedTake, 
    isScrolling,
    scrollSpeed,
    fontSize,
    isMirrored,
    actions: {
      toggleScrolling,
      setScrolling,
      setScrollSpeed,
      setFontSize,
      toggleMirror,
      increaseFontSize,
      decreaseFontSize
    }
  } = useStudioState();

  const isLayoutLocked = modalityMode === 'interview' || isScrolling;

  const [isRehearsingAudio, setIsRehearsingAudio] = useState(false);
  const isInternalScroll = useRef(false);

  // Setup BroadcastChannel for popout synchronization
  useEffect(() => {
    if (!sessionId || sessionId === 'default') return;

    const channelName = `teleprompter_sync_${sessionId}`;
    const channel = new BroadcastChannel(channelName);

    const handleMessage = (event: MessageEvent) => {
      const { type, progress, sender, ...payload } = event.data;
      if (sender === 'main') return; // Ignore own echoes

      if (type === 'scroll' && containerRef.current) {
        const container = containerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;
        isInternalScroll.current = true;
        container.scrollTop = progress * maxScroll;
        setTimeout(() => { isInternalScroll.current = false; }, 20);
      } else if (type === 'state') {
        if (payload.isScrolling !== undefined && payload.isScrolling !== isScrolling) {
          setScrolling(payload.isScrolling);
        }
        if (payload.fontSize !== undefined && payload.fontSize !== fontSize) {
          setFontSize(payload.fontSize);
        }
        if (payload.isMirrored !== undefined && payload.isMirrored !== isMirrored) {
          if (payload.isMirrored !== isMirrored) {
            toggleMirror();
          }
        }
      } else if (type === 'join') {
        // Popout just opened! Send current states immediately to popout for instant alignment
        if (containerRef.current) {
          const container = containerRef.current;
          const maxScroll = container.scrollHeight - container.clientHeight;
          const currentProgress = maxScroll > 0 ? container.scrollTop / maxScroll : 0;
          channel.postMessage({
            type: 'state',
            isScrolling,
            scrollSpeed,
            fontSize,
            isMirrored,
            sender: 'main'
          });
          channel.postMessage({
            type: 'scroll',
            progress: currentProgress,
            sender: 'main'
          });
        }
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [sessionId, isScrolling, scrollSpeed, fontSize, isMirrored, setScrolling, setFontSize, toggleMirror]);

  // Synchronize state changes dynamically to popout window
  useEffect(() => {
    if (!sessionId || sessionId === 'default') return;
    const channelName = `teleprompter_sync_${sessionId}`;
    const channel = new BroadcastChannel(channelName);
    channel.postMessage({
      type: 'state',
      isScrolling,
      scrollSpeed,
      fontSize,
      isMirrored,
      sender: 'main'
    });
    channel.close();
  }, [sessionId, isScrolling, scrollSpeed, fontSize, isMirrored]);

  const handlePopout = () => {
    if (!sessionId || sessionId === 'default') return;
    const width = 800;
    const height = 360;
    const left = (window.screen.width - width) / 2;
    const top = 0; // Align with the absolute top of the screen
    window.open(
      `/studio/teleprompter-popout?sessionId=${sessionId}`,
      `TeleprompterPopout_${sessionId}`,
      `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [localActiveBeatIndex, setLocalActiveBeatIndex] = useState(0);
  const activeBeatIndex = externalActiveBeatIndex !== undefined ? externalActiveBeatIndex : localActiveBeatIndex;

  // MOD-17: Extract first N sentences for vocal shadowing lead-in pacing reference
  const getFirstNSentences = (text: string, n: number) => {
    if (!text) return '';
    // Match up to N sentences ending in . or ! or ?
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.slice(0, n).join(' ');
  };

  const handleToggleRehearsalAudio = async () => {
    if (isRehearsingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsRehearsingAudio(false);
      if (isScrolling) {
        toggleScrolling();
      }
      return;
    }

    const sentencesText = getFirstNSentences(selectedTake || '', 3);
    if (!sentencesText) return;

    setIsRehearsingAudio(true);
    try {
      // Call Google/Edge TTS synthesiser using 'Achernar' premium voice
      const base64 = await synthesizeStudioSpeech(sentencesText, 'Achernar');
      if (base64) {
        const audio = new Audio(`data:audio/mp3;base64,${base64}`);
        audioRef.current = audio;

        // Automatically start smooth prompter scroll at natural pacing speed
        if (!isScrolling) {
          toggleScrolling();
        }

        audio.play();

        // Establish the smooth fade-out and silent continued shadowing scroll
        audio.onended = () => {
          setIsRehearsingAudio(false);
          audioRef.current = null;
        };
      } else {
        setIsRehearsingAudio(false);
      }
    } catch (e) {
      console.warn("TTS Rehearsal failed:", e);
      setIsRehearsingAudio(false);
    }
  };

  // Safe cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
    if (!isScrolling || modalityMode === 'interview' || isMini) return;
    
    let animationId: number;
    const scrollPosRef = { current: containerRef.current ? containerRef.current.scrollTop : 0 };
    
    const scroll = () => {
      if (containerRef.current) {
        const activeSpeed = isTableReadActive && rehearsalSpeed !== undefined ? rehearsalSpeed : scrollSpeed;
        scrollPosRef.current += activeSpeed * 0.4;
        containerRef.current.scrollTop = Math.floor(scrollPosRef.current);
        
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop >= scrollHeight - clientHeight - 2) {
          toggleScrolling();
          if (isTableReadActive) {
            window.dispatchEvent(new Event('studio-table-read-ended'));
          }
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling, scrollSpeed, rehearsalSpeed, toggleScrolling, modalityMode, isMini, isTableReadActive]);

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

    // Broadcast scroll progress if it's a user/auto scroll and not an incoming message sync
    if (!isInternalScroll.current && sessionId && sessionId !== 'default') {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > 0) {
        const progress = container.scrollTop / maxScroll;
        const channelName = `teleprompter_sync_${sessionId}`;
        const channel = new BroadcastChannel(channelName);
        channel.postMessage({
          type: 'scroll',
          progress,
          sender: 'main'
        });
        channel.close();
      }
    }

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

          {/* Settings in header only if selfie stream is not active to keep it clean */}
          {(!stream || isMini) && (
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

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handlePopout}
                      title="Pop Out Teleprompter"
                      className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Pop Out</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-neutral-950 border-white/5 max-w-[200px] p-3 text-xs leading-relaxed text-zinc-300">
                    <div className="space-y-1">
                      <p className="font-bold text-[9px] uppercase tracking-widest text-cyan-400">Pop Out Teleprompter</p>
                      <p className="text-[10px] text-zinc-400 leading-normal">Opens a standalone, borderless prompter window to place directly under your camera bezel.</p>
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
          )}
        </div>
      )}

      {/* Main Content Area split into columns when stream is active */}
      <div className="flex-grow flex min-h-0 w-full gap-6 overflow-hidden">
        {/* Left Column: Script Viewport */}
        <div 
          ref={containerRef}
          onScroll={handleScrollTelemetry}
          style={{ fontSize: isMini ? '16px' : isTableReadActive ? '64px' : `${fontSize}px` }}
          className={cn(
            "flex-grow overflow-y-auto pr-2 custom-scrollbar leading-relaxed italic font-serif select-none relative transition-all duration-700",
            isTableReadActive ? "text-center px-6 max-w-5xl mx-auto py-16 scroll-smooth" : "",
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

        {/* Right Column: Visual Controls & Selfie Sidebar (Active Camera/Rehearsal Mode) */}
        {(!isMini || isTableReadActive) && (stream || isTableReadActive) && (
          <div className="w-[124px] flex-none flex flex-col gap-3.5 border-l border-white/5 pl-4 shrink-0 overflow-y-auto custom-scrollbar select-none">
            {/* Live Selfie Monitor */}
            {stream && (
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] bg-zinc-950 shrink-0">
                <video
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                  ref={(el) => {
                    if (el && stream && el.srcObject !== stream) {
                      el.srcObject = stream;
                      const playPromise = el.play();
                      if (playPromise !== undefined) {
                        playPromise.catch(e => console.warn("Selfie play error:", e));
                      }
                    }
                  }}
                />
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[7px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1 shadow-sm">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Selfie</span>
                </div>
              </div>
            )}

            {/* Glowing Table Read Option (Interactive mode trigger) */}
            {onTableReadToggle && (
              <div className="flex flex-col shrink-0">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={onTableReadToggle}
                        title="Toggle Immersive Table Read Rehearsal Mode"
                        className={cn(
                          "w-full py-2.5 rounded-xl border font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          isTableReadActive
                            ? "bg-sky-500 text-slate-900 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                            : "bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border-sky-500/30 text-sky-400 hover:text-sky-300 hover:border-sky-500/50"
                        )}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isTableReadActive ? 'End Read' : 'Table Read'}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-neutral-950 border-white/5 max-w-[200px] p-3 text-xs leading-relaxed text-zinc-300">
                      <div className="space-y-1.5">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-sky-400">Table Read</p>
                        <p className="text-[10px] text-zinc-400 leading-normal">Engage a zero-distraction acoustic rehearsal workspace to shadow delivery.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Vocal Shadowing Lead-In Audio Playback (Available during active Table Read) */}
            {isTableReadActive && (
              <div className="flex flex-col shrink-0">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleToggleRehearsalAudio}
                        title="Start Vocal Shadowing Audio"
                        className={cn(
                          "w-full py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest",
                          isRehearsingAudio
                            ? "bg-amber-500 text-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.45)]"
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                        )}
                      >
                        {isRehearsingAudio ? <Volume2 className="w-3.5 h-3.5 animate-bounce" /> : <Music className="w-3.5 h-3.5" />}
                        <span>{isRehearsingAudio ? 'Shadowing' : 'Vocal'}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-neutral-950 border-white/5 max-w-[200px] p-3 text-xs leading-relaxed text-zinc-300">
                      <div className="space-y-1.5">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-amber-400">Vocal Shadowing</p>
                        <p className="text-[10px] text-zinc-400 leading-normal">Play first 3 sentences aloud to establish rhythm, then fade to silent shadowing scroll.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Mirror Option (Hide during active Table Read) */}
            {!isTableReadActive && (
              <div className="flex flex-col shrink-0">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleMirror}
                        title="Mirror Mode"
                        className={cn(
                          "w-full py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          isMirrored ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                        )}
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Mirror</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-neutral-950 border-white/5 max-w-[200px] p-3 text-xs leading-relaxed text-zinc-300">
                      <div className="space-y-1.5">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-amber-400">Mirror Mode</p>
                        <p className="text-[10px] text-zinc-400 leading-normal">Flips text horizontally for glass hoods reflection.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Pop Out Option (Hide during active Table Read) */}
            {!isTableReadActive && (
              <div className="flex flex-col shrink-0">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handlePopout}
                        title="Pop Out Teleprompter"
                        className="w-full py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Pop Out</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-neutral-950 border-white/5 max-w-[200px] p-3 text-xs leading-relaxed text-zinc-300">
                      <div className="space-y-1.5">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-cyan-400">Pop Out Prompter</p>
                        <p className="text-[10px] text-zinc-400 leading-normal">Open a standalone, bezel-less overlay window aligned right below the camera lens.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Layout Mode (Overlay vs Center) Option (Hide during active Table Read) */}
            {!isTableReadActive && onPrompterLayoutToggle && (
              <div className="flex flex-col shrink-0">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={onPrompterLayoutToggle}
                        disabled={isLayoutLocked}
                        title="Toggle Prompter Layout Mode"
                        className={cn(
                          "w-full py-2 rounded-xl border transition-all flex items-center justify-center gap-1.5",
                          isLayoutLocked
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/50 cursor-not-allowed opacity-75"
                            : prompterLayout === 'center'
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white cursor-pointer"
                        )}
                      >
                        <Layout className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {prompterLayout === 'center' ? 'Center' : 'Overlay'}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-neutral-950 border-white/5 max-w-[200px] p-3 text-xs leading-relaxed text-zinc-300">
                      <div className="space-y-1.5">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-emerald-400">Layout Alignment</p>
                        {isLayoutLocked ? (
                          <p className="text-[10px] text-zinc-400 leading-normal">Fixed to <strong>Center</strong> mode during active performance to guarantee eye-contact alignment.</p>
                        ) : (
                          <p className="text-[10px] text-zinc-400 leading-normal">Switch between <strong>Center</strong> (camera alignment) and <strong>Overlay</strong> (movable card) layouts.</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Optimised Font Size controls inside column (Hide during active Table Read) */}
            {!isTableReadActive && (
              <div className="flex flex-col gap-1.5 bg-white/5 border border-white/10 rounded-2xl p-2 items-center shrink-0">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30 text-center w-full block">Optimised Layout</span>
                <div className="flex items-center justify-between w-full mt-1.5">
                  <button onClick={decreaseFontSize} className="w-6.5 h-6.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white font-black text-xs cursor-pointer flex items-center justify-center">-</button>
                  <span className="text-[10px] font-mono font-bold text-white/90 w-8 text-center">{fontSize}px</span>
                  <button onClick={increaseFontSize} className="w-6.5 h-6.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white font-black text-xs cursor-pointer flex items-center justify-center">+</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
