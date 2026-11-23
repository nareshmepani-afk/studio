import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { uploadFileInChunks } from '@/utils/storage/resumableUpload';

const mockGetSession = vi.fn();
const mockCreateResumableUpload = vi.fn(async () => ['https://storage.googleapis.com/upload/session_123']);
const mockSetCorsConfiguration = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminStorage: {
    bucket: vi.fn(() => ({
      setCorsConfiguration: mockSetCorsConfiguration,
      file: vi.fn(() => ({
        createResumableUpload: mockCreateResumableUpload,
      })),
    })),
  },
}));

describe('RC1 Upload Resiliency & Choice-A FFmpeg Stitch Shield', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploadFileInChunks omits forbidden Content-Length header and aborts on 404/410 session expiry', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 410 })
    );

    const blob = new Blob([new Uint8Array(1024)], { type: 'video/webm' });
    await expect(uploadFileInChunks(blob, 'https://storage.googleapis.com/upload/expired', 512)).rejects.toThrow(
      /expired/i
    );

    const init = fetchSpy.mock.calls[0]?.[1];
    const headers = (init?.headers || {}) as Record<string, string>;
    expect(headers['Content-Length']).toBeUndefined();
    expect(headers['Content-Range']).toBe('bytes 0-511/1024');
    fetchSpy.mockRestore();
  });

  it('/api/storage/session enforces auth (401), strict user prefix (403), and never mutates bucket CORS', async () => {
    const { POST } = await import('@/app/api/storage/session/route');

    // 1. Unauthenticated -> 401
    mockGetSession.mockResolvedValueOnce(null);
    const res401 = await POST(
      new Request('https://dev.memoryweaver.studio/api/storage/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: 'users/other/memories/m1/seg.webm', contentType: 'video/webm' }),
      })
    );
    expect(res401.status).toBe(401);

    // 2. Cross-user path or traversal -> 403
    mockGetSession.mockResolvedValueOnce({ uid: 'uid_owner' });
    const res403 = await POST(
      new Request('https://dev.memoryweaver.studio/api/storage/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: 'users/uid_other/memories/m1/seg.webm', contentType: 'video/webm' }),
      })
    );
    expect(res403.status).toBe(403);

    // 3. Valid own path -> 200 with origin scoped and zero runtime CORS overwrite
    mockGetSession.mockResolvedValueOnce({ uid: 'uid_owner' });
    const res200 = await POST(
      new Request('https://dev.memoryweaver.studio/api/storage/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://dev.memoryweaver.studio' },
        body: JSON.stringify({ filePath: 'users/uid_owner/memories/m1/seg.webm', contentType: 'video/webm' }),
      })
    );
    expect(res200.status).toBe(200);
    expect(mockSetCorsConfiguration).not.toHaveBeenCalled();
    expect(mockCreateResumableUpload).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'https://dev.memoryweaver.studio' })
    );
  });

  it('functions/src/index.ts upgrades stitchPerformanceReel to Choice-A 4GB/300s MP4 FFmpeg with download tokens', () => {
    const fnSrc = fs.readFileSync(path.join(process.cwd(), 'functions/src/index.ts'), 'utf8');
    expect(fnSrc).toContain('memory: "4GB"');
    expect(fnSrc).toContain('timeoutSeconds: 300');
    expect(fnSrc).toContain('ffmpeg-static');
    expect(fnSrc).toContain('+faststart');
    expect(fnSrc).toContain('firebaseStorageDownloadTokens');
    expect(fnSrc).toContain('existingStoragePath outside authorised memory boundary');
    expect(fnSrc).not.toContain('Transcoder API mock concat complete');
  });
});
