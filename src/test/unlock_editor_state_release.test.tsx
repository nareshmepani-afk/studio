import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CinemaMonitor } from '@/components/studio/CinemaMonitor';

describe('Unlock Editor & State Release Regression Tests (Rule 9 / Rule 12)', () => {
  const mockOnUnlock = vi.fn();
  const mockOnBackToEditor = vi.fn();
  const mockOnNext = vi.fn();

  const mockStructuredScript = {
    cleanScript: 'The afternoon sun warmed the ancient kitchen tiles...',
    stageDirections: [],
    beatSheet: [],
    generatedSoundtrackUrl: '',
    preFlightBrief: {
      location: 'Nairobi',
      era: '1964',
      mood: 'nostalgic'
    }
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "Unlock Editor" button when isProductionLocked is true and onUnlock is provided', () => {
    render(
      <CinemaMonitor
        structuredScript={mockStructuredScript}
        isProductionLocked={true}
        onUnlock={mockOnUnlock}
        onBackToEditor={mockOnBackToEditor}
        onNext={mockOnNext}
      />
    );

    const unlockBtn = screen.getByRole('button', { name: /unlock editor/i });
    expect(unlockBtn).toBeInTheDocument();
  });

  it('does NOT render the "Unlock Editor" button when isProductionLocked is false', () => {
    render(
      <CinemaMonitor
        structuredScript={mockStructuredScript}
        isProductionLocked={false}
        onUnlock={mockOnUnlock}
        onBackToEditor={mockOnBackToEditor}
        onNext={mockOnNext}
      />
    );

    expect(screen.queryByRole('button', { name: /unlock editor/i })).not.toBeInTheDocument();
  });

  it('triggers onUnlock handler immediately when clicked', () => {
    render(
      <CinemaMonitor
        structuredScript={mockStructuredScript}
        isProductionLocked={true}
        onUnlock={mockOnUnlock}
        onBackToEditor={mockOnBackToEditor}
        onNext={mockOnNext}
      />
    );

    const unlockBtn = screen.getByRole('button', { name: /unlock editor/i });
    fireEvent.click(unlockBtn);

    expect(mockOnUnlock).toHaveBeenCalledTimes(1);
    expect(mockOnBackToEditor).toHaveBeenCalledTimes(1);
  });
});
