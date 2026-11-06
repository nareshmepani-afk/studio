import { describe, it, expect } from 'vitest';
import {
  getQaFixtureDocId,
  resolveCanonicalSceneFallback,
  createQaFixtureMemory,
  isSafeQaFixtureForCleanup,
  filterQaFixturesForCleanup,
  resolveQaSeedDefaultProse,
  QA_SEED_52_PROSE,
  QA_SEED_53_PROSE,
} from '@/lib/qa/qaFixtureSeeder';

describe('QA Fixture Seeder & Isolation Engine (GOV-MW-163)', () => {
  describe('getQaFixtureDocId', () => {
    it('generates deterministic doc ID with sanitized item ID', () => {
      const docId = getQaFixtureDocId('usr_test_123', '55.4');
      expect(docId).toBe('qa_fixture_usr_test_123_55_4');
    });

    it('handles alphanumeric, dashes, and underscores without excessive replacement', () => {
      const docId = getQaFixtureDocId('usr_abc', 'card-12_sub-item');
      expect(docId).toBe('qa_fixture_usr_abc_card-12_sub-item');
    });

    it('replaces dangerous characters with underscores', () => {
      const docId = getQaFixtureDocId('usr_1', 'item/with?special#chars!');
      expect(docId).toBe('qa_fixture_usr_1_item_with_special_chars_');
    });
  });

  describe('Guard 1: Canonical Scene Fallback & Title Preservation', () => {
    it('resolves valid canonical scene when promptId is provided', () => {
      const scene = resolveCanonicalSceneFallback('p2');
      expect(scene).toBeDefined();
      expect(scene.promptId).toBe('p2');
      expect(scene.title).toBeTruthy();
    });

    it('resolves valid canonical scene when sceneId is provided', () => {
      const scene = resolveCanonicalSceneFallback('part-1-scene-1');
      expect(scene).toBeDefined();
      expect(scene.id).toBe('part-1-scene-1');
      expect(scene.title).toBe('A Child of Two Worlds');
    });

    it('falls back to Part I Scene 1 (A Child of Two Worlds) when sceneId is undefined or unknown', () => {
      const scene1 = resolveCanonicalSceneFallback(undefined);
      expect(scene1.id).toBe('part-1-scene-1');
      expect(scene1.title).toBe('A Child of Two Worlds');
      expect(scene1.promptId).toBe('p1');

      const scene2 = resolveCanonicalSceneFallback('completely_invalid_scene_id_999');
      expect(scene2.id).toBe('part-1-scene-1');
      expect(scene2.title).toBe('A Child of Two Worlds');
    });

    it('creates fully-hydrated fixture memory with intact title, sceneId, and promptId', () => {
      const fixture = createQaFixtureMemory({
        itemId: '55.4',
        userId: 'usr_narrator_456',
        sceneId: 'part-1-scene-2',
        initialProse: 'Testing prose from QA fixture',
      });

      expect(fixture.id).toBe('qa_fixture_usr_narrator_456_55_4');
      expect(fixture.userId).toBe('usr_narrator_456');
      expect(fixture.isQATestFixture).toBe(true);
      expect(fixture.isTestFixture).toBe(true);
      expect(fixture.qaItemId).toBe('55.4');
      expect(fixture.sceneId).toBe('part-1-scene-2');
      expect(fixture.promptId).toBeTruthy();
      expect(fixture.title).toBeTruthy();
      expect(fixture.prose).toBe('Testing prose from QA fixture');
    });

    it('prevents undefined titles when sceneId is missing in createQaFixtureMemory', () => {
      const fixture = createQaFixtureMemory({
        itemId: '55.1',
        userId: 'usr_narrator_789',
      });

      expect(fixture.title).toBe('A Child of Two Worlds');
      expect(fixture.sceneId).toBe('part-1-scene-1');
      expect(fixture.promptId).toBe('p1');
    });
  });

  describe('Guard 2: Dual-Key Cleanup Protection', () => {
    it('approves document for cleanup ONLY when BOTH prefix and flag match', () => {
      const validDocId = 'qa_fixture_user123_55_4';
      const validData = { isQATestFixture: true, title: 'Sample' };

      expect(isSafeQaFixtureForCleanup(validDocId, validData)).toBe(true);
    });

    it('REJECTS cleanup if docId does NOT start with qa_fixture_, even if isQATestFixture is true', () => {
      // Critical security check: authentic memory with erroneous or spoofed flag
      const authenticDocId = 'authentic_staging_memory_sample_01';
      const dangerousData = { isQATestFixture: true, title: 'Authentic Memoir' };

      expect(isSafeQaFixtureForCleanup(authenticDocId, dangerousData)).toBe(false);
    });

    it('REJECTS cleanup if isQATestFixture is false or missing, even if docId starts with qa_fixture_', () => {
      const prefixedDocId = 'qa_fixture_user123_55_4';

      expect(isSafeQaFixtureForCleanup(prefixedDocId, { isQATestFixture: false })).toBe(false);
      expect(isSafeQaFixtureForCleanup(prefixedDocId, { title: 'Some doc' })).toBe(false);
      expect(isSafeQaFixtureForCleanup(prefixedDocId, null)).toBe(false);
      expect(isSafeQaFixtureForCleanup(prefixedDocId, undefined)).toBe(false);
    });

    it('filterQaFixturesForCleanup correctly purges only dual-key verified documents (both raw and wrapped)', () => {
      const candidates = [
        { id: 'qa_fixture_u1_1', data: { isQATestFixture: true } },
        { id: 'authentic_staging_memory_sample_01', data: { isQATestFixture: true } }, // authentic ID -> REJECT
        { id: 'qa_fixture_u1_2', data: { isQATestFixture: false } }, // false flag -> REJECT
        { id: 'qa_fixture_u1_3', data: {} }, // missing flag -> REJECT
        { id: 'qa_fixture_u1_4', isQATestFixture: true, prose: 'Direct memory format' }, // direct MATCH
        { id: 'memories_123', data: { title: 'Story' } }, // REJECT
      ];

      const safeToDelete = filterQaFixturesForCleanup(candidates);
      expect(safeToDelete).toHaveLength(2);
      expect(safeToDelete.map((c) => c.id)).toEqual(['qa_fixture_u1_1', 'qa_fixture_u1_4']);
    });
  });

  describe('Item 55.5 Save-First Sandbox Transition Contract (Option 2A)', () => {
    const TESTER_UID = 'TQdB395kXxaAGPhFxk1LVWuT8cg2';
    const AUTHENTIC_DOC_ID = '5F7e9DACtBao5lgKYAxf';

    it('generates exact sandbox document ID for Item 55.5 and tester UID', () => {
      const fixtureId = getQaFixtureDocId(TESTER_UID, '55.5');
      expect(fixtureId).toBe(`qa_fixture_${TESTER_UID}_55_5`);
    });

    it('creates isolated sandbox memory for part-1-scene-2 without overwriting authentic memory', () => {
      const fixture = createQaFixtureMemory({
        itemId: '55.5',
        userId: TESTER_UID,
        sceneId: 'part-1-scene-2',
        initialProse: 'Drafting new story prose in sandbox before scene transition',
      });

      expect(fixture.id).toBe(`qa_fixture_${TESTER_UID}_55_5`);
      expect(fixture.id).not.toBe(AUTHENTIC_DOC_ID);
      expect(fixture.userId).toBe(TESTER_UID);
      expect(fixture.isQATestFixture).toBe(true);
      expect(fixture.isTestFixture).toBe(true);
      expect(fixture.qaItemId).toBe('55.5');
      expect(fixture.sceneId).toBe('part-1-scene-2');
      expect(fixture.promptId).toBe('p2');
      expect(fixture.title).toBe('The House I Grew Up In');
      expect(fixture.prose).toBe('Drafting new story prose in sandbox before scene transition');
    });

    it('verifies Save-First scratchpad key isolation and dual-key cleanup protection', () => {
      const scratchpadKey = `mw_draft_${TESTER_UID}_part-1-scene-2`;
      expect(scratchpadKey).toBe('mw_draft_TQdB395kXxaAGPhFxk1LVWuT8cg2_part-1-scene-2');

      const fixtureDocId = getQaFixtureDocId(TESTER_UID, '55.5');
      const fixtureData = { isQATestFixture: true, prose: 'New draft' };
      expect(isSafeQaFixtureForCleanup(fixtureDocId, fixtureData)).toBe(true);

      // Authentic memory doc must NEVER be marked safe for cleanup
      expect(isSafeQaFixtureForCleanup(AUTHENTIC_DOC_ID, { isQATestFixture: true })).toBe(false);
      expect(isSafeQaFixtureForCleanup(AUTHENTIC_DOC_ID, { isQATestFixture: false })).toBe(false);
    });

    it('resolves deterministic 81-word courtyard dataset for Card 52 (?qa_seed=52) while keeping Card 51 (?qa_seed=51) on default reflection subtitle', () => {
      const seed52Prose = resolveQaSeedDefaultProse('52', 'part-6-scene-4');
      expect(seed52Prose).toBe(QA_SEED_52_PROSE);
      expect(seed52Prose).toContain('As evening fell over the courtyard, the quiet sound of temple bells');
      expect(seed52Prose).toContain('aroma');
      expect(seed52Prose).toContain('generations');

      const fixture52 = createQaFixtureMemory({
        itemId: '52',
        userId: TESTER_UID,
        sceneId: 'part-6-scene-4',
      });
      expect(fixture52.prose).toBe(QA_SEED_52_PROSE);

      const seed53Prose = resolveQaSeedDefaultProse('53', 'part-1-scene-1');
      expect(seed53Prose).toBe(QA_SEED_53_PROSE);

      const seed51Prose = resolveQaSeedDefaultProse('51', 'part-6-scene-4');
      expect(seed51Prose).toBe('The importance of reflection, revisiting older entries, and looking back.');
    });
  });
});
