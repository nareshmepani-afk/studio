'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as nextNavigation from 'next/navigation';
import { toast } from 'sonner';
import {
  resolveSceneFromPromptId,
  resolvePromptIdFromSceneId,
} from '@/lib/curriculum/masterStoryStructure';

export type StudioSurface = 'soundstage' | 'fireside';

export interface AdaptiveSurfaceState {
  currentSurface: StudioSurface;
  recommendedSurface: StudioSurface;
  isPureTouchDevice: boolean;
  isNarrowViewport: boolean;
  isDesktopSplitScreen: boolean;
  isFoldable: boolean;
  isLandscapePhone: boolean;
  preferredSurface: StudioSurface | null;
  setPreferredSurface: (surface: StudioSurface) => void;
  getSurfaceRoute: (surface: StudioSurface, currentId?: string, actStage?: string | number) => string;
  switchToSurface: (
    surface: StudioSurface,
    currentId?: string,
    actStage?: string | number,
    isRecording?: boolean
  ) => boolean;
}

/**
 * Resolves the canonical Fireside sceneId (e.g. "part-1-scene-1") from any promptId or memoryId
 */
export function resolveFiresideSceneId(idOrPrompt?: string): string {
  if (!idOrPrompt) return 'part-1-scene-1';
  // If already a sceneId format (part-N-scene-M)
  if (idOrPrompt.startsWith('part-')) return idOrPrompt;
  // If a promptId (e.g. p1..p23)
  const scene = resolveSceneFromPromptId(idOrPrompt);
  if (scene) return scene.id;
  // Authentic memory document ID (preserve it)
  return idOrPrompt;
}

/**
 * Resolves the canonical Soundstage promptId/targetId from any sceneId or memoryId
 */
export function resolveSoundstageId(idOrScene?: string): string {
  if (!idOrScene) return 'p1';
  // If sceneId format (part-N-scene-M), map to promptId
  if (idOrScene.startsWith('part-')) {
    const promptId = resolvePromptIdFromSceneId(idOrScene);
    if (promptId) return promptId;
  }
  // Authentic memory document ID or existing promptId
  return idOrScene;
}

/**
 * Evaluates whether the device is a pure touch screen with zero fine pointing devices.
 * Rule: pointer: coarse && !matchMedia('(any-pointer: fine)').matches
 * This guarantees narrow desktop split-screen windows never trigger mobile gates.
 */
export function checkIsPureTouch(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const hasFine = window.matchMedia('(any-pointer: fine)').matches;
    return isCoarse && !hasFine;
  } catch {
    return false;
  }
}

export function useAdaptiveSurface(): AdaptiveSurfaceState {
  const router = typeof nextNavigation?.useRouter === 'function' ? nextNavigation.useRouter() : null;
  const pathname = typeof nextNavigation?.usePathname === 'function' ? nextNavigation.usePathname() : (typeof window !== 'undefined' ? window.location.pathname : '');
  const searchParams = typeof nextNavigation?.useSearchParams === 'function' ? nextNavigation.useSearchParams() : null;

  const currentSurface: StudioSurface = useMemo(() => {
    if (pathname?.includes('/fireside')) return 'fireside';
    return 'soundstage';
  }, [pathname]);

  const [preferredSurface, setPreferredSurfaceState] = useState<StudioSurface | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('mw_preferred_surface');
      if (stored === 'soundstage' || stored === 'fireside') return stored;
    } catch {}
    return null;
  });

  const [deviceMetrics, setDeviceMetrics] = useState({
    width: 0,
    height: 0,
    isPureTouch: false,
    isFoldable: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const evaluate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight || 1;
      const aspectRatio = width / height;
      const isPureTouch = checkIsPureTouch();
      const isFoldable = width >= 600 && aspectRatio >= 0.85;

      setDeviceMetrics({
        width,
        height,
        isPureTouch,
        isFoldable,
      });
    };

    evaluate();
    window.addEventListener('resize', evaluate);
    window.addEventListener('orientationchange', evaluate);

    return () => {
      window.removeEventListener('resize', evaluate);
      window.removeEventListener('orientationchange', evaluate);
    };
  }, []);

  const isNarrowViewport = deviceMetrics.width > 0 && deviceMetrics.width < 768;
  const isPureTouchDevice = deviceMetrics.isPureTouch;
  const isDesktopSplitScreen = isNarrowViewport && !isPureTouchDevice;
  const isLandscapePhone =
    isPureTouchDevice &&
    deviceMetrics.height > 0 &&
    deviceMetrics.height < 500 &&
    deviceMetrics.width < 1024;

  const recommendedSurface: StudioSurface = useMemo(() => {
    if (preferredSurface) return preferredSurface;
    if (isPureTouchDevice && (isNarrowViewport || isLandscapePhone)) {
      return 'fireside';
    }
    return 'soundstage';
  }, [preferredSurface, isPureTouchDevice, isNarrowViewport, isLandscapePhone]);

  const setPreferredSurface = useCallback((surface: StudioSurface) => {
    setPreferredSurfaceState(surface);
    try {
      localStorage.setItem('mw_preferred_surface', surface);
    } catch {}
  }, []);

  const getSurfaceRoute = useCallback(
    (surface: StudioSurface, currentId?: string, actStage?: string | number): string => {
      const activeId = currentId || searchParams?.get('id') || 'part-1-scene-1';
      if (surface === 'fireside') {
        const firesideId = resolveFiresideSceneId(activeId);
        return `/studio/fireside?id=${encodeURIComponent(firesideId)}`;
      } else {
        const soundstageId = resolveSoundstageId(activeId);
        const actQuery = actStage ? `?act=${actStage}` : '?act=1';
        return `/studio/production/${encodeURIComponent(soundstageId)}${actQuery}`;
      }
    },
    [searchParams]
  );

  const switchToSurface = useCallback(
    (
      surface: StudioSurface,
      currentId?: string,
      actStage?: string | number,
      isRecording?: boolean
    ): boolean => {
      if (isRecording) {
        toast.warning('Recording in Progress', {
          description: 'Please stop your active take before switching studio surfaces.',
          duration: 3000,
        });
        return false;
      }

      const route = getSurfaceRoute(surface, currentId, actStage);
      setPreferredSurface(surface);

      toast.info(
        `Switching to ${surface === 'soundstage' ? 'Soundstage' : 'Fireside Studio'}`,
        {
          description: 'Preserving active scene continuity...',
          duration: 1500,
        }
      );

      if (router?.push) {
        router.push(route);
      } else if (typeof window !== 'undefined') {
        window.location.href = route;
      }
      return true;
    },
    [getSurfaceRoute, router, setPreferredSurface]
  );

  return {
    currentSurface,
    recommendedSurface,
    isPureTouchDevice,
    isNarrowViewport,
    isDesktopSplitScreen,
    isFoldable: deviceMetrics.isFoldable,
    isLandscapePhone,
    preferredSurface,
    setPreferredSurface,
    getSurfaceRoute,
    switchToSurface,
  };
}

export default useAdaptiveSurface;
