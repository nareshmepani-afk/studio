import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useCurriculumVault,
  isSceneCompleted,
} from '@/hooks/useCurriculumVault';
import { MemoirTake, UnifiedCurriculumMemory } from '@/types/curriculum';

// Mock Firebase & Firestore
let mockSnapshotCallback: ((snapshot: any) => void) | null = null;
const mockUnsubscribe = vi.fn();
const mockSetDoc = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ type: 'collection' })),
  doc: vi.fn(() => ({ type: 'doc' })),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  onSnapshot: vi.fn((colRef, onNext) => {
    mockSnapshotCallback = onNext;
    return mockUnsubscribe;
  }),
}));

describe('MW-107: Universal Take Status Machine & Lifecycle Regression Shield', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSnapshotCallback = null;
  });

  describe('1. isSceneCompleted boundary conditions with outtakes', () => {
    it('returns true when active takes exist', () => {
      const memory: Partial<UnifiedCurriculumMemory> = {
        currentStatus: 'captured',
        takes: [
          {
            id: 'take_1',
            label: 'Take 1',
            status: 'master',
            isPreferred: true,
            takeNumber: 1,
            source: 'fireside_mobile',
            mediaMode: 'video',
            mediaUrl: 'https://storage.googleapis.com/take1.mp4',
            durationSeconds: 30,
            createdAt: '2026-10-05T12:00:00Z',
          },
        ],
      };
      expect(isSceneCompleted(memory)).toBe(true);
    });

    it('returns false when only outtake takes exist and videoUrl is null (MW-107 Invariant)', () => {
      const memory: Partial<UnifiedCurriculumMemory> = {
        currentStatus: 'ready_for_action',
        videoUrl: null,
        audioUrl: null,
        takes: [
          {
            id: 'take_1',
            label: 'Take 1',
            status: 'outtake',
            isPreferred: false,
            takeNumber: 1,
            source: 'fireside_mobile',
            mediaMode: 'video',
            mediaUrl: 'https://storage.googleapis.com/take1.mp4',
            durationSeconds: 30,
            createdAt: '2026-10-05T12:00:00Z',
            discardedAt: '2026-10-05T12:05:00Z',
          },
        ],
      };
      expect(isSceneCompleted(memory)).toBe(false);
    });

    it('returns true when active take exists alongside outtake take', () => {
      const memory: Partial<UnifiedCurriculumMemory> = {
        currentStatus: 'captured',
        takes: [
          {
            id: 'take_1',
            label: 'Take 1',
            status: 'outtake',
            isPreferred: false,
            takeNumber: 1,
            source: 'fireside_mobile',
            mediaMode: 'video',
            mediaUrl: 'https://storage.googleapis.com/take1.mp4',
            durationSeconds: 30,
            createdAt: '2026-10-05T12:00:00Z',
            discardedAt: '2026-10-05T12:05:00Z',
          },
          {
            id: 'take_2',
            label: 'Take 2',
            status: 'master',
            isPreferred: true,
            takeNumber: 2,
            source: 'fireside_mobile',
            mediaMode: 'video',
            mediaUrl: 'https://storage.googleapis.com/take2.mp4',
            durationSeconds: 45,
            createdAt: '2026-10-05T12:10:00Z',
          },
        ],
      };
      expect(isSceneCompleted(memory)).toBe(true);
    });

    it('returns true for legacy singleton videoUrl without takes', () => {
      const memory: Partial<UnifiedCurriculumMemory> = {
        currentStatus: 'captured',
        videoUrl: 'https://storage.googleapis.com/legacy_master.mp4',
        takes: [],
      };
      expect(isSceneCompleted(memory)).toBe(true);
    });
  });

  describe('2. Multi-Take Lifecycle, Soft Discard, and Restoration via useCurriculumVault', () => {
    it('assigns status: "master" to the first recorded take', async () => {
      const { result } = renderHook(() =>
        useCurriculumVault({ userId: 'usr_test_1', initialSceneId: 'part-1-scene-1' })
      );

      await act(async () => {
        await result.current.saveSceneTake('part-1-scene-1', {
          id: 'take_101',
          label: 'Take 1 (Fireside Video)',
          takeNumber: 1,
          source: 'fireside_mobile',
          mediaMode: 'video',
          mediaUrl: 'blob:http://localhost/video_1',
          durationSeconds: 20,
          createdAt: '2026-10-05T12:00:00Z',
          isPreferred: true,
        });
      });

      const sceneMem = result.current.getSceneMemory('part-1-scene-1');
      expect(sceneMem).toBeDefined();
      expect(sceneMem?.takes).toHaveLength(1);
      expect(sceneMem?.takes[0].status).toBe('master');
      expect(sceneMem?.takes[0].isPreferred).toBe(true);
      expect(sceneMem?.takes[0].role).toBe('master_cut');
      expect(sceneMem?.videoUrl).toBe('blob:http://localhost/video_1');
    });

    it('demotes previous master when a new preferred take is added', async () => {
      const { result } = renderHook(() =>
        useCurriculumVault({ userId: 'usr_test_1', initialSceneId: 'part-1-scene-1' })
      );

      // Save Take 1 (Master)
      await act(async () => {
        await result.current.saveSceneTake('part-1-scene-1', {
          id: 'take_101',
          label: 'Take 1 (Fireside Video)',
          takeNumber: 1,
          source: 'fireside_mobile',
          mediaMode: 'video',
          mediaUrl: 'blob:http://localhost/video_1',
          durationSeconds: 20,
          createdAt: '2026-10-05T12:00:00Z',
          isPreferred: true,
        });
      });

      // Save Take 2 as preferred Master
      await act(async () => {
        await result.current.saveSceneTake('part-1-scene-1', {
          id: 'take_102',
          label: 'Take 2 (Fireside Video)',
          takeNumber: 2,
          source: 'fireside_mobile',
          mediaMode: 'video',
          mediaUrl: 'blob:http://localhost/video_2',
          durationSeconds: 25,
          createdAt: '2026-10-05T12:01:00Z',
          isPreferred: true,
        });
      });

      const sceneMem = result.current.getSceneMemory('part-1-scene-1');
      expect(sceneMem?.takes).toHaveLength(2);
      // Take 1 demoted to alternate
      const take1 = sceneMem?.takes.find((t) => t.id === 'take_101');
      expect(take1?.status).toBe('alternate');
      expect(take1?.isPreferred).toBe(false);

      // Take 2 promoted to master
      const take2 = sceneMem?.takes.find((t) => t.id === 'take_102');
      expect(take2?.status).toBe('master');
      expect(take2?.isPreferred).toBe(true);
      expect(sceneMem?.videoUrl).toBe('blob:http://localhost/video_2');
    });

    it('soft-discards an alternate take to status: "outtake" without touching master reel', async () => {
      const { result } = renderHook(() =>
        useCurriculumVault({ userId: 'usr_test_1', initialSceneId: 'part-1-scene-1' })
      );

      // Save Take 1 (Master)
      await act(async () => {
        await result.current.saveSceneTake('part-1-scene-1', {
          id: 'take_1',
          label: 'Take 1 (Fireside Video)',
          takeNumber: 1,
          source: 'fireside_mobile',
          mediaMode: 'video',
          mediaUrl: 'blob:http://localhost/video_1',
          durationSeconds: 20,
          createdAt: '2026-10-05T12:00:00Z',
          isPreferred: true,
        });
      });

      // Save Take 2 (Alternate)
      await act(async () => {
        await result.current.saveSceneTake('part-1-scene-1', {
          id: 'take_2',
          label: 'Take 2 (Fireside Video)',
          takeNumber: 2,
          source: 'fireside_mobile',
          mediaMode: 'video',
          mediaUrl: 'blob:http://localhost/video_2',
          durationSeconds: 25,
          createdAt: '2026-10-05T12:01:00Z',
          isPreferred: false,
        });
      });

      // Discard Take 2 (Alternate)
      await act(async () => {
        await result.current.safeDiscardTake('part-1-scene-1', 'take_2');
      });

      const sceneMem = result.current.getSceneMemory('part-1-scene-1');
      expect(sceneMem?.takes).toHaveLength(2);
      const take2 = sceneMem?.takes.find((t) => t.id === 'take_2');
      expect(take2?.status).toBe('outtake');
      expect(take2?.discardedAt).toBeDefined();

      const take1 = sceneMem?.takes.find((t) => t.id === 'take_1');
      expect(take1?.status).toBe('master');
      expect(take1?.isPreferred).toBe(true);
      expect(sceneMem?.videoUrl).toBe('blob:http://localhost/video_1');
    });

    it('soft-discards sole take and atomically executes resetToDraftPayload while preserving Rule 14 prose', async () => {
      const { result } = renderHook(() =>
        useCurriculumVault({ userId: 'usr_test_1', initialSceneId: 'part-1-scene-1' })
      );

      // Save initial prose
      await act(async () => {
        await result.current.updateSceneProse('part-1-scene-1', 'The ancient grandfather clock ticked steadily in the hallway.');
      });

      // Add a bonus note
      await act(async () => {
        await result.current.addBonusMemoryNote('part-1-scene-1', {
          authorName: 'Grandma',
          authorRole: 'family_member',
          text: 'It chimed every quarter hour.',
        });
      });

      // Save Take 1
      await act(async () => {
        await result.current.saveSceneTake('part-1-scene-1', {
          id: 'take_sole',
          label: 'Take 1 (Fireside Video)',
          takeNumber: 1,
          source: 'fireside_mobile',
          mediaMode: 'video',
          mediaUrl: 'blob:http://localhost/video_sole',
          durationSeconds: 35,
          createdAt: '2026-10-05T12:00:00Z',
          isPreferred: true,
        });
      });

      // Discard the sole take
      await act(async () => {
        await result.current.safeDiscardTake('part-1-scene-1', 'take_sole');
      });

      const sceneMem = result.current.getSceneMemory('part-1-scene-1');
      expect(sceneMem).toBeDefined();

      // Take is marked as outtake and preserved
      expect(sceneMem?.takes).toHaveLength(1);
      expect(sceneMem?.takes[0].status).toBe('outtake');
      expect(sceneMem?.takes[0].discardedAt).toBeDefined();

      // Document status downgraded to draft
      expect(sceneMem?.currentStatus).toBe('ready_for_action');
      expect(sceneMem?.status).toBe('draft');
      expect(sceneMem?.videoUrl).toBeNull();
      expect(sceneMem?.audioUrl).toBeNull();
      expect(sceneMem?.activeTakeId).toBeNull();
      expect(sceneMem?.actsCompleted).toEqual(['act1']);

      // Rule 14 Invariants strictly preserved!
      expect(sceneMem?.prose).toBe('The ancient grandfather clock ticked steadily in the hallway.');
      expect(sceneMem?.bonusNotes).toHaveLength(1);
      expect(sceneMem?.bonusNotes[0].text).toBe('It chimed every quarter hour.');

      // isSceneCompleted is now false
      expect(isSceneCompleted(sceneMem)).toBe(false);
    });

    it('restores an outtake take from the Cutting Room Floor and promotes to master if stack was empty', async () => {
      const { result } = renderHook(() =>
        useCurriculumVault({ userId: 'usr_test_1', initialSceneId: 'part-1-scene-1' })
      );

      // Save and discard Take 1
      await act(async () => {
        await result.current.saveSceneTake('part-1-scene-1', {
          id: 'take_to_restore',
          label: 'Take 1 (Fireside Video)',
          takeNumber: 1,
          source: 'fireside_mobile',
          mediaMode: 'video',
          mediaUrl: 'https://storage.googleapis.com/video_restored.mp4',
          durationSeconds: 40,
          createdAt: '2026-10-05T12:00:00Z',
          isPreferred: true,
        });
        await result.current.safeDiscardTake('part-1-scene-1', 'take_to_restore');
      });

      let sceneMem = result.current.getSceneMemory('part-1-scene-1');
      expect(sceneMem?.takes[0].status).toBe('outtake');
      expect(isSceneCompleted(sceneMem)).toBe(false);

      // Restore Take 1 from the Cutting Room Floor!
      await act(async () => {
        await result.current.restoreOuttakeTake('part-1-scene-1', 'take_to_restore');
      });

      sceneMem = result.current.getSceneMemory('part-1-scene-1');
      expect(sceneMem?.takes[0].status).toBe('master');
      expect(sceneMem?.takes[0].isPreferred).toBe(true);
      expect(sceneMem?.takes[0].role).toBe('master_cut');
      expect(sceneMem?.currentStatus).toBe('captured');
      expect(sceneMem?.status).toBe('pre-release');
      expect(sceneMem?.videoUrl).toBe('https://storage.googleapis.com/video_restored.mp4');
      expect(isSceneCompleted(sceneMem)).toBe(true);
    });
  });
});
