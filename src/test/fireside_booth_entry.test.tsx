import { describe, it, expect } from 'vitest';
import {
  MASTER_STORY_STRUCTURE,
  resolveSceneFromPromptId,
  getSceneById,
} from '@/lib/curriculum/masterStoryStructure';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';

describe('ARCH-MW-126: Option A — Unified Production Board & Fireside Booth Integration', () => {
  it('1. Guarantees MASTER_STORY_STRUCTURE has exactly 6 parts with 4 scenes each (24 total scenes)', () => {
    expect(MASTER_STORY_STRUCTURE).toHaveLength(6);
    MASTER_STORY_STRUCTURE.forEach((part, idx) => {
      expect(part.partNumber).toBe(idx + 1);
      expect(part.scenes).toHaveLength(4);
      expect(part.id).toBe(['part-i', 'part-ii', 'part-iii', 'part-iv', 'part-v', 'part-vi'][idx]);
    });
    const totalScenes = MASTER_STORY_STRUCTURE.reduce((acc, p) => acc + p.scenes.length, 0);
    expect(totalScenes).toBe(24);
  });

  it('2. Correctly resolves p3 and p3_b distinctly via exact-match in resolveSceneFromPromptId', () => {
    const sceneP3 = resolveSceneFromPromptId('p3');
    expect(sceneP3).toBeDefined();
    expect(sceneP3?.id).toBe('part-1-scene-3');
    expect(sceneP3?.title).toBe('School Days & Early Wonder');

    const sceneP3b = resolveSceneFromPromptId('p3_b');
    expect(sceneP3b).toBeDefined();
    expect(sceneP3b?.id).toBe('part-1-scene-4');
    expect(sceneP3b?.title).toBe('Traditions, Feasts & Sacred Days');
  });

  it('3. Guarantees FIRESIDE_PROMPT_SPARKS has complete 1:1 coverage for all 24 canonical scenes', () => {
    expect(FIRESIDE_PROMPT_SPARKS).toHaveLength(24);
    MASTER_STORY_STRUCTURE.forEach((part) => {
      part.scenes.forEach((scene) => {
        const spark = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === scene.id);
        expect(spark).toBeDefined();
      });
    });
  });

  it('4. Resolves target spark whether queried by promptId (p3_b), sceneId (part-1-scene-4), or sparkId', () => {
    const targetScene = getSceneById('part-1-scene-4');
    expect(targetScene).toBeDefined();

    // Matching by linkedSceneId
    const sparkBySceneId = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === 'part-1-scene-4');
    expect(sparkBySceneId?.title).toBe('Traditions, Feasts & Sacred Days');

    // Matching by resolved promptId
    const resolvedFromPrompt = resolveSceneFromPromptId('p3_b');
    const sparkByPromptId = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === resolvedFromPrompt?.id);
    expect(sparkByPromptId?.id).toBe(sparkBySceneId?.id);
  });

  it('5. Part III (Love and Commitment) has all 4 canonical scenes matching between master structure and fireside sparks', () => {
    const part3 = MASTER_STORY_STRUCTURE.find((p) => p.id === 'part-iii');
    expect(part3).toBeDefined();
    expect(part3?.scenes).toHaveLength(4);

    const sceneTitles = part3?.scenes.map((s) => s.title);
    expect(sceneTitles).toEqual([
      'Journeys Within and Without',
      'Facing Reality',
      'Love, Partnership & Companionship',
      'The Arrival of Children',
    ]);

    part3?.scenes.forEach((scene) => {
      const spark = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === scene.id);
      expect(spark).toBeDefined();
    });
  });
});
