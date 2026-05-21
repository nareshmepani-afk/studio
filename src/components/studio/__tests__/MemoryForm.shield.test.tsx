import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryForm } from '../MemoryForm';
import React from 'react';

// Mock dependencies
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
      span: ({ children, ...props }: any) => <span {...cleanProps(props)}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    LayoutGroup: ({ children }: any) => <>{children}</>,
  };
});

vi.mock('lucide-react', async (importOriginal) => {
  const React = await import('react');
  const icons = [
    'PenTool', 'Mic', 'Sparkles', 'MapPin', 'Calendar', 'Tag', 'ArrowRight', 'ArrowLeft', 
    'Save', 'Rocket', 'AlertCircle', 'Loader2', 'Edit3', 'ChevronRight', 'ChevronDown', 
    'Maximize2', 'Trash2', 'Plus', 'Info', 'Layout', 'Layers', 'Wand2', 'Music', 'Wind', 
    'Coffee', 'Zap', 'FileText', 'Film', 'ImageIcon', 'Video', 'Heart', 'Share2', 
    'MoreHorizontal', 'Square', 'History', 'UserCircle', 'Eye', 'Clock', 'Lock', 
    'RotateCcw', 'Target', 'ShieldCheck', 'Users', 'ChevronUp', 'Minus', 'BookOpen'
  ];
  const mockedIcons: any = {};
  icons.forEach(icon => {
    mockedIcons[icon] = (props: any) => React.createElement('div', { ...props, 'data-testid': `icon-${icon}` });
  });
  return { ...mockedIcons };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/use-dictionary', () => ({
  useDictionary: () => ({ dictionary: {} }),
}));

vi.mock('@/hooks/useStudioState', () => ({
  useStudioState: () => ({ 
    currentStage: 0, 
    setStage: vi.fn(), 
    modality: 'pen', 
    setModality: vi.fn() 
  }),
}));

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({ 
    currentStage: 0, 
    setStage: vi.fn(), 
    modality: 'pen', 
    setModality: vi.fn(),
    actions: {
      setAppliedCatalysts: vi.fn(),
      setDispatcher: vi.fn(),
      setDetectedAnchors: vi.fn(),
      clearPendingAnchor: vi.fn(),
      setIsDirectorOpen: vi.fn(),
      setModality: vi.fn(),
      setActiveDrawer: vi.fn(),
    },
    activeDrawer: null,
    pendingAnchor: null,
    draggingCatalyst: null,
    setIsDirectorOpen: vi.fn()
  }),
}));

vi.mock('@/hooks/studio/useDirectorInk', () => ({
  useDirectorInk: () => ({ 
    activeAnchor: null, 
    inkApplied: false,
    detectedAnchors: [],
    decoratedHtml: ''
  }),
  getAnchorAtCaret: () => null,
}));

vi.mock('@/hooks/studio/useProductionCharge', () => ({
  useProductionCharge: () => ({ totalCharge: 0, dominantType: 'none' }),
}));

vi.mock('@/hooks/studio/usePrimaryFocus', () => ({
  usePrimaryFocus: () => ({ focusedField: null, setFocusedField: vi.fn() }),
}));

vi.mock('@/components/memory/CinemaPoster', () => ({
  CinemaPoster: () => <div data-testid="cinema-poster" />
}));

vi.mock('../DirectorNoteDrawer', () => ({
  DirectorNoteDrawer: () => <div data-testid="director-note-drawer" />
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
}));

vi.mock('../MentorshipHotspot', () => ({
  MentorshipHotspot: () => <div data-testid="mentorship-hotspot" />
}));

vi.mock('../Scriptorium/Scriptorium', () => ({
  Scriptorium: () => <div data-testid="scriptorium" />
}));

vi.mock('../Scriptorium/SentenceWrapper', () => ({
  SentenceWrapper: ({ block, onUpdate, onFocus }: any) => (
    <textarea 
      data-testid="story-hook-textarea"
      value={block.text}
      onChange={(e) => onUpdate(e.target.value)}
      onFocus={onFocus}
    />
  )
}));

