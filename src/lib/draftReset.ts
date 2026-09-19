import { Memory, ScriptBlock } from '@/types';
import { resolveMemoryMilestones } from '@/lib/curriculum/milestoneTruth';
import { FIRST_FLIGHT_FIXTURE } from '@/lib/fixtures/firstFlightFixture';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🏛️ Draft Reset & Clean Slate Domain Logic (Ticket MW-272)
 *
 * Provides safe, guarded reset capabilities for Scriptorium manuscripts.
 * Enforces theatrical safeguards:
 * 1. Strictly forbidden when Picture Lock is active.
 * 2. Strictly forbidden when memory has progressed beyond draft status.
 * 3. Strictly forbidden when recorded media takes exist.
 *
 * Governance:
 * - Rule 7 (Universal Non-Degradation): Never destroys recorded media or curriculum context.
 * - Rule 20 (Mandatory British English Orthography): All user-facing strings use UK spelling.
 */

export const CANONICAL_REHEARSAL_PROSE =
  FIRST_FLIGHT_FIXTURE.prose ||
  "The Sunday kettle whistling on the stove, rain drumming against the windowpane, and warm cardamom chai served in cracked ceramic cups. It wasn't fancy, but for those two hours, our whole world was safe. In that kitchen, nobody was in a hurry.";

/**
 * Evaluates whether a memory qualifies as a rehearsal / flight simulator draft.
 */
export function isRehearsalDraft(memory?: Partial<Memory> | null): boolean {
  if (!memory) return false;
  return Boolean(
    memory.isFlightSimulator === true ||
    memory.sceneId === 'prologue-flight-simulator' ||
    memory.promptId === 'prologue-flight-simulator' ||
    (typeof memory.id === 'string' && (
      memory.id.includes('tech_scout') ||
      memory.id === 'first_flight_rehearsal' ||
      memory.id.includes('flight_simulator')
    ))
  );
}

export interface DraftResetEligibility {
  allowed: boolean;
  reason?: string;
  isRehearsal: boolean;
}

/**
 * Determines whether a memory draft can safely be reset to baseline.
 */
export function isDraftResetAllowed(
  memory?: Partial<Memory> | null,
  isProductionLocked: boolean = false
): DraftResetEligibility {
  const isRehearsal = isRehearsalDraft(memory);

  if (!memory) {
    return {
      allowed: false,
      reason: 'Draft synchronisation record unavailable.',
      isRehearsal: false,
    };
  }

  // Guard 1: Picture Lock active
  if (isProductionLocked || memory.isProductionLocked === true) {
    return {
      allowed: false,
      reason: 'Reset disabled: Picture Lock is active. Release theatrical lock to reset draft.',
      isRehearsal,
    };
  }

  // Guard 2: Memory status progressed beyond draft
  if (memory.status && memory.status !== 'draft') {
    return {
      allowed: false,
      reason: `Reset disabled: Memory has progressed beyond draft stage (status: ${memory.status}).`,
      isRehearsal,
    };
  }

  // Guard 3: Recorded media takes exist
  const milestones = resolveMemoryMilestones(memory);
  const memAny = memory as any;
  const hasRecordedMedia = Boolean(
    milestones.hasRecordedMedia ||
    memAny.recordingBlob ||
    memory.videoUrl ||
    (memAny.takes && memAny.takes.length > 0) ||
    memAny.masterTakeUrl ||
    (memory.productionTakes && memory.productionTakes.some((t: any) => t?.videoUrl || t?.recordedUrl))
  );

  if (hasRecordedMedia) {
    return {
      allowed: false,
      reason: 'Reset disabled: Recorded media takes exist for this theatrical performance.',
      isRehearsal,
    };
  }

  return {
    allowed: true,
    isRehearsal,
  };
}

/**
 * Generates the clean-slate reset package for a memory draft.
 * - Identity fields (id, promptId, sceneId, title, etc.) are strictly preserved.
 * - For rehearsal drafts, canonical seed prose is restored while coordinates are cleared.
 * - For standard memories, volatile manuscript and takes are cleared to a blank canvas.
 */
export function executeDraftReset(
  memory: Partial<Memory>,
  isProductionLocked: boolean = false
): Partial<Memory> {
  const eligibility = isDraftResetAllowed(memory, isProductionLocked);
  if (!eligibility.allowed) {
    throw new Error(eligibility.reason || 'Draft reset is not permitted under active theatrical constraints.');
  }

  const isRehearsal = eligibility.isRehearsal;
  const targetProse = isRehearsal ? CANONICAL_REHEARSAL_PROSE : '';
  const initialBlocks: ScriptBlock[] = targetProse
    ? [{ id: uuidv4(), text: targetProse, type: 'beat', catalysts: [] }]
    : [{ id: uuidv4(), text: '', type: 'hook', catalysts: [] }];

  // Return reset delta
  const resetDelta: Partial<Memory> = {
    // Manuscript fields
    prose: targetProse,
    description: targetProse,
    originalHook: targetProse,
    scriptBlocks: initialBlocks,

    // Coordinates & Catalyst fields (cleared cleanly)
    location: '',
    country: '',
    narratorLocationAtEvent: '',
    date: '',
    dateComponents: { year: '', month: '', day: '' },
    year: '',

    // AI & Production takes (cleared cleanly)
    productionTakes: [],
    aiTakes: null,
    activeVision: '',
    activeVisionLabel: '',

    // Stage progression reset to Act I
    productionStage: 0,
    isProductionLocked: false,
  };

  return resetDelta;
}
