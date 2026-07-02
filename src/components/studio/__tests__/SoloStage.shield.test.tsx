import { render, act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SoloStage from '../SoloStage';
import React from 'react';
import { Memory } from '@/types';
import localforage from 'localforage';

// Mock all heavy dependencies and lucide-react icons
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

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/studio/production/test-id',
  useSearchParams: () => ({
    get: (key: string) => null,
    toString: () => ''
  })
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

// Mock firebase storage, functions and localforage for RecordEditingSuite integration
const mockUploadBytesResumable = vi.fn().mockResolvedValue({
  ref: {}
});

const mockHttpsCallable = vi.fn().mockResolvedValue({
  data: { success: true, videoUrl: 'blob:http://localhost/stitched-video' }
});

vi.mock('@/lib/firebase', () => ({
  app: {},
  storage: {},
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytesResumable: (...args: any[]) => mockUploadBytesResumable(...args),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => mockHttpsCallable),
}));

vi.mock('localforage', () => ({
  default: {
    removeItem: vi.fn().mockResolvedValue(undefined),
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null),
    keys: vi.fn().mockResolvedValue([]),
  }
}));

const mockClearRecording = vi.fn();
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
let mockRecordedBlob: any = null;

const mockStartAlchemy = vi.fn();
let mockIsSaving = false;

vi.mock('@/hooks/useCamera', () => ({
  useCamera: () => ({ active: false, start: vi.fn(), stop: vi.fn(), stream: null }),
}));

let mockRecordedSegments: any[] = [];
const mockSetRecordedSegments = vi.fn((segs) => {
  mockRecordedSegments = segs;
});
const mockPunchIn = vi.fn();

vi.mock('@/hooks/use-media-recorder', () => {
  return {
    useMediaRecorder: () => {
      const [blob, setBlob] = React.useState(mockRecordedBlob);
      React.useEffect(() => {
        setBlob(mockRecordedBlob);
      }, [mockRecordedBlob]);

      const clear = React.useCallback(() => {
        mockClearRecording();
        mockRecordedBlob = null;
        setBlob(null);
        mockRecordedSegments = [];
      }, []);

      return {
        isRecording: false,
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording,
        punchIn: mockPunchIn,
        recordingTime: 0,
        isWarningLimit: false,
        recordedBlob: blob,
        recordedSegments: mockRecordedSegments,
        setRecordedSegments: mockSetRecordedSegments,
        clearRecording: clear,
        uploadVideo: vi.fn(),
        uploadMediaBlob: vi.fn(),
        uploading: false,
        uploadProgress: 0,
        uploadResult: null,
        isInitializing: false,
        actualVideoBitrate: 2500000,
        activeResolution: { width: 1920, height: 1080 },
        hasHardwareMismatch: false
      };
    }
  };
});

vi.mock('@/hooks/studio/useAlchemy', () => ({
  useAlchemy: () => ({
    isSaving: mockIsSaving,
    progress: 0,
    error: null,
    isComplete: false,
    isRetrying: false,
    startAlchemy: mockStartAlchemy,
  }),
}));

vi.mock('@/hooks/use-audio-level', () => ({
  useAudioLevel: () => 0,
}));

vi.mock('@/actions/aiWeaver', () => ({
  generateInterviewQuestion: vi.fn(),
  analyzeFraming: vi.fn(),
}));

vi.mock('@/actions/studio-vocal', () => ({
  synthesizeStudioSpeech: vi.fn(),
}));

