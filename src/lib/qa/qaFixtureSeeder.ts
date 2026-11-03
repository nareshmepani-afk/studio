import { Memory } from '@/types';
import { getSceneById, resolveSceneFromPromptId, MasterStoryScene } from '@/lib/curriculum/masterStoryStructure';

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

  return {
    id: fixtureId,
    userId,
    promptId: resolvedScene.promptId,
    sceneId: resolvedScene.id,
    title: resolvedScene.title,
    prose: initialProse || '',
    description: initialProse || resolvedScene.subtitle,
    originalHook: initialProse || '',
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
