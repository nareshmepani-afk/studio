import { premiumPromptIds } from '@/lib/premiumPrompts';
import {
  getSceneById,
  getPartForScene,
  resolveSceneFromPromptId,
} from '@/lib/curriculum/masterStoryStructure';
import {
  resolveSceneDefaultScriptText,
  type UnifiedCurriculumMemory,
} from '@/types/curriculum';

export interface EntitlementUserLike {
  uid?: string | null;
  email?: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
  directorPassStatus?: string | null;
  membershipTier?: string | null;
  role?: string | null;
}

export interface SceneAccessEvaluation {
  isPremium: boolean;
  hasEntitlement: boolean;
  isGrandfathered: boolean;
  /** True when user may view/play the scene content without ghosting */
  canReadUnrestricted: boolean;
  /** True when user may create/edit prose, takes, coordinates, bonus notes, or publish */
  canWrite: boolean;
  /** True when card/row should render in ghosted Free Forever preview state */
  isLockedPreview: boolean;
}

/**
 * Determines whether a curriculum scene or prompt requires an active paid pass / vault tier.
 * Strict 1:1 parity with StudioDashboard.tsx:349-374 & premiumPrompts.ts:
 * - Part I (part-i: p1, p2, p3, p3_b / part-1-scene-1..4) and Historical Showcase Demo are FREE.
 * - Part II through Part VI and Family Storytelling Anthology are PREMIUM.
 */
export function isScenePremium(sceneOrPromptId?: string | null): boolean {
  if (!sceneOrPromptId) return false;
  if (premiumPromptIds.has(sceneOrPromptId)) return true;

  const resolvedScene =
    resolveSceneFromPromptId(sceneOrPromptId) || getSceneById(sceneOrPromptId);

  if (!resolvedScene) {
    return false;
  }

  if (resolvedScene.promptId && premiumPromptIds.has(resolvedScene.promptId)) {
    return true;
  }

  const part = getPartForScene(resolvedScene.id);
  if (part?.isDemo) return false;
  if (part?.id === 'part-i' || resolvedScene.partNumber === 1) return false;

  return true;
}

/**
 * Strict parity with StudioDashboard.tsx:350-374:
 * Paid Host Pass, Generational Vault, and Super Admin unlock Part II-VI writes.
 * Free Forever / Sandbox ('free_host_pass_active', 'no_pass_initiated', expired, or Guest)
 * unlock Part I's 4 foundational scenes while seeing Part II-VI as ghosted Upgrade previews.
 */
export function hasFullCurriculumEntitlement(
  user?: EntitlementUserLike | null,
  explicitPassStatus?: string | null
): boolean {
  const passStatus = explicitPassStatus ?? user?.directorPassStatus ?? null;
  if (passStatus === 'paid_host_pass_active') return true;
  if (user?.membershipTier === 'generational_vault') return true;
  if (user?.role === 'Super Admin') return true;
  return false;
}

/**
 * Rule 7 Non-Degradation Grandfathering Shield:
 * If a narrator already recorded a take or authored custom prose in a Part II-VI scene
 * (e.g. during a previous pass or prior to lock enforcement), reading and playback
 * remain 100% accessible and unghosted so user-created memories are never hidden.
 */
export function hasGrandfatheredSceneData(
  memory?: Partial<UnifiedCurriculumMemory> | null
): boolean {
  if (!memory) return false;

  const activeTakes = Array.isArray(memory.takes)
    ? memory.takes.filter((t) => t && t.status !== 'outtake' && t.status !== 'purged')
    : [];

  if (activeTakes.length > 0) return true;
  if (Boolean(memory.videoUrl || memory.audioUrl)) return true;
  if (memory.status === 'published' || memory.status === 'pre-release' || memory.status === 'cinematic-ready') {
    return true;
  }

  const rawProse = typeof memory.prose === 'string' ? memory.prose.trim() : '';
  if (rawProse.length > 0) {
    const defaultProse = memory.sceneId
      ? resolveSceneDefaultScriptText(memory.sceneId).trim()
      : '';
    if (rawProse !== defaultProse) {
      return true;
    }
  }

  return false;
}

export function evaluateSceneAccess(params: {
  sceneId?: string | null;
  user?: EntitlementUserLike | null;
  directorPassStatus?: string | null;
  existingMemory?: Partial<UnifiedCurriculumMemory> | null;
}): SceneAccessEvaluation {
  const isPremium = isScenePremium(params.sceneId);
  const hasEntitlement = hasFullCurriculumEntitlement(
    params.user,
    params.directorPassStatus
  );
  const isGrandfathered = hasGrandfatheredSceneData(params.existingMemory);

  if (!isPremium || hasEntitlement) {
    return {
      isPremium,
      hasEntitlement,
      isGrandfathered,
      canReadUnrestricted: true,
      canWrite: true,
      isLockedPreview: false,
    };
  }

  if (isGrandfathered) {
    return {
      isPremium,
      hasEntitlement: false,
      isGrandfathered: true,
      canReadUnrestricted: true,
      canWrite: false,
      isLockedPreview: false,
    };
  }

  return {
    isPremium: true,
    hasEntitlement: false,
    isGrandfathered: false,
    canReadUnrestricted: false,
    canWrite: false,
    isLockedPreview: true,
  };
}
