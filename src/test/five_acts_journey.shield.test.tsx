import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  resolvePreferredScriptTake,
  resolveStudioActView,
  resolveSyncLockState,
  stripStaleAct1QueryParams,
} from '@/lib/studioStageResolver';

// Controllable mock state for real-DOM mounted Teleprompter, SelectionDeck & ProductionControlBar tests
const mockStudioState: any = {
  currentStage: 2,
  isReviewing: false,
  isGeneratingDrafts: false,
  isProductionLocked: true,
  isSaving: false,
  isRecording: false,
  isScrolling: false,
  isMirrored: false,
  scrollSpeed: 1.5,
  fontSize: 32,
  showBreathingMarks: true,
  enablePunctuationBraking: true,
  isolateSentenceHighlight: false,
  sessionId: 'test-session-five-acts',
  selectedTake: null as string | null,
  selectedVision: null as { type: string | null; label: string | null } | null,
  reviewDrafts: [] as any[],
  detectedAnchors: [] as any[],
  draggingCatalyst: null as any,
  lastDetectedAnchor: null as any,
  isDirectorOpen: false,
  isCleanView: false,
  actions: {
    setStage: vi.fn(),
    setIsReviewing: vi.fn(),
    setIsProductionLocked: vi.fn(),
    setSelectedTake: vi.fn(),
    setSelectedVision: vi.fn(),
    setReviewDrafts: vi.fn(),
    toggleScrolling: vi.fn(),
    setScrolling: vi.fn(),
    setScrollSpeed: vi.fn(),
    setFontSize: vi.fn(),
    toggleMirror: vi.fn(),
    increaseFontSize: vi.fn(),
    decreaseFontSize: vi.fn(),
    setShowBreathingMarks: vi.fn(),
    setEnablePunctuationBraking: vi.fn(),
    setIsolateSentenceHighlight: vi.fn(),
    setActiveDrawer: vi.fn(),
    toggleRecording: vi.fn(),
    setModality: vi.fn(),
    setCaptureModality: vi.fn(),
    setMentorActive: vi.fn(),
  },
};

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => mockStudioState,
}));

vi.mock('@/hooks/telemetry/useJourneyLogger', () => ({
  useJourneyLogger: () => ({
    logEvent: vi.fn(),
    traceInteraction: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'TQdB395kXxaAGPhFxk1LVWuT8cg2', email: 'nareshmepani@hotmail.com' },
    loading: false,
  }),
}));

