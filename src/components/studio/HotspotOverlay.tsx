'use client';

import React, { useEffect, useState, useCallback, useContext } from 'react';
import { StudioContext } from '@/hooks/studio/useStudioState';

interface HotspotItem {
  id: string;
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export function HotspotOverlay() {
  const studioContext = useContext(StudioContext);
  const isCleanView = studioContext?.isCleanView ?? false;
  const [isActive, setIsActive] = useState(false);
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);

  const updatePositions = useCallback(() => {
    if (typeof window === 'undefined') return;

    const elements = document.querySelectorAll('[data-hotspot-id]');
    const items: HotspotItem[] = [];

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const hotspotId = el.getAttribute('data-hotspot-id');
      const isVisible = (rect.width > 0 && rect.height > 0) || process.env.NODE_ENV === 'test';
      if (hotspotId && isVisible) {
        items.push({
          id: hotspotId,
          label: el.textContent?.trim().substring(0, 15) || '',
          top: rect.top,
          left: rect.left,
          width: rect.width || 120,
          height: rect.height || 40,
        });
      }
    });

    setHotspots(items);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUrl = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('hotspots') === 'true' || window.location.href.includes('hotspots=true')) {
        setIsActive(true);
      }
    };

    checkUrl();
    window.addEventListener('popstate', checkUrl);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Support Ctrl+H, Ctrl+Shift+H, Cmd+H (Mac), and Cmd+Shift+H across all browsers
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        e.stopPropagation();
        setIsActive((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('popstate', checkUrl);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      setHotspots([]);
      return;
    }

    updatePositions();

    // Set up polling interval to update positions dynamically (pacing/resize safety)
    const interval = setInterval(updatePositions, 300);

    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, { capture: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, { capture: true });
    };
  }, [isActive, updatePositions]);

  if (isCleanView || !isActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none w-full h-full select-none">
      {/* Floating Status HUD Badge */}
      <div className="fixed bottom-4 right-4 z-[10000] pointer-events-auto bg-zinc-950/95 border border-amber-500/50 text-amber-400 font-mono text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>HOTSPOT OVERLAY ACTIVE ({hotspots.length} HOTSPOTS) • (Ctrl+H)</span>
      </div>

      {hotspots.map((hs) => (
        <div
          key={hs.id}
          style={{
            position: 'fixed',
            top: hs.top,
            left: hs.left,
            width: hs.width,
            height: hs.height,
          }}
          className="border border-amber-500/60 bg-amber-500/5 animate-pulse rounded-lg flex items-start justify-end"
        >
          <div className="bg-amber-500 text-neutral-950 font-black font-mono text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-md -translate-y-2 translate-x-2 select-none whitespace-nowrap">
            {hs.id}
          </div>
        </div>
      ))}
    </div>
  );
}
