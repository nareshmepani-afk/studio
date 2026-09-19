import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Memory } from '@/types';
import {
  isDraftResetAllowed,
  executeDraftReset,
  isRehearsalDraft,
  CANONICAL_REHEARSAL_PROSE
} from '@/lib/draftReset';

describe('🏛️ Draft Reset & Clean Slate Regression Shield (Ticket MW-272)', () => {
  const baseStandardMemory: Partial<Memory> = {
    id: 'mem_standard_test_123',
    promptId: 'prompt_roots_foundations',
    sceneId: 'scene_childhood_hearth',
    title: 'An Authentic Childhood Tale',
    category: 'personal',
    status: 'draft',
    productionStage: 0,
    modality: 'pen',
    prose: 'We ran through the autumn orchards until dusk settled over the hills.',
    description: 'We ran through the autumn orchards until dusk settled over the hills.',
    originalHook: 'We ran through the autumn orchards until dusk settled over the hills.',
    location: 'Worcestershire',
    country: 'United Kingdom',
    date: '1984',
    dateComponents: { year: '1984', month: '10', day: '12' },
    year: 1984,
    activeVision: 'The Flow',
    activeVisionLabel: 'The Flow',
    productionTakes: [
      { prose: 'Take 1 draft script' } as any,
    ],
    aiTakes: {
      poetic: 'Echoes of amber sunlight.',
    } as any,
  };

  const baseRehearsalMemory: Partial<Memory> = {
    id: 'tech_scout_draft_test',
    promptId: 'prologue-flight-simulator',
    sceneId: 'prologue-flight-simulator',
    title: 'The First Journey (Draft Pre-Flight)',
    category: 'personal',
    status: 'draft',
    productionStage: 0,
    modality: 'pen',
    isFlightSimulator: true,
    prose: 'User modified manuscript during rehearsal experimentation.',
    description: 'User modified manuscript during rehearsal experimentation.',
    originalHook: 'User modified manuscript during rehearsal experimentation.',
    location: 'Oxford Street',
    country: 'United Kingdom',
    date: '1979',
    dateComponents: { year: '1979', month: '6', day: '1' },
    year: 1979,
  };

  it('1. Identity fields (id, promptId, sceneId, title) survive reset', () => {
    const resetDelta = executeDraftReset(baseStandardMemory, false);

    // Merging reset delta into original memory
    const restoredMemory = { ...baseStandardMemory, ...resetDelta };

    expect(restoredMemory.id).toBe(baseStandardMemory.id);
    expect(restoredMemory.promptId).toBe(baseStandardMemory.promptId);
    expect(restoredMemory.sceneId).toBe(baseStandardMemory.sceneId);
    expect(restoredMemory.title).toBe(baseStandardMemory.title);
    expect(restoredMemory.category).toBe(baseStandardMemory.category);
    expect(restoredMemory.modality).toBe(baseStandardMemory.modality);
  });

  it('2. Volatile fields are cleared cleanly for standard memories (Blank Canvas)', () => {
    const resetDelta = executeDraftReset(baseStandardMemory, false);

    expect(resetDelta.prose).toBe('');
    expect(resetDelta.description).toBe('');
    expect(resetDelta.originalHook).toBe('');
    expect(resetDelta.location).toBe('');
    expect(resetDelta.country).toBe('');
    expect(resetDelta.narratorLocationAtEvent).toBe('');
    expect(resetDelta.date).toBe('');
    expect(resetDelta.productionTakes).toEqual([]);
    expect(resetDelta.aiTakes).toBeNull();
    expect(resetDelta.activeVision).toBe('');
    expect(resetDelta.activeVisionLabel).toBe('');
    expect(resetDelta.productionStage).toBe(0);
    expect(resetDelta.isProductionLocked).toBe(false);

    expect(resetDelta.scriptBlocks).toBeDefined();
    expect(resetDelta.scriptBlocks?.length).toBe(1);
    expect(resetDelta.scriptBlocks?.[0].text).toBe('');
  });

  it('3. Rehearsal / Flight Simulator drafts rehydrate canonical seed prose & clear coordinates', () => {
    expect(isRehearsalDraft(baseRehearsalMemory)).toBe(true);

    const resetDelta = executeDraftReset(baseRehearsalMemory, false);

    expect(resetDelta.prose).toBe(CANONICAL_REHEARSAL_PROSE);
    expect(resetDelta.description).toBe(CANONICAL_REHEARSAL_PROSE);
    expect(resetDelta.originalHook).toBe(CANONICAL_REHEARSAL_PROSE);
    expect(resetDelta.scriptBlocks?.[0].text).toBe(CANONICAL_REHEARSAL_PROSE);

    // Coordinates cleared to enforce truthful catalyst input
    expect(resetDelta.location).toBe('');
    expect(resetDelta.country).toBe('');
    expect(resetDelta.date).toBe('');
    expect(resetDelta.productionStage).toBe(0);
  });

  it('4. Draft reset is always available during Picture Lock and releases lock upon reset', () => {
    const lockedMemory = { ...baseStandardMemory, isProductionLocked: true };
    const eligibility = isDraftResetAllowed(lockedMemory, true);
    
    // User Directive: Reset button should always be enabled in draft stage
    expect(eligibility.allowed).toBe(true);
    expect(eligibility.isLocked).toBe(true);

    const resetDelta = executeDraftReset(lockedMemory, true);
    expect(resetDelta.isProductionLocked).toBe(false);
  });

  it('5. Reset is strictly blocked when memory status has progressed beyond draft', () => {
    const publishedMemory: Partial<Memory> = {
      ...baseStandardMemory,
      status: 'published',
    };

    const eligibility = isDraftResetAllowed(publishedMemory, false);
    expect(eligibility.allowed).toBe(false);
    expect(eligibility.reason).toMatch(/progressed beyond draft stage/i);
    expect(() => executeDraftReset(publishedMemory, false)).toThrow(/progressed beyond draft stage/i);
  });

  it('6. Reset is strictly blocked when recorded media takes exist (Rule 7 Universal Non-Degradation)', () => {
    const mediaCases: Partial<Memory>[] = [
      { ...baseStandardMemory, videoUrl: 'https://storage.googleapis.com/test/take1.mp4' },
      ({ ...baseStandardMemory, masterTakeUrl: 'https://storage.googleapis.com/test/master.mp4' } as any),
      ({ ...baseStandardMemory, takes: [{ id: 'take-1', url: 'https://example.com/take.webm' } as any] } as any),
      { ...baseStandardMemory, productionTakes: [{ id: 'take-p', recordedUrl: 'https://example.com/take.mp4' } as any] },
    ];

    mediaCases.forEach((memCase, index) => {
      const eligibility = isDraftResetAllowed(memCase, false);
      expect(eligibility.allowed, `Media test case ${index + 1} should block reset`).toBe(false);
      expect(eligibility.reason).toMatch(/Recorded media takes exist/i);
      expect(() => executeDraftReset(memCase, false)).toThrow(/Recorded media takes exist/i);
    });
  });

  it('7. Strict British English (UK) orthography and copy verification in ResetDraftModal and draftReset', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/modals/ResetDraftModal.tsx');
    const modalCode = fs.readFileSync(modalPath, 'utf8');

    // Expected copy matching directive
    expect(modalCode).toContain(
      'Reset Draft to Baseline? This will clear your current manuscript and unselected takes so you can begin this memory anew. Your curriculum placement will remain intact.'
    );
    expect(modalCode).toContain('Cancel / Keep Working');
    expect(modalCode).toContain('Reset to Blank Canvas');
    expect(modalCode).toContain('theatrical');

    const domainPath = path.resolve(process.cwd(), 'src/lib/draftReset.ts');
    const domainCode = fs.readFileSync(domainPath, 'utf8');
    expect(domainCode).toContain('synchronisation');
    expect(domainCode).toContain('theatrical');

    // Forbidden US spellings
    expect(domainCode).not.toContain('synchronization');
    expect(modalCode).not.toContain('synchronization');
  });

  it('8. MemoryForm renders the Reset Draft button with hotspot ID and guard bindings', () => {
    const formPath = path.resolve(process.cwd(), 'src/components/studio/MemoryForm.tsx');
    const formCode = fs.readFileSync(formPath, 'utf8');

    expect(formCode).toContain('data-hotspot-id="HS_ACT1_RESET_DRAFT_BTN"');
    expect(formCode).toContain('Reset Draft');
    expect(formCode).toContain('ResetDraftModal');
    expect(formCode).toContain('isDraftResetAllowed');
    expect(formCode).toContain('executeDraftReset');
  });
});
