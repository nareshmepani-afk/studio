import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SoloStage from '../SoloStage';
import React from 'react';
import { Memory } from '@/types';
import { toast } from 'sonner';

// Mock framer-motion to simplify DOM checks and animations
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
    dragConstraints,
    dragControls,
    dragListener,
    dragMomentum,
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
    useDragControls: () => ({ start: vi.fn() }),
  };
});

// Mock Lucide icons using importOriginal to prevent missing export errors
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    Minus: () => <span data-testid="icon-minus" />,
    Plus: () => <span data-testid="icon-plus" />,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/hooks/use-dictionary', () => ({
  useDictionary: () => ({ dictionary: {} }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' }, loading: false }),
}));

// Define stable references outside the mock hook to prevent infinite render loops in video refs
const stableStream = { getAudioTracks: () => [] };
const stableCapabilities = {};

let mockIsWirelessLinked = false;
let mockActiveInput = 'studio';
const mockSwitchInput = vi.fn();

vi.mock('@/hooks/useCamera', () => ({
  useCamera: () => ({ 
    active: true, 
    start: vi.fn(), 
    stop: vi.fn(), 
    stream: stableStream, 
    isMuted: false,
    capabilities: stableCapabilities,
    applyZoom: vi.fn(),
    zoomValue: 1.0,
    switchCamera: vi.fn(),
    hasMultipleCameras: false,
    activeInput: mockActiveInput,
    switchInput: mockSwitchInput,
    isWirelessLinked: mockIsWirelessLinked
  }),
}));

vi.mock('@/hooks/use-media-recorder', () => ({
  useMediaRecorder: () => ({ status: 'inactive', startRecording: vi.fn(), stopRecording: vi.fn(), mediaBlobUrl: null }),
}));

vi.mock('@/hooks/use-audio-level', () => ({
  useAudioLevel: () => 0,
}));

vi.mock('@/actions/aiWeaver', () => ({
  generateInterviewQuestion: vi.fn(),
  analyzeFraming: vi.fn(),
}));

vi.mock('@/actions/studio-vocal', () => ({
  synthesizeStudioSpeech: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({ 
    currentStage: 2, 
    setStage: vi.fn(), 
    modality: 'pen', 
    isReviewing: false,
    isProductionLocked: false,
    scrollSpeed: 2.0,
    setScrollSpeed: vi.fn(),
    autoScroll: false,
    actions: {
      setSelectedVision: vi.fn(),
      setIsReviewing: vi.fn(),
      setAppliedCatalysts: vi.fn(),
      toggleScrolling: vi.fn(),
    }
  }),
}));

vi.mock('../MemoryForm', async () => {
  const React = await import('react');
  const MockForm = React.forwardRef(({ data, update }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      triggerUpdate: (delta: any) => update(delta)
    }));
    return React.createElement('div', { 'data-testid': 'mock-memory-form' });
  });
  MockForm.displayName = 'MemoryForm';
  return {
    MemoryForm: MockForm
  };
});

