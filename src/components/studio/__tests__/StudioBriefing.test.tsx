import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { StudioBriefing } from '../StudioBriefing';
import SoloStage from '../SoloStage';
import { Memory } from '@/types';

// Mock heavy visual components & framer-motion
vi.mock('framer-motion', () => {
  const cleanProps = ({
    whileHover, whileTap, layoutId, initial, animate, exit, transition,
    variants, viewport, drag, dragElastic, dragSnapToOrigin,
    dragConstraints, dragControls, dragListener, dragMomentum,
    onDragStart, onDragEnd, ...rest
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

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
  };
});

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: () => <div data-testid="mock-qr-code" />
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/studio/production/test-id',
  useSearchParams: () => ({
    get: (key: string) => null,
    toString: () => ''
  })
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

// Mock audio context to prevent test crashes
if (typeof window !== 'undefined') {
  (window as any).AudioContext = class {
    createOscillator() {
      return {
        connect: vi.fn(),
        frequency: { setValueAtTime: vi.fn() },
        start: vi.fn(),
        stop: vi.fn()
      };
    }
    createGain() {
      return {
        connect: vi.fn(),
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
      };
    }
    currentTime = 0;
    destination = {};
  };
}

const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
let mockCameraStream: any = { getAudioTracks: () => [] };

vi.mock('@/hooks/useCamera', () => ({
  useCamera: () => ({ 
    active: true, 
    start: mockStartCamera, 
    stop: mockStopCamera, 
    stream: mockCameraStream, 
    isMuted: false,
    capabilities: {},
    applyZoom: vi.fn(),
    zoomValue: 1.0,
    switchCamera: vi.fn(),
    hasMultipleCameras: false,
    activeInput: 'studio',
    switchInput: vi.fn(),
    isWirelessLinked: false
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
  synthesizeStudioSpeech: vi.fn().mockResolvedValue("mock-base64-audio"),
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
  return { MemoryForm: MockForm };
});

describe('StudioBriefing & Grand Tour Walkthrough', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    cameraPairingUrl: 'http://localhost:3000/remote',
    peerState: 'syncing' as const,
    hostIP: 'localhost',
    setHostIP: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders choices modal initially', () => {
    render(<StudioBriefing {...defaultProps} />);
    expect(screen.getByText('The Grand Tour // Solo Stage')).toBeInTheDocument();
    expect(screen.getByText('Fast Start')).toBeInTheDocument();
    expect(screen.getByText('Planning Tour')).toBeInTheDocument();
  });

  it('bypasses walkthrough on Fast Start option selection', () => {
    const onClose = vi.fn();
    render(<StudioBriefing {...defaultProps} onClose={onClose} />);
    const fastStartBtn = screen.getByRole('button', { name: 'Fast Start' });
    fireEvent.click(fastStartBtn);
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it('executes the full step walkthrough on Planning Tour selection', () => {
    const onClose = vi.fn();
    render(<StudioBriefing {...defaultProps} onClose={onClose} />);
    
    // Start tour
    fireEvent.click(screen.getByRole('button', { name: 'Planning Tour' }));
    
    // Step 1: Remote Bridge (with QR code)
    expect(screen.getByText('📱 The Remote Bridge')).toBeInTheDocument();
    expect(screen.getByTestId('mock-qr-code')).toBeInTheDocument();

    // Go Next
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    // Step 2: Table Read
    expect(screen.getByText('🎙️ Acoustic Table Read')).toBeInTheDocument();

    // Go Next
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    // Step 3: Wireless Lens
    expect(screen.getByText('🎥 Wireless Lens Bridge')).toBeInTheDocument();

    // Go Next
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Step 4: Director's HUD
    expect(screen.getByText("🎬 Director's HUD")).toBeInTheDocument();

    // Finish
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('automatically auto-advances step 1 when remote pairs successfully', async () => {
    const { rerender } = render(<StudioBriefing {...defaultProps} />);
    
    // Start tour
    fireEvent.click(screen.getByRole('button', { name: 'Planning Tour' }));
    expect(screen.getByText('📱 The Remote Bridge')).toBeInTheDocument();

    // Rerender with paired remote state
    rerender(<StudioBriefing {...defaultProps} peerState="authorised" />);
    
    // Should auto-advance to step 2 after a timeout
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    expect(screen.getByText('🎙️ Acoustic Table Read')).toBeInTheDocument();
  });
});

describe('SoloStage Onboarding Non-Blocking Calibration', () => {
  const initialMemory: Memory = {
    id: 'test-id-tour',
    title: 'Sanctuary Tour',
    description: ' Narration Draft script',
    status: 'draft'
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('does NOT block camera hardware streams initialization during onboarding overlay active', async () => {
    const formRef = React.createRef<any>();
    
    // Initialise stage with tour active (hasSeenTour is false by default)
    render(
      <SoloStage 
        data={initialMemory} 
        update={vi.fn()} 
        currentStage={2}
        mentorActive={true}
        formRef={formRef}
      />
    );

    // Confirm the onboarding choice modal is open initially
    expect(screen.getByText('The Grand Tour // Solo Stage')).toBeInTheDocument();

    // Check if camera stream loading was successfully triggered and bound in the background
    // (Meaning onboarding doesn't wait/block camera streams from initializing)
    expect(screen.getByText(/INPUT: STUDIO WEBCAM/i)).toBeInTheDocument();
  });
});
