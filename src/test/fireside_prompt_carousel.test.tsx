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
      render(<SingleCardPromptCarousel />);

      // Counter check
      expect(screen.getByText(`1 of ${FIRESIDE_PROMPT_SPARKS.length}`)).toBeInTheDocument();

      // Title and prose check
      expect(screen.getByText('The Kitchen of Your Childhood')).toBeInTheDocument();
      expect(screen.getByText(/Think back to the home where you grew up/i)).toBeInTheDocument();

      // Button labels check (Rule 20 UK English)
      expect(screen.getByRole('button', { name: /Previous story spark/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next story spark/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Record memory: The Kitchen of Your Childhood/i })).toBeInTheDocument();
    });

    it('allows 1-tap switching between languages (e.g. English -> Gujarati)', () => {
      const handleLanguageChange = vi.fn();
      render(<SingleCardPromptCarousel onLanguageChange={handleLanguageChange} />);

      // Find Gujarati pill
      const guPill = screen.getByRole('button', { name: /Switch storytelling language to ગુજરાતી/i });
      fireEvent.click(guPill);

      expect(handleLanguageChange).toHaveBeenCalledWith('gu');
      // Expect Gujarati text to render
      expect(screen.getByText(/તમે જ્યાં મોટા થયા તે બાળપણના ઘરની યાદ કરો/i)).toBeInTheDocument();
    });

    it('navigates sequentially to the next and previous memory cards', async () => {
      render(<SingleCardPromptCarousel />);

      const nextBtn = screen.getByRole('button', { name: /Next story spark/i });
      fireEvent.click(nextBtn);

      // Card 2 check
      await waitFor(() => {
        expect(screen.getByText(`2 of ${FIRESIDE_PROMPT_SPARKS.length}`)).toBeInTheDocument();
        expect(screen.getByText('The Journey of Your Ancestors')).toBeInTheDocument();
      });

      const prevBtn = screen.getByRole('button', { name: /Previous story spark/i });
      fireEvent.click(prevBtn);

      // Back to Card 1
      await waitFor(() => {
        expect(screen.getByText(`1 of ${FIRESIDE_PROMPT_SPARKS.length}`)).toBeInTheDocument();
      });
    });

    it('expands follow-up questions drawer when clicked', () => {
      render(<SingleCardPromptCarousel />);

      const expandToggle = screen.getByRole('button', { name: /Deepen this memory/i });
      expect(expandToggle).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandToggle);
      expect(expandToggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText(/Who usually prepared the morning meals in your household/i)).toBeInTheDocument();
    });

    it('dispatches onSelectPrompt with the current spark and active language when primary CTA is clicked', () => {
      const handleSelect = vi.fn();
      render(<SingleCardPromptCarousel onSelectPrompt={handleSelect} />);

      const recordBtn = screen.getByRole('button', { name: /Record memory: The Kitchen of Your Childhood/i });
      fireEvent.click(recordBtn);

      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(handleSelect).toHaveBeenCalledWith(FIRESIDE_PROMPT_SPARKS[0], 'en');
    });
  });
});
