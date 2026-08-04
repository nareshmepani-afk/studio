'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { useJourneyLogger } from '@/hooks/telemetry/useJourneyLogger';
import { FlipHorizontal, Play, Pause, ChevronUp, ChevronDown, Layout, Music, Volume2, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { synthesizeStudioSpeech } from '@/actions/studio-vocal';
import { applyTheatricalSlashes, tokenizeSentences } from '@/utils/scriptFormatter';
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
  isTheaterExpanded?: boolean;
  onTheaterExpandToggle?: () => void;
  hasRecordedTake?: boolean;
  isAlchemySaving?: boolean;
  isAlchemyComplete?: boolean;
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

export interface PaceZoneInfo {
  zone: 'paused' | 'contemplative' | 'deliberate' | 'ideal' | 'accelerated' | 'fast';
  label: string;
  badgeClass: string;
  indicatorClass: string;
  glowClass: string;
}

export const getPaceZone = (wpm: number, isScrolling: boolean): PaceZoneInfo => {
  if (!isScrolling || wpm <= 0) {
    return {
      zone: 'paused',
      label: 'PAUSED',
      badgeClass: 'bg-zinc-900/80 text-zinc-300 border-zinc-700/50',
      indicatorClass: 'bg-zinc-400',
      glowClass: ''
    };
  }
  if (wpm < 90) {
    return {
      zone: 'contemplative',
      label: 'CONTEMPLATIVE',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      indicatorClass: 'bg-sky-400',
      glowClass: 'shadow-[0_0_12px_rgba(56,189,248,0.25)]'
    };
  }
  if (wpm >= 90 && wpm <= 119) {
    return {
      zone: 'deliberate',
      label: 'DELIBERATE PACE',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      indicatorClass: 'bg-cyan-400',
      glowClass: 'shadow-[0_0_12px_rgba(34,211,238,0.25)]'
    };
  }
  if (wpm >= 120 && wpm <= 140) {
    return {
      zone: 'ideal',
      label: 'IDEAL CADENCE',
      badgeClass: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      indicatorClass: 'bg-emerald-400',
      glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]'
    };
  }
  if (wpm >= 141 && wpm <= 159) {
    return {
      zone: 'accelerated',
      label: 'ACCELERATED PACE',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      indicatorClass: 'bg-amber-400',
      glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]'
    };
  }
  return {
    zone: 'fast',
    label: 'SLOW DOWN',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
    indicatorClass: 'bg-rose-400',
    glowClass: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]'
  };
};

export interface PaceVisualiserGaugeProps {
  wpm: number;
  isScrolling: boolean;
  className?: string;
}