let mockCaptureModality = 'scripted';
const mockSetCaptureModality = vi.fn((mode) => {
  mockCaptureModality = mode;
});
const mockSetStage = vi.fn();

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({ 
    currentStage: 0, 
    setStage: mockSetStage, 
    modality: 'pen', 
    isReviewing: false,
    isProductionLocked: false,
    captureModality: mockCaptureModality,
    actions: {
      setSelectedVision: vi.fn(),
      setIsReviewing: vi.fn(),
      setAppliedCatalysts: vi.fn(),
      setCaptureModality: mockSetCaptureModality,
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

describe('SoloStage Shielded Update Protection', () => {
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
  });

  it('preserves initial state properties like ID when performing a shielded update', async () => {
    const formRef = React.createRef<any>();

    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={0}
        formRef={formRef}
      />
    );

    // Call update via simulated form ref
    await act(async () => {
      formRef.current?.triggerUpdate({ description: 'Updated script description' });
    });

    // Verify the update handler is called
    expect(mockUpdate).toHaveBeenCalledTimes(1);

    // Get the function passed to the update handler
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(typeof updateArg).toBe('function');

    // Execute the callback with the initial memory
    const result = updateArg(initialMemory);

    // Verify that the resulting state contains BOTH the updated description AND original properties like ID
    expect(result.id).toBe('test-secure-id');
    expect(result.title).toBe('Historic Journey');
    expect(result.location).toBe('Nairobi');
    expect(result.description).toBe('Updated script description');
  });
});

describe('Video Review & Approval Stage State Transitions', () => {
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
    mockRecordedBlob = null;
    mockIsSaving = false;
    mockRecordedSegments = [];
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-blob');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('enters reviewTake mode immediately after recording stops (and isAlchemySaving remains false)', async () => {
    const testBlob = new Blob(['dummy-content'], { type: 'video/webm' });
    mockRecordedBlob = testBlob;

    const { getByText, queryByText, container } = render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    expect(getByText('EDITING SUITE')).toBeDefined();
    expect(queryByText('Mastering in Progress')).toBeNull();

    // Verify teleprompter and AI director cards are faded out to avoid overlap
    const teleprompter = container.querySelector('.group\\/points');
    expect(teleprompter?.className).toContain('opacity-0 pointer-events-none');
  });

  it('memory management: Discarding the take clears the recordedBlob, resets reference, and revokes local object URL', async () => {
    const testBlob = new Blob(['dummy-content'], { type: 'video/webm' });
    mockRecordedBlob = testBlob;

    const { getByText } = render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    const discardButton = getByText('Discard Take');
    expect(discardButton).toBeDefined();

    await act(async () => {
      discardButton.click();
    });

    expect(mockClearRecording).toHaveBeenCalledTimes(1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-blob');
  });

  it('happy path: Approving the take triggers stitching and uploads manifest', async () => {
    const testBlob = new Blob(['dummy-content'], { type: 'video/webm' });
    mockRecordedBlob = testBlob;
    mockRecordedSegments = [{
      segmentId: 'seg_1',
      blobUrl: 'blob:http://localhost/seg_1',
      startOffset: 0,
      endOffset: 10,
      duration: 10,
      blob: testBlob
    }];

    const { getByText } = render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    const approveButton = getByText('Stitch & Approve');
    expect(approveButton).toBeDefined();

    await act(async () => {
      approveButton.click();
    });

    await waitFor(() => {
      expect(mockUploadBytesResumable).toHaveBeenCalled();
      expect(mockHttpsCallable).toHaveBeenCalled();
    });
  });

  it('review replay: allows replaying the video take by resetting progress and triggering play', async () => {
    const testBlob = new Blob(['dummy-content'], { type: 'video/webm' });
    mockRecordedBlob = testBlob;
    mockRecordedSegments = [{
      segmentId: 'seg_1',
      blobUrl: 'blob:http://localhost/seg_1',
      startOffset: 0,
      endOffset: 10,
      duration: 10,
      blob: testBlob
    }];

    const playSpy = vi.spyOn(HTMLVideoElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    const pauseSpy = vi.spyOn(HTMLVideoElement.prototype, 'pause').mockImplementation(() => {});

    const { findByText, getByTestId } = render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    // Wait for the review takeover overlay to appear dynamically
    await findByText('EDITING SUITE');

    const playPauseBtn = getByTestId('play-pause-overlay-btn');
    expect(playPauseBtn).toBeDefined();

    await act(async () => {
      playPauseBtn.click();
    });

    expect(playSpy).toHaveBeenCalled();
    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });
});

