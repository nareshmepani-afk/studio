import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import fs from 'fs';
import {
  saveDraftToVault,
  getDraftFromVault,
  listVaultDrafts,
  deleteDraftFromVault,
  saveVaultPhotoBlob,
  getVaultPhotoBlob,
} from '@/lib/storage/firesideIndexedDb';
import {
  uploadAudioWithResiliency,
  uploadPhotosSequential,
} from '@/lib/media/chunkedAudioUpload';
import { FiresideLocalVaultRecord, HeirloomPhotoAttachment } from '@/types/fireside';
import { render, fireEvent, renderHook, waitFor, act } from '@testing-library/react';
import { useFiresideSync } from '@/hooks/useFiresideSync';
import { useCurriculumVault, resolveEditingAuthority, isSceneCompleted } from '@/hooks/useCurriculumVault';
import { FiresideCompletedReelCard } from '@/components/fireside/FiresideCompletedReelCard';
import { FiresideCinemaLightbox } from '@/components/fireside/FiresideCinemaLightbox';
import { FiresideWalkthroughCard } from '@/components/fireside/FiresideWalkthroughCard';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';
import { getPartForScene, getSceneById } from '@/lib/curriculum/masterStoryStructure';
import { FiresideWarmupModal, WARMUP_CHAI_SCRIPTS } from '@/components/fireside/FiresideWarmupModal';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { setDoc } from 'firebase/firestore';

// Mock localforage memory store
const memoryStore = new Map<string, unknown>();

vi.mock('localforage', () => {
  return {
    default: {
      createInstance: vi.fn(() => ({
        setItem: vi.fn(async (key: string, val: unknown) => {
          memoryStore.set(key, val);
          return val;
        }),
        getItem: vi.fn(async (key: string) => {
          return memoryStore.get(key) || null;
        }),
        removeItem: vi.fn(async (key: string) => {
          memoryStore.delete(key);
        }),
        iterate: vi.fn(async (callback: (val: unknown, key: string) => void) => {
          memoryStore.forEach((v, k) => {
            callback(v, k);
          });
        }),
      })),
    },
  };
});

// Mock Firebase Storage
const mockUploadTask = {
  on: vi.fn((event: string, onProgress: unknown, onError: (err: Error) => void, onComplete: () => void) => {
    onComplete();
  }),
  snapshot: {
    ref: {},
  },
};

vi.mock('firebase/storage', () => ({
  ref: vi.fn((_storage, path: string) => ({ fullPath: path })),
  uploadBytesResumable: vi.fn(() => mockUploadTask),
  getDownloadURL: vi.fn(async () => 'https://firebasestorage.googleapis.com/v0/b/test/mock-audio.webm'),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  collection: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getFirestore: vi.fn(),
}));

vi.mock('@/lib/firebase/config', () => ({
  storage: {},
  db: {},
  auth: {},
}));

