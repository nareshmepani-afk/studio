import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useCurriculumVault,
  TOTAL_CURRICULUM_SCENES,
  ALL_CURRICULUM_SCENES,
  isSceneCompleted,
} from '@/hooks/useCurriculumVault';
import { MemoirTake, UnifiedCurriculumMemory } from '@/types/curriculum';
import fs from 'fs';

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

describe('MW-88-T1: useCurriculumVault & Bi-Directional Bridge Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSnapshotCallback = null;
  });

  it('1. Initializes empty state cleanly when unauthenticated or no data exists', () => {
    const { result } = renderHook(() => useCurriculumVault());

    expect(result.current.scenes).toEqual({});
    expect(result.current.isLoading).toBe(false);
    expect(result.current.completedScenes).toBe(0);
    expect(result.current.totalScenes).toBe(TOTAL_CURRICULUM_SCENES);
    expect(result.current.vaultProgressPercent).toBe(0);
    expect(result.current.nextPendingSceneId).toBe(ALL_CURRICULUM_SCENES[0].id);
  });

  it('2. Correctly maps scenes by sceneId and calculates metrics from Firestore snapshot', () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    expect(result.current.isLoading).toBe(true);
    expect(mockSnapshotCallback).toBeDefined();

    // Simulate Firestore delivering snapshot with Part 1 Scene 1 completed
    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'doc_scene_1',
            data: () => ({
              id: 'doc_scene_1',
              sceneId: 'part-1-scene-1',
              partNumber: 1,
              sceneNumber: 1,
              sceneTitle: 'Child of Two Worlds',
              originSurface: 'soundstage_desktop',
              currentStatus: 'captured',
              actsCompleted: ['act1', 'act2'],
              takes: [
                {
                  id: 'take_01',
                  takeNumber: 1,
                  source: 'soundstage_desktop',
                  mediaMode: 'video',
                  mediaUrl: 'https://storage.googleapis.com/reel1.mp4',
                  storagePath: 'takes/take_01.mp4',
                  durationSeconds: 180,
                  createdAt: new Date().toISOString(),
                  label: 'Take 1 (Desktop)',
                  isPreferred: true,
                },
              ],
            }),
          },
        ],
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.scenes['part-1-scene-1']).toBeDefined();
    expect(result.current.completedScenes).toBe(1);
    expect(result.current.vaultProgressPercent).toBe(
      Math.round((1 / TOTAL_CURRICULUM_SCENES) * 100)
    );
    // Next pending scene should skip Part I Scene 1 and point to Part I Scene 2
    expect(result.current.nextPendingSceneId).toBe('part-1-scene-2');
  });

  it('3. Non-destructive multi-take invariant: saveSceneTake appends without overwriting existing takes', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    const take1: MemoirTake = {
      id: 'take_fireside_01',
      takeNumber: 1,
      source: 'fireside_mobile',
      mediaMode: 'video',
      mediaUrl: 'https://storage.googleapis.com/fireside1.webm',
      storagePath: 'fireside/take_01.webm',
      durationSeconds: 95,
      createdAt: '2026-09-16T12:00:00.000Z',
      label: 'Take 1 (Fireside Mobile)',
      isPreferred: true,
    };

    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-1', take1);
    });

    const sceneAfterTake1 = result.current.scenes['part-1-scene-1'];
    expect(sceneAfterTake1.takes.length).toBe(1);
    expect(sceneAfterTake1.takes[0].id).toBe('take_fireside_01');
    expect(sceneAfterTake1.takes[0].isPreferred).toBe(true);
    expect(sceneAfterTake1.activeTakeId).toBe('take_fireside_01');
    expect(sceneAfterTake1.actsCompleted).toContain('act2');
    expect(sceneAfterTake1.currentStatus).toBe('captured');

    // Record second take from desktop soundstage
    const take2: MemoirTake = {
      id: 'take_desktop_02',
      takeNumber: 2,
      source: 'soundstage_desktop',
      mediaMode: 'video',
      mediaUrl: 'https://storage.googleapis.com/soundstage2.mp4',
      storagePath: 'desktop/take_02.mp4',
      durationSeconds: 140,
      createdAt: '2026-09-16T14:00:00.000Z',
      label: 'Take 2 (Soundstage 4K)',
      isPreferred: true, // Promotes itself as preferred
    };

    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-1', take2);
    });

    const sceneAfterTake2 = result.current.scenes['part-1-scene-1'];
    // Invariant: Both takes must exist! Multi-take stack preserved!
    expect(sceneAfterTake2.takes.length).toBe(2);
    expect(sceneAfterTake2.takes[0].id).toBe('take_fireside_01');
    expect(sceneAfterTake2.takes[1].id).toBe('take_desktop_02');
    // Take 2 preferred; Take 1 un-preferred
    expect(sceneAfterTake2.takes[0].isPreferred).toBe(false);
    expect(sceneAfterTake2.takes[1].isPreferred).toBe(true);
    expect(sceneAfterTake2.activeTakeId).toBe('take_desktop_02');

    expect(mockSetDoc).toHaveBeenCalled();
  });

  it('4. promotePreferredTake flips preference flags accurately across multi-take stack', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    const take1: MemoirTake = {
      id: 'take_1',
      takeNumber: 1,
      source: 'fireside_mobile',
      mediaMode: 'audio',
      mediaUrl: 'https://storage.googleapis.com/audio1.webm',
      storagePath: 'audio1.webm',
      durationSeconds: 60,
      createdAt: new Date().toISOString(),
      label: 'Take 1',
      isPreferred: true,
    };

    const take2: MemoirTake = {
      id: 'take_2',
      takeNumber: 2,
      source: 'soundstage_desktop',
      mediaMode: 'audio',
      mediaUrl: 'https://storage.googleapis.com/audio2.mp3',
      storagePath: 'audio2.mp3',
      durationSeconds: 65,
      createdAt: new Date().toISOString(),
      label: 'Take 2',
      isPreferred: false,
    };

    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-2', take1);
      await result.current.saveSceneTake('part-1-scene-2', take2);
    });

    // Re-promote Take 1 as preferred
    await act(async () => {
      await result.current.promotePreferredTake('part-1-scene-2', 'take_1');
    });

    const updatedScene = result.current.scenes['part-1-scene-2'];
    expect(updatedScene.takes.find((t) => t.id === 'take_1')?.isPreferred).toBe(true);
    expect(updatedScene.takes.find((t) => t.id === 'take_2')?.isPreferred).toBe(false);
    expect(updatedScene.activeTakeId).toBe('take_1');
  });

  it('5. addBonusMemoryNote appends non-destructive additive note without mutating takes', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    await act(async () => {
      await result.current.addBonusMemoryNote('part-1-scene-1', {
        authorName: 'Naresh Mepani',
        authorRole: 'storyteller',
        text: 'Found my grandmother brass spice grinder in the attic today.',
      });
    });

    const scene = result.current.scenes['part-1-scene-1'];
    expect(scene.bonusNotes.length).toBe(1);
    expect(scene.bonusNotes[0].text).toContain('brass spice grinder');
    expect(scene.bonusNotes[0].authorRole).toBe('storyteller');
    expect(scene.bonusNotes[0].id).toMatch(/^note_/);
  });

  it('6. isSceneCompleted accurately identifies completion across status machine, actsCompleted and takes', () => {
    expect(isSceneCompleted(undefined)).toBe(false);

    // Empty memory
    const emptyMem = {
      id: 'm1',
      userId: 'u1',
      sceneId: 's1',
      partNumber: 1,
      sceneNumber: 1,
      sceneTitle: 'Test',
      originSurface: 'fireside_mobile' as const,
      currentStatus: 'ready_for_action' as const,
      actsCompleted: [],
      smartLandingTarget: 'act1' as const,
      prose: '',
      takes: [],
      activeTakeId: '',
      photos: [],
      directorialPolish: {
        orchestralScoreVolume: 0.25,
        colourGradePreset: 'warm_amber' as const,
        kenBurnsEnabled: true,
        kenBurnsIntensity: 'standard' as const,
        audioNoiseReductionEnabled: true,
        vocalClarityLevel: 'studio_boost' as const,
      },
      bonusNotes: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    expect(isSceneCompleted(emptyMem)).toBe(false);

    // Captured status
    expect(isSceneCompleted({ ...emptyMem, currentStatus: 'captured' })).toBe(true);

    // Mastered status
    expect(isSceneCompleted({ ...emptyMem, currentStatus: 'mastered' })).toBe(true);

    // Acts completed array with act2
    expect(isSceneCompleted({ ...emptyMem, actsCompleted: ['act1', 'act2'] })).toBe(true);

    // Takes present
    expect(
      isSceneCompleted({
        ...emptyMem,
        takes: [
          {
            id: 't1',
            takeNumber: 1,
            source: 'fireside_mobile',
            mediaMode: 'audio',
            mediaUrl: '',
            storagePath: '',
            durationSeconds: 10,
            createdAt: '',
            label: 'T1',
            isPreferred: true,
          },
        ],
      })
    ).toBe(true);
  });

  it('7. Enforces strict Rule 20 British English orthography across useCurriculumVault source code', () => {
    const hookSource = fs.readFileSync('src/hooks/useCurriculumVault.ts', 'utf8');

    // Forbidden Americanisms
    expect(hookSource).not.toMatch(/\bsynchronization\b/i);
    expect(hookSource).not.toMatch(/\bdigitization\b/i);
    expect(hookSource).not.toMatch(/\boptimization\b/i);

    // Required British spellings in comments/code
    expect(hookSource).toMatch(/synchronisation/i);
    expect(hookSource).toMatch(/initialises/i);
  });

  it('8. Supports initialSceneId option and dynamic activeSceneId switching', () => {
    const { result } = renderHook(() =>
      useCurriculumVault({
        userId: 'usr_test',
        memoirId: 'memoir_123',
        initialSceneId: 'part-1-scene-2',
      })
    );

    expect(result.current.activeSceneId).toBe('part-1-scene-2');
    expect(result.current.activeSceneMemory.sceneId).toBe('part-1-scene-2');
    expect(result.current.activeSceneMemory.sceneTitle).toBe('The House I Grew Up In');

    // Switch scene
    act(() => {
      result.current.setActiveSceneId('part-2-scene-1');
    });

    expect(result.current.activeSceneId).toBe('part-2-scene-1');
    expect(result.current.activeSceneMemory.sceneId).toBe('part-2-scene-1');
  });

  it('9. Resolves smartLandingTarget to act3 when mobile takes exist, otherwise act1', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({
        userId: 'usr_test',
        memoirId: 'memoir_123',
        initialSceneId: 'part-1-scene-1',
      })
    );

    // Empty scene defaults to act1
    expect(result.current.smartLandingTarget).toBe('act1');

    // Add a mobile take to the active scene
    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-1', {
        id: 'take_mobile_1',
        takeNumber: 1,
        source: 'fireside_mobile',
        mediaMode: 'video',
        mediaUrl: 'https://storage.googleapis.com/take.webm',
        storagePath: 'takes/take.webm',
        durationSeconds: 120,
        createdAt: new Date().toISOString(),
        label: 'Take 1 (Mobile)',
        isPreferred: true,
      });
    });

    // With mobile take present, smart landing targets act3 (Director Review)
    expect(result.current.smartLandingTarget).toBe('act3');
  });

  it('10. Dual-surface mood tagging invariant: setStoryMoodTag on mobile is reflected in desktop vault query', async () => {
    // 1. Mobile surface hook instance
    const { result: mobileVault } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    // 2. Select emotional mood tag 'nostalgic' on mobile
    await act(async () => {
      await mobileVault.current.setStoryMoodTag('part-1-scene-1', 'nostalgic');
    });

    // 3. Invariant: Mobile scene memory updated immediately (optimistic UI)
    const mobileMemory = mobileVault.current.getSceneMemory('part-1-scene-1');
    expect(mobileMemory.moodTag).toBe('nostalgic');

    // 4. Invariant: Firestore setDoc was called with moodTag and merge: true
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ moodTag: 'nostalgic' }),
      { merge: true }
    );

    // 5. Desktop surface hook instance querying the same scene
    const { result: desktopVault } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    // Simulate Firestore syncing snapshot to desktop surface with persisted moodTag
    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'doc_scene_1',
            data: () => ({
              id: 'doc_scene_1',
              sceneId: 'part-1-scene-1',
              partNumber: 1,
              sceneNumber: 1,
              sceneTitle: 'Child of Two Worlds',
              originSurface: 'fireside_mobile',
              moodTag: 'nostalgic',
              currentStatus: 'captured',
              actsCompleted: ['act1'],
              takes: [],
            }),
          },
        ],
      });
    });

    const desktopMemory = desktopVault.current.getSceneMemory('part-1-scene-1');
    expect(desktopMemory.moodTag).toBe('nostalgic');
  });

  it('11. MW-88-T2 Invariant: Completed scene status signals celebratory reel card state and protects master take', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    // Initial empty scene: not completed
    const initialScene = result.current.getSceneMemory('part-1-scene-1');
    expect(isSceneCompleted(initialScene)).toBe(false);

    // Save initial master performance take
    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-1', {
        id: 'take_theatrical_01',
        takeNumber: 1,
        source: 'fireside_mobile',
        mediaMode: 'video',
        mediaUrl: 'https://storage.googleapis.com/take_theatrical_01.mp4',
        storagePath: 'takes/take_theatrical_01.mp4',
        durationSeconds: 165,
        createdAt: new Date().toISOString(),
        label: 'Take 1 (Theatrical Reel)',
        isPreferred: true,
      });
    });

    const completedScene = result.current.getSceneMemory('part-1-scene-1');
    // Invariant: Marked completed, which signals FiresideCompletedReelCard rendering
    expect(isSceneCompleted(completedScene)).toBe(true);
    expect(completedScene.takes.length).toBe(1);
    expect(completedScene.takes[0].isPreferred).toBe(true);
    expect(completedScene.takes[0].durationSeconds).toBe(165);

    // Recording an additional take appends non-destructively without overwriting Take 1
    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-1', {
        id: 'take_retake_02',
        takeNumber: 2,
        source: 'fireside_mobile',
        mediaMode: 'video',
        mediaUrl: 'https://storage.googleapis.com/take_retake_02.mp4',
        storagePath: 'takes/take_retake_02.mp4',
        durationSeconds: 190,
        createdAt: new Date().toISOString(),
        label: 'Take 2 (Retake)',
        isPreferred: false,
      });
    });

    const multiTakeScene = result.current.getSceneMemory('part-1-scene-1');
    expect(multiTakeScene.takes.length).toBe(2);
    expect(multiTakeScene.takes[0].id).toBe('take_theatrical_01');
    expect(multiTakeScene.takes[1].id).toBe('take_retake_02');
  });

  it('12. MW-88-T2 Invariant: addBonusMemoryNote appends non-destructive additive recollection without mutating master reel URL or duration', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    // Mount master theatrical performance
    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-2', {
        id: 'master_reel_take',
        takeNumber: 1,
        source: 'fireside_mobile',
        mediaMode: 'video',
        mediaUrl: 'https://storage.googleapis.com/kitchen_master.mp4',
        storagePath: 'takes/kitchen_master.mp4',
        durationSeconds: 215,
        createdAt: new Date().toISOString(),
        label: 'Master Theatrical Reel',
        isPreferred: true,
      });
    });

    const beforeNote = result.current.getSceneMemory('part-1-scene-2');
    const masterMediaUrlBefore = beforeNote.takes[0].mediaUrl;
    const masterDurationBefore = beforeNote.takes[0].durationSeconds;

    // Add additive bonus memory note via BonusMemoryDrawer
    await act(async () => {
      await result.current.addBonusMemoryNote('part-1-scene-2', {
        authorName: 'Aunt Meena',
        authorRole: 'family_member',
        text: 'The copper kettle on the left was brought across the ocean in 1964.',
      });
    });

    const afterNote = result.current.getSceneMemory('part-1-scene-2');
    // Invariant: Note appended cleanly
    expect(afterNote.bonusNotes.length).toBe(1);
    expect(afterNote.bonusNotes[0].text).toContain('copper kettle');
    expect(afterNote.bonusNotes[0].authorName).toBe('Aunt Meena');

    // Invariant: Master reel URL, duration, and takes stack remain completely intact!
    expect(afterNote.takes[0].mediaUrl).toBe(masterMediaUrlBefore);
    expect(afterNote.takes[0].durationSeconds).toBe(masterDurationBefore);
    expect(afterNote.takes.length).toBe(1);
  });

  it('13. saveSceneTake updates existing take in-place when matching ID is supplied (upgrading blob URL to cloud URL)', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    const initialTake: MemoirTake = {
      id: 'take_local_123',
      takeNumber: 1,
      source: 'fireside_mobile',
      mediaMode: 'audio',
      mediaUrl: 'blob:https://dev.memoryweaver.studio/abc-123',
      durationSeconds: 45,
      createdAt: new Date().toISOString(),
      label: 'Take 1 (Fireside Voice)',
      isPreferred: true,
    };

    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-1', initialTake);
    });

    const sceneAfterFirstSave = result.current.getSceneMemory('part-1-scene-1');
    expect(sceneAfterFirstSave.takes.length).toBe(1);
    expect(sceneAfterFirstSave.takes[0].mediaUrl).toBe('blob:https://dev.memoryweaver.studio/abc-123');

    // Simulate cloud upload completing and updating the same take ID with permanent cloud URL
    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-1', {
        ...initialTake,
        mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/app/audio_123.mp3',
      });
    });

    const sceneAfterCloudUpdate = result.current.getSceneMemory('part-1-scene-1');
    // Takes array length must NOT double
    expect(sceneAfterCloudUpdate.takes.length).toBe(1);
    expect(sceneAfterCloudUpdate.takes[0].id).toBe('take_local_123');
    expect(sceneAfterCloudUpdate.takes[0].mediaUrl).toBe(
      'https://firebasestorage.googleapis.com/v0/b/app/audio_123.mp3'
    );
  });

  it('14. Firestore snapshot listener synthesises fallback take from legacy videoUrl/audioUrl when takes array is empty', () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'ey96djU6qR1BrDGnvZwp',
            data: () => ({
              promptId: 'p1',
              sceneId: 'part-1-scene-1',
              chapterId: 'part-i',
              partNumber: 1,
              title: 'Child of Two Worlds',
              productionStage: 2,
              actsCompleted: ['act1', 'act2'],
              videoUrl: 'https://firebasestorage.googleapis.com/v0/b/app/desktop_master.mp4',
              takes: [],
            }),
          },
        ],
      });
    });

    const scene = result.current.getSceneMemory('part-1-scene-1');
    expect(scene).toBeDefined();
    expect(scene.takes.length).toBe(1);
    expect(scene.takes[0].mediaUrl).toBe(
      'https://firebasestorage.googleapis.com/v0/b/app/desktop_master.mp4'
    );
    expect(scene.takes[0].source).toBe('soundstage_desktop');
    expect(isSceneCompleted(scene)).toBe(true);
  });

  it('15. Verifies FiresideStudioClient invokes saveSceneTake upon audio and video capture completion', () => {
    const clientSource = fs.readFileSync(
      'src/app/studio/fireside/FiresideStudioClient.tsx',
      'utf8'
    );

    expect(clientSource).toContain('saveSceneTake(effectiveSceneId');
    expect(clientSource).toContain('handleAudioRecordingComplete');
    expect(clientSource).toContain('handleVideoRecordingComplete');
    expect(clientSource).toContain('activeTakeIdRef');
  });
});
