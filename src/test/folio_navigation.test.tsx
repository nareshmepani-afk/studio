/**
 * @file folio_navigation.test.tsx
 * Unit & Integration Regression Suite for ARCH-MW-139 / SPEC-MW-139
 * The Heirloom Folio Navigation & Token System
 *
 * Verifies the 4 Refined Safeguards:
 *  1. Safe-area inset bottom offset & auto-hiding when isEditing === true
 *  2. Viewport-adaptive classes (w-14 micro-spine vs w-64 full ledger)
 *  3. Elder typographic baseline (text-xs minimum, >=48px touch targets)
 *  4. Protruding tab clipping shield (overflow-visible, -translate-x-1.5)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  toRomanNumeral,
  resolveFolioSceneState,
  FOLIO_LAYOUT,
  FOLIO_TYPOGRAPHY,
  type FolioSceneToken,
} from '@/components/navigation/folio/folioTokens';
import { FloatingChapterDial } from '@/components/navigation/folio/FloatingChapterDial';
import { MobileThumbRibbon } from '@/components/navigation/folio/MobileThumbRibbon';
import { FilofaxDesktopSpine } from '@/components/navigation/folio/FilofaxDesktopSpine';
import { FolioChapterDrawer } from '@/components/navigation/folio/FolioChapterDrawer';
import { HeirloomFolioSpine } from '@/components/navigation/folio/HeirloomFolioSpine';

const mockScenes: FolioSceneToken[] = [
  {
    id: 'scene-1',
    index: 0,
    sceneNumber: 1,
    title: 'Arrival in Leicester',
    partNumber: 1,
    partTitle: 'PART I: Roots & Foundations',
    hasCompletedReel: true,
    hasDraftProse: true,
    takesCount: 2,
  },
  {
    id: 'scene-2',
    index: 1,
    sceneNumber: 2,
    title: 'The Brass Spice Tin',
    partNumber: 1,
    partTitle: 'PART I: Roots & Foundations',
    hasCompletedReel: false,
    hasDraftProse: true,
    takesCount: 0,
  },
  {
    id: 'scene-3',
    index: 2,
    sceneNumber: 3,
    title: 'First Morning Fog',
    partNumber: 2,
    partTitle: 'PART II: First Winters',
    hasCompletedReel: false,
    hasDraftProse: false,
    takesCount: 0,
    isNextRecommended: true,
  },
];

describe('Heirloom Folio Design Tokens & Primitives', () => {
  it('converts numbers to classic Roman Numerals correctly', () => {
    expect(toRomanNumeral(1)).toBe('Ⅰ');
    expect(toRomanNumeral(2)).toBe('Ⅱ');
    expect(toRomanNumeral(3)).toBe('Ⅲ');
    expect(toRomanNumeral(4)).toBe('Ⅳ');
    expect(toRomanNumeral(5)).toBe('Ⅴ');
    expect(toRomanNumeral(9)).toBe('Ⅸ');
    expect(toRomanNumeral(10)).toBe('Ⅹ');
    expect(toRomanNumeral(14)).toBe('ⅩⅣ');
    expect(toRomanNumeral(20)).toBe('ⅩⅩ');
    expect(toRomanNumeral(31)).toBe('ⅩⅩⅩⅠ');
  });

  it('resolves scene states deterministically (completed, draft, empty, active)', () => {
    expect(resolveFolioSceneState(mockScenes[0], false)).toBe('completed');
    expect(resolveFolioSceneState(mockScenes[1], false)).toBe('draft');
    expect(resolveFolioSceneState(mockScenes[2], false)).toBe('empty');
    expect(resolveFolioSceneState(mockScenes[0], true)).toBe('active');
  });

  it('defines elder-safe typography (Safeguard 3: minimum text-xs)', () => {
    expect(FOLIO_TYPOGRAPHY.METADATA_PILL).toContain('text-xs');
    expect(FOLIO_TYPOGRAPHY.METADATA_PILL).not.toContain('text-[10px]');
    expect(FOLIO_TYPOGRAPHY.METADATA_PILL).toContain('tracking-[0.15em]');
  });
});

describe('Safeguard 1: Mobile Safe-Area & Virtual Keyboard Shield', () => {
  it('renders FloatingChapterDial with safe-area bottom offset and 48px touch target', () => {
    const handleOpenDrawer = vi.fn();
    render(
      <FloatingChapterDial
        currentScene={mockScenes[0]}
        totalScenes={mockScenes.length}
        isEditing={false}
        onOpenDrawer={handleOpenDrawer}
      />
    );

    const dialButton = screen.getByTestId('folio-floating-chapter-dial');
    expect(dialButton).toBeInTheDocument();
    expect(dialButton.className).toContain('min-h-[48px]');

    // Parent container contains safe-area bottom class
    const parent = dialButton.parentElement;
    expect(parent?.className).toContain('bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]');

    fireEvent.click(dialButton);
    expect(handleOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it('auto-hides FloatingChapterDial when isEditing === true', () => {
    render(
      <FloatingChapterDial
        currentScene={mockScenes[0]}
        totalScenes={mockScenes.length}
        isEditing={true}
        onOpenDrawer={vi.fn()}
      />
    );

    const dialButton = screen.getByTestId('folio-floating-chapter-dial');
    expect(dialButton.getAttribute('data-editing-hidden')).toBe('true');
    const parent = dialButton.parentElement;
    expect(parent?.className).toContain('opacity-0');
    expect(parent?.className).toContain('pointer-events-none');
  });

  it('renders MobileThumbRibbon with 48px touch targets and handles prev/next', () => {
    const handlePrev = vi.fn();
    const handleNext = vi.fn();
    const handleOpenDrawer = vi.fn();

    render(
      <MobileThumbRibbon
        currentScene={mockScenes[1]}
        totalScenes={3}
        onPrevScene={handlePrev}
        onNextScene={handleNext}
        onOpenDrawer={handleOpenDrawer}
        canPrev={true}
        canNext={true}
        isEditing={false}
      />
    );

    const prevBtn = screen.getByTestId('folio-thumb-ribbon-prev');
    const nextBtn = screen.getByTestId('folio-thumb-ribbon-next');
    const dialBtn = screen.getByTestId('folio-thumb-ribbon-dial');

    expect(prevBtn.className).toContain('min-h-[48px]');
    expect(nextBtn.className).toContain('min-h-[48px]');
    expect(dialBtn.className).toContain('min-h-[48px]');

    fireEvent.click(prevBtn);
    expect(handlePrev).toHaveBeenCalledTimes(1);

    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);

    fireEvent.click(dialBtn);
    expect(handleOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it('auto-hides MobileThumbRibbon when isEditing === true', () => {
    render(
      <MobileThumbRibbon
        currentScene={mockScenes[0]}
        totalScenes={3}
        onPrevScene={vi.fn()}
        onNextScene={vi.fn()}
        onOpenDrawer={vi.fn()}
        isEditing={true}
      />
    );

    const ribbon = screen.getByTestId('folio-mobile-thumb-ribbon');
    expect(ribbon.getAttribute('data-editing-hidden')).toBe('true');
    expect(ribbon.className).toContain('opacity-0');
    expect(ribbon.className).toContain('pointer-events-none');
  });
});

describe('Safeguard 2 & 4: Filofax Desktop Spine Viewport Adaptation & Clipping Shield', () => {
  it('applies adaptive w-14 on tablet and w-64 on desktop', () => {
    render(
      <FilofaxDesktopSpine
        scenes={mockScenes}
        activeSceneId="scene-1"
        onSelectScene={vi.fn()}
      />
    );

    const spine = screen.getByTestId('folio-filofax-desktop-spine');
    expect(spine).toBeInTheDocument();
    // Hidden on mobile (<768px), w-14 on md (tablet), w-64 on lg (desktop)
    expect(spine.className).toContain('w-14');
    expect(spine.className).toContain('lg:w-64');
  });

  it('Safeguard 4: enforces overflow-visible on spine container to shield protruding tabs', () => {
    render(
      <FilofaxDesktopSpine
        scenes={mockScenes}
        activeSceneId="scene-1"
        onSelectScene={vi.fn()}
      />
    );

    const spine = screen.getByTestId('folio-filofax-desktop-spine');
    expect(spine.className).toContain('overflow-visible');
    expect(spine.className).not.toContain('overflow-hidden');
  });

  it('applies negative translation (-translate-x-1.5) to active tab for physical protrusion', () => {
    render(
      <FilofaxDesktopSpine
        scenes={mockScenes}
        activeSceneId="scene-2"
        onSelectScene={vi.fn()}
      />
    );

    const activeTab = screen.getByTestId('folio-tab-scene-2');
    expect(activeTab.getAttribute('data-active')).toBe('true');
    expect(activeTab.className).toContain('-translate-x-1.5');
    expect(activeTab.className).toContain('z-20');

    const inactiveTab = screen.getByTestId('folio-tab-scene-1');
    expect(inactiveTab.getAttribute('data-active')).toBe('false');
    expect(inactiveTab.className).not.toContain('-translate-x-1.5');
  });

  it('triggers onSelectScene when clicking a tab', () => {
    const handleSelect = vi.fn();
    render(
      <FilofaxDesktopSpine
        scenes={mockScenes}
        activeSceneId="scene-1"
        onSelectScene={handleSelect}
      />
    );

    fireEvent.click(screen.getByTestId('folio-tab-scene-3'));
    expect(handleSelect).toHaveBeenCalledWith('scene-3');
  });
});

describe('FolioChapterDrawer Modal', () => {
  it('renders scenes grouped by Part and selects scene on click', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <FolioChapterDrawer
        isOpen={true}
        onClose={handleClose}
        scenes={mockScenes}
        activeSceneId="scene-1"
        onSelectScene={handleSelect}
      />
    );

    expect(screen.getByTestId('folio-chapter-drawer')).toBeInTheDocument();
    expect(screen.getByText('The Heirloom Folio')).toBeInTheDocument();

    const scene2Button = screen.getByTestId('folio-drawer-scene-scene-2');
    fireEvent.click(scene2Button);

    expect(handleSelect).toHaveBeenCalledWith('scene-2');
    expect(handleClose).toHaveBeenCalled();
  });

  it('closes drawer on close button click', () => {
    const handleClose = vi.fn();
    render(
      <FolioChapterDrawer
        isOpen={true}
        onClose={handleClose}
        scenes={mockScenes}
        activeSceneId="scene-1"
        onSelectScene={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('folio-drawer-close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('HeirloomFolioSpine Master Orchestrator', () => {
  it('orchestrates mobile ribbon, desktop spine, and drawer interaction cleanly', () => {
    const handleSelect = vi.fn();
    render(
      <HeirloomFolioSpine
        scenes={mockScenes}
        activeSceneId="scene-1"
        onSelectScene={handleSelect}
      />
    );

    expect(screen.getByTestId('folio-master-spine')).toBeInTheDocument();
    expect(screen.getByTestId('folio-mobile-thumb-ribbon')).toBeInTheDocument();
    expect(screen.getByTestId('folio-filofax-desktop-spine')).toBeInTheDocument();

    // Drawer is closed by default
    expect(screen.queryByTestId('folio-chapter-drawer')).not.toBeInTheDocument();

    // Open drawer via mobile ribbon dial trigger
    fireEvent.click(screen.getByTestId('folio-thumb-ribbon-dial'));
    expect(screen.getByTestId('folio-chapter-drawer')).toBeInTheDocument();
  });
});
