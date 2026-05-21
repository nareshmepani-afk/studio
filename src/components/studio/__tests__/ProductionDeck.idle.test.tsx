import { render, act, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ProductionDeck from '../ProductionDeck';
import React from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';

// 1. Comprehensive Mocking for the Studio Environment
vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: vi.fn().mockReturnValue({
    currentStage: 0,
    modality: 'pen',
    isDirectorOpen: false,
    isReviewing: false,
    selectedVision: { type: null, label: null },
    isProductionLocked: false,
    actions: {
      setIsReviewing: vi.fn(),
      setReviewDrafts: vi.fn(),
      setIsGeneratingDrafts: vi.fn(),
      setModality: vi.fn(),
      setStage: vi.fn(),
      setIsDirectorOpen: vi.fn(),
      setPolishedOriginalHook: vi.fn(),
      setTimeframeScope: vi.fn(),
      setDurationQuantity: vi.fn(),
      setDurationUnit: vi.fn(),
      setNarratorAgeAtTime: vi.fn(),
      setSynthesisError: vi.fn(),
      setSelectedVision: vi.fn(),
      setIsProductionLocked: vi.fn()
    }
  }) as any
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
    toString: () => '',
  }),
  usePathname: () => '/studio',
}));

vi.mock('framer-motion', () => {
  const cleanProps = ({
    whileHover,
    whileTap,
    layoutId,
    initial,
    animate,
    exit,
    transition,
    variants,
    viewport,
    drag,
    dragElastic,
    dragSnapToOrigin,
    onDragStart,
    onDragEnd,
    ...rest
  }: any) => rest;
  return {
    motion: {
      div: ({ children, ...props }: any) => <div {...cleanProps(props)}>{children}</div>,
      button: ({ children, ...props }: any) => <button {...cleanProps(props)}>{children}</button>,
      header: ({ children, ...props }: any) => <header {...cleanProps(props)}>{children}</header>,
      span: ({ children, ...props }: any) => <span {...cleanProps(props)}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

let mockMentorModeActive = false;
let mockIsManualMentor = false;
const mockToggleMentor = vi.fn();
vi.mock('@/hooks/studio/useMentorLifeline', () => ({
  useMentorLifeline: () => ({
    mentorModeActive: mockMentorModeActive,
    isOverlayOpen: false,
    isManualMentor: mockIsManualMentor,
    toggleMentor: mockToggleMentor,
    triggerWhisper: vi.fn(),
    closeOverlay: vi.fn(),
    getWhisper: vi.fn().mockReturnValue(null)
  })
}));

vi.mock('@/hooks/studio/useProductionCharge', () => ({
  useProductionCharge: () => ({
    totalCharge: 0,
    dominantType: 'visual'
  })
}));

vi.mock('@/hooks/useRecaptcha', () => ({
  useRecaptcha: () => ({
    executeAction: vi.fn()
  })
}));

// Mock sub-components to avoid deep rendering issues
vi.mock('../PerspectiveWrapper', () => ({ default: () => <div data-testid="perspective-wrapper" /> }));
vi.mock('../SoloStage', () => ({ default: () => <div data-testid="solo-stage" /> }));
vi.mock('../CollaborativeStage', () => ({ default: () => <div data-testid="collaborative-stage" /> }));
vi.mock('../InstrumentSelection', () => ({ InstrumentSelection: () => <div data-testid="instrument-selection" /> }));
vi.mock('../ProductionRail', () => ({ ProductionRail: () => <div data-testid="production-rail" />, PRODUCTION_ACTS: [] }));
vi.mock('../ResizableDivider', () => ({ ResizableDivider: () => <div data-testid="resizable-divider" /> }));
vi.mock('../ProductionControlBar', () => ({ ProductionControlBar: () => <div data-testid="production-control-bar" /> }));
vi.mock('../SensoryCatalystHUD', () => ({ SensoryCatalystHUD: () => <div data-testid="sensory-catalyst-hud" /> }));
vi.mock('../overlays/ThresholdGuard', () => ({ ThresholdGuard: () => <div data-testid="threshold-guard" /> }));
vi.mock('../overlays/ProductionPreFlight', () => ({ ProductionPreFlight: () => <div data-testid="production-pre-flight" /> }));
vi.mock('../overlays/OnboardingOverlay', () => ({ OnboardingOverlay: ({ isOpen }: any) => isOpen ? <div data-testid="onboarding-overlay" /> : null }));
vi.mock('../MentorshipOverlay', () => ({ MentorshipOverlay: () => <div data-testid="mentorship-overlay" /> }));

describe('ProductionDeck Idle Experience', () => {
  const mockUpdate = vi.fn();
  const mockMemoryData = {
    id: 'mem-1',
    description: 'Initial description',
    modality: 'pen',
    status: 'draft'
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    mockMentorModeActive = false;
    mockIsManualMentor = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers Mentor auto-activation after 90 seconds of inactivity', () => {
    render(
      <ProductionDeck 
        memoryData={mockMemoryData} 
        onUpdate={mockUpdate} 
        layoutMode="takeover" 
        onToggleLayout={vi.fn()} 
      />
    );

    // Initial state: toggleMentor should not have been called
    expect(mockToggleMentor).not.toHaveBeenCalled();

    // Advance time by 89 seconds
    act(() => {
      vi.advanceTimersByTime(89000);
    });
    expect(mockToggleMentor).not.toHaveBeenCalled();

    // Advance to 90 seconds
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Verification: toggleMentor should be called with false (automatic trigger)
    expect(mockToggleMentor).toHaveBeenCalledWith(false);
  });

  it('resets the idle timer on user activity', () => {
    render(
      <ProductionDeck 
        memoryData={mockMemoryData} 
        onUpdate={mockUpdate} 
        layoutMode="takeover" 
        onToggleLayout={vi.fn()} 
      />
    );

    // Advance time by 45 seconds
    act(() => {
      vi.advanceTimersByTime(45000);
    });

    // Simulate user activity (mousemove)
    fireEvent.mouseMove(window);

    // Advance another 45 seconds (total 90s since start, but only 45s since activity)
    act(() => {
      vi.advanceTimersByTime(45000);
    });

    // Verification: should NOT have triggered yet
    expect(mockToggleMentor).not.toHaveBeenCalled();

    // Advance another 45 seconds (reaches 90s since activity)
    act(() => {
      vi.advanceTimersByTime(45000);
    });

    expect(mockToggleMentor).toHaveBeenCalledWith(false);
  });

  it('does not trigger idle timer if not in Act I (currentStage !== 0)', () => {
    // Override currentStage for this test
    vi.mocked(useStudioState).mockReturnValue({
      currentStage: 1, // Act II
      modality: 'pen',
      isDirectorOpen: false,
      isReviewing: false,
      selectedVision: { type: null, label: null },
      isProductionLocked: false,
      actions: {
        setIsReviewing: vi.fn(),
        setReviewDrafts: vi.fn(),
        setIsGeneratingDrafts: vi.fn(),
        setModality: vi.fn(),
        setStage: vi.fn(),
        setIsDirectorOpen: vi.fn(),
        setPolishedOriginalHook: vi.fn(),
        setTimeframeScope: vi.fn(),
        setDurationQuantity: vi.fn(),
        setDurationUnit: vi.fn(),
        setNarratorAgeAtTime: vi.fn(),
        setSynthesisError: vi.fn(),
        setSelectedVision: vi.fn(),
        setIsProductionLocked: vi.fn()
      }
    } as any);

    render(
      <ProductionDeck 
        memoryData={mockMemoryData} 
        onUpdate={mockUpdate} 
        layoutMode="takeover" 
        onToggleLayout={vi.fn()} 
      />
    );

    act(() => {
      vi.advanceTimersByTime(100000);
    });

    expect(mockToggleMentor).not.toHaveBeenCalled();
  });

  it('does not trigger idle timer when reviewing synthesized drafts (isReviewing === true)', () => {
    // Override isReviewing for this test
    vi.mocked(useStudioState).mockReturnValue({
      currentStage: 0,
      modality: 'pen',
      isDirectorOpen: false,
      isReviewing: true, // Actively reviewing
      selectedVision: { type: null, label: null },
      isProductionLocked: false,
      actions: {
        setIsReviewing: vi.fn(),
        setReviewDrafts: vi.fn(),
        setIsGeneratingDrafts: vi.fn(),
        setModality: vi.fn(),
        setStage: vi.fn(),
        setIsDirectorOpen: vi.fn(),
        setPolishedOriginalHook: vi.fn(),
        setTimeframeScope: vi.fn(),
        setDurationQuantity: vi.fn(),
        setDurationUnit: vi.fn(),
        setNarratorAgeAtTime: vi.fn(),
        setSynthesisError: vi.fn(),
        setSelectedVision: vi.fn(),
        setIsProductionLocked: vi.fn()
      }
    } as any);

    render(
      <ProductionDeck 
        memoryData={mockMemoryData} 
        onUpdate={mockUpdate} 
        layoutMode="takeover" 
        onToggleLayout={vi.fn()} 
      />
    );

    act(() => {
      vi.advanceTimersByTime(100000);
    });

    expect(mockToggleMentor).not.toHaveBeenCalled();
  });

  it('triggers Director Onboarding Overlay when mentorModeActive is true and not reviewing', () => {
    mockMentorModeActive = true;
    
    vi.mocked(useStudioState).mockReturnValue({
      currentStage: 0,
      modality: 'pen',
      isDirectorOpen: false,
      isReviewing: false,
      selectedVision: { type: null, label: null },
      isProductionLocked: false,
      actions: {
        setIsReviewing: vi.fn(),
        setReviewDrafts: vi.fn(),
        setIsGeneratingDrafts: vi.fn(),
        setModality: vi.fn(),
        setStage: vi.fn(),
        setIsDirectorOpen: vi.fn(),
        setPolishedOriginalHook: vi.fn(),
        setTimeframeScope: vi.fn(),
        setDurationQuantity: vi.fn(),
        setDurationUnit: vi.fn(),
        setNarratorAgeAtTime: vi.fn(),
        setSynthesisError: vi.fn(),
        setSelectedVision: vi.fn(),
        setIsProductionLocked: vi.fn()
      }
    } as any);

    const { queryByTestId } = render(
      <ProductionDeck 
        memoryData={mockMemoryData} 
        onUpdate={mockUpdate} 
        layoutMode="takeover" 
        onToggleLayout={vi.fn()} 
      />
    );

    expect(queryByTestId('onboarding-overlay')).not.toBeNull();
  });

  it('does NOT trigger Director Onboarding Overlay when reviewing synthesized drafts (isReviewing === true)', () => {
    mockMentorModeActive = true;
    
    vi.mocked(useStudioState).mockReturnValue({
      currentStage: 0,
      modality: 'pen',
      isDirectorOpen: false,
      isReviewing: true,
      selectedVision: { type: null, label: null },
      isProductionLocked: false,
      actions: {
        setIsReviewing: vi.fn(),
        setReviewDrafts: vi.fn(),
        setIsGeneratingDrafts: vi.fn(),
        setModality: vi.fn(),
        setStage: vi.fn(),
        setIsDirectorOpen: vi.fn(),
        setPolishedOriginalHook: vi.fn(),
        setTimeframeScope: vi.fn(),
        setDurationQuantity: vi.fn(),
        setDurationUnit: vi.fn(),
        setNarratorAgeAtTime: vi.fn(),
        setSynthesisError: vi.fn(),
        setSelectedVision: vi.fn(),
        setIsProductionLocked: vi.fn()
      }
    } as any);

    const { queryByTestId } = render(
      <ProductionDeck 
        memoryData={mockMemoryData} 
        onUpdate={mockUpdate} 
        layoutMode="takeover" 
        onToggleLayout={vi.fn()} 
      />
    );

    expect(queryByTestId('onboarding-overlay')).toBeNull();
  });

  it('rehydrates isProductionLocked state from memoryData', () => {
    const mockSetIsProductionLocked = vi.fn();
    vi.mocked(useStudioState).mockReturnValue({
      currentStage: 0,
      modality: 'pen',
      isDirectorOpen: false,
      isReviewing: false,
      selectedVision: { type: null, label: null },
      isProductionLocked: false,
      actions: {
        setIsReviewing: vi.fn(),
        setReviewDrafts: vi.fn(),
        setIsGeneratingDrafts: vi.fn(),
        setModality: vi.fn(),
        setStage: vi.fn(),
        setIsDirectorOpen: vi.fn(),
        setPolishedOriginalHook: vi.fn(),
        setTimeframeScope: vi.fn(),
        setDurationQuantity: vi.fn(),
        setDurationUnit: vi.fn(),
        setNarratorAgeAtTime: vi.fn(),
        setSynthesisError: vi.fn(),
        setSelectedVision: vi.fn(),
        setIsProductionLocked: mockSetIsProductionLocked
      }
    } as any);

    const lockedMemoryData = {
      ...mockMemoryData,
      isProductionLocked: true
    };

    render(
      <ProductionDeck 
        memoryData={lockedMemoryData} 
        onUpdate={mockUpdate} 
        layoutMode="takeover" 
        onToggleLayout={vi.fn()} 
      />
    );

    expect(mockSetIsProductionLocked).toHaveBeenCalledWith(true);
  });
});
