/**
 * 🎙️ Resilient Chunked Audio & Photo Media Upload Pipeline
 *
 * Milestone: MW-87 (Ticket #248 / MW-247)
 * Governing Rules: Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics
 * Target Route: /studio/fireside
 *
 * Provides resumable media streaming to Firebase Storage with an automatic
 * 3-attempt exponential backoff retry loop (1s -> 2s -> 4s) to defend against
 * mobile network fluctuations, transient Wi-Fi drops, and packet drops.
 */

import { storage } from '@/lib/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { HeirloomPhotoAttachment } from '@/types/fireside';

export interface UploadResult {
  storagePath: string;
  storageUrl: string;
  fileSizeBytes: number;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resumable upload of a WebM voice recording to Firebase Storage with exponential backoff.
 */
export async function uploadAudioWithResiliency(
  userId: string,
  draftId: string,
  audioBlob: Blob,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  if (!storage) {
    throw new Error('Firebase Storage service is uninitialised');
  }

  const storagePath = `users/${userId}/fireside/${draftId}/audio.webm`;
  const storageRef = ref(storage, storagePath);
  const metadata = {
    contentType: audioBlob.type || 'audio/webm',
    customMetadata: {
      draftId,
      userId,
      uploadedAt: new Date().toISOString(),
    },
  };

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const uploadTask = uploadBytesResumable(storageRef, audioBlob, metadata);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0 && onProgress) {
              const percent = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              onProgress(Math.min(100, Math.max(0, percent)));
            }
          },
          (error) => {
            reject(error);
          },
          () => {
            resolve();
          }
        );
      });

      const storageUrl = await getDownloadURL(uploadTask.snapshot.ref);

      return {
        storagePath,
        storageUrl,
        fileSizeBytes: audioBlob.size,
      };
    } catch (err) {
      lastError = err;
      console.warn(
        `[ChunkedAudioUpload] Upload attempt ${attempt}/${MAX_RETRIES} failed for ${storagePath}:`,
        err
      );
      if (attempt < MAX_RETRIES) {
        const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        await waitMs(backoffDelay);
      }
    }
  }

  throw lastError || new Error('Audio upload failed after 3 retry attempts');
}

/**
 * Sequentially streams heirloom photo attachments to Firebase Storage to prevent
 * mobile TCP congestion and memory spikes on constrained network connections.
 */
export async function uploadPhotosSequential(
  userId: string,
  draftId: string,
  photos: HeirloomPhotoAttachment[],
  getPhotoBlob?: (photoId: string) => Promise<Blob | null>,
  onProgress?: (completedCount: number, total: number) => void
): Promise<HeirloomPhotoAttachment[]> {
  if (!storage || photos.length === 0) {
    return photos;
  }

  const updatedPhotos: HeirloomPhotoAttachment[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];

    // Skip if already synchronised
    if (photo.uploadStatus === 'synced' && photo.storageUrl) {
      updatedPhotos.push(photo);
      onProgress?.(i + 1, photos.length);
      continue;
    }

    let blob: Blob | null = null;

    // 1. Try local vault retrieval
    if (getPhotoBlob) {
      try {
        blob = await getPhotoBlob(photo.id);
      } catch (err) {
        console.warn(`[ChunkedAudioUpload] Vault lookup failed for photo ${photo.id}:`, err);
      }
    }

    // 2. Fallback to blob URI resolution if available in browser
    if (!blob && typeof window !== 'undefined' && photo.localUri.startsWith('blob:')) {
      try {
        const res = await fetch(photo.localUri);
        blob = await res.blob();
      } catch (err) {
        console.warn(`[ChunkedAudioUpload] Blob URI resolution failed for photo ${photo.id}:`, err);
      }
    }

    if (!blob) {
      console.warn(`[ChunkedAudioUpload] Missing binary blob data for photo ${photo.id}`);
      updatedPhotos.push({ ...photo, uploadStatus: 'failed' });
      onProgress?.(i + 1, photos.length);
      continue;
    }

    const storagePath = `users/${userId}/fireside/${draftId}/photos/${photo.id}.jpg`;
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        draftId,
        photoId: photo.id,
        caption: photo.caption || '',
      },
    };

    let uploaded = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (error) => reject(error),
            () => resolve()
          );
        });

        const storageUrl = await getDownloadURL(uploadTask.snapshot.ref);
        updatedPhotos.push({
          ...photo,
          storagePath,
          storageUrl,
          uploadStatus: 'synced',
        });
        uploaded = true;
        break;
      } catch (err) {
        console.warn(
          `[ChunkedAudioUpload] Photo attempt ${attempt}/${MAX_RETRIES} failed for ${photo.id}:`,
          err
        );
        if (attempt < MAX_RETRIES) {
          await waitMs(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
        }
      }
    }

    if (!uploaded) {
      updatedPhotos.push({
        ...photo,
        uploadStatus: 'failed',
      });
    }

    onProgress?.(i + 1, photos.length);
  }

  return updatedPhotos;
}

/**
 * Resumable upload of a WebM or MP4 video memo recording to Firebase Storage with exponential backoff.
 */
export async function uploadVideoWithResiliency(
  userId: string,
  draftId: string,
  videoBlob: Blob,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  if (!storage) {
    throw new Error('Firebase Storage service is uninitialised');
  }

  const extension = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
  const storagePath = `users/${userId}/fireside/${draftId}/video.${extension}`;
  const storageRef = ref(storage, storagePath);
  const metadata = {
    contentType: videoBlob.type || 'video/webm',
    customMetadata: {
      draftId,
      userId,
      uploadedAt: new Date().toISOString(),
    },
  };

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const uploadTask = uploadBytesResumable(storageRef, videoBlob, metadata);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0 && onProgress) {
              const percent = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              onProgress(Math.min(100, Math.max(0, percent)));
            }
          },
          (error) => {
            reject(error);
          },
          () => {
            resolve();
          }
        );
      });

      const storageUrl = await getDownloadURL(uploadTask.snapshot.ref);

      return {
        storagePath,
        storageUrl,
        fileSizeBytes: videoBlob.size,
      };
    } catch (err) {
      lastError = err;
      console.warn(
        `[ChunkedAudioUpload] Video upload attempt ${attempt}/${MAX_RETRIES} failed for ${storagePath}:`,
        err
      );
      if (attempt < MAX_RETRIES) {
        const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        await waitMs(backoffDelay);
      }
    }
  }

  throw lastError || new Error('Video upload failed after 3 retry attempts');
}

