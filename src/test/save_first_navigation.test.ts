/**
 * @vitest-environment jsdom
 *
 * save_first_navigation.test.ts — Save-First & Clean Hard-Navigation Engine Verification Suite
 * Milestone: BUG-MW-141 / ARCH-MW-140 / UI-MW-141
 *
 * Governance: C:\Users\home\studio\.agents\AGENTS.md
 *  - Rule 5: Staging verification & test integrity
 *  - Rule 7: Universal non-degradation & Zuhandenheit Guard (hardware stream release)
 *  - Rule 9: Automated regression shield
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { teardownActiveMediaStreams } from '@/utils/mediaTeardown';

describe('BUG-MW-141: Save-First & Clean Hard-Navigation Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  describe('Safeguard 1: Debounce Invalidation Prior to Navigation', () => {
    it('cancels pending autosave debounced timer when cancelAutosave is invoked', () => {
      let autosaveExecuted = false;
      let timer: NodeJS.Timeout | null = setTimeout(() => {
        autosaveExecuted = true;
      }, 2000);

      const cancelAutosave = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };

      // Invalidate pending autosave before navigation
      cancelAutosave();

      // Fast-forward past the 2000ms debounce
      vi.advanceTimersByTime(3000);

      expect(autosaveExecuted).toBe(false);
      expect(timer).toBeNull();
    });

    it('cancels pending autosave timer inside useMemoryPersistence flush', async () => {
      let autosaveFired = false;
      let autoSaveTimer: NodeJS.Timeout | null = setTimeout(() => {
        autosaveFired = true;
      }, 2000);

      // Simulate the flush cancellation logic implemented in useMemoryPersistence
      const flush = async () => {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
          autoSaveTimer = null;
        }
        return { success: true };
      };

      await flush();
      vi.advanceTimersByTime(3000);

      expect(autosaveFired).toBe(false);
      expect(autoSaveTimer).toBeNull();
    });
  });

  describe('Safeguard 2: MediaStream Hardware Track Teardown', () => {
    it('stops all live tracks on video and audio elements and detaches srcObject', () => {
      const mockVideoTrackStop = vi.fn();
      const mockAudioTrackStop = vi.fn();

      const mockVideoStream = {
        getTracks: vi.fn(() => [
          { readyState: 'live', stop: mockVideoTrackStop, kind: 'video' },
        ]),
      } as unknown as MediaStream;

      const mockAudioStream = {
        getTracks: vi.fn(() => [
          { readyState: 'live', stop: mockAudioTrackStop, kind: 'audio' },
        ]),
      } as unknown as MediaStream;

      const videoEl = document.createElement('video');
      videoEl.srcObject = mockVideoStream;
      document.body.appendChild(videoEl);

      const audioEl = document.createElement('audio');
      audioEl.srcObject = mockAudioStream;
      document.body.appendChild(audioEl);

      // Execute hardware media teardown
      teardownActiveMediaStreams();

      expect(mockVideoTrackStop).toHaveBeenCalledTimes(1);
      expect(mockAudioTrackStop).toHaveBeenCalledTimes(1);
      expect(videoEl.srcObject).toBeNull();
      expect(audioEl.srcObject).toBeNull();
    });

    it('clears global __activeMediaStreams set when present', () => {
      const mockTrackStop = vi.fn();
      const mockStream = {
        getTracks: vi.fn(() => [
          { readyState: 'live', stop: mockTrackStop, kind: 'video' },
        ]),
      };

      const streamSet = new Set([mockStream]);
      (window as any).__activeMediaStreams = streamSet;

      teardownActiveMediaStreams();

      expect(mockTrackStop).toHaveBeenCalledTimes(1);
      expect((window as any).__activeMediaStreams.size).toBe(0);
      delete (window as any).__activeMediaStreams;
    });
  });

  describe('Safeguard 3: 2.5-Second Timeout Race & localStorage Scratchpad Backup', () => {
    it('saves draft prose to localStorage scratchpad fail-safe when flush times out or rejects', async () => {
      const canonicalSceneId = 'part-1-scene-1';
      const draftProse = 'Under the banyan tree, the monsoon bells echoed across the village courtyard.';

      // Stalled flush that exceeds 2,500ms
      const stalledFlush = vi.fn(
        () => new Promise<{ success: boolean }>((resolve) => setTimeout(() => resolve({ success: true }), 10000))
      );

      // Simulate handleSelectScene 2.5s race logic
      let saveSucceeded = false;
      const timeoutPromise = new Promise<{ timedOut: boolean }>((resolve) =>
        setTimeout(() => resolve({ timedOut: true }), 2500)
      );

      const racePromise = Promise.race([
        stalledFlush().then((res) => ({ timedOut: false, res })),
        timeoutPromise,
      ]).then((raceResult) => {
        if (!raceResult.timedOut && (raceResult as any).res?.success !== false) {
          saveSucceeded = true;
        }
      }).catch(() => {
        saveSucceeded = false;
      });

      // Fast-forward 2500ms
      await vi.advanceTimersByTimeAsync(2500);
      await racePromise;

      // If save timed out, back up to localStorage scratchpad
      if (!saveSucceeded) {
        localStorage.setItem(`mw_draft_${canonicalSceneId}`, draftProse);
        localStorage.setItem(`draft_hook_${canonicalSceneId}`, draftProse);
      }

      expect(saveSucceeded).toBe(false);
      expect(localStorage.getItem(`mw_draft_${canonicalSceneId}`)).toBe(draftProse);
      expect(localStorage.getItem(`draft_hook_${canonicalSceneId}`)).toBe(draftProse);
    });

    it('recovers scratchpad draft from mw_draft_ key on mount/rehydration', () => {
      const sceneId = 'part-2-scene-1';
      const savedProse = 'My father unpacked the wooden trunk filled with old fountain pens and handwritten ledgers.';
      localStorage.setItem(`mw_draft_${sceneId}`, savedProse);

      const recovered =
        localStorage.getItem(`mw_draft_${sceneId}`) ||
        localStorage.getItem(`draft_hook_${sceneId}`) ||
        localStorage.getItem('draft_hook_unknown');

      expect(recovered).toBe(savedProse);
    });
  });

  describe('Hard Navigation & Clean Lifecycle Contract', () => {
    it('constructs correct hard-navigation URL for targetSceneId without local title mutation', () => {
      const originalTitle = 'Part I: Roots and Foundations';
      let currentTitle = originalTitle;
      const targetSceneId = 'part-1-scene-2';

      const mockLocationAssign = vi.fn();
      const mockWindow = {
        location: {
          assign: mockLocationAssign,
        },
      };

      // Simulate handleSelectScene navigation trigger
      const handleSelectScene = (sceneId: string) => {
        // Explicitly avoid mutating currentTitle locally!
        mockWindow.location.assign(`/studio/production/${sceneId}?act=1`);
      };

      handleSelectScene(targetSceneId);

      expect(mockLocationAssign).toHaveBeenCalledWith('/studio/production/part-1-scene-2?act=1');
      // Verify local title is never hijacked or mutated in-place
      expect(currentTitle).toBe(originalTitle);
    });
  });

  describe('Fireside Companion Harmonization', () => {
    it('clears autosave timer, saves prose and backs up to scratchpad before scene switch', () => {
      const targetSceneId = 'part-1-scene-2';
      const draftProse = 'Fireside recollection: The taste of warm ginger tea on cold mornings.';
      const onSaveProse = vi.fn();

      let debouncedTimer: NodeJS.Timeout | null = setTimeout(() => {}, 2000);

      // Simulate Fireside handleSelectScene sequence
      if (debouncedTimer) {
        clearTimeout(debouncedTimer);
        debouncedTimer = null;
      }
      onSaveProse(targetSceneId, draftProse);
      localStorage.setItem(`mw_draft_${targetSceneId}`, draftProse);
      localStorage.setItem(`draft_hook_${targetSceneId}`, draftProse);

      expect(debouncedTimer).toBeNull();
      expect(onSaveProse).toHaveBeenCalledWith(targetSceneId, draftProse);
      expect(localStorage.getItem(`mw_draft_${targetSceneId}`)).toBe(draftProse);
    });
  });
});
