import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  FIRESIDE_PROMPT_SPARKS,
  getPromptById,
  getPromptsByCategory,
  getRandomPrompt
} from '@/lib/firesidePrompts';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import type { FiresideLanguage, PromptCategory } from '@/types/fireside';

describe('MW-245: Fireside Multilingual Prompt Sparks & Single-Card Carousel', () => {
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

      // Title and prose check (Part I - Scene 1 is index 0)
      expect(screen.getByText('The Journey of Your Ancestors')).toBeInTheDocument();
      expect(screen.getByText(/What stories did your grandparents share about where your family originally came from/i)).toBeInTheDocument();

      // Button labels check (Rule 20 UK English)
      expect(screen.getByRole('button', { name: /Previous story spark/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next story spark/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Speak this memory: The Journey of Your Ancestors/i })).toBeInTheDocument();
    });

    it('allows 1-tap switching between languages (e.g. English -> Gujarati)', () => {
      const handleLanguageChange = vi.fn();
      render(<SingleCardPromptCarousel onLanguageChange={handleLanguageChange} />);

      // Find Gujarati pill
      const guPill = screen.getByRole('button', { name: /Switch storytelling language to ગુજરાતી/i });
      fireEvent.click(guPill);

      expect(handleLanguageChange).toHaveBeenCalledWith('gu');
      // Expect Gujarati text to render for prompt 0
      expect(screen.getByText(/તમારા વડીલો કે દાદા-દાદીએ પોતાના મૂળ વતન અને મુશ્કેલ સ્થળાંતર વિશે તમને કઈ વાતો કહી હતી/i)).toBeInTheDocument();
    });

    it('navigates sequentially to the next and previous memory cards', async () => {
      render(<SingleCardPromptCarousel />);

      const nextBtn = screen.getByRole('button', { name: /Next story spark/i });
      fireEvent.click(nextBtn);

      // Card 2 check (Part I - Scene 2: The Kitchen of Your Childhood)
      await waitFor(() => {
        expect(screen.getByText(`2 of ${FIRESIDE_PROMPT_SPARKS.length}`)).toBeInTheDocument();
        expect(screen.getByText('The Kitchen of Your Childhood')).toBeInTheDocument();
      });

      const prevBtn = screen.getByRole('button', { name: /Previous story spark/i });
      fireEvent.click(prevBtn);

      // Back to Card 1
      await waitFor(() => {
        expect(screen.getByText(`1 of ${FIRESIDE_PROMPT_SPARKS.length}`)).toBeInTheDocument();
        expect(screen.getByText('The Journey of Your Ancestors')).toBeInTheDocument();
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

      const recordBtn = screen.getByRole('button', { name: /Speak this memory: The Journey of Your Ancestors/i });
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
  });
});
