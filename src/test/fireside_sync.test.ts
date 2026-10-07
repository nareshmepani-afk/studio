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
import { BonusMemoryDrawer } from '@/components/fireside/BonusMemoryDrawer';
import { isSceneCompleted as isSceneCompletedType } from '@/types/curriculum';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';
import { getPartForScene, getSceneById } from '@/lib/curriculum/masterStoryStructure';
import { FiresideWarmupModal, WARMUP_CHAI_SCRIPTS } from '@/components/fireside/FiresideWarmupModal';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { FiresideAuthHeader, resolveHeaderActBadge } from '@/components/fireside/FiresideAuthHeader';
import { FiresideVideoRecorder } from '@/components/fireside/FiresideVideoRecorder';
import { HardwarePrivacyProvider } from '@/context/HardwarePrivacyContext';
import { detectSensoryAnchors, filterDominantSensoryAnchors } from '@/utils/sensoryAnchors';
import { setDoc } from 'firebase/firestore';
import LoginForm from '@/components/auth/LoginForm';
import RegisterContent from '@/app/register/RegisterContent';
import { FiresideProfileDrawer } from '@/components/fireside/FiresideProfileDrawer';

let mockCurrentUser: any = {
  uid: 'TQdB395kXxaAGPhFxk1LVWuT8cg2',
  email: 'nareshmepani@hotmail.com',
  displayName: 'Naresh Mepani',
  isAnonymous: false,
  directorPassStatus: 'free_host_pass_active',
};
const mockLogout = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockCurrentUser,
    logout: mockLogout,
    loading: false,
  })),
}));

