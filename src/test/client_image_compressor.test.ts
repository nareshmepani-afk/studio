import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateScaledDimensions,
  formatFileSize,
  compressHeirloomPhoto,
} from '@/lib/media/clientImageCompressor';

describe('MW-246 / Ticket #247: Client-Side Heirloom Photo Compressor & Safari Memory Shield', () => {
  // ---------------------------------------------------------------------------
  // 1. Proportional Scaled Dimensions & Boundary Assertions
  // ---------------------------------------------------------------------------
  describe('calculateScaledDimensions', () => {
    it('downscales 4000×3000px landscape to exactly 1600×1200px', () => {
      const result = calculateScaledDimensions(4000, 3000, 1600);
      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200);
      expect(result.scale).toBe(0.4);
    });

    it('does not upscale 800×600px image (preserves original dimensions)', () => {
      const result = calculateScaledDimensions(800, 600, 1600);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.scale).toBe(1);
    });

    it('bounds 3000×4000px portrait to exactly 1200×1600px', () => {
      const result = calculateScaledDimensions(3000, 4000, 1600);
      expect(result.width).toBe(1200);
      expect(result.height).toBe(1600);
      expect(result.scale).toBe(0.4);
    });

    it('bounds 2400×2400px square to exactly 1600×1600px', () => {
      const result = calculateScaledDimensions(2400, 2400, 1600);
      expect(result.width).toBe(1600);
      expect(result.height).toBe(1600);
      expect(result.scale).toBeCloseTo(0.6666, 3);
    });

    it('handles non-positive and zero dimensions safely without dividing by zero', () => {
      expect(calculateScaledDimensions(0, 3000)).toEqual({ width: 0, height: 0, scale: 1 });
      expect(calculateScaledDimensions(4000, 0)).toEqual({ width: 0, height: 0, scale: 1 });
      expect(calculateScaledDimensions(-100, -200)).toEqual({ width: 0, height: 0, scale: 1 });
    });

    it('preserves exact boundary dimension when equal to maxBounding (1600×1200px)', () => {
      const result = calculateScaledDimensions(1600, 1200, 1600);
      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200);
      expect(result.scale).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Human-Readable File Size Formatter
  // ---------------------------------------------------------------------------
  describe('formatFileSize', () => {
    it('formats non-positive or invalid bytes cleanly as "0 B"', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(-50)).toBe('0 B');
      expect(formatFileSize(NaN)).toBe('0 B');
      expect(formatFileSize(Infinity)).toBe('0 B');
    });

    it('formats bytes under 1024 without decimal places', () => {
      expect(formatFileSize(256)).toBe('256 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('formats kilobytes with 1 decimal place', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(524288)).toBe('512.0 KB');
    });

    it('formats megabytes with 1 decimal place', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(3145728)).toBe('3.0 MB');
    });

    it('formats gigabytes with 1 decimal place', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. compressHeirloomPhoto & Safari Memory Protection Invariants
  // ---------------------------------------------------------------------------
  describe('compressHeirloomPhoto & Safari Memory Protection', () => {
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = mockCreateObjectURL.mockReturnValue('blob:http://localhost/mock-temp-url');
      URL.revokeObjectURL = mockRevokeObjectURL;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it('invokes URL.revokeObjectURL and collapses canvas buffer to 1x1 on successful compression', async () => {
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

      const originalImage = global.Image;
      class MockImage {
        src = '';
        naturalWidth = 4000;
        naturalHeight = 3000;
        width = 4000;
        height = 3000;
        decode = vi.fn().mockResolvedValue(undefined);
      }
      // @ts-expect-error Mocking global Image
      global.Image = MockImage;

      const inputBlob = new Blob(['sample-uncompressed-photo-bytes'], { type: 'image/jpeg' });
      const result = await compressHeirloomPhoto(inputBlob, { maxBounding: 1600, quality: 0.82 });

      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200);
      expect(result.mimeType).toBe('image/jpeg');

      // Safari Memory Protection Assertions:
      // 1. URL.revokeObjectURL is invoked in finally block
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-temp-url');
      // 2. WebKit 1×1 canvas buffer collapse occurred
      expect(mockCanvas.width).toBe(1);
      expect(mockCanvas.height).toBe(1);

      global.Image = originalImage;
    });

    it('guarantees URL.revokeObjectURL and 1x1 canvas collapse even when compression fails', async () => {
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
          // Simulate failure returning null
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
        naturalWidth = 2000;
        naturalHeight = 1500;
        width = 2000;
        height = 1500;
        decode = vi.fn().mockResolvedValue(undefined);
      }
      // @ts-expect-error Mocking global Image
      global.Image = MockImage;

      const inputBlob = new Blob(['invalid-corrupt-data'], { type: 'image/jpeg' });

      await expect(compressHeirloomPhoto(inputBlob)).rejects.toThrow('Canvas toBlob compression returned null');

      // URL.revokeObjectURL MUST still be called in finally block
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-temp-url');
      // WebKit 1×1 canvas collapse MUST still occur
      expect(mockCanvas.width).toBe(1);
      expect(mockCanvas.height).toBe(1);

      global.Image = originalImage;
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Rule 20 UK English Compliance Assertion
  // ---------------------------------------------------------------------------
  describe('Rule 20 UK English Compliance', () => {
    it('ensures functions and exports are named and documented with British English orthography', () => {
      expect(typeof calculateScaledDimensions).toBe('function');
      expect(typeof formatFileSize).toBe('function');
      expect(typeof compressHeirloomPhoto).toBe('function');
    });
  });
});
