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
});