describe('SoloStage Calibration Panels Test', () => {
  const mockUpdate = vi.fn();
  const initialMemory: Memory = {
    id: 'test-secure-id',
    title: 'Historic Journey',
    description: 'Initial script description',
    location: 'Nairobi',
    country: 'Kenya',
    tags: ['family', '1964'],
    status: 'draft',
    lastEdited: Date.now(),
    dateComponents: { day: '12', month: 'May', year: '1964' },
    scriptBlocks: []
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('privacy_optics_muted', 'false');
  });

  it('renders all three pre-flight calibration panels correctly when mentor is active', () => {
    const formRef = React.createRef<any>();
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
        mentorActive={true}
        formRef={formRef}
      />
    );

    // Verify AI Director Active is present
    expect(screen.getByText('AI Director Active')).toBeInTheDocument();

    // Verify AI Director Active has the correct overlap-prevention wrapper classes
    const aiDirectorText = screen.getByText('AI Director Active');
    const aiDirectorWrapper = aiDirectorText.closest('.pointer-events-auto');
    expect(aiDirectorWrapper).toHaveClass('left-6');
    expect(aiDirectorWrapper).toHaveClass('top-6');

    // Verify Director's Tech Scout is present
    expect(screen.getByText("Director's Tech Scout")).toBeInTheDocument();

    // Verify Optics Cinematic Styling is present
    expect(screen.getByText('Cinematic Styling')).toBeInTheDocument();

    // Verify Optics Cinematic Styling has the correct overlap-prevention wrapper classes
    const cinematicStylingText = screen.getByText('Cinematic Styling');
    const cinematicStylingWrapper = cinematicStylingText.closest('.pointer-events-auto');
    expect(cinematicStylingWrapper).toHaveClass('right-6');
    expect(cinematicStylingWrapper).toHaveClass('top-6');
  });


  it('renders all three pre-flight calibration panels correctly even when mentor is inactive', () => {
    const formRef = React.createRef<any>();
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
        mentorActive={false}
        formRef={formRef}
      />
    );

    // Verify AI Director Active is present (rendered during calibration despite mentorActive = false)
    expect(screen.getByText('AI Director Active')).toBeInTheDocument();

    // Verify Director's Tech Scout is present
    expect(screen.getByText("Director's Tech Scout")).toBeInTheDocument();

    // Verify Optics Cinematic Styling is present
    expect(screen.getByText('Cinematic Styling')).toBeInTheDocument();
  });


  it('allows user to minimise and restore the AI Director panel', () => {
    const formRef = React.createRef<any>();
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
        mentorActive={true}
        formRef={formRef}
      />
    );

    // Find the AI Director Active title card
    expect(screen.getByText('AI Director Active')).toBeInTheDocument();

    // Click Minimise (-) on AI Director Active panel (use getAllByTitle to select first of the 3 panels)
    const minimiseBtn = screen.getAllByTitle('Minimise Panel')[0];
    fireEvent.click(minimiseBtn);

    // AI Director Active is now minimised - check title representation
    expect(screen.getByText('AI Director')).toBeInTheDocument();
    expect(screen.queryByText('AI Director Active')).not.toBeInTheDocument();

    // Click Restore (+) on the compact AI Director panel (use getAllByTitle to select first restored panel)
    const restoreBtn = screen.getAllByTitle('Restore Panel')[0];
    fireEvent.click(restoreBtn);

    // AI Director Active should be restored to full view
    expect(screen.getByText('AI Director Active')).toBeInTheDocument();
  });

  it("allows user to minimise and restore the Director's Tech Scout panel", () => {
    const formRef = React.createRef<any>();
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
        mentorActive={true}
        formRef={formRef}
      />
    );

    // Find the Tech Scout title card
    expect(screen.getByText("Director's Tech Scout")).toBeInTheDocument();

    // Click Minimise (-) on Tech Scout panel (index 1 of active panels)
    const minimiseBtn = screen.getAllByTitle('Minimise Panel')[1];
    fireEvent.click(minimiseBtn);

    // Tech Scout is now minimised - check title representation
    expect(screen.getByText('Tech Scout')).toBeInTheDocument();
    expect(screen.queryByText("Director's Tech Scout")).not.toBeInTheDocument();

    // Click Restore (+) on the compact Tech Scout panel
    const restoreBtn = screen.getAllByTitle('Restore Panel')[0];
    fireEvent.click(restoreBtn);

    // Tech Scout should be restored to full view
    expect(screen.getByText("Director's Tech Scout")).toBeInTheDocument();
  });

  it('allows user to minimise and restore the Cinematic Styling panel', () => {
    const formRef = React.createRef<any>();
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
        mentorActive={true}
        formRef={formRef}
      />
    );

    // Find the Cinematic Styling title card
    expect(screen.getByText('Cinematic Styling')).toBeInTheDocument();

    // Click Minimise (-) on Cinematic Styling panel (index 2 of active panels)
    const minimiseBtn = screen.getAllByTitle('Minimise Panel')[2];
    fireEvent.click(minimiseBtn);

    // Cinematic Styling is now minimised - check title representation
    expect(screen.getByText('Optics')).toBeInTheDocument();
    expect(screen.queryByText('Cinematic Styling')).not.toBeInTheDocument();

    // Click Restore (+) on the compact Cinematic Styling panel
    const restoreBtn = screen.getAllByTitle('Restore Panel')[0];
    fireEvent.click(restoreBtn);

    // Cinematic Styling should be restored to full view
    expect(screen.getByText('Cinematic Styling')).toBeInTheDocument();
  });

  it('minimises the Tech Scout panel when Check Shot Linter is clicked', () => {
    const formRef = React.createRef<any>();
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
        mentorActive={true}
        formRef={formRef}
      />
    );

    // Verify Director's Tech Scout is fully rendered initially
    expect(screen.getByText("Director's Tech Scout")).toBeInTheDocument();

    // Click "Check Shot Linter" button
    const linterBtn = screen.getByText('Check Shot Linter');
    fireEvent.click(linterBtn);

    // Tech Scout panel should be minimised automatically
    expect(screen.getByText('Tech Scout')).toBeInTheDocument();
    expect(screen.queryByText("Director's Tech Scout")).not.toBeInTheDocument();
  });

  it('renders multi-cam switcher and viewport metadata when remote camera is linked', () => {
    // Enable wireless connection simulation
    mockIsWirelessLinked = true;
    mockActiveInput = 'wireless';
    
    const formRef = React.createRef<any>();
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
        mentorActive={true}
        formRef={formRef}
      />
    );
    
    // Verify viewport metadata tag shows Remote Wireless input
    expect(screen.getByText('INPUT: REMOTE WIRELESS LENS (1080p)')).toBeInTheDocument();
    
    // Verify switcher button segments are rendered
    expect(screen.getByText('Studio Cam')).toBeInTheDocument();
    expect(screen.getByText('Wireless Lens')).toBeInTheDocument();
  });

  it('automatically opens and active-syncs Interviewer window when record is clicked in interview modality', () => {
    const formRef = React.createRef<any>();
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
        mentorActive={true}
        formRef={formRef}
      />
    );
    
    // Confirm technical alignment first to render performance controls
    const techConfirmBtn = screen.getByText('Confirm Technical Alignment');
    fireEvent.click(techConfirmBtn);
    
    // Toggle modality to interview
    const modalityBtn = screen.getByTitle('Toggle Scripted vs Interview Mode');
    fireEvent.click(modalityBtn);
    
    // Auto effect makes isInterviewMode true. Let's toggle it to false to close interviewer card.
    const startInterviewBtn = screen.getByText('Interviewer Active');
    fireEvent.click(startInterviewBtn);
    
    // Click Start Performance button
    const recordBtn = screen.getByRole('button', { name: /Start Performance/i });
    fireEvent.click(recordBtn);
    
    // Both windows should be automatically opened/active-synced
    expect(screen.getByText('Interviewer Active')).toBeInTheDocument();
  });
});