vi.mock('@/actions/studio-vocal', () => ({
  synthesizeStudioSpeech: vi.fn().mockResolvedValue({ success: false }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/components/studio/MentorshipHotspot', () => ({
  MentorshipHotspot: () => null,
}));

vi.mock('@/components/studio/OpticsPrivacyShield', () => ({
  OpticsPrivacyShield: () => null,
}));

vi.mock('@/components/feedback/ReportIssueTrigger', () => ({
  ReportIssueTrigger: () => null,
}));

import { Teleprompter } from '@/components/studio/Teleprompter';
import { SelectionDeck } from '@/components/studio/Scriptorium/Ceremony/SelectionDeck';
import { ProductionControlBar } from '@/components/studio/ProductionControlBar';

const SAMPLE_FLOW_SCRIPT =
  "I was only a one-year-old child held close in my parents' arms when our flight crossed the skies toward London in 1965. Long before my granddad built a permanent home in the dusty village of Madhapar, our people worked the sun-baked fields of Kutch as agricultural labourers, speaking Kutchi and Gujarati.";

const FIVE_FRESH_DRAFTS = [
  {
    visionType: 'Original Polished',
    visionFocus: 'Your authentic voice, preserved and polished.',
    cleanScript: SAMPLE_FLOW_SCRIPT,
  },
  {
    visionType: 'The Soul-Print',
    visionFocus: 'Internal resonance and family values',
    cleanScript: 'Strength carried our family from Madhapar across oceans.',
  },
  {
    visionType: 'The Atmospheric Weave',
    visionFocus: 'Tactile texture and physical contrast',
    cleanScript: 'Sun-baked Kutch earth met London rain in 1965.',
  },
  {
    visionType: 'The Flow',
    visionFocus: 'Spoken momentum and reading cadence',
    cleanScript: SAMPLE_FLOW_SCRIPT,
  },
  {
    visionType: 'The Memory Weave',
    visionFocus: 'Crown master fusion score',
    cleanScript: 'Learn, adapt, work hard, and keep going across generations.',
  },
];

describe('5-Act Journey Constitutional Shield (studioStageResolver + Real-DOM Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStudioState.currentStage = 2;
    mockStudioState.isReviewing = false;
    mockStudioState.isGeneratingDrafts = false;
    mockStudioState.isProductionLocked = true;
    mockStudioState.isSaving = false;
    mockStudioState.isRecording = false;
    mockStudioState.selectedTake = null;
    mockStudioState.selectedVision = null;
    mockStudioState.reviewDrafts = [];
  });

  describe('Layer A: Exhaustive Pure Truth-Table Invariants (studioStageResolver)', () => {
    it('maps all 5 Acts distinctly and enforces Synthesis > SelectionDeck > CinemaMonitor precedence', () => {
      // 1. Fresh 5-Act lifecycle
      expect(resolveStudioActView({ currentStage: 0 })).toBe('ACT1_EDITOR');
      expect(resolveStudioActView({ currentStage: 0, isGeneratingDrafts: true, isReviewing: true, hasStructuredScript: true })).toBe(
        'ACT1_SYNTHESISING'
      );
      expect(
        resolveStudioActView({
          currentStage: 1,
          isReviewing: true,
          pendingDraftsCount: 5,
          hasStructuredScript: true, // Stale structuredScript MUST NEVER override SelectionDeck!
        })
      ).toBe('ACT2_SELECTION_DECK');
      expect(resolveStudioActView({ currentStage: 1, isReviewing: false, hasStructuredScript: true })).toBe(
        'ACT2_SEALED_SCRIPT'
      );
      expect(resolveStudioActView({ currentStage: 2, hasStructuredScript: true })).toBe('ACT3_RECORDING');
      expect(resolveStudioActView({ currentStage: 3, hasStructuredScript: true })).toBe('ACT4_FINAL_CUT');
      expect(resolveStudioActView({ currentStage: 4, hasStructuredScript: true })).toBe('ACT5_PREMIERE');

      // 2. Legacy CinemaMonitor remains reachable ONLY when pendingDraftsCount === 0
      expect(
        resolveStudioActView({
          currentStage: 1,
          isReviewing: true,
          pendingDraftsCount: 0,
          hasStructuredScript: true,
        })
      ).toBe('ACT2_CINEMA_MONITOR');
    });

    it('P1 REGRESSION (mw_telemetry_k4ne1rv6sj): lingering ?act=1 or ?stage=0 NEVER unlocks or clears selectedTake on Act II–V', () => {
      // On Act I (stage 0): ?act=1 explicitly unlocks editor for re-editing
      expect(
        resolveSyncLockState({
          currentStage: 0,
          urlAct: '1',
          memoryIsProductionLocked: true,
          isReviewing: false,
        })
      ).toEqual({
        isExplicitAct1: true,
        isFirstFlightAct1: false,
        isLocked: false,
        takeAction: 'CLEAR',
      });

      // During Act II SelectionDeck review (stage 1, isReviewing: true): stays unlocked & HOLDs selectedTake (no stale hijack)
      expect(
        resolveSyncLockState({
          currentStage: 1,
          urlAct: '1',
          memoryIsProductionLocked: false,
          isReviewing: true,
        })
      ).toEqual({
        isExplicitAct1: false,
        isFirstFlightAct1: false,
        isLocked: false,
        takeAction: 'HOLD',
      });

      // On Act II sealed (stage 1, isReviewing: false) WITH lingering ?act=1: stays locked & HYDRATEs take
      expect(
        resolveSyncLockState({
          currentStage: 1,
          urlAct: '1',
          memoryIsProductionLocked: true,
          isReviewing: false,
        })
      ).toEqual({
        isExplicitAct1: false,
        isFirstFlightAct1: false,
        isLocked: true,
        takeAction: 'HYDRATE',
      });

      // On Act III (stage 2), Act IV (stage 3), Act V (stage 4) WITH lingering ?act=1 or ?stage=0:
      // NEVER unlocks and NEVER returns takeAction === 'CLEAR'!
      for (const stage of [2, 3, 4]) {
        const res = resolveSyncLockState({
          currentStage: stage,
          urlAct: '1',
          urlStage: '0',
          memoryIsProductionLocked: false, // Even if lock flag lagged behind!
          isReviewing: false,
        });
        expect(res.isExplicitAct1).toBe(false);
        expect(res.isLocked).toBe(true);
        expect(res.takeAction).toBe('HYDRATE');
      }
    });

    it('stripStaleAct1QueryParams removes ONLY act=1 / stage=0 once past Act I and preserves all other params & deep links', () => {
      // Still in Act I (stage 0) -> do NOT strip
      expect(
        stripStaleAct1QueryParams('https://dev.memoryweaver.studio/studio/production/ey96?act=1', 0)
      ).toBeNull();

      // Progressed to Act II / III -> strips act=1 cleanly
      expect(
        stripStaleAct1QueryParams('https://dev.memoryweaver.studio/studio/production/ey96?act=1', 1)
      ).toBe('/studio/production/ey96');

      // Preserves unrelated query params + hash fragment verbatim
      expect(
        stripStaleAct1QueryParams(
          'https://dev.memoryweaver.studio/studio/production/ey96?act=1&mode=guest&sessionId=s123&stage=0#teleprompter',
          2
        )
      ).toBe('/studio/production/ey96?mode=guest&sessionId=s123#teleprompter');

      // Preserves legitimate deep links (?act=3, ?act=5)
      expect(
        stripStaleAct1QueryParams('https://dev.memoryweaver.studio/studio/production/ey96?act=3', 2)
      ).toBeNull();
      expect(
        stripStaleAct1QueryParams('https://dev.memoryweaver.studio/studio/production/ey96?act=5', 4)
      ).toBeNull();
    });

    it('resolvePreferredScriptTake falls back prose > structuredScript.cleanScript > description', () => {
      expect(
        resolvePreferredScriptTake({
          prose: '  ',
          structuredScript: { cleanScript: SAMPLE_FLOW_SCRIPT },
          description: 'Fallback desc',
        })
      ).toBe(SAMPLE_FLOW_SCRIPT);
      expect(resolvePreferredScriptTake({ prose: '', description: '' })).toBeNull();
    });
  });

  describe('Layer B: Real-DOM Mounted Component Integration Shield', () => {
    it('?act=1 -> Act II Seal ("The Flow") -> Act III Teleprompter renders real script text (NEVER "NO SCRIPT TAKE SELECTED")', () => {
      const firestoreMemory = {
        id: 'ey96djU6qR1BrDGnvZwp',
        prose: SAMPLE_FLOW_SCRIPT,
        structuredScript: { cleanScript: SAMPLE_FLOW_SCRIPT },
        isProductionLocked: true,
        productionStage: 1,
        reviewDrafts: [],
      };

      // Simulate advancing into Act III (currentStage = 2) with ?act=1 still present in URL
      const syncResult = resolveSyncLockState({
        currentStage: 2,
        urlAct: '1',
        memoryIsProductionLocked: firestoreMemory.isProductionLocked,
        isReviewing: false,
      });
      expect(syncResult.takeAction).toBe('HYDRATE');

      const resolvedTake = resolvePreferredScriptTake(firestoreMemory);
      expect(resolvedTake).toBe(SAMPLE_FLOW_SCRIPT);

      // Hydrate state exactly as ProductionDeck:SyncLock does and mount the REAL <Teleprompter />
      mockStudioState.currentStage = 2;
      mockStudioState.isProductionLocked = syncResult.isLocked;
      mockStudioState.selectedTake = resolvedTake;

      const { container } = render(<Teleprompter modalityMode="scripted" />);

      expect(screen.queryByText(/NO SCRIPT TAKE SELECTED/i)).toBeNull();
      expect(container.textContent).toContain('Madhapar');
      expect(container.textContent).toContain('Kutchi and Gujarati');
    });

    it('mounts real 5-card <SelectionDeck /> visibly during re-weave review over pre-existing structuredScript', () => {
      mockStudioState.currentStage = 1;
      mockStudioState.isReviewing = true;
      mockStudioState.reviewDrafts = FIVE_FRESH_DRAFTS;

      // Resolver guarantees SelectionDeck wins over stale CinemaMonitor
      expect(
        resolveStudioActView({
          currentStage: 1,
          isReviewing: true,
          pendingDraftsCount: FIVE_FRESH_DRAFTS.length,
          hasStructuredScript: true,
        })
      ).toBe('ACT2_SELECTION_DECK');

      const onSelect = vi.fn();
      const onPreview = vi.fn();
      const onBackToEditor = vi.fn();

      const { container } = render(
        <SelectionDeck
          drafts={FIVE_FRESH_DRAFTS}
          onSelect={onSelect}
          onPreview={onPreview}
          selectedText=""
          originalHook={SAMPLE_FLOW_SCRIPT}
          onBackToEditor={onBackToEditor}
        />
      );

      expect(container.textContent).toContain('Original Polished');
      expect(container.textContent).toContain('The Soul-Print');
      expect(container.textContent).toContain('The Flow');
      expect(container.textContent).toContain('The Memory Weave');
      expect(container.textContent).toContain('Madhapar');
    });

    it('mounts real <ProductionControlBar /> and blocks advancing from unselected 5-card review until a treatment is chosen', () => {
      mockStudioState.currentStage = 1;
      mockStudioState.isReviewing = true;
      mockStudioState.selectedTake = null;
      mockStudioState.selectedVision = null;

      const onNext = vi.fn();

      const { container, rerender } = render(
        <ProductionControlBar
          currentStage={1}
          onNext={onNext}
          onPrev={vi.fn()}
          isComplete={true}
          wordCount={247}
          charge={100}
        />
      );

      const actionBtn = container.querySelector('[data-hotspot-id="HS_ENTER_STUDIO_BTN"]') as HTMLButtonElement;
      expect(actionBtn).toBeTruthy();
      expect(actionBtn).toBeDisabled();
      fireEvent.click(actionBtn);
      expect(onNext).not.toHaveBeenCalled();

      // Once narrator selects a treatment (e.g. "The Flow"), the CTA unlocks and proceeds cleanly
      mockStudioState.selectedTake = SAMPLE_FLOW_SCRIPT;
      mockStudioState.selectedVision = { type: 'flow', label: 'The Flow' };

      rerender(
        <ProductionControlBar
          currentStage={1}
          onNext={onNext}
          onPrev={vi.fn()}
          isComplete={true}
          wordCount={247}
          charge={100}
        />
      );

      const unlockedBtn = container.querySelector('[data-hotspot-id="HS_ENTER_STUDIO_BTN"]') as HTMLButtonElement;
      expect(unlockedBtn).not.toBeDisabled();
      fireEvent.click(unlockedBtn);
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });
});
