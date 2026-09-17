/**
 * 🏛️ Milestone Truth Resolver
 *
 * Core Platform Thesis: "Two Lenses, One Living Story"
 * Authoritative Grounding: C:\Users\home\studio\.agents\ROUTING_MATRIX.md
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Universal Non-Degradation, Rule 20 British English Orthography)
 *
 * Provides deterministic, truthful verification of act completion milestones
 * for both Desktop Soundstage (/studio) and Mobile Fireside Studio (/studio/fireside).
 * Decouples visual progress indication from speculative tab selection.
 */

import type { Memory } from '@/types';

export interface MemoryMilestones {
  /** Act I: Inciting Memory — User has drafted script prose or answered prompt */
  hasScript: boolean;
  /** Act II: The Weave — Narrative prose polished, hook selected, or story synthesized */
  hasWeave: boolean;
  /** Act III: Capture — At least one authentic vocal or video take recorded */
  hasRecordedMedia: boolean;
  /** Act IV: The Cut — Media recorded AND director's trimming/mastering pass completed */
  hasCompletedCut: boolean;
  /** Act V: Premiere — Released to public cinema screening room */
  isPublished: boolean;
}

/**
 * Resolves truthful milestone statuses from a Memory object.
 * Guaranteed safe for null/undefined/empty input objects.
 */
export function resolveMemoryMilestones(
  memory?: Partial<Memory> | Record<string, any> | null
): MemoryMilestones {
  if (!memory) {
    return {
      hasScript: false,
      hasWeave: false,
      hasRecordedMedia: false,
      hasCompletedCut: false,
      isPublished: false,
    };
  }

  // Act I: Script exists if prose or description has substance (>= 30 characters)
  const proseLength = typeof memory.prose === 'string' ? memory.prose.trim().length : 0;
  const descriptionLength = typeof memory.description === 'string' ? memory.description.trim().length : 0;
  const contentLength = typeof (memory as any).content === 'string' ? (memory as any).content.trim().length : 0;
  const hasScript = proseLength >= 30 || descriptionLength >= 30 || contentLength >= 30;

  // Act II: Narrative Weave exists if fused videoStory, originalHook, selectedHook, or AI takes exist
  const productionTakes = Array.isArray(memory.productionTakes) ? memory.productionTakes : [];
  const hasWeave = Boolean(
    (typeof memory.videoStory === 'string' && memory.videoStory.trim().length > 0) ||
    (typeof (memory as any).selectedHook === 'string' && (memory as any).selectedHook.trim().length > 0) ||
    (typeof memory.originalHook === 'string' && memory.originalHook.trim().length > 0) ||
    (productionTakes.length > 0) ||
    (memory.aiTakes && (
      Boolean(memory.aiTakes.master) ||
      Boolean(memory.aiTakes.poetic) ||
      Boolean(memory.aiTakes.direct) ||
      Boolean(memory.aiTakes.nostalgic)
    )) ||
    (hasScript && proseLength >= 50)
  );

  // Act III: Capture exists if actual media URL or recorded takes exist
  const hasVideoUrl = typeof memory.videoUrl === 'string' && memory.videoUrl.trim().length > 0;
  const hasAudioUrl = typeof (memory as any).audioUrl === 'string' && (memory as any).audioUrl.trim().length > 0;
  const takes = Array.isArray((memory as any).takes) ? (memory as any).takes : [];
  const recordedSegments = Array.isArray((memory as any).recordedSegments) ? (memory as any).recordedSegments : [];
  const hasTakes = takes.length > 0 || recordedSegments.length > 0;

  const hasRecordedMedia = Boolean(hasVideoUrl || hasAudioUrl || hasTakes);

  // Act IV: The Cut exists if media has been recorded AND reached review status (pre-release or published)
  const status = memory.status;
  const hasCompletedCut = Boolean(
    hasRecordedMedia && (status === 'pre-release' || status === 'published')
  );

  // Act V: Premiere is published if status is officially 'published'
  const isPublished = status === 'published';

  return {
    hasScript,
    hasWeave,
    hasRecordedMedia,
    hasCompletedCut,
    isPublished,
  };
}

/**
 * Determines whether a specific production act index (0 through 4) is completed based on milestones.
 */
export function isActMilestoneCompleted(
  actId: number,
  milestones: MemoryMilestones
): boolean {
  switch (actId) {
    case 0: // ACT I: Inciting Memory
      return milestones.hasScript;
    case 1: // ACT II: The Weave
      return milestones.hasWeave;
    case 2: // ACT III: Capture
      return milestones.hasRecordedMedia;
    case 3: // ACT IV: The Cut
      return milestones.hasCompletedCut;
    case 4: // ACT V: Premiere
      return milestones.isPublished;
    default:
      return false;
  }
}
