import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SoloStage from '../SoloStage';
import React from 'react';
import { Memory } from '@/types';

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
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/use-dictionary', () => ({
  useDictionary: () => ({ dictionary: {} }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' }, loading: false }),
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
      }, []);

      return {
        isRecording: false,
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording,
        recordingTime: 0,
        isWarningLimit: false,
        recordedBlob: blob,
        clearRecording: clear,
        uploadVideo: vi.fn(),
        uploadMediaBlob: vi.fn(),
        uploading: false,
        uploadProgress: 0,
        uploadResult: null
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

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({ 
    currentStage: 0, 
    setStage: vi.fn(), 
    modality: 'pen', 
    isReviewing: false,
    isProductionLocked: false,
    actions: {
      setSelectedVision: vi.fn(),
      setIsReviewing: vi.fn(),
      setAppliedCatalysts: vi.fn(),
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
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-blob');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('enters reviewTake mode immediately after recording stops (and isAlchemySaving remains false)', async () => {
    const testBlob = new Blob(['dummy-content'], { type: 'video/webm' });
    mockRecordedBlob = testBlob;

    const { getByText, queryByText } = render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    expect(getByText('Review Performance Take')).toBeDefined();
    expect(queryByText('Mastering in Progress')).toBeNull();
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

    const discardButton = getByText('Discard & Re-Shoot');
    expect(discardButton).toBeDefined();

    await act(async () => {
      discardButton.click();
    });

    expect(mockClearRecording).toHaveBeenCalledTimes(1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-blob');
  });

  it('happy path: Approving the take triggers startAlchemy with correct blob metadata', async () => {
    const testBlob = new Blob(['dummy-content'], { type: 'video/webm' });
    mockRecordedBlob = testBlob;

    const { getByText } = render(
      <SoloStage 
        data={initialMemory} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    const approveButton = getByText('Approve & Synthesize');
    expect(approveButton).toBeDefined();

    await act(async () => {
      approveButton.click();
    });

    expect(mockStartAlchemy).toHaveBeenCalledWith(testBlob);
  });
});
