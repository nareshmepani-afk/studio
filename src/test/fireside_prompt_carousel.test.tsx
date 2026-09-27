import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  FIRESIDE_PROMPT_SPARKS,
  getPromptById,
  getPromptsByCategory,
  getRandomPrompt
} from '@/lib/firesidePrompts';
import { getPartForScene, getSceneById } from '@/lib/curriculum/masterStoryStructure';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import type { FiresideLanguage, PromptCategory } from '@/types/fireside';

describe('MW-245 & MW-88-T3: Fireside Multilingual Prompt Sparks, Curriculum Sync & Warmup Sandbox', () => {
  describe('1. Dataset Invariants & Multilingual Coverage (firesidePrompts.ts)', () => {
    const ALL_CATEGORIES: PromptCategory[] = [
      'childhood',
      'roots',
      'love',
      'wisdom',
      'traditions',
      'lessons',
      'humour',
      'legacy',
    ];

    it('contains at least 8 curated sparks covering all required categories', () => {
      expect(FIRESIDE_PROMPT_SPARKS.length).toBeGreaterThanOrEqual(8);
      const presentCategories = FIRESIDE_PROMPT_SPARKS.map((p) => p.category);
      ALL_CATEGORIES.forEach((cat) => {
        expect(presentCategories).toContain(cat);
      });
    });

    it('provides complete translations across all 4 languages (en, gu, pa, hi) for every prompt', () => {
      const requiredLangs: FiresideLanguage[] = ['en', 'gu', 'pa', 'hi'];
      FIRESIDE_PROMPT_SPARKS.forEach((prompt) => {
        requiredLangs.forEach((lang) => {
          expect(prompt.sparks[lang]).toBeDefined();
          expect(prompt.sparks[lang].length).toBeGreaterThan(15);

          // Follow-ups must have at least 2 questions
          expect(prompt.followUpQuestions[lang]).toBeDefined();
          expect(prompt.followUpQuestions[lang].length).toBeGreaterThanOrEqual(2);

          // Photo hint must be populated
          expect(prompt.recommendedPhotoPrompt[lang]).toBeDefined();
          expect(prompt.recommendedPhotoPrompt[lang].length).toBeGreaterThan(10);
        });
      });
    });

    it('query helpers (getPromptById, getPromptsByCategory, getRandomPrompt) return valid data', () => {
      const firstPrompt = FIRESIDE_PROMPT_SPARKS[0];
      const byId = getPromptById(firstPrompt.id);
      expect(byId?.id).toBe(firstPrompt.id);

      const byCategory = getPromptsByCategory('love');
      expect(byCategory.length).toBeGreaterThanOrEqual(1);
      expect(byCategory.every((p) => p.category === 'love')).toBe(true);

      const random = getRandomPrompt(firstPrompt.id);
      expect(random).toBeDefined();
      expect(random.id).not.toBe(firstPrompt.id);
    });
  });

  describe('2. SingleCardPromptCarousel UI Component Ergonomics', () => {
    it('renders the initial card with British English prose, counter, and category pill', () => {
      render(<SingleCardPromptCarousel mediaMode="audio" />);

      // Counter check
      expect(screen.getByText(`1 of ${FIRESIDE_PROMPT_SPARKS.length}`)).toBeInTheDocument();

      // Title and prose check (Part I - Scene 1 is index 0: A Child of Two Worlds / બે દુનિયાનું બાળક)
      expect(screen.getByText('A Child of Two Worlds')).toBeInTheDocument();
      expect(screen.getByText('બે દુનિયાનું બાળક')).toBeInTheDocument();
      expect(screen.getByText(/What stories did your grandparents share about where your family originally came from/i)).toBeInTheDocument();

      // Button labels check (Rule 20 UK English)
      expect(screen.getByRole('button', { name: /Previous story spark/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next story spark/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Speak this memory: A Child of Two Worlds/i })).toBeInTheDocument();
    });

    it('allows 1-tap switching between languages (e.g. English -> Gujarati) and dynamically prioritises mother tongue script', () => {
      const handleLanguageChange = vi.fn();
      render(<SingleCardPromptCarousel onLanguageChange={handleLanguageChange} />);

      // Default English: primary title is English, secondary title is Gujarati
      expect(screen.getByTestId('carousel-card-primary-title')).toHaveTextContent('A Child of Two Worlds');
      expect(screen.getByTestId('carousel-card-secondary-title')).toHaveTextContent('બે દુનિયાનું બાળક');

      // Find Gujarati pill
      const guPill = screen.getByRole('button', { name: /Switch storytelling language to ગુજરાતી/i });
      fireEvent.click(guPill);

      expect(handleLanguageChange).toHaveBeenCalledWith('gu');
      // Mother tongue prioritised: primary title becomes Gujarati, secondary title becomes English
      expect(screen.getByTestId('carousel-card-primary-title')).toHaveTextContent('બે દુનિયાનું બાળક');
      expect(screen.getByTestId('carousel-card-secondary-title')).toHaveTextContent('A Child of Two Worlds');
      // Expect Gujarati text to render for prompt 0
      expect(screen.getByText(/તમારા વડીલો કે દાદા-દાદીએ પોતાના મૂળ વતન અને મુશ્કેલ સ્થળાંતર વિશે તમને કઈ વાતો કહી હતી/i)).toBeInTheDocument();
    });

    it('navigates sequentially to the next and previous memory cards', async () => {
      render(<SingleCardPromptCarousel />);

      const nextBtn = screen.getByRole('button', { name: /Next story spark/i });
      fireEvent.click(nextBtn);

      // Card 2 check (Part I - Scene 2: The House I Grew Up In)
      await waitFor(() => {
        expect(screen.getByText(`2 of ${FIRESIDE_PROMPT_SPARKS.length}`)).toBeInTheDocument();
        expect(screen.getByText('The House I Grew Up In')).toBeInTheDocument();
        expect(screen.getByTestId('carousel-scene-number-badge')).toHaveTextContent('Part I • Scene 2');
      });

      const prevBtn = screen.getByRole('button', { name: /Previous story spark/i });
      fireEvent.click(prevBtn);

      // Back to Card 1
      await waitFor(() => {
        expect(screen.getByText(`1 of ${FIRESIDE_PROMPT_SPARKS.length}`)).toBeInTheDocument();
        expect(screen.getByText('A Child of Two Worlds')).toBeInTheDocument();
        expect(screen.getByTestId('carousel-scene-number-badge')).toHaveTextContent('Part I • Scene 1');
      });
    });

    it('expands follow-up questions drawer when clicked', () => {
      render(<SingleCardPromptCarousel />);

      const expandToggle = screen.getByRole('button', { name: /Deepen this memory/i });
      expect(expandToggle).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandToggle);
      expect(expandToggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText(/What precious heirlooms or small possessions did they carry on the crossing/i)).toBeInTheDocument();
    });

    it('dispatches onSelectPrompt with the current spark and active language when primary CTA is clicked', () => {
      const handleSelect = vi.fn();
      render(<SingleCardPromptCarousel mediaMode="audio" onSelectPrompt={handleSelect} />);

      const recordBtn = screen.getByRole('button', { name: /Speak this memory: A Child of Two Worlds/i });
      fireEvent.click(recordBtn);

      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(handleSelect).toHaveBeenCalledWith(FIRESIDE_PROMPT_SPARKS[0], 'en');
    });

    it('invokes onPhotoPromptClick when Digitise Photo button is clicked', () => {
      const handlePhotoClick = vi.fn();
      render(<SingleCardPromptCarousel onPhotoPromptClick={handlePhotoClick} />);

      const photoBtn = screen.getByRole('button', { name: /Digitise physical album photo/i });
      fireEvent.click(photoBtn);

      expect(handlePhotoClick).toHaveBeenCalledTimes(1);
      expect(handlePhotoClick).toHaveBeenCalledWith(FIRESIDE_PROMPT_SPARKS[0].recommendedPhotoPrompt.en);
    });

    it('notifies onActivePromptChange as cards are browsed to drive dynamic media mode suggestions', async () => {
      const handleActivePromptChange = vi.fn();
      render(<SingleCardPromptCarousel onActivePromptChange={handleActivePromptChange} />);

      expect(handleActivePromptChange).toHaveBeenCalledWith(FIRESIDE_PROMPT_SPARKS[0]);

      const nextBtn = screen.getByRole('button', { name: /Next story spark/i });
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(handleActivePromptChange).toHaveBeenCalledWith(FIRESIDE_PROMPT_SPARKS[1]);
      });
    });
  });

  describe('3. MW-88-T3: Dual-Surface Curriculum Synchronisation & 3-Step Fireside Warmup', () => {
    it('synchronises Part I curriculum sequence and bilingual titles across Desktop and Fireside', () => {
      expect(FIRESIDE_PROMPT_SPARKS[0].linkedSceneId).toBe('part-1-scene-1');
      expect(FIRESIDE_PROMPT_SPARKS[0].title).toBe('A Child of Two Worlds');
      expect(FIRESIDE_PROMPT_SPARKS[0].localizedTitles?.gu).toBe('બે દુનિયાનું બાળક');

      expect(FIRESIDE_PROMPT_SPARKS[1].linkedSceneId).toBe('part-1-scene-2');
      expect(FIRESIDE_PROMPT_SPARKS[1].title).toBe('The House I Grew Up In');
      expect(FIRESIDE_PROMPT_SPARKS[1].localizedTitles?.gu).toBe('હું જે ઘરમાં મોટો થયો');

      expect(FIRESIDE_PROMPT_SPARKS[2].linkedSceneId).toBe('part-1-scene-3');
      expect(FIRESIDE_PROMPT_SPARKS[2].title).toBe('Innocence and Curiosity');
      expect(FIRESIDE_PROMPT_SPARKS[2].localizedTitles?.gu).toBe('નિર્દોષતા અને જિજ્ઞાસા');

      const part1 = getPartForScene('part-1-scene-1');
      expect(part1.title).toBe('Part I: Roots and Foundations');
      expect(part1.localizedTitles?.gu).toBe('ભાગ I: મૂળ અને પાયા');

      const scene1 = getSceneById('part-1-scene-1');
      expect(scene1?.sceneNumber).toBe(1);
      expect(scene1?.title).toBe('A Child of Two Worlds');
    });

    it('renders the [ 🎙️ 30-Second Warmup & Soundcheck ] trigger at index 0 and executes the 3-step rehearsal flow with contamination shield', async () => {
      const handleWarmupComplete = vi.fn();
      render(<SingleCardPromptCarousel onWarmupComplete={handleWarmupComplete} />);

      const triggerBtn = screen.getByTestId('fireside-warmup-trigger');
      expect(triggerBtn).toBeInTheDocument();
      expect(triggerBtn).toHaveTextContent('30-Second Warmup & Soundcheck');

      // Launch warmup sandbox
      fireEvent.click(triggerBtn);
      expect(screen.getByTestId('fireside-warmup-sandbox')).toBeInTheDocument();
      expect(screen.getByTestId('warmup-step-1')).toBeInTheDocument();
      expect(screen.getByTestId('warmup-contamination-shield-note')).toHaveTextContent(/Contamination Shield Active/i);

      // Step 1 -> Step 2 (Start & finish mic test phrase)
      fireEvent.click(screen.getByTestId('warmup-record-btn'));
      expect(screen.getByTestId('warmup-recording-meter')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('warmup-record-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('warmup-step-2')).toBeInTheDocument();
      });

      // Step 2: Play back with ambient warmth & advance to Step 3
      fireEvent.click(screen.getByTestId('warmup-playback-btn'));
      expect(screen.getByTestId('warmup-playback-btn')).toHaveTextContent(/Playing with Ambient Background Warmth/i);
      fireEvent.click(screen.getByTestId('warmup-next-to-photo-btn'));

      // Step 3: Preview optional photo print & complete soundcheck
      expect(screen.getByTestId('warmup-step-3')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('warmup-sample-print-btn'));
      expect(screen.getByTestId('warmup-photo-preview')).toBeInTheDocument();

      // Complete Soundcheck & Enter Part I
      fireEvent.click(screen.getByTestId('warmup-complete-btn'));
      expect(handleWarmupComplete).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('warmup-exit-banner')).toHaveTextContent(
        'Soundcheck complete. Entering Part I: Roots and Foundations.'
      );
    });
  });
});
