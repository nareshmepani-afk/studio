import { render, act, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SoloStage from '../SoloStage';
import React from 'react';
import { Memory } from '@/types';
import einsteinTestData from '../../../fixtures/einstein.json';

// Mock framer-motion and nav router
vi.mock('framer-motion', () => {
  const cleanProps = ({
    whileHover, whileTap, layoutId, initial, animate, exit, transition,
    variants, viewport, drag, dragElastic, dragSnapToOrigin, onDragStart, onDragEnd, ...rest
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
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-dictionary', () => ({
  useDictionary: () => ({ dictionary: {} }),
}));

vi.mock('../overlays/DirectorialUpsellDialog', () => ({
  DirectorialUpsellDialog: ({ isOpen, onClose, requiredFeature }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="upsell-dialog">
        <h3>Unlock the Memory Vault</h3>
        <p>Your Director Pass is currently inactive or expired. Required feature: {requiredFeature}</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }
}));

let mockPassStatus = 'inactive';

// Mock useAuth specifically with dynamic pass status for nareshmepani@yahoo.com
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'pZHGqC5xKXhRTIqVyAJCckYqlMA2',
      email: 'nareshmepani@yahoo.com',
      directorPassStatus: mockPassStatus
    },
    loading: false
  }),
}));

const mockUploadBytesResumable = vi.fn().mockResolvedValue({ ref: {} });
const mockHttpsCallable = vi.fn().mockResolvedValue({ data: { success: true } });

vi.mock('@/lib/firebase', () => ({ app: {}, storage: {}, db: {} }));
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

vi.mock('@/hooks/useCamera', () => ({
  useCamera: () => ({ active: false, start: vi.fn(), stop: vi.fn(), stream: null }),
}));

const dummyBlob = new Blob(['dummy'], { type: 'video/webm' });
const dummySegments = [{ segmentId: 'seg_1', duration: 10, blobUrl: 'blob:1', blob: dummyBlob }];

vi.mock('@/hooks/use-media-recorder', () => ({
  useMediaRecorder: () => ({
    isRecording: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    clearRecording: vi.fn(),
    recordedBlob: dummyBlob,
    recordedSegments: dummySegments,
    setRecordedSegments: vi.fn(),
  }),
}));

vi.mock('@/hooks/studio/useAlchemy', () => ({
  useAlchemy: () => ({ isSaving: false, startAlchemy: vi.fn() }),
}));

vi.mock('@/hooks/use-audio-level', () => ({ useAudioLevel: () => 0 }));

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({
    currentStage: 2,
    setStage: vi.fn(),
    captureModality: 'scripted',
    selectedTake: 'Relativity and universe memory draft',
    actions: { 
      setCaptureModality: vi.fn(),
      setSelectedTake: vi.fn(),
      setFontSize: vi.fn(),
      setRecording: vi.fn(),
    }
  }),
}));

describe('User Plan Permissions (nareshmepani@yahoo.com)', () => {
  const mockUpdate = vi.fn();
  const memoryData: Memory = {
    id: 'mem-naresh-1',
    title: 'Naresh Story Take',
    description: 'Relativity and universe memory draft',
    status: 'draft',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('CASE 1: Inactive / Free Tier - Allows reading, blocks stitching, triggers upgrade block dialog', async () => {
    mockPassStatus = 'inactive';

    render(
      <SoloStage 
        data={memoryData} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    expect(screen.getByText('EDITING SUITE')).toBeDefined();

    const stitchButton = screen.getByText('Stitch & Approve');
    await act(async () => {
      stitchButton.click();
    });

    expect(mockUploadBytesResumable).not.toHaveBeenCalled();
    expect(mockHttpsCallable).not.toHaveBeenCalled();

    expect(screen.getByText('Unlock the Memory Vault')).toBeDefined();
    expect(screen.getByText(/Your Director Pass is currently inactive or expired/i)).toBeDefined();
  });

  it('CASE 2: Expired Director Pass - Allows reading, blocks stitching, triggers upgrade/renew block dialog', async () => {
    mockPassStatus = 'free_host_pass_expired';

    render(
      <SoloStage 
        data={memoryData} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    expect(screen.getByText('EDITING SUITE')).toBeDefined();

    const stitchButton = screen.getByText('Stitch & Approve');
    await act(async () => {
      stitchButton.click();
    });

    expect(mockUploadBytesResumable).not.toHaveBeenCalled();
    expect(mockHttpsCallable).not.toHaveBeenCalled();

    expect(screen.getByText('Unlock the Memory Vault')).toBeDefined();
    expect(screen.getByText(/Your Director Pass is currently inactive or expired/i)).toBeDefined();
  });

  it('CASE 3: Active Director Pass - Bypasses guest block and runs stitching upload ceremony successfully', async () => {
    mockPassStatus = 'free_host_pass_active';

    render(
      <SoloStage 
        data={memoryData} 
        update={mockUpdate} 
        currentStage={2}
      />
    );

    expect(screen.getByText('EDITING SUITE')).toBeDefined();

    const stitchButton = screen.getByText('Stitch & Approve');
    await act(async () => {
      stitchButton.click();
    });

    await waitFor(() => {
      expect(mockUploadBytesResumable).toHaveBeenCalled();
      expect(mockHttpsCallable).toHaveBeenCalled();
    });

    expect(screen.queryByTestId('upsell-dialog')).toBeNull();
  });
});

describe('Albert Einstein Schema Guardrail Tests', () => {
  it('should validate the structural integrity of the static einstein.json fixture', () => {
    const einsteinData = einsteinTestData;
    
    // Core parameters
    expect(einsteinData.templateId).toBe('p_einstein');
    expect(einsteinData.isTemplate).toBe(true);
    expect(einsteinData.isPublic).toBe(true);
    expect(typeof einsteinData.title).toBe('string');
    expect(typeof einsteinData.description).toBe('string');
    expect(typeof einsteinData.prose).toBe('string');
    
    // Sensory anchors structure
    expect(Array.isArray(einsteinData.sensoryConfig)).toBe(true);
    expect(einsteinData.sensoryConfig.length).toBeGreaterThanOrEqual(1);
    einsteinData.sensoryConfig.forEach((sensor: any) => {
      expect(typeof sensor.type).toBe('string');
      expect(typeof sensor.anchor).toBe('string');
    });

    // 3-Act structural mapping
    expect(einsteinData.acts).toBeDefined();
    expect(typeof einsteinData.acts.act1.title).toBe('string');
    expect(typeof einsteinData.acts.act1.prompt).toBe('string');
    expect(typeof einsteinData.acts.act1.milestoneAnchor).toBe('string');

    expect(typeof einsteinData.acts.act2.title).toBe('string');
    expect(typeof einsteinData.acts.act2.prompt).toBe('string');
    expect(typeof einsteinData.acts.act2.milestoneAnchor).toBe('string');

    expect(typeof einsteinData.acts.act3.title).toBe('string');
    expect(typeof einsteinData.acts.act3.prompt).toBe('string');
    expect(typeof einsteinData.acts.act3.milestoneAnchor).toBe('string');
  });
});
