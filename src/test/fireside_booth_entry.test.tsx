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
    // Parts I-VI have 4 scenes each (perfect symmetric 6x4 = 24 architecture)
    coreParts.forEach((part) => {
      expect(part.scenes).toHaveLength(4);
    });

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

    // Total non-demo memoir scenes = 24 core + 6 anthology = 30 scenes
    const totalMemoirScenes = MASTER_STORY_STRUCTURE
      .filter((p) => !p.isDemo)
      .reduce((acc, p) => acc + p.scenes.length, 0);
    expect(totalMemoirScenes).toBe(30);
  });

  it('2. Correctly resolves p3 and p3_b distinctly via exact-match in resolveSceneFromPromptId', () => {
    const sceneP3 = resolveSceneFromPromptId('p3');
    expect(sceneP3).toBeDefined();
    expect(sceneP3?.id).toBe('part-1-scene-3');
    expect(sceneP3?.title).toBe('Innocence and Curiosity');

    const sceneP3b = resolveSceneFromPromptId('p3_b');
    expect(sceneP3b).toBeDefined();
    expect(sceneP3b?.id).toBe('part-1-scene-4');
    expect(sceneP3b?.title).toBe('Traditions, Feasts & Sacred Days');
  });

  it('3. Guarantees FIRESIDE_PROMPT_SPARKS has complete 1:1 coverage for all 30 non-demo canonical scenes', () => {
    expect(FIRESIDE_PROMPT_SPARKS).toHaveLength(30);
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
      'A Person Becoming',
      'Falling in Love with Life',
      'The Birth of Children',
    ]);

    part3?.scenes.forEach((scene) => {
      const spark = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === scene.id);
      expect(spark).toBeDefined();
    });
  });

  it('6. Fireside deep-link query param ?id=p4_1 resolves directly to Part II Scene 1 spark (spark_humour_mishap)', () => {
    const resolvedScene = resolveSceneFromPromptId('p4_1');
    expect(resolvedScene?.id).toBe('part-2-scene-1');
    const targetSpark = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === resolvedScene?.id);
    expect(targetSpark?.id).toBe('spark_humour_mishap');
    expect(targetSpark?.title).toBe('Echoes of a Brother, Sister or Friends');
  });

  it('7. Guarantees Fireside storytelling panels standardise to w-full max-w-xl mx-auto (576px) and 18px prompter prose (SPEC-MW-180)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');

    const clientSource = fs.readFileSync(path.join(__dirname, '../app/studio/fireside/FiresideStudioClient.tsx'), 'utf8');
    const dockSource = fs.readFileSync(path.join(__dirname, '../components/fireside/OrientationSoundcheckDock.tsx'), 'utf8');

    // Prompter banner container standardises to max-w-xl
    expect(clientSource).toContain('w-full max-w-xl mx-auto mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25');
    // Prompter banner prose standardises to 18px (text-lg font-serif)
    expect(clientSource).toContain('max-h-56 overflow-y-auto pr-1 text-lg font-serif text-stone-200 leading-relaxed');

    // Video memo & Voice recording mode switches standardise to max-w-xl
    expect(clientSource).toContain('w-full max-w-xl flex justify-end mb-2 px-1');
    expect(clientSource).not.toContain('w-full max-w-md flex justify-end mb-2 px-1');

    // Orientation soundcheck dock standardises to max-w-xl
    expect(dockSource).toContain('w-full max-w-xl mx-auto transition-all duration-200');
    expect(dockSource).not.toContain('w-full max-w-2xl mx-auto transition-all duration-200');
  });
});