const mockSearchParams = new URLSearchParams('redirect=/studio/fireside');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/studio/fireside',
  redirect: vi.fn(),
}));

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

    it('FiresideCompletedReelCard enables retake triggers when desktop_locked and opens informational Studio Master drawer (MW-88-T7)', () => {
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

      // 1. Retake button must remain active and accessible under MW-88-T7 universal editing
      const retakeBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_COMPLETED_RETAKE_BTN"]');
      expect(retakeBtn).toBeTruthy();

      // 2. Luminous gold pill [ ✨ Studio Master ] must be rendered with informational tooltip
      const masterBadge = document.querySelector('[data-testid="studio-master-badge"]') as HTMLElement;
      expect(masterBadge).toBeTruthy();
      expect(masterBadge?.textContent).toContain('Studio Master');
      expect(masterBadge?.getAttribute('title')).toBe(
        'Authored in Desktop Studio • Full cross-device editing enabled'
      );

      // 3. Tapping [ ✨ Studio Master ] opens the informational cross-surface drawer
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

      const { unmount } = render(React.createElement(SingleCardPromptCarousel, { isHybrid: true }));
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
      expect(toggleBtn.textContent).toContain('VIEW ORIGINAL SPARK');

      // Click to switch to original spark
      fireEvent.click(toggleBtn);
      expect(document.querySelector('[data-testid="fireside-prompt-spark-body"]')).toBeTruthy();
      expect(document.querySelector('[data-testid="fireside-active-script-body"]')).toBeNull();
      expect(toggleBtn.textContent).toContain('VIEW WOVEN SCRIPT');

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
      // 1. Reverts to unrecorded capture slate (active takes empty, single take moved to outtake status)
      expect(afterDiscard.takes.filter(t => t.status !== 'outtake')).toEqual([]);
      expect(afterDiscard.takes[0].status).toBe('outtake');
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
      expect(firestorePayload.takes.filter((t: any) => t.status !== 'outtake')).toEqual([]);
      expect(firestorePayload.takes[0].status).toBe('outtake');
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
      const activeTakes = afterDiscard.takes.filter(t => t.status !== 'outtake');
      expect(activeTakes).toHaveLength(1);
      expect(activeTakes[0].id).toBe('take_multi_01');
      expect(activeTakes[0].isPreferred).toBe(true);
      expect(activeTakes[0].status).toBe('master');
      expect(afterDiscard.takes.find(t => t.id === 'take_multi_02')?.status).toBe('outtake');
      expect(afterDiscard.activeTakeId).toBe('take_multi_01');
      expect(afterDiscard.videoUrl).toBe('https://firebasestorage.googleapis.com/v0/b/test/take1.webm');
      expect(afterDiscard.prose).toBe('The courtyard walls echoed with laughter.');
      expect(isSceneCompleted(afterDiscard)).toBe(true);
    });

    it('Universal Take Discard (MW-88-T7): desktop_locked memories allow discard on mobile in hook and UI while preserving prose and sensoryAnchors', async () => {
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
            sensoryAnchors: [{ id: 'a1', type: 'visual', word: 'ocean' }],
            editingAuthority: 'desktop_locked',
          }
        );
      });

      vi.mocked(setDoc).mockClear();

      // Discard on desktop_locked memory succeeds universally
      await act(async () => {
        await result.current.discardSceneTake('part-1-scene-1', 'take_master_01');
      });

      expect(setDoc).toHaveBeenCalledTimes(1);
      const afterDiscard = result.current.getSceneMemory('part-1-scene-1');
      expect(afterDiscard.takes.filter(t => t.status !== 'outtake')).toEqual([]);
      expect(afterDiscard.takes[0].status).toBe('outtake');
      expect(afterDiscard.prose).toBe('Protected Studio Master prose.');
      expect(afterDiscard.sensoryAnchors).toEqual([{ id: 'a1', type: 'visual', word: 'ocean' }]);

      // Verify UI 2-step discard is enabled in Completed Reel Card and Lightbox even when desktop_locked
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
      expect(cardDiscardBtn).toBeTruthy();
      expect(cardDiscardBtn.disabled).toBe(false);
      fireEvent.click(cardDiscardBtn);
      const cardConfirmBtn = document.querySelector('[data-testid="HS_FIRESIDE_DISCARD_CONFIRM_BTN"]') as HTMLButtonElement;
      expect(cardConfirmBtn).toBeTruthy();
      fireEvent.click(cardConfirmBtn);
      expect(onDiscardSpy).toHaveBeenCalledTimes(1);
      unmountCard();

      onDiscardSpy.mockClear();
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
      expect(lbDiscardBtn).toBeTruthy();
      expect(lbDiscardBtn.disabled).toBe(false);
      fireEvent.click(lbDiscardBtn);
      const lbConfirmBtn = document.querySelector('[data-testid="HS_FIRESIDE_DISCARD_CONFIRM_BTN"]') as HTMLButtonElement;
      expect(lbConfirmBtn).toBeTruthy();
      fireEvent.click(lbConfirmBtn);
      expect(onDiscardSpy).toHaveBeenCalledTimes(1);
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
      expect(cardTrigger?.textContent).toContain('[ 🔄 Clear Recording & Return to Script ]');
      fireEvent.click(cardTrigger);

      const cardConfirm = document.querySelector('[data-testid="HS_FIRESIDE_DISCARD_CONFIRM_BTN"]') as HTMLElement;
      expect(cardConfirm?.textContent).toContain('[ Confirm & Return to Script ]');
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

  // =========================================================================
  // 7. MW-88-T6: Cross-Surface UX, Hybrid Bilingual Mode & Act Progression
  // =========================================================================
  describe('7. MW-88-T6: Unblocked Act I Desktop Draft Capture, Hybrid Bilingual Mode, 4-Act Spine & Follow-Up Question Actions', () => {
    it('unblocks mobile recording for unrecorded Desktop Act I drafts (takes: [], editingAuthority: desktop_locked) while preserving script protection, 4-Act Spine, and Next Desktop Act Link', () => {
      const unrecordedDesktopActIDraft = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        title: 'A Child of Two Worlds',
        prose: 'The history I carry is an epic journey across oceans and generations, stitched together entirely from the vibrant stories my parents passed down to me.',
        editingAuthority: 'desktop_locked' as const,
        takes: [],
        videoUrl: null,
        audioUrl: null,
        actsCompleted: ['act1' as const],
        productionStage: 1,
        sensoryAnchors: { sound: 5, visual: 7, aroma: 6 },
      };

      // 1. isSceneCompleted returns false for unrecorded Desktop Act I draft
      expect(isSceneCompleted(unrecordedDesktopActIDraft)).toBe(false);
      expect(isSceneCompletedType(unrecordedDesktopActIDraft)).toBe(false);
      expect(resolveEditingAuthority(unrecordedDesktopActIDraft)).toBe('desktop_locked');

      // 2. When a take or media URL is present, isSceneCompleted returns true
      expect(
        isSceneCompletedType({
          ...unrecordedDesktopActIDraft,
          videoUrl: 'https://firebasestorage.googleapis.com/v0/b/test/reel.webm',
        })
      ).toBe(true);

      // 3. Render SingleCardPromptCarousel with the unrecorded Desktop Act I draft
      const onSelectPrompt = vi.fn();
      const { unmount } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          mediaMode: 'video',
          editingAuthority: 'desktop_locked',
          resolveSceneAuthority: (): 'desktop_locked' => 'desktop_locked',
          activeSceneMemory: unrecordedDesktopActIDraft,
          getSceneMemory: () => unrecordedDesktopActIDraft,
          onSelectPrompt,
        })
      );

      // Carousel card has HS_FIRESIDE_PROMPT_CAROUSEL_CARD testid
      expect(document.querySelector('[data-testid="HS_FIRESIDE_PROMPT_CAROUSEL_CARD"]')).toBeTruthy();

      // 4-Act Status Spine renders all 4 interactive in-place Act tabs (MW-88-T9)
      const actSpine = document.querySelector('[data-testid="HS_FIRESIDE_ACT_SPINE"]') as HTMLElement;
      expect(actSpine).toBeTruthy();
      expect(actSpine.textContent).toContain('Act I: Script');
      expect(actSpine.textContent).toContain('Act II: Weave');
      expect(actSpine.textContent).toContain('Act III: Record');
      expect(actSpine.textContent).toContain('Act IV: Screening');

      // In-Place Progression Button renders with zero external redirect (MW-112 canonical grammar)
      const inPlaceBtn = (document.querySelector('[data-testid="HS_FIRESIDE_SPINE_PROGRESS_BTN"]') ||
        document.querySelector('[data-testid="HS_FIRESIDE_INPLACE_PROGRESS_BTN"]')) as HTMLButtonElement;
      expect(inPlaceBtn).toBeTruthy();
      expect(inPlaceBtn.textContent).toContain('[ ✨ Progress to Act II: Sensory Weave → ]');
      expect(inPlaceBtn.getAttribute('href')).toBeNull();

      // Primary CTA is NOT locked to "Watch Studio Master Reel" — it enables recording the performance!
      const primaryCta = document.querySelector('[data-hotspot-id="HS_FIRESIDE_CONFIRM_STORY_BTN"]') as HTMLElement;
      expect(primaryCta).toBeTruthy();
      expect(primaryCta.textContent).toContain('[ 🎬 Action: Enter Soundstage → ]');
      fireEvent.click(primaryCta);
      expect(onSelectPrompt).toHaveBeenCalledWith(FIRESIDE_PROMPT_SPARKS[0], 'en');

      unmount();
    });

    it('renders HYBRID Bilingual Mode toggle (HS_FIRESIDE_HYBRID_TOGGLE_BTN) and exact Section 3B badge tooltips', () => {
      const mockMemory = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        prose: 'The history I carry is an epic journey across oceans and generations.',
        editingAuthority: 'desktop_locked' as const,
        sensoryAnchors: { sound: 5, visual: 7, aroma: 6 },
      };

      const { unmount } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          mediaMode: 'video',
          editingAuthority: 'desktop_locked',
          resolveSceneAuthority: (): 'desktop_locked' => 'desktop_locked',
          activeSceneMemory: mockMemory,
          getSceneMemory: () => mockMemory,
        })
      );

      // Default: English + HYBRID: OFF -> Gujarati subtitle suppressed
      const hybridBtn = document.querySelector('[data-testid="HS_FIRESIDE_HYBRID_TOGGLE_BTN"]') as HTMLButtonElement;
      expect(hybridBtn).toBeTruthy();
      expect(hybridBtn.textContent).toContain('[ 🔤 HYBRID: OFF ]');
      expect(hybridBtn.getAttribute('title')).toBe(
        'Focus: Bilingual (Subtitled) — Show or hide mother-tongue subtitles alongside English.'
      );
      expect(document.querySelector('[data-testid="carousel-card-secondary-title"]')).toBeNull();

      // Click HYBRID toggle -> HYBRID: ON -> Gujarati subtitle appears
      fireEvent.click(hybridBtn);
      expect(hybridBtn.textContent).toContain('[ 🔤 HYBRID: ON ]');
      expect(document.querySelector('[data-testid="carousel-card-secondary-title"]')?.textContent).toBe('બે દુનિયાનું બાળક');

      // Verify exact Section 3B tooltips on badges
      const categoryBadge = document.querySelector('[data-testid="carousel-category-badge"]') as HTMLElement;
      expect(categoryBadge?.getAttribute('title')).toBe(
        'Story Theme: Origins & Roots — Exploring ancestral homeland, family foundations, and heritage.'
      );

      const sceneBadge = document.querySelector('[data-testid="carousel-scene-number-badge"]') as HTMLElement;
      expect(sceneBadge?.getAttribute('title')).toBe(
        'Curriculum Position: Part I (Roots and Foundations), Scene 1 of 11 in your Generational Vault.'
      );

      const studioMasterBadge = document.querySelector('[data-testid="carousel-studio-master-badge"]') as HTMLElement;
      expect(studioMasterBadge?.getAttribute('title')).toBe(
        'Authored in Desktop Studio • Full cross-device editing enabled'
      );

      const mediaBadge = document.querySelector('[data-testid="carousel-media-badge"]') as HTMLElement;
      expect(mediaBadge?.getAttribute('title')).toBe(
        'Recommended Capture Mode: Intimate selfie video with live teleprompter.'
      );

      const sensoryCounters = document.querySelector('[data-testid="fireside-sensory-counters"]') as HTMLElement;
      expect(sensoryCounters?.getAttribute('title')).toBe(
        'Sensory Anchors Detected — Acoustic, visual, and aroma cues woven into your Act I script.'
      );

      unmount();
    });

    it('renders Follow-Up Questions Two-Action Model (HS_FIRESIDE_PIN_PROMPTER_BTN & HS_FIRESIDE_ANSWER_NOTE_BTN) and pre-seeds BonusMemoryDrawer', () => {
      const onPinSpy = vi.fn();
      const onAnswerNoteSpy = vi.fn();

      const { unmount } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          onPinQuestionToPrompter: onPinSpy,
          onAnswerFollowUpNote: onAnswerNoteSpy,
        })
      );

      // Expand Follow-Up Questions drawer
      const drawerToggle = document.querySelector('[data-hotspot-id="HS_FIRESIDE_FOLLOWUPS_DRAWER_BTN"]') as HTMLElement;
      fireEvent.click(drawerToggle);

      // Instruction header
      const instruction = document.querySelector('[data-testid="fireside-followup-instruction"]') as HTMLElement;
      expect(instruction?.textContent).toBe(
        'Choose a prompt below to jot down a quick memory note, or pin it to your teleprompter to answer aloud during your recording.'
      );

      // Pin to Prompter button
      const pinBtns = document.querySelectorAll('[data-testid="HS_FIRESIDE_PIN_PROMPTER_BTN"]');
      expect(pinBtns.length).toBeGreaterThan(0);
      fireEvent.click(pinBtns[0]);
      expect(onPinSpy).toHaveBeenCalledWith(FIRESIDE_PROMPT_SPARKS[0].followUpQuestions.en[0]);

      // Answer / Add Note button
      const noteBtns = document.querySelectorAll('[data-testid="HS_FIRESIDE_ANSWER_NOTE_BTN"]');
      expect(noteBtns.length).toBeGreaterThan(0);
      fireEvent.click(noteBtns[0]);
      expect(onAnswerNoteSpy).toHaveBeenCalledWith(FIRESIDE_PROMPT_SPARKS[0].followUpQuestions.en[0]);

      unmount();

      // Verify BonusMemoryDrawer pre-seeds textarea when initialPrompt is supplied
      const seedQuestion = FIRESIDE_PROMPT_SPARKS[0].followUpQuestions.en[0];
      const { unmount: unmountDrawer } = render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'A Child of Two Worlds',
          initialPrompt: seedQuestion,
          onSaveBonusNote: vi.fn(),
        })
      );

      const textarea = document.querySelector('#bonus-note-text') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.value).toContain(seedQuestion);
      unmountDrawer();
    });
  });

  // =========================================================================
  // 8. MW-88-T7: Responsive Ergonomic Specialisation & Universal Cross-Editing
  // =========================================================================
  describe('8. MW-88-T7: Responsive Ergonomic Specialisation & Universal Cross-Editing', () => {
    it('updateSceneProse updates prose, dual-syncs description (Rule 14), sets lastEditedSurface: fireside_mobile, and strictly preserves sensoryAnchors', async () => {
      vi.mocked(setDoc).mockClear();

      const { result } = renderHook(() =>
        useCurriculumVault({
          userId: 'user_prose_sync',
          initialSceneId: 'part-1-scene-1',
        })
      );

      const existingSensoryAnchors = [
        { id: 'sa_1', type: 'soundscape', word: 'ocean' },
        { id: 'sa_2', type: 'aroma', word: 'cardamom' },
      ];

      await act(async () => {
        await result.current.saveSceneTake(
          'part-1-scene-1',
          {
            id: 'take_desktop_01',
            takeNumber: 1,
            source: 'soundstage_desktop',
            mediaMode: 'video',
            mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/test/desktop1.webm',
            durationSeconds: 45,
            createdAt: '2026-09-28T10:00:00.000Z',
            label: 'Take 1 (4K Soundstage)',
            isPreferred: true,
          },
          {
            prose: 'Original desktop prose with ocean wind and cardamom chai.',
            originalHook: 'My parents crossed two continents.',
            sensoryAnchors: existingSensoryAnchors,
            editingAuthority: 'desktop_locked',
          }
        );
      });

      vi.mocked(setDoc).mockClear();

      const updatedProseText =
        'Updated armchair script from mobile: The history I carry across oceans and cardamom-scented courtyards.';

      await act(async () => {
        await result.current.updateSceneProse('part-1-scene-1', updatedProseText);
      });

      // 1. 0ms Optimistic State Update (Rule 12) + Rule 14 Dual-Sync + Sensory Preservation
      const afterEdit = result.current.getSceneMemory('part-1-scene-1');
      expect(afterEdit.prose).toBe(updatedProseText);
      expect(afterEdit.description).toBe(updatedProseText);
      expect(afterEdit.lastEditedSurface).toBe('fireside_mobile');
      expect(afterEdit.sensoryAnchors).toEqual(existingSensoryAnchors);
      expect(afterEdit.originalHook).toBe('My parents crossed two continents.');
      expect(afterEdit.takes).toHaveLength(1);

      // 2. Exact Firestore Delta Payload verified
      expect(setDoc).toHaveBeenCalledTimes(1);
      const firestorePayload = vi.mocked(setDoc).mock.calls[0][1] as Record<string, any>;
      expect(firestorePayload.prose).toBe(updatedProseText);
      expect(firestorePayload.description).toBe(updatedProseText);
      expect(firestorePayload.sensoryAnchors).toEqual(existingSensoryAnchors);
      expect(firestorePayload.lastEditedSurface).toBe('fireside_mobile');
      expect(typeof firestorePayload.updatedAt).toBe('number');
    });

    it('renders inline Armchair Script Editor (HS_FIRESIDE_EDIT_SCRIPT_BTN, HS_FIRESIDE_SCRIPT_TEXTAREA, HS_FIRESIDE_SAVE_SCRIPT_BTN, HS_FIRESIDE_CANCEL_SCRIPT_BTN) for desktop_locked and fireside_flexible memories', () => {
      const onSaveProseSpy = vi.fn();
      const mockDesktopMemory = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        prose: 'The history I carry is an epic journey across oceans and generations.',
        editingAuthority: 'desktop_locked' as const,
        sensoryAnchors: [{ id: 'sa_1', type: 'visual', word: 'oceans' }],
      };

      const { unmount } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          editingAuthority: 'desktop_locked',
          resolveSceneAuthority: (): 'desktop_locked' => 'desktop_locked',
          activeSceneMemory: mockDesktopMemory,
          getSceneMemory: () => mockDesktopMemory,
          onSaveProse: onSaveProseSpy,
        })
      );

      // 1. Click ✏️ EDIT SCRIPT pill (MW-112 canonical grammar)
      const editBtn = (document.querySelector('[data-testid="HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN"]') ||
        document.querySelector('[data-testid="HS_FIRESIDE_EDIT_SCRIPT_BTN"]')) as HTMLElement;
      expect(editBtn).toBeTruthy();
      expect(editBtn.textContent).toContain('✏️ EDIT SCRIPT');
      fireEvent.click(editBtn);

      // 2. Verify Armchair Script Editor eyebrow, reassurance copy, textarea, and buttons
      const editorPanel = document.querySelector('[data-testid="fireside-armchair-script-editor"]') as HTMLElement;
      expect(editorPanel).toBeTruthy();
      expect(editorPanel.textContent).toContain('ARMCHAIR SCRIPT EDITOR');
      expect(editorPanel.textContent).toContain('Changes made here sync automatically to your Desktop Studio.');

      const textarea = document.querySelector('[data-testid="HS_FIRESIDE_SCRIPT_TEXTAREA"]') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.value).toBe('The history I carry is an epic journey across oceans and generations.');

      // 3. Test Cancel first
      fireEvent.change(textarea, { target: { value: 'Transient unsaved edit' } });
      const cancelBtn = document.querySelector('[data-testid="HS_FIRESIDE_CANCEL_SCRIPT_BTN"]') as HTMLButtonElement;
      expect(cancelBtn?.textContent).toContain('[ Cancel ]');
      fireEvent.click(cancelBtn);
      expect(onSaveProseSpy).not.toHaveBeenCalled();
      expect(document.querySelector('[data-testid="fireside-active-script-body"]')?.textContent).toContain(
        'The history I carry is an epic journey across oceans and generations.'
      );

      // 4. Re-open editor, modify prose, and click [ ✓ Save Script ]
      fireEvent.click(
        (document.querySelector('[data-testid="HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN"]') ||
          document.querySelector('[data-testid="HS_FIRESIDE_EDIT_SCRIPT_BTN"]')) as HTMLElement
      );
      const textareaReopened = document.querySelector('[data-testid="HS_FIRESIDE_SCRIPT_TEXTAREA"]') as HTMLTextAreaElement;
      fireEvent.change(textareaReopened, {
        target: { value: 'Refined mobile armchair prose with sensory warmth.' },
      });

      const saveBtn = document.querySelector('[data-testid="HS_FIRESIDE_SAVE_SCRIPT_BTN"]') as HTMLButtonElement;
      expect(saveBtn?.textContent).toContain('[ ✓ Save Script ]');
      fireEvent.click(saveBtn);

      // 5. Assert 0ms optimistic update on card and callback invocation
      expect(onSaveProseSpy).toHaveBeenCalledWith(
        'part-1-scene-1',
        'Refined mobile armchair prose with sensory warmth.'
      );
      expect(document.querySelector('[data-testid="fireside-active-script-body"]')?.textContent).toContain(
        'Refined mobile armchair prose with sensory warmth.'
      );

      unmount();

      // 6. Verify Mobile Recording provenance badge tooltip when fireside_flexible
      const { unmount: unmountMobile } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          editingAuthority: 'fireside_flexible',
          resolveSceneAuthority: (): 'fireside_flexible' => 'fireside_flexible',
        })
      );
      const mobileBadge = document.querySelector('[data-testid="carousel-mobile-recording-badge"]') as HTMLElement;
      expect(mobileBadge).toBeTruthy();
      expect(mobileBadge.getAttribute('title')).toBe(
        'Captured on Fireside Mobile • Full cross-device editing enabled'
      );
      unmountMobile();
    });
  });

  // =========================================================================
  // 9. MW-88-T8: Cross-Surface Nomenclature, CTA & Sensory Lockstep
  // =========================================================================
  describe('9. MW-88-T8: Cross-Surface Nomenclature, CTA & Sensory Lockstep', () => {
    it('renders dynamic Act I-IV stage badges in FiresideAuthHeader (HS_FIRESIDE_HEADER_ACT_BADGE)', () => {
      // Stage 1 (Default / Act I Scriptorium)
      expect(resolveHeaderActBadge(1)).toBe('🎬 ACT I: SCRIPTORIUM');
      expect(resolveHeaderActBadge(0)).toBe('🎬 ACT I: SCRIPTORIUM');
      expect(resolveHeaderActBadge(undefined)).toBe('🎬 ACT I: SCRIPTORIUM');

      // Stage 2 (Act II The Weave)
      expect(resolveHeaderActBadge(2)).toBe('✨ ACT II: THE WEAVE');

      // Stage 3 (Act III Soundstage)
      expect(resolveHeaderActBadge(3)).toBe('🎙️ ACT III: SOUNDSTAGE');

      // Stage 4 (Act IV Screening Room)
      expect(resolveHeaderActBadge(4)).toBe('🎞️ ACT IV: SCREENING ROOM');

      // Component render check for Stage 1 memory
      const { unmount: u1 } = render(
        React.createElement(FiresideAuthHeader, {
          activeStage: 1,
          activePartTitle: 'Part I: Roots and Foundations',
        })
      );
      const badge1 = document.querySelector('[data-testid="HS_FIRESIDE_HEADER_ACT_BADGE"]') as HTMLElement;
      expect(badge1).toBeTruthy();
      expect(badge1.textContent).toBe('🎬 ACT I: SCRIPTORIUM');
      u1();

      // Component render check for Stage 2 memory
      const { unmount: u2 } = render(
        React.createElement(FiresideAuthHeader, {
          activeStage: 2,
        })
      );
      expect(document.querySelector('[data-testid="HS_FIRESIDE_HEADER_ACT_BADGE"]')?.textContent).toBe(
        '✨ ACT II: THE WEAVE'
      );
      u2();

      // Component render check for Stage 3 memory
      const { unmount: u3 } = render(
        React.createElement(FiresideAuthHeader, {
          activeStage: 3,
        })
      );
      expect(document.querySelector('[data-testid="HS_FIRESIDE_HEADER_ACT_BADGE"]')?.textContent).toBe(
        '🎙️ ACT III: SOUNDSTAGE'
      );
      u3();

      // Component render check for Stage 4 memory
      const { unmount: u4 } = render(
        React.createElement(FiresideAuthHeader, {
          activeStage: 4,
        })
      );
      expect(document.querySelector('[data-testid="HS_FIRESIDE_HEADER_ACT_BADGE"]')?.textContent).toBe(
        '🎞️ ACT IV: SCREENING ROOM'
      );
      u4();
    });

    it('pipes prose through filterDominantSensoryAnchors(detectSensoryAnchors(activeProse)) so ey96djU6qR1BrDGnvZwp reports Soundscape (1), Visual (1), Aroma (0) in lockstep with Desktop Studio', () => {
      const fullProseEy96 =
        'The history I carry is an epic journey across oceans and generations, stitched together entirely from the vibrant stories my parents passed down to me. My origins begin in the sun-baked earth of Madhapur, a small farming village in the Kutch region of Gujarat, India, where my ancestors worked the soil with their bare hands.';

      // Raw anchors have multiple matches across all 3 modalities, but dominant trio filter yields 1/1/0
      const rawAnchors = detectSensoryAnchors(fullProseEy96);
      expect(rawAnchors.length).toBeGreaterThan(3);
      const dominantAnchors = filterDominantSensoryAnchors(rawAnchors);
      expect(dominantAnchors.filter((a) => a.type === 'soundscape').length).toBe(1);
      expect(dominantAnchors.filter((a) => a.type === 'visual').length).toBe(1);
      expect(dominantAnchors.filter((a) => a.type === 'aroma').length).toBe(0);

      const mockDocEy96 = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        prose: fullProseEy96,
        productionStage: 1,
        activeVisionLabel: 'The Memory Weave',
      };

      const { unmount } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          activeSceneMemory: mockDocEy96,
          getSceneMemory: () => mockDocEy96,
        })
      );

      const countersContainer = document.querySelector(
        '[data-testid="HS_FIRESIDE_DOMINANT_SENSORY_COUNTERS"]'
      ) as HTMLElement;
      expect(countersContainer).toBeTruthy();
      expect(countersContainer.textContent).toContain('Soundscape (1)');
      expect(countersContainer.textContent).toContain('Visual (1)');
      expect(countersContainer.textContent).toContain('Aroma (0)');

      // Verify Script Provenance Toolbar Pills (Section 3C & Section 5)
      const weavePill = document.querySelector(
        '[data-testid="HS_FIRESIDE_WEAVE_PROVENANCE_PILL"]'
      ) as HTMLElement;
      expect(weavePill).toBeTruthy();
      expect(weavePill.textContent).toContain('🎬 CINEMATIC WEAVE: THE MEMORY WEAVE');

      const sparkPill = (document.querySelector(
        '[data-testid="HS_FIRESIDE_CAROUSEL_SPARK_TOGGLE_BTN"]'
      ) || document.querySelector('[data-testid="HS_FIRESIDE_VIEW_SPARK_PILL"]')) as HTMLElement;
      expect(sparkPill).toBeTruthy();
      expect(sparkPill.textContent).toContain('👁️ VIEW ORIGINAL SPARK');

      const editPill = (document.querySelector(
        '[data-testid="HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN"]'
      ) || document.querySelector('[data-testid="HS_FIRESIDE_EDIT_SCRIPT_PILL"]')) as HTMLElement;
      expect(editPill).toBeTruthy();
      expect(editPill.textContent).toContain('✏️ EDIT SCRIPT');

      unmount();
    });

    it('renders Dual-Action Synchronised Footer Dock (HS_FIRESIDE_STAGE_PROGRESSION_BTN & HS_FIRESIDE_DIRECT_RECORD_BTN) and progresses 100% in-place across stages 1, 2, and 3', () => {
      // Stage 1: [ ✨ Progress to Act II: Sensory Weave → ] (in-place button, zero external href)
      const memStage1 = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        prose: 'Act I draft ready for sensory weaving.',
        productionStage: 1,
        takes: [],
      };
      const { unmount: u1 } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeSceneMemory: memStage1,
          getSceneMemory: () => memStage1,
        })
      );

      const prog1 = document.querySelector(
        '[data-testid="HS_FIRESIDE_STAGE_PROGRESSION_BTN"]'
      ) as HTMLButtonElement;
      const rec1 = document.querySelector(
        '[data-testid="HS_FIRESIDE_DIRECT_RECORD_BTN"]'
      ) as HTMLButtonElement;
      expect(prog1).toBeTruthy();
      expect(prog1.textContent).toBe('[ ✨ Progress to Act II: Sensory Weave → ]');
      expect(prog1.getAttribute('href')).toBeNull();
      expect(rec1).toBeTruthy();
      expect(rec1.textContent).toBe('[ 🎬 Action: Enter Soundstage → ]');
      u1();

      // Stage 2: [ 🎬 Progress to Act III: Record Performance → ]
      const memStage2 = {
        ...memStage1,
        productionStage: 2,
      };
      const { unmount: u2 } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeSceneMemory: memStage2,
          getSceneMemory: () => memStage2,
        })
      );
      const prog2 = document.querySelector(
        '[data-testid="HS_FIRESIDE_STAGE_PROGRESSION_BTN"]'
      ) as HTMLButtonElement;
      expect(prog2.textContent).toBe('[ 🎬 Progress to Act III: Record Performance → ]');
      expect(prog2.getAttribute('href')).toBeNull();
      u2();

      // Stage 3: [ 🎞️ Watch Master Reel in Screening Room ▶ ]
      const memStage3 = {
        ...memStage1,
        productionStage: 3,
      };
      const { unmount: u3 } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeSceneMemory: memStage3,
          getSceneMemory: () => memStage3,
        })
      );
      const prog3 = document.querySelector(
        '[data-testid="HS_FIRESIDE_STAGE_PROGRESSION_BTN"]'
      ) as HTMLButtonElement;
      expect(prog3.textContent).toBe('[ 🎞️ Watch Master Reel in Screening Room ▶ ]');
      expect(prog3.getAttribute('href')).toBeNull();
      u3();
    });
  });

  // =========================================================================
  // 10. MW-88-T9: Surface Containment, In-Place 4-Act Spine & Optics Shield
  // =========================================================================
  describe('10. MW-88-T9: Surface Containment, In-Place 4-Act Fireside Spine, Sensory Word-Pulse & Optics Privacy Shield Parity', () => {
    it('switches 4-Act Spine tabs (HS_FIRESIDE_ACT_TAB_1..4) 100% in-place without truncation or /studio/production redirects and synchronises FiresideAuthHeader', () => {
      const fullProseEy96 =
        'The history I carry is an epic journey across oceans and generations, stitched together entirely from the vibrant stories my parents passed down to me. My origins begin in the sun-baked earth of Madhapur, a small farming village in the Kutch region of Gujarat, India, where my ancestors worked the soil with their bare hands.';

      const mockDocEy96 = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        prose: fullProseEy96,
        productionStage: 1,
        activeVisionLabel: 'The Memory Weave',
      };

      const onSelectActStageSpy = vi.fn();
      const onOpenScreeningRoomSpy = vi.fn();

      const { unmount } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          activeSceneMemory: mockDocEy96,
          getSceneMemory: () => mockDocEy96,
          onSelectActStage: onSelectActStageSpy,
          onOpenScreeningRoom: onOpenScreeningRoomSpy,
        })
      );

      // 1. Verify all 4 tactile Act tabs render with min-h-[44px], zero truncate class, and zero /studio/production links
      const tab1 = document.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_1"]') as HTMLButtonElement;
      const tab2 = document.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_2"]') as HTMLButtonElement;
      const tab3 = document.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_3"]') as HTMLButtonElement;
      const tab4 = document.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_4"]') as HTMLButtonElement;

      expect(tab1).toBeTruthy();
      expect(tab2).toBeTruthy();
      expect(tab3).toBeTruthy();
      expect(tab4).toBeTruthy();
      expect(tab1.textContent).toContain('✓ Act I: Script');
      expect(tab2.textContent).toContain('● Act II: Weave');
      expect(tab3.textContent).toContain('○ Act III: Record');
      expect(tab4.textContent).toContain('○ Act IV: Screening');
      expect(tab1.className).not.toContain('truncate');
      expect(tab2.className).not.toContain('truncate');
      expect(tab3.className).not.toContain('truncate');
      expect(tab4.className).not.toContain('truncate');

      // Assert zero external /studio/production links inside the carousel card
      const productionLinks = document.querySelectorAll('a[href*="/studio/production"]');
      expect(productionLinks.length).toBe(0);

      // 2. Click Tab 2 (Act II: Weave) -> renders Mobile-Lite Sensory Weave Inspector helper cue
      fireEvent.click(tab2);
      expect(onSelectActStageSpy).toHaveBeenCalledWith(2);
      const weaveCue = document.querySelector('[data-testid="fireside-weave-helper-cue"]') as HTMLElement;
      expect(weaveCue).toBeTruthy();
      expect(weaveCue.textContent).toContain('Tap a sensory pill to highlight anchor cues in your script.');

      // 3. Click Tab 3 (Act III: Record) -> renders in-place Soundstage viewfinder trigger
      fireEvent.click(tab3);
      expect(onSelectActStageSpy).toHaveBeenCalledWith(3);
      expect(document.querySelector('[data-testid="HS_FIRESIDE_ACT3_CAPTURE_SLATE"]')).toBeTruthy();

      // 4. Click Tab 4 (Act IV: Screening) -> renders in-place Screening Room button and invokes onOpenScreeningRoom
      fireEvent.click(tab4);
      expect(onSelectActStageSpy).toHaveBeenCalledWith(4);
      const screeningBtn = document.querySelector('[data-testid="HS_FIRESIDE_INPLACE_SCREENING_BTN"]') as HTMLButtonElement;
      expect(screeningBtn).toBeTruthy();
      expect(screeningBtn.textContent).toContain('[ 🎞️ Watch Master Reel in Screening Room ▶ ]');
      fireEvent.click(screeningBtn);
      expect(onOpenScreeningRoomSpy).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('highlights sensory anchor words in-place when clicking HS_FIRESIDE_PULSE_PILL_SOUNDSCAPE, HS_FIRESIDE_PULSE_PILL_VISUAL, or HS_FIRESIDE_PULSE_PILL_AROMA', () => {
      const fullProseEy96 =
        'The history I carry is an epic journey across oceans and generations, stitched together entirely from the vibrant stories my parents passed down to me. My origins begin in the sun-baked earth of Madhapur, a small farming village in the Kutch region of Gujarat, India, where my ancestors worked the soil with their bare hands.';

      const mockDocEy96 = {
        id: 'ey96djU6qR1BrDGnvZwp',
        sceneId: 'part-1-scene-1',
        prose: fullProseEy96,
        productionStage: 2,
      };

      const { unmount } = render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          activeSceneMemory: mockDocEy96,
          getSceneMemory: () => mockDocEy96,
        })
      );

      const visualPill = document.querySelector(
        '[data-testid="HS_FIRESIDE_PULSE_PILL_VISUAL"]'
      ) as HTMLButtonElement;
      expect(visualPill).toBeTruthy();
      fireEvent.click(visualPill);

      // Verify inline sensory feedback toast and highlighted word span inside script body
      const toastBanner = document.querySelector(
        '[data-testid="fireside-sensory-highlight-toast"]'
      ) as HTMLElement;
      expect(toastBanner).toBeTruthy();
      expect(toastBanner.textContent).toBe('Highlighting visual atmosphere cues.');

      const highlightedSpans = document.querySelectorAll(
        '[data-testid="fireside-sensory-highlighted-word"]'
      );
      expect(highlightedSpans.length).toBeGreaterThan(0);
      expect((highlightedSpans[0] as HTMLElement).className).toContain(
        'bg-amber-400/30 text-amber-200 border-b border-amber-400 px-1 rounded animate-pulse'
      );

      unmount();
    });

    it('renders Hardware Camera & Microphone Privacy Shield (🛡️ Optics Inactive / 🚫 Severed • Re-Arm) in FiresideAuthHeader and FiresideVideoRecorder', () => {
      const { unmount } = render(
        React.createElement(
          HardwarePrivacyProvider,
          null,
          React.createElement(FiresideAuthHeader, { activeStage: 1 }),
          React.createElement(FiresideVideoRecorder, { activeLanguage: 'en' })
        )
      );

      const headerShieldBtn = document.querySelector(
        '[data-testid="optics-privacy-shield-btn"]'
      ) as HTMLButtonElement;
      expect(headerShieldBtn).toBeTruthy();
      expect(headerShieldBtn.textContent).toContain('🛡️ Optics Inactive');

      const viewfinderOpticsBadge = document.querySelector(
        '[data-testid="HS_FIRESIDE_VIEWFINDER_OPTICS_BADGE"]'
      ) as HTMLElement;
      expect(viewfinderOpticsBadge).toBeTruthy();
      expect(viewfinderOpticsBadge.textContent).toContain('🛡️ OPTICS INACTIVE');

      unmount();
    });
  });
});

