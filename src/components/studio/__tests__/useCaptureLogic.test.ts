import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCaptureLogic } from '@/hooks/studio/useCaptureLogic';

// Speech Synthesis Mocks
const mockSpeak = vi.fn();
const mockCancel = vi.fn();

class MockSpeechSynthesisUtterance {
  text: string;
  rate = 1.0;
  volume = 1.0;
  voice = null;
  constructor(text: string) {
    this.text = text;
  }
}

vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);
vi.stubGlobal('speechSynthesis', {
  speak: mockSpeak,
  cancel: mockCancel,
  getVoices: vi.fn(() => [{ lang: 'en-US' }]),
});

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

    // Verify speech synthesis speaks the initial count
    expect(mockSpeak).toHaveBeenCalledOnce();
    expect(mockSpeak.mock.calls[0][0].text).toBe('5');
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
    expect(mockSpeak.mock.calls[1][0].text).toBe('4');

    // Step to 3s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countIn).toBe(3);
    expect(result.current.statusLabel).toBe('Optimising Stream');
    expect(mockSpeak.mock.calls[2][0].text).toBe('3');

    // Step to 2s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countIn).toBe(2);
    expect(result.current.statusLabel).toBe('Optimising Stream');
    expect(mockSpeak.mock.calls[3][0].text).toBe('2');

    // Step to 1s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countIn).toBe(1);
    expect(result.current.statusLabel).toBe('Optimising Stream');
    expect(mockSpeak.mock.calls[4][0].text).toBe('1');

    // Step to 0s: Actual recording starts, countdown clears, prompter starts scrolling
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countIn).toBeNull();
    expect(result.current.isCountingIn).toBe(false);
    expect(startRecordingMock).toHaveBeenCalledOnce();
    expect(mockSetScrolling).toHaveBeenLastCalledWith(true);
    expect(mockSpeak.mock.calls[5][0].text).toBe('Action');
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

    // Verify speech synthesis cancel was called
    expect(mockCancel).toHaveBeenCalled();
  });
});