describe('MW-247: Fireside Offline Vault & Resilient Sync Invariants', () => {
  beforeEach(() => {
    memoryStore.clear();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. IndexedDB Vault Invariants
  // ---------------------------------------------------------------------------
  describe('IndexedDB Vault Storage (firesideIndexedDb.ts)', () => {
    const mockRecord: FiresideLocalVaultRecord = {
      draftId: 'draft_test_123',
      userId: 'user_test_456',
      audioBlob: new Blob(['mock-audio-data'], { type: 'audio/webm' }),
      draft: {
        id: 'draft_test_123',
        userId: 'user_test_456',
        title: 'Roots in Surat',
        promptId: 'prompt_childhood_roots',
        promptText: 'Where did your family originate?',
        promptLanguage: 'en',
        audioMetrics: {
          durationSeconds: 45,
          sampleRate: 48000,
          channelCount: 1,
          averageRms: 0.2,
          peakDecibels: -2.0,
          codec: 'audio/webm',
        },
        audioStoragePath: null,
        audioStorageUrl: null,
        photos: [],
        transcriptionText: null,
        prose: '',
        notes: '',
        syncState: 'local_only',
        createdAt: '2026-09-14T12:00:00.000Z',
        lastModified: '2026-09-14T12:00:00.000Z',
      },
      lastCachedAt: 1700000000000,
      uploadAcknowledged: false,
    };

    it('saves a draft to the local vault and retrieves it cleanly', async () => {
      await saveDraftToVault(mockRecord);
      const retrieved = await getDraftFromVault('draft_test_123');

      expect(retrieved).toBeDefined();
      expect(retrieved?.draftId).toBe('draft_test_123');
      expect(retrieved?.draft.title).toBe('Roots in Surat');
      expect(retrieved?.audioBlob).toBeDefined();
    });

    it('lists vault drafts sorted descending by lastCachedAt', async () => {
      const olderRecord = { ...mockRecord, draftId: 'draft_older', lastCachedAt: 1000 };
      const newerRecord = { ...mockRecord, draftId: 'draft_newer', lastCachedAt: 2000 };

      await saveDraftToVault(olderRecord);
      await saveDraftToVault(newerRecord);

      const list = await listVaultDrafts();
      expect(list.length).toBe(2);
      expect(list[0].draftId).toBe('draft_newer');
      expect(list[1].draftId).toBe('draft_older');
    });

    it('stores and retrieves photo blobs associated with a draft', async () => {
      const fakePhotoBlob = new Blob(['sample-jpeg-bytes'], { type: 'image/jpeg' });
      await saveVaultPhotoBlob('draft_test_123', 'photo_abc', fakePhotoBlob);

      const retrieved = await getVaultPhotoBlob('draft_test_123', 'photo_abc');
      expect(retrieved).toBeDefined();
      expect(retrieved?.type).toBe('image/jpeg');
    });

    it('deletes a draft and all associated photo blobs upon purge', async () => {
      const fakePhotoBlob = new Blob(['sample-jpeg-bytes'], { type: 'image/jpeg' });
      await saveDraftToVault(mockRecord);
      await saveVaultPhotoBlob('draft_test_123', 'photo_abc', fakePhotoBlob);

      await deleteDraftFromVault('draft_test_123');

      const retrievedDraft = await getDraftFromVault('draft_test_123');
      const retrievedPhoto = await getVaultPhotoBlob('draft_test_123', 'photo_abc');

      expect(retrievedDraft).toBeNull();
      expect(retrievedPhoto).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Chunked Media Upload Pipeline Invariants
  // ---------------------------------------------------------------------------
  describe('Resilient Media Streaming Pipeline (chunkedAudioUpload.ts)', () => {
    it('uploads audio to the correct user storage tenant path', async () => {
      const audioBlob = new Blob(['audio-binary'], { type: 'audio/webm' });
      const onProgress = vi.fn();

      const result = await uploadAudioWithResiliency(
        'user_123',
        'draft_abc',
        audioBlob,
        onProgress
      );

      expect(result.storagePath).toBe('users/user_123/fireside/draft_abc/audio.webm');
      expect(result.storageUrl).toContain('mock-audio.webm');
      expect(result.fileSizeBytes).toBe(audioBlob.size);
    });

    it('executes sequential uploads of heirloom photographs and marks status as synced', async () => {
      const photos: HeirloomPhotoAttachment[] = [
        {
          id: 'photo_1',
          localUri: 'blob:mock-1',
          storageUrl: null,
          caption: 'Grandpa at the shop',
          capturedAt: '2026-09-14T12:00:00.000Z',
          originalFilename: 'grandpa.jpg',
          fileSizeBytes: 120000,
          width: 1200,
          height: 900,
          aspectRatio: 1.33,
          rotation: 0,
          uploadStatus: 'pending',
        },
      ];

      const getPhotoBlob = vi.fn(async () => new Blob(['jpeg-bytes'], { type: 'image/jpeg' }));
      const onProgress = vi.fn();

      const updated = await uploadPhotosSequential(
        'user_123',
        'draft_abc',
        photos,
        getPhotoBlob,
        onProgress
      );

      expect(updated[0].uploadStatus).toBe('synced');
      expect(updated[0].storageUrl).toBeDefined();
      expect(updated[0].storagePath).toBe('users/user_123/fireside/draft_abc/photos/photo_1.jpg');
      expect(onProgress).toHaveBeenCalledWith(1, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. useFiresideSync Background Hook Invariants
  // ---------------------------------------------------------------------------
  describe('useFiresideSync Background Hook (useFiresideSync.ts)', () => {
    it('initialises in idle state with an assigned draftId', () => {
      const { result } = renderHook(() =>
        useFiresideSync({
          activeLanguage: 'en',
          initialDraftId: 'draft_unit_test',
        })
      );

      expect(result.current.syncState).toBe('idle');
      expect(result.current.draftId).toBe('draft_unit_test');
      expect(result.current.isSaving).toBe(false);
      expect(result.current.isSynced).toBe(false);
    });

    it('transitions to saving and synced when an audio recording is provided', async () => {
      const fakeAudio = new Blob(['mock-audio'], { type: 'audio/webm' });
      const { result } = renderHook(() =>
        useFiresideSync({
          userId: 'test_user_789',
          initialDraftId: 'draft_audio_sync',
          activeLanguage: 'gu',
          audioBlob: fakeAudio,
          audioDurationSeconds: 15,
        })
      );

      await waitFor(() => {
        expect(result.current.syncState).toBe('synced');
      });

      expect(result.current.isSynced).toBe(true);
      expect(result.current.progressPercent).toBe(100);
    });

    it('transitions to offline_cached when navigator is offline', async () => {
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const fakeAudio = new Blob(['mock-audio'], { type: 'audio/webm' });
      const { result } = renderHook(() =>
        useFiresideSync({
          userId: 'test_user_789',
          initialDraftId: 'draft_offline_sync',
          activeLanguage: 'en',
          audioBlob: fakeAudio,
        })
      );

      await waitFor(() => {
        expect(result.current.syncState).toBe('offline_cached');
      });

      expect(result.current.isOffline).toBe(true);

      Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
    });

    it('completes photo-only sync past 92% to 100% and sanitises undefined fields before Firestore setDoc', async () => {
      const { setDoc } = await import('firebase/firestore');
      const mockPhoto: HeirloomPhotoAttachment = {
        id: 'photo_92_test',
        localUri: 'blob:mock-photo-92',
        storageUrl: 'https://firebasestorage.googleapis.com/v0/b/test/photo_92.jpg',
        caption: 'Heirloom test photo',
        capturedAt: '2026-09-25T12:00:00.000Z',
        originalFilename: 'heirloom.jpg',
        fileSizeBytes: 98000,
        width: 1200,
        height: 900,
        aspectRatio: 1.33,
        rotation: 0,
        uploadStatus: 'synced',
      };

      const { result } = renderHook(() =>
        useFiresideSync({
          userId: 'test_user_92',
          initialDraftId: 'draft_photo_92_test',
          activeLanguage: 'en',
          photos: [mockPhoto],
          sceneId: undefined,
        })
      );

      await waitFor(() => {
        expect(result.current.syncState).toBe('synced');
      });

      expect(result.current.progressPercent).toBe(100);
      expect(setDoc).toHaveBeenCalled();
      const savedPayload = vi.mocked(setDoc).mock.calls.at(-1)?.[1] as Record<string, unknown>;
      expect(savedPayload).toBeDefined();
      expect(savedPayload.sceneId).toBeNull();
      expect(Object.values(savedPayload).some((v) => v === undefined)).toBe(false);
    });

    it('does not re-trigger executeSync in a 92% loop when onSyncSuccess is an inline callback that mutates parent state', async () => {
      const { setDoc } = await import('firebase/firestore');
      vi.mocked(setDoc).mockClear();
      const fakeAudio = new Blob(['mock-audio-loop-guard'], { type: 'audio/webm' });
      const syncSuccessSpy = vi.fn();

      const { result, rerender } = renderHook(
        ({ tick }) =>
          useFiresideSync({
            userId: 'test_user_loop_guard',
            initialDraftId: 'draft_loop_guard',
            activeLanguage: 'en',
            audioBlob: fakeAudio,
            audioDurationSeconds: 5,
            onSyncSuccess: (id) => {
              syncSuccessSpy(id, tick);
            },
          }),
        { initialProps: { tick: 1 } }
      );

      await waitFor(() => {
        expect(result.current.syncState).toBe('synced');
      });

      expect(result.current.progressPercent).toBe(100);
      expect(syncSuccessSpy).toHaveBeenCalledTimes(1);

      // Re-render with a fresh inline onSyncSuccess callback (simulating parent state update)
      rerender({ tick: 2 });
      await new Promise((r) => setTimeout(r, 100));

      expect(result.current.syncState).toBe('synced');
      expect(result.current.progressPercent).toBe(100);
      expect(syncSuccessSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Rule 20: British English Compliance Invariants
  // ---------------------------------------------------------------------------
  describe('Rule 20: Mandatory British English Orthography Invariants', () => {
    it('enforces British English spelling across files and docstrings', () => {
      const firesideIdbSource = fs.readFileSync('src/lib/storage/firesideIndexedDb.ts', 'utf8');
      const chunkedUploadSource = fs.readFileSync('src/lib/media/chunkedAudioUpload.ts', 'utf8');
      const syncHookSource = fs.readFileSync('src/hooks/useFiresideSync.ts', 'utf8');

      // Assert absence of uninitialised with z
      expect(chunkedUploadSource).not.toContain('uninitialized');
      // Assert British English synchronisation
      expect(syncHookSource).toContain('synchronisation');
      expect(firesideIdbSource).not.toContain('color');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. MW-88-T2: The Studio Elevation Ratchet & Cross-Surface Editing Authority
  // ---------------------------------------------------------------------------
  describe('MW-88-T2: Studio Elevation Ratchet Invariants', () => {
    it('resolveEditingAuthority resolves missing, legacy, and explicit fields accurately', () => {
      // Missing / empty -> fireside_flexible
      expect(resolveEditingAuthority(undefined)).toBe('fireside_flexible');
      expect(resolveEditingAuthority(null)).toBe('fireside_flexible');
      expect(resolveEditingAuthority({})).toBe('fireside_flexible');

      // Explicit fields
      expect(resolveEditingAuthority({ editingAuthority: 'fireside_flexible' })).toBe('fireside_flexible');
      expect(resolveEditingAuthority({ editingAuthority: 'desktop_locked' })).toBe('desktop_locked');

      // Legacy & lifecycle indicators -> desktop_locked
      expect(resolveEditingAuthority({ elevatedAt: 1700000000000 })).toBe('desktop_locked');
      expect(resolveEditingAuthority({ currentStatus: 'mastered' })).toBe('desktop_locked');
      expect(resolveEditingAuthority({ status: 'published' } as any)).toBe('desktop_locked');
      expect(resolveEditingAuthority({ isProductionLocked: true } as any)).toBe('desktop_locked');
      expect(resolveEditingAuthority({ actsCompleted: ['act1', 'act3'] })).toBe('desktop_locked');
      expect(resolveEditingAuthority({ surfaceOrigin: 'desktop_soundstage' })).toBe('desktop_locked');
      expect(resolveEditingAuthority({ originSurface: 'soundstage_desktop' })).toBe('desktop_locked');
      expect(
        resolveEditingAuthority({
          takes: [{ id: 't1', takeNumber: 1, source: 'soundstage_desktop' } as any],
        })
      ).toBe('desktop_locked');
    });

    it('elevateToStudioMaster performs 0ms optimistic state promotion and persists Firestore payload', async () => {
      const { setDoc } = await import('firebase/firestore');
      vi.mocked(setDoc).mockClear();

      // 1. Test useFiresideSync.elevateToStudioMaster
      const { result: syncResult } = renderHook(() =>
        useFiresideSync({
          userId: 'user_elevate_test',
          initialDraftId: 'draft_elevate_test',
          sceneId: 'part-1-scene-1',
          activeLanguage: 'en',
        })
      );

      expect(syncResult.current.editingAuthority).toBe('fireside_flexible');

      await act(async () => {
        await syncResult.current.elevateToStudioMaster('part-1-scene-1');
      });

      expect(syncResult.current.editingAuthority).toBe('desktop_locked');
      expect(setDoc).toHaveBeenCalled();
      const syncCalls = vi.mocked(setDoc).mock.calls.map((c) => c[1] as Record<string, unknown>);
      expect(
        syncCalls.some(
          (payload) =>
            payload?.editingAuthority === 'desktop_locked' &&
            typeof payload?.elevatedAt === 'number'
        )
      ).toBe(true);

      // 2. Test useCurriculumVault.elevateToStudioMaster
      vi.mocked(setDoc).mockClear();
      const { result: vaultResult } = renderHook(() =>
        useCurriculumVault({
          userId: 'user_elevate_test',
          initialSceneId: 'part-1-scene-2',
        })
      );

      await act(async () => {
        await vaultResult.current.elevateToStudioMaster('part-1-scene-2');
      });

      const updatedScene = vaultResult.current.getSceneMemory('part-1-scene-2');
      expect(updatedScene?.editingAuthority).toBe('desktop_locked');
      expect(typeof updatedScene?.elevatedAt).toBe('number');

      const vaultCalls = vi.mocked(setDoc).mock.calls.map((c) => c[1] as Record<string, unknown>);
      expect(
        vaultCalls.some(
          (payload) =>
            payload?.editingAuthority === 'desktop_locked' &&
            typeof payload?.elevatedAt === 'number'
        )
      ).toBe(true);
    });

    it('FiresideCompletedReelCard suppresses retake triggers when desktop_locked and opens reassurance drawer', () => {
      const onReRecordSpy = vi.fn();
      const onAddBonusSpy = vi.fn();

      const { unmount } = render(
        React.createElement(FiresideCompletedReelCard, {
          sceneId: 'part-1-scene-1',
          sceneTitle: 'Ancestral Village',
          editingAuthority: 'desktop_locked',
          onWatchTheatricalReel: vi.fn(),
          onAddBonusNote: onAddBonusSpy,
          onReRecordRequest: onReRecordSpy,
        })
      );

      // 1. Retake button must be suppressed when desktop_locked
      const retakeBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_COMPLETED_RETAKE_BTN"]');
      expect(retakeBtn).toBeNull();

      // 2. Luminous gold pill [ 🔒 Studio Master ] must be rendered
      const masterBadge = document.querySelector('[data-testid="studio-master-badge"]');
      expect(masterBadge).toBeTruthy();
      expect(masterBadge?.textContent).toContain('Studio Master');

      // 3. Tapping [ 🔒 Studio Master ] opens the serene reassurance drawer
      fireEvent.click(masterBadge!);
      const drawer = document.querySelector('[data-testid="studio-master-reassurance-drawer"]');
      expect(drawer).toBeTruthy();
      expect(drawer?.textContent).toContain('synchronised');

      // 4. Bonus archival footnote / photo button remains accessible
      const bonusBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_COMPLETED_BONUS_BTN"]');
      expect(bonusBtn).toBeTruthy();
      fireEvent.click(bonusBtn!);
      expect(onAddBonusSpy).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. MW-88-T3: Bilingual Chapter Headers, Scene Sequence & FiresideWarmupModal
  // ---------------------------------------------------------------------------
  describe('MW-88-T3 & MW-88-T4: Bilingual Chapter Headers, Scene Sequence & Live Prose Invariants', () => {
    it('aligns Scene 1 (part-1-scene-1) to "A Child of Two Worlds" / "બે દુનિયાનું બાળક" and Chapter 1 to "Part I: Roots and Foundations" / "ભાગ I: મૂળ અને પાયા"', () => {
      const part1 = getPartForScene('part-1-scene-1');
      expect(part1.title).toBe('Part I: Roots and Foundations');
      expect(part1.localizedTitles?.gu).toBe('ભાગ I: મૂળ અને પાયા');

      const spark0 = FIRESIDE_PROMPT_SPARKS[0];
      expect(spark0.linkedSceneId).toBe('part-1-scene-1');
      expect(spark0.title).toBe('A Child of Two Worlds');
      expect(spark0.localizedTitles?.gu).toBe('બે દુનિયાનું બાળક');

      const { unmount } = render(React.createElement(SingleCardPromptCarousel, {}));
      expect(document.querySelector('[data-testid="carousel-scene-number-badge"]')?.textContent).toBe('Part I • Scene 1');
      expect(document.querySelector('[data-testid="carousel-card-primary-title"]')?.textContent).toBe('A Child of Two Worlds');
      expect(document.querySelector('[data-testid="carousel-card-secondary-title"]')?.textContent).toBe('બે દુનિયાનું બાળક');
      unmount();
    });

    it('renders live Act I prose with sensory counters and toggle button when activeSceneMemory is passed (MW-88-T4)', () => {
      const mockMemory = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        prose: 'The history I carry is an epic journey across oceans and generations, stitched together entirely from the vibrant stories my parents passed down to me.',
      };

      // 1. Assert target document ID and scene identifier
      expect(mockMemory.id).toBe('ey96djU6qR1BrDGnvZwp');
      expect(mockMemory.sceneId).toBe('part-1-scene-1');

      const { unmount } = render(React.createElement(SingleCardPromptCarousel, { activeSceneMemory: mockMemory }));
      
      // 2. Assert Rule 14 resolution prioritises activeSceneMemory.prose over static prompt questions
      const scriptBody = document.querySelector('[data-testid="fireside-active-script-body"]');
      expect(scriptBody).toBeTruthy();
      expect(scriptBody?.textContent).toContain(
        'The history I carry is an epic journey across oceans and generations'
      );
      expect(document.querySelector('[data-testid="fireside-sensory-counters"]')).toBeTruthy();

      // 3. Assert toggle cleanly switches display state between active script and original prompt
      const toggleBtn = document.querySelector('[data-testid="fireside-script-toggle-btn"]') as HTMLElement;
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn.textContent).toContain('View Original Spark');

      // Click to switch to original spark
      fireEvent.click(toggleBtn);
      expect(document.querySelector('[data-testid="fireside-prompt-spark-body"]')).toBeTruthy();
      expect(document.querySelector('[data-testid="fireside-active-script-body"]')).toBeNull();
      expect(toggleBtn.textContent).toContain('View Woven Script');

      // Click again to toggle back to active woven script
      fireEvent.click(toggleBtn);
      expect(document.querySelector('[data-testid="fireside-active-script-body"]')).toBeTruthy();
      expect(document.querySelector('[data-testid="fireside-prompt-spark-body"]')).toBeNull();

      unmount();

      // 4. Assert fallback when activeSceneMemory has empty prose
      const { unmount: unmountFallback } = render(
        React.createElement(SingleCardPromptCarousel, { activeSceneMemory: { id: 'ey96djU6qR1BrDGnvZwp', prose: '' } })
      );
      expect(document.querySelector('[data-testid="fireside-prompt-spark-body"]')).toBeTruthy();
      expect(document.querySelector('[data-testid="fireside-active-script-body"]')).toBeNull();
      unmountFallback();
    });

    it('executes the 3-step FiresideWarmupModal flow with visual waveform, reassurance feedback, and strict zero-contamination shield (zero Firestore writes)', async () => {
      vi.mocked(setDoc).mockClear();
      memoryStore.clear();
      expect(FiresideWarmupModal).toBeDefined();

      const onCompleteSpy = vi.fn();
      const { unmount } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          onWarmupComplete: onCompleteSpy,
        })
      );

      const triggerBtn = document.querySelector('[data-testid="fireside-warmup-trigger"]') as HTMLElement;
      expect(triggerBtn).toBeTruthy();
      expect(triggerBtn.textContent).toContain('30-Second Mic Warmup & Soundcheck');

      // Open Warmup Modal
      fireEvent.click(triggerBtn);
      expect(document.querySelector('[data-testid="warmup-step-1"]')).toBeTruthy();

      // Step 1: Start & finish 10-second test voice recording
      const recordBtn = document.querySelector('[data-testid="warmup-record-btn"]') as HTMLElement;
      fireEvent.click(recordBtn);
      expect(document.querySelector('[data-testid="warmup-recording-meter"]')).toBeTruthy();
      fireEvent.click(recordBtn);

      await waitFor(() => {
        expect(document.querySelector('[data-testid="warmup-step-2"]')).toBeTruthy();
      });

      // Step 2: Visual waveform + reassurance feedback ("Your voice sounds warm and crystal clear.")
      expect(document.querySelector('[data-testid="warmup-visual-waveform"]')).toBeTruthy();
      expect(document.querySelector('[data-testid="warmup-reassurance-feedback"]')?.textContent).toContain(
        'Your voice sounds warm and crystal clear.'
      );

      const nextToPhotoBtn = document.querySelector('[data-testid="warmup-next-to-photo-btn"]') as HTMLElement;
      fireEvent.click(nextToPhotoBtn);

      // Step 3: Optional photo capture & client-side compression preview
      expect(document.querySelector('[data-testid="warmup-step-3"]')).toBeTruthy();
      const samplePrintBtn = document.querySelector('[data-testid="warmup-sample-print-btn"]') as HTMLElement;
      fireEvent.click(samplePrintBtn);
      expect(document.querySelector('[data-testid="warmup-photo-preview"]')).toBeTruthy();

      // Complete warmup & verify exit banner + zero Firestore / IndexedDB contamination
      const completeBtn = document.querySelector('[data-testid="warmup-complete-btn"]') as HTMLElement;
      fireEvent.click(completeBtn);

      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
      expect(document.querySelector('[data-testid="warmup-exit-banner"]')?.textContent).toContain(
        'Soundcheck complete. Entering Part I: Roots and Foundations.'
      );
      expect(setDoc).not.toHaveBeenCalled();
      expect(memoryStore.size).toBe(0);

      unmount();
    });

    it('enforces Rule 20 British English orthography across FiresideWarmupModal.tsx', () => {
      const modalSrc = fs.readFileSync('src/components/fireside/FiresideWarmupModal.tsx', 'utf8');
      expect(modalSrc).toContain('synchronised');
      expect(modalSrc).toContain('prioritised');
      expect(modalSrc).toContain('centred');
      expect(modalSrc).toContain('colour');
      expect(modalSrc).toContain('digitiser');
    });

    it('enforces Rule 41 Dual-Surface Lockstep Synchronisation between /studio/fireside and /studio/production/', () => {
      const agentsMd = fs.readFileSync('.agents/AGENTS.md', 'utf8');
      expect(agentsMd).toContain('# 41. Mandatory Dual-Surface Lockstep Synchronisation');
      expect(agentsMd).toContain('https://dev.memoryweaver.studio/studio/fireside');
      expect(agentsMd).toContain('https://dev.memoryweaver.studio/studio/production/');

      // Every Fireside prompt spark must bind to a canonical scene and part in masterStoryStructure.ts with 4-language parity
      FIRESIDE_PROMPT_SPARKS.forEach((spark) => {
        expect(spark.linkedSceneId).toBeTruthy();
        const linkedScene = getSceneById(spark.linkedSceneId!);
        expect(linkedScene).toBeDefined();
        expect(linkedScene?.sceneNumber).toBeGreaterThanOrEqual(1);

        const linkedPart = getPartForScene(spark.linkedSceneId!);
        expect(linkedPart).toBeDefined();
        expect(linkedPart.localizedTitles?.en).toBeTruthy();
        expect(linkedPart.localizedTitles?.gu).toBeTruthy();
        expect(linkedPart.localizedTitles?.pa).toBeTruthy();
        expect(linkedPart.localizedTitles?.hi).toBeTruthy();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 7. MW-88-T5: Fireside Rehearsal Sandbox & Multi-Take Discard Lifecycle
  // ---------------------------------------------------------------------------
  describe('MW-88-T5: Fireside Rehearsal Sandbox & Multi-Take Discard Lifecycle', () => {
    it('Case A (Single-Take Discard): discardSceneTake deletes target take, reverts scene back to unrecorded capture slate, and strictly preserves Rule 14 prose, title, and sensory tags', async () => {
      vi.mocked(setDoc).mockClear();

      const { result } = renderHook(() =>
        useCurriculumVault({
          userId: 'user_discard_case_a',
          initialSceneId: 'part-1-scene-1',
        })
      );

      // Seed Scene 1 with rich Rule 14 prose, originalHook, sensoryAnchors, and a single video take
      await act(async () => {
        await result.current.saveSceneTake(
          'part-1-scene-1',
          {
            id: 'take_single_01',
            takeNumber: 1,
            source: 'fireside_mobile',
            mediaMode: 'video',
            mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/test/take1.webm',
            durationSeconds: 30,
            createdAt: '2026-09-27T12:00:00.000Z',
            label: 'Take 1 (Fireside Video)',
            isPreferred: true,
          },
          {
            prose: 'The history I carry is an epic journey across oceans and generations.',
            title: 'A Child of Two Worlds',
            originalHook: 'My parents crossed two continents before I was born.',
            description: 'The history I carry is an epic journey across oceans and generations.',
            sensoryAnchors: { sound: 5, visual: 7, aroma: 6 },
            sensorySparks: ['ocean wind', 'monsoon rain', 'cardamom chai'],
            editingAuthority: 'fireside_flexible',
          }
        );
      });

      const beforeDiscard = result.current.getSceneMemory('part-1-scene-1');
      expect(beforeDiscard.takes).toHaveLength(1);
      expect(isSceneCompleted(beforeDiscard)).toBe(true);

      vi.mocked(setDoc).mockClear();

      // Discard the single take
      await act(async () => {
        await result.current.discardSceneTake('part-1-scene-1', 'take_single_01');
      });

      const afterDiscard = result.current.getSceneMemory('part-1-scene-1');
      // 1. Reverts to unrecorded capture slate
      expect(afterDiscard.takes).toEqual([]);
      expect(afterDiscard.activeTakeId).toBeNull();
      expect(afterDiscard.videoUrl).toBeNull();
      expect(afterDiscard.audioUrl).toBeNull();
      expect(afterDiscard.actsCompleted).toEqual(['act1']);
      expect(afterDiscard.productionStage).toBe(1);
      expect(afterDiscard.lastEditedSurface).toBe('fireside_mobile');
      expect(isSceneCompleted(afterDiscard)).toBe(false);

      // 2. Rule 14 Invariants strictly preserved
      expect(afterDiscard.prose).toBe('The history I carry is an epic journey across oceans and generations.');
      expect(afterDiscard.title).toBe('A Child of Two Worlds');
      expect(afterDiscard.originalHook).toBe('My parents crossed two continents before I was born.');
      expect(afterDiscard.description).toBe('The history I carry is an epic journey across oceans and generations.');
      expect(afterDiscard.sensoryAnchors).toEqual({ sound: 5, visual: 7, aroma: 6 });

      // 3. Firestore delta payload verified
      expect(setDoc).toHaveBeenCalledTimes(1);
      const firestorePayload = vi.mocked(setDoc).mock.calls[0][1] as Record<string, any>;
      expect(firestorePayload.takes).toEqual([]);
      expect(firestorePayload.activeTakeId).toBeNull();
      expect(firestorePayload.videoUrl).toBeNull();
      expect(firestorePayload.audioUrl).toBeNull();
      expect(firestorePayload.actsCompleted).toEqual(['act1']);
      expect(firestorePayload.productionStage).toBe(1);
      expect(firestorePayload.lastEditedSurface).toBe('fireside_mobile');
      expect(firestorePayload.prose).toBe('The history I carry is an epic journey across oceans and generations.');
    });

    it('Case B (Multiple-Take Discard): discardSceneTake removes target take and promotes most recent remaining take to isPreferred: true', async () => {
      vi.mocked(setDoc).mockClear();

      const { result } = renderHook(() =>
        useCurriculumVault({
          userId: 'user_discard_case_b',
          initialSceneId: 'part-1-scene-2',
        })
      );

      // Save Take 1 and Take 2
      await act(async () => {
        await result.current.saveSceneTake(
          'part-1-scene-2',
          {
            id: 'take_multi_01',
            takeNumber: 1,
            source: 'fireside_mobile',
            mediaMode: 'video',
            mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/test/take1.webm',
            durationSeconds: 25,
            createdAt: '2026-09-27T12:00:00.000Z',
            label: 'Take 1 (Fireside Video)',
            isPreferred: false,
          },
          {
            prose: 'The courtyard walls echoed with laughter.',
            title: 'The House I Grew Up In',
          }
        );

        await result.current.saveSceneTake(
          'part-1-scene-2',
          {
            id: 'take_multi_02',
            takeNumber: 2,
            source: 'fireside_mobile',
            mediaMode: 'video',
            mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/test/take2.webm',
            durationSeconds: 40,
            createdAt: '2026-09-27T12:05:00.000Z',
            label: 'Take 2 (Fireside Video)',
            isPreferred: true,
          }
        );
      });

      expect(result.current.getSceneMemory('part-1-scene-2').takes).toHaveLength(2);
      vi.mocked(setDoc).mockClear();

      // Discard Take 2
      await act(async () => {
        await result.current.discardSceneTake('part-1-scene-2', 'take_multi_02');
      });

      const afterDiscard = result.current.getSceneMemory('part-1-scene-2');
      expect(afterDiscard.takes).toHaveLength(1);
      expect(afterDiscard.takes[0].id).toBe('take_multi_01');
      expect(afterDiscard.takes[0].isPreferred).toBe(true);
      expect(afterDiscard.activeTakeId).toBe('take_multi_01');
      expect(afterDiscard.videoUrl).toBe('https://firebasestorage.googleapis.com/v0/b/test/take1.webm');
      expect(afterDiscard.prose).toBe('The courtyard walls echoed with laughter.');
      expect(isSceneCompleted(afterDiscard)).toBe(true);
    });

    it('Ratchet Protection: desktop_locked memories reject discard attempts on mobile in hook and UI', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() =>
        useCurriculumVault({
          userId: 'user_discard_locked',
          initialSceneId: 'part-1-scene-1',
        })
      );

      await act(async () => {
        await result.current.saveSceneTake(
          'part-1-scene-1',
          {
            id: 'take_master_01',
            takeNumber: 1,
            source: 'fireside_mobile',
            mediaMode: 'video',
            mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/test/master.webm',
            durationSeconds: 60,
            createdAt: '2026-09-27T12:00:00.000Z',
            label: 'Take 1 (Studio Master)',
            isPreferred: true,
          },
          {
            prose: 'Protected Studio Master prose.',
            editingAuthority: 'desktop_locked',
          }
        );
      });

      vi.mocked(setDoc).mockClear();

      // Attempt discard on desktop_locked memory
      await act(async () => {
        await result.current.discardSceneTake('part-1-scene-1', 'take_master_01');
      });

      // Must reject mutation & log warning
      expect(warnSpy).toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
      expect(result.current.getSceneMemory('part-1-scene-1').takes).toHaveLength(1);
      warnSpy.mockRestore();

      // Verify UI ratchet lock in Lightbox and Completed Reel Card
      const onDiscardSpy = vi.fn();
      const { unmount: unmountCard } = render(
        React.createElement(FiresideCompletedReelCard, {
          sceneId: 'part-1-scene-1',
          sceneTitle: 'A Child of Two Worlds',
          editingAuthority: 'desktop_locked',
          onWatchTheatricalReel: vi.fn(),
          onAddBonusNote: vi.fn(),
          onDiscardTake: onDiscardSpy,
        })
      );

      const cardDiscardBtn = document.querySelector('[data-testid="HS_FIRESIDE_CARD_DISCARD_BTN"]') as HTMLButtonElement;
      const cardTooltip = document.querySelector('[data-testid="HS_FIRESIDE_RATCHET_LOCKED_TOOLTIP"]');
      expect(cardDiscardBtn).toBeTruthy();
      expect(cardDiscardBtn.disabled).toBe(true);
      expect(cardTooltip?.textContent).toBe('Studio Master protected on desktop.');
      fireEvent.click(cardDiscardBtn);
      expect(onDiscardSpy).not.toHaveBeenCalled();
      unmountCard();

      const { unmount: unmountLightbox } = render(
        React.createElement(FiresideCinemaLightbox, {
          isOpen: true,
          onClose: vi.fn(),
          onDiscardTake: onDiscardSpy,
          editingAuthority: 'desktop_locked',
          sceneTitle: 'A Child of Two Worlds',
          mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/test/master.webm',
          mediaMode: 'video',
        })
      );

      const lbDiscardBtn = document.querySelector('[data-testid="HS_FIRESIDE_LIGHTBOX_DISCARD_BTN"]') as HTMLButtonElement;
      const lbTooltip = document.querySelector('[data-testid="HS_FIRESIDE_RATCHET_LOCKED_TOOLTIP"]');
      expect(lbDiscardBtn).toBeTruthy();
      expect(lbDiscardBtn.disabled).toBe(true);
      expect(lbTooltip?.textContent).toBe('Studio Master protected on desktop.');
      unmountLightbox();
    });

    it('2-Step Inline Safety Confirmation works in both FiresideCinemaLightbox and FiresideCompletedReelCard when fireside_flexible', () => {
      const onLightboxDiscard = vi.fn();
      const onLightboxClose = vi.fn();

      const { unmount: unmountLb } = render(
        React.createElement(FiresideCinemaLightbox, {
          isOpen: true,
          onClose: onLightboxClose,
          onDiscardTake: onLightboxDiscard,
          editingAuthority: 'fireside_flexible',
          sceneTitle: 'A Child of Two Worlds',
          mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/test/take.webm',
          mediaMode: 'video',
        })
      );

      const lbTrigger = document.querySelector('[data-testid="HS_FIRESIDE_LIGHTBOX_DISCARD_BTN"]') as HTMLElement;
      expect(lbTrigger?.textContent).toContain('[ 🗑️ Discard Take ]');
      fireEvent.click(lbTrigger);

      // Cancel first
      const lbCancel = document.querySelector('[data-testid="HS_FIRESIDE_DISCARD_CANCEL_BTN"]') as HTMLElement;
      expect(lbCancel?.textContent).toContain('[ Cancel ]');
      fireEvent.click(lbCancel);
      expect(onLightboxDiscard).not.toHaveBeenCalled();

      // Re-open & Confirm Discard
      fireEvent.click(document.querySelector('[data-testid="HS_FIRESIDE_LIGHTBOX_DISCARD_BTN"]') as HTMLElement);
      const lbConfirm = document.querySelector('[data-testid="HS_FIRESIDE_DISCARD_CONFIRM_BTN"]') as HTMLElement;
      expect(lbConfirm?.textContent).toContain('[ Confirm Discard ]');
      fireEvent.click(lbConfirm);
      expect(onLightboxDiscard).toHaveBeenCalledTimes(1);
      unmountLb();

      // Now test FiresideCompletedReelCard 2-step confirmation
      const onCardDiscard = vi.fn();
      const { unmount: unmountCard } = render(
        React.createElement(FiresideCompletedReelCard, {
          sceneId: 'part-1-scene-1',
          sceneTitle: 'A Child of Two Worlds',
          editingAuthority: 'fireside_flexible',
          onWatchTheatricalReel: vi.fn(),
          onAddBonusNote: vi.fn(),
          onDiscardTake: onCardDiscard,
        })
      );

      const cardTrigger = document.querySelector('[data-testid="HS_FIRESIDE_CARD_DISCARD_BTN"]') as HTMLElement;
      expect(cardTrigger?.textContent).toContain('[ 🗑️ Discard Current Take ]');
      fireEvent.click(cardTrigger);

      const cardConfirm = document.querySelector('[data-testid="HS_FIRESIDE_DISCARD_CONFIRM_BTN"]') as HTMLElement;
      expect(cardConfirm?.textContent).toContain('[ Confirm Discard ]');
      fireEvent.click(cardConfirm);
      expect(onCardDiscard).toHaveBeenCalledTimes(1);
      unmountCard();
    });

    it('FiresideWalkthroughCard & FiresideWarmupModal render verbatim copy, 4-language Cardamom Chai scripts, Video/Voice mode toggle, and zero-contamination URL.revokeObjectURL teardown', async () => {
      sessionStorage.removeItem('mw_dismiss_fireside_walkthrough');
      const onLaunchSpy = vi.fn();

      const { unmount: unmountCard } = render(
        React.createElement(FiresideWalkthroughCard, {
          activeLanguage: 'gu',
          onLaunchWalkthrough: onLaunchSpy,
        })
      );

      // Verify Gujarati Cardamom Chai excerpt & verbatim copy
      expect(document.body.textContent).toContain(
        '🧭 🎙️ FIRESIDE WALKTHROUGH // 30S REHEARSAL • ZERO-FRICTION PRACTICE FLIGHT'
      );
      expect(document.body.textContent).toContain(
        'Free Walkthrough — Experience Fireside Capture & Soundcheck Without Saving'
      );
      expect(document.querySelector('[data-testid="walkthrough-chai-script-excerpt"]')?.textContent).toContain(
        WARMUP_CHAI_SCRIPTS.gu
      );

      // Dismiss collapses to header pill
      const dismissBtn = document.querySelector('[data-testid="HS_FIRESIDE_WALKTHROUGH_DISMISS_BTN"]') as HTMLElement;
      fireEvent.click(dismissBtn);

      const collapsedPill = document.querySelector('[data-testid="HS_FIRESIDE_WALKTHROUGH_COLLAPSED_PILL"]') as HTMLElement;
      expect(collapsedPill).toBeTruthy();
      expect(collapsedPill.textContent).toContain('[ 🎙️ 📹 Free Walkthrough & 30s Soundcheck ]');
      fireEvent.click(collapsedPill);
      expect(onLaunchSpy).toHaveBeenCalledTimes(1);
      unmountCard();

      // Verify all 4 Cardamom Chai translations & Video/Voice sandbox toggle in FiresideWarmupModal
      expect(WARMUP_CHAI_SCRIPTS.en).toContain('warm cardamom chai served in cracked ceramic cups');
      expect(WARMUP_CHAI_SCRIPTS.gu).toContain('ગરમ એલચીવાળી ચા');
      expect(WARMUP_CHAI_SCRIPTS.pa).toContain('ਗਰਮ ਇਲਾਇਚੀ ਵਾਲੀ ਚਾਹ');
      expect(WARMUP_CHAI_SCRIPTS.hi).toContain('गर्म इलायची वाली चाय');

      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
      vi.mocked(setDoc).mockClear();

      const onCompleteModal = vi.fn();
      const { unmount: unmountModal } = render(
        React.createElement(FiresideWarmupModal, {
          isOpen: true,
          activeLanguage: 'pa',
          onComplete: onCompleteModal,
          onClose: vi.fn(),
        })
      );

      const videoModeBtn = document.querySelector('[data-testid="HS_FIRESIDE_WARMUP_MODE_VIDEO_BTN"]') as HTMLElement;
      const voiceModeBtn = document.querySelector('[data-testid="HS_FIRESIDE_WARMUP_MODE_VOICE_BTN"]') as HTMLElement;
      expect(videoModeBtn).toBeTruthy();
      expect(voiceModeBtn).toBeTruthy();
      expect(document.querySelector('[data-testid="warmup-chai-script-text"]')?.textContent).toContain(
        WARMUP_CHAI_SCRIPTS.pa
      );

      // Switch to Voice Only then back to Selfie Video
      fireEvent.click(voiceModeBtn);
      fireEvent.click(videoModeBtn);

      // Record & finish Step 1 -> Step 2 -> Step 3 -> Complete
      const recBtn = document.querySelector('[data-testid="warmup-record-btn"]') as HTMLElement;
      fireEvent.click(recBtn);
      fireEvent.click(recBtn);

      await waitFor(() => {
        expect(document.querySelector('[data-testid="warmup-step-2"]')).toBeTruthy();
      });

      fireEvent.click(document.querySelector('[data-testid="warmup-next-to-photo-btn"]') as HTMLElement);
      fireEvent.click(document.querySelector('[data-testid="warmup-complete-btn"]') as HTMLElement);

      expect(onCompleteModal).toHaveBeenCalledTimes(1);
      expect(revokeSpy).toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
      revokeSpy.mockRestore();
      unmountModal();
    });
  });
});



