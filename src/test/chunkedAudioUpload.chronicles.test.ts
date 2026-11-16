import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadAudioWithResiliency,
  uploadVideoWithResiliency,
  uploadPhotosSequential,
  type VaultCollectionTarget,
} from '@/lib/media/chunkedAudioUpload';
import {
  assertMemoryWriteIntegrity,
  assertZeroBlobUrls,
  sanitizeMemoryPayloadForStorage,
  IllegalBlobPersistenceError,
} from '@/lib/memoryPersistenceGuard';

const recordedPaths: string[] = [];
let mockTaskSnapshot: any = {
  ref: { fullPath: 'mock/path' },
};

const mockUploadTask = {
  on: vi.fn((event: string, onProgress: any, onError: any, onComplete: any) => {
    if (onComplete) onComplete();
  }),
  snapshot: mockTaskSnapshot,
};

vi.mock('@/lib/firebase/config', () => ({
  storage: {},
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn((_storage: any, path: string) => {
    recordedPaths.push(path);
    return { fullPath: path };
  }),
  uploadBytesResumable: vi.fn(() => mockUploadTask),
  getDownloadURL: vi.fn(async (snapRef: any) => `https://firebasestorage.googleapis.com/${snapRef.fullPath || 'mock'}`),
}));

describe('AUDIT-MW-147 / RFC-MW-156: Dual-Chamber Media Persistence & Storage Partitioning', () => {
  beforeEach(() => {
    recordedPaths.length = 0;
    vi.clearAllMocks();
  });

  describe('1. Chunked Audio Upload Partitioning (uploadAudioWithResiliency)', () => {
    it('defaults to targetCollection: memories and preserves existing users/{uid}/fireside/{draftId}/audio.webm path', async () => {
      const blob = new Blob(['mock audio'], { type: 'audio/webm' });
      const result = await uploadAudioWithResiliency('user_123', 'draft_abc', blob);

      expect(result.storagePath).toBe('users/user_123/fireside/draft_abc/audio.webm');
      expect(recordedPaths).toContain('users/user_123/fireside/draft_abc/audio.webm');
    });

    it('routes to users/{uid}/chronicles/{draftId}/audio.webm when targetCollection is explicitly chronicles', async () => {
      const blob = new Blob(['mock audio'], { type: 'audio/webm' });
      const result = await uploadAudioWithResiliency(
        'user_123',
        'chronicle_log_01',
        blob,
        undefined,
        'chronicles'
      );

      expect(result.storagePath).toBe('users/user_123/chronicles/chronicle_log_01/audio.webm');
      expect(recordedPaths).toContain('users/user_123/chronicles/chronicle_log_01/audio.webm');
    });

    it('supports MediaUploadOptions object parameter with targetCollection: chronicles', async () => {
      const blob = new Blob(['mock audio'], { type: 'audio/webm' });
      const onProgress = vi.fn();
      const result = await uploadAudioWithResiliency('user_123', 'chronicle_log_02', blob, {
        targetCollection: 'chronicles',
        onProgress,
      });

      expect(result.storagePath).toBe('users/user_123/chronicles/chronicle_log_02/audio.webm');
    });
  });

  describe('2. Chunked Video Upload Partitioning (uploadVideoWithResiliency)', () => {
    it('defaults to targetCollection: memories routing to fireside path', async () => {
      const blob = new Blob(['mock video'], { type: 'video/webm' });
      const result = await uploadVideoWithResiliency('user_456', 'scene_take_1', blob);

      expect(result.storagePath).toBe('users/user_456/fireside/scene_take_1/video.webm');
    });

    it('routes video to chronicles chamber when targetCollection is chronicles', async () => {
      const blob = new Blob(['mock video mp4'], { type: 'video/mp4' });
      const result = await uploadVideoWithResiliency(
        'user_456',
        'chronicle_video_01',
        blob,
        undefined,
        'chronicles'
      );

      expect(result.storagePath).toBe('users/user_456/chronicles/chronicle_video_01/video.mp4');
    });
  });

  describe('3. Sequential Photo Upload Partitioning (uploadPhotosSequential)', () => {
    it('routes photos to fireside for memories and chronicles for chronicles', async () => {
      const photo = {
        id: 'photo_01',
        localUri: 'blob:mock-photo',
        caption: 'Heirloom snapshot',
        uploadStatus: 'pending' as const,
      } as any;

      const getBlob = vi.fn(async () => new Blob(['photo bytes'], { type: 'image/jpeg' }));

      // Memories default
      await uploadPhotosSequential('user_789', 'draft_photos', [photo], getBlob, undefined, 'memories');
      expect(recordedPaths).toContain('users/user_789/fireside/draft_photos/photos/photo_01.jpg');

      // Chronicles chamber
      await uploadPhotosSequential('user_789', 'draft_photos_v2', [photo], getBlob, undefined, 'chronicles');
      expect(recordedPaths).toContain('users/user_789/chronicles/draft_photos_v2/photos/photo_01.jpg');
    });
  });

  describe('4. Zero-Blob Persistence Sentinel (AUDIT-MW-147 / RFC-MW-156)', () => {
    it('assertMemoryWriteIntegrity identifies collection context in IllegalBlobPersistenceError', () => {
      const invalidPayload = {
        audioUrl: 'blob:https://dev.memoryweaver.studio/audio-uuid',
      };

      // Default memories chamber
      try {
        assertMemoryWriteIntegrity('doc_mem_1', invalidPayload, 'memories');
        expect.unreachable('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(IllegalBlobPersistenceError);
        expect(err.message).toContain('[ILLEGAL_BLOB_PERSISTENCE]');
        expect(err.targetCollection).toBe('memories');
      }

      // Chronicles chamber
      try {
        assertMemoryWriteIntegrity('doc_chron_1', invalidPayload, 'chronicles');
        expect.unreachable('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(IllegalBlobPersistenceError);
        expect(err.message).toContain('[ILLEGAL_BLOB_PERSISTENCE:chronicles]');
        expect(err.targetCollection).toBe('chronicles');
      }
    });

    it('assertZeroBlobUrls enforces zero blob policy across both chambers', () => {
      expect(() => {
        assertZeroBlobUrls({ videoUrl: 'blob:https://dev.memoryweaver.studio/vid-1' }, 'chronicles');
      }).toThrow(/\[ILLEGAL_BLOB_PERSISTENCE:chronicles\]/);

      expect(() => {
        assertZeroBlobUrls(
          {
            audioUrl: 'https://firebasestorage.googleapis.com/v0/b/project/o/audio.webm',
            videoUrl: null,
          },
          'chronicles'
        );
      }).not.toThrow();
    });

    it('sanitizeMemoryPayloadForStorage strips ephemeral blob: URLs safely for both chambers', () => {
      const dirty = {
        title: 'Oral chronicle reflection',
        audioUrl: 'blob:https://dev.memoryweaver.studio/voice-123',
        videoUrl: 'https://firebasestorage.googleapis.com/valid-video.mp4',
        takes: [
          { id: 'take_1', mediaUrl: 'blob:https://dev.memoryweaver.studio/take-blob' },
          { id: 'take_2', mediaUrl: 'https://firebasestorage.googleapis.com/take-clean.webm' },
        ],
      };

      const clean = sanitizeMemoryPayloadForStorage(dirty, 'chronicles');
      expect(clean.audioUrl).toBeNull();
      expect(clean.videoUrl).toBe('https://firebasestorage.googleapis.com/valid-video.mp4');
      expect(clean.takes[0].mediaUrl).toBeNull();
      expect(clean.takes[1].mediaUrl).toBe('https://firebasestorage.googleapis.com/take-clean.webm');
    });

    it('inspects and blocks nested blob: URLs in imageUrl, photos[], and bonusMemories[] across both chambers (MW-378)', () => {
      // imageUrl
      expect(() => {
        assertZeroBlobUrls({ imageUrl: 'blob:https://dev.memoryweaver.studio/img-1' }, 'memories');
      }).toThrow(/imageUrl/);

      // photos[].url, storageUrl, voiceNoteUrl
      expect(() => {
        assertZeroBlobUrls(
          { photos: [{ id: 'p1', url: 'blob:https://dev.memoryweaver.studio/photo-blob' }] },
          'chronicles'
        );
      }).toThrow(/photos\[0\]\.url/);

      expect(() => {
        assertZeroBlobUrls(
          { photos: [{ id: 'p2', storageUrl: 'blob:https://dev.memoryweaver.studio/storage-blob' }] },
          'memories'
        );
      }).toThrow(/photos\[0\]\.storageUrl/);

      expect(() => {
        assertZeroBlobUrls(
          { photos: [{ id: 'p3', voiceNoteUrl: 'blob:https://dev.memoryweaver.studio/voice-blob' }] },
          'chronicles'
        );
      }).toThrow(/photos\[0\]\.voiceNoteUrl/);

      // bonusMemories[].audioUrl, photoUrl, mediaUrl
      expect(() => {
        assertZeroBlobUrls(
          { bonusMemories: [{ id: 'b1', audioUrl: 'blob:https://dev.memoryweaver.studio/bonus-audio' }] },
          'memories'
        );
      }).toThrow(/bonusMemories\[0\]\.audioUrl/);

      expect(() => {
        assertZeroBlobUrls(
          { bonusMemories: [{ id: 'b2', photoUrl: 'blob:https://dev.memoryweaver.studio/bonus-photo' }] },
          'chronicles'
        );
      }).toThrow(/bonusMemories\[0\]\.photoUrl/);

      expect(() => {
        assertZeroBlobUrls(
          { bonusMemories: [{ id: 'b3', mediaUrl: 'blob:https://dev.memoryweaver.studio/bonus-media' }] },
          'chronicles'
        );
      }).toThrow(/bonusMemories\[0\]\.mediaUrl/);

      // sanitizeMemoryPayloadForStorage strips nested photo & bonus memory blobs cleanly
      const sanitized = sanitizeMemoryPayloadForStorage(
        {
          imageUrl: 'blob:https://dev.memoryweaver.studio/img-1',
          photos: [
            {
              id: 'p1',
              url: 'blob:https://dev.memoryweaver.studio/photo-blob',
              storageUrl: 'https://firebasestorage.googleapis.com/photo.jpg',
              voiceNoteUrl: 'blob:https://dev.memoryweaver.studio/voice-blob',
            },
          ],
          bonusMemories: [
            {
              id: 'b1',
              audioUrl: 'blob:https://dev.memoryweaver.studio/bonus-audio',
              photoUrl: 'https://firebasestorage.googleapis.com/bonus.jpg',
              mediaUrl: 'blob:https://dev.memoryweaver.studio/bonus-media',
            },
          ],
        },
        'chronicles'
      );

      expect(sanitized.imageUrl).toBeNull();
      expect(sanitized.photos[0].url).toBeNull();
      expect(sanitized.photos[0].storageUrl).toBe('https://firebasestorage.googleapis.com/photo.jpg');
      expect(sanitized.photos[0].voiceNoteUrl).toBeNull();
      expect(sanitized.bonusMemories[0].audioUrl).toBeNull();
      expect(sanitized.bonusMemories[0].photoUrl).toBe('https://firebasestorage.googleapis.com/bonus.jpg');
      expect(sanitized.bonusMemories[0].mediaUrl).toBeNull();
    });
  });
});
