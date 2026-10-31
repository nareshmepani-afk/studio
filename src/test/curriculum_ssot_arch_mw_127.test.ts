import { describe, it, expect } from 'vitest';
import {
  MASTER_STORY_STRUCTURE,
  resolveSceneFromPromptId,
  getSceneById,
  getPartForScene,
  getNextSceneId,
} from '@/lib/curriculum/masterStoryStructure';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';

describe('ARCH-MW-127: Unified Master Curriculum SSOT & Anthology Integration Suite', () => {
  describe('1. MASTER_STORY_STRUCTURE Invariants', () => {
    it('contains exactly 8 parts (6 core memoir parts + 1 anthology + 1 demo)', () => {
      expect(MASTER_STORY_STRUCTURE).toHaveLength(8);
      const partIds = MASTER_STORY_STRUCTURE.map((p) => p.id);
      expect(partIds).toEqual([
        'part-i',
        'part-ii',
        'part-iii',
        'part-iv',
        'part-v',
        'part-vi',
        'family-storytelling',
        'historical-showcase',
      ]);
    });

    it('has 24 core memoir scenes across Parts I through VI (perfect symmetric 4 scenes each)', () => {
      const coreParts = MASTER_STORY_STRUCTURE.filter((p) => !p.isAnthology && !p.isDemo);
      expect(coreParts).toHaveLength(6);
      expect(coreParts[0].scenes).toHaveLength(4); // Part I
      expect(coreParts[1].scenes).toHaveLength(4); // Part II
      expect(coreParts[2].scenes).toHaveLength(4); // Part III
      expect(coreParts[3].scenes).toHaveLength(4); // Part IV
      expect(coreParts[4].scenes).toHaveLength(4); // Part V
      expect(coreParts[5].scenes).toHaveLength(4); // Part VI streamlined

      const part6Scene4 = coreParts[5].scenes[3];
      expect(part6Scene4.id).toBe('part-6-scene-4');
      expect(part6Scene4.promptId).toBe('p23');
      expect(part6Scene4.title).toBe('The Story Continues');
      expect(part6Scene4.sceneNumber).toBe(4);
    });

    it('integrates Family Storytelling as an authentic 6-scene anthology (Part 7)', () => {
      const familyPart = MASTER_STORY_STRUCTURE.find((p) => p.id === 'family-storytelling');
      expect(familyPart).toBeDefined();
      expect(familyPart?.isAnthology).toBe(true);
      expect(familyPart?.partNumber).toBe(7);
      expect(familyPart?.scenes).toHaveLength(6);

      const promptIds = familyPart?.scenes.map((s) => s.promptId);
      expect(promptIds).toEqual(['fs1_1', 'fs2_1', 'fs3_1', 'fs4_1', 'fs5_1', 'fs6_1']);

      const sceneIds = familyPart?.scenes.map((s) => s.id);
      expect(sceneIds).toEqual([
        'family-scene-1',
        'family-scene-2',
        'family-scene-3',
        'family-scene-4',
        'family-scene-5',
        'family-scene-6',
      ]);
    });

    it('registers historical-showcase with isDemo: true, safely excluded from linear narrative progression', () => {
      const demoPart = MASTER_STORY_STRUCTURE.find((p) => p.id === 'historical-showcase');
      expect(demoPart).toBeDefined();
      expect(demoPart?.isDemo).toBe(true);
      expect(demoPart?.partNumber).toBe(8);
      expect(demoPart?.scenes).toHaveLength(1);
      expect(demoPart?.scenes[0].promptId).toBe('p_einstein');

      // Total non-demo scenes is exactly 30 (24 core + 6 anthology)
      const totalMemoirScenes = MASTER_STORY_STRUCTURE
        .filter((p) => !p.isDemo)
        .reduce((sum, p) => sum + p.scenes.length, 0);
      expect(totalMemoirScenes).toBe(30);

      // getNextSceneId from the last anthology scene does NOT transition into demo
      const nextAfterAnthology = getNextSceneId('family-scene-6');
      expect(nextAfterAnthology).toBeNull();
    });
  });

  describe('2. Canonical Prompt ID Standardisation & Two-Pass Backward Compatibility', () => {
    it('resolves canonical base tokens for Part II and Part III', () => {
      const p4 = resolveSceneFromPromptId('p4');
      expect(p4?.id).toBe('part-2-scene-1');
      expect(p4?.promptId).toBe('p4');

      const p7 = resolveSceneFromPromptId('p7');
      expect(p7?.id).toBe('part-2-scene-4');
      expect(p7?.promptId).toBe('p7');

      const p8 = resolveSceneFromPromptId('p8');
      expect(p8?.id).toBe('part-3-scene-1');
      expect(p8?.promptId).toBe('p8');

      const p11 = resolveSceneFromPromptId('p11');
      expect(p11?.id).toBe('part-3-scene-4');
      expect(p11?.promptId).toBe('p11');
    });

    it('resolves legacy Firestore suffixed IDs (_1) via fallback normalisation with 100% fidelity', () => {
      const legacyP4 = resolveSceneFromPromptId('p4_1');
      expect(legacyP4?.id).toBe('part-2-scene-1');

      const legacyP7 = resolveSceneFromPromptId('p7_1');
      expect(legacyP7?.id).toBe('part-2-scene-4');

      const legacyP8 = resolveSceneFromPromptId('p8_1');
      expect(legacyP8?.id).toBe('part-3-scene-1');

      const legacyP11 = resolveSceneFromPromptId('p11_1');
      expect(legacyP11?.id).toBe('part-3-scene-4');
    });

    it('resolves p3 and p3_b without collision', () => {
      const p3 = resolveSceneFromPromptId('p3');
      expect(p3?.id).toBe('part-1-scene-3');

      const p3_b = resolveSceneFromPromptId('p3_b');
      expect(p3_b?.id).toBe('part-1-scene-4');
    });

    it('resolves capstone alias p24 to part-6-scene-4 and demo p_einstein correctly', () => {
      const p24 = resolveSceneFromPromptId('p24');
      expect(p24?.id).toBe('part-6-scene-4');
      expect(p24?.promptId).toBe('p23');

      const einstein = resolveSceneFromPromptId('p_einstein');
      expect(einstein?.id).toBe('demo-einstein-scene');
    });
  });

  describe('3. Fireside Prompt Sparks 1:1 Universal Parity', () => {
    it('has exactly 30 prompt sparks matching all 30 non-demo memoir scenes', () => {
      expect(FIRESIDE_PROMPT_SPARKS).toHaveLength(30);

      const nonDemoScenes = MASTER_STORY_STRUCTURE
        .filter((p) => !p.isDemo)
        .flatMap((p) => p.scenes);

      nonDemoScenes.forEach((scene) => {
        const spark = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === scene.id);
        expect(spark, `Missing spark for scene ${scene.id} (${scene.title})`).toBeDefined();
      });
    });

    it('includes spark_legacy_blessing (The Story Continues) with multilingual diaspora translations', () => {
      const spark = FIRESIDE_PROMPT_SPARKS.find((s) => s.id === 'spark_legacy_blessing');
      expect(spark).toBeDefined();
      expect(spark?.linkedSceneId).toBe('part-6-scene-4');
      expect(spark?.title).toBe('The Story Continues');
      expect(spark?.sparks.en).toContain('great-grandchildren');
      expect(spark?.sparks.gu).toBeDefined();
      expect(spark?.sparks.pa).toBeDefined();
      expect(spark?.sparks.hi).toBeDefined();
    });

    it('includes all 6 Family Storytelling sparks with diaspora translations', () => {
      const familySparkIds = [
        'spark_family_elders',
        'spark_family_traditions',
        'spark_family_history',
        'spark_family_values',
        'spark_family_ancestors',
        'spark_family_future',
      ];

      familySparkIds.forEach((sparkId, idx) => {
        const spark = FIRESIDE_PROMPT_SPARKS.find((s) => s.id === sparkId);
        expect(spark, `Missing spark ${sparkId}`).toBeDefined();
        expect(spark?.linkedSceneId).toBe(`family-scene-${idx + 1}`);
        expect(spark?.sparks.en).toBeDefined();
        expect(spark?.sparks.gu).toBeDefined();
        expect(spark?.sparks.pa).toBeDefined();
        expect(spark?.sparks.hi).toBeDefined();
      });
    });
  });

  describe('4. Structural Part & Scene Helpers', () => {
    it('resolves part for family and demo scenes correctly', () => {
      const familyPart = getPartForScene('family-scene-3');
      expect(familyPart.id).toBe('family-storytelling');
      expect(familyPart.isAnthology).toBe(true);

      const demoPart = getPartForScene('demo-einstein-scene');
      expect(demoPart.id).toBe('historical-showcase');
      expect(demoPart.isDemo).toBe(true);
    });

    it('resolves getSceneById for all 32 scenes without throwing', () => {
      MASTER_STORY_STRUCTURE.forEach((part) => {
        part.scenes.forEach((scene) => {
          const found = getSceneById(scene.id);
          expect(found).toBeDefined();
          expect(found?.id).toBe(scene.id);
        });
      });
    });
  });

  describe('5. Path A: Master Cinematic Curriculum & Fireside 1:1 Parity', () => {
    it('guarantees 100% title parity between canonical part.title and localizedTitles.en across all 6 core parts', () => {
      const coreParts = MASTER_STORY_STRUCTURE.filter((p) => !p.isAnthology && !p.isDemo);
      expect(coreParts).toHaveLength(6);
      coreParts.forEach((part) => {
        expect(
          part.localizedTitles?.en,
          `Part ${part.partNumber} localizedTitles.en should match canonical title`
        ).toBe(part.title);
      });
    });

    it('guarantees 100% title parity between canonical scene.title, scene.localizedTitles.en, and FIRESIDE_PROMPT_SPARKS across all 24 core scenes', () => {
      const coreParts = MASTER_STORY_STRUCTURE.filter((p) => !p.isAnthology && !p.isDemo);
      coreParts.forEach((part) => {
        part.scenes.forEach((scene) => {
          expect(
            scene.localizedTitles?.en,
            `Scene ${scene.id} localizedTitles.en should match scene.title`
          ).toBe(scene.title);

          const spark = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === scene.id);
          expect(spark, `Missing prompt spark for ${scene.id}`).toBeDefined();
          expect(
            spark?.title,
            `Spark title for ${scene.id} should match canonical scene.title`
          ).toBe(scene.title);
          expect(
            spark?.localizedTitles?.en,
            `Spark localizedTitles.en for ${scene.id} should match canonical scene.title`
          ).toBe(scene.title);
        });
      });
    });
  });
});
