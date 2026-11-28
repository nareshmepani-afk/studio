/**
 * MW-435 (Phases 1 & 2) + MW-437 (Option 2B) — Pure camera zoom & optics helpers.
 * Zero React or DOM imports so unit tests run deterministically in milliseconds.
 */

export interface ZoomRange {
  min: number;
  max: number;
  step: number;
}

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const DEFAULT_ZOOM_STEP = 0.1;

/** Approved MW-435 Phase 2 digital zoom span (1.0x – 3.0x, step 0.1). */
export const DIGITAL_ZOOM_RANGE: ZoomRange = {
  min: 1,
  max: 3,
  step: 0.1,
};

const VIRTUAL_CAMERA_PATTERN =
  /nuroum|virtual|obs\b|broadcast|camo|epoccam|mmhmm|manycam|xsplit|snap camera|droidcam|iriun/i;

/** Returns a normalised zoom range, or null when the camera does not expose usable hardware zoom. */
export function resolveZoomRange(capabilities: unknown): ZoomRange | null {
  const zoom = (capabilities as { zoom?: unknown } | null | undefined)?.zoom;
  if (!zoom || typeof zoom !== 'object') return null;

  const { min, max, step } = zoom as { min?: unknown; max?: unknown; step?: unknown };
  const minNum = Number(min);
  const maxNum = Number(max);
  if (!Number.isFinite(minNum) || !Number.isFinite(maxNum) || maxNum <= minNum) return null;

  const stepNum = Number(step);
  return {
    min: minNum,
    max: maxNum,
    step: Number.isFinite(stepNum) && stepNum > 0 ? stepNum : DEFAULT_ZOOM_STEP,
  };
}

/** Clamps a requested zoom value into the camera's supported range. */
export function clampZoom(value: number, range: ZoomRange): number {
  const numeric = Number.isFinite(value) ? value : range.min;
  const clamped = Math.min(range.max, Math.max(range.min, numeric));
  return Math.round(clamped * 1000) / 1000;
}

/** Formats an honest ratio label such as "2.0x" (value relative to the camera's minimum zoom). */
export function formatZoomLabel(value: number, range: ZoomRange | null): string {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 1;
  if (!range || range.min <= 0) return `${safeValue.toFixed(1)}x`;
  return `${(safeValue / range.min).toFixed(1)}x`;
}

/**
 * Pure centre-crop maths for MW-435 Phase 2 recorded digital zoom.
 * Matches CSS `transform: scale(zoom)` with `transform-origin: center center` on the preview `<video>`.
 */
export function computeCentredCropRect(
  sourceWidth: number,
  sourceHeight: number,
  zoom: number
): CropRect {
  const safeWidth = Number.isFinite(sourceWidth) && sourceWidth > 0 ? sourceWidth : 1920;
  const safeHeight = Number.isFinite(sourceHeight) && sourceHeight > 0 ? sourceHeight : 1080;
  const effectiveZoom = clampZoom(zoom, DIGITAL_ZOOM_RANGE);

  const sw = safeWidth / effectiveZoom;
  const sh = safeHeight / effectiveZoom;
  const sx = (safeWidth - sw) / 2;
  const sy = (safeHeight - sh) / 2;

  return { sx, sy, sw, sh };
}

/** Detects upstream virtual cameras (such as NuroumBlur or OBS Virtual Camera) where effects are managed externally. */
export function isVirtualCameraDevice(label?: string | null): boolean {
  if (!label || typeof label !== 'string') return false;
  return VIRTUAL_CAMERA_PATTERN.test(label);
}

/** True when the browser/OS exposes native hardware/NPU `backgroundBlur` on the video track capabilities. */
export function supportsNativeBackgroundBlur(capabilities: unknown): boolean {
  const bgBlur = (capabilities as { backgroundBlur?: unknown } | null | undefined)?.backgroundBlur;
  if (Array.isArray(bgBlur)) {
    return bgBlur.includes(true);
  }
  return bgBlur === true;
}
