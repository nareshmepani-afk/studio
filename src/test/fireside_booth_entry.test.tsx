import { describe, it, expect } from 'vitest';
import {
  MASTER_STORY_STRUCTURE,
  resolveSceneFromPromptId,
  getSceneById,
} from '@/lib/curriculum/masterStoryStructure';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';

describe('ARCH-MW-126 / ARCH-MW-127: Option A — Unified Production Board & Fireside Booth Integration', () => {
  it('1. Guarantees MASTER_STORY_STRUCTURE has 8 parts (6 core memoir parts + Anthology + Historical Showcase) with 31 narrative memoir scenes', () => {
    expect(MASTER_STORY_STRUCTURE).toHaveLength(8);

    // Core 6 parts
    const coreParts = MASTER_STORY_STRUCTURE.filter((p) => !p.isAnthology && !p.isDemo);
    expect(coreParts).toHaveLength(6);
    coreParts.forEach((part, idx) => {
      expect(part.partNumber).toBe(idx + 1);
      expect(part.id).toBe(['part-i', 'part-ii', 'part-iii', 'part-iv', 'part-v', 'part-vi'][idx]);
    });
    // Parts I-V have 4 scenes each
    coreParts.slice(0, 5).forEach((part) => {
      expect(part.scenes).toHaveLength(4);
    });
    // Part VI has 5 scenes (expanded with Time Travel)
    expect(coreParts[5].scenes).toHaveLength(5);

    // Family Storytelling Anthology
    const familyPart = MASTER_STORY_STRUCTURE.find((p) => p.id === 'family-storytelling');
    expect(familyPart).toBeDefined();
    expect(familyPart?.isAnthology).toBe(true);
    expect(familyPart?.scenes).toHaveLength(6);

    // Historical Showcase Demo
    const demoPart = MASTER_STORY_STRUCTURE.find((p) => p.id === 'historical-showcase');
    expect(demoPart).toBeDefined();
    expect(demoPart?.isDemo).toBe(true);
    expect(demoPart?.scenes).toHaveLength(1);

    // Total non-demo memoir scenes = 25 core + 6 anthology = 31 scenes
    const totalMemoirScenes = MASTER_STORY_STRUCTURE
      .filter((p) => !p.isDemo)
      .reduce((acc, p) => acc + p.scenes.length, 0);
    expect(totalMemoirScenes).toBe(31);
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

  it('3. Guarantees FIRESIDE_PROMPT_SPARKS has complete 1:1 coverage for all 31 non-demo canonical scenes', () => {
    expect(FIRESIDE_PROMPT_SPARKS).toHaveLength(31);
    MASTER_STORY_STRUCTURE.filter((p) => !p.isDemo).forEach((part) => {
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
