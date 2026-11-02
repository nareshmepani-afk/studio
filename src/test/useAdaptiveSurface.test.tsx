import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import {
  useAdaptiveSurface,
  checkIsPureTouch,
  resolveFiresideSceneId,
  resolveSoundstageId,
} from '@/hooks/useAdaptiveSurface';
import { StudioSurfaceSwitcher } from '@/components/studio/StudioSurfaceSwitcher';
import { MobilePortalOverlay } from '@/components/studio/overlays/MobilePortalOverlay';

// Mock Next.js navigation
const mockPush = vi.fn();
let mockPathname = '/studio/production/p1';
let mockSearchParams = new URLSearchParams('id=p1');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('SPEC: Adaptive Studio Switcher & Device-Aware Routing', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockPathname = '/studio/production/p1';
    mockSearchParams = new URLSearchParams('id=p1');

    originalMatchMedia = window.matchMedia;
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
    localStorage.clear();
  });

  // Helper to mock matchMedia
  const setupMediaQueries = (matchesCoarse: boolean, matchesAnyFine: boolean) => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      if (query.includes('pointer: coarse')) {
        return {
          matches: matchesCoarse,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      }
      if (query.includes('any-pointer: fine')) {
        return {
          matches: matchesAnyFine,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      }
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });
  };

  describe('1. Pointer & Device Gate Logic (Requirement 4)', () => {
    it('identifies desktop split-screen windows (width: 500px, any-pointer: fine) as NOT pure touch', () => {
      setupMediaQueries(false, true); // Desktop with mouse/trackpad
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });

      expect(checkIsPureTouch()).toBe(false);

      const { result } = renderHook(() => useAdaptiveSurface());
      expect(result.current.isPureTouchDevice).toBe(false);
      expect(result.current.isDesktopSplitScreen).toBe(true);
      expect(result.current.recommendedSurface).toBe('soundstage');
    });

    it('identifies smartphone portrait (pointer: coarse, !any-pointer: fine) as pure touch', () => {
      setupMediaQueries(true, false); // Smartphone
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 844 });

      expect(checkIsPureTouch()).toBe(true);

      const { result } = renderHook(() => useAdaptiveSurface());
      expect(result.current.isPureTouchDevice).toBe(true);
      expect(result.current.isNarrowViewport).toBe(true);
      expect(result.current.recommendedSurface).toBe('fireside');
    });

    it('identifies landscape smartphone (width: 932px, height: 430px, pointer: coarse) as mobile touch', () => {
      setupMediaQueries(true, false); // Phone in landscape
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 932 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 430 });

      const { result } = renderHook(() => useAdaptiveSurface());
      expect(result.current.isPureTouchDevice).toBe(true);
      expect(result.current.isLandscapePhone).toBe(true);
      expect(result.current.recommendedSurface).toBe('fireside');
    });
  });

  describe('2. 100% Scene & Prompt ID Continuity (Requirement 2)', () => {
    it('maps prompt IDs (p1..p23) to canonical Fireside scene IDs', () => {
      expect(resolveFiresideSceneId('p1')).toBe('part-1-scene-1');
      expect(resolveFiresideSceneId('p2')).toBe('part-1-scene-2');
      expect(resolveFiresideSceneId('p5')).toBe('part-2-scene-2');
    });

    it('preserves existing scene IDs and authentic Firestore memory IDs when resolving Fireside route', () => {
      expect(resolveFiresideSceneId('part-2-scene-2')).toBe('part-2-scene-2');
      expect(resolveFiresideSceneId('ey96djU6qR1BrDGnvZwp')).toBe('ey96djU6qR1BrDGnvZwp');
    });

    it('maps Fireside scene IDs back to Soundstage prompt IDs', () => {
      expect(resolveSoundstageId('part-1-scene-1')).toBe('p1');
      expect(resolveSoundstageId('part-2-scene-2')).toBe('p5');
    });

    it('preserves prompt IDs and authentic Firestore memory IDs when resolving Soundstage route', () => {
      expect(resolveSoundstageId('p1')).toBe('p1');
      expect(resolveSoundstageId('ey96djU6qR1BrDGnvZwp')).toBe('ey96djU6qR1BrDGnvZwp');
    });

    it('generates correct bi-directional routes preserving scene continuity and act stage', () => {
      setupMediaQueries(false, true);
      const { result } = renderHook(() => useAdaptiveSurface());

      const toFireside = result.current.getSurfaceRoute('fireside', 'p5');
      expect(toFireside).toBe('/studio/fireside?id=part-2-scene-2');

      const toSoundstage = result.current.getSurfaceRoute('soundstage', 'part-2-scene-2', 3);
      expect(toSoundstage).toBe('/studio/production/p5?act=3');
    });
  });

  describe('3. Active Recording Switch Lock (Requirement 3)', () => {
    it('blocks switching and emits warning when isRecording is true', () => {
      setupMediaQueries(false, true);
      const { result } = renderHook(() => useAdaptiveSurface());

      const switched = result.current.switchToSurface('fireside', 'p1', 1, true);
      expect(switched).toBe(false);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('allows switching when isRecording is false and saves preference', () => {
      setupMediaQueries(false, true);
      const { result } = renderHook(() => useAdaptiveSurface());

      let switched = false;
      act(() => {
        switched = result.current.switchToSurface('fireside', 'p1', 1, false);
      });
      expect(switched).toBe(true);
      expect(mockPush).toHaveBeenCalledWith('/studio/fireside?id=part-1-scene-1');
      expect(localStorage.getItem('mw_preferred_surface')).toBe('fireside');
    });
  });

  describe('4. StudioSurfaceSwitcher Component (Requirement 1 & UI)', () => {
    it('renders the segmented pill with active surface indicator', () => {
      setupMediaQueries(false, true);
      render(
        <StudioSurfaceSwitcher
          currentSurface="soundstage"
          currentSceneId="p1"
          isRecording={false}
        />
      );

      const switcher = screen.getByTestId('studio-surface-switcher');
      expect(switcher).toBeDefined();

      const soundstageBtn = screen.getByTestId('switcher-soundstage-btn');
      const firesideBtn = screen.getByTestId('switcher-fireside-btn');
      expect(soundstageBtn).toBeDefined();
      expect(firesideBtn).toBeDefined();

      // Soundstage button is active
      expect(soundstageBtn.className).toContain('border-emerald-500');
    });

    it('disables buttons and displays LOCKED badge when isRecording is true', () => {
      setupMediaQueries(false, true);
      render(
        <StudioSurfaceSwitcher
          currentSurface="soundstage"
          currentSceneId="p1"
          isRecording={true}
        />
      );

      const soundstageBtn = screen.getByTestId('switcher-soundstage-btn') as HTMLButtonElement;
      const firesideBtn = screen.getByTestId('switcher-fireside-btn') as HTMLButtonElement;
      expect(soundstageBtn.disabled).toBe(true);
      expect(firesideBtn.disabled).toBe(true);
      expect(screen.getByText('LOCKED')).toBeDefined();
    });

    it('invokes router navigation to Fireside with resolved scene continuity when clicked', () => {
      setupMediaQueries(false, true);
      render(
        <StudioSurfaceSwitcher
          currentSurface="soundstage"
          currentSceneId="p5"
          isRecording={false}
        />
      );

      const firesideBtn = screen.getByTestId('switcher-fireside-btn');
      fireEvent.click(firesideBtn);

      expect(mockPush).toHaveBeenCalledWith('/studio/fireside?id=part-2-scene-2');
    });
  });

  describe('5. MobilePortalOverlay 1-Tap Fireside Integration', () => {
    it('renders Choice 3 1-tap Fireside button and navigates with resolved scene ID', () => {
      render(
        <MobilePortalOverlay
          onActivateRemoteLens={vi.fn()}
          onExit={vi.fn()}
          promptId="p5"
          memoryTitle="The Shape of Loss"
        />
      );

      const launchFiresideBtn = screen.getByTestId('mobile-overlay-launch-fireside-btn');
      expect(launchFiresideBtn).toBeDefined();

      fireEvent.click(launchFiresideBtn);
      expect(mockPush).toHaveBeenCalledWith('/studio/fireside?id=part-2-scene-2');
    });
  });
});
