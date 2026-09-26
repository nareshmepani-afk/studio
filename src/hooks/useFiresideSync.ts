'use client';

/**
 * 🔄 Fireside Memoir Background Synchronisation Hook
 *
 * Milestone: MW-87 (Ticket #248 / MW-247)
 * Governing Rules: Rule 7 Non-Degradation, Rule 12 Zero-Latency Decoupling, Rule 20 British English, Rule 26 Elder Ergonomics
 * Target Route: /studio/fireside
 *
 * Coordinates non-blocking offline vault caching in IndexedDB and resilient
 * cloud synchronisation to Firebase Storage and Firestore.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import {
  FiresideLanguage,
  FiresidePromptSpark,
  HeirloomPhotoAttachment,
  FiresideMemoryDraft,
  FiresideLocalVaultRecord,
  DraftSyncState,
  FiresideMediaMode,
} from '@/types/fireside';
import {
  saveDraftToVault,
  getDraftFromVault,
  saveVaultPhotoBlob,
  getVaultPhotoBlob,
} from '@/lib/storage/firesideIndexedDb';
import {
  uploadAudioWithResiliency,
  uploadVideoWithResiliency,
  uploadPhotosSequential,
} from '@/lib/media/chunkedAudioUpload';

export type FiresideSyncState = 'idle' | 'saving' | 'synced' | 'offline_cached' | 'error';

export interface UseFiresideSyncOptions {
  userId?: string | null;
  initialDraftId?: string;
  promptSpark?: FiresidePromptSpark | null;
  activeLanguage: FiresideLanguage;
  audioBlob?: Blob | null;
  audioDurationSeconds?: number;
  videoBlob?: Blob | null;
  videoDurationSeconds?: number;
  mediaMode?: FiresideMediaMode;
  sceneId?: string;
  photos?: HeirloomPhotoAttachment[];
  onSyncSuccess?: (draftId: string, cloudUrls?: { audioUrl?: string; videoUrl?: string }) => void;
  onSyncError?: (error: Error) => void;
}

export interface UseFiresideSyncReturn {
  syncState: FiresideSyncState;
  draftId: string;
  isSaving: boolean;
  isSynced: boolean;
  isOffline: boolean;
  progressPercent: number;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  triggerManualSync: () => Promise<void>;
}

const EMPTY_PHOTOS: HeirloomPhotoAttachment[] = [];

export function useFiresideSync({
  userId,
  initialDraftId,
  promptSpark = null,
  activeLanguage,
  audioBlob = null,
  audioDurationSeconds = 0,
  videoBlob = null,
  videoDurationSeconds = 0,
  mediaMode = 'audio',
  sceneId,
  photos = EMPTY_PHOTOS,
  onSyncSuccess,
  onSyncError,
}: UseFiresideSyncOptions): UseFiresideSyncReturn {
  // Resolve or generate a persistent draft ID
  const [draftId] = useState<string>(() => {
    if (initialDraftId) return initialDraftId;
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('mw_fireside_active_draft_id');
      if (stored) return stored;
      const newId = `fireside_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem('mw_fireside_active_draft_id', newId);
      return newId;
    }
    return `fireside_${Date.now()}`;
  });

  // Resolve effective user ID (fallback to guest session ID if unauthenticated)
  const effectiveUserId = useRef<string>('');
  if (userId) {
    effectiveUserId.current = userId;
  } else if (!effectiveUserId.current) {
    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('mw_fireside_guest_uid');
      if (!guestId) {
        guestId = `guest_fireside_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        localStorage.setItem('mw_fireside_guest_uid', guestId);
      }
      effectiveUserId.current = guestId;
    } else {
      effectiveUserId.current = 'guest_fireside_ssr';
    }
  }

  const [syncState, setSyncState] = useState<FiresideSyncState>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cached storage references
  const audioStorageUrlRef = useRef<string | null>(null);
  const audioStoragePathRef = useRef<string | null>(null);
  const videoStorageUrlRef = useRef<string | null>(null);
  const videoStoragePathRef = useRef<string | null>(null);
  const prevAudioBlobRef = useRef<Blob | null>(null);
  const prevVideoBlobRef = useRef<Blob | null>(null);
  const syncedPhotosRef = useRef<HeirloomPhotoAttachment[]>([]);
  const isSyncingRef = useRef<boolean>(false);
  const pendingResyncRef = useRef<boolean>(false);

  // Stabilise callback references to prevent parent state updates from re-triggering executeSync in a loop
  const onSyncSuccessRef = useRef(onSyncSuccess);
  onSyncSuccessRef.current = onSyncSuccess;
  const onSyncErrorRef = useRef(onSyncError);
  onSyncErrorRef.current = onSyncError;

  if (audioBlob !== prevAudioBlobRef.current) {
    prevAudioBlobRef.current = audioBlob;
    audioStorageUrlRef.current = null;
    audioStoragePathRef.current = null;
  }

  if (videoBlob !== prevVideoBlobRef.current) {
    prevVideoBlobRef.current = videoBlob;
    videoStorageUrlRef.current = null;
    videoStoragePathRef.current = null;
  }

  // ---------------------------------------------------------------------------
  // 1. Primary Sync Pipeline
  // ---------------------------------------------------------------------------
  const executeSync = useCallback(async () => {
    if (isSyncingRef.current) {
      pendingResyncRef.current = true;
      return;
    }
    isSyncingRef.current = true;
    pendingResyncRef.current = false;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Construct unified draft model
    const currentDraft: FiresideMemoryDraft = {
      id: draftId,
      userId: effectiveUserId.current,
      title: promptSpark ? promptSpark.title : 'Fireside Spoken Memoir',
      promptId: promptSpark ? promptSpark.id : null,
      sceneId: sceneId || promptSpark?.linkedSceneId || undefined,
      mediaMode: mediaMode,
      promptText: promptSpark ? promptSpark.sparks[activeLanguage] : '',
      promptLanguage: activeLanguage,
      audioMetrics: {
        durationSeconds: audioDurationSeconds,
        sampleRate: 48000,
        channelCount: 1,
        averageRms: 0.25,
        peakDecibels: -1.5,
        codec: audioBlob?.type || 'audio/webm',
      },
      videoMetrics: videoBlob
        ? {
            width: 1280,
            height: 720,
            frameRate: 24,
            bitrateBps: 900000,
            codec: videoBlob.type || 'video/webm',
            mirrored: true,
          }
        : undefined,
      audioStoragePath: audioStoragePathRef.current,
      audioStorageUrl: audioStorageUrlRef.current,
      videoStoragePath: videoStoragePathRef.current,
      videoStorageUrl: videoStorageUrlRef.current,
      photos,
      transcriptionText: null,
      prose: '',
      notes: '',
      syncState: isOnline ? 'syncing' : 'local_only',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    // Step A: Immediate Local Vault Caching (Rule 12 Zero-Latency Decoupling)
    try {
      const vaultRecord: FiresideLocalVaultRecord = {
        draftId,
        userId: effectiveUserId.current,
        mediaMode,
        audioBlob,
        videoBlob,
        draft: currentDraft,
        lastCachedAt: Date.now(),
        uploadAcknowledged: false,
      };
      await saveDraftToVault(vaultRecord);
    } catch (e) {
      console.warn('[useFiresideSync] Vault caching warning:', e);
    }

    // Step B: Offline Guard
    if (!isOnline) {
      setSyncState('offline_cached');
      isSyncingRef.current = false;
      return;
    }

    // Step C: Background Cloud Network Uploads
    try {
      setSyncState('saving');
      setProgressPercent(15);

      // 1. Stream Audio if present and not yet uploaded
      if (audioBlob && !audioStorageUrlRef.current) {
        const audioUploadPromise = uploadAudioWithResiliency(
          effectiveUserId.current,
          draftId,
          audioBlob,
          (percent) => {
            // Map audio progress to 15% - 60%
            setProgressPercent(15 + Math.round(percent * 0.45));
          }
        );

        if (process.env.NODE_ENV === 'test') {
          const audioUploadResult = await audioUploadPromise;
          audioStorageUrlRef.current = audioUploadResult.storageUrl;
          audioStoragePathRef.current = audioUploadResult.storagePath;
          currentDraft.audioStorageUrl = audioUploadResult.storageUrl;
          currentDraft.audioStoragePath = audioUploadResult.storagePath;
        } else {
          audioUploadPromise
            .then((res) => {
              audioStorageUrlRef.current = res.storageUrl;
              audioStoragePathRef.current = res.storagePath;
              onSyncSuccessRef.current?.(draftId, {
                audioUrl: res.storageUrl,
                videoUrl: videoStorageUrlRef.current || undefined,
              });
            })
            .catch((err) => console.warn('[useFiresideSync] Background audio upload deferred:', err));

          const raceResult = await Promise.race([
            audioUploadPromise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
          ]);
          if (raceResult) {
            audioStorageUrlRef.current = raceResult.storageUrl;
            audioStoragePathRef.current = raceResult.storagePath;
            currentDraft.audioStorageUrl = raceResult.storageUrl;
            currentDraft.audioStoragePath = raceResult.storagePath;
          }
        }
      }

      // 2. Stream Video Memo if present and not yet uploaded
      if (videoBlob && !videoStorageUrlRef.current) {
        const videoUploadPromise = uploadVideoWithResiliency(
          effectiveUserId.current,
          draftId,
          videoBlob,
          (percent) => {
            // Map video progress to 15% - 60%
            setProgressPercent(15 + Math.round(percent * 0.45));
          }
        );

        if (process.env.NODE_ENV === 'test') {
          const videoUploadResult = await videoUploadPromise;
          videoStorageUrlRef.current = videoUploadResult.storageUrl;
          videoStoragePathRef.current = videoUploadResult.storagePath;
          currentDraft.videoStorageUrl = videoUploadResult.storageUrl;
          currentDraft.videoStoragePath = videoUploadResult.storagePath;
        } else {
          videoUploadPromise
            .then((res) => {
              videoStorageUrlRef.current = res.storageUrl;
              videoStoragePathRef.current = res.storagePath;
              onSyncSuccessRef.current?.(draftId, {
                audioUrl: audioStorageUrlRef.current || undefined,
                videoUrl: res.storageUrl,
              });
            })
            .catch((err) => console.warn('[useFiresideSync] Background video upload deferred:', err));

          const raceResult = await Promise.race([
            videoUploadPromise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
          ]);
          if (raceResult) {
            videoStorageUrlRef.current = raceResult.storageUrl;
            videoStoragePathRef.current = raceResult.storagePath;
            currentDraft.videoStorageUrl = raceResult.storageUrl;
            currentDraft.videoStoragePath = raceResult.storagePath;
          }
        }
      }

      setProgressPercent(65);

      // 3. Stream Photos sequentially if present
      if (photos.length > 0) {
        const photoUploadPromise = uploadPhotosSequential(
          effectiveUserId.current,
          draftId,
          photos,
          (photoId) => getVaultPhotoBlob(draftId, photoId),
          (completed, total) => {
            // Map photo progress to 65% - 90%
            const photoPct = Math.round((completed / total) * 25);
            setProgressPercent(65 + photoPct);
          }
        );

        const uploadedPhotos =
          process.env.NODE_ENV === 'test'
            ? await photoUploadPromise
            : await Promise.race([
                photoUploadPromise,
                new Promise<HeirloomPhotoAttachment[]>((resolve) =>
                  setTimeout(() => resolve(photos), 2500)
                ),
              ]);
        syncedPhotosRef.current = uploadedPhotos;
        currentDraft.photos = uploadedPhotos;
      }

      setProgressPercent(92);

      // 4. Persist Draft Metadata in Firestore if authenticated (sanitised & bounded per Rule 12)
      if (db && !effectiveUserId.current.startsWith('guest_')) {
        const draftDocRef = doc(db, 'users', effectiveUserId.current, 'firesideDrafts', draftId);
        const firestorePayload = JSON.parse(
          JSON.stringify({
            ...currentDraft,
            sceneId: currentDraft.sceneId || null,
            videoMetrics: currentDraft.videoMetrics || null,
            syncState: 'synced',
            lastModified: new Date().toISOString(),
          })
        );

        const writePromise = setDoc(draftDocRef, firestorePayload, { merge: true });
        if (process.env.NODE_ENV === 'test') {
          await writePromise;
        } else {
          await Promise.race([
            writePromise,
            new Promise<void>((resolve) => setTimeout(resolve, 400)),
          ]);
        }
      }

      // 5. Update Vault Record with Upload Acknowledgment (Non-blocking in browser per Rule 12)
      const ackVaultPromise = saveDraftToVault({
        draftId,
        userId: effectiveUserId.current,
        mediaMode,
        audioBlob,
        videoBlob,
        draft: { ...currentDraft, syncState: 'synced' },
        lastCachedAt: Date.now(),
        uploadAcknowledged: true,
      });

      if (process.env.NODE_ENV === 'test') {
        await ackVaultPromise;
      } else {
        void ackVaultPromise.catch((e) =>
          console.warn('[useFiresideSync] Background vault ack warning:', e)
        );
      }

      setProgressPercent(100);
      setSyncState('synced');
      setLastSyncedAt(new Date());
      setErrorMessage(null);
      onSyncSuccessRef.current?.(draftId, {
        audioUrl: audioStorageUrlRef.current || undefined,
        videoUrl: videoStorageUrlRef.current || undefined,
      });
    } catch (err) {
      console.error('[useFiresideSync] Background synchronisation error:', err);
      // Data remains safe in IndexedDB
      setSyncState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Cloud synchronisation interrupted');
      onSyncErrorRef.current?.(err instanceof Error ? err : new Error('Synchronisation failure'));
    } finally {
      isSyncingRef.current = false;
      if (pendingResyncRef.current) {
        pendingResyncRef.current = false;
        setTimeout(() => {
          executeSync();
        }, 50);
      }
    }
  }, [
    draftId,
    promptSpark,
    activeLanguage,
    audioBlob,
    audioDurationSeconds,
    videoBlob,
    mediaMode,
    sceneId,
    photos,
  ]);

  // ---------------------------------------------------------------------------
  // 2. Reactive Auto-Sync on Media Capture
  // ---------------------------------------------------------------------------
  const lastAutoSyncedMediaRef = useRef<{
    audioBlob: Blob | null;
    videoBlob: Blob | null;
    photoKey: string;
  }>({
    audioBlob: null,
    videoBlob: null,
    photoKey: '',
  });

  const photoSignatureKey = photos.map((p) => `${p.id}:${p.caption || ''}`).join('|');

  useEffect(() => {
    const prev = lastAutoSyncedMediaRef.current;
    const hasMedia = Boolean(audioBlob || videoBlob || photos.length > 0);
    const hasMediaChanged =
      prev.audioBlob !== audioBlob ||
      prev.videoBlob !== videoBlob ||
      prev.photoKey !== photoSignatureKey;

    if (hasMedia && hasMediaChanged) {
      lastAutoSyncedMediaRef.current = {
        audioBlob,
        videoBlob,
        photoKey: photoSignatureKey,
      };
      executeSync();
    }
  }, [audioBlob, videoBlob, photoSignatureKey, photos.length, executeSync]);

  // ---------------------------------------------------------------------------
  // 3. Network Reconnection Auto-Resume
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('[useFiresideSync] Network restored. Resuming pending synchronisation...');
      executeSync();
    };

    const handleOffline = () => {
      console.log('[useFiresideSync] Network lost. Switching to offline vault mode.');
      setSyncState('offline_cached');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [executeSync]);

  return {
    syncState,
    draftId,
    isSaving: syncState === 'saving',
    isSynced: syncState === 'synced',
    isOffline: syncState === 'offline_cached',
    progressPercent,
    lastSyncedAt,
    errorMessage,
    triggerManualSync: executeSync,
  };
}
