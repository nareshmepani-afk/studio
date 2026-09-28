/**
 * 🎧 Sensory Anchor Detection & Dominant Trio Lockstep Utility
 *
 * Milestone: MW-88-T8 (Sequence #298)
 * Canonical barrel and alias export ensuring 100% deterministic parity
 * between Desktop Studio (`MemoryForm.tsx`) and Fireside Studio (`SingleCardPromptCarousel.tsx`).
 */

import {
  detectAnchors,
  filterDominantSensoryAnchors,
  type DetectedAnchor,
} from '@/hooks/studio/useDirectorInk';

export { detectAnchors, filterDominantSensoryAnchors, type DetectedAnchor };

/**
 * Canonical sensory anchor detector alias used across Desktop and Fireside surfaces.
 */
export function detectSensoryAnchors(text: string): DetectedAnchor[] {
  return detectAnchors(text);
}
