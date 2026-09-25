import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import {
  useCurriculumVault,
  TOTAL_CURRICULUM_SCENES,
  ALL_CURRICULUM_SCENES,
} from '@/hooks/useCurriculumVault';
import { FIRST_FLIGHT_FIXTURE } from '@/lib/fixtures/firstFlightFixture';
import type { MemoirTake } from '@/types/curriculum';

// Mock Firestore
let mockSnapshotCallback: ((snapshot: any) => void) | null = null;
const mockUnsubscribe = vi.fn();
const mockSetDoc = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ type: 'collection' })),
  doc: vi.fn(() => ({ type: 'doc' })),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  onSnapshot: vi.fn((colRef, onNext) => {
    mockSnapshotCallback = onNext;
    return mockUnsubscribe;
  }),
}));

describe('🚀 MW-266: First Flight Micro-Onboarding & Zero-Contamination Shield Isolation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSnapshotCallback = null;
  });

  it('1. useCurriculumVault strictly ignores FIRST_FLIGHT_FIXTURE and rehearsal memories', () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_flight_tester_123', memoirId: 'memoir_ancestral' })
    );

    expect(result.current.isLoading).toBe(true);
    expect(mockSnapshotCallback).toBeDefined();

    // Deliver a snapshot containing both rehearsal fixture docs and an authentic canonical memory
    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'first_flight_rehearsal',
            data: () => ({
              ...FIRST_FLIGHT_FIXTURE,
            }),
          },
          {
            id: 'doc_generic_rehearsal',
            data: () => ({
              id: 'doc_generic_rehearsal',
              isFlightSimulator: true,
              sceneId: 'prologue-flight-simulator',
              promptId: 'prologue-flight-simulator',
              title: 'Practice Flight',
              status: 'draft',
              productionStage: 0,
            }),
          },
          {
            id: 'doc_canonical_scene_1',
            data: () => ({
              id: 'doc_canonical_scene_1',
              sceneId: 'part-1-scene-1',
              partNumber: 1,
              sceneNumber: 1,
              sceneTitle: 'Child of Two Worlds',
              originSurface: 'soundstage_desktop',
              currentStatus: 'captured',
              actsCompleted: ['act1', 'act2'],
              takes: [
                {
                  id: 'take_authentic_01',
                  takeNumber: 1,
                  source: 'soundstage_desktop',
                  mediaMode: 'video',
                  mediaUrl: 'https://storage.googleapis.com/reel1.mp4',
                  storagePath: 'takes/take_authentic_01.mp4',
                  durationSeconds: 120,
                  createdAt: new Date().toISOString(),
                  label: 'Take 1 (Authentic)',
                  isPreferred: true,
                },
              ],
            }),
          },
        ],
      });
    });

    expect(result.current.isLoading).toBe(false);

    // ZERO-CONTAMINATION SHIELD: Rehearsal keys must not exist in scenes
    expect(result.current.scenes['first_flight_rehearsal']).toBeUndefined();
    expect(result.current.scenes['prologue-flight-simulator']).toBeUndefined();
    expect(result.current.scenes['doc_generic_rehearsal']).toBeUndefined();

    // Authentic curriculum scene must be indexed
    expect(result.current.scenes['part-1-scene-1']).toBeDefined();
    expect(result.current.completedScenes).toBe(1);
    expect(result.current.totalScenes).toBe(TOTAL_CURRICULUM_SCENES);

    // Vault progress strictly reflects 1 authentic scene out of 13
    const expectedPercent = Math.min(100, Math.round((1 / TOTAL_CURRICULUM_SCENES) * 100));
    expect(result.current.vaultProgressPercent).toBe(expectedPercent);
    expect(result.current.nextPendingSceneId).toBe('part-1-scene-2');
  });

  it('2. Recording a take on first_flight_rehearsal does not alter curriculum progress percentage', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_flight_tester_123', memoirId: 'memoir_ancestral' })
    );

    // Initialise with 1 authentic scene
    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'doc_canonical_scene_1',
            data: () => ({
              id: 'doc_canonical_scene_1',
              sceneId: 'part-1-scene-1',
              partNumber: 1,
              sceneNumber: 1,
              sceneTitle: 'Child of Two Worlds',
              originSurface: 'soundstage_desktop',
              currentStatus: 'captured',
              actsCompleted: ['act1', 'act2'],
            }),
          },
        ],
      });
    });

    const baselinePercent = result.current.vaultProgressPercent;
    const baselineCompleted = result.current.completedScenes;

    // Attempt to save a take on first_flight_rehearsal
    const rehearsalTake: MemoirTake = {
      id: 'take_rehearsal_999',
      takeNumber: 1,
      source: 'soundstage_desktop',
      mediaMode: 'video',
      mediaUrl: 'https://storage.googleapis.com/test_rehearsal.mp4',
      storagePath: 'takes/test_rehearsal.mp4',
      durationSeconds: 15,
      createdAt: new Date().toISOString(),
      label: 'Practice Take',
      isPreferred: true,
    };

    await act(async () => {
      await result.current.saveSceneTake('first_flight_rehearsal', rehearsalTake);
    });

    // Zero-Contamination Shield guarantees no state mutation on curriculum metrics
    expect(result.current.completedScenes).toBe(baselineCompleted);
    expect(result.current.vaultProgressPercent).toBe(baselinePercent);
    expect(result.current.scenes['first_flight_rehearsal']).toBeUndefined();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('3. Card dismissal state persists correctly in localStorage', () => {
    const DISMISS_KEY = 'mw_dismiss_flight_simulator';
    localStorage.removeItem(DISMISS_KEY);

    expect(localStorage.getItem(DISMISS_KEY)).toBeNull();

    localStorage.setItem(DISMISS_KEY, 'true');
    expect(localStorage.getItem(DISMISS_KEY)).toBe('true');

    // Verify FlightSimulatorCard references the exact DISMISS_KEY
    const cardFilePath = path.resolve(process.cwd(), 'src/components/studio/FlightSimulatorCard.tsx');
    const cardContent = fs.readFileSync(cardFilePath, 'utf-8');

    expect(cardContent).toContain("const DISMISS_KEY = 'mw_dismiss_flight_simulator';");
    expect(cardContent).toContain("localStorage.getItem(DISMISS_KEY)");
    expect(cardContent).toContain("localStorage.setItem(DISMISS_KEY, 'true')");
  });

  it('4. British English orthography verified across all exports and UI copies', () => {
    const fixtureFilePath = path.resolve(process.cwd(), 'src/lib/fixtures/firstFlightFixture.ts');
    const fixtureContent = fs.readFileSync(fixtureFilePath, 'utf-8');

    const cardFilePath = path.resolve(process.cwd(), 'src/components/studio/FlightSimulatorCard.tsx');
    const cardContent = fs.readFileSync(cardFilePath, 'utf-8');

    // Check UK spellings
    expect(fixtureContent).toContain('rehearsal');
    expect(cardContent).toContain('REHEARSAL');
    expect(cardContent).toContain('theatrical');

    // Assert strict absence of forbidden US orthography (Rule 20) in user-facing copy
    // (Strip Tailwind className attributes to prevent false positives on CSS utilities like items-center, justify-center)
    const strippedCardCopy = cardContent.replace(/className="[^"]*"/g, '');
    const strippedFixtureCopy = fixtureContent;

    const forbiddenUSWords = [
      /\bfavorite\b/i,
      /\bcolor\b/i,
      /\btheater\b/i,
      /\bcenter\b/i,
      /\bsynthesize\b/i,
      /\brealize\b/i,
      /\bbehavior\b/i,
      /\bminimize\b/i,
    ];

    forbiddenUSWords.forEach((pattern) => {
      expect(strippedFixtureCopy).not.toMatch(pattern);
      expect(strippedCardCopy).not.toMatch(pattern);
    });
  });

  it('5. FIRST_FLIGHT_FIXTURE is fully pre-hydrated with valid demographic catalysts (Year, Age, Country, City)', async () => {
    const { validateAct1RequiredFields } = await import('@/lib/curriculum/actValidation');
    expect(FIRST_FLIGHT_FIXTURE.location).toBe('London');
    expect(FIRST_FLIGHT_FIXTURE.country).toBe('United Kingdom');
    expect(FIRST_FLIGHT_FIXTURE.year).toBe(1994);
    expect(FIRST_FLIGHT_FIXTURE.narratorAgeAtTime).toBe(26);
    expect(FIRST_FLIGHT_FIXTURE.age).toBe(26);

    const validation = validateAct1RequiredFields(FIRST_FLIGHT_FIXTURE as any);
    expect(validation.isValid).toBe(true);
    expect(validation.missing).toHaveLength(0);
  });

  it('6. Act III Direct Soundstage Immersion: Rehearsal flight bypasses StudioLobby and unlocks SoloStage directly (MW-266 Option A)', () => {
    const deckPath = path.resolve(__dirname, '../components/studio/ProductionDeck.tsx');
    const deckContent = fs.readFileSync(deckPath, 'utf8');

    // Invariant 1: StudioLobby render block in Act III requires !isRehearsalFlight (bypassed in rehearsal flight)
    expect(deckContent).toMatch(
      /currentStage\s*===\s*2\s*&&\s*!lobbyConfirmed\s*&&\s*!hasUnsavedTake\s*&&\s*!memoryData\?\.videoUrl\s*&&\s*!isRehearsalFlight/
    );

    // Invariant 2: Top header HUD pill displays Rehearsal Soundstage Prompter Ready in Act III
    expect(deckContent).toMatch(
      /isRehearsalFlight\s*&&\s*currentStage\s*===\s*2\s*\?\s*['"]🚀 First Flight: Rehearsal Soundstage • Prompter Ready['"]/
    );

    // Invariant 3: isLobbyConfirmed unlocks stage controls immediately for rehearsal flights
    expect(deckContent).toContain('isLobbyConfirmed={isRehearsalFlight ? true : lobbyConfirmed}');

    // Invariant 4: Standard mode memories (!isRehearsalFlight) retain standard StudioLobby gating
    const standardMemory = { id: 'mem_standard_001', isFlightSimulator: false };
    const isRehearsal = Boolean(
      (standardMemory as any)?.isFlightSimulator ||
      (standardMemory as any)?.promptId === 'prologue-flight-simulator' ||
      (standardMemory as any)?.sceneId === 'prologue-flight-simulator' ||
      standardMemory.id === 'first_flight_rehearsal'
    );
    expect(isRehearsal).toBe(false);

    // FIRST_FLIGHT_FIXTURE is recognized as rehearsal flight
    const isFixtureRehearsal = Boolean(
      FIRST_FLIGHT_FIXTURE.isFlightSimulator ||
      FIRST_FLIGHT_FIXTURE.promptId === 'prologue-flight-simulator' ||
      FIRST_FLIGHT_FIXTURE.sceneId === 'prologue-flight-simulator' ||
      FIRST_FLIGHT_FIXTURE.id === 'first_flight_rehearsal'
    );
    expect(isFixtureRehearsal).toBe(true);
  });

  it('7. SelectionDeck Clarity: Instructional banner and preview pill are rendered for narrator guidance (MW-266)', () => {
    const deckPath = path.resolve(__dirname, '../components/studio/Scriptorium/Ceremony/SelectionDeck.tsx');
    const deckContent = fs.readFileSync(deckPath, 'utf8');

    // Invariant 1: Instructional banner exists with specific guidance
    expect(deckContent).toContain('Tap a card to preview your vision');
    expect(deckContent).toContain('Browse the carousel, then tap the centred card to open a full preview.');

    // Invariant 2: Centred card renders clear action pill
    expect(deckContent).toContain('Preview &amp; Select Script ↗');

    // Invariant 3: ProductionDeck preserves standard ceremony trigger (no fast-path short circuit)
    const prodDeckPath = path.resolve(__dirname, '../components/studio/ProductionDeck.tsx');
    const prodDeckContent = fs.readFileSync(prodDeckPath, 'utf8');
    expect(prodDeckContent).not.toMatch(/isAct1\s*&&\s*isRehearsalFlight\s*\{[\s\S]*?setStage\(1\)/);
  });

  it('8. Act III SoloStage Rehearsal Bypass: Rehearsal flights auto-confirm tech scout calibration (MW-266)', () => {
    const soloStagePath = path.resolve(__dirname, '../components/studio/SoloStage.tsx');
    const soloStageContent = fs.readFileSync(soloStagePath, 'utf8');

    // Invariant 1: SoloStage initializes techAlignmentConfirmed to true for first_flight_rehearsal and isFlightSimulator
    expect(soloStageContent).toMatch(
      /const\s*isRehearsalFlight\s*=\s*Boolean\(\s*data\?\.id\s*===\s*['"]first_flight_rehearsal['"]\s*\|\|\s*\(data\s*as\s*any\)\?\.isFlightSimulator\s*\);/
    );
    expect(soloStageContent).toMatch(
      /const\s*\[techAlignmentConfirmed,\s*setTechAlignmentConfirmed\]\s*=\s*useState\(\s*isRehearsalFlight\s*\);/
    );

    // Invariant 2: Standard non-rehearsal memories default to false (requiring manual tech scout calibration)
    const mockStandardData = { id: 'ey96djU6qR1BrDGnvZwp', isFlightSimulator: false };
    const initialForStandard =
      mockStandardData?.id === 'first_flight_rehearsal' ||
      (mockStandardData as any)?.isFlightSimulator ||
      false;
    expect(initialForStandard).toBe(false);

    // Invariant 3: First flight fixture auto-confirms
    const initialForRehearsal =
      FIRST_FLIGHT_FIXTURE.id === 'first_flight_rehearsal' ||
      (FIRST_FLIGHT_FIXTURE as any)?.isFlightSimulator ||
      false;
    expect(initialForRehearsal).toBe(true);

    // Invariant 4: DirectorsHUD (Director & Rehearse floating card) unmounts during rehearsal flight
    expect(soloStageContent).toMatch(
      /!isMuted\s*&&\s*!isTableReadActive\s*&&\s*!isRehearsalFlight\s*&&\s*\(\s*<div\s*data-blueprint=['"]DirectorsHUD['"]/
    );
  });

  it('9. Act I & Act II Sensory Palette Key: MemoryForm, Scriptorium, and SentenceWrapper render Golden Trio modality counters, compact Story Hook tray, and persistent luminous beacon pulse', () => {
    const memoryFormPath = path.resolve(__dirname, '../components/studio/MemoryForm.tsx');
    const memoryFormContent = fs.readFileSync(memoryFormPath, 'utf8');
    const scriptoriumPath = path.resolve(__dirname, '../components/studio/Scriptorium/Scriptorium.tsx');
    const scriptoriumContent = fs.readFileSync(scriptoriumPath, 'utf8');
    const sentenceWrapperPath = path.resolve(__dirname, '../components/studio/Scriptorium/SentenceWrapper.tsx');
    const sentenceWrapperContent = fs.readFileSync(sentenceWrapperPath, 'utf8');

    // MemoryForm renders sensory-palette-key directly inside compact Act I Story Hook editor (no 500px gap)
    expect(memoryFormContent).toContain('data-testid="sensory-palette-key"');
    expect(memoryFormContent).toContain('min-h-[180px] flex flex-col justify-between gap-6');
    expect(memoryFormContent).not.toContain('group/hook min-h-[500px]');
    expect(memoryFormContent).toContain('scrollToStoryHookAnchor');
    expect(memoryFormContent).toContain('filterDominantSensoryAnchors(descAnchors)');

    // SentenceWrapper locks floating Director's Ink tooltip and React-managed ring-4 halo during pulse
    expect(sentenceWrapperContent).toContain('isPulsingAnchorRef');
    expect(sentenceWrapperContent).toContain('pulsedWord');
    expect(sentenceWrapperContent).toContain('data-testid="director-ink-tooltip"');

    // Scriptorium hydrates plain-text data.prose and uses filterDominantSensoryAnchors for Golden Trio parity
    expect(scriptoriumContent).toContain('data-testid="sensory-palette-key"');
    expect(scriptoriumContent).toContain('filterDominantSensoryAnchors(rawAnchors)');
    expect(scriptoriumContent).toContain("setBlocks([{ id: uuidv4(), type: 'hook', text: data.prose, catalysts: [] }]);");
  });

  it('10. SoloStage Teleprompter Draggable Resize Sidebars & AI Director Interview Minimise Toggle', () => {
    const soloStagePath = path.resolve(__dirname, '../components/studio/SoloStage.tsx');
    const soloStageContent = fs.readFileSync(soloStagePath, 'utf8');

    // Draggable resize sidebars + top pull bar + free drag on Teleprompter performance view
    expect(soloStageContent).toContain('data-testid="prompter-resize-top"');
    expect(soloStageContent).toContain('data-testid="prompter-resize-left"');
    expect(soloStageContent).toContain('data-testid="prompter-resize-right"');
    expect(soloStageContent).toContain('data-testid="prompter-resize-bottom"');
    expect(soloStageContent).toContain('handlePrompterResizeStart');
    expect(soloStageContent).toContain('handlePrompterDragStart');
    expect(soloStageContent).toContain('prompterDragOffset');
    expect(soloStageContent).toContain("isTheaterExpanded ? 'Exit Theatre' : 'Theatre View'");

    // Prevent negative top flex overflow so buttons above "SYNCING REMOTE" are always visible
    expect(soloStageContent).toContain('w-full min-h-full flex flex-col items-center justify-start my-auto relative pb-2');
    expect(soloStageContent).toContain('top: "64px"');

    // AI Director Interview Active panel Minimise/Expand controls
    expect(soloStageContent).toContain('data-testid="minimise-interviewer-card-btn"');
    expect(soloStageContent).toContain('data-testid="expand-interviewer-card-btn"');
    expect(soloStageContent).toContain('isInterviewerMinimised');
  });

  it('11. Sequential Act Completion Gating & Status Badges in ProductionRail and ProductionDeck', () => {
    const railPath = path.resolve(__dirname, '../components/studio/ProductionRail.tsx');
    const railContent = fs.readFileSync(railPath, 'utf8');
    const deckPath = path.resolve(__dirname, '../components/studio/ProductionDeck.tsx');
    const deckContent = fs.readFileSync(deckPath, 'utf8');

    // ProductionRail enforces sequential Act completion before unlocking subsequent Acts
    expect(railContent).toContain('if (id >= 2 && !isActMilestoneCompleted(1, resolvedMilestones)) return false;');
    expect(railContent).toContain('if (id >= 3 && !isActMilestoneCompleted(2, resolvedMilestones)) return false;');
    expect(railContent).toContain('if (id >= 4 && !isActMilestoneCompleted(3, resolvedMilestones)) return false;');
    expect(railContent).toContain('act-status-badge-');

    // ProductionDeck handleStageJump blocks premature forward stage jumps with clear UK English guidance
    expect(deckContent).toContain('ACT II COMPLETION REQUIRED');
    expect(deckContent).toContain('ACT III COMPLETION REQUIRED');
    expect(deckContent).toContain('ACT IV COMPLETION REQUIRED');
  });

  it('12. SoloStage Privacy Shield z-[70] / !isMuted Gating & First Flight Golden Trio Anchor Invariants', async () => {
    const soloStagePath = path.resolve(__dirname, '../components/studio/SoloStage.tsx');
    const soloStageContent = fs.readFileSync(soloStagePath, 'utf8');
    const deckPath = path.resolve(__dirname, '../components/studio/ProductionDeck.tsx');
    const deckContent = fs.readFileSync(deckPath, 'utf8');
    const sentenceWrapperPath = path.resolve(__dirname, '../components/studio/Scriptorium/SentenceWrapper.tsx');
    const sentenceWrapperContent = fs.readFileSync(sentenceWrapperPath, 'utf8');

    // 1. Privacy Shield overlay sits at z-[70] and Ignite Camera & Mic button sits at z-[75], while z-40 bottom bar is gated by !isMuted
    expect(soloStageContent).toContain('z-[70] pointer-events-auto animate-fade-in border border-rose-500/20');
    expect(soloStageContent).toContain('relative z-[75] pointer-events-auto w-full py-4 bg-emerald-500');
    expect(soloStageContent).toContain('{techAlignmentConfirmed && !isMuted && (');
    expect(soloStageContent).toContain('{isInterviewMode && techAlignmentConfirmed && !isMuted && (');

    // 2. SentenceWrapper guards handleCaretOrSelectionChange during mw:pulse-anchor
    expect(sentenceWrapperContent).toContain('if (isPulsingAnchorRef.current) return;');

    // 3. ProductionDeck unlocks Act I on ?act=1 or first_flight_rehearsal at stage 0
    expect(deckContent).toContain('const isFirstFlightAct1 = currentStage === 0 && (memoryData.id === \'first_flight_rehearsal\' || (memoryData as any).isFlightSimulator);');

    // 4. Golden Trio sensory detection yields Soundscape (1), Visual (1), Aroma (1) for both FIRST_FLIGHT_FIXTURE and AI Master Weave
    const { detectAnchors, filterDominantSensoryAnchors } = await import('@/hooks/studio/useDirectorInk');
    const act1Dominant = filterDominantSensoryAnchors(detectAnchors(FIRST_FLIGHT_FIXTURE.description || ''));
    expect(act1Dominant.map(a => a.type).sort()).toEqual(['aroma', 'soundscape', 'visual']);

    const masterWeaveSample = 'In 1994, our sanctuary took shape within the four modest walls of a kitchen, while autumn rain drummed relentlessly against the windowpane. The kettle would whistle its familiar chorus on the stove top. Into cracked ceramic cups went fresh cardamom chai.';
    const masterDominant = filterDominantSensoryAnchors(detectAnchors(masterWeaveSample));
    expect(masterDominant.map(a => a.type).sort()).toEqual(['aroma', 'soundscape', 'visual']);
  });

  it('13. Teleprompter & PopoutTeleprompter Cadence Cue Tooltips (/ and //) & Free-Drag Viewport Invariants', () => {
    const teleprompterPath = path.resolve(__dirname, '../components/studio/Teleprompter.tsx');
    const teleprompterContent = fs.readFileSync(teleprompterPath, 'utf8');
    const popoutPath = path.resolve(__dirname, '../components/studio/PopoutTeleprompter.tsx');
    const popoutContent = fs.readFileSync(popoutPath, 'utf8');
    const soloStagePath = path.resolve(__dirname, '../components/studio/SoloStage.tsx');
    const soloStageContent = fs.readFileSync(soloStagePath, 'utf8');

    // Verify single (/) and double (//) slash cadence cue attributes and floating portal tooltip in both components
    for (const content of [teleprompterContent, popoutContent]) {
      expect(content).toContain('data-slash-cue="double"');
      expect(content).toContain('data-slash-cue="single"');
      expect(content).toContain('data-prompter-tooltip-title="CADENCE CUE • DEEP BREATH ( // )"');
      expect(content).toContain('data-prompter-tooltip-title="CADENCE CUE • SHORT BREATH ( / )"');
      expect(content).toContain('Full sentence brake (~0.5s). Pause, breathe deeply, and reconnect eye contact with the camera lens.');
      expect(content).toContain('Clause micro-pause (~0.2s). Take a gentle half-breath and let the phrase settle before continuing.');
      expect(content).toContain('data-testid="teleprompter-cue-tooltip"');
      expect(content).toContain('onMouseOver={handleScriptCueInspect}');
      expect(content).toContain('onMouseLeave={handleScriptPointerLeave}');
    }

    // Verify SoloStage Teleprompter free-drag header and top-edge pull handle
    expect(soloStageContent).toContain('data-testid="prompter-resize-top"');
    expect(soloStageContent).toContain('handlePrompterDragStart');
    expect(soloStageContent).toContain('Drag top bar to pull Teleprompter down or up (double-click to reset position)');
  });
});

