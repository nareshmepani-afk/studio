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
import { useCurriculumVault, resolveEditingAuthority } from '@/hooks/useCurriculumVault';
import { FiresideCompletedReelCard } from '@/components/fireside/FiresideCompletedReelCard';

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
});
