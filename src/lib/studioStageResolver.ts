/**
 * Pure 5-Act Studio Stage & SyncLock Resolver (SSOT)
 *
 * Centralises the high-precedence invariants governing Act I–V rendering,
 * SelectionDeck vs CinemaMonitor arbitration, Act III+ Teleprompter take hydration,
 * and stale `?act=1` / `?stage=0` query-param cleanup.
 *
 * Zero React, Firebase, or DOM imports so unit tests execute deterministically in milliseconds.
 */

export type StudioActViewMode =
  | 'ACT1_SYNTHESISING'
  | 'ACT1_EDITOR'
  | 'ACT2_SELECTION_DECK'
  | 'ACT2_CINEMA_MONITOR'
  | 'ACT2_SEALED_SCRIPT'
  | 'ACT3_RECORDING'
  | 'ACT4_FINAL_CUT'
  | 'ACT5_PREMIERE';

export interface StudioActViewInput {
  currentStage: number;
  isGeneratingDrafts?: boolean;
  isReviewing?: boolean;
  isReviewingSensory?: boolean;
  pendingDraftsCount?: number;
  hasStructuredScript?: boolean;
}

/**
 * Deterministic top-down truth table for which Act / sub-view renders on Desktop SoundStage:
 *  1. `isGeneratingDrafts === true` -> ALWAYS `ACT1_SYNTHESISING` (no stale card/monitor flash).
 *  2. `(isReviewing || isReviewingSensory) && pendingDraftsCount > 0` -> ALWAYS `ACT2_SELECTION_DECK`
 *     (cannot be hidden or overridden by a pre-existing `structuredScript` or `isProductionLocked`).
 *  3. `currentStage === 1 && hasStructuredScript && isReviewing && pendingDraftsCount === 0` -> `ACT2_CINEMA_MONITOR`.
 *  4. Otherwise explicit stage mapping (0..4).
 */
export function resolveStudioActView(input: StudioActViewInput): StudioActViewMode {
  if (input.isGeneratingDrafts) {
    return 'ACT1_SYNTHESISING';
  }

  const pendingDraftsCount = Math.max(0, Number(input.pendingDraftsCount) || 0);
  if ((input.isReviewing || input.isReviewingSensory) && pendingDraftsCount > 0) {
    return 'ACT2_SELECTION_DECK';
  }

  if (
    input.currentStage === 1 &&
    input.hasStructuredScript &&
    input.isReviewing &&
    pendingDraftsCount === 0
  ) {
    return 'ACT2_CINEMA_MONITOR';
  }

  switch (input.currentStage) {
    case 0:
      return 'ACT1_EDITOR';
    case 1:
      return 'ACT2_SEALED_SCRIPT';
    case 2:
      return 'ACT3_RECORDING';
    case 3:
      return 'ACT4_FINAL_CUT';
    case 4:
      return 'ACT5_PREMIERE';
    default:
      return input.currentStage > 4 ? 'ACT5_PREMIERE' : 'ACT1_EDITOR';
  }
}

export interface SyncLockInput {
  currentStage: number;
  urlAct?: string | null;
  urlStage?: string | null;
  isFlightSimulator?: boolean;
  isReviewing?: boolean;
  memoryIsProductionLocked?: boolean;
}

export type SyncLockTakeAction = 'HYDRATE' | 'CLEAR' | 'HOLD';

export interface SyncLockResolution {
  isExplicitAct1: boolean;
  isFirstFlightAct1: boolean;
  isLocked: boolean;
  takeAction: SyncLockTakeAction;
}

/**
 * Deterministic contract for `ProductionDeck:SyncLock`.
 * - `isExplicitAct1` is strictly scoped to `currentStage === 0` so lingering `?act=1` / `?stage=0`
 *   query parameters from Dashboard "Edit Scene" can NEVER unlock Act II+ or clear `selectedTake` on Act III+.
 * - `takeAction` NEVER returns `'CLEAR'` when `currentStage >= 2` (Act III Teleprompter / Act IV / Act V).
 */
export function resolveSyncLockState(input: SyncLockInput): SyncLockResolution {
  const isExplicitAct1 =
    input.currentStage === 0 && (input.urlAct === '1' || input.urlStage === '0');
  const isFirstFlightAct1 =
    input.currentStage === 0 && Boolean(input.isFlightSimulator);

  const isLocked =
    isExplicitAct1 || isFirstFlightAct1 || Boolean(input.isReviewing)
      ? false
      : Boolean(input.memoryIsProductionLocked || input.currentStage >= 1);

  let takeAction: SyncLockTakeAction = 'HOLD';
  if ((isLocked || input.currentStage >= 2) && !input.isReviewing) {
    takeAction = 'HYDRATE';
  } else if (!isLocked && input.currentStage < 2 && !input.isReviewing) {
    takeAction = 'CLEAR';
  }

  return {
    isExplicitAct1,
    isFirstFlightAct1,
    isLocked,
    takeAction,
  };
}

/**
 * Resolves the authoritative spoken script text for Act III Teleprompter hydration.
 * Priority: `prose` > `structuredScript.cleanScript` > `description`.
 */
export function resolvePreferredScriptTake(
  memoryData?: {
    prose?: string | null;
    description?: string | null;
    structuredScript?: { cleanScript?: string | null } | null;
  } | null
): string | null {
  if (!memoryData) return null;
  const candidates = [
    memoryData.prose,
    memoryData.structuredScript?.cleanScript,
    memoryData.description,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
}

/**
 * Strips ONLY stale `?act=1` / `?stage=0` entry params once the user has progressed past Act I (`currentStage >= 1`).
 * Preserves all other query parameters (`mode`, `sessionId`, `room`, `clean_slate`, `qa_seed`, `?act=3`, `?act=5`)
 * and any URL hash fragment. Returns `null` when no URL update is needed.
 */
export function stripStaleAct1QueryParams(
  href: string,
  currentStage: number
): string | null {
  if (currentStage < 1 || !href) return null;
  try {
    const parsed = new URL(href, 'https://memoryweaver.studio');
    let changed = false;

    if (parsed.searchParams.get('act') === '1') {
      parsed.searchParams.delete('act');
      changed = true;
    }
    if (parsed.searchParams.get('stage') === '0') {
      parsed.searchParams.delete('stage');
      changed = true;
    }

    if (!changed) return null;
    const qs = parsed.searchParams.toString();
    return `${parsed.pathname}${qs ? `?${qs}` : ''}${parsed.hash || ''}`;
  } catch {
    return null;
  }
}
