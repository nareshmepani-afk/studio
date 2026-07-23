import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StudioProvider, useStudioState } from '@/hooks/studio/useStudioState';
import { ProductionControlBar } from '@/components/studio/ProductionControlBar';
import { MentorshipHotspot } from '@/components/studio/MentorshipHotspot';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/studio/production/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Helper component to render and inspect clean view state
function Act1TestHarness() {
  const { isCleanView } = useStudioState();
  return (
    <div>
      <ProductionControlBar 
        currentStage={0}
        isComplete={true}
        onNext={() => {}}
        onPrev={() => {}}
      />
      <MentorshipHotspot number={1} label="Test Hotspot" />
      <div data-testid="clean-view-status">
        {isCleanView ? 'CLEAN_VIEW_ACTIVE' : 'SENSORY_VIEW_ACTIVE'}
      </div>
    </div>
  );
}

describe('Act I Clean Reading View Toggle Component Tests', () => {
  it('toggles HS_ACT1_CLEAN_VIEW_BTN, suppresses overlays, and updates state', () => {
    render(
      <StudioProvider initialState={{ currentStage: 0, isCleanView: false }}>
        <Act1TestHarness />
      </StudioProvider>
    );

    // Initial state: Sensory View Active & MentorshipHotspot visible
    expect(screen.getByTestId('clean-view-status').textContent).toBe('SENSORY_VIEW_ACTIVE');
    expect(screen.getByText('1')).toBeInTheDocument();

    // Locate HS_ACT1_CLEAN_VIEW_BTN toggle button
    const cleanViewBtn = screen.getByRole('button', { name: /Clean View|Sensory View/i });
    expect(cleanViewBtn).toHaveAttribute('data-hotspot-id', 'HS_ACT1_CLEAN_VIEW_BTN');

    // Click toggle to enable Clean View
    fireEvent.click(cleanViewBtn);

    // State updates to CLEAN_VIEW_ACTIVE and MentorshipHotspot overlays are suppressed
    expect(screen.getByTestId('clean-view-status').textContent).toBe('CLEAN_VIEW_ACTIVE');
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});
