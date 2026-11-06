import { Memory } from '@/types';
import { getSceneById, resolveSceneFromPromptId, MasterStoryScene } from '@/lib/curriculum/masterStoryStructure';
import { resolveSceneDefaultScriptText } from '@/types/curriculum';

/**
 * Canonical 81-word multi-line dataset for Card 52 (?qa_seed=52, SPEC-MW-134):
 * - 3 Live Sensory Anchors: Soundscape ("quiet"), Visual ("generations"), Aroma ("aroma")
 * - 81 words / ~41s spoken at 120 WPM elder cadence
 * - 1 Pre-active Breath Run Scribe Note (29-word 4th sentence > 24 words)
 */
export const QA_SEED_52_PROSE =
  'As evening fell over the courtyard, the quiet sound of temple bells drifted through the open windows. I held the worn brass compass in my hands, feeling its cool, weathered surface against my palms. From the kitchen came the rich aroma of cardamom and roasting spices, filling the room with familiar warmth. Under the soft golden lamplight, three generations gathered together around the table to turn the delicate pages of the family journal, passing forward our favourite traditions and hard-won memories.';

/**
 * Canonical 3-sentence dataset for Card 53 (?qa_seed=53, ARCH-MW-136):
 * - Sentence 1 (15 words -> <=20w subtle stone badge)
 * - Sentence 2 (23 words -> 21-28w emerald "Optimal" badge)
 * - Sentence 3 (31 words -> >28w amber "Add Breath //" badge)
 */
export const QA_SEED_53_PROSE =
  'The history I carry is an epic journey across oceans and generations of our family. From the quiet courtyard of our earliest childhood home, the sound of morning prayers drifted softly through the open shutters into the garden. Every evening my grandparents gathered us around the wooden table where cardamom tea simmered on the stove and shared the stories of how they crossed the ocean to build a new life.';

/**
 * Resolves the deterministic default script prose for a QA seed and scene so that
 * the test instructions and actual live dataset match 100% across Fireside and Desktop Soundstage.
 */
export function resolveQaSeedDefaultProse(qaSeed?: string | null, sceneIdOrPromptId?: string | null): string {
  const cleanSeed = String(qaSeed || '').trim();
  if (cleanSeed === '52' || cleanSeed.startsWith('52.') || cleanSeed.startsWith('52_')) {
    return QA_SEED_52_PROSE;
  }
  if (cleanSeed === '53' || cleanSeed.startsWith('53.') || cleanSeed.startsWith('53_')) {
    return QA_SEED_53_PROSE;
  }
  return resolveSceneDefaultScriptText(sceneIdOrPromptId);
}

/**
 * 🧪 QA Sandbox Fixture Seeder & Isolation Engine (GOV-MW-163)
 *
 * Provides deterministic sandbox memory fixtures for QA test items that mutate state,
 * synthesize AI weaves, or record takes. Ensures authentic user memoirs are never contaminated.
 */

export interface QaFixtureConfig {
  itemId: string;
  userId: string;
  sceneId?: string;
  promptId?: string;
  initialProse?: string;
  initialStatus?: string;
  productionStage?: number;
}

/**
 * Deterministically computes the QA fixture document ID.
 * Format: qa_fixture_${userId}_${cleanItemId}
 */
export function getQaFixtureDocId(userId: string, itemId: string): string {
  const cleanItem = String(itemId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `qa_fixture_${userId}_${cleanItem}`;
}

/**
 * Guard 1: Resolves a valid canonical scene definition with safe fallback to Part I Scene 1.
 * Prevents undefined titles in curriculum headers and switcher pills.
 */
export function resolveCanonicalSceneFallback(sceneOrPromptId?: string): MasterStoryScene {
  if (sceneOrPromptId) {
    const scene = getSceneById(sceneOrPromptId) || resolveSceneFromPromptId(sceneOrPromptId);
    if (scene) return scene;
  }
  // Safe default: Part 1 Scene 1 (A Child of Two Worlds)
  const defaultScene = getSceneById('part-1-scene-1') || resolveSceneFromPromptId('p1');
  if (defaultScene) return defaultScene;

  // Ultimate resilient fallback matching MasterStoryScene contract
  return {
    id: 'part-1-scene-1',
    partNumber: 1,
    partTitle: 'Part I: Roots and Foundations',
    sceneNumber: 1,
    title: 'A Child of Two Worlds',
    subtitle: 'Your Birthplace, Family Roots & Earliest Home',
    promptId: 'p1',
    suggestedMediaMode: 'video',
    defaultStatus: 'ready_for_action',
    keySensoryQuestions: {
      en: ['Where did your life begin?'],
      gu: [],
      pa: [],
      hi: [],
    },
  };
}

/**
 * Guard 1 Compliant: Creates a robust, fully-hydrated sandbox fixture memory.
 * Retains authentic canonical sceneId, promptId, and titles so headers and the
 * [Soundstage ⇄ Fireside] switcher resolve cleanly without undefined titles.
 */
export function createQaFixtureMemory(config: QaFixtureConfig): Memory {
  const { itemId, userId, sceneId, promptId, initialProse, initialStatus, productionStage } = config;
  const fixtureId = getQaFixtureDocId(userId, itemId);
  const resolvedScene = resolveCanonicalSceneFallback(sceneId || promptId);
  const resolvedProse = initialProse ?? resolveQaSeedDefaultProse(itemId, resolvedScene.id);

  return {
    id: fixtureId,
    userId,
    promptId: resolvedScene.promptId,
    sceneId: resolvedScene.id,
    title: resolvedScene.title,
    prose: resolvedProse || '',
    description: resolvedProse || resolvedScene.subtitle,
    originalHook: resolvedProse || '',
    status: (initialStatus as any) || 'draft',
    productionStage: productionStage ?? 0,
    actsCompleted: [],
    // Mandatory Test Fixture Flags
    isQATestFixture: true,
    isTestFixture: true,
    qaItemId: itemId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as Memory;
}

/**
 * Guard 2: Checks if a document candidate is safe for automated QA cleanup.
 * ENFORCES BOTH:
 * 1. docId.startsWith('qa_fixture_')
 * 2. data.isQATestFixture === true
 *
 * If either condition fails, returns false immediately to protect authentic memories.
 */
export function isSafeQaFixtureForCleanup(docId: string, data?: Record<string, any> | null): boolean {
  if (!docId || typeof docId !== 'string') return false;
  if (!docId.startsWith('qa_fixture_')) return false;
  if (!data || typeof data !== 'object') return false;
  return data.isQATestFixture === true;
}

/**
 * Filter an array of memory objects or doc candidate wrappers to safely isolate QA cleanup targets.
 */
export function filterQaFixturesForCleanup<T extends { id: string; isQATestFixture?: boolean; data?: any }>(
  memories: T[]
): T[] {
  return memories.filter((m) => {
    let resolvedData: any = m;
    if (typeof m.data === 'function') {
      resolvedData = m.data();
    } else if (m.data && typeof m.data === 'object') {
      resolvedData = m.data;
    }
    return isSafeQaFixtureForCleanup(m.id, resolvedData);
  });
}
