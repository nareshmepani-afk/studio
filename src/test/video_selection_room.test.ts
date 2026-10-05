import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useCurriculumVault,
  isSceneCompleted,
} from '@/hooks/useCurriculumVault';
import { MemoirTake } from '@/types/curriculum';

// Mock Firestore
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

describe('MW-106: Multi-Take Video Selection Room & Master Reel Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSnapshotCallback = null;
  });

  it('1. Self-Healing Schema Hydration: synthesises and persists legacyMasterTake when videoUrl exists without takes array', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_test_106', memoirId: 'memoir_ancestral' })
    );

    expect(mockSnapshotCallback).toBeDefined();

    // Deliver a legacy Firestore snapshot: videoUrl present, takes is empty or undefined
    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'part-1-scene-1',
            ref: { id: 'part-1-scene-1', type: 'doc' },
            data: () => ({
              sceneId: 'part-1-scene-1',
              promptId: 'p1',
              sceneTitle: 'A Child of Two Worlds',
              videoUrl: 'https://storage.googleapis.com/test-bucket/desktop_master_4k.webm',
              duration: 184,
              prose: 'Born between two cultures...',
              takes: [], // Legacy unhydrated schema
            }),
          },
        ],
      });
    });

    const scene = result.current.scenes['part-1-scene-1'];
    expect(scene).toBeDefined();
    expect(scene.takes).toBeDefined();
    expect(scene.takes!.length).toBe(1);

    const anchorTake = scene.takes![0];
    expect(anchorTake.id).toBe('take_legacy_desktop_master');
    expect(anchorTake.takeNumber).toBe(1);
    expect(anchorTake.label).toBe('Desktop Soundstage Master Reel');
    expect(anchorTake.mediaUrl).toBe('https://storage.googleapis.com/test-bucket/desktop_master_4k.webm');
    expect(anchorTake.isPreferred).toBe(true);
    expect(anchorTake.role).toBe('master_cut');
    expect(anchorTake.order).toBe(1);

    // Verify Firestore persistence was triggered to self-heal the remote document
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        takes: expect.arrayContaining([
          expect.objectContaining({
            id: 'take_legacy_desktop_master',
            isPreferred: true,
            role: 'master_cut',
          }),
        ]),
        activeTakeId: 'take_legacy_desktop_master',
      }),
      { merge: true }
    );
  });

  it('2. Guardrail 2 Evaluation: isSceneCompleted identifies completed scenes to default new takes to auxiliary audition mode', () => {
    // Memory with legacy videoUrl
    const completedLegacyMemory = {
      videoUrl: 'https://storage.googleapis.com/test-bucket/master.webm',
      takes: [],
    };
    expect(isSceneCompleted(completedLegacyMemory as any)).toBe(true);

    // Memory with existing takes
    const completedMultiTakeMemory = {
      takes: [
        {
          id: 'take_1',
          takeNumber: 1,
          isPreferred: true,
          mediaUrl: 'https://example.com/take1.webm',
        },
      ],
    };
    expect(isSceneCompleted(completedMultiTakeMemory as any)).toBe(true);

    // Memory with explicit act completion
    const completedActMemory = {
      actsCompleted: ['act1', 'act2'],
    };
    expect(isSceneCompleted(completedActMemory as any)).toBe(true);

    // Unrecorded, blank memory
    const blankMemory = {
      videoUrl: null,
      audioUrl: null,
      takes: [],
      actsCompleted: [],
    };
    expect(isSceneCompleted(blankMemory as any)).toBe(false);
  });

  it('3. Active Master Discard Interlock (Amendment 3): discards active master and designates fallback take as Master Reel', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_test_106', memoirId: 'memoir_ancestral' })
    );

    const initialTakes: MemoirTake[] = [
      {
        id: 'take_master_desktop',
        takeNumber: 1,
        source: 'soundstage_desktop',
        mediaMode: 'video',
        mediaUrl: 'https://example.com/desktop_master.webm',
        durationSeconds: 120,
        createdAt: '2026-10-01T10:00:00Z',
        label: 'Desktop Soundstage Master Reel',
        isPreferred: true,
        role: 'master_cut',
        order: 1,
      },
      {
        id: 'take_mobile_audition',
        takeNumber: 2,
        source: 'fireside_mobile',
        mediaMode: 'video',
        mediaUrl: 'https://example.com/mobile_take2.webm',
        durationSeconds: 65,
        createdAt: '2026-10-02T10:00:00Z',
        label: 'Take 2 (Fireside Audition Take)',
        isPreferred: false,
        role: 'alternate',
        order: 2,
      },
    ];

    // Seed scene state
    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'part-1-scene-1',
            data: () => ({
              sceneId: 'part-1-scene-1',
              promptId: 'p1',
              sceneTitle: 'A Child of Two Worlds',
              videoUrl: 'https://example.com/desktop_master.webm',
              activeTakeId: 'take_master_desktop',
              takes: initialTakes,
            }),
          },
        ],
      });
    });

    // Execute safe discard on take_master_desktop, designating take_mobile_audition as fallback
    await act(async () => {
      await result.current.safeDiscardTake('part-1-scene-1', 'take_master_desktop', 'take_mobile_audition');
    });

    const updatedScene = result.current.scenes['part-1-scene-1'];
    expect(updatedScene.takes?.length).toBe(1);

    const remainingTake = updatedScene.takes![0];
    expect(remainingTake.id).toBe('take_mobile_audition');
    expect(remainingTake.isPreferred).toBe(true);
    expect(remainingTake.role).toBe('master_cut');
    expect(remainingTake.order).toBe(1);

    // videoUrl must be updated synchronously to the new master take's URL
    expect(updatedScene.videoUrl).toBe('https://example.com/mobile_take2.webm');
    expect(updatedScene.activeTakeId).toBe('take_mobile_audition');
  });

  it('4. Selection Room Reordering: updates sequence order and persists to vault', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_test_106', memoirId: 'memoir_ancestral' })
    );

    const initialTakes: MemoirTake[] = [
      {
        id: 'take_1',
        takeNumber: 1,
        source: 'soundstage_desktop',
        mediaMode: 'video',
        mediaUrl: 'https://example.com/take1.webm',
        durationSeconds: 60,
        createdAt: '2026-10-01T10:00:00Z',
        label: 'Take 1',
        isPreferred: true,
        order: 1,
      },
      {
        id: 'take_2',
        takeNumber: 2,
        source: 'fireside_mobile',
        mediaMode: 'video',
        mediaUrl: 'https://example.com/take2.webm',
        durationSeconds: 70,
        createdAt: '2026-10-02T10:00:00Z',
        label: 'Take 2',
        isPreferred: false,
        order: 2,
      },
      {
        id: 'take_3',
        takeNumber: 3,
        source: 'fireside_mobile',
        mediaMode: 'video',
        mediaUrl: 'https://example.com/take3.webm',
        durationSeconds: 80,
        createdAt: '2026-10-03T10:00:00Z',
        label: 'Take 3',
        isPreferred: false,
        order: 3,
      },
    ];

    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'part-1-scene-1',
            data: () => ({
              sceneId: 'part-1-scene-1',
              promptId: 'p1',
              sceneTitle: 'A Child of Two Worlds',
              videoUrl: 'https://example.com/take1.webm',
              takes: initialTakes,
            }),
          },
        ],
      });
    });

    // Reorder: Move take_2 to first, take_3 to second, take_1 to third
    await act(async () => {
      await result.current.reorderSceneTakes('part-1-scene-1', ['take_2', 'take_3', 'take_1']);
    });

    const updatedScene = result.current.scenes['part-1-scene-1'];
    expect(updatedScene.takes?.map((t) => t.id)).toEqual(['take_2', 'take_3', 'take_1']);
    expect(updatedScene.takes?.map((t) => t.order)).toEqual([1, 2, 3]);

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        takes: expect.arrayContaining([
          expect.objectContaining({ id: 'take_2', order: 1 }),
          expect.objectContaining({ id: 'take_3', order: 2 }),
          expect.objectContaining({ id: 'take_1', order: 3 }),
        ]),
      }),
      { merge: true }
    );
  });

  it('5. Theatrical Master Promotion: promotes alternate take to Master Reel and updates videoUrl', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_test_106', memoirId: 'memoir_ancestral' })
    );

    const initialTakes: MemoirTake[] = [
      {
        id: 'take_1',
        takeNumber: 1,
        source: 'soundstage_desktop',
        mediaMode: 'video',
        mediaUrl: 'https://example.com/take1.webm',
        durationSeconds: 60,
        createdAt: '2026-10-01T10:00:00Z',
        label: 'Take 1',
        isPreferred: true,
        role: 'master_cut',
        order: 1,
      },
      {
        id: 'take_2',
        takeNumber: 2,
        source: 'fireside_mobile',
        mediaMode: 'video',
        mediaUrl: 'https://example.com/take2.webm',
        durationSeconds: 75,
        createdAt: '2026-10-02T10:00:00Z',
        label: 'Take 2',
        isPreferred: false,
        role: 'alternate',
        order: 2,
      },
    ];

    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'part-1-scene-1',
            data: () => ({
              sceneId: 'part-1-scene-1',
              promptId: 'p1',
              sceneTitle: 'A Child of Two Worlds',
              videoUrl: 'https://example.com/take1.webm',
              takes: initialTakes,
            }),
          },
        ],
      });
    });

    // Promote take_2 to master reel
    await act(async () => {
      await result.current.promotePreferredTake('part-1-scene-1', 'take_2');
    });

    const updatedScene = result.current.scenes['part-1-scene-1'];
    const take1 = updatedScene.takes?.find((t) => t.id === 'take_1');
    const take2 = updatedScene.takes?.find((t) => t.id === 'take_2');

    expect(take2?.isPreferred).toBe(true);
    expect(take2?.role).toBe('master_cut');
    expect(take1?.isPreferred).toBe(false);
    expect(take1?.role).toBe('alternate');

    expect(updatedScene.videoUrl).toBe('https://example.com/take2.webm');
    expect(updatedScene.activeTakeId).toBe('take_2');
  });
});
