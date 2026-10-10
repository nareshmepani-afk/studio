import React, { useRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  NarrativeScriptInput,
  type NarrativeScriptInputRef,
} from '@/components/studio/shared/NarrativeScriptInput';

describe('SPEC-MW-134: NarrativeScriptInput Dual-Layer & Scribe Suite', () => {
  describe('1. Dual-Layer Zero-Drift Geometry & Extension Shields', () => {
    it('renders dual-layer CSS grid overlay with transparent interactive textarea atop highlight layer', () => {
      const handleChange = vi.fn();
      render(
        <NarrativeScriptInput
          value="Looking back, the ringing temple bells echoed across the misty courtyard."
          onChange={handleChange}
          typography="serif"
          placeholder="Type your story here..."
          dataTestId="test-narrative-editor"
        />
      );

      const textarea = screen.getByTestId('test-narrative-editor') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toContain('ringing temple bells');

      // Assert underlying highlight layer is mounted with aria-hidden
      const highlightLayer = screen.getByTestId('narrative-script-input-highlight-layer');
      expect(highlightLayer).toBeInTheDocument();
      expect(highlightLayer).toHaveAttribute('aria-hidden', 'true');

      // Assert extension shields
      expect(textarea).toHaveAttribute('data-enable-grammarly', 'false');
      expect(textarea).toHaveAttribute('data-gramm', 'false');
      expect(textarea).toHaveAttribute('spellcheck', 'true');
    });

    it('does not duplicate placeholder in highlight layer when value is empty', () => {
      render(
        <NarrativeScriptInput
          value=""
          onChange={() => {}}
          placeholder="Type your story here..."
          dataTestId="test-empty-editor"
        />
      );

      const textarea = screen.getByTestId('test-empty-editor') as HTMLTextAreaElement;
      expect(textarea.placeholder).toBe('Type your story here...');

      // Invariant: highlight layer MUST NOT render the placeholder to prevent doubled-up text bug
      const highlightLayer = screen.getByTestId('narrative-script-input-highlight-layer');
      expect(highlightLayer.textContent).toBe('');
    });

    it('detects sensory anchors and applies Rule 48 chromatic token underlines', () => {
      render(
        <NarrativeScriptInput
          value="The sound of ringing bells, the emerald green dawn, and the aroma of morning chai."
          onChange={() => {}}
          typography="serif"
          dataTestId="test-chroma-editor"
        />
      );

      const highlightLayer = screen.getByTestId('narrative-script-input-highlight-layer');

      // Soundscape anchor has sky blue styling
      const soundscapeSpan = highlightLayer.querySelector('[data-anchor-modality="soundscape"]');
      expect(soundscapeSpan).toBeInTheDocument();
      expect(soundscapeSpan?.className).toContain('border-sky-400');

      // Visual anchor has emerald styling
      const visualSpan = highlightLayer.querySelector('[data-anchor-modality="visual"]');
      expect(visualSpan).toBeInTheDocument();
      expect(visualSpan?.className).toContain('border-emerald-400');

      // Aroma anchor has amber styling
      const aromaSpan = highlightLayer.querySelector('[data-anchor-modality="aroma"]');
      expect(aromaSpan).toBeInTheDocument();
      expect(aromaSpan?.className).toContain('border-amber-400');
    });
  });

  describe('2. Imperative Ref Contract', () => {
    it('exposes pulseAndSelectWord selecting textarea caret range', () => {
      const TestHarness = () => {
        const editorRef = useRef<NarrativeScriptInputRef | null>(null);
        return (
          <div>
            <NarrativeScriptInput
              ref={editorRef}
              value="The ringing of temple bells resonated deeply."
              onChange={() => {}}
              dataTestId="harness-textarea"
            />
            <button
              type="button"
              data-testid="trigger-pulse-btn"
              onClick={() => editorRef.current?.pulseAndSelectWord('ringing', 'soundscape')}
            >
              Pulse Ringing
            </button>
          </div>
        );
      };

      render(<TestHarness />);
      const textarea = screen.getByTestId('harness-textarea') as HTMLTextAreaElement;
      const pulseBtn = screen.getByTestId('trigger-pulse-btn');

      fireEvent.click(pulseBtn);

      expect(textarea.selectionStart).toBe(4); // Index of "ringing"
      expect(textarea.selectionEnd).toBe(11);
    });

    it('inserts cadence markers at cursor position via insertCadenceMarker', () => {
      let currentValue = 'Looking back forty years ago I remember.';
      const TestHarness = () => {
        const editorRef = useRef<NarrativeScriptInputRef | null>(null);
        return (
          <div>
            <NarrativeScriptInput
              ref={editorRef}
              value={currentValue}
              onChange={(val) => {
                currentValue = val;
              }}
              dataTestId="cadence-textarea"
            />
            <button
              type="button"
              data-testid="insert-marker-btn"
              onClick={() => editorRef.current?.insertCadenceMarker('//')}
            >
              Insert Breath
            </button>
          </div>
        );
      };

      render(<TestHarness />);
      const insertBtn = screen.getByTestId('insert-marker-btn');

      fireEvent.click(insertBtn);

      expect(currentValue).toContain('//');
    });
  });

  describe('3. Scribe Margin Integration', () => {
    it('renders Scribe Margin dock displaying 120 WPM spoken pacing and orthography notes', () => {
      const handleChange = vi.fn();
      render(
        <NarrativeScriptInput
          value="The color was vibrant and theater was magnificent."
          onChange={handleChange}
          showScribesMargin={true}
          marginVariant="dock"
        />
      );

      // Verify Scribe Margin is mounted
      const margin = screen.getByTestId('scribes-margin');
      expect(margin).toBeInTheDocument();

      // Verify Spoken Duration HUD
      const durationBadge = screen.getByTestId('scribes-margin-spoken-duration');
      expect(durationBadge).toBeInTheDocument();
      expect(durationBadge.textContent).toContain('⏱️ ~');

      // Verify Orthography note for "color" -> "colour"
      expect(screen.getByText(/UK English standard: use "colour"/)).toBeInTheDocument();
    });

    it('renders mobile drawer toggle pill when marginVariant is drawer', () => {
      render(
        <NarrativeScriptInput
          value="The color was vibrant."
          onChange={() => {}}
          marginVariant="drawer"
          showScribesMargin={false}
        />
      );

      const toggleBtn = screen.getByTestId('toggle-scribes-margin-btn');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn.textContent).toContain('✨ 1 Scribe Note');
    });
  });
});
