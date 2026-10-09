import React, { useRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  SensoryScriptEditor,
  type SensoryScriptEditorRef,
} from '@/components/studio/shared/SensoryScriptEditor';
import { SensoryModalityKey } from '@/components/studio/shared/SensoryModalityKey';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import type { DetectedAnchor } from '@/utils/sensoryAnchors';

describe('ARCH-MW-132 & Rule 48: Shared Narrative Primitives & Cross-Surface Parity', () => {
  describe('1. SensoryScriptEditor Dual-Layer Primitive', () => {
    it('renders dual-layer CSS grid overlay with transparent interactive textarea atop highlight layer', () => {
      const handleChange = vi.fn();
      render(
        <SensoryScriptEditor
          value="Looking back, the ringing temple bells echoed across the misty courtyard."
          onChange={handleChange}
          typography="serif"
          placeholder="Type your story here..."
          dataTestId="test-sensory-editor"
        />
      );

      const textarea = screen.getByTestId('test-sensory-editor') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toContain('ringing temple bells');

      // Assert underlying highlight layer is mounted
      const highlightLayer = screen.getByTestId('sensory-script-editor-highlight-layer');
      expect(highlightLayer).toBeInTheDocument();
      expect(highlightLayer).toHaveAttribute('aria-hidden', 'true');
    });

    it('detects sensory anchors and applies Rule 48 chromatic token underlines', () => {
      render(
        <SensoryScriptEditor
          value="The sound of ringing bells, the emerald green dawn, and the aroma of morning chai."
          onChange={() => {}}
          typography="serif"
          dataTestId="test-chroma-editor"
        />
      );

      const highlightLayer = screen.getByTestId('sensory-script-editor-highlight-layer');

      // Soundscape anchor (e.g. bells / sound / ringing) has sky blue styling
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

    it('exposes imperative ref contract with pulseAndSelectWord selecting textarea caret range', () => {
      const TestHarness = () => {
        const editorRef = useRef<SensoryScriptEditorRef | null>(null);
        return (
          <div>
            <SensoryScriptEditor
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

      // Caret selection range encompasses the target word "ringing"
      expect(textarea.selectionStart).toBe(textarea.value.indexOf('ringing'));
      expect(textarea.selectionEnd).toBe(textarea.value.indexOf('ringing') + 'ringing'.length);

      // Highlight layer receives pulse styling
      const highlightLayer = screen.getByTestId('sensory-script-editor-highlight-layer');
      const pulsedSpan = highlightLayer.querySelector('.ring-sky-400');
      expect(pulsedSpan).toBeInTheDocument();
    });

    it('enforces British English lang="en-GB" on the interactive textarea by default', () => {
      render(
        <SensoryScriptEditor
          value=""
          onChange={() => {}}
          dataTestId="lang-check-textarea"
        />
      );

      const textarea = screen.getByTestId('lang-check-textarea');
      expect(textarea).toHaveAttribute('lang', 'en-GB');
    });
  });

  describe('2. SensoryModalityKey Primitive', () => {
    const mockAnchors: DetectedAnchor[] = [
      { word: 'bells', type: 'soundscape' },
      { word: 'crimson', type: 'visual' },
      { word: 'cardamom', type: 'aroma' },
    ];

    it('renders accurate counts for each sensory modality', () => {
      render(
        <SensoryModalityKey
          detectedAnchors={mockAnchors}
          testIdPrefix="test-key"
        />
      );

      expect(screen.getByTestId('test-key-soundscape')).toHaveTextContent('Soundscape (1)');
      expect(screen.getByTestId('test-key-visual')).toHaveTextContent('Visual (1)');
      expect(screen.getByTestId('test-key-aroma')).toHaveTextContent('Aroma (1)');
    });

    it('disables modality buttons when count is zero', () => {
      const visualOnlyAnchors: DetectedAnchor[] = [
        { word: 'crimson', type: 'visual' },
      ];

      render(
        <SensoryModalityKey
          detectedAnchors={visualOnlyAnchors}
          testIdPrefix="test-zero-key"
        />
      );

      expect(screen.getByTestId('test-zero-key-soundscape')).toBeDisabled();
      expect(screen.getByTestId('test-zero-key-visual')).toBeEnabled();
      expect(screen.getByTestId('test-zero-key-aroma')).toBeDisabled();
    });

    it('delegates anchor clicks to editorRef.pulseAndSelectWord and onAnchorClick callback', () => {
      const handleAnchorClick = vi.fn();
      const mockEditorRef = {
        current: {
          pulseAndSelectWord: vi.fn(),
          focus: vi.fn(),
          getTextarea: vi.fn(),
        },
      };

      render(
        <SensoryModalityKey
          editorRef={mockEditorRef}
          detectedAnchors={mockAnchors}
          onAnchorClick={handleAnchorClick}
          testIdPrefix="test-click-key"
        />
      );

      const soundscapeBtn = screen.getByTestId('test-click-key-soundscape');
      fireEvent.click(soundscapeBtn);

      expect(mockEditorRef.current.pulseAndSelectWord).toHaveBeenCalledWith('bells', 'soundscape');
      expect(handleAnchorClick).toHaveBeenCalledWith('soundscape', 'bells');
    });

    it('obeys Rule 48.4 Single-Icon discipline with leading glyph rendered exactly once', () => {
      render(
        <SensoryModalityKey
          detectedAnchors={mockAnchors}
          testIdPrefix="test-icon-key"
        />
      );

      const labelEl = screen.getByText('Live Sensory Anchors:');
      expect(labelEl).toBeInTheDocument();
      // Leading sparkle emoji rendered exactly once
      expect(screen.getByTestId('test-icon-key').textContent).toMatch(/✨\s*Live Sensory Anchors:/);
    });
  });

  describe('3. Fireside Integration & Cross-Surface Parity', () => {
    it('renders single icon for BRAINSTORM SPARK and SENSORY SEEDS without duplicates', () => {
      render(<SingleCardPromptCarousel mediaMode="audio" />);

      // Check BRAINSTORM SPARK badge has single 💡 glyph
      const brainstormBadge = screen.getByTestId('fireside-brainstorm-spark-badge');
      expect(brainstormBadge).toBeInTheDocument();
      const lightbulbCount = (brainstormBadge.textContent?.match(/💡/g) || []).length;
      expect(lightbulbCount).toBe(1);

      // Check SENSORY SEEDS tray header has single 🌿 glyph
      const seedsHeader = screen.getByTestId('fireside-sensory-seeds-header');
      expect(seedsHeader).toBeInTheDocument();
      const leafCount = (seedsHeader.textContent?.match(/🌿/g) || []).length;
      expect(leafCount).toBe(1);
    });

    it('color-coordinates sensory seed chips according to modality chromas (audio=sky, aroma=amber, visual=emerald)', () => {
      render(<SingleCardPromptCarousel mediaMode="audio" />);

      const chipsContainer = screen.getByTestId('fireside-sensory-seeds-chips');
      expect(chipsContainer).toBeInTheDocument();

      // Look at seed chips within the tray
      const chips = chipsContainer.querySelectorAll('button');
      expect(chips.length).toBeGreaterThan(0);

      chips.forEach((chip) => {
        const text = chip.textContent || '';
        if (text.includes('👂')) {
          expect(chip.className).toContain('border-sky-500');
        } else if (text.includes('☕')) {
          expect(chip.className).toContain('border-amber-500');
        } else if (text.includes('👁️')) {
          expect(chip.className).toContain('border-emerald-500');
        }
      });
    });

    it('clicking Soundscape button in Fireside editor pulses and selects the matching word', async () => {
      render(<SingleCardPromptCarousel mediaMode="audio" />);

      // Enter script editor
      const editBtn = screen.getByTestId('HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN');
      fireEvent.click(editBtn);

      const textarea = screen.getByTestId('HS_FIRESIDE_SCRIPT_TEXTAREA') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();

      // Type prose with soundscape cue "bells"
      fireEvent.change(textarea, {
        target: {
          value: 'Looking back, what stays with me most is the ringing of the temple bells.',
        },
      });

      // Soundscape pill becomes active with count 1
      const soundscapeBtn = screen.getByTestId('fireside-live-sensory-counters-soundscape');
      expect(soundscapeBtn).toBeInTheDocument();
      expect(soundscapeBtn).not.toBeDisabled();
      expect(soundscapeBtn).toHaveTextContent('Soundscape (1)');

      // Clicking Soundscape button triggers native caret selection
      fireEvent.click(soundscapeBtn);

      await waitFor(() => {
        expect(textarea.selectionStart).toBe(textarea.value.toLowerCase().indexOf('ringing'));
        expect(textarea.selectionEnd).toBe(textarea.value.toLowerCase().indexOf('ringing') + 'ringing'.length);
      });
    });
  });
});
