'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { applyTheatricalSlashes, tokenizeSentences } from '@/utils/scriptFormatter';

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
    return `<span class="px-0.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold transition-all hover:bg-emerald-500/20" title="Sound Anchor">${word}</span>`;
  });

  // Aroma Anchors (Exclude matching inside HTML tags/attributes)
  const aromaRegex = new RegExp(`(<[^>]*>)|\\b(${aromaPattern})\\b`, 'gi');
  processed = processed.replace(aromaRegex, (match, tag, word) => {
    if (tag) return tag;
    return `<span class="px-0.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold transition-all hover:bg-amber-500/20" title="Scent Anchor">${word}</span>`;
  });

  // Visual/Texture Anchors (Exclude matching inside HTML tags/attributes)
  const visualRegex = new RegExp(`(<[^>]*>)|\\b(${visualPattern})\\b`, 'gi');
  processed = processed.replace(visualRegex, (match, tag, word) => {
    if (tag) return tag;
    return `<span class="px-0.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-bold transition-all hover:bg-purple-500/20" title="Visual/Texture Anchor">${word}</span>`;
  });

  // Double Slashes (//) with pulsing dot under it
  const doubleSlashRegex = new RegExp(`(<[^>]*>)|(\\s+//|//)`, 'g');
  processed = processed.replace(doubleSlashRegex, (match, tag) => {
    if (tag) return tag;
    return ` <span class="relative inline-flex flex-col items-center justify-center mx-1.5 group select-none"><span class="text-sky-400 font-bold select-none cursor-help hover:text-sky-300 leading-none">//</span><span class="absolute -bottom-2.5 flex gap-1 items-center justify-center"><span class="relative flex items-center justify-center"><span class="absolute w-2 h-2 rounded-full bg-sky-400/80 animate-ping" style="animation-duration: 1.5s;"></span><span class="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span></span><span class="relative flex items-center justify-center"><span class="absolute w-2 h-2 rounded-full bg-sky-400/80 animate-ping" style="animation-duration: 1.5s; animation-delay: 0.3s;"></span><span class="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span></span></span></span>`;
  });

  // Single Slashes (/) with pulsing dot under it
  const singleSlashRegex = new RegExp(`(<[^>]*>)|(\\s+/(?!/)|(?<!/)/(?!/))`, 'g');
  processed = processed.replace(singleSlashRegex, (match, tag) => {
    if (tag) return tag;
    return ` <span class="relative inline-flex flex-col items-center justify-center mx-1 group select-none"><span class="text-emerald-400 font-bold select-none cursor-help hover:text-emerald-300 leading-none">/</span><span class="absolute -bottom-2.5 flex items-center justify-center"><span class="absolute w-2 h-2 rounded-full bg-emerald-400/80 animate-ping" style="animation-duration: 1.5s;"></span><span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span></span></span>`;
  });

  return processed;
};

const getBrakeDuration = (text: string): number => {
  const clean = text.trim();
  if (clean.endsWith('//') || clean.endsWith('.') || clean.endsWith('!') || clean.endsWith('?')) {
    return 500;
  }
  if (clean.endsWith('/') || clean.endsWith(',')) {
    return 200;
  }
  if (clean.endsWith(':') || clean.endsWith('-') || clean.endsWith(';')) {
    return 300;
  }
  return 0;
};