describe('Documentary Raw Capture Modality', () => {
  const mockUpdate = vi.fn();
  const initialMemory: Memory = {
    id: 'test-raw-id',
    title: 'Historic Journey',
    description: 'Script description',
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
    mockCaptureModality = 'scripted';
  });

  it('sets captureModality to raw when clicking Just Roll Camera button', async () => {
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    // Prior to confirmation, the setup buttons are visible
    const justRollBtn = screen.getByText('Just Roll Camera');
    expect(justRollBtn).toBeDefined();

    await act(async () => {
      justRollBtn.click();
    });

    expect(mockSetCaptureModality).toHaveBeenCalledWith('raw');
  });

  it('renders raw modality HUD elements when captureModality is raw', async () => {
    mockCaptureModality = 'scripted';
    
    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    // Prior to confirming alignment, click Just Roll Camera
    const justRollBtn = screen.getByText('Just Roll Camera');
    await act(async () => {
      justRollBtn.click();
    });

    // Confirm that the MODE: UNTETHERED badge is rendered
    expect(screen.getByText('MODE: UNTETHERED AUDIO-VISUAL CAPTURE')).toBeDefined();

    // Confirm that the start performance indicator badge exists
    expect(screen.getByText('Start Performance')).toBeDefined();
  });

  it('renders RecordEditingSuite when reviewTake is active and segments exist', async () => {
    mockRecordedBlob = new Blob(['dummy'], { type: 'video/webm' });
    mockRecordedSegments = [{
      segmentId: 'seg_1',
      blobUrl: 'blob:http://localhost/seg_1',
      startOffset: 0,
      endOffset: 10,
      duration: 10,
      blob: mockRecordedBlob
    }];

    render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    // Assert that the EDITING SUITE header and timeline are rendered
    expect(screen.getByText('EDITING SUITE')).toBeDefined();
    expect(screen.getByText('VIRTUAL EDL ACTIVE')).toBeDefined();
    expect(screen.getByText('Split Segment')).toBeDefined();
    expect(screen.getByText('AI Auto-Trim (Silence Cut)')).toBeDefined();
  });
});

describe('Recovery Shield (Session Resilience)', () => {
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
    mockRecordedSegments = [];
  });

  it('detects a cached take in localforage on mount and prompts to restore it', async () => {
    const testBlob = new Blob(['restored-content'], { type: 'video/webm' });
    const getItemSpy = vi.spyOn(localforage, 'getItem').mockResolvedValue(testBlob);
    const keysSpy = vi.spyOn(localforage, 'keys').mockResolvedValue(['backup_take_test-secure-id']);

    const { findByText } = render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    const recoveryBannerText = await findByText('PERSISTENCE SHIELD // UNSTITCHED TAKE');
    expect(recoveryBannerText).toBeDefined();

    const restoreBtn = await findByText('Restore Take');
    expect(restoreBtn).toBeDefined();

    await act(async () => {
      restoreBtn.click();
    });

    // Verify it restores the segments and opens the Editing Suite
    expect(mockSetRecordedSegments).toHaveBeenCalled();
    expect(await findByText('EDITING SUITE')).toBeDefined();

    getItemSpy.mockRestore();
    keysSpy.mockRestore();
  });

  it('happy path: restoring a take updates local state, triggers stage jump, and persists stage update to Firestore', async () => {
    const testBlob = new Blob(['restored-content'], { type: 'video/webm' });
    const getItemSpy = vi.spyOn(localforage, 'getItem').mockResolvedValue(testBlob);
    const keysSpy = vi.spyOn(localforage, 'keys').mockResolvedValue(['backup_take_test-secure-id']);

    const { findByText } = render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    const restoreBtn = await findByText('Restore Take');
    expect(restoreBtn).toBeDefined();

    await act(async () => {
      restoreBtn.click();
    });

    // Verify it updates Firestore stage
    expect(mockUpdate).toHaveBeenCalledWith({ productionStage: 2 });

    getItemSpy.mockRestore();
    keysSpy.mockRestore();
  });
});