// =============================================================================
// 11. MW-88-T10: Spine Pill Overflow Fix & Act III Recorded Take Branching
// =============================================================================
describe('11. MW-88-T10: Spine Pill Overflow Fix & Act III Recorded Take Branching', () => {
  const baseMemory = {
    id: 'test-scene-1',
    sceneId: 'part-1-scene-1',
    prose: 'Test prose content for Act III branching.',
    originalHook: 'Test hook',
    description: 'Test description',
    takes: [] as import('@/types/curriculum').MemoirTake[],
  };

  const memoryWithTake = {
    ...baseMemory,
    takes: [{
      id: 'take-001',
      takeNumber: 1,
      source: 'fireside_mobile' as const,
      mediaMode: 'video' as const,
      mediaUrl: 'https://example.com/take1.mp4',
      durationSeconds: 45,
      createdAt: '2026-09-29T12:00:00Z',
      label: 'Take 1 (Fireside Mobile)',
      isPreferred: true,
    }],
  };

  it('Act III capture slate renders when takes is empty (HS_FIRESIDE_ACT3_CAPTURE_SLATE)', () => {
    const { container, unmount } = render(
      React.createElement(SingleCardPromptCarousel, {
        activeSceneMemory: baseMemory,
        selectedActStage: 3,
      })
    );
    const act3Tab = container.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_3"]') as HTMLButtonElement;
    if (act3Tab) fireEvent.click(act3Tab);

    const captureSlate = container.querySelector('[data-testid="HS_FIRESIDE_ACT3_CAPTURE_SLATE"]');
    const recordedView = container.querySelector('[data-testid="HS_FIRESIDE_ACT3_RECORDED_VIEW"]');
    expect(captureSlate).not.toBeNull();
    expect(recordedView).toBeNull();
    expect(captureSlate?.textContent).toContain('Ready to capture your voice');
    unmount();
  });

  it('Act III recorded take slate renders when takes.length > 0 (HS_FIRESIDE_ACT3_RECORDED_VIEW)', () => {
    const { container, unmount } = render(
      React.createElement(SingleCardPromptCarousel, {
        activeSceneMemory: memoryWithTake,
        selectedActStage: 3,
      })
    );
    const act3Tab = container.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_3"]') as HTMLButtonElement;
    if (act3Tab) fireEvent.click(act3Tab);

    const recordedView = container.querySelector('[data-testid="HS_FIRESIDE_ACT3_RECORDED_VIEW"]');
    const captureSlate = container.querySelector('[data-testid="HS_FIRESIDE_ACT3_CAPTURE_SLATE"]');
    expect(recordedView).not.toBeNull();
    expect(captureSlate).toBeNull();
    expect(recordedView?.textContent).toContain('TAKE RECORDED');
    expect(recordedView?.textContent).toContain('READY FOR SCREENING');
    unmount();
  });

  it('Audition and retake buttons render in recorded take view with correct testids', () => {
    const { container, unmount } = render(
      React.createElement(SingleCardPromptCarousel, {
        activeSceneMemory: memoryWithTake,
        selectedActStage: 3,
        onOpenScreeningRoom: vi.fn(),
      })
    );
    const act3Tab = container.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_3"]') as HTMLButtonElement;
    if (act3Tab) fireEvent.click(act3Tab);

    const auditionBtn = container.querySelector('[data-testid="HS_FIRESIDE_AUDITION_TAKE_BTN"]');
    const retakeBtn = container.querySelector('[data-testid="HS_FIRESIDE_RETAKE_SCROLL_BTN"]');
    expect(auditionBtn).not.toBeNull();
    expect(auditionBtn?.textContent).toContain('Audition Master Take');
    expect(retakeBtn).not.toBeNull();
    expect(retakeBtn?.textContent).toContain('Record Additional Take');
    unmount();
  });

  it('Spine container renders all 4 tab testids simultaneously (grid-cols-4)', () => {
    const { container, unmount } = render(
      React.createElement(SingleCardPromptCarousel, { activeSceneMemory: baseMemory })
    );
    expect(container.querySelector('[data-testid="HS_FIRESIDE_ACT_SPINE"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_1"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_2"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_3"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="HS_FIRESIDE_ACT_TAB_4"]')).not.toBeNull();
    unmount();
  });

  it('Mobile compact labels present in sm:hidden spans — no whitespace-nowrap on any tab button', () => {
    const { container, unmount } = render(
      React.createElement(SingleCardPromptCarousel, { activeSceneMemory: baseMemory })
    );
    // All 4 mobile spans present
    const mobileSpans = container.querySelectorAll('[data-testid^="HS_FIRESIDE_ACT_TAB_"] span.sm\\:hidden');
    expect(mobileSpans.length).toBe(4);
    // Check each span contains the compact label substring (use includes, not regex-strip, to preserve spaces)
    const texts = Array.from(mobileSpans).map((s) => s.textContent ?? '');
    expect(texts.some((t) => t.includes('I: Script'))).toBe(true);
    expect(texts.some((t) => t.includes('II: Weave'))).toBe(true);
    expect(texts.some((t) => t.includes('III: Record'))).toBe(true);
    expect(texts.some((t) => t.includes('IV: Reel'))).toBe(true);
    // No button carries whitespace-nowrap
    container.querySelectorAll('[data-testid^="HS_FIRESIDE_ACT_TAB_"]').forEach((tab) => {
      expect(tab.className).not.toContain('whitespace-nowrap');
    });
    unmount();
  });

  it('Desktop full labels present in hidden sm:inline spans', () => {
    const { container, unmount } = render(
      React.createElement(SingleCardPromptCarousel, { activeSceneMemory: baseMemory })
    );
    const desktopSpans = container.querySelectorAll('[data-testid^="HS_FIRESIDE_ACT_TAB_"] span.hidden');
    expect(desktopSpans.length).toBe(4);
    const texts = Array.from(desktopSpans).map((s) => s.textContent ?? '');
    expect(texts.some((t) => t.includes('Act I: Script'))).toBe(true);
    expect(texts.some((t) => t.includes('Act II: Weave'))).toBe(true);
    expect(texts.some((t) => t.includes('Act III: Record'))).toBe(true);
    expect(texts.some((t) => t.includes('Act IV: Screening'))).toBe(true);
    unmount();
  });
});


