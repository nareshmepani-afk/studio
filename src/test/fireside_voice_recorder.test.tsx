import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
  useFiresideAudioRecorder,
  formatDurationMMSS,
  getSupportedAudioMimeType,
} from '@/hooks/useFiresideAudioRecorder';
import {
  TactileVoiceRecorder,
  TactileVoiceRecorderRef,
} from '@/components/fireside/TactileVoiceRecorder';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';
import { FIRESIDE_HAPTIC_PATTERNS } from '@/types/fireside';

describe('MW-246: Tactile Web Audio Voice Recorder & VU Visualiser Invariants', () => {
  let mockAudioContext: any;
  let mockMediaRecorder: any;
  let mockWakeLockSentinel: any;
  let mockGetUserMedia: any;
  let mockVibrate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AudioContext & Web Audio nodes
    mockAudioContext = {
      state: 'running',
      sampleRate: 48000,
      currentTime: 0,
      resume: vi.fn().mockResolvedValue(undefined),
      suspend: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createDynamicsCompressor: vi.fn(() => ({
        threshold: { setValueAtTime: vi.fn() },
        knee: { setValueAtTime: vi.fn() },
        ratio: { setValueAtTime: vi.fn() },
        attack: { setValueAtTime: vi.fn() },
        release: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      createAnalyser: vi.fn(() => ({
        fftSize: 256,
        smoothingTimeConstant: 0.8,
        frequencyBinCount: 128,
        getByteFrequencyData: vi.fn((arr: Uint8Array) => {
          arr.fill(128); // Simulate steady voice input
        }),
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      createMediaStreamSource: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      createMediaStreamDestination: vi.fn(() => ({
        stream: {
          getAudioTracks: () => [{ stop: vi.fn() }],
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
    };
    (window as any).AudioContext = vi.fn(function (this: any) {
      return mockAudioContext;
    });

    // Mock MediaStream & navigator.mediaDevices.getUserMedia
    const mockTrack = { stop: vi.fn(), kind: 'audio' };
    const mockStream = {
      getTracks: () => [mockTrack],
      getAudioTracks: () => [mockTrack],
    };
    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });

    // Mock MediaRecorder
    mockMediaRecorder = {
      state: 'inactive',
      mimeType: 'audio/webm;codecs=opus',
      start: vi.fn(function (this: any) {
        this.state = 'recording';
      }),
      pause: vi.fn(function (this: any) {
        this.state = 'paused';
      }),
      resume: vi.fn(function (this: any) {
        this.state = 'recording';
      }),
      stop: vi.fn(function (this: any) {
        this.state = 'inactive';
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['audio-chunk'], { type: 'audio/webm' }) });
        }
        if (this.onstop) {
          this.onstop(new Event('stop'));
        }
      }),
      ondataavailable: null,
      onstop: null,
    };
    const MockMediaRecorder = vi.fn(function (this: any) {
      return mockMediaRecorder;
    }) as any;
    MockMediaRecorder.isTypeSupported = vi.fn(() => true);
    (window as any).MediaRecorder = MockMediaRecorder;

    // Mock Screen Wake Lock API
    mockWakeLockSentinel = {
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: vi.fn().mockResolvedValue(mockWakeLockSentinel),
      },
      writable: true,
      configurable: true,
    });

    // Mock navigator.vibrate
    mockVibrate = vi.fn(() => true);
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
      configurable: true,
    });

    // Mock URL.createObjectURL & revokeObjectURL
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn(() => 'blob:https://dev.memoryweaver.studio/test-audio-blob');
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Pure Helper Functions & Audio Formatting', () => {
    it('formats duration in seconds into MM:SS string correctly', () => {
      expect(formatDurationMMSS(0)).toBe('00:00');
      expect(formatDurationMMSS(9)).toBe('00:09');
      expect(formatDurationMMSS(60)).toBe('01:00');
      expect(formatDurationMMSS(125)).toBe('02:05');
      expect(formatDurationMMSS(3600)).toBe('60:00');
      expect(formatDurationMMSS(-10)).toBe('00:00');
      expect(formatDurationMMSS(Infinity)).toBe('00:00');
      expect(formatDurationMMSS(NaN)).toBe('00:00');
    });

    it('selects the first supported audio MIME type from priority list', () => {
      const mime = getSupportedAudioMimeType();
      expect(mime).toBe('audio/webm;codecs=opus');
    });
  });

  describe('2. Audio Processing Pipeline & Compressor Initialisation', () => {
    function HookTestComponent() {
      const recorder = useFiresideAudioRecorder();
      return (
        <div>
          <span data-testid="status">{recorder.status}</span>
          <span data-testid="duration">{recorder.formattedDuration}</span>
          <span data-testid="wake-lock">{recorder.isWakeLockActive ? 'active' : 'inactive'}</span>
          <button onClick={() => recorder.startRecording()}>Start</button>
          <button onClick={() => recorder.pauseRecording()}>Pause</button>
          <button onClick={() => recorder.resumeRecording()}>Resume</button>
          <button onClick={() => recorder.stopRecording()}>Stop</button>
          <button onClick={() => recorder.resetRecording()}>Reset</button>
        </div>
      );
    }

    it('configures DynamicsCompressorNode with speech levelling parameters', async () => {
      render(<HookTestComponent />);
      expect(screen.getByTestId('status').textContent).toBe('idle');

      await act(async () => {
        fireEvent.click(screen.getByText('Start'));
      });

      expect(mockAudioContext.createDynamicsCompressor).toHaveBeenCalled();
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen');
      expect(navigator.vibrate).toHaveBeenCalledWith([...FIRESIDE_HAPTIC_PATTERNS.START]);
      expect(screen.getByTestId('status').textContent).toBe('recording');
    });

    it('pauses and resumes recording with appropriate haptics', async () => {
      render(<HookTestComponent />);
      await act(async () => {
        fireEvent.click(screen.getByText('Start'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Pause'));
      });
      expect(screen.getByTestId('status').textContent).toBe('paused');
      expect(navigator.vibrate).toHaveBeenCalledWith([...FIRESIDE_HAPTIC_PATTERNS.PAUSE]);

      await act(async () => {
        fireEvent.click(screen.getByText('Resume'));
      });
      expect(screen.getByTestId('status').textContent).toBe('recording');
    });

    it('stops recording, triggers STOP haptics, releases wake lock, and sets saved state', async () => {
      render(<HookTestComponent />);
      await act(async () => {
        fireEvent.click(screen.getByText('Start'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Stop'));
      });

      expect(navigator.vibrate).toHaveBeenCalledWith([...FIRESIDE_HAPTIC_PATTERNS.STOP]);
      expect(mockWakeLockSentinel.release).toHaveBeenCalled();
      expect(screen.getByTestId('status').textContent).toBe('saved');
    });

    it('handles microphone permission denial and renders recovery guidance', async () => {
      const notAllowedError = new Error('Permission denied');
      notAllowedError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValueOnce(notAllowedError);

      render(<TactileVoiceRecorder />);
      const recordButton = screen.getByLabelText(/start recording spoken memory/i);
      expect(recordButton).toBeDefined();

      await act(async () => {
        fireEvent.click(recordButton);
      });

      // Should display recovery slate
      expect(screen.getByText(/Microphone Access Blocked/i)).toBeDefined();
      expect(screen.getByText(/Instructions for Mobile Devices:/i)).toBeDefined();
      expect(screen.getByLabelText(/Retry microphone permissions/i)).toBeDefined();
    });
  });

  describe('3. Elder Ergonomics & Touch Envelope Assertions (Rule 26)', () => {
    it('renders the central record button with oversized 88px touch boundary in idle state', () => {
      render(<TactileVoiceRecorder />);
      const recordButton = screen.getByLabelText(/start recording spoken memory/i);
      expect(recordButton.className).toContain('w-[88px]');
      expect(recordButton.className).toContain('h-[88px]');
      expect(recordButton.className).toContain('min-w-[88px]');
      expect(recordButton.className).toContain('min-h-[88px]');
    });

    it('displays prompt spark title and multilingual text when promptSpark is passed', () => {
      const sampleSpark = FIRESIDE_PROMPT_SPARKS[0];
      render(<TactileVoiceRecorder promptSpark={sampleSpark} activeLanguage="en" />);

      expect(screen.getByText(new RegExp(sampleSpark.title, 'i'))).toBeDefined();
      expect(screen.getByText(sampleSpark.sparks.en)).toBeDefined();
    });

    it('renders secondary action buttons with minimum 56px touch envelopes while recording', async () => {
      render(<TactileVoiceRecorder />);
      await act(async () => {
        fireEvent.click(screen.getByLabelText(/start recording spoken memory/i));
      });

      // Pause button and visible label
      const pauseBtn = screen.getByLabelText(/pause voice recording/i);
      expect(pauseBtn.className).toContain('min-w-[56px]');
      expect(pauseBtn.className).toContain('min-h-[56px]');
      expect(screen.getByText(/PAUSE/i)).toBeDefined();

      // Discard button and visible label
      const discardBtn = screen.getByLabelText(/discard recording and start over/i);
      expect(discardBtn.className).toContain('min-w-[56px]');
      expect(discardBtn.className).toContain('min-h-[56px]');
      expect(screen.getByText(/DISCARD/i)).toBeDefined();

      // Pause recording -> verify RESUME label appears
      await act(async () => {
        fireEvent.click(pauseBtn);
      });
      const resumeBtn = screen.getByLabelText(/resume voice recording/i);
      expect(resumeBtn.className).toContain('min-w-[56px]');
      expect(resumeBtn.className).toContain('min-h-[56px]');
      expect(screen.getByText('Resume', { selector: 'span' })).toBeDefined();

      // Finish recording -> verify saved state action bar
      await act(async () => {
        fireEvent.click(screen.getByLabelText(/stop and complete recording/i));
      });

      expect(screen.getByText(/Discard & Retake/i)).toBeDefined();
      expect(screen.getByText(/Keep This Memoir ✓/i)).toBeDefined();
    });
  });

  describe('4. Imperative Handle & Prompt-to-Record Autoscroll Handshake', () => {
    it('exposes imperative handle with startRecording, stopRecording, resetRecording, scrollIntoView and status', async () => {
      const ref = React.createRef<TactileVoiceRecorderRef>();
      render(<TactileVoiceRecorder ref={ref} />);

      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.startRecording).toBe('function');
      expect(typeof ref.current?.stopRecording).toBe('function');
      expect(typeof ref.current?.resetRecording).toBe('function');
      expect(typeof ref.current?.scrollIntoView).toBe('function');
      expect(ref.current?.status).toBe('idle');
    });

    it('triggers scrollIntoView with smooth behavior and center block alignment', () => {
      const ref = React.createRef<TactileVoiceRecorderRef>();
      const { container } = render(<TactileVoiceRecorder ref={ref} />);
      const recorderDiv = container.querySelector('#fireside-voice-recorder') as HTMLElement;
      expect(recorderDiv).toBeDefined();

      const scrollSpy = vi.fn();
      recorderDiv.scrollIntoView = scrollSpy;

      act(() => {
        ref.current?.scrollIntoView();
      });

      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    });

    it('actions startRecording directly through imperative ref without requiring user to find button', async () => {
      const ref = React.createRef<TactileVoiceRecorderRef>();
      render(<TactileVoiceRecorder ref={ref} />);

      expect(ref.current?.status).toBe('idle');

      await act(async () => {
        await ref.current?.startRecording();
      });

      expect(mockGetUserMedia).toHaveBeenCalled();
      expect(ref.current?.status).toBe('recording');
      expect(screen.getByLabelText(/stop and complete recording/i)).toBeDefined();
    });
  });
});
