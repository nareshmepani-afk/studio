import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ProductionDeck from '../ProductionDeck';
import React from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';

// Let's capture the props of SoloStage
let capturedSoloStageProps: any = null;

vi.mock('../SoloStage', () => ({
  default: (props: any) => {
    capturedSoloStageProps = props;
    return <div data-testid="solo-stage" />;
  }
}));

// Mock useStudioState dynamically
let mockCurrentStage = 1; // Act II: Weave
let mockIsProductionLocked = false;

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: vi.fn().mockImplementation(() => ({
    currentStage: mockCurrentStage,
    modality: 'pen',
    isDirectorOpen: false,
    isReviewing: false,
    selectedVision: { type: null, label: null },
    isProductionLocked: mockIsProductionLocked,
    mentorContext: {
      mentorModeActive: false,
      isOverlayOpen: false,
      isManualMentor: false,
      toggleMentor: vi.fn(),
      triggerWhisper: vi.fn(),
      closeOverlay: vi.fn(),
      getWhisper: vi.fn().mockImplementation((act) => ({ 
        act, 
        whisper: 'Mock guidance.' 
      }))
    },
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
  }) as any)
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

// Mock sub-components
vi.mock('../PerspectiveWrapper', () => ({ default: ({ children }: any) => <div data-testid="perspective-wrapper">{children}</div> }));
vi.mock('../CollaborativeStage', () => ({ default: () => <div data-testid="collaborative-stage" /> }));
vi.mock('../InstrumentSelection', () => ({ InstrumentSelection: () => <div data-testid="instrument-selection" /> }));
vi.mock('../ProductionRail', () => ({ ProductionRail: () => <div data-testid="production-rail" />, PRODUCTION_ACTS: [] }));
vi.mock('../ResizableDivider', () => ({ ResizableDivider: () => <div data-testid="resizable-divider" /> }));
vi.mock('../ProductionControlBar', () => ({ ProductionControlBar: () => <div data-testid="production-control-bar" /> }));
vi.mock('../SensoryCatalystHUD', () => ({ SensoryCatalystHUD: () => <div data-testid="sensory-catalyst-hud" /> }));
vi.mock('../overlays/ThresholdGuard', () => ({ ThresholdGuard: () => <div data-testid="threshold-guard" /> }));
vi.mock('../overlays/ProductionPreFlight', () => ({ ProductionPreFlight: () => <div data-testid="production-pre-flight" /> }));
vi.mock('../overlays/OnboardingOverlay', () => ({ OnboardingOverlay: () => null }));
vi.mock('../MentorGuide', () => ({ MentorGuide: () => <div data-testid="mentorship-overlay" /> }));

describe('ProductionDeck Word Count Bypass tests', () => {
  const mockUpdate = vi.fn();
  const mockMemoryData = {
    id: 'mem-1',
    description: 'A beautiful memory under 150 words.',
    modality: 'pen',
    status: 'draft',
    title: 'Short Story',
    location: 'Nairobi',
    dateComponents: { year: '1984' },
    isProductionLocked: false
  };

  it('restricts progression in Act II if no sensory weave has been selected', () => {
    mockCurrentStage = 1;
    mockIsProductionLocked = false;
    capturedSoloStageProps = null;

    render(
      <ProductionDeck 
        memoryData={mockMemoryData} 
        onUpdate={mockUpdate} 
        layoutMode="takeover" 
        onToggleLayout={vi.fn()} 
      />
    );

    expect(capturedSoloStageProps).not.toBeNull();
    // Progression is blocked because activeVision is not selected
    expect(capturedSoloStageProps.isComplete).toBe(false);
  });

  it('allows progression in Act II once a valid sensory weave has been selected', () => {
    mockCurrentStage = 1;
    mockIsProductionLocked = true;
    capturedSoloStageProps = null;

    const wovenMemoryData = {
      ...mockMemoryData,
      activeVision: 'poetic',
      activeVisionLabel: 'The Poetic Weave'
    };

    render(
      <ProductionDeck 
        memoryData={wovenMemoryData} 
        onUpdate={mockUpdate} 
        layoutMode="takeover" 
        onToggleLayout={vi.fn()} 
      />
    );

    expect(capturedSoloStageProps).not.toBeNull();
    // isComplete should be true since a valid weave has been selected
    expect(capturedSoloStageProps.isComplete).toBe(true);
  });
});
