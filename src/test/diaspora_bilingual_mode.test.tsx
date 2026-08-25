import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { mockPromptGroups } from '@/lib/mockData';
import { PromptCard } from '@/components/prompts/PromptCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/studio'
}));

// Test prompt calculation logic in isolation matching useStudioData
function computeChapterAndPrompts(mode: 'en' | 'gu' | 'dual') {
  return mockPromptGroups.map((group) => {
    const correlatedPrompts = group.prompts.map((p) => {
      let promptTitle = p.title;
      let promptSubtitle: string | undefined = undefined;
      let promptDescription = p.description;

      if (mode === 'gu') {
        promptTitle = p.text.gu.split(' – ')[0] || p.title;
        promptDescription = p.text.gu.split(' – ')[1] || p.description;
      } else if (mode === 'dual') {
        promptTitle = p.title;
        promptSubtitle = p.text.gu.split(' – ')[0] || undefined;
        promptDescription = p.description;
      }

      return {
        id: p.id,
        title: promptTitle,
        subtitle: promptSubtitle,
        description: promptDescription,
      };
    });

    let title = group.title.en;
    let subtitle: string | undefined = group.title.gu;

    if (mode === 'en') {
      title = group.title.en;
      subtitle = undefined;
    } else if (mode === 'gu') {
      title = group.title.gu;
      subtitle = undefined;
    } else if (mode === 'dual') {
      title = group.title.en;
      subtitle = group.title.gu;
    }

    return {
      id: group.id,
      title,
      subtitle,
      prompts: correlatedPrompts,
    };
  });
}

describe('Diaspora Bilingual Hybrid Engine Tests', () => {
  it('computes English Focus correctly', () => {
    const chapters = computeChapterAndPrompts('en');
    const part1 = chapters.find(c => c.id === 'part-i')!;
    expect(part1.title).toBe('Part I: Roots and Foundations');
    expect(part1.subtitle).toBeUndefined();

    const p1 = part1.prompts.find(p => p.id === 'p1')!;
    expect(p1.title).toBe('A Child of Two Worlds');
    expect(p1.subtitle).toBeUndefined();
  });

  it('computes Native Focus (Gujarati) correctly', () => {
    const chapters = computeChapterAndPrompts('gu');
    const part1 = chapters.find(c => c.id === 'part-i')!;
    expect(part1.title).toBe('ભાગ I: મૂળ અને પાયા');
    expect(part1.subtitle).toBeUndefined();

    const p1 = part1.prompts.find(p => p.id === 'p1')!;
    expect(p1.title).toBe('બે દુનિયાનું બાળક');
    expect(p1.subtitle).toBeUndefined();
  });

  it('computes Bilingual Hybrid Mode with side-by-side subtitles', () => {
    const chapters = computeChapterAndPrompts('dual');
    const part1 = chapters.find(c => c.id === 'part-i')!;
    expect(part1.title).toBe('Part I: Roots and Foundations');
    expect(part1.subtitle).toBe('ભાગ I: મૂળ અને પાયા');

    const p1 = part1.prompts.find(p => p.id === 'p1')!;
    expect(p1.title).toBe('A Child of Two Worlds');
    expect(p1.subtitle).toBe('બે દુનિયાનું બાળક');
  });

  it('renders PromptCard with promptSubtitle in Hybrid mode', () => {
    render(
      <PromptCard
        promptId="p1"
        promptText="A Child of Two Worlds"
        promptSubtitle="બે દુનિયાનું બાળક"
        storyScript="Script placeholder"
        isCompleted={false}
        isFlaggedForReuse={false}
        onStartChapter={vi.fn()}
        onToggleFlagPrompt={vi.fn()}
        canAccess={true}
      />
    );

    expect(screen.getByText('A Child of Two Worlds')).toBeDefined();
    expect(screen.getByText('બે દુનિયાનું બાળક')).toBeDefined();
  });
});
