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
} from '@/types/fireside';
import {
  saveDraftToVault,
  getDraftFromVault,
  saveVaultPhotoBlob,
  getVaultPhotoBlob,
} from '@/lib/storage/firesideIndexedDb';
import {
  uploadAudioWithResiliency,
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
  photos?: HeirloomPhotoAttachment[];
  onSyncSuccess?: (draftId: string) => void;
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

export function useFiresideSync({
  userId,
  initialDraftId,
  promptSpark = null,
  activeLanguage,
  audioBlob = null,
  audioDurationSeconds = 0,
  photos = [],
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
  const syncedPhotosRef = useRef<HeirloomPhotoAttachment[]>([]);
  const isSyncingRef = useRef<boolean>(false);

  // ---------------------------------------------------------------------------
  // 1. Primary Sync Pipeline
  // ---------------------------------------------------------------------------
  const executeSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Construct unified draft model
    const currentDraft: FiresideMemoryDraft = {
      id: draftId,
      userId: effectiveUserId.current,
      title: promptSpark ? promptSpark.title : 'Fireside Spoken Memoir',
      promptId: promptSpark ? promptSpark.id : null,
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
      audioStoragePath: audioStoragePathRef.current,
      audioStorageUrl: audioStorageUrlRef.current,
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
        audioBlob,
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
    const syncStartTime = Date.now();
    try {
      setSyncState('saving');
      setProgressPercent(10);

      // 1. Stream Audio if present and not yet uploaded
      if (audioBlob && !audioStorageUrlRef.current) {
        const audioUploadResult = await uploadAudioWithResiliency(
          effectiveUserId.current,
          draftId,
          audioBlob,
          (percent) => {
            // Map audio progress to 10% - 60%
            setProgressPercent(10 + Math.round(percent * 0.5));
          }
        );
        audioStorageUrlRef.current = audioUploadResult.storageUrl;
        audioStoragePathRef.current = audioUploadResult.storagePath;
        currentDraft.audioStorageUrl = audioUploadResult.storageUrl;
        currentDraft.audioStoragePath = audioUploadResult.storagePath;
      }

      setProgressPercent(65);

      // 2. Stream Photos sequentially if present
      if (photos.length > 0) {
        const uploadedPhotos = await uploadPhotosSequential(
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
        syncedPhotosRef.current = uploadedPhotos;
        currentDraft.photos = uploadedPhotos;
      }

      setProgressPercent(92);

      // 3. Persist Draft Metadata in Firestore if authenticated
      if (db && !effectiveUserId.current.startsWith('guest_')) {
        const draftDocRef = doc(db, 'users', effectiveUserId.current, 'firesideDrafts', draftId);
        await setDoc(
          draftDocRef,
          {
            ...currentDraft,
            syncState: 'synced',
            lastModified: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // 4. Update Vault Record with Upload Acknowledgment
      await saveDraftToVault({
        draftId,
        userId: effectiveUserId.current,
        audioBlob,
        draft: { ...currentDraft, syncState: 'synced' },
        lastCachedAt: Date.now(),
        uploadAcknowledged: true,
      });

      // Ensure minimum readable threshold (600ms) in browser runtimes so narrators can perceive the reassuring transition
      if (process.env.NODE_ENV !== 'test') {
        const elapsed = Date.now() - syncStartTime;
        if (elapsed < 600) {
          await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
        }
      }

      setProgressPercent(100);
      setSyncState('synced');
      setLastSyncedAt(new Date());
      setErrorMessage(null);
      onSyncSuccess?.(draftId);
    } catch (err) {
      console.error('[useFiresideSync] Background synchronisation error:', err);
      // Data remains safe in IndexedDB
      setSyncState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Cloud synchronisation interrupted');
      onSyncError?.(err instanceof Error ? err : new Error('Synchronisation failure'));
    } finally {
      isSyncingRef.current = false;
    }
  }, [
    draftId,
    promptSpark,
    activeLanguage,
    audioBlob,
    audioDurationSeconds,
    photos,
    onSyncSuccess,
    onSyncError,
  ]);

  // ---------------------------------------------------------------------------
  // 2. Reactive Auto-Sync on Media Capture
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Trigger sync when audio recording finishes or photo attachments change
    if (audioBlob || photos.length > 0) {
      executeSync();
    }
  }, [audioBlob, photos.length, executeSync]);

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