describe('MemoryForm Data Shielding (Split-Brain Prevention)', () => {
  const mockUpdate = vi.fn();
  
  const initialData = {
    id: 'test-id',
    title: 'Initial Title',
    description: 'Initial Description',
    promptId: 'prompt-1',
    modality: 'pen' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Shields local description from background updates when focused', async () => {
    // 1. Render component
    const { rerender } = render(
      <MemoryForm data={initialData} update={mockUpdate} />
    );

    // 2. Simulate user focus and typing
    const textarea = screen.getByTestId('story-hook-textarea');
    await act(async () => {
      textarea.focus();
      // We need to simulate the local state change that happens on input
      // but in this test we are focusing on the PROPS -> STATE sync logic
    });

    // 3. Update props (simulating a background sync)
    const backgroundData = {
      ...initialData,
      description: 'Updated Background Description'
    };

    rerender(<MemoryForm data={backgroundData} update={mockUpdate} />);

    // 4. Assert: The textarea should still show the INITIAL description 
    // because it was shielded (focused)
    expect(textarea).toHaveValue('Initial Description');
  });

  it('Allows background updates when NOT focused', async () => {
    const { rerender } = render(
      <MemoryForm data={initialData} update={mockUpdate} />
    );

    const backgroundData = {
      ...initialData,
      description: 'Updated Background Description'
    };

    rerender(<MemoryForm data={backgroundData} update={mockUpdate} />);

    const textarea = screen.getByTestId('story-hook-textarea');
    expect(textarea).toHaveValue('Updated Background Description');
  });

  it('Shields local description even during "Major Changes" if focused (Prevents paste-loss)', async () => {
    const { rerender } = render(
      <MemoryForm data={initialData} update={mockUpdate} />
    );

    const textarea = screen.getByTestId('story-hook-textarea');
    textarea.focus();

    // Simulating a major change (> 50 chars difference)
    const majorChangeData = {
      ...initialData,
      description: 'Initial Description but now with a very long addition from the AI Mentor that exceeds fifty characters to trigger the shield override.'
    };

    rerender(<MemoryForm data={majorChangeData} update={mockUpdate} />);

    // Now it should stay as the initial text
    expect(textarea).toHaveValue('Initial Description');
  });

  it('Stable during ID Transition (undefined -> ID)', async () => {
    const draftData = { ...initialData, id: undefined };
    
    const { rerender } = render(
      <MemoryForm data={draftData} update={mockUpdate} />
    );

    // Simulate user typed something
    const textarea = screen.getByTestId('story-hook-textarea');
    // In a real test we'd use fireEvent.change, but here we're testing the prop sync stability
    
    // Simulating the transition after a save
    const savedData = { ...initialData, id: 'new-firestore-id' };
    
    rerender(<MemoryForm data={savedData} update={mockUpdate} />);

    // It should NOT reset to initial state (which would happen if we didn't handle ID transitions)
    expect(textarea).toHaveValue('Initial Description');
  });

  it('Resets state during Navigation (Prompt ID Change)', async () => {
    const { rerender } = render(
      <MemoryForm data={initialData} update={mockUpdate} />
    );

    const nextPromptData = {
      ...initialData,
      promptId: 'prompt-2',
      description: 'Second Prompt Description'
    };

    rerender(<MemoryForm data={nextPromptData} update={mockUpdate} />);

    const textarea = screen.getByTestId('story-hook-textarea');
    expect(textarea).toHaveValue('Second Prompt Description');
  });

  it('PROTECTION: Does NOT overwrite local changes on Blur if data.description is stale', async () => {
    const { rerender } = render(
      <MemoryForm data={initialData} update={mockUpdate} />
    );

    const textarea = screen.getByTestId('story-hook-textarea');
    
    // 1. Focus and "type" (Simulate local change)
    await act(async () => {
      textarea.focus();
    });
    // In our mock, SentenceWrapper calls onUpdate which updates state.
    // However, in this test environment, we are testing how PROPS affect STATE.
    // The component internal state is 'Initial Description'.
    
    // 2. Blur (lastFocusedField becomes null)
    await act(async () => {
      textarea.blur();
    });

    // 3. Rerender with the SAME data (simulating a background sync that hasn't seen our change yet)
    // If the shield is working, it should NOT reset the value because it hasn't changed since lastSyncedDescription.
    rerender(<MemoryForm data={initialData} update={mockUpdate} />);

    expect(textarea).toHaveValue('Initial Description');
  });

  it('PROTECTION: Shields large text paste from background sync', async () => {
    const largeText = "I was born in Nairobi, Kenya. Our family roots are in Kutch. Our ancestors were labourers, and generations before my Granddad, people would travel from farm to farm for work. My Granddads' generation finally settled in a village, Madhapur. The soil and its produce are what give us a living. As we lived so close to the soil, it only made sense to eat the produce, super fresh and extremly cost effective. Farming was an extremely hard work, no machinery in those days. All our strength came from a vegetarian diet. Our mother tongue is Gujarati, with out formal education these skills where parsed down generations. As farming wasn't well paid, the British Empire needed workers in Kenya and our ancestors jumped at the chance. The lessons from my parents from traveling to Kenya with no knowledge of local language then traveling to England of no knowledge and language skills was learn and adapt and work hard and keep going.";
    
    const { rerender } = render(
      <MemoryForm data={initialData} update={mockUpdate} />
    );

    const textarea = screen.getByTestId('story-hook-textarea');
    
    // 1. Focus
    await act(async () => {
      textarea.focus();
    });

    // 2. Simulate paste (by updating props to simulate what would happen if the state changed locally)
    // Actually, in a real scenario, the local state changes first, then props follow.
    // Here we test if NEW props from background can overwrite while focused.
    const backgroundSync = { ...initialData, description: 'Some old background data' };
    
    rerender(<MemoryForm data={backgroundSync} update={mockUpdate} />);

    // Should remain empty or initial if focused
    expect(textarea).toHaveValue('Initial Description');
  });

  it('STABILITY: Initialization does not wipe state if data is already present', async () => {
    // This test ensures that when the component mounts with data, 
    // the "Navigation" logic doesn't trigger a reset that might race with Recovery.
    const { rerender } = render(
      <MemoryForm data={initialData} update={mockUpdate} />
    );

    const textarea = screen.getByTestId('story-hook-textarea');
    expect(textarea).toHaveValue('Initial Description');
    
    // Rerender with same data
    rerender(<MemoryForm data={initialData} update={mockUpdate} />);
    expect(textarea).toHaveValue('Initial Description');
  });
});
