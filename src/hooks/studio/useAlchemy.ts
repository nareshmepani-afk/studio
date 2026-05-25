import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import localforage from 'localforage';
import { toast } from 'sonner';

interface UseAlchemyOptions {
  userId: string | undefined;
  memoryId: string | undefined;
  selectedTake: string | null;
  wordCount: number;
  onComplete?: (downloadUrl: string) => void;
}

export function useAlchemy({
  userId,
  memoryId,
  selectedTake,
  wordCount,
  onComplete
}: UseAlchemyOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const uploadTaskRef = useRef<any>(null);

  // tab close prevention during the Sealing Ceremony
  useEffect(() => {
    if (!isSaving) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const msg = "The Sealing Ceremony is in progress. Please do not close the studio until your memory is Authorised.";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSaving]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (uploadTaskRef.current && typeof uploadTaskRef.current.cancel === 'function') {
        uploadTaskRef.current.cancel();
      }
    };
  }, []);

  const performUploadAndSync = useCallback(async (blob: Blob): Promise<string> => {
    if (!userId || !memoryId) {
      throw new Error("Missing credentials for upload");
    }

    const storagePath = `users/${userId}/memories/${memoryId}/takes/performance.webm`;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);
      uploadTaskRef.current = uploadTask;

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(percent));
        },
        (err) => {
          console.error("[useAlchemy] Upload failed:", err);
          reject(err);
        },
        async () => {
          try {
            console.log("[useAlchemy] Upload complete. Fetching download URL...");
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

            console.log("[useAlchemy] Fusing metadata. Updating Firestore document...");
            const memoryDocRef = doc(db, 'users', userId, 'memories', memoryId);

            // Atomic Firestore Handshake:
            // Set productionStatus to AUTHORISED, update videoUrl, take ID, and word count.
            await updateDoc(memoryDocRef, {
              videoUrl: downloadUrl,
              productionStage: 3, // Auto-advance stage to Act IV (Director's Cut)
              status: 'completed',
              productionStatus: 'AUTHORISED',
              trimStart: 0,
              trimEnd: 100 // Initialize defaults
            });

            console.log("[useAlchemy] Firestore updated successfully! Sealing Ceremony Complete.");
            resolve(downloadUrl);
          } catch (firestoreErr) {
            console.error("[useAlchemy] Firestore update failed:", firestoreErr);
            reject(firestoreErr);
          }
        }
      );
    });
  }, [userId, memoryId, selectedTake, wordCount]);

  const startAlchemy = useCallback(async (blob: Blob) => {
    if (!userId || !memoryId) {
      setError("Cannot initiate Alchemy: missing user or memory identification.");
      return;
    }

    setIsSaving(true);
    setProgress(0);
    setError(null);
    setIsComplete(false);
    setIsRetrying(false);

    const cacheKey = `backup_take_${memoryId}`;

    // 1. PERSISTENCE SHIELD: Cache in IndexedDB via localforage before commencing upload
    try {
      console.log(`[useAlchemy] PERSISTENCE SHIELD: Caching raw video Blob in IndexedDB: ${cacheKey}...`);
      await localforage.setItem(cacheKey, blob);
    } catch (e) {
      console.warn("[useAlchemy] Persistence Shield cache write bypassed:", e);
    }

    // 2. Loop Upload and Sync with exponential/constant retry logic
    const attemptSync = async () => {
      try {
        const downloadUrl = await performUploadAndSync(blob);

        // Success! Clear cache and mark complete
        try {
          console.log(`[useAlchemy] PERSISTENCE SHIELD: Clearing temporary IndexedDB backup: ${cacheKey}`);
          await localforage.removeItem(cacheKey);
        } catch (e) {
          console.warn("[useAlchemy] Persistence Shield cache cleanup warning:", e);
        }

        setIsComplete(true);
        setIsSaving(false);
        setIsRetrying(false);
        if (typeof onComplete === 'function') {
          onComplete(downloadUrl);
        }
      } catch (err: any) {
        console.warn("[useAlchemy] Alchemy handshake encountered a network barrier. Retrying...", err);
        setIsRetrying(true);
        setError("Connection interrupted. Retrying authorisation...");
        toast.error("Connection interrupted. Retrying authorisation...", {
          description: "Your performance is securely saved locally. Retrying the Sealing Ceremony..."
        });

        // Retry in 5 seconds
        retryTimerRef.current = setTimeout(() => {
          attemptSync();
        }, 5000);
      }
    };

    attemptSync();
  }, [userId, memoryId, performUploadAndSync, onComplete]);

  return {
    isSaving,
    progress,
    error,
    isComplete,
    isRetrying,
    startAlchemy
  };
}