export const PaceVisualiserGauge: React.FC<PaceVisualiserGaugeProps> = ({ wpm, isScrolling, className }) => {
  const paceInfo = getPaceZone(wpm, isScrolling);
  return (
    <div
      data-hotspot-id="HS_ACT3_TELEPROMPTER_PACE_GAUGE"
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-xl border text-[10px] font-mono font-bold tracking-wider transition-all duration-300 select-none",
        paceInfo.badgeClass,
        className
      )}
      title="Dynamic Spoken Words-Per-Minute (WPM) Cadence Visualiser (Ideal Target: 120-140 WPM)"
    >
      <div className={cn("w-2 h-2 rounded-full animate-pulse", paceInfo.indicatorClass, paceInfo.glowClass)} />
      <span className="text-white font-black">{isScrolling ? `${wpm} WPM` : '0 WPM'}</span>
      <span className="text-[8px] font-black uppercase tracking-widest opacity-80 border-l border-white/10 pl-2">
        {paceInfo.label}
      </span>
    </div>
  );
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
  rehearsalSpeed = 1.5,
  isTheaterExpanded = false,
  onTheaterExpandToggle,
  hasRecordedTake = false,
  isAlchemySaving = false,
  isAlchemyComplete = false
}) => {
  const { 
    sessionId,
    selectedTake, 
    isScrolling,
    isRecording,
    scrollSpeed,
    fontSize,
    isMirrored,
    showBreathingMarks,
    enablePunctuationBraking,
    isolateSentenceHighlight,
    actions: {
      toggleScrolling,
      setScrolling,
      setScrollSpeed,
      setFontSize,
      toggleMirror,
      increaseFontSize,
      decreaseFontSize,
      setShowBreathingMarks,
      setEnablePunctuationBraking,
      setIsolateSentenceHighlight,
      setActiveDrawer,
      toggleRecording,
      setIsRehearsing,
      setRehearsalSpeed
    }
  } = useStudioState();

  const takeStatus = isRecording 
    ? 'recording' 
    : isAlchemySaving 
    ? 'saving' 
    : isAlchemyComplete 
    ? 'complete' 
    : hasRecordedTake 
    ? 'compiled' 
    : 'idle';

  const handleIncreaseFontSize = () => {
    const maxAllowed = isTheaterExpanded ? 48 : 36;
    if (fontSize < maxAllowed) {
      increaseFontSize();
    }
  };

  const handleDecreaseFontSize = () => {
    if (fontSize > 12) {
      decreaseFontSize();
    }
  };

  const isLayoutLocked = modalityMode === 'interview' || isScrolling;

  const [isRehearsingAudio, setIsRehearsingAudio] = useState(false);
  const isInternalScroll = useRef(false);

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

  // Punctuation braking refs (MW-61)
  const brakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isBraking = useRef(false);
  const lastBrakedIndex = useRef(-1);

  const { logEvent } = useJourneyLogger(null, sessionId);

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

  // MW-35 Pace Visualiser Hook (EMA \alpha = 0.25)
  const [currentWpm, setCurrentWpm] = useState(0);

  useEffect(() => {
    if (!isScrolling) {
      setCurrentWpm(0);
      return;
    }

    const interval = setInterval(() => {
      // Calculate target WPM from active scroll speed (speed 1..10 maps to 70..200 WPM)
      const targetWpm = Math.round(45 + scrollSpeedRef.current * 17);
      setCurrentWpm((prev) => {
        if (prev === 0) return targetWpm;
        // EMA Formula: WPM_smoothed = (0.25 * targetWpm) + (0.75 * previousWpm)
        return Math.round(0.25 * targetWpm + 0.75 * prev);
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isScrolling]);

  useEffect(() => {
    if (!sessionId || typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
    channel.postMessage({
      type: 'paceSync',
      wpm: currentWpm,
      isScrolling,
      sender: 'main'
    });
    channel.close();
  }, [currentWpm, isScrolling, sessionId]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
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

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const initiateWebRTCStreamOffer = useCallback(async () => {
    if (!stream || stream.getVideoTracks().length === 0) return;
    if (typeof window === 'undefined' || !('RTCPeerConnection' in window)) return;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getVideoTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && sessionId) {
          const syncChannel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
          try {
            syncChannel.postMessage({ type: 'webrtc-ice-main', candidate: event.candidate.toJSON(), sender: 'main' });
          } catch (err) {
            console.warn('[Teleprompter] Error posting ICE candidate:', err);
          } finally {
            syncChannel.close();
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (sessionId) {
        const syncChannel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
        try {
          syncChannel.postMessage({ type: 'webrtc-offer', offer, sender: 'main' });
          logEvent('WebRTC: Initiated offer stream with STUN configuration', {}, 'INFO');
        } catch (err) {
          console.warn('[Teleprompter] Error posting offer:', err);
        } finally {
          syncChannel.close();
        }
      }
    } catch (err: any) {
      console.warn('[Teleprompter] WebRTC offer creation failed:', err);
      logEvent(`WebRTC: Offer creation failed: ${err?.message || err}`, {}, 'ERROR');
    }
  }, [stream, sessionId]);

  useEffect(() => {
    if (sessionId && stream && stream.getVideoTracks().length > 0) {
      initiateWebRTCStreamOffer();
    }
  }, [sessionId, stream, initiateWebRTCStreamOffer]);

  // Setup BroadcastChannel for popout synchronization
  useEffect(() => {
    if (!sessionId) return;

    const channelName = `teleprompter_sync_${sessionId}`;
    const channel = new BroadcastChannel(channelName);

    const handleMessage = (event: MessageEvent) => {
      const { type, progress, sender, ...payload } = event.data;
      if (sender === 'main') return; // Ignore own echoes

      if (type === 'scroll' && containerRef.current) {
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
        if (payload.isRehearsing !== undefined && setIsRehearsing) {
          setIsRehearsing(payload.isRehearsing);
        }
        if (payload.rehearsalSpeed !== undefined && setRehearsalSpeed) {
          setRehearsalSpeed(payload.rehearsalSpeed);
        }
      } else if (type === 'REHEARSAL_TOGGLE') {
        if (payload.isRehearsing !== undefined && setIsRehearsing) {
          setIsRehearsing(payload.isRehearsing);
        }
      } else if (type === 'REHEARSAL_SPEED') {
        if (payload.speed !== undefined && setRehearsalSpeed) {
          setRehearsalSpeed(payload.speed);
        }
      } else if (type === 'activeSentence') {
        if (payload.index !== undefined && payload.index !== activeSentenceIndexRef.current) {
          setActiveSentenceIndex(payload.index);
        }
      } else if (type === 'startPerformance') {
        console.log('[Teleprompter] BroadcastChannel received startPerformance, dispatching studio-start-performance');
        window.dispatchEvent(new CustomEvent('studio-start-performance'));
      } else if (type === 'stopPerformance') {
        console.log('[Teleprompter] BroadcastChannel received stopPerformance, stopping scroll and dispatching studio-stop-performance');
        setScrolling(false);
        window.dispatchEvent(new CustomEvent('studio-stop-performance'));
      } else if (type === 'webrtc-request-offer') {
        initiateWebRTCStreamOffer();
      } else if (type === 'webrtc-answer') {
        if (peerConnectionRef.current && payload.answer && typeof window !== 'undefined' && 'RTCSessionDescription' in window) {
          peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer)).catch(err => {
            console.warn('[Teleprompter] WebRTC answer error:', err);
          });
        }
      } else if (type === 'webrtc-ice-popout') {
        if (peerConnectionRef.current && payload.candidate && typeof window !== 'undefined' && 'RTCIceCandidate' in window) {
          peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(err => {
            console.warn('[Teleprompter] WebRTC popout ICE error:', err);
          });
        }
      } else if (type === 'toggleCamera') {
        console.log('[Teleprompter] BroadcastChannel received toggleCamera, dispatching studio-toggle-camera:', payload.active);
        window.dispatchEvent(new CustomEvent('studio-toggle-camera', { detail: { active: payload.active } }));
      } else if (type === 'join') {
        initiateWebRTCStreamOffer();
        // Popout just opened! Send current states immediately to popout for instant alignment
        channel.postMessage({
          type: 'state',
          isScrolling,
          scrollSpeed,
          fontSize,
          isMirrored,
          selectedTake,
          showBreathingMarks,
          enablePunctuationBraking,
          isolateSentenceHighlight,
          activeSentenceIndex,
          isRecording,
          takeStatus,
          isCameraActive: !!stream && stream.getVideoTracks().some(t => t.readyState === 'live'),
          sender: 'main'
        });

        if (containerRef.current) {
          const container = containerRef.current;
          const maxScroll = container.scrollHeight - container.clientHeight;
          const currentProgress = maxScroll > 0 ? container.scrollTop / maxScroll : 0;
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
  }, [sessionId, isScrolling, isRecording, scrollSpeed, fontSize, isMirrored, selectedTake, showBreathingMarks, enablePunctuationBraking, isolateSentenceHighlight, activeSentenceIndex, setScrolling, setFontSize, toggleMirror, setShowBreathingMarks, setEnablePunctuationBraking, setIsolateSentenceHighlight, toggleRecording, initiateWebRTCStreamOffer]);

  // Broadcast takeStatus updates to popout window
  useEffect(() => {
    if (sessionId) {
      const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
      channel.postMessage({ type: 'state', takeStatus, sender: 'main' });
      channel.close();
    }
  }, [sessionId, takeStatus]);

  // Send close signal strictly when Teleprompter unmounts (navigating away from active stage)
  useEffect(() => {
    return () => {
      if (sessionId) {
        const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
        channel.postMessage({ type: 'close', sender: 'main' });
        channel.close();
      }
    };
  }, [sessionId]);

  // Handle page refresh / tab close to notify popout
  useEffect(() => {
    if (!sessionId) return;
    const handleUnload = () => {
      const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
      channel.postMessage({ type: 'close', sender: 'main' });
      channel.close();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [sessionId]);

  // Synchronize state changes dynamically to popout window
  useEffect(() => {
    if (!sessionId) return;
    const channelName = `teleprompter_sync_${sessionId}`;
    const channel = new BroadcastChannel(channelName);
    channel.postMessage({
      type: 'state',
      isScrolling,
      scrollSpeed,
      fontSize,
      isMirrored,
      selectedTake,
      showBreathingMarks,
      enablePunctuationBraking,
      isolateSentenceHighlight,
      activeSentenceIndex,
      isRecording,
      sender: 'main'
    });
    channel.close();
  }, [sessionId, isScrolling, isRecording, scrollSpeed, fontSize, isMirrored, selectedTake, showBreathingMarks, enablePunctuationBraking, isolateSentenceHighlight, activeSentenceIndex]);

  const handlePopout = () => {
    if (!sessionId) return;
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
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
      } else if (typeof window !== 'undefined' && window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
        window.speechSynthesis.cancel();
        const cleanCue = sentencesText.replace(/\[[^\]]*\]/g, '').replace(/[\/\s]+/g, ' ').trim();
        const utterance = new SpeechSynthesisUtterance(cleanCue || sentencesText);
        utterance.rate = 1.0;
        utterance.volume = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en-'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        if (!isScrolling) {
          toggleScrolling();
        }

        utterance.onend = () => {
          setIsRehearsingAudio(false);
        };
        utterance.onerror = () => {
          setIsRehearsingAudio(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setIsRehearsingAudio(false);
      }
    } catch (e) {
      console.warn("TTS Rehearsal failed, falling back to Web Speech:", e);
      if (typeof window !== 'undefined' && window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
        window.speechSynthesis.cancel();
        const cleanCue = sentencesText.replace(/\[[^\]]*\]/g, '').replace(/[\/\s]+/g, ' ').trim();
        const utterance = new SpeechSynthesisUtterance(cleanCue || sentencesText);
        utterance.rate = 1.0;
        utterance.volume = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en-'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        if (!isScrolling) {
          toggleScrolling();
        }

        utterance.onend = () => {
          setIsRehearsingAudio(false);
        };
        utterance.onerror = () => {
          setIsRehearsingAudio(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setIsRehearsingAudio(false);
      }
    }
  };

  // Safe cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const rawParagraphs = useMemo(() => {
    if (!selectedTake) return [];
    return selectedTake.split(/\n\s*\n/).filter(Boolean);
  }, [selectedTake]);

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
    : "Please select an authorised take in the Architect's Drawer.";

  const paragraphs = useMemo(() => {
    return textToPrompt.split(/\n\s*\n/).filter(Boolean);
  }, [textToPrompt]);

  const formattedParagraphs = useMemo(() => {
    let sentenceCounter = 0;
    const rawSentencesFlat = rawParagraphs.flatMap(p => tokenizeSentences(p));
    const res = paragraphs.map((para) => {
      const paraText = showBreathingMarks ? applyTheatricalSlashes(para) : para;
      const sentences = tokenizeSentences(paraText);
      return sentences.map(text => {
        const rawText = rawSentencesFlat[sentenceCounter] || text;
        return {
          text,
          rawText,
          index: sentenceCounter++
        };
      });
    });
    formattedParagraphsRef.current = res;
    return res;
  }, [paragraphs, rawParagraphs, showBreathingMarks]);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastActiveIndexRef = useRef<number>(-1);
  const isAiSpeaking = useRef<boolean>(false);
  const lastSpokenIndexRef = useRef<number>(-1);

  // Smooth variable-speed auto-scroll using requestAnimationFrame with sub-pixel accumulator
  useEffect(() => {
    if (!isScrolling || modalityMode === 'interview' || isMini) return;
    
    let animationId: number;
    
    if (containerRef.current) {
      scrollAccumulatorRef.current = containerRef.current.scrollTop;
    }
    
    const scroll = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const activeSpeed = isTableReadActive && rehearsalSpeed !== undefined ? rehearsalSpeed : scrollSpeedRef.current;
        const currentMultiplier = 1.0;

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
                  sender: 'main'
                });
                channel.close();
              }
            }
          }
        }

        const allSentences = formattedParagraphsRef.current.flat();
        const activeSent = allSentences.find(s => s.index === currentActiveIdx);

        // AI Vocal Partner Handshake in Table Read Mode
        if (isTableReadActive && activeSent && currentActiveIdx !== lastSpokenIndexRef.current) {
          const sentTextToTest = (activeSent as any).rawText || activeSent.text;
          const hasCue = /\[INTERVIEWER\]|\[DIRECTOR\]|\[CUE\]|\[PROMPT\]|\[STAGE\]|\[NARRATOR\]/i.test(sentTextToTest) || /\[[^\]]+\]/.test(sentTextToTest);
          if (hasCue) {
            lastSpokenIndexRef.current = currentActiveIdx;
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel();
              const cleanCue = sentTextToTest.replace(/\[[^\]]*\]/gi, '').replace(/[\/\s]+/g, ' ').trim();
              if (cleanCue) {
                const utterance = new SpeechSynthesisUtterance(cleanCue);
                utterance.rate = 1.05;
                utterance.volume = 1.0;
                const voices = window.speechSynthesis.getVoices();
                const englishVoice = voices.find(v => v.lang.startsWith('en-'));
                if (englishVoice) {
                  utterance.voice = englishVoice;
                }
                isAiSpeaking.current = true;
                utterance.onend = () => {
                  isAiSpeaking.current = false;
                };
                utterance.onerror = () => {
                  isAiSpeaking.current = false;
                };
                window.speechSynthesis.speak(utterance);
              }
            }
          }
        }

        // Punctuation Braking logic
        if (enablePunctuationBrakingRef.current && currentActiveIdx !== lastBrakedIndex.current) {
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

        const aiMultiplier = isAiSpeaking.current ? 0 : 1.0;
        const brakeMultiplier = isBraking.current ? 0 : 1.0;
        scrollAccumulatorRef.current += activeSpeed * 0.4 * currentMultiplier * brakeMultiplier * aiMultiplier;
        
        const targetScroll = Math.floor(scrollAccumulatorRef.current);
        lastProgrammaticScrollTop.current = targetScroll;
        container.scrollTop = targetScroll;
        
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop >= scrollHeight - clientHeight - 2) {
          toggleScrolling();
          if (isTableReadActive) {
            window.dispatchEvent(new Event('studio-table-read-ended'));
          }
          return;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => {
      cancelAnimationFrame(animationId);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isScrolling, rehearsalSpeed, toggleScrolling, modalityMode, isMini, isTableReadActive]);

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
              if (container) {
                lastProgrammaticScrollTop.current = value;
                container.scrollTop = value;
              }
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
              if (container) {
                lastProgrammaticScrollTop.current = value;
                container.scrollTop = value;
              }
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
        lastProgrammaticScrollTop.current = 0;
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
          sender: 'main'
        });
        
        channel.postMessage({
          type: 'scroll',
          progress,
          sender: 'main'
        });
        
        channel.close();
      }
    }
  };

  // Track scrolling to sync active beat back to BeatSheet
  const handleScrollTelemetry = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;

    // Capped programmatic scroll check to handle browser-enforced boundaries
    const expectedScroll = lastProgrammaticScrollTop.current !== -1 
      ? Math.min(Math.max(0, maxScroll), lastProgrammaticScrollTop.current) 
      : -1;
    const isProgrammatic = lastProgrammaticScrollTop.current !== -1 && Math.abs(container.scrollTop - expectedScroll) < 2;

    if (!isProgrammatic) {
      lastProgrammaticScrollTop.current = -1;

      // Only broadcast scroll and sentence changes if triggered by direct user interaction
      if (isUserInteractingRef.current) {
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
              sender: 'main'
            });
            channel.close();
          }
        }

        // Broadcast scroll progress if it's a user/auto scroll and not an incoming message sync
        scrollAccumulatorRef.current = container.scrollTop;

        if (sessionId && maxScroll > 0) {
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
      {!isMini && !isTableReadActive && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            {modalityMode !== 'interview' && (
              <button 
                data-hotspot-id="HS_PROMPTER_SCROLL_BTN"
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
                data-hotspot-id="HS_PROMPTER_SCROLL_BTN"
                onClick={() => window.dispatchEvent(new Event('studio-next-cue'))}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-600 text-slate-900 shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all flex items-center gap-2 cursor-pointer"
              >
                Next Cue
              </button>
            )}
            
            {modalityMode !== 'interview' && (
              <>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap">SPEED MULTIPLIER</span>
                  <button 
                    data-hotspot-id="HS_PROMPTER_SPEED_DOWN_BTN"
                    onClick={() => {
                      const newSpeed = Math.max(0.5, scrollSpeed - 0.5);
                      setScrollSpeed(newSpeed);
                      console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                    }}
                    className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 w-6 text-center">{scrollSpeed.toFixed(1)}x</span>
                  <button 
                    data-hotspot-id="HS_PROMPTER_SPEED_UP_BTN"
                    onClick={() => {
                      const newSpeed = scrollSpeed + 0.5;
                      setScrollSpeed(newSpeed);
                      console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                    }}
                    className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                </div>

                {/* PACING CALIBRATION ACTIVE / Presets */}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap">PACING CALIBRATION ACTIVE</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setScrollSpeed(0.8);
                        console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                      }}
                      title="Dramatic Read (~110 WPM)"
                      className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer",
                        Math.abs(scrollSpeed - 0.8) < 0.01 ? "bg-amber-500/25 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      Dramatic
                    </button>
                    <button
                      onClick={() => {
                        setScrollSpeed(1.0);
                        console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                      }}
                      title="Conversational (~140 WPM)"
                      className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer",
                        Math.abs(scrollSpeed - 1.0) < 0.01 ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      Conversational
                    </button>
                    <button
                      onClick={() => {
                        setScrollSpeed(1.2);
                        console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                      }}
                      title="Expressive Delivery (~170 WPM)"
                      className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer",
                        Math.abs(scrollSpeed - 1.2) < 0.01 ? "bg-sky-500/25 text-sky-300 border border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.2)]" : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      Expressive
                    </button>
                  </div>
                </div>
              </>
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
                      onClick={onTheaterExpandToggle || handlePopout}
                      title={onTheaterExpandToggle ? "Expand Teleprompter" : "Pop Out Teleprompter"}
                      className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{onTheaterExpandToggle ? "Expand" : "Pop Out"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-neutral-950 border-white/5 max-w-[280px] p-3 text-xs leading-relaxed text-zinc-300">
                    <div className="space-y-1.5">
                      <p className="font-bold text-[9px] uppercase tracking-widest text-cyan-400">
                        {onTheaterExpandToggle ? "Expand Teleprompter" : "Pop Out Teleprompter"}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {onTheaterExpandToggle 
                          ? "Expand the teleprompter inline to take over the studio screen for maximum readability."
                          : "Open a standalone, bezel-less window aligned right below the camera lens."}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* MW-35 Teleprompter Pace Visualiser */}
              <PaceVisualiserGauge wpm={currentWpm} isScrolling={isScrolling} />

              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30 px-1">Optimised Layout</span>
                <button onClick={handleDecreaseFontSize} className="p-1 hover:bg-white/10 text-white/50 hover:text-white font-black text-xs px-2 cursor-pointer">-</button>
                <span className="text-[10px] font-mono font-bold text-white/70 w-8 text-center">{fontSize}px</span>
                <button onClick={handleIncreaseFontSize} className="p-1 hover:bg-white/10 text-white/50 hover:text-white font-black text-xs px-2 cursor-pointer">+</button>
              </div>

              {/* Vocal Cadence settings group (MW-61) */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30 px-1">Vocal Coaching</span>
                <button
                  onClick={() => {
                    const nextVal = !showBreathingMarks;
                    setShowBreathingMarks(nextVal);
                    console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                  }}
                  title="Show Theatrical Breathing Marks"
                  className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    showBreathingMarks ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  Slashes
                </button>
                <button
                  onClick={() => {
                    const nextVal = !enablePunctuationBraking;
                    setEnablePunctuationBraking(nextVal);
                    console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                  }}
                  title="Enable Smart Punctuation Braking"
                  className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    enablePunctuationBraking ? "bg-sky-500/25 text-sky-300 border border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.2)]" : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  Brakes
                </button>
                <button
                  onClick={() => {
                    const nextVal = !isolateSentenceHighlight;
                    setIsolateSentenceHighlight(nextVal);
                    console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                  }}
                  title="Isolate Active Sentence Highlight"
                  className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    isolateSentenceHighlight ? "bg-purple-500/25 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  Highlight
                </button>
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
          style={{ fontSize: isMini ? '16px' : `${fontSize}px` }}
          className={cn(
            "flex-grow overflow-y-auto pr-2 custom-scrollbar leading-relaxed italic font-serif select-none relative transition-all duration-700",
            isTableReadActive ? "text-left px-6 max-w-5xl mx-auto py-16" : "",
            isMirrored && "transform -scale-x-100"
          )}
        >
          <div className={cn("prose-invert opacity-90 select-none", isMini ? "pb-[150px] space-y-4" : "pb-[400px] space-y-8")}>
            {!selectedTake ? (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-white/5 bg-zinc-950/40 rounded-3xl backdrop-blur-sm max-w-lg mx-auto mt-12 space-y-4 shadow-xl">
                <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-300">No Script Take Selected</h4>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                  Please select an authorised take in the{' '}
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveDrawer('architect')}
                          className="text-cyan-400 hover:text-cyan-300 font-bold underline transition-colors cursor-pointer bg-transparent border-0 p-0 outline-none"
                        >
                          Architect's Drawer
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-200 py-2 px-3">
                        Click to open the Scriptorium drawer & select your script take
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  .
                </p>
              </div>
            ) : (
              formattedParagraphs.map((sentences, paraIdx) => {
                const isActive = paraIdx === activeBeatIndex;
                return (
                  <p
                    key={paraIdx}
                    className={cn(
                      "prose-block transition-all duration-700",
                      modalityMode === 'interview'
                        ? isActive
                          ? 'opacity-100 scale-100 text-emerald-300 font-bold shadow-teal-500/10'
                          : paraIdx < activeBeatIndex
                          ? 'opacity-10 scale-95 duration-100'
                          : 'opacity-30 scale-95'
                        : 'opacity-90'
                    )}
                  >
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
                );
              })
            )}
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

            {/* MW-35 Teleprompter Pace Visualiser Gauge in Sidebar */}
            <div className="flex flex-col items-center shrink-0 w-full">
              <PaceVisualiserGauge wpm={currentWpm} isScrolling={isScrolling} className="w-full flex-col py-1.5 px-2 text-center items-center justify-center gap-1" />
            </div>

            {/* 1. Optimised Font Size controls inside column */}
            {!isTableReadActive && (
              <div className="flex flex-col gap-1.5 bg-white/5 border border-white/10 rounded-2xl p-2 items-center shrink-0">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30 text-center w-full block">Optimised Layout</span>
                <div className="flex items-center justify-between w-full mt-1.5">
                  <button onClick={handleDecreaseFontSize} className="w-6.5 h-6.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white font-black text-xs cursor-pointer flex items-center justify-center">-</button>
                  <span className="text-[10px] font-mono font-bold text-white/90 w-8 text-center">{fontSize}px</span>
                  <button onClick={handleIncreaseFontSize} className="w-6.5 h-6.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white font-black text-xs cursor-pointer flex items-center justify-center">+</button>
                </div>
              </div>
            )}

            {/* 2. Mirror Option */}
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

            {/* 3. Layout Mode (Overlay vs Center) Option */}
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

            {/* 4. Glowing Table Read Option */}
            {onTableReadToggle && (
              <div className="flex flex-col shrink-0">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        data-hotspot-id="HS_STAGE_REHEARSAL_TOGGLE_BTN"
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
                        data-hotspot-id="HS_PROMPTER_VOCAL_BTN"
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

            {/* 5. Pop Out Option */}
            <div className="flex flex-col shrink-0">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      data-hotspot-id="HS_POPOUT_BTN"
                      onClick={handlePopout}
                      title="Pop Out Teleprompter"
                      className="w-full py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Pop Out</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-neutral-950 border-white/5 max-w-[220px] p-3 text-xs leading-relaxed text-zinc-300">
                    <div className="space-y-1.5">
                      <p className="font-bold text-[9px] uppercase tracking-widest text-cyan-400">Pop Out Prompter</p>
                      <p className="text-[10px] text-zinc-400 leading-normal">Open a standalone, bezel-less overlay window aligned right below the camera lens.</p>
                      <div className="pt-1.5 border-t border-white/5 text-[9px] text-zinc-500 font-mono space-y-0.5">
                        <p><strong className="text-zinc-300">Space:</strong> Play / Pause</p>
                        <p><strong className="text-zinc-300">↑/↓:</strong> Adjust Font Size</p>
                        <p><strong className="text-zinc-300">M:</strong> Mirror Mode</p>
                        <p><strong className="text-zinc-300">A:</strong> Toggle Guide Line</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>
      {/* Compact/Mini mode controls bar */}
      {isMini && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 mt-2 shrink-0 px-2 pb-1 bg-black/40 backdrop-blur-md rounded-xl">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={toggleScrolling}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
                isScrolling ? "bg-emerald-500 text-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
              )}
            >
              {isScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isScrolling ? 'Scrolling' : 'Scroll'}
            </button>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-1.5 py-0.5">
              <button 
                onClick={() => {
                  const newSpeed = Math.max(0.5, scrollSpeed - 0.5);
                  setScrollSpeed(newSpeed);
                  console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                }}
                className="p-0.5 rounded hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
              >
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
              <span className="text-[9px] font-mono font-bold text-emerald-400 w-5 text-center">{scrollSpeed.toFixed(1)}</span>
              <button 
                onClick={() => {
                  const newSpeed = scrollSpeed + 0.5;
                  setScrollSpeed(newSpeed);
                  console.log("LOCAL PACING OVERRIDE EMITTED // BROADCAST ROUTE SECURE");
                }}
                className="p-0.5 rounded hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
              >
                <ChevronUp className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Vocal Coaching settings */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-1.5 py-0.5">
            <button
              onClick={() => {
                const nextVal = !showBreathingMarks;
                setShowBreathingMarks(nextVal);
              }}
              title="Slashes"
              className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent",
                showBreathingMarks ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/30" : "text-white/60 hover:text-white"
              )}
            >
              Slashes
            </button>
            <button
              onClick={() => {
                const nextVal = !enablePunctuationBraking;
                setEnablePunctuationBraking(nextVal);
              }}
              title="Brakes"
              className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent",
                enablePunctuationBraking ? "bg-sky-500/25 text-sky-300 border-sky-500/30" : "text-white/60 hover:text-white"
              )}
            >
              Brakes
            </button>
            <button
              onClick={() => {
                const nextVal = !isolateSentenceHighlight;
                setIsolateSentenceHighlight(nextVal);
              }}
              title="Highlight"
              className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent",
                isolateSentenceHighlight ? "bg-purple-500/25 text-purple-300 border-purple-500/30" : "text-white/60 hover:text-white"
              )}
            >
              Highlight
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleMirror}
              className={cn(
                "p-1 rounded-lg border transition-all cursor-pointer",
                isMirrored ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-white/5 border-white/10 text-white/60 hover:text-white"
              )}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handlePopout}
              className="p-1 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
