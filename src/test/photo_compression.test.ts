import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateScaledDimensions,
  formatFileSize,
  compressHeirloomPhoto,
} from '@/lib/media/photoCompression';

describe('MW-246 / MW-247: Heirloom Photo Compression & Memory Shield Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. Scaled Dimensions Invariants
  // ---------------------------------------------------------------------------
  describe('calculateScaledDimensions', () => {
    it('returns zero dimensions when width or height is non-positive', () => {
      expect(calculateScaledDimensions(0, 1000)).toEqual({ width: 0, height: 0, scale: 1 });
      expect(calculateScaledDimensions(1000, 0)).toEqual({ width: 0, height: 0, scale: 1 });
      expect(calculateScaledDimensions(-50, -50)).toEqual({ width: 0, height: 0, scale: 1 });
    });

    it('preserves exact dimensions when smaller than maxBounding (no upscaling invariant)', () => {
      const result = calculateScaledDimensions(800, 600, 1600);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.scale).toBe(1);
    });

    it('preserves exact boundary dimensions when equal to maxBounding', () => {
      const result = calculateScaledDimensions(1600, 1200, 1600);
      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200);
      expect(result.scale).toBe(1);
    });

    it('proportionally scales landscape images exceeding maxBounding', () => {
      const result = calculateScaledDimensions(3200, 2400, 1600);
      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200);
      expect(result.scale).toBe(0.5);
    });

    it('proportionally scales portrait images exceeding maxBounding', () => {
      const result = calculateScaledDimensions(2000, 4000, 1600);
      expect(result.width).toBe(800);
      expect(result.height).toBe(1600);
      expect(result.scale).toBe(0.4);
    });

    it('scales square images exceeding maxBounding', () => {
      const result = calculateScaledDimensions(2400, 2400, 1600);
      expect(result.width).toBe(1600);
      expect(result.height).toBe(1600);
      expect(result.scale).toBeCloseTo(0.6666, 3);
    });

    it('respects custom maxBounding thresholds', () => {
      const result = calculateScaledDimensions(2000, 1000, 1000);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(500);
      expect(result.scale).toBe(0.5);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. File Size Formatter Invariants
  // ---------------------------------------------------------------------------
  describe('formatFileSize', () => {
    it('formats zero or invalid bytes cleanly as "0 B"', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(-100)).toBe('0 B');
      expect(formatFileSize(NaN)).toBe('0 B');
      expect(formatFileSize(Infinity)).toBe('0 B');
      // @ts-expect-error testing invalid type
      expect(formatFileSize('not a number')).toBe('0 B');
    });

    it('formats raw byte values under 1024 without decimals', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('formats kilobytes with 1 decimal place', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(524288)).toBe('512.0 KB');
    });

    it('formats megabytes with 1 decimal place', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(3670016)).toBe('3.5 MB');
    });

    it('formats gigabytes with 1 decimal place', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. compressHeirloomPhoto & Mobile Safari Shield Invariants
  // ---------------------------------------------------------------------------
  describe('compressHeirloomPhoto & Memory Shield', () => {
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = mockCreateObjectURL.mockReturnValue('blob:http://localhost/test-photo-id');
      URL.revokeObjectURL = mockRevokeObjectURL;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it('executes compression, scales dimensions, and revokes blob URL', async () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'low',
          drawImage: vi.fn(),
          clearRect: vi.fn(),
        }),
        toBlob: vi.fn((cb: (b: Blob | null) => void) => {
          const fakeBlob = new Blob(['compressed-jpeg-bytes'], { type: 'image/jpeg' });
          cb(fakeBlob);
        }),
      };

      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return document.createElement(tagName);
      });

      // Mock Image constructor
      const originalImage = global.Image;
      class MockImage {
        src = '';
        naturalWidth = 3200;
        naturalHeight = 2400;
        width = 3200;
        height = 2400;
        decode = vi.fn().mockResolvedValue(undefined);
      }
      // @ts-expect-error Mocking global Image
      global.Image = MockImage;

      const inputBlob = new Blob(['large-raw-camera-image-bytes-abcdef'], { type: 'image/jpeg' });
      const result = await compressHeirloomPhoto(inputBlob, { maxBounding: 1600, quality: 0.82 });

      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.blob).toBeDefined();

      // Mobile Safari Shield Assertions:
      // 1. URL.createObjectURL was invoked for the incoming file
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      // 2. URL.revokeObjectURL was invoked in finally block
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-photo-id');
      // 3. WebKit 1×1 canvas buffer collapse occurred
      expect(mockCanvas.width).toBe(1);
      expect(mockCanvas.height).toBe(1);

      global.Image = originalImage;
    });

    it('always revokes blob URL and resets canvas buffer even when compression throws', async () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'low',
          drawImage: vi.fn(),
          clearRect: vi.fn(),
        }),
        toBlob: vi.fn((cb: (b: Blob | null) => void) => {
          // Simulate canvas failure returning null
          cb(null);
        }),
      };

      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return document.createElement(tagName);
      });

      const originalImage = global.Image;
      class MockImage {
        src = '';
        naturalWidth = 1000;
        naturalHeight = 1000;
        width = 1000;
        height = 1000;
        decode = vi.fn().mockResolvedValue(undefined);
      }
      // @ts-expect-error Mocking global Image
      global.Image = MockImage;

      const inputBlob = new Blob(['bad-data'], { type: 'image/jpeg' });

      await expect(compressHeirloomPhoto(inputBlob)).rejects.toThrow('Canvas toBlob compression returned null');

      // Guarantee memory cleanup fired despite the thrown error
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-photo-id');
      expect(mockCanvas.width).toBe(1);
      expect(mockCanvas.height).toBe(1);

      global.Image = originalImage;
    });
  });
});
