import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import SoloStage from '@/components/studio/SoloStage';
import { ProductionControlBar } from '@/components/studio/ProductionControlBar';
import { StudioProvider } from '@/hooks/studio/useStudioState';
import { Memory } from '@/types';
import localforage from 'localforage';

// Mock heavy visual and hardware dependencies
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
    useDragControls: () => ({ start: vi.fn() }),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/studio/production/test-id',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(
    vi.fn(),
    {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    }
  ),
}));

vi.mock('@/hooks/use-dictionary', () => ({
  useDictionary: () => ({ dictionary: {} }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id', directorPassStatus: 'free_host_pass_active' }, loading: false }),
}));

vi.mock('@/lib/firebase', () => ({
  app: {},
  storage: {},
  db: {},
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn().mockResolvedValue({ ref: {} }),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: { success: true, videoUrl: 'blob:http://localhost/stitched-video' } })),
}));

vi.mock('localforage', () => ({
  default: {
    removeItem: vi.fn().mockResolvedValue(undefined),
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null),
    keys: vi.fn().mockResolvedValue([]),
  }
}));

let mockIsMuted = true;
let mockCameraEnabled = false;

vi.mock('@/hooks/useCamera', () => ({
  useCamera: ({ enabled }: { enabled?: boolean } = {}) => {
    mockCameraEnabled = !!enabled;
    return {
      active: !!enabled,
      start: vi.fn(),
      stop: vi.fn(),
      stream: null,
      isMuted: mockIsMuted,
      cameraError: null,
      capabilities: null,
      applyZoom: vi.fn(),
      zoomValue: 1,
      switchCamera: vi.fn(),
      hasMultipleCameras: false,
      activeInput: 'camera',
      switchInput: vi.fn(),
      isWirelessLinked: false,
    };
  },
}));

let mockRecordedBlob: any = null;
let mockRecordedSegments: any[] = [];

vi.mock('@/hooks/use-media-recorder', () => ({
  useMediaRecorder: () => ({
    isRecording: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    punchIn: vi.fn(),
    recordingTime: 0,
    isWarningLimit: false,
    recordedBlob: mockRecordedBlob,
    recordedSegments: mockRecordedSegments,
    setRecordedSegments: (segs: any[]) => { mockRecordedSegments = segs; },
    clearRecording: () => { mockRecordedBlob = null; mockRecordedSegments = []; },
    uploadVideo: vi.fn(),
    uploadMediaBlob: vi.fn(),
    uploading: false,
    uploadProgress: 0,
    uploadResult: null,
    isInitializing: false,
    actualVideoBitrate: 2500000,
    activeResolution: { width: 1920, height: 1080 },
    hasHardwareMismatch: false
  })
}));

