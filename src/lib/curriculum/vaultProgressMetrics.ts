import { MASTER_STORY_STRUCTURE } from '@/lib/curriculum/masterStoryStructure';

export interface VaultProgressMetrics {
  /** Total canonical personal memoir scenes (excluding demo showcase; 30 scenes) */
  totalMemoirScenes: number;
  /** Total curriculum scenes including showcase when applicable (31 scenes) */
  totalCurriculumScenes: number;
  /** Scenes with captured audio/video takes or authored drafts */
  wovenCount: number;
  /** Percentage (0-100) of woven scenes against totalDenominator */
  wovenPercentage: number;
  /** Scenes published to Family Cinema (status === 'published') */
  premieredCount: number;
  /** Percentage (0-100) of premiered scenes against totalDenominator */
  premieredPercentage: number;
}

export const CANONICAL_MEMOIR_SCENE_COUNT = MASTER_STORY_STRUCTURE.filter(
  (part) => !part.isDemo
).reduce((acc, part) => acc + part.scenes.length, 0);

export const TOTAL_CURRICULUM_SCENE_COUNT = MASTER_STORY_STRUCTURE.reduce(
  (acc, part) => acc + part.scenes.length,
  0
);

/**
 * Single Source of Truth for Memoir Progress across Fireside Studio,
 * Fireside Cinema, Studio Dashboard, and Memory Cinema (/cinema).
 * Eliminates the legacy discrepancy where /cinema reported published-only (e.g. 3%)
 * while Fireside reported woven scenes (e.g. 19%).
 */
export function computeVaultProgressMetrics(params: {
  wovenCount: number;
  premieredCount: number;
  denominator?: number;
}): VaultProgressMetrics {
  const denom =
    typeof params.denominator === 'number' && params.denominator > 0
      ? params.denominator
      : TOTAL_CURRICULUM_SCENE_COUNT;

  const safeWoven = Math.max(0, params.wovenCount);
  const safePremiered = Math.max(0, params.premieredCount);

  return {
    totalMemoirScenes: CANONICAL_MEMOIR_SCENE_COUNT,
    totalCurriculumScenes: TOTAL_CURRICULUM_SCENE_COUNT,
    wovenCount: safeWoven,
    wovenPercentage: Math.min(100, Math.round((safeWoven / denom) * 100)),
    premieredCount: safePremiered,
    premieredPercentage: Math.min(100, Math.round((safePremiered / denom) * 100)),
  };
}
