/**
 * 📷 Client-Side Photo Compression Utility for Heirloom Album Prints
 *
 * Milestone: MW-87 (Ticket #247 / MW-246)
 * Governing Rules: Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics
 * Target Route: /studio/fireside
 *
 * Features:
 * - Proportional bounding downsampling (default max 1600px, no upscaling)
 * - Controlled JPEG compression (default 0.82 quality) for optimal clarity vs payload
 * - Mobile Safari Shield: Image.decode() + try/finally URL.revokeObjectURL()
 * - WebKit GPU texture release: 1×1 canvas buffer collapse
 * - Human-readable file size formatting
 */

export interface ScaledDimensions {
  width: number;
  height: number;
  scale: number;
}

export interface PhotoCompressionOptions {
  maxBounding?: number; // Maximum dimension (width or height) in pixels
  quality?: number; // JPEG compression quality between 0.0 and 1.0
}

export interface CompressedPhotoResult {
  blob: Blob;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: number;
  mimeType: string;
}

/**
 * Calculates scaled dimensions ensuring images never exceed maxBounding
 * and are never upscaled beyond their original natural resolution.
 */
export function calculateScaledDimensions(
  origWidth: number,
  origHeight: number,
  maxBounding: number = 1600
): ScaledDimensions {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: 0, height: 0, scale: 1 };
  }

  if (origWidth <= maxBounding && origHeight <= maxBounding) {
    return {
      width: Math.round(origWidth),
      height: Math.round(origHeight),
      scale: 1,
    };
  }

  const scale = Math.min(maxBounding / origWidth, maxBounding / origHeight);
  return {
    width: Math.max(1, Math.round(origWidth * scale)),
    height: Math.max(1, Math.round(origHeight * scale)),
    scale,
  };
}

/**
 * Formats a raw byte count into a clean, human-readable British English string.
 * e.g. 524288 -> "512.0 KB", 3145728 -> "3.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || Number.isNaN(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);

  // Return integer without decimals if bytes < 1024, else 1 decimal place
  return i === 0 ? `${Math.round(value)} B` : `${value.toFixed(1)} ${units[i]}`;
}

/**
 * Compresses and normalises a vintage family album photo in the browser canvas
 * with defensive memory cleanup for Mobile Safari and low-spec tablets.
 */
export async function compressHeirloomPhoto(
  file: File | Blob,
  options?: PhotoCompressionOptions
): Promise<CompressedPhotoResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('compressHeirloomPhoto must be executed in a client browser environment');
  }

  const maxBounding = options?.maxBounding ?? 1600;
  const quality = options?.quality ?? 0.82;
  const originalSizeBytes = file.size || 0;

  const objectUrl = URL.createObjectURL(file);
  let canvas: HTMLCanvasElement | null = null;

  try {
    const img = new Image();
    img.src = objectUrl;

    // Use asynchronous decode where supported to prevent main thread frame hitching
    if (typeof img.decode === 'function') {
      await img.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for compression'));
      });
    }

    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    if (!naturalWidth || !naturalHeight) {
      throw new Error('Invalid image dimensions detected');
    }

    const { width, height } = calculateScaledDimensions(naturalWidth, naturalHeight, maxBounding);

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to initialise 2D canvas context for photo compression');
    }

    // High-fidelity image smoothing for preserving delicate vintage photograph grain
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const compressedBlob: Blob = await new Promise((resolve, reject) => {
      canvas!.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob compression returned null'));
          }
        },
        'image/jpeg',
        quality
      );
    });

    const compressedSizeBytes = compressedBlob.size;
    const compressionRatio = originalSizeBytes > 0 ? compressedSizeBytes / originalSizeBytes : 1;

    return {
      blob: compressedBlob,
      width,
      height,
      originalSizeBytes,
      compressedSizeBytes,
      compressionRatio,
      mimeType: 'image/jpeg',
    };
  } finally {
    // Immediate memory release: revoke blob URL
    URL.revokeObjectURL(objectUrl);

    // Mobile Safari Shield: Force WebKit GPU texture buffer deallocation
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 1, 1);
      }
      canvas = null;
    }
  }
}
