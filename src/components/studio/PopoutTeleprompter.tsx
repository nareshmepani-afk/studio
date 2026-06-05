'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { cn } from '@/lib/utils';

export const PopoutTeleprompter: React.FC = () => {
  const {
    sessionId,
    selectedTake,
    fontSize,
    isMirrored,
    scrollSpeed,
    isScrolling,
    actions: {
      toggleScrolling,
      setScrolling,
      setScrollSpeed,
      setFontSize,
      toggleMirror
    }
  } = useStudioState();

  const containerRef = useRef<HTMLDivElement>(null);
  const isInternalScroll = useRef(false);
  const [showAnchor, setShowAnchor] = useState(true);

  // Setup BroadcastChannel for sub-millisecond local scroll/state sync
  useEffect(() => {
    if (!sessionId || sessionId === 'default') return;

    const channelName = `teleprompter_sync_${sessionId}`;
    const channel = new BroadcastChannel(channelName);

    const handleMessage = (event: MessageEvent) => {
      const { type, progress, sender, ...payload } = event.data;
      if (sender === 'popout') return; // Ignore own echoes

      if (type === 'scroll' && containerRef.current) {
        const container = containerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;
        isInternalScroll.current = true;
        container.scrollTop = progress * maxScroll;
        // Reset scroll guard
        setTimeout(() => { isInternalScroll.current = false; }, 20);
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
      }
    };

    channel.addEventListener('message', handleMessage);
    
    // Broadcast initial join to let main window know we are open
    channel.postMessage({ type: 'join', sender: 'popout' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [sessionId, isScrolling, scrollSpeed, fontSize, isMirrored, setScrolling, setScrollSpeed, setFontSize, toggleMirror]);

  // Handle local scroll event in popout and broadcast to main window
  const handleScroll = () => {
    if (isInternalScroll.current || !containerRef.current || !sessionId || sessionId === 'default') return;

    const container = containerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
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
        if (sessionId && sessionId !== 'default') {
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
        if (sessionId && sessionId !== 'default') {
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
        if (sessionId && sessionId !== 'default') {
          const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
          channel.postMessage({
            type: 'state',
            fontSize: newSize,
            sender: 'popout'
          });
          channel.close();
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMirror();
        if (sessionId && sessionId !== 'default') {
          const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
          channel.postMessage({
            type: 'state',
            isMirrored: !isMirrored,
            sender: 'popout'
          });
          channel.close();
        }
      } else if (e.code === 'KeyA') {
        e.preventDefault();
        setShowAnchor(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleScrolling, setFontSize, fontSize, toggleMirror, isScrolling, isMirrored, sessionId]);

  // Automatic scrolling loop inside popout
  useEffect(() => {
    if (!isScrolling) return;

    let animationId: number;
    const scrollPosRef = { current: containerRef.current ? containerRef.current.scrollTop : 0 };

    const scroll = () => {
      if (containerRef.current) {
        scrollPosRef.current += scrollSpeed * 0.4;
        containerRef.current.scrollTop = Math.floor(scrollPosRef.current);

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop >= scrollHeight - clientHeight - 2) {
          setScrolling(false);
          if (sessionId && sessionId !== 'default') {
            const channel = new BroadcastChannel(`teleprompter_sync_${sessionId}`);
            channel.postMessage({ type: 'state', isScrolling: false, sender: 'popout' });
            channel.close();
          }
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling, scrollSpeed, setScrolling, sessionId]);

  const textToPrompt = selectedTake 
    ? selectedTake 
    : "Please load a script take in the Scriptorium drawer first.";

  const paragraphs = useMemo(() => {
    return textToPrompt.split(/\n\s*\n/).filter(Boolean);
  }, [textToPrompt]);

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white flex flex-col font-serif select-none overflow-hidden">
      {/* Eye-Line Visual Anchor Guide */}
      {showAnchor && (
        <div className="absolute top-[30%] left-0 right-0 h-[32px] pointer-events-none z-25 flex items-center justify-between px-3 -translate-y-1/2">
          <div className="absolute inset-y-[15px] left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/5 via-cyan-500/35 to-cyan-500/5 border-t border-cyan-500/15" />
          <span className="text-cyan-400 text-lg font-black animate-pulse drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">▸</span>
          <span className="text-cyan-400 text-lg font-black animate-pulse drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">◂</span>
        </div>
      )}

      {/* Floating telemetry HUD indicators */}
      <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 bg-zinc-950/80 border border-white/5 rounded-lg px-2 py-0.5 text-[8px] font-mono text-zinc-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>SYNC ACTIVE</span>
      </div>

      {/* Tiny controls popover or floating label */}
      <div className="absolute bottom-2 right-2 z-30 flex items-center gap-2 bg-zinc-950/80 border border-white/5 rounded-lg px-2 py-1 text-[8px] font-mono text-zinc-500 pointer-events-auto">
        <span>Space: Play/Pause</span>
        <span>•</span>
        <span>Arrows: FontSize</span>
        <span>•</span>
        <span>A: Anchor</span>
        <span>•</span>
        <button 
          onClick={() => setShowAnchor(p => !p)} 
          className="text-cyan-400 hover:text-cyan-300 font-bold bg-transparent border-0 outline-none cursor-pointer"
        >
          {showAnchor ? 'Hide Line' : 'Show Line'}
        </button>
      </div>

      {/* Main script scrolling container - absolutely zero margin/padding at the top */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        style={{ fontSize: `${fontSize}px` }}
        className={cn(
          "flex-grow overflow-y-auto w-full px-8 pt-[30vh] pb-[60vh] leading-relaxed italic text-zinc-100 scroll-smooth",
          isMirrored && "transform -scale-x-100"
        )}
      >
        <div className="space-y-6 max-w-4xl mx-auto">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="opacity-95 text-justify">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
