import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  DEFAULT_MEMORY_LOCATION,
  DEFAULT_MEMORY_COUNTRY,
  DEFAULT_MEMORY_YEAR,
  DEFAULT_MEMORY_AGE,
  resolveSceneDefaultScriptText,
  createEmptyCurriculumMemory,
} from '@/types/curriculum';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { SensoryScriptEditor } from '@/components/studio/shared/SensoryScriptEditor';
import { MemoryCoordinatesBar } from '@/components/studio/MemoryCoordinatesBar';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';
import type { DetectedAnchor } from '@/utils/sensoryAnchors';

describe('Card 51: Cross-Surface Metadata/Default Parity & Immediate [Save Script] Sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes identical default metadata (MUNICH, GERMANY (FAMILY RESIDENCE) - GERMANY - 1984 - I WAS: 5) and default scriptText for part-6-scene-4 so Fireside never opens blank when Soundstage has defaults', () => {
    expect(DEFAULT_MEMORY_LOCATION).toBe('Munich, Germany (Family Residence)');
    expect(DEFAULT_MEMORY_COUNTRY).toBe('Germany');
    expect(DEFAULT_MEMORY_YEAR).toBe(1984);
    expect(DEFAULT_MEMORY_AGE).toBe(5);

    const defaultScript = resolveSceneDefaultScriptText('part-6-scene-4');
    expect(defaultScript).toBe(
      'The importance of reflection, revisiting older entries, and looking back.'
    );
    expect(resolveSceneDefaultScriptText('p24_1')).toBe(defaultScript);
    expect(resolveSceneDefaultScriptText('p23')).toBe(defaultScript);

    // Simulate Firestore document SCDkg0ajpYTOFH55sATU where description holds the default script and prose is empty
    const soundstageSeededMemory = {
      ...createEmptyCurriculumMemory({
        id: 'SCDkg0ajpYTOFH55sATU',
        userId: 'TQdB395kXxaAGPhFxk1LVWuT8cg2',
        sceneId: 'part-6-scene-4',
        partNumber: 6,
        sceneNumber: 4,
        sceneTitle: 'The Story Continues',
        originSurface: 'desktop_soundstage',
      }),
      prose: '',
      description: 'The importance of reflection, revisiting older entries, and looking back.',
      originalHook: 'The importance of reflection, revisiting older entries, and looking back.',
    };

    const part6Scene4Spark =
      FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === 'part-6-scene-4') ||
      FIRESIDE_PROMPT_SPARKS[FIRESIDE_PROMPT_SPARKS.length - 1];

    render(
      <SingleCardPromptCarousel
        prompts={[part6Scene4Spark]}
        initialPromptId={part6Scene4Spark.id}
        activePromptId={part6Scene4Spark.id}
        activeSceneMemory={soundstageSeededMemory}
        getSceneMemory={() => soundstageSeededMemory}
      />
    );

    expect(screen.getByTestId('fireside-meta-city').textContent).toBe(
      'MUNICH, GERMANY (FAMILY RESIDENCE)'
    );
    expect(screen.getByTestId('fireside-meta-country').textContent).toBe('GERMANY');
    expect(screen.getByTestId('fireside-meta-year').textContent).toBe('1984');
    expect(screen.getByTestId('fireside-meta-age').textContent).toBe('I WAS: 5');

    const activeScriptBody = screen.getByTestId('fireside-active-script-body');
    expect(activeScriptBody.textContent).toContain(
      'The importance of reflection, revisiting older entries, and looking back.'
    );
  });

  it('immediately syncs script edits and sensory anchors to live Soundstage editor when clicking [ Save Script ] in Fireside across unified document IDs (SCDkg0ajpYTOFH55sATU / part-6-scene-4)', async () => {
    const onSaveProseMock = vi.fn();
    const initialText =
      'The importance of reflection, revisiting older entries, and looking back.';

    const unifiedMemory = createEmptyCurriculumMemory({
      id: 'SCDkg0ajpYTOFH55sATU',
      userId: 'TQdB395kXxaAGPhFxk1LVWuT8cg2',
      sceneId: 'part-6-scene-4',
      partNumber: 6,
      sceneNumber: 4,
      sceneTitle: 'The Story Continues',
      originSurface: 'desktop_soundstage',
      prose: initialText,
      description: initialText,
    });

    const part6Scene4Spark =
      FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === 'part-6-scene-4') ||
      FIRESIDE_PROMPT_SPARKS[FIRESIDE_PROMPT_SPARKS.length - 1];

    function DualSurfaceHarness() {
      const [soundstageValue, setSoundstageValue] = useState(initialText);
      const [anchors, setAnchors] = useState<DetectedAnchor[]>([]);

      return (
        <div>
          <SingleCardPromptCarousel
            prompts={[part6Scene4Spark]}
            initialPromptId={part6Scene4Spark.id}
            activePromptId={part6Scene4Spark.id}
            activeSceneMemory={unifiedMemory}
            getSceneMemory={() => unifiedMemory}
            onSaveProse={onSaveProseMock}
          />
          <div data-testid="soundstage-live-surface">
            <SensoryScriptEditor
              value={soundstageValue}
              onChange={setSoundstageValue}
              syncSceneId="SCDkg0ajpYTOFH55sATU"
              dataTestId="soundstage-editor-textarea"
              onDetectedAnchorsChange={setAnchors}
            />
            <span data-testid="soundstage-anchor-count">{anchors.length}</span>
          </div>
        </div>
      );
    }

    render(<DualSurfaceHarness />);

    // Open Fireside inline script editor
    const editBtn = screen.getByTestId('HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN');
    fireEvent.click(editBtn);

    const firesideTextarea = screen.getByTestId('HS_FIRESIDE_SCRIPT_TEXTAREA') as HTMLTextAreaElement;
    const updatedProse =
      'Theimportance of reflection, revisiting older entries, and looking back with the aroma of coffee, golden sunlight, and soft music.';

    fireEvent.change(firesideTextarea, { target: { value: updatedProse } });

    // Click [ ✓ Save Script ] in Fireside
    const saveBtn = screen.getByTestId('HS_FIRESIDE_SAVE_SCRIPT_BTN');
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(onSaveProseMock).toHaveBeenCalledWith('part-6-scene-4', updatedProse);

    // Soundstage editor bound to SCDkg0ajpYTOFH55sATU must immediately reflect the saved prose and sensory anchors
    const soundstageTextarea = screen.getByTestId('soundstage-editor-textarea') as HTMLTextAreaElement;
    expect(soundstageTextarea.value).toBe(updatedProse);
    expect(Number(screen.getByTestId('soundstage-anchor-count').textContent)).toBeGreaterThan(0);
  });

  it('renders extracted MemoryCoordinatesBar with full interactive controls and age stepper', () => {
    let loc = 'Munich, Germany (Family Residence)';
    let country = 'Germany';
    let year = '1984';
    let age = 5;

    const onChangeLoc = vi.fn((v) => { loc = v; });
    const onChangeCountry = vi.fn((v) => { country = v; });
    const onChangeAge = vi.fn((v) => { age = v; });

    const { rerender } = render(
      <MemoryCoordinatesBar
        location={loc}
        country={country}
        day="1"
        month="1"
        year={year}
        narratorAgeAtTime={age}
        onChangeLocation={onChangeLoc}
        onChangeCountry={onChangeCountry}
        onChangeDay={vi.fn()}
        onChangeMonth={vi.fn()}
        onChangeYear={vi.fn()}
        onChangeAge={onChangeAge}
        variant="soundstage"
      />
    );

    expect(screen.getByTestId('memory-coordinates-bar')).toBeDefined();
    const cityInput = screen.getByTestId('memory-coordinates-city') as HTMLInputElement;
    expect(cityInput.value).toBe('Munich, Germany (Family Residence)');

    const countryInput = screen.getByTestId('memory-coordinates-country') as HTMLInputElement;
    expect(countryInput.value).toBe('Germany');

    // Test age stepper plus button
    const plusBtn = screen.getByTestId('memory-mark-age-plus');
    fireEvent.click(plusBtn);
    expect(onChangeAge).toHaveBeenCalledWith(6);

    // Test age stepper minus button
    const minusBtn = screen.getByTestId('memory-mark-age-minus');
    fireEvent.click(minusBtn);
    expect(onChangeAge).toHaveBeenCalledWith(4);
  });

  it('Guard 1: hydrates default coordinates and scriptText for part-6-scene-4 without opening blank', () => {
    const memory = createEmptyCurriculumMemory({
      id: 'SCDkg0ajpYTOFH55sATU',
      userId: 'test_user',
      sceneId: 'part-6-scene-4',
      partNumber: 6,
      sceneNumber: 4,
      sceneTitle: 'The Story Continues',
      originSurface: 'fireside_mobile',
      prose: resolveSceneDefaultScriptText('part-6-scene-4'),
      description: resolveSceneDefaultScriptText('part-6-scene-4'),
    });

    expect(memory.location).toBe('Munich, Germany (Family Residence)');
    expect(memory.country).toBe('Germany');
    expect(memory.year).toBe(1984);
    expect(memory.narratorAgeAtTime).toBe(5);
    expect(memory.prose).toBe('The importance of reflection, revisiting older entries, and looking back.');
  });
});
