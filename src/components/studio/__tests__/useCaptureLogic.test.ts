import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCaptureLogic } from '@/hooks/studio/useCaptureLogic';

// Mock useStudioState global hook
const mockSetScrolling = vi.fn();
vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({
    actions: {
      setScrolling: mockSetScrolling
    }
  })
}));

describe('useCaptureLogic Cinematic Count-In', () => {
  const startRecordingMock = vi.fn();
  const stopRecordingMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Initializes with default offline state', () => {
    const { result } = renderHook(() =>
      useCaptureLogic({
        stream: null,
        startRecording: startRecordingMock,
        stopRecording: stopRecordingMock,
        isRecording: false
      })
    );

    expect(result.current.countIn).toBeNull();
    expect(result.current.isCountingIn).toBe(false);
    expect(result.current.statusLabel).toBe('STUDIO READY');
  });

  it('Locks prompter and initiates count-in upon startCapture with valid stream', () => {
    const mockStream = {} as MediaStream;
    const { result } = renderHook(() =>
      useCaptureLogic({
        stream: mockStream,
        startRecording: startRecordingMock,
        stopRecording: stopRecordingMock,
        isRecording: false
      })
    );

    act(() => {
      result.current.startCapture();
    });

    expect(result.current.isCountingIn).toBe(true);
    expect(result.current.countIn).toBe(5);
    expect(result.current.statusLabel).toBe('Initialising Capture');
    expect(mockSetScrolling).toHaveBeenCalledWith(false);
  });

  it('Safely transitions count-in numbers and labels over time', () => {
    const mockStream = {} as MediaStream;
    const { result } = renderHook(() =>
      useCaptureLogic({
        stream: mockStream,
        startRecording: startRecordingMock,
        stopRecording: stopRecordingMock,
        isRecording: false
      })
    );

    act(() => {
      result.current.startCapture();
    });

    // Step to 4s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countIn).toBe(4);
    expect(result.current.statusLabel).toBe('Initialising Capture');

    // Step to 3s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countIn).toBe(3);
    expect(result.current.statusLabel).toBe('Optimising Stream');

    // Step to 2s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countIn).toBe(2);
    expect(result.current.statusLabel).toBe('Optimising Stream');

    // Step to 1s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countIn).toBe(1);
    expect(result.current.statusLabel).toBe('Optimising Stream');

    // Step to 0s: Actual recording starts, countdown clears, prompter starts scrolling
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countIn).toBeNull();
    expect(result.current.isCountingIn).toBe(false);
    expect(startRecordingMock).toHaveBeenCalledOnce();
    expect(mockSetScrolling).toHaveBeenLastCalledWith(true);
  });

  it('Aborts capture ceremony upon cancelCapture', () => {
    const mockStream = {} as MediaStream;
    const { result } = renderHook(() =>
      useCaptureLogic({
        stream: mockStream,
        startRecording: startRecordingMock,
        stopRecording: stopRecordingMock,
        isRecording: false
      })
    );

    act(() => {
      result.current.startCapture();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.countIn).toBe(3);

    act(() => {
      result.current.cancelCapture();
    });

    expect(result.current.countIn).toBeNull();
    expect(result.current.isCountingIn).toBe(false);
    expect(result.current.statusLabel).toBe('STUDIO READY');
    expect(mockSetScrolling).toHaveBeenLastCalledWith(false);
    expect(startRecordingMock).not.toHaveBeenCalled();
  });
});
