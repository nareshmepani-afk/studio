import { describe, it, expect } from 'vitest';
import { 
  STUDIO_CONTROL_MATRIX, 
  isStudioControlVisible, 
  StudioControlContract 
} from '@/config/studioControlMatrix';

describe('UNIFIED STUDIO CONTROL REGISTRY (USCR) - 20-STATE PERMUTATION SHIELD', () => {
  const STAGES = [0, 1, 2, 3, 4];
  const CLEAN_VIEW_STATES = [true, false];
  const LOCK_STATES = [true, false];

  it('MATRIX PERMUTATION TEST: should assert layer synchronization across all 20 state combinations (5 Stages x 2 CleanView x 2 LockStates)', () => {
    let totalEvaluations = 0;

    for (const stage of STAGES) {
      for (const isCleanView of CLEAN_VIEW_STATES) {
        for (const isProductionLocked of LOCK_STATES) {
          totalEvaluations++;

          // 1. Header Clean Read Toggle MUST remain visible across all 20 permutations
          const headerVisible = isStudioControlVisible('HS_HEADER_CLEAN_READ_BTN', stage, isCleanView, isProductionLocked);
          expect(headerVisible).toBe(true);

          // 2. Dock Clean Read Toggle MUST remain visible in Act I across both lock states
          const dockVisible = isStudioControlVisible('HS_ACT1_CLEAN_VIEW_BTN', stage, isCleanView, isProductionLocked);
          if (stage === 0) {
            expect(dockVisible).toBe(true);
          } else {
            expect(dockVisible).toBe(false);
          }

          // 3. Mentorship Hotspots for current stage MUST be visible when isCleanView is false, even when locked
          const stageStep1Id = `HS_ACT${stage + 1}_MENTOR_STEP1`;
          const stageStep2Id = `HS_ACT${stage + 1}_MENTOR_STEP2`;
          const stageStep3Id = `HS_ACT${stage + 1}_MENTOR_STEP3`;

          const step1Visible = isStudioControlVisible(stageStep1Id, stage, isCleanView, isProductionLocked);
          const step2Visible = isStudioControlVisible(stageStep2Id, stage, isCleanView, isProductionLocked);
          const step3Visible = isStudioControlVisible(stageStep3Id, stage, isCleanView, isProductionLocked);

          if (!isCleanView) {
            expect(step1Visible).toBe(true);
            expect(step2Visible).toBe(true);
            expect(step3Visible).toBe(true);
          } else {
            // Clean Read Mode Active -> All mentorship badges hidden
            expect(step1Visible).toBe(false);
            expect(step2Visible).toBe(false);
            expect(step3Visible).toBe(false);
          }

          // 4. Hotspots belonging to OTHER stages MUST NOT be visible on current stage
          for (const otherStage of STAGES) {
            if (otherStage !== stage) {
              const otherStep1Id = `HS_ACT${otherStage + 1}_MENTOR_STEP1`;
              const otherVisible = isStudioControlVisible(otherStep1Id, stage, isCleanView, isProductionLocked);
              expect(otherVisible).toBe(false);
            }
          }
        }
      }
    }

    expect(totalEvaluations).toBe(20);
  });

  it('REGISTRY SCHEMA AUDIT: should verify every control in STUDIO_CONTROL_MATRIX has valid contract and UK English orthography', () => {
    const contracts = Object.values(STUDIO_CONTROL_MATRIX);
    expect(contracts.length).toBeGreaterThanOrEqual(17);

    for (const contract of contracts) {
      expect(contract.id).toBeTruthy();
      expect(contract.name).toBeTruthy();
      expect(contract.visibleStages.length).toBeGreaterThan(0);
      expect(contract.affectedLayers.length).toBeGreaterThan(0);
      expect(contract.states.active.label).toBeTruthy();
      expect(contract.states.inactive.label).toBeTruthy();

      // Enforce UK English spelling standard (Rule 20)
      const fullText = `${contract.name} ${contract.states.active.label} ${contract.states.inactive.label} ${contract.states.active.tooltip} ${contract.states.inactive.tooltip}`;
      expect(fullText).not.toContain('Color '); // UK: Colour
      expect(fullText).not.toContain('Favorite '); // UK: Favourite
    }
  });

  it('LAYER TARGET INTEGRITY: should verify affectedLayers mapping accurately maps controls to DOM render layers', () => {
    const cleanReadHeader = STUDIO_CONTROL_MATRIX['HS_HEADER_CLEAN_READ_BTN'];
    expect(cleanReadHeader.affectedLayers).toContain('sentence_anchors');
    expect(cleanReadHeader.affectedLayers).toContain('mentorship_badges');
    expect(cleanReadHeader.affectedLayers).toContain('director_ink_underlines');

    const act1Step1 = STUDIO_CONTROL_MATRIX['HS_ACT1_MENTOR_STEP1'];
    expect(act1Step1.affectedLayers).toContain('mentorship_badges');
  });
});
