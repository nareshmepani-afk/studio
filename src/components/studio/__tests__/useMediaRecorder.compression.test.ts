import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaRecorder } from '@/hooks/use-media-recorder';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user-123' }, loading: false })
}));

// Mock useJourneyLogger
const mockLogEvent = vi.fn();
vi.mock('@/hooks/telemetry/useJourneyLogger', () => ({
  useJourneyLogger: () => ({
    logEvent: mockLogEvent
  })
}));

// Mock Global MediaRecorder
const mockStart = vi.fn();
const mockStop = vi.fn();

class MockMediaRecorder {
  stream: any;
  options: any;
  state = 'inactive';
  static isTypeSupported = vi.fn().mockReturnValue(true);
  static instances: MockMediaRecorder[] = [];

  constructor(stream: any, options: any) {
    this.stream = stream;
    this.options = options;
    MockMediaRecorder.instances.push(this);
  }

  start(timeslice?: number) {
    this.state = 'recording';
    mockStart(timeslice, this.options);
  }

  stop() {
    this.state = 'inactive';
    mockStop();
    if (this.onstop) {
      this.onstop();
    }
  }

  ondataavailable: any;
  onstop: any;
}

vi.stubGlobal('MediaRecorder', MockMediaRecorder);

describe('useMediaRecorder Compression & Adaptive Downscaling', () => {
  const mockTrack = {
    stop: vi.fn(),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
  };

  const mockStream = {
    getTracks: () => [mockTrack],
    getVideoTracks: () => [mockTrack],
  } as unknown as MediaStream;

  beforeEach(() => {
    vi.clearAllMocks();
    MockMediaRecorder.instances = [];
    
    // Clear userAgent modifications
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });
  });

  it('CASE 1: High Profile resolves to 2.5 Mbps and 1080p constraints', async () => {
    const { result } = renderHook(() =>
      useMediaRecorder(mockStream, { compressionProfile: 'high' })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    const activeRecorder = MockMediaRecorder.instances[0];
    expect(activeRecorder).toBeDefined();
    expect(activeRecorder.options.videoBitsPerSecond).toBe(2500000);
    expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
    });

    expect(mockLogEvent).toHaveBeenCalledWith('MediaRecorder: Start recording', expect.objectContaining({
      videoBitsPerSecond: 2500000,
      width: 1920,
      height: 1080,
      compressionProfile: 'high'
    }));
  });

  it('CASE 2: Compact Profile resolves to 800 kbps and 720p constraints', async () => {
    const { result } = renderHook(() =>
      useMediaRecorder(mockStream, { compressionProfile: 'compact' })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    const activeRecorder = MockMediaRecorder.instances[0];
    expect(activeRecorder).toBeDefined();
    expect(activeRecorder.options.videoBitsPerSecond).toBe(800000);
    expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
      width: { ideal: 960, max: 960 },
      height: { ideal: 540, max: 540 },
    });

    expect(mockLogEvent).toHaveBeenCalledWith('MediaRecorder: Start recording', expect.objectContaining({
      videoBitsPerSecond: 800000,
      width: 960,
      height: 540,
      compressionProfile: 'compact'
    }));
  });

  it('CASE 3: Balanced Profile resolves to 1.5 Mbps and 720p constraints', async () => {
    const { result } = renderHook(() =>
      useMediaRecorder(mockStream, { compressionProfile: 'balanced' })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    const activeRecorder = MockMediaRecorder.instances[0];
    expect(activeRecorder).toBeDefined();
    expect(activeRecorder.options.videoBitsPerSecond).toBe(1500000);
    expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
      width: { ideal: 1280, max: 1280 },
      height: { ideal: 720, max: 720 },
    });

    expect(mockLogEvent).toHaveBeenCalledWith('MediaRecorder: Start recording', expect.objectContaining({
      videoBitsPerSecond: 1500000,
      width: 1280,
      height: 720,
      compressionProfile: 'balanced'
    }));
  });

  it('CASE 4: Auto Profile on Mobile defaults to Compact Profile', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });

    const { result } = renderHook(() =>
      useMediaRecorder(mockStream, { compressionProfile: 'auto' })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    const activeRecorder = MockMediaRecorder.instances[0];
    expect(activeRecorder).toBeDefined();
    expect(activeRecorder.options.videoBitsPerSecond).toBe(800000);
    expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
      width: { ideal: 960, max: 960 },
      height: { ideal: 540, max: 540 },
    });

    expect(mockLogEvent).toHaveBeenCalledWith('MediaRecorder: Start recording', expect.objectContaining({
      videoBitsPerSecond: 800000,
      width: 960,
      height: 540,
      compressionProfile: 'compact'
    }));
  });
});
