import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { BonusMemoryDrawer } from '@/components/fireside/BonusMemoryDrawer';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import * as aiWeaver from '@/actions/aiWeaver';
import * as genkitModule from '@/ai/genkit';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('MW-108: Universal Orthography, Spell-Check & In-App Grammar Polish Standard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Tier 1: Base UI Primitives (Textarea & Input)', () => {
    it('applies default narrative attributes to Textarea (spellCheck, autoCorrect, autoCapitalize, lang=en-GB)', () => {
      const { container } = render(React.createElement(Textarea, { placeholder: 'Type memory...' }));
      const textarea = container.querySelector('textarea')!;
      expect(textarea).toBeTruthy();
      expect(textarea.getAttribute('spellcheck')).toBe('true');
      expect(textarea.getAttribute('autocorrect')).toBe('on');
      expect(textarea.getAttribute('autocapitalize')).toBe('sentences');
      expect(textarea.getAttribute('lang')).toBe('en-GB');
    });

    it('allows caller overrides on Textarea', () => {
      const { container } = render(
        React.createElement(Textarea, {
          spellCheck: false,
          autoCorrect: 'off',
          autoCapitalize: 'none',
          lang: 'gu',
        })
      );
      const textarea = container.querySelector('textarea')!;
      expect(textarea.getAttribute('spellcheck')).toBe('false');
      expect(textarea.getAttribute('autocorrect')).toBe('off');
      expect(textarea.getAttribute('autocapitalize')).toBe('none');
      expect(textarea.getAttribute('lang')).toBe('gu');
    });

    it('applies narrative defaults to Input when type="text" or undefined', () => {
      const { container: c1 } = render(React.createElement(Input, { placeholder: 'Chapter Title' }));
      const input1 = c1.querySelector('input')!;
      expect(input1.getAttribute('spellcheck')).toBe('true');
      expect(input1.getAttribute('autocorrect')).toBe('on');
      expect(input1.getAttribute('autocapitalize')).toBe('sentences');
      expect(input1.getAttribute('lang')).toBe('en-GB');

      const { container: c2 } = render(
        React.createElement(Input, { type: 'text', placeholder: 'Title' })
      );
      const input2 = c2.querySelector('input')!;
      expect(input2.getAttribute('spellcheck')).toBe('true');
      expect(input2.getAttribute('autocorrect')).toBe('on');
      expect(input2.getAttribute('autocapitalize')).toBe('sentences');
      expect(input2.getAttribute('lang')).toBe('en-GB');
    });

    it('Guardrail 1: strictly disables spellCheck, autoCorrect, autoCapitalize on non-narrative input types (password, email, url, number, tel)', () => {
      const nonNarrativeTypes = ['password', 'email', 'url', 'number', 'tel'] as const;

      for (const type of nonNarrativeTypes) {
        const { container } = render(
          React.createElement(Input, { type, id: `input-${type}` })
        );
        const input = container.querySelector('input')!;
        expect(input.getAttribute('spellcheck'), `type="${type}" spellcheck`).toBe('false');
        expect(input.getAttribute('autocorrect'), `type="${type}" autocorrect`).toBe('off');
        expect(input.getAttribute('autocapitalize'), `type="${type}" autocapitalize`).toBe('none');
        expect(input.getAttribute('lang'), `type="${type}" lang`).toBeNull();
      }
    });

    it('allows caller overrides on non-narrative Input fields', () => {
      const { container } = render(
        React.createElement(Input, {
          type: 'email',
          spellCheck: true,
          autoCorrect: 'on',
          lang: 'en-GB',
        })
      );
      const input = container.querySelector('input')!;
      expect(input.getAttribute('spellcheck')).toBe('true');
      expect(input.getAttribute('autocorrect')).toBe('on');
      expect(input.getAttribute('lang')).toBe('en-GB');
    });
  });

  describe('Tier 2: BonusMemoryDrawer (Recollection Bottom-Sheet)', () => {
    it('renders textarea with narrative attributes, lang="en-GB", and extension clearance padding', () => {
      render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'The House I Grew Up In',
          onSaveBonusNote: vi.fn(),
        })
      );

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i) as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.getAttribute('spellcheck')).toBe('true');
      expect(textarea.getAttribute('autocorrect')).toBe('on');
      expect(textarea.getAttribute('autocapitalize')).toBe('sentences');
      expect(textarea.getAttribute('lang')).toBe('en-GB');
      expect(textarea.className).toContain('pr-10');
      expect(textarea.className).toContain('pb-4');
    });

    it('Guardrail 2: binds textarea lang dynamically to diaspora locale (e.g. gu)', () => {
      render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'The House I Grew Up In',
          activeLanguage: 'gu',
          onSaveBonusNote: vi.fn(),
        })
      );

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i);
      expect(textarea.getAttribute('lang')).toBe('gu');
    });

    it('displays word count indicator (data-testid="HS_NOTE_WORD_COUNT")', () => {
      render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'The House I Grew Up In',
          onSaveBonusNote: vi.fn(),
        })
      );

      const counter = screen.getByTestId('HS_NOTE_WORD_COUNT');
      expect(counter.textContent).toContain('0 words');

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i);
      fireEvent.change(textarea, { target: { value: 'Grandmother made chai on the veranda.' } });

      expect(counter.textContent).toContain('6 words');
    });

    it('executes non-destructive polish and restores via revert button (HS_BONUS_NOTE_REVERT_BTN)', async () => {
      const checkSpy = vi.spyOn(aiWeaver, 'checkAndPolishGrammar').mockResolvedValue(
        'Grandmother made chai on the veranda every morning.'
      );

      render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'The House I Grew Up In',
          onSaveBonusNote: vi.fn(),
        })
      );

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i) as HTMLTextAreaElement;
      const initialText = 'Grandmother make chai on veranda morning.';
      fireEvent.change(textarea, { target: { value: initialText } });

      const polishBtn = screen.getByTestId('HS_BONUS_NOTE_POLISH_BTN');
      expect(polishBtn).not.toBeDisabled();
      fireEvent.click(polishBtn);

      await waitFor(() => {
        expect(checkSpy).toHaveBeenCalledWith(initialText);
        expect(textarea.value).toBe('Grandmother made chai on the veranda every morning.');
      });

      // Verify Revert Button appears
      const revertBtn = screen.getByTestId('HS_BONUS_NOTE_REVERT_BTN');
      expect(revertBtn).toBeTruthy();

      // Click revert
      fireEvent.click(revertBtn);
      expect(textarea.value).toBe(initialText);
      expect(screen.queryByTestId('HS_BONUS_NOTE_REVERT_BTN')).toBeNull();
    });

    it('Guardrail 3: Zero-Data-Loss Network Exception Shield on BonusMemoryDrawer', async () => {
      const checkSpy = vi.spyOn(aiWeaver, 'checkAndPolishGrammar').mockRejectedValue(
        new Error('Network timeout: 504 Gateway Timeout')
      );

      render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'The House I Grew Up In',
          onSaveBonusNote: vi.fn(),
        })
      );

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i) as HTMLTextAreaElement;
      const initialText = 'Crucial family draft that must never be lost.';
      fireEvent.change(textarea, { target: { value: initialText } });

      const polishBtn = screen.getByTestId('HS_BONUS_NOTE_POLISH_BTN');
      fireEvent.click(polishBtn);

      await waitFor(() => {
        expect(checkSpy).toHaveBeenCalled();
      });

      // Draft must be preserved 100%
      expect(textarea.value).toBe(initialText);
      // Toast error dispatched safely
      expect(toast.error).toHaveBeenCalledWith(
        'AI grammar service temporarily unavailable. Your draft was kept safely.'
      );
    });

    it('executes sensory note weave and supports Replace Note action (MW-110)', async () => {
      const originalText = 'I wonder if the hot Kenyan sun shaped my thoughts.';
      const wovenText = 'I often wonder if that scorching equatorial sun and the red earth nourished the thoughts of my childhood.';
      const weaveSpy = vi.spyOn(aiWeaver, 'weaveBonusNote').mockResolvedValue(wovenText);

      render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'A Child of Two Worlds',
          onSaveBonusNote: vi.fn(),
        })
      );

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: originalText } });

      const weaveBtn = screen.getByTestId('HS_BONUS_NOTE_WEAVE_BTN');
      expect(weaveBtn).not.toBeDisabled();
      fireEvent.click(weaveBtn);

      await waitFor(() => {
        expect(weaveSpy).toHaveBeenCalledWith(originalText, expect.objectContaining({
          sceneTitle: 'A Child of Two Worlds',
        }));
        expect(screen.getByTestId('HS_BONUS_WEAVE_PREVIEW_TRAY')).toBeTruthy();
      });

      // Textarea retains original draft until decision
      expect(textarea.value).toBe(originalText);

      // Click Replace Note
      const replaceBtn = screen.getByTestId('HS_BONUS_WEAVE_REPLACE_BTN');
      fireEvent.click(replaceBtn);

      expect(textarea.value).toBe(wovenText);
      expect(screen.queryByTestId('HS_BONUS_WEAVE_PREVIEW_TRAY')).toBeNull();

      // Verify Revert Button restores original draft
      const revertBtn = screen.getByTestId('HS_BONUS_NOTE_REVERT_BTN');
      expect(revertBtn).toBeTruthy();
      fireEvent.click(revertBtn);
      expect(textarea.value).toBe(originalText);
    });

    it('supports Append to Note action preserving original text with divider (MW-110)', async () => {
      const originalText = 'I wonder if the hot Kenyan sun shaped my thoughts.';
      const wovenText = 'I often wonder if that scorching equatorial sun left an indelible mark.';
      vi.spyOn(aiWeaver, 'weaveBonusNote').mockResolvedValue(wovenText);

      render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'A Child of Two Worlds',
          onSaveBonusNote: vi.fn(),
        })
      );

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: originalText } });

      const weaveBtn = screen.getByTestId('HS_BONUS_NOTE_WEAVE_BTN');
      fireEvent.click(weaveBtn);

      await waitFor(() => {
        expect(screen.getByTestId('HS_BONUS_WEAVE_PREVIEW_TRAY')).toBeTruthy();
      });

      // Click Append to Note
      const appendBtn = screen.getByTestId('HS_BONUS_WEAVE_APPEND_BTN');
      fireEvent.click(appendBtn);

      expect(textarea.value).toBe(`${originalText}\n\n---\n\n${wovenText}`);
      expect(screen.queryByTestId('HS_BONUS_WEAVE_PREVIEW_TRAY')).toBeNull();
    });

    it('supports Keep Original action dismissing the preview tray without mutating textarea (MW-110)', async () => {
      const originalText = 'I wonder if the hot Kenyan sun shaped my thoughts.';
      const wovenText = 'I often wonder if that scorching equatorial sun left an indelible mark.';
      vi.spyOn(aiWeaver, 'weaveBonusNote').mockResolvedValue(wovenText);

      render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'A Child of Two Worlds',
          onSaveBonusNote: vi.fn(),
        })
      );

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: originalText } });

      const weaveBtn = screen.getByTestId('HS_BONUS_NOTE_WEAVE_BTN');
      fireEvent.click(weaveBtn);

      await waitFor(() => {
        expect(screen.getByTestId('HS_BONUS_WEAVE_PREVIEW_TRAY')).toBeTruthy();
      });

      // Click Keep Original
      const dismissBtn = screen.getByTestId('HS_BONUS_WEAVE_DISMISS_BTN');
      fireEvent.click(dismissBtn);

      expect(textarea.value).toBe(originalText);
      expect(screen.queryByTestId('HS_BONUS_WEAVE_PREVIEW_TRAY')).toBeNull();
    });

    it('Guardrail: Zero-Data-Loss Network Exception Shield on BonusMemoryDrawer weave action (MW-110)', async () => {
      const weaveSpy = vi.spyOn(aiWeaver, 'weaveBonusNote').mockRejectedValue(
        new Error('Network timeout: 504 Gateway Timeout')
      );

      render(
        React.createElement(BonusMemoryDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          sceneId: 'part-1-scene-1',
          sceneTitle: 'A Child of Two Worlds',
          onSaveBonusNote: vi.fn(),
        })
      );

      const textarea = screen.getByPlaceholderText(/I remembered Aunt Meena/i) as HTMLTextAreaElement;
      const initialText = 'Crucial family draft that must never be lost.';
      fireEvent.change(textarea, { target: { value: initialText } });

      const weaveBtn = screen.getByTestId('HS_BONUS_NOTE_WEAVE_BTN');
      fireEvent.click(weaveBtn);

      await waitFor(() => {
        expect(weaveSpy).toHaveBeenCalled();
      });

      // Draft must be preserved 100%
      expect(textarea.value).toBe(initialText);
      // Toast error dispatched safely
      expect(toast.error).toHaveBeenCalledWith(
        'Narrative weave temporarily unavailable. Your original draft was kept safe.'
      );
    });
  });

  describe('Tier 3: SingleCardPromptCarousel (Armchair Script Editor)', () => {
    it('renders script editor textarea with spellCheck, autoCorrect, autoCapitalize, and lang', () => {
      render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          activeSceneMemory: {
            sceneId: 'part-1-scene-1',
            prose: 'My childhood home was made of red brick and stood by the sea.',
          },
        })
      );

      // Open script editor
      const editBtn = screen.getByTestId('HS_FIRESIDE_EDIT_SCRIPT_BTN');
      fireEvent.click(editBtn);

      const textarea = screen.getByTestId('HS_FIRESIDE_SCRIPT_TEXTAREA') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.getAttribute('spellcheck')).toBe('true');
      expect(textarea.getAttribute('autocorrect')).toBe('on');
      expect(textarea.getAttribute('autocapitalize')).toBe('sentences');
      expect(textarea.getAttribute('lang')).toBe('en-GB');
      expect(textarea.className).toContain('pr-10');
      expect(textarea.className).toContain('pb-4');
    });

    it('supports non-destructive script polish and revert in Armchair Script Editor', async () => {
      const checkSpy = vi.spyOn(aiWeaver, 'checkAndPolishGrammar').mockResolvedValue(
        'My childhood home was made of red brick and stood by the sea.'
      );

      render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          activeSceneMemory: {
            sceneId: 'part-1-scene-1',
            prose: 'My childhood home were made of red brick.',
          },
        })
      );

      const editBtn = screen.getByTestId('HS_FIRESIDE_EDIT_SCRIPT_BTN');
      fireEvent.click(editBtn);

      const polishBtn = screen.getByTestId('HS_FIRESIDE_SCRIPT_POLISH_BTN');
      expect(polishBtn).toBeTruthy();
      fireEvent.click(polishBtn);

      await waitFor(() => {
        expect(checkSpy).toHaveBeenCalled();
      });

      const textarea = screen.getByTestId('HS_FIRESIDE_SCRIPT_TEXTAREA') as HTMLTextAreaElement;
      expect(textarea.value).toBe('My childhood home was made of red brick and stood by the sea.');

      const revertBtn = screen.getByTestId('HS_FIRESIDE_SCRIPT_REVERT_BTN');
      expect(revertBtn).toBeTruthy();

      fireEvent.click(revertBtn);
      expect(textarea.value).toBe('My childhood home were made of red brick.');
    });

    it('Guardrail 3: Zero-Data-Loss Network Exception Shield on Script Editor', async () => {
      vi.spyOn(aiWeaver, 'checkAndPolishGrammar').mockRejectedValue(
        new Error('AI Quota Exceeded')
      );

      render(
        React.createElement(SingleCardPromptCarousel, {
          activeLanguage: 'en',
          activeSceneMemory: {
            sceneId: 'part-1-scene-1',
            prose: 'Unpolished draft words from the narrator.',
          },
        })
      );

      const editBtn = screen.getByTestId('HS_FIRESIDE_EDIT_SCRIPT_BTN');
      fireEvent.click(editBtn);

      const polishBtn = screen.getByTestId('HS_FIRESIDE_SCRIPT_POLISH_BTN');
      fireEvent.click(polishBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'AI grammar service temporarily unavailable. Your draft was kept safely.'
        );
      });

      const textarea = screen.getByTestId('HS_FIRESIDE_SCRIPT_TEXTAREA') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Unpolished draft words from the narrator.');
    });
  });

  describe('Tier 4: Server Action weaveBonusNote (MW-110)', () => {
    it('returns short or empty draft text directly without calling AI', async () => {
      const result1 = await aiWeaver.weaveBonusNote('');
      expect(result1).toBe('');

      const result2 = await aiWeaver.weaveBonusNote('Sun');
      expect(result2).toBe('Sun');
    });

    it('enforces Rule 11 by stripping screenplay cues and formatting output', async () => {
      const getAISpy = vi.spyOn(genkitModule, 'getAI').mockResolvedValue({
        generate: vi.fn().mockResolvedValue({
          text: 'Cut to a shot of the hot Kenyan sun. [Fade in] Long before words, the rich soil nourished my earliest memories.',
        }),
      } as any);

      const input = 'I wonder if the hot Kenyan sun shaped my thoughts.';
      const woven = await aiWeaver.weaveBonusNote(input, { sceneTitle: 'Roots' });

      expect(woven).not.toMatch(/Cut to/i);
      expect(woven).not.toMatch(/\[Fade in\]/i);
      expect(woven).toContain('Long before words, the rich soil nourished my earliest memories.');

      getAISpy.mockRestore();
    });

    it('catches exceptions gracefully and returns draftText safely (Rule 42)', async () => {
      const getAISpy = vi.spyOn(genkitModule, 'getAI').mockRejectedValue(new Error('Quota exceeded'));

      const input = 'I wonder if the hot Kenyan sun shaped my thoughts.';
      const result = await aiWeaver.weaveBonusNote(input);

      expect(result).toBe(input);
      getAISpy.mockRestore();
    });
  });
});

