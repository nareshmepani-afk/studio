'use client';

/**
 * HeirloomFolioSpine.tsx — Master Responsive Heirloom Folio Orchestrator
 * Architecture Reference: ARCH-MW-139 / SPEC-MW-139
 *
 * Safeguards & Governance:
 *  • Safeguard 1: Safe-area inset bottom calculation & virtual keyboard auto-hiding.
 *  • Safeguard 2: Viewport-Adaptive (Mobile thumb ribbon, tablet w-14 micro-spine, desktop w-64 ledger).
 *  • Safeguard 3 & Rule 26: Elder Typographic Baseline (minimum text-xs / 12px, zero text-[10px]).
 *  • Safeguard 4: Protruding Tab Clipping Shield (overflow-visible parent).
 *  • Rule 20: Strict UK English orthography.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { type FolioSceneToken } from './folioTokens';
import { FloatingChapterDial } from './FloatingChapterDial';
import { MobileThumbRibbon } from './MobileThumbRibbon';
import { FilofaxDesktopSpine } from './FilofaxDesktopSpine';
import { FolioChapterDrawer } from './FolioChapterDrawer';

export interface HeirloomFolioSpineProps {
  scenes: FolioSceneToken[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  currentIndex?: number;
  onPrevScene?: () => void;
  onNextScene?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  isEditing?: boolean;
  mobileVariant?: 'dial' | 'ribbon' | 'both';
  includeDesktopSpine?: boolean;
  className?: string;
  dataTestId?: string;
}

export function HeirloomFolioSpine({
  scenes,
  activeSceneId,
  onSelectScene,
  currentIndex,
  onPrevScene,
  onNextScene,
  canPrev,
  canNext,
  isEditing = false,
  mobileVariant = 'ribbon',
  includeDesktopSpine = true,
  className,
  dataTestId = 'folio-master-spine',
}: HeirloomFolioSpineProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeIndex = useMemo(() => {
    if (typeof currentIndex === 'number') return currentIndex;
    const found = scenes.findIndex((s) => s.id === activeSceneId);
    return found !== -1 ? found : 0;
  }, [currentIndex, scenes, activeSceneId]);

  const currentScene = useMemo(() => {
    return scenes[activeIndex] || scenes[0] || {
      id: activeSceneId,
      index: 0,
      title: 'Current Scene',
      partNumber: 1,
      hasCompletedReel: false,
      hasDraftProse: false,
      takesCount: 0,
    };
  }, [scenes, activeIndex, activeSceneId]);

  const totalScenes = scenes.length;

  const handlePrev = useCallback(() => {
    if (onPrevScene) {
      onPrevScene();
    } else if (activeIndex > 0) {
      onSelectScene(scenes[activeIndex - 1].id);
    }
  }, [onPrevScene, activeIndex, onSelectScene, scenes]);

  const handleNext = useCallback(() => {
    if (onNextScene) {
      onNextScene();
    } else if (activeIndex < totalScenes - 1) {
      onSelectScene(scenes[activeIndex + 1].id);
    }
  }, [onNextScene, activeIndex, totalScenes, onSelectScene, scenes]);

  const effectiveCanPrev = canPrev !== undefined ? canPrev : activeIndex > 0;
  const effectiveCanNext = canNext !== undefined ? canNext : activeIndex < totalScenes - 1;

  return (
    <div data-testid={dataTestId} className={className}>
      {/* 1. Mobile Chapter Navigation (< 768px) */}
      {(mobileVariant === 'dial' || mobileVariant === 'both') && (
        <FloatingChapterDial
          currentScene={currentScene}
          totalScenes={totalScenes}
          isEditing={isEditing}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />
      )}

      {(mobileVariant === 'ribbon' || mobileVariant === 'both') && (
        <MobileThumbRibbon
          currentScene={currentScene}
          totalScenes={totalScenes}
          onPrevScene={handlePrev}
          onNextScene={handleNext}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          canPrev={effectiveCanPrev}
          canNext={effectiveCanNext}
          isEditing={isEditing}
        />
      )}

      {/* 2. Desktop & Tablet Viewport-Adaptive Spine (>= 768px) */}
      {includeDesktopSpine && (
        <FilofaxDesktopSpine
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSelectScene={onSelectScene}
        />
      )}

      {/* 3. Accessible 31-Scene Chapter Folio Drawer Modal */}
      <FolioChapterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSelectScene={onSelectScene}
      />
    </div>
  );
}
