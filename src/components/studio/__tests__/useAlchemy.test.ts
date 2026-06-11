import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAlchemy } from '@/hooks/studio/useAlchemy';
import localforage from 'localforage';
import { uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateDoc } from 'firebase/firestore';

// Mock localforage
vi.mock('localforage', () => ({
  default: {
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null)
  }
}));

// Mock firebase/storage
vi.mock('firebase/storage', () => {
  const uploadTaskMock = {
    on: vi.fn((event, progressCb, errorCb, successCb) => {
      // Simulate progress ticks
      progressCb({ bytesTransferred: 50, totalBytes: 100 });
      progressCb({ bytesTransferred: 100, totalBytes: 100 });
      // Call success callback
      successCb();
    }),
    snapshot: {
      ref: {}
    }
  };

  return {
    ref: vi.fn(() => ({})),
    uploadBytesResumable: vi.fn(() => uploadTaskMock),
    getDownloadURL: vi.fn().mockResolvedValue('https://firebase.storage/video.webm')
  };
});

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn().mockResolvedValue(undefined)
}));

// Mock firebase config
vi.mock('@/lib/firebase', () => ({
  storage: {},
  db: {}
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user-123' }, loading: false })
}));

describe('useAlchemy Persistence Shield & Handshake', () => {
  const onCompleteMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Initializes with default idle state', () => {
    const { result } = renderHook(() =>
      useAlchemy({
        userId: 'user-123',
        memoryId: 'mem-456',
        selectedTake: 'take-789',
        wordCount: 120,
        onComplete: onCompleteMock
      })
    );

    expect(result.current.isSaving).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.isRetrying).toBe(false);
  });

  it('Runs the full Alchemy Sealing Handshake on startAlchemy', async () => {
    const mockBlob = new Blob(['video content'], { type: 'video/webm' });
    const { result } = renderHook(() =>
      useAlchemy({
        userId: 'user-123',
        memoryId: 'mem-456',
        selectedTake: 'take-789',
        wordCount: 120,
        onComplete: onCompleteMock
      })
    );

    await act(async () => {
      await result.current.startAlchemy(mockBlob);
    });

    // 1. Persistence Shield: should write to localforage first
    expect(localforage.setItem).toHaveBeenCalledWith('backup_take_mem-456', expect.objectContaining({
      blob: mockBlob,
      memoryId: 'mem-456'
    }));

    // 2. Resumable storage upload: should trigger uploadBytesResumable
    expect(uploadBytesResumable).toHaveBeenCalledOnce();

    // 3. Download URL fetched
    expect(getDownloadURL).toHaveBeenCalledOnce();

    // 4. Firestore update: Set productionStatus to AUTHORISED, completed state
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        videoUrl: 'https://firebase.storage/video.webm',
        productionStatus: 'AUTHORISED',
        status: 'completed',
        productionStage: 3
      })
    );

    // 5. Persistence Shield cleanup: remove localforage backup
    expect(localforage.removeItem).toHaveBeenCalledWith('backup_take_mem-456');

    // 6. Complete state is true
    expect(result.current.isComplete).toBe(true);
    expect(result.current.isSaving).toBe(false);
    expect(onCompleteMock).toHaveBeenCalledWith('https://firebase.storage/video.webm');
  });
});
