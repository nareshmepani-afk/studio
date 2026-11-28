/**
 * MW-435 Phase 1 — Pure camera zoom helpers (zero React / DOM imports).
 *
 * Chrome only exposes `zoom` in `track.getCapabilities()` for PTZ-capable cameras once the page has
 * requested camera pan/tilt/zoom permission. These helpers normalise that capability into a safe range,
 * clamp slider values, and format an honest ratio label (some UVC drivers report 100–500 rather than 1–5).
 */

export interface ZoomRange {
  min: number;
  max: number;
  step: number;
}

const DEFAULT_ZOOM_STEP = 0.1;

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
  return Math.min(range.max, Math.max(range.min, numeric));
}

/** Formats an honest ratio label such as "2.0x" (value relative to the camera's minimum zoom). */
export function formatZoomLabel(value: number, range: ZoomRange | null): string {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 1;
  if (!range || range.min <= 0) return `${safeValue.toFixed(1)}x`;
  return `${(safeValue / range.min).toFixed(1)}x`;
}