vi.mock('@/hooks/studio/useAlchemy', () => ({
  useAlchemy: () => ({
    isSaving: false,
    progress: 0,
    error: null,
    isComplete: false,
    isRetrying: false,
    startAlchemy: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-audio-level', () => ({
  useAudioLevel: () => 0,
}));

describe('UI-MW-148: Act III Dual-Mode Stage Invariant Shield', () => {
  const mockUpdate = vi.fn();

  const memoryWithMaster: Memory = {
    id: 'ey96djU6qR1BrDGnvZwp',
    title: 'A Child of Two Worlds',
    description: 'Authentic narrative monologue.',
    videoUrl: 'https://storage.googleapis.com/memories/ey96djU6qR1BrDGnvZwp/master.webm',
    status: 'draft',
    lastEdited: Date.now(),
    scriptBlocks: []
  } as any;

  const memoryCleanSlate: Memory = {
    id: 'clean-slate-scene-4',
    title: 'Clean Slate Scene',
    description: 'No video recorded.',
    status: 'draft',
    lastEdited: Date.now(),
    scriptBlocks: []
  } as any;

  const renderWithStudio = (ui: React.ReactElement, initialStage = 2) => {
    return render(
      <StudioProvider initialState={{ currentStage: initialStage, isCleanView: false }}>
        {ui}
      </StudioProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (localforage.keys as any) = vi.fn().mockResolvedValue([]);
    (localforage.getItem as any) = vi.fn().mockResolvedValue(null);
    mockRecordedSegments = [];
    mockRecordedBlob = null;
    mockIsMuted = true;
    mockCameraEnabled = false;
  });

  describe('Mode 2: Master Reel Review Invariants', () => {
    it('completely suppresses Standing By // Awaiting Narrator modal when videoUrl exists even if optics are muted', async () => {
      mockIsMuted = true;

      renderWithStudio(
        <SoloStage
          data={memoryWithMaster}
          update={mockUpdate}
          currentStage={2}
        />,
        2
      );

      // Pre-flight standby modal MUST NOT mount
      expect(screen.queryByText(/Standing By \/\/ Awaiting Narrator/i)).toBeNull();

      // RecordEditingSuite must mount cleanly
      expect(await screen.findByText('EDITING SUITE')).toBeDefined();
      expect(screen.getByText('VIRTUAL EDL ACTIVE')).toBeDefined();
    });

    it('keeps camera unpowered on mount during Master Reel Review to protect battery/GPU and prevent privacy warnings', () => {
      renderWithStudio(
        <SoloStage
          data={memoryWithMaster}
          update={mockUpdate}
          currentStage={2}
        />,
        2
      );

      // Camera enabled prop must resolve to false in Mode 2
      expect(mockCameraEnabled).toBe(false);
    });

    it('renders APPROVE & PROCEED TO ACT IV CTA on the production control bar when videoUrl exists', () => {
      const onNextMock = vi.fn();
      renderWithStudio(
        <ProductionControlBar
          currentStage={2}
          isComplete={true}
          isLobbyConfirmed={true}
          hasExistingVideo={true}
          onNext={onNextMock}
          onPrev={vi.fn()}
          missingRequirements={[]}
        />,
        2
      );

      const btn = screen.getByRole('button', { name: /APPROVE & PROCEED TO ACT IV/i });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain('bg-emerald-500');

      fireEvent.click(btn);
      expect(onNextMock).toHaveBeenCalled();
    });
  });

  describe('Mode 1: Clean-Slate Capture Invariants', () => {
    it('displays Standing By modal when videoUrl is absent and optics are muted', async () => {
      mockIsMuted = true;

      renderWithStudio(
        <SoloStage
          data={memoryCleanSlate}
          update={mockUpdate}
          currentStage={2}
        />,
        2
      );

      expect(await screen.findByText(/Standing By \/\/ Awaiting Narrator/i)).toBeDefined();
      expect(screen.getByText('Ignite Camera & Mic')).toBeDefined();
    });

    it('requests camera stream activation on mount for new narrators', () => {
      renderWithStudio(
        <SoloStage
          data={memoryCleanSlate}
          update={mockUpdate}
          currentStage={2}
        />,
        2
      );

      // Camera enabled prop must resolve to true in Mode 1
      expect(mockCameraEnabled).toBe(true);
    });
  });

  describe('Retake Escape Hatch Invariants', () => {
    it('transitions from Mode 2 to Mode 1, powering camera on and closing review overlay', async () => {
      mockIsMuted = false;

      renderWithStudio(
        <SoloStage
          data={memoryWithMaster}
          update={mockUpdate}
          currentStage={2}
        />,
        2
      );

      expect(await screen.findByText('EDITING SUITE')).toBeDefined();

      const retakeBtns = screen.getAllByText(/Retake Performance/i);
      expect(retakeBtns.length).toBeGreaterThan(0);

      await act(async () => {
        fireEvent.click(retakeBtns[0]);
      });

      // Review overlay unmounts, camera activates
      await waitFor(() => {
        expect(screen.queryByText('EDITING SUITE')).toBeNull();
      });
      expect(mockCameraEnabled).toBe(true);
    });
  });
});