// -------------------------------------------------------------------------------
// SUITE 12 � MW-100: ChapterSpineRail Unit Tests (Regression Shield)
// -------------------------------------------------------------------------------
import { ChapterSpineRail, ChapterSpineScene } from '@/components/navigation/ChapterSpineRail';

const SPINE_SCENES: ChapterSpineScene[] = [
  { id: 'part-1-scene-1', index: 0, title: 'A Child of Two Worlds', partNumber: 1, partTitle: 'Part I: Roots and Foundations', hasCompletedReel: false, hasDraftProse: false, takesCount: 0 },
  { id: 'part-1-scene-2', index: 1, title: 'The House I Grew Up In', partNumber: 1, partTitle: 'Part I: Roots and Foundations', hasCompletedReel: true, hasDraftProse: true, takesCount: 2 },
  { id: 'part-1-scene-3', index: 2, title: 'Innocence and Curiosity', partNumber: 1, partTitle: 'Part I: Roots and Foundations', hasCompletedReel: false, hasDraftProse: true, takesCount: 0 },
];

describe('Suite 12 � MW-100: ChapterSpineRail', () => {
  it('renders the correct count of scene tokens', () => {
    const { container, unmount } = render(
      React.createElement(ChapterSpineRail, {
        scenes: SPINE_SCENES,
        activeSceneId: 'part-1-scene-1',
        onSelectScene: () => {},
        orientation: 'horizontal',
      })
    );
    const tokens = container.querySelectorAll('[data-testid^="HS_SPINE_SCENE_"]');
    expect(tokens.length).toBe(3);
    unmount();
  });

  it('marks the active scene with HS_SPINE_ACTIVE_SCENE testid', () => {
    const { getByTestId, unmount } = render(
      React.createElement(ChapterSpineRail, {
        scenes: SPINE_SCENES,
        activeSceneId: 'part-1-scene-2',
        onSelectScene: () => {},
        orientation: 'horizontal',
      })
    );
    const activeLabel = getByTestId('HS_SPINE_ACTIVE_SCENE');
    expect(activeLabel.textContent).toContain('The House I Grew Up In');
    unmount();
  });

  it('calls onSelectScene with correct sceneId when an inactive token is clicked', () => {
    const onSelect = vi.fn();
    const { getByTestId, unmount } = render(
      React.createElement(ChapterSpineRail, {
        scenes: SPINE_SCENES,
        activeSceneId: 'part-1-scene-1',
        onSelectScene: onSelect,
        orientation: 'horizontal',
      })
    );
    const scene2Token = getByTestId('HS_SPINE_SCENE_part-1-scene-2');
    scene2Token.click();
    expect(onSelect).toHaveBeenCalledWith('part-1-scene-2');
    unmount();
  });

  it('renders HS_CHAPTER_SPINE_RAIL container testid', () => {
    const { getAllByTestId, unmount } = render(
      React.createElement(ChapterSpineRail, {
        scenes: SPINE_SCENES,
        activeSceneId: 'part-1-scene-1',
        onSelectScene: () => {},
        orientation: 'horizontal',
      })
    );
    const rails = getAllByTestId('HS_CHAPTER_SPINE_RAIL');
    expect(rails.length).toBeGreaterThanOrEqual(1);
    unmount();
  });

  it('does not render active scene label for inactive tokens', () => {
    const { queryAllByTestId, unmount } = render(
      React.createElement(ChapterSpineRail, {
        scenes: SPINE_SCENES,
        activeSceneId: 'part-1-scene-1',
        onSelectScene: () => {},
        orientation: 'horizontal',
      })
    );
    const activeLabels = queryAllByTestId('HS_SPINE_ACTIVE_SCENE');
    expect(activeLabels.length).toBe(1);
    unmount();
  });

  it('renders part label divs for each part group', () => {
    const { getAllByTestId, unmount } = render(
      React.createElement(ChapterSpineRail, {
        scenes: SPINE_SCENES,
        activeSceneId: 'part-1-scene-1',
        onSelectScene: () => {},
        orientation: 'horizontal',
      })
    );
    const partLabels = getAllByTestId('HS_SPINE_PART_LABEL');
    expect(partLabels.length).toBeGreaterThanOrEqual(1);
    unmount();
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Suite 13: MW-100-BRUTAL — Upright Part Labels, 1:1 Desktop Taxonomy & Action Verb Lockstep
// ═══════════════════════════════════════════════════════════════════════════

describe('Suite 13: MW-100-BRUTAL — Upright Part Labels, 1:1 Desktop Taxonomy & Action Verb Lockstep', () => {
  it('13.1 HS_SPINE_PART_LABEL renders upright PART I text with zero rotate-180 or writing-mode-vertical classes', () => {
    const { getAllByTestId, unmount } = render(
      React.createElement(ChapterSpineRail, {
        scenes: SPINE_SCENES,
        activeSceneId: 'part-1-scene-1',
        onSelectScene: () => {},
        orientation: 'horizontal',
      })
    );
    const partLabels = getAllByTestId('HS_SPINE_PART_LABEL');
    expect(partLabels.length).toBeGreaterThanOrEqual(1);
    const span = partLabels[0].querySelector('span') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.textContent).toBe('PART I');
    expect(span.className).not.toContain('rotate-180');
    expect(span.className).not.toContain('writing-mode-vertical');
    unmount();
  });

  it('13.2 Next Recommended scene token receives data-recommended=true and pulsing emerald beacon ring', () => {
    const testScenes = [
      { id: 'part-1-scene-1', index: 0, title: 'A Child of Two Worlds', partNumber: 1, partTitle: 'Part I', hasCompletedReel: true, hasDraftProse: true, takesCount: 1 },
      { id: 'part-1-scene-2', index: 1, title: 'The House I Grew Up In', partNumber: 1, partTitle: 'Part I', hasCompletedReel: false, hasDraftProse: true, takesCount: 0 },
      { id: 'part-1-scene-3', index: 2, title: 'Innocence and Curiosity', partNumber: 1, partTitle: 'Part I', hasCompletedReel: false, hasDraftProse: false, takesCount: 0 },
    ];
    const { getByTestId, unmount } = render(
      React.createElement(ChapterSpineRail, {
        scenes: testScenes,
        activeSceneId: 'part-1-scene-1',
        onSelectScene: () => {},
        orientation: 'horizontal',
      })
    );
    const scene3Token = getByTestId('HS_SPINE_SCENE_part-1-scene-3');
    expect(scene3Token.getAttribute('data-recommended')).toBe('true');
    expect(scene3Token.className).toContain('ring-emerald-400');
    unmount();
  });

  it('13.3 SingleCardPromptCarousel renders HS_FIRESIDE_CROWN_NEXT_RECOMMENDED and [ 🎬 READY FOR ACTION ] on first uncompleted scene', () => {
    const { queryByTestId, getByTestId, unmount } = render(
      React.createElement(SingleCardPromptCarousel, {
        activeLanguage: 'en',
        mediaMode: 'video',
      })
    );
    const crown = getByTestId('HS_FIRESIDE_CROWN_NEXT_RECOMMENDED');
    expect(crown.textContent).toContain('NEXT RECOMMENDED');
    const readyBadge = getByTestId('HS_FIRESIDE_BADGE_READY_FOR_ACTION');
    expect(readyBadge.textContent).toContain('READY FOR ACTION');
    expect(queryByTestId('HS_FIRESIDE_BADGE_CAPTURED')).toBeNull();
    const cta = getByTestId('HS_FIRESIDE_DIRECT_RECORD_BTN');
    expect(cta.textContent).toContain('[ 🎬 Action: Enter Soundstage → ]');
    unmount();
  });

  it('13.4 SingleCardPromptCarousel renders [ 📹 CAPTURED ] + [ 🎞️ PRE-RELEASE ] and [ ✏️ Edit Scene / Audition Take → ] when scene has recorded take', () => {
    const recordedMem = {
      id: 'mem-1',
      sceneId: 'part-1-scene-1',
      currentStatus: 'captured' as const,
      prose: 'My grandparents crossed the ocean.',
      takes: [
        {
          id: 't1',
          takeNumber: 1,
          source: 'fireside_mobile' as const,
          mediaMode: 'video' as const,
          mediaType: 'video' as const,
          label: 'Take 1',
          isPreferred: true,
          mediaUrl: 'https://storage.googleapis.com/test/reel1.mp4',
          durationSeconds: 45,
          createdAt: '2026-09-29T12:00:00Z',
          originSurface: 'fireside_mobile' as const,
        },
      ],
    };
    const { getByTestId, queryByTestId, unmount } = render(
      React.createElement(SingleCardPromptCarousel, {
        activeLanguage: 'en',
        mediaMode: 'video',
        activeSceneMemory: recordedMem,
        getSceneMemory: (id?: string) => (id === 'part-1-scene-1' ? recordedMem : undefined),
      })
    );
    expect(queryByTestId('HS_FIRESIDE_CROWN_NEXT_RECOMMENDED')).toBeNull();
    expect(getByTestId('HS_FIRESIDE_BADGE_CAPTURED').textContent).toContain('CAPTURED');
    expect(getByTestId('HS_FIRESIDE_BADGE_PRE_RELEASE').textContent).toContain('PRE-RELEASE');
    const cta = getByTestId('HS_FIRESIDE_DIRECT_RECORD_BTN');
    expect(cta.textContent).toContain('[ ✏️ Edit Scene / Audition Take → ]');
    unmount();
  });

  it('13.5 SingleCardPromptCarousel renders [ 📹 CAPTURED ] + [ ✍️ STUDIO DRAFT ] when scene has draft prose and 0 takes', () => {
    const draftMem = {
      id: 'mem-2',
      sceneId: 'part-1-scene-1',
      currentStatus: 'ready_for_action' as const,
      prose: 'The house had a blue wooden veranda.',
      takes: [],
    };
    const { getByTestId, queryByTestId, unmount } = render(
      React.createElement(SingleCardPromptCarousel, {
        activeLanguage: 'en',
        mediaMode: 'audio',
        activeSceneMemory: draftMem,
        getSceneMemory: (id?: string) => (id === 'part-1-scene-1' ? draftMem : undefined),
      })
    );
    expect(queryByTestId('HS_FIRESIDE_CROWN_NEXT_RECOMMENDED')).toBeNull();
    expect(getByTestId('HS_FIRESIDE_BADGE_CAPTURED').textContent).toContain('CAPTURED');
    expect(getByTestId('HS_FIRESIDE_BADGE_STUDIO_DRAFT').textContent).toContain('STUDIO DRAFT');
    unmount();
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Suite 14: MW-100-C — Unified Orientation Dock, Chevron Steppers & Route Redirect
// ═══════════════════════════════════════════════════════════════════════════

import { OrientationSoundcheckDock, ORIENTATION_DOCK_STORAGE_KEY } from '@/components/fireside/OrientationSoundcheckDock';

describe('Suite 14: MW-100-C — Unified Orientation Dock, Chevron Steppers & Route Redirect', () => {
  beforeEach(() => {
    window.localStorage.removeItem(ORIENTATION_DOCK_STORAGE_KEY);
    window.sessionStorage.removeItem('mw_dismiss_fireside_walkthrough');
  });

  it('14.1 OrientationSoundcheckDock starts expanded on first visit and persists mw_orientation_dock_collapsed in localStorage when minimised/expanded', () => {
    const { getByTestId, queryByTestId, unmount } = render(
      React.createElement(OrientationSoundcheckDock, {
        activeLanguage: 'en',
        showDesktopBanner: true,
      })
    );

    const dock = getByTestId('HS_ORIENTATION_SOUNDCHECK_DOCK');
    expect(dock).toBeTruthy();
    expect(queryByTestId('HS_ORIENTATION_DOCK_COLLAPSED_STRIP')).toBeNull();
    expect(getByTestId('desktop-soundstage-banner')).toBeTruthy();
    expect(getByTestId('fireside-walkthrough-card')).toBeTruthy();

    // Click Minimise
    fireEvent.click(getByTestId('HS_ORIENTATION_DOCK_MINIMISE_BTN'));
    expect(window.localStorage.getItem('mw_orientation_dock_collapsed')).toBe('true');
    expect(getByTestId('HS_ORIENTATION_DOCK_COLLAPSED_STRIP')).toBeTruthy();
    expect(getByTestId('HS_ORIENTATION_LAUNCH_SOUNDSTAGE_BTN')).toBeTruthy();
    expect(getByTestId('HS_ORIENTATION_LAUNCH_SOUNDCHECK_BTN')).toBeTruthy();

    // Click Expand
    fireEvent.click(getByTestId('HS_ORIENTATION_DOCK_MINIMISE_BTN'));
    expect(window.localStorage.getItem('mw_orientation_dock_collapsed')).toBe('false');
    expect(queryByTestId('HS_ORIENTATION_DOCK_COLLAPSED_STRIP')).toBeNull();

    unmount();
  });

  it('14.2 ChapterSpineRail applies scrollbar suppression classes and steps scene index via HS_SPINE_PREV_BTN and HS_SPINE_NEXT_BTN', () => {
    const selectedIds: string[] = [];
    const { getByTestId, unmount } = render(
      React.createElement(ChapterSpineRail, {
        scenes: SPINE_SCENES,
        activeSceneId: 'part-1-scene-1',
        onSelectScene: (id: string) => selectedIds.push(id),
        orientation: 'horizontal',
      })
    );

    const rail = getByTestId('HS_CHAPTER_SPINE_RAIL');
    expect(rail.className).toContain('[scrollbar-width:none]');
    expect(rail.className).toContain('[-ms-overflow-style:none]');
    expect(rail.className).toContain('[&::-webkit-scrollbar]:hidden');

    const nextBtn = getByTestId('HS_SPINE_NEXT_BTN');
    const prevBtn = getByTestId('HS_SPINE_PREV_BTN');
    expect(nextBtn.style.minHeight).toBe('44px');
    expect(prevBtn.style.minHeight).toBe('44px');

    fireEvent.click(nextBtn);
    expect(selectedIds[selectedIds.length - 1]).toBe('part-1-scene-2');

    fireEvent.click(prevBtn);
    expect(selectedIds[selectedIds.length - 1]).toBe(SPINE_SCENES[SPINE_SCENES.length - 1].id);

    unmount();
  });

  it('14.3 PRODUCTION STAGE Header Stepper jumps to Scene 1 of next/previous Part while ChapterSpineRail chevrons step scene-by-scene in 1:1 lockstep', () => {
    const ControlledHarness = () => {
      const [activeId, setActiveId] = React.useState('part-1-scene-1');
      return React.createElement(SingleCardPromptCarousel, {
        activeLanguage: 'en',
        mediaMode: 'video',
        activePromptId: activeId,
        onActivePromptChange: (spark) => setActiveId(spark.id),
      });
    };

    const { getByTestId, unmount } = render(React.createElement(ControlledHarness));

    const subtitle = getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE');
    expect(subtitle.textContent).toContain('Part I - Scene 1');
    expect(subtitle.textContent).toMatch(/(Scene|Story) 1 of/);
    expect(subtitle.textContent).toContain('A Child of Two Worlds');
    expect(getByTestId('HS_SPINE_ACTIVE_SCENE').textContent).toContain('1 · A Child of Two Worlds');

    // Jump to next Part Scene 1 via PRODUCTION STAGE Header Next Chevron (Part I -> Part II - Scene 1)
    fireEvent.click(getByTestId('HS_FIRESIDE_HEADER_NEXT_SCENE'));
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toContain('Part II - Scene 1');
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toMatch(/(Scene|Story) 4 of/);
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toContain('Formative Friendships');
    expect(getByTestId('HS_SPINE_ACTIVE_SCENE').textContent).toContain('4 · Formative Friendships');

    // Step forward 1 scene via Spine Rail Next Chevron (Part II - Scene 1 -> Part II - Scene 2)
    fireEvent.click(getByTestId('HS_SPINE_NEXT_BTN'));
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toContain('Part II - Scene 2');
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toMatch(/(Scene|Story) 5 of/);
    expect(getByTestId('HS_SPINE_ACTIVE_SCENE').textContent).toContain('5 ·');

    // MW-114: Step forward to Part II Scene 3 (Crossroads and Choices)
    fireEvent.click(getByTestId('HS_SPINE_NEXT_BTN'));
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toContain('Part II - Scene 3');
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toContain('Crossroads and Choices');

    // MW-114: Step forward to Part II Scene 4 (Learning the Hard Way)
    fireEvent.click(getByTestId('HS_SPINE_NEXT_BTN'));
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toContain('Part II - Scene 4');
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toContain('Learning the Hard Way');

    // Jump backward to previous Part Scene 1 via PRODUCTION STAGE Header Prev Chevron (Part II -> Part I - Scene 1)
    fireEvent.click(getByTestId('HS_FIRESIDE_HEADER_PREV_SCENE'));
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toContain('Part I - Scene 1');
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toMatch(/(Scene|Story) 1 of/);
    expect(getByTestId('HS_FIRESIDE_HEADER_SCENE_SUBTITLE').textContent).toContain('A Child of Two Worlds');
    expect(getByTestId('HS_SPINE_ACTIVE_SCENE').textContent).toContain('1 · A Child of Two Worlds');

    unmount();
  });

  it('14.4 Bare /studio/production route page executes server-side redirect to /studio', () => {
    const pageSource = fs.readFileSync('C:/Users/home/studio/src/app/studio/production/page.tsx', 'utf8');
    expect(pageSource).toContain("import { redirect } from 'next/navigation'");
    expect(pageSource).toContain("redirect('/studio')");
  });
});

// =============================================================================
// 15. MW-105-A: Mobile Sign-In Parity & Fireside Profile Drawer
// =============================================================================
describe('15. MW-105-A: Mobile Sign-In Parity & Fireside Profile Drawer', () => {
  afterEach(() => {
    mockCurrentUser = {
      uid: 'TQdB395kXxaAGPhFxk1LVWuT8cg2',
      email: 'nareshmepani@hotmail.com',
      displayName: 'Naresh Mepani',
      isAnonymous: false,
      directorPassStatus: 'free_host_pass_active',
    };
  });

  it('15.1 LoginForm renders escape hatch and register link preserving redirect, with text-base inputs', () => {
    const { getByTestId, unmount } = render(React.createElement(LoginForm));

    const escapeHatch = getByTestId('HS_AUTH_ESCAPE_HATCH');
    expect(escapeHatch).toBeTruthy();
    expect(escapeHatch.getAttribute('href')).toBe('/studio/fireside');
    expect(escapeHatch.textContent).toContain('Return to Fireside Studio');

    const toRegisterLink = getByTestId('HS_AUTH_TO_REGISTER_LINK');
    expect(toRegisterLink).toBeTruthy();
    expect(toRegisterLink.getAttribute('href')).toBe('/register?redirect=%2Fstudio%2Ffireside');
    expect(toRegisterLink.textContent).toContain('Create an Account');

    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    expect(emailInput.className).toContain('text-base');
    expect(passwordInput.className).toContain('text-base');

    unmount();
  });

  it('15.2 RegisterContent renders escape hatch and login link preserving redirect, with text-base inputs', () => {
    const { getByTestId, unmount } = render(React.createElement(RegisterContent));

    const escapeHatch = getByTestId('HS_AUTH_ESCAPE_HATCH');
    expect(escapeHatch).toBeTruthy();
    expect(escapeHatch.getAttribute('href')).toBe('/studio/fireside');
    expect(escapeHatch.textContent).toContain('Return to Fireside Studio');

    const toLoginLink = getByTestId('HS_AUTH_TO_LOGIN_LINK');
    expect(toLoginLink).toBeTruthy();
    expect(toLoginLink.getAttribute('href')).toBe('/login?redirect=%2Fstudio%2Ffireside');

    const nameInput = document.getElementById('name') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    expect(nameInput.className).toContain('text-base');
    expect(emailInput.className).toContain('text-base');

    unmount();
  });

  it('15.3 FiresideProfileDrawer renders min 44px avatar trigger and slide-over drawer with 1:1 Desktop navigation for authenticated director', () => {
    const { getByTestId, unmount } = render(React.createElement(FiresideProfileDrawer));

    const triggerBtn = getByTestId('HS_FIRESIDE_USER_PROFILE_BTN');
    expect(triggerBtn).toBeTruthy();
    expect(triggerBtn.style.minHeight).toBe('44px');
    expect(triggerBtn.style.minWidth).toBe('44px');
    expect(triggerBtn.textContent).toContain('N');

    // Click to open slide-over sheet drawer
    fireEvent.click(triggerBtn);

    const drawer = getByTestId('HS_FIRESIDE_PROFILE_DRAWER');
    expect(drawer).toBeTruthy();
    expect(drawer.textContent).toContain('Naresh Mepani');
    expect(drawer.textContent).toContain('nareshmepani@hotmail.com');
    expect(drawer.textContent).toContain('6-Month Director Pass');

    // Verify all 1:1 Desktop menu links
    expect(getByTestId('HS_DRAWER_LINK_DESKTOP_STUDIO').getAttribute('href')).toBe('/studio');
    expect(getByTestId('HS_DRAWER_LINK_SETTINGS').getAttribute('href')).toBe('/settings?returnTo=/studio/fireside');
    expect(getByTestId('HS_DRAWER_LINK_HOW_IT_WORKS').getAttribute('href')).toBe('/how-it-works');
    expect(getByTestId('HS_DRAWER_LINK_PRICING').getAttribute('href')).toBe('/pricing');
    expect(getByTestId('HS_DRAWER_LINK_GIFT').getAttribute('href')).toBe('/gift');
    expect(getByTestId('HS_DRAWER_LINK_SUPPORT').getAttribute('href')).toBe('/contact');

    // Verify session sign-out button
    const sessionBtn = getByTestId('HS_DRAWER_SESSION_BTN');
    expect(sessionBtn.textContent).toContain('Sign Out');

    unmount();
  });

  it('15.4 FiresideProfileDrawer renders min 44px guest trigger and sign-in action for unauthenticated visitor', () => {
    mockCurrentUser = null;

    const { getByTestId, unmount } = render(React.createElement(FiresideProfileDrawer));

    const triggerBtn = getByTestId('HS_FIRESIDE_USER_PROFILE_BTN');
    expect(triggerBtn).toBeTruthy();
    expect(triggerBtn.style.minHeight).toBe('44px');
    expect(triggerBtn.textContent).toContain('Menu');

    // Click to open drawer
    fireEvent.click(triggerBtn);

    const drawer = getByTestId('HS_FIRESIDE_PROFILE_DRAWER');
    expect(drawer).toBeTruthy();
    expect(drawer.textContent).toContain('Guest Storyteller');
    expect(drawer.textContent).toContain('Local Phone Session');

    // Verify session button points to sign-in
    const sessionBtn = getByTestId('HS_DRAWER_SESSION_BTN');
    expect(sessionBtn.getAttribute('href')).toBe('/login?redirect=/studio/fireside');
    expect(sessionBtn.textContent).toContain('Sign In / Create Account');

    unmount();
  });

  it('15.5 FiresideAuthHeader integrates FiresideProfileDrawer alongside vault status and sign-in links', () => {
    // Authenticated state
    const { getByTestId, unmount } = render(React.createElement(FiresideAuthHeader));
    expect(getByTestId('HS_FIRESIDE_USER_PROFILE_BTN')).toBeTruthy();
    unmount();

    // Guest state
    mockCurrentUser = null;
    const { getByTestId: getByTestIdGuest, unmount: unmountGuest } = render(React.createElement(FiresideAuthHeader));
    expect(
      document.querySelector('[data-testid="HS_FIRESIDE_HEADER_SIGNIN_BTN"]') ||
      document.querySelector('[data-testid="HS_FIRESIDE_SIGNIN_BTN"]')
    ).toBeTruthy();
    expect(getByTestIdGuest('HS_FIRESIDE_USER_PROFILE_BTN')).toBeTruthy();
    unmountGuest();
  });
});

// =========================================================================
// 16. MW-111: Eliminating Premature Recording Mode Decisions & Act III Just-in-Time Slate
// =========================================================================
describe('16. MW-111: Eliminating Premature Recording Mode Decisions & Act III Just-in-Time Slate', () => {
  it('16.1 embeds HS_ACT3_MODE_SELECTOR inside Act III Capture Slate with min 56px touch targets and ring-2 ring-emerald-400 active styling', () => {
    const onModeChangeSpy = vi.fn();
    const mockDoc = {
      id: 'ey96djU6qR1BrDGnvZwp',
      sceneId: 'part-1-scene-1',
      prose: 'A story of family and roots in Gujarat.',
      takes: [],
    };

    const { getByTestId, unmount } = render(
      React.createElement(SingleCardPromptCarousel, {
        activeLanguage: 'en',
        activeSceneMemory: mockDoc,
        getSceneMemory: () => mockDoc,
        mediaMode: 'video',
        onMediaModeChange: onModeChangeSpy,
      })
    );

    // Navigate to Act III: Record
    const tab3 = getByTestId('HS_FIRESIDE_ACT_TAB_3');
    fireEvent.click(tab3);

    // Verify Act III Capture Slate is present
    const slate = getByTestId('HS_FIRESIDE_ACT3_CAPTURE_SLATE');
    expect(slate).toBeTruthy();
    expect(slate.textContent).toContain('Act III: The Recording Floor');

    // Verify HS_ACT3_MODE_SELECTOR is embedded inside the slate
    const modeSelector = getByTestId('HS_ACT3_MODE_SELECTOR');
    expect(modeSelector).toBeTruthy();

    // Verify Voice and Video buttons
    const voiceBtn = getByTestId('HS_ACT3_MODE_VOICE_BTN');
    const videoBtn = getByTestId('HS_ACT3_MODE_VIDEO_BTN');
    expect(voiceBtn).toBeTruthy();
    expect(videoBtn).toBeTruthy();

    // Elder ergonomics: min 56px height
    expect(voiceBtn.style.minHeight).toBe('56px');
    expect(videoBtn.style.minHeight).toBe('56px');

    // Video button should have active emerald ring (ring-2 ring-emerald-400)
    expect(videoBtn.className).toContain('ring-2 ring-emerald-400');
    expect(voiceBtn.className).not.toContain('ring-2 ring-emerald-400');

    // CTA button matches video mode
    const launchBtn = getByTestId('HS_FIRESIDE_OPEN_VIEWFINDER_BTN');
    expect(launchBtn.textContent).toContain('[ 🎬 Ignite Camera & Prompter → ]');

    // Click Voice & Photos mode
    fireEvent.click(voiceBtn);
    expect(onModeChangeSpy).toHaveBeenCalledWith('audio');

    unmount();
  });

  it('16.2 renders voice-specific launch CTA when mediaMode is audio and persists mode selection to localStorage', () => {
    const onModeChangeSpy = vi.fn();
    const mockDoc = {
      id: 'ey96djU6qR1BrDGnvZwp',
      sceneId: 'part-1-scene-1',
      prose: 'A story of family and roots in Gujarat.',
      takes: [],
    };

    const { getByTestId, unmount } = render(
      React.createElement(SingleCardPromptCarousel, {
        activeLanguage: 'en',
        activeSceneMemory: mockDoc,
        getSceneMemory: () => mockDoc,
        mediaMode: 'audio',
        onMediaModeChange: onModeChangeSpy,
      })
    );

    // Navigate to Act III: Record
    fireEvent.click(getByTestId('HS_FIRESIDE_ACT_TAB_3'));

    const voiceBtn = getByTestId('HS_ACT3_MODE_VOICE_BTN');
    expect(voiceBtn.className).toContain('ring-2 ring-emerald-400');

    const launchBtn = getByTestId('HS_FIRESIDE_OPEN_VIEWFINDER_BTN');
    expect(launchBtn.textContent).toContain('[ 🎙️ Open Voice Studio & Prompter → ]');

    // Clicking voice tile triggers storage persistence via FiresideModeSwitch
    fireEvent.click(voiceBtn);
    expect(localStorage.getItem('mw_fireside_preferred_mode')).toBe('audio');
    expect(localStorage.getItem('mw_fireside_media_mode')).toBe('audio');

    unmount();
  });

  it('16.3 verifies FiresideStudioClient source code eliminates premature top-level mode switch and wires HS_ACT3_VIEWFINDER_SWITCH_MODE', () => {
    const clientSrc = fs.readFileSync('src/app/studio/fireside/FiresideStudioClient.tsx', 'utf8');

    // 1. Top-level mode switch before carousel removed
    expect(clientSrc).not.toMatch(/{\/\*\s*Storytelling Media Mode Switcher[\s\S]*?<FiresideModeSwitch[\s\S]*?<\/div>\s*<div[^>]*>\s*<SingleCardPromptCarousel/);

    // 2. onMediaModeChange wired to SingleCardPromptCarousel
    expect(clientSrc).toContain('onMediaModeChange={handleModeChange}');

    // 3. In-viewfinder switch pill present for both modes
    expect(clientSrc).toContain('data-testid="HS_ACT3_VIEWFINDER_SWITCH_MODE"');
    expect(clientSrc).toContain('Switch to Voice & Photos');
    expect(clientSrc).toContain('Switch to Video Memo');

    // 4. Preferred storage key imported and used
    expect(clientSrc).toContain('FIRESIDE_PREFERRED_MODE_STORAGE_KEY');
  });
});