export const PopoutTeleprompter: React.FC = () => {
  const {
    sessionId,
    selectedTake,
    fontSize,
    isMirrored,
    scrollSpeed,
    isScrolling,
    isRecording,
    showBreathingMarks,
    enablePunctuationBraking,
    isolateSentenceHighlight,
    actions: {
      toggleScrolling,
      setScrolling,
      setScrollSpeed,
      setFontSize,
      toggleMirror,
      setSelectedTake,
      setShowBreathingMarks,
      setEnablePunctuationBraking,
      setIsolateSentenceHighlight,
      toggleRecording
    }
  } = useStudioState();

  const containerRef = useRef<HTMLDivElement>(null);
  const isInternalScroll = useRef(false);
  const [showAnchor, setShowAnchor] = useState(true);
  const [showHelper, setShowHelper] = useState(true);
  const [showSelfie, setShowSelfie] = useState(true);
  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);
  const selfieVideoRef = useRef<HTMLVideoElement>(null);

  // Dynamic Camera Stream Access for Selfie Preview
  useEffect(() => {
    if (!showSelfie) {
      if (selfieStream) {
        selfieStream.getTracks().forEach(track => track.stop());
        setSelfieStream(null);
      }
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          setSelfieStream(stream);
        })
        .catch(err => {
          console.warn("Could not access camera for pop-out selfie preview:", err);
        });
    }

    return () => {
      if (selfieStream) {
        selfieStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showSelfie]);

  useEffect(() => {
    if (selfieVideoRef.current && selfieStream) {
      selfieVideoRef.current.srcObject = selfieStream;
    }
  }, [selfieStream]);

  // Gesture damping tracking (MW-60)
  const isDamped = useRef(false);
  const dampingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track direct user interaction to distinguish manual scrolls from layout-induced reflows
  const isUserInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const recordUserInteraction = () => {
    isUserInteractingRef.current = true;
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 1000);
  };

  // Vocal coaching states and coordinate cache refs (MW-61)
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const sentenceCoordinates = useRef<{ startY: number; endY: number; index: number }[]>([]);

  // Punctuation braking refs (MW-61)
  const brakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isBraking = useRef(false);
  const lastBrakedIndex = useRef(-1);

  // Sync refs to prevent scroll loop re-instantiation
  const scrollSpeedRef = useRef(scrollSpeed);
  const enablePunctuationBrakingRef = useRef(enablePunctuationBraking);
  const activeSentenceIndexRef = useRef(activeSentenceIndex);
  const formattedParagraphsRef = useRef<any[]>([]);
  const scrollAccumulatorRef = useRef(0);
  const lastProgrammaticScrollTop = useRef(-1);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  useEffect(() => {
    enablePunctuationBrakingRef.current = enablePunctuationBraking;
  }, [enablePunctuationBraking]);

  useEffect(() => {
    activeSentenceIndexRef.current = activeSentenceIndex;
  }, [activeSentenceIndex]);

  // Clean up damping, braking, and interaction timers on unmount
  useEffect(() => {
    return () => {
      if (dampingTimeoutRef.current) {
        clearTimeout(dampingTimeoutRef.current);
      }
      if (brakeTimeoutRef.current) {
        clearTimeout(brakeTimeoutRef.current);
      }
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  // Track user interaction on scroll container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const passiveEvents = ['wheel', 'touchmove', 'pointerdown'];
    passiveEvents.forEach(event => {
      container.addEventListener(event, recordUserInteraction, { passive: true });
    });
    
    container.addEventListener('keydown', recordUserInteraction);

    return () => {
      passiveEvents.forEach(event => {
        container.removeEventListener(event, recordUserInteraction);
      });
      container.removeEventListener('keydown', recordUserInteraction);
    };
  }, []);

  // Cache coordinates on load, resize, or typography changes to prevent layout thrashing
  const recacheCoordinates = () => {
    if (!containerRef.current) return;
    const spans = containerRef.current.querySelectorAll('span[data-sentence-index]');
    const coords: { startY: number; endY: number; index: number }[] = [];
    
    spans.forEach((span: any) => {
      const idx = parseInt(span.getAttribute('data-sentence-index') || '0', 10);
      const startY = span.offsetTop;
      const endY = startY + span.offsetHeight;
      coords.push({ startY, endY, index: idx });
    });
    
    sentenceCoordinates.current = coords;
  };

  useEffect(() => {
    const timer = setTimeout(recacheCoordinates, 150);
    window.addEventListener('resize', recacheCoordinates);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', recacheCoordinates);
    };
  }, [selectedTake, showBreathingMarks, fontSize]);

  // Auto-focus the popout window immediately on mount so keyboard shortcuts work right away
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.focus();
    }
  }, []);

  const handleStartPerformance = () => {
    console.log('[Popout] handleStartPerformance clicked, broadcasting startPerformance');
    if (sessionId) {
      const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
      channel.postMessage({ type: 'startPerformance', sender: 'popout' });
      channel.close();
    }
  };

  const handleStopPerformance = () => {
    console.log('[Popout] handleStopPerformance clicked, broadcasting stopPerformance');
    if (sessionId) {
      const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
      channel.postMessage({ type: 'stopPerformance', sender: 'popout' });
      channel.close();
    }
  };

  // Auto-hide helper guide after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelper(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Setup BroadcastChannel for sub-millisecond local scroll/state sync
  useEffect(() => {
    if (!sessionId) return;

    const channelName = `teleprompter_sync_${sessionId}`;
    const channel = new BroadcastChannel(channelName);

    const handleMessage = (event: MessageEvent) => {
      const { type, progress, sender, ...payload } = event.data;
      if (sender === 'popout') return; // Ignore own echoes

      if (type === 'close') {
        window.close();
      } else if (type === 'scroll' && containerRef.current) {
        const container = containerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;
        const targetScroll = progress * maxScroll;
        scrollAccumulatorRef.current = targetScroll;
        lastProgrammaticScrollTop.current = targetScroll;
        container.scrollTop = targetScroll;
      } else if (type === 'state') {
        if (payload.isScrolling !== undefined && payload.isScrolling !== isScrolling) {
          setScrolling(payload.isScrolling);
        }
        if (payload.scrollSpeed !== undefined && payload.scrollSpeed !== scrollSpeed) {
          setScrollSpeed(payload.scrollSpeed);
        }
        if (payload.fontSize !== undefined && payload.fontSize !== fontSize) {
          setFontSize(payload.fontSize);
        }
        if (payload.isMirrored !== undefined && payload.isMirrored !== isMirrored) {
          if (payload.isMirrored !== isMirrored) {
            toggleMirror();
          }
        }
        if (payload.selectedTake !== undefined && payload.selectedTake !== selectedTake) {
          setSelectedTake(payload.selectedTake);
        }
        if (payload.showBreathingMarks !== undefined && payload.showBreathingMarks !== showBreathingMarks) {
          setShowBreathingMarks(payload.showBreathingMarks);
        }
        if (payload.enablePunctuationBraking !== undefined && payload.enablePunctuationBraking !== enablePunctuationBraking) {
          setEnablePunctuationBraking(payload.enablePunctuationBraking);
        }
        if (payload.isolateSentenceHighlight !== undefined && payload.isolateSentenceHighlight !== isolateSentenceHighlight) {
          setIsolateSentenceHighlight(payload.isolateSentenceHighlight);
        }
        if (payload.activeSentenceIndex !== undefined && payload.activeSentenceIndex !== activeSentenceIndexRef.current) {
          setActiveSentenceIndex(payload.activeSentenceIndex);
        }
        if (payload.isRecording !== undefined && payload.isRecording !== isRecording) {
          toggleRecording();
        }
      } else if (type === 'activeSentence') {
        if (payload.index !== undefined && payload.index !== activeSentenceIndexRef.current) {
          setActiveSentenceIndex(payload.index);
        }
      }
    };

    channel.addEventListener('message', handleMessage);
    
    // Broadcast initial join to let main window know we are open
    channel.postMessage({ type: 'join', sender: 'popout' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [sessionId, isScrolling, isRecording, scrollSpeed, fontSize, isMirrored, selectedTake, showBreathingMarks, enablePunctuationBraking, isolateSentenceHighlight, setScrolling, setScrollSpeed, setFontSize, toggleMirror, setSelectedTake, setShowBreathingMarks, setEnablePunctuationBraking, setIsolateSentenceHighlight, toggleRecording]);

  const handleSentenceClick = (index: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const span = container.querySelector(`span[data-sentence-index="${index}"]`) as HTMLElement;
    if (span) {
      const targetScrollTop = span.offsetTop - container.clientHeight * 0.3;
      const finalScroll = Math.max(0, Math.min(container.scrollHeight - container.clientHeight, targetScrollTop));
      
      setActiveSentenceIndex(index);
      scrollAccumulatorRef.current = finalScroll;
      lastProgrammaticScrollTop.current = finalScroll;
      container.scrollTop = finalScroll;

      if (sessionId) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        const progress = maxScroll > 0 ? finalScroll / maxScroll : 0;
        
        const channelName = `teleprompter_sync_${sessionId}`;
        const channel = new BroadcastChannel(channelName);
        
        channel.postMessage({
          type: 'activeSentence',
          index,
          sender: 'popout'
        });
        
        channel.postMessage({
          type: 'scroll',
          progress,
          sender: 'popout'
        });
        
        channel.close();
      }
    }
  };

  // Handle local scroll event in popout and broadcast to main window
  const handleScroll = () => {
    if (!containerRef.current || !sessionId) return;

    const container = containerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;

    // Capped programmatic scroll check to handle browser-enforced boundaries
    const expectedScroll = lastProgrammaticScrollTop.current !== -1 
      ? Math.min(Math.max(0, maxScroll), lastProgrammaticScrollTop.current) 
      : -1;
    const isProgrammatic = lastProgrammaticScrollTop.current !== -1 && Math.abs(container.scrollTop - expectedScroll) < 2;

    if (isProgrammatic) return;

    lastProgrammaticScrollTop.current = -1;

    // Only broadcast scroll and sentence changes if triggered by direct user interaction
    if (!isUserInteractingRef.current) return;

    // Identify active sentence passing eye-line anchor (30% height of viewport)
    if (sentenceCoordinates.current.length > 0) {
      const anchorY = container.scrollTop + container.clientHeight * 0.3;
      const match = sentenceCoordinates.current.find(
        coord => anchorY >= coord.startY && anchorY <= coord.endY
      );
      if (match && match.index !== activeSentenceIndex) {
        setActiveSentenceIndex(match.index);
        const channelName = `teleprompter_sync_${sessionId}`;
        const channel = new BroadcastChannel(channelName);
        channel.postMessage({
          type: 'activeSentence',
          index: match.index,
          sender: 'popout'
        });
        channel.close();
      }
    }

    // Sync accumulator ref if scrolled manually by user
    scrollAccumulatorRef.current = container.scrollTop;

    if (maxScroll <= 0) return;

    const progress = container.scrollTop / maxScroll;
    const channelName = `teleprompter_sync_${sessionId}`;
    const channel = new BroadcastChannel(channelName);
    
    channel.postMessage({
      type: 'scroll',
      progress,
      sender: 'popout'
    });
    channel.close();
  };

  // Keyboard Shortcuts inside Popout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleScrolling();
        if (sessionId) {
          const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
          channel.postMessage({
            type: 'state',
            isScrolling: !isScrolling,
            sender: 'popout'
          });
          channel.close();
        }
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setFontSize(fontSize + 2);
        if (sessionId) {
          const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
          channel.postMessage({
            type: 'state',
            fontSize: fontSize + 2,
            sender: 'popout'
          });
          channel.close();
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newSize = Math.max(12, fontSize - 2);
        setFontSize(newSize);
        if (sessionId) {
          const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
          channel.postMessage({
            type: 'state',
            fontSize: newSize,
            sender: 'popout'
          });
          channel.close();
        }
      } else if (e.code === 'BracketRight' || e.code === 'Equal') {
        e.preventDefault();
        const newSpeed = scrollSpeed + 0.2;
        setScrollSpeed(newSpeed);
        console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
        if (sessionId) {
          const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
          channel.postMessage({
            type: 'state',
            scrollSpeed: newSpeed,
            sender: 'popout'
          });
          channel.close();
        }
      } else if (e.code === 'BracketLeft' || e.code === 'Minus') {
        e.preventDefault();
        const newSpeed = Math.max(0.2, scrollSpeed - 0.2);
        setScrollSpeed(newSpeed);
        console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
        if (sessionId) {
          const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
          channel.postMessage({
            type: 'state',
            scrollSpeed: newSpeed,
            sender: 'popout'
          });
          channel.close();
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMirror();
        if (sessionId) {
          const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
          channel.postMessage({
            type: 'state',
            isMirrored: !isMirrored,
            sender: 'popout'
          });
          channel.close();
        }
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        setShowSelfie(prev => !prev);
      } else if (e.code === 'KeyA') {
        e.preventDefault();
        setShowAnchor(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleScrolling, setFontSize, fontSize, toggleMirror, isScrolling, isMirrored, sessionId, scrollSpeed, setScrollSpeed, showSelfie]);

  // Automatic scrolling loop inside popout
  useEffect(() => {
    if (!isScrolling) return;

    let animationId: number;
    
    if (containerRef.current) {
      scrollAccumulatorRef.current = containerRef.current.scrollTop;
    }

    const scroll = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const currentMultiplier = isDamped.current ? 0.8 : 1.0;

        // Check active sentence index at 30% eye-line anchor
        let currentActiveIdx = activeSentenceIndexRef.current;
        if (sentenceCoordinates.current.length > 0) {
          const anchorY = container.scrollTop + container.clientHeight * 0.3;
          const match = sentenceCoordinates.current.find(
            coord => anchorY >= coord.startY && anchorY <= coord.endY
          );
          if (match) {
            currentActiveIdx = match.index;
            if (match.index !== activeSentenceIndexRef.current) {
              setActiveSentenceIndex(match.index);
              if (sessionId) {
                const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
                channel.postMessage({
                  type: 'activeSentence',
                  index: match.index,
                  sender: 'popout'
                });
                channel.close();
              }
            }
          }
        }

        // Punctuation Braking logic
        if (enablePunctuationBrakingRef.current && currentActiveIdx !== lastBrakedIndex.current) {
          const allSentences = formattedParagraphsRef.current.flat();
          const activeSent = allSentences.find(s => s.index === currentActiveIdx);
          if (activeSent) {
            const duration = getBrakeDuration(activeSent.text);
            if (duration > 0) {
              isBraking.current = true;
              lastBrakedIndex.current = currentActiveIdx;
              
              if (brakeTimeoutRef.current) {
                clearTimeout(brakeTimeoutRef.current);
              }
              brakeTimeoutRef.current = setTimeout(() => {
                isBraking.current = false;
              }, duration);
            }
          }
        }

        const brakeMultiplier = isBraking.current ? 0 : 1.0;
        scrollAccumulatorRef.current += scrollSpeedRef.current * 0.4 * currentMultiplier * brakeMultiplier;
        
        const targetScroll = Math.floor(scrollAccumulatorRef.current);
        lastProgrammaticScrollTop.current = targetScroll;
        container.scrollTop = targetScroll;

        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop >= scrollHeight - clientHeight - 2) {
          setScrolling(false);
          if (sessionId) {
            const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
            channel.postMessage({ type: 'state', isScrolling: false, sender: 'popout' });
            channel.close();
          }
          return;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling, setScrolling, sessionId]);

  const cleanText = useMemo(() => {
    if (!selectedTake) return '';
    // Strip bracketed directorial directions
    let text = selectedTake.replace(/\[[^\]]*\]/g, '');
    // Clean up spaces before punctuation
    text = text.replace(/\s+([.,!?;:])/g, '$1');
    // Clean up duplicate periods that might occur if punctuation existed both inside/outside or adjacent
    text = text.replace(/\.{2,}/g, '.');
    // Collapse multiple spaces
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }, [selectedTake]);

  const textToPrompt = cleanText 
    ? cleanText 
    : "Please load a script take in the Scriptorium drawer first.";

  const paragraphs = useMemo(() => {
    return textToPrompt.split(/\n\s*\n/).filter(Boolean);
  }, [textToPrompt]);

  const formattedParagraphs = useMemo(() => {
    let sentenceCounter = 0;
    const res = paragraphs.map((para) => {
      const paraText = showBreathingMarks ? applyTheatricalSlashes(para) : para;
      const sentences = tokenizeSentences(paraText);
      return sentences.map(text => ({
        text,
        index: sentenceCounter++
      }));
    });
    formattedParagraphsRef.current = res;
    return res;
  }, [paragraphs, showBreathingMarks]);

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white flex flex-col font-serif select-none overflow-hidden">
      {/* Floating START/STOP PERFORMANCE Button */}
      {/* Floating PERFORMANCE Controls (Start / Stop / Pause) */}
      <div className="fixed bottom-24 left-8 z-45 flex flex-col gap-2.5">
        {!isRecording ? (
          <button
            onClick={handleStartPerformance}
            className="px-4 py-1.5 bg-rose-600 border border-rose-500 text-white text-[8px] font-black uppercase tracking-[0.25em] rounded-full animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)] flex items-center gap-1.5 transition-colors hover:bg-rose-500 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            START PERFORMANCE
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleStopPerformance}
              className="px-4 py-1.5 bg-rose-600 border border-rose-500 text-white text-[8px] font-black uppercase tracking-[0.25em] rounded-full shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center gap-1.5 transition-colors hover:bg-rose-500 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              STOP PERFORMANCE
            </button>
            <button
              onClick={() => {
                const nextVal = !isScrolling;
                setScrolling(nextVal);
                if (sessionId) {
                  const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
                  channel.postMessage({ type: 'state', isScrolling: nextVal, sender: 'popout' });
                  channel.close();
                }
              }}
              className="px-4 py-1.5 bg-zinc-950 border border-amber-500/50 text-amber-400 text-[8px] font-black uppercase tracking-[0.25em] rounded-full flex items-center gap-1.5 transition-colors hover:bg-zinc-900 cursor-pointer shadow-lg"
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", isScrolling ? "bg-amber-400 animate-pulse" : "bg-zinc-500")} />
              {isScrolling ? 'PAUSE SCROLL' : 'RESUME SCROLL'}
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Webcam Selfie Preview (Top Center) */}
      {showSelfie && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-40 h-28 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 opacity-40 hover:opacity-100">
          <video
            ref={selfieVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-zinc-950/80 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SELFIE</span>
          </div>
        </div>
      )}

      {/* Eye-Line Visual Anchor Guide */}
      {showAnchor && (
        <div className="absolute top-[30%] left-0 right-0 h-[32px] pointer-events-none z-25 flex items-center justify-between px-3 -translate-y-1/2">
          <div className="absolute inset-y-[15px] left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/5 via-cyan-500/35 to-cyan-500/5 border-t border-cyan-500/15" />
          <span className="text-cyan-400 text-lg font-black animate-pulse drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">▸</span>
          <span className="text-cyan-400 text-lg font-black animate-pulse drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">◂</span>
        </div>
      )}

      {/* Sleek, auto-fading Keyboard Shortcuts Guide */}
      <AnimatePresence>
        {showHelper && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            transition={{ duration: 0.3 }}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-zinc-950/95 border border-white/10 rounded-2xl px-5 py-3 text-xs font-mono text-zinc-300 shadow-2xl backdrop-blur-md pointer-events-auto transition-all duration-300",
              showSelfie ? "top-52" : "top-20"
            )}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Shortcuts Guide</span>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white text-[10px] font-bold shadow-sm">Space</kbd>
                <span>Play/Pause</span>
              </div>
              <span className="text-zinc-800">•</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white text-[10px] font-bold shadow-sm">↑/↓</kbd>
                <span>Size</span>
              </div>
              <span className="text-zinc-800">•</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white text-[10px] font-bold shadow-sm">M</kbd>
                <span>Mirror</span>
              </div>
              <span className="text-zinc-800">•</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white text-[10px] font-bold shadow-sm">A</kbd>
                <span>Anchor</span>
              </div>
              <span className="text-zinc-800">•</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white text-[10px] font-bold shadow-sm">S</kbd>
                <span>Selfie</span>
              </div>
            </div>
            <button 
              onClick={() => setShowHelper(false)}
              className="text-zinc-500 hover:text-white transition-colors border-0 bg-transparent cursor-pointer font-bold pl-2 text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating telemetry HUD indicators */}
      <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 bg-zinc-950/80 border border-white/5 rounded-lg px-2 py-0.5 text-[8px] font-mono text-zinc-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>SYNC ACTIVE</span>
      </div>

      {/* Floating top Speed Multiplier Toolbar */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-4 bg-zinc-950/80 border border-white/5 text-xs px-3.5 py-1 rounded-xl backdrop-blur-md shadow-lg pointer-events-auto not-italic font-sans">
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">SPEED MULTIPLIER</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newSpeed = Math.max(0.2, scrollSpeed - 0.2);
            setScrollSpeed(newSpeed);
            if (sessionId) {
              const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
              channel.postMessage({ type: 'state', scrollSpeed: newSpeed, sender: 'popout' });
              channel.close();
            }
          }}
          className="w-4 h-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center font-bold text-[10px] cursor-pointer select-none transition-colors"
        >
          -
        </button>
        <span className="text-[10px] font-mono font-bold text-emerald-400 w-8 text-center">{scrollSpeed.toFixed(1)}x</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newSpeed = scrollSpeed + 0.2;
            setScrollSpeed(newSpeed);
            if (sessionId) {
              const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
              channel.postMessage({ type: 'state', scrollSpeed: newSpeed, sender: 'popout' });
              channel.close();
            }
          }}
          className="w-4 h-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center font-bold text-[10px] cursor-pointer select-none transition-colors"
        >
          +
        </button>
      </div>

      {/* Main script scrolling container - absolutely zero margin/padding at the top */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        onWheel={(e) => {
          if (isScrolling && e.deltaY < 0) {
            isDamped.current = true;
            if (dampingTimeoutRef.current) {
              clearTimeout(dampingTimeoutRef.current);
            }
            dampingTimeoutRef.current = setTimeout(() => {
              isDamped.current = false;
            }, 1500);
          }
        }}
        style={{ fontSize: `${fontSize}px` }}
        className={cn(
          "flex-grow overflow-y-auto w-full px-8 pt-[30vh] pb-[60vh] leading-relaxed italic text-zinc-100",
          isMirrored && "transform -scale-x-100"
        )}
      >
        <div className="space-y-6 max-w-4xl mx-auto relative">
          {formattedParagraphs.map((sentences, paraIdx) => (
            <p key={paraIdx} className="opacity-95 text-justify">
              {sentences.map((sent) => (
                <span
                  key={sent.index}
                  data-sentence-index={sent.index}
                  onClick={() => handleSentenceClick(sent.index)}
                  className={cn(
                    "transition-all duration-300 cursor-pointer hover:text-white",
                    isolateSentenceHighlight
                      ? sent.index === activeSentenceIndex
                        ? "text-white font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
                        : "text-zinc-600/40"
                      : "text-zinc-100"
                  )}
                  dangerouslySetInnerHTML={{ __html: `${highlightSensoryAnchors(sent.text)} ` }}
                />
              ))}
            </p>
          ))}

          {/* Integrated Control and Speed HUD - Positioned right after the last word (MW-60) */}
          <div className="pt-10 mt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 not-italic font-sans">
            {/* Speed Multiplier Toolbar */}
            <div className="flex items-center gap-4 bg-zinc-950/80 border border-zinc-800 text-xs px-4 py-2 rounded-xl backdrop-blur-md shadow-lg pointer-events-auto">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">SPEED MULTIPLIER</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newSpeed = Math.max(0.2, scrollSpeed - 0.2);
                  setScrollSpeed(newSpeed);
                  console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                  if (sessionId) {
                    const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
                    channel.postMessage({ type: 'state', scrollSpeed: newSpeed, sender: 'popout' });
                    channel.close();
                  }
                }}
                className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none transition-colors"
              >
                -
              </button>
              <span className="text-[11px] font-mono font-bold text-emerald-400 w-8 text-center">{scrollSpeed.toFixed(1)}x</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newSpeed = scrollSpeed + 0.2;
                  setScrollSpeed(newSpeed);
                  console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                  if (sessionId) {
                    const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
                    channel.postMessage({ type: 'state', scrollSpeed: newSpeed, sender: 'popout' });
                    channel.close();
                  }
                }}
                className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none transition-colors"
              >
                +
              </button>
            </div>

            {/* Vocal Cadence settings group (MW-61) */}
            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 text-xs px-4 py-2 rounded-xl backdrop-blur-md shadow-lg pointer-events-auto">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-1">Vocal Coaching</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextVal = !showBreathingMarks;
                  setShowBreathingMarks(nextVal);
                  if (sessionId) {
                    const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
                    channel.postMessage({ type: 'state', showBreathingMarks: nextVal, sender: 'popout' });
                    channel.close();
                  }
                }}
                title="Show Theatrical Breathing Marks"
                className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border",
                  showBreathingMarks ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-white/60 border-transparent hover:text-white hover:bg-white/5"
                )}
              >
                Slashes
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextVal = !enablePunctuationBraking;
                  setEnablePunctuationBraking(nextVal);
                  if (sessionId) {
                    const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
                    channel.postMessage({ type: 'state', enablePunctuationBraking: nextVal, sender: 'popout' });
                    channel.close();
                  }
                }}
                title="Enable Smart Punctuation Braking"
                className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border",
                  enablePunctuationBraking ? "bg-sky-500/25 text-sky-300 border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.2)]" : "text-white/60 border-transparent hover:text-white hover:bg-white/5"
                )}
              >
                Brakes
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextVal = !isolateSentenceHighlight;
                  setIsolateSentenceHighlight(nextVal);
                  if (sessionId) {
                    const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
                    channel.postMessage({ type: 'state', isolateSentenceHighlight: nextVal, sender: 'popout' });
                    channel.close();
                  }
                }}
                title="Isolate Active Sentence Highlight"
                className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border",
                  isolateSentenceHighlight ? "bg-purple-500/25 text-purple-300 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "text-white/60 border-transparent hover:text-white hover:bg-white/5"
                )}
              >
                Highlight
              </button>
            </div>

            {/* Keyboard Shortcuts HUD */}
            <div className="flex items-center gap-3 bg-zinc-950/85 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-zinc-400 pointer-events-auto backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-1">
                <kbd className="px-1 rounded bg-white/5 border border-white/10 text-white text-[9px] font-bold">Space</kbd>
                <span>Play/Pause</span>
              </div>
              <span className="text-white/10">•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1 rounded bg-white/5 border border-white/10 text-white text-[9px] font-bold">↑/↓</kbd>
                <span>Size</span>
              </div>
              <span className="text-white/10">•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1 rounded bg-white/5 border border-white/10 text-white text-[9px] font-bold">M</kbd>
                <span>Mirror</span>
              </div>
              <span className="text-white/10">•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1 rounded bg-white/5 border border-white/10 text-white text-[9px] font-bold">A</kbd>
                <span>Anchor</span>
              </div>
              <span className="text-white/10">•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1 rounded bg-white/5 border border-white/10 text-white text-[9px] font-bold">S</kbd>
                <span>Selfie</span>
              </div>
              <span className="text-white/10">|</span>
              <button 
                onClick={() => setShowAnchor(p => !p)} 
                className="text-cyan-400 hover:text-cyan-300 font-bold bg-transparent border-0 outline-none cursor-pointer text-[10px]"
              >
                {showAnchor ? 'Hide Line' : 'Show Line'}
              </button>
              <span className="text-white/10">|</span>
              <button 
                onClick={() => setShowSelfie(p => !p)} 
                className="text-emerald-400 hover:text-emerald-300 font-bold bg-transparent border-0 outline-none cursor-pointer text-[10px]"
              >
                {showSelfie ? 'Hide Selfie' : 'Show Selfie'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
