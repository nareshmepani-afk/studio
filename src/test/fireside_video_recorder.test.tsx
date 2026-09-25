import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
  useFiresideVideoRecorder,
  getSupportedVideoMimeType,
} from '@/hooks/useFiresideVideoRecorder';
import {
  FiresideVideoRecorder,
  FiresideVideoRecorderRef,
} from '@/components/fireside/FiresideVideoRecorder';
import {
  FiresideModeSwitch,
  FIRESIDE_MODE_STORAGE_KEY,
} from '@/components/fireside/FiresideModeSwitch';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { FiresideAuthHeader } from '@/components/fireside/FiresideAuthHeader';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';
import {
  FIRESIDE_VIDEO_DEFAULTS,
  FIRESIDE_HAPTIC_PATTERNS,
  FIRESIDE_TOUCH_TARGETS,
} from '@/types/fireside';

describe('MW-249: Fireside Video Memo & Master Curriculum Invariants', () => {
  let mockMediaRecorder: any;
  let mockWakeLockSentinel: any;
  let mockGetUserMedia: any;
  let mockVibrate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock MediaStream & navigator.mediaDevices.getUserMedia
    const mockVideoTrack = { stop: vi.fn(), kind: 'video' };
    const mockAudioTrack = { stop: vi.fn(), kind: 'audio' };
    const mockStream = {
      getTracks: () => [mockVideoTrack, mockAudioTrack],
      getVideoTracks: () => [mockVideoTrack],
      getAudioTracks: () => [mockAudioTrack],
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
      mimeType: 'video/webm;codecs=vp8,opus',
      start: vi.fn(function (this: any, timeslice?: number) {
        this.state = 'recording';
        this.lastTimeslice = timeslice;
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
          this.ondataavailable({ data: new Blob(['video-chunk'], { type: 'video/webm' }) });
        }
        if (this.onstop) {
          this.onstop();
        }
      }),
    };
    (window as any).MediaRecorder = vi.fn(function (this: any, stream: any, options: any) {
      mockMediaRecorder.options = options;
      mockMediaRecorder.stream = stream;
      return mockMediaRecorder;
    });
    (window as any).MediaRecorder.isTypeSupported = vi.fn((mime: string) => {
      return mime.includes('webm');
    });

    // Mock Screen Wake Lock API
    mockWakeLockSentinel = {
      released: false,
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

    // Mock Hardware Haptics
    mockVibrate = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
      configurable: true,
    });

    // Mock URL.createObjectURL & revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:https://dev.memoryweaver.studio/video-memo-test');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Invariant Suite 1: Video Camera Constraints & Clamped Bitrate
  // ---------------------------------------------------------------------------
  describe('Invariant 1: Camera Constraints & Clamped Bitrate', () => {
    it('requests front-facing selfie camera with 720p 24fps target', async () => {
      let hookReturn: any;
      function TestComponent() {
        hookReturn = useFiresideVideoRecorder();
        return null;
      }
      render(<TestComponent />);

      await act(async () => {
        await hookReturn.startRecording();
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            facingMode: 'user',
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 24, max: 30 },
          }),
          audio: expect.objectContaining({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          }),
        })
      );
    });

    it('initialises MediaRecorder with clamped 2.0 Mbps bitrate and 5000ms chunk timeslice', async () => {
      let hookReturn: any;
      function TestComponent() {
        hookReturn = useFiresideVideoRecorder();
        return null;
      }
      render(<TestComponent />);

      await act(async () => {
        await hookReturn.startRecording();
      });

      expect(mockMediaRecorder.options).toEqual(
        expect.objectContaining({
          videoBitsPerSecond: FIRESIDE_VIDEO_DEFAULTS.MAX_BITRATE_BPS, // 2,000,000
        })
      );
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(
        FIRESIDE_VIDEO_DEFAULTS.CHUNK_TIMESLICE_MS // 5000ms
      );
    });

    it('negotiates supported video MIME types cleanly', () => {
      const mime = getSupportedVideoMimeType();
      expect(mime).toBe(FIRESIDE_VIDEO_DEFAULTS.CONTAINER_MIME);
    });
  });

  // ---------------------------------------------------------------------------
  // Invariant Suite 2: Screen Wake Lock & Hardware Haptics
  // ---------------------------------------------------------------------------
  describe('Invariant 2: Screen Wake Lock Guard & Hardware Haptics', () => {
    it('acquires Screen Wake Lock on start and releases on stop', async () => {
      let hookReturn: any;
      function TestComponent() {
        hookReturn = useFiresideVideoRecorder();
        return null;
      }
      render(<TestComponent />);

      await act(async () => {
        await hookReturn.startRecording();
      });

      expect((navigator as any).wakeLock.request).toHaveBeenCalledWith('screen');
      expect(hookReturn.isWakeLockActive).toBe(true);

      await act(async () => {
        await hookReturn.stopRecording();
      });

      expect(mockWakeLockSentinel.release).toHaveBeenCalled();
      expect(hookReturn.isWakeLockActive).toBe(false);
    });

    it('triggers haptic pulses on start, pause, and stop', async () => {
      let hookReturn: any;
      function TestComponent() {
        hookReturn = useFiresideVideoRecorder();
        return null;
      }
      render(<TestComponent />);

      await act(async () => {
        await hookReturn.startRecording();
      });
      expect(mockVibrate).toHaveBeenCalledWith([...FIRESIDE_HAPTIC_PATTERNS.START]);

      act(() => {
        hookReturn.pauseRecording();
      });
      expect(mockVibrate).toHaveBeenCalledWith([...FIRESIDE_HAPTIC_PATTERNS.PAUSE]);

      await act(async () => {
        await hookReturn.stopRecording();
      });
      expect(mockVibrate).toHaveBeenCalledWith([...FIRESIDE_HAPTIC_PATTERNS.STOP]);
    });
  });

  // ---------------------------------------------------------------------------
  // Invariant Suite 3: Ergonomic UI Elements & 88px Boundary (Rule 26)
  // ---------------------------------------------------------------------------
  describe('Invariant 3: Ergonomic UI Elements & Top-Pinned Prompt', () => {
    it('renders the oversized 88px tactile recording trigger boundary', () => {
      render(<FiresideVideoRecorder promptSpark={FIRESIDE_PROMPT_SPARKS[0]} />);

      const recordButton = screen.getByRole('button', { name: /start video recording/i });
      expect(recordButton).toBeInTheDocument();
      expect(recordButton).toHaveStyle({
        width: `${FIRESIDE_TOUCH_TARGETS.RECORD_BUTTON_SIZE_PX}px`,
        height: `${FIRESIDE_TOUCH_TARGETS.RECORD_BUTTON_SIZE_PX}px`,
      });
    });

    it('pins the prompt spark banner near the top edge for direct eye contact', () => {
      const spark = FIRESIDE_PROMPT_SPARKS[0];
      const { container } = render(
        <FiresideVideoRecorder promptSpark={spark} activeLanguage="en" />
      );

      // Prompt banner overlay is inside top pinned container
      const topPinnedBanner = container.querySelector('.absolute.top-3, .absolute.top-4');
      expect(topPinnedBanner).toBeInTheDocument();
      expect(screen.getByText(new RegExp(spark.title, 'i'))).toBeInTheDocument();
    });

    it('exposes imperative ref for auto-scrolling and direct start', async () => {
      const recorderRef = React.createRef<FiresideVideoRecorderRef>();
      render(
        <FiresideVideoRecorder
          ref={recorderRef}
          promptSpark={FIRESIDE_PROMPT_SPARKS[0]}
        />
      );

      expect(recorderRef.current).toBeDefined();
      expect(recorderRef.current?.status).toBe('idle');

      await act(async () => {
        await recorderRef.current?.startRecording();
      });

      expect(recorderRef.current?.status).toBe('recording');
    });

    it('displays video review player with Keep and Retake buttons on save', async () => {
      const recorderRef = React.createRef<FiresideVideoRecorderRef>();
      render(
        <FiresideVideoRecorder
          ref={recorderRef}
          promptSpark={FIRESIDE_PROMPT_SPARKS[0]}
        />
      );

      await act(async () => {
        await recorderRef.current?.startRecording();
      });

      await act(async () => {
        await recorderRef.current?.stopRecording();
      });

      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Invariant Suite 4: Mode Switcher & Persistence
  // ---------------------------------------------------------------------------
  describe('Invariant 4: Mode Switcher & Persistence', () => {
    it('renders Voice & Photos and Video Memo tabs with minimum 48px height', () => {
      const onModeChange = vi.fn();
      render(<FiresideModeSwitch mode="audio" onModeChange={onModeChange} />);

      const voiceTab = screen.getByRole('tab', { name: /voice & photos/i });
      const videoTab = screen.getByRole('tab', { name: /video memo/i });

      expect(voiceTab).toBeInTheDocument();
      expect(videoTab).toBeInTheDocument();
      expect(voiceTab).toHaveStyle({
        minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px`,
      });
    });

    it('persists selected mode to localStorage', () => {
      const setItemSpy = vi.spyOn(window.localStorage, 'setItem');
      const onModeChange = vi.fn();
      render(<FiresideModeSwitch mode="audio" onModeChange={onModeChange} />);

      const videoTab = screen.getByRole('tab', { name: /video memo/i });
      fireEvent.click(videoTab);

      expect(setItemSpy).toHaveBeenCalledWith(FIRESIDE_MODE_STORAGE_KEY, 'video');
      expect(window.localStorage.getItem(FIRESIDE_MODE_STORAGE_KEY)).toBe('video');
      expect(onModeChange).toHaveBeenCalledWith('video');
    });

    it('renders glowing Recommended badge on Video Memo when suggestedMode is video', () => {
      const onModeChange = vi.fn();
      render(
        <FiresideModeSwitch
          mode="audio"
          onModeChange={onModeChange}
          suggestedMode="video"
        />
      );

      const recommendedBadge = screen.getByText('Recommended');
      expect(recommendedBadge).toBeInTheDocument();
    });

    it('renders glowing Curriculum badge on Voice & Photos when suggestedMode is audio', () => {
      const onModeChange = vi.fn();
      render(
        <FiresideModeSwitch
          mode="audio"
          onModeChange={onModeChange}
          suggestedMode="audio"
        />
      );

      const curriculumBadge = screen.getByText('Curriculum');
      expect(curriculumBadge).toBeInTheDocument();
    });

    it('displays WhatsApp/FaceTime style subtext when Video Memo mode is active', () => {
      const onModeChange = vi.fn();
      render(<FiresideModeSwitch mode="video" onModeChange={onModeChange} />);
      expect(screen.getByText(/WhatsApp\/FaceTime style:/i)).toBeInTheDocument();
    });

    it('renders 1-tap Enable Camera & Microphone button in viewfinder when idle and falls back on OverconstrainedError', async () => {
      const overconstrained = new Error('Constraint not satisfied');
      overconstrained.name = 'OverconstrainedError';
      mockGetUserMedia.mockRejectedValueOnce(overconstrained);

      render(<FiresideVideoRecorder promptSpark={FIRESIDE_PROMPT_SPARKS[0]} />);
      const enableBtn = screen.getByTestId('enable-camera-preview-btn');
      expect(enableBtn).toBeInTheDocument();

      const recordButton = screen.getByRole('button', { name: /start video recording/i });
      await act(async () => {
        fireEvent.click(recordButton);
      });

      // Should have retried with relaxed mobile constraints and succeeded
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'user' },
        audio: true,
      });
    });

    it('synchronously invokes onActivePromptChange upon navigation in SingleCardPromptCarousel', () => {
      const onActivePromptChange = vi.fn();
      render(
        <SingleCardPromptCarousel
          prompts={FIRESIDE_PROMPT_SPARKS}
          onActivePromptChange={onActivePromptChange}
        />
      );

      // Card 1 is spark_roots_journey with suggestedMediaMode: 'video'
      expect(onActivePromptChange).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'spark_roots_journey',
          suggestedMediaMode: 'video',
        })
      );

      // Click Next Story
      const nextBtn = screen.getByRole('button', { name: /next story spark/i });
      fireEvent.click(nextBtn);

      // Card 2 is spark_childhood_home with suggestedMediaMode: 'audio'
      expect(onActivePromptChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: 'spark_childhood_home',
          suggestedMediaMode: 'audio',
        })
      );
    });

    it('does not re-fire onActivePromptChange on parent re-render when currentSpark has not changed', () => {
      const spy = vi.fn();
      const { rerender } = render(
        <SingleCardPromptCarousel
          prompts={FIRESIDE_PROMPT_SPARKS}
          mediaMode="audio"
          onActivePromptChange={(spark) => spy(spark)}
        />
      );
      expect(spy).toHaveBeenCalledTimes(1);

      // Simulate parent re-render (e.g. switching mediaMode to video with a fresh inline callback)
      rerender(
        <SingleCardPromptCarousel
          prompts={FIRESIDE_PROMPT_SPARKS}
          mediaMode="video"
          onActivePromptChange={(spark) => spy(spark)}
        />
      );
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Invariant Suite 5: British English Orthography (Rule 20)
  // ---------------------------------------------------------------------------
  describe('Invariant 5: British English Orthography Standard', () => {
    it('strictly uses British English in headers and labels', () => {
      const { container } = render(<FiresideAuthHeader />);
      const textContent = container.textContent || '';

      // Must not contain US spellings
      expect(textContent).not.toMatch(/\bColor\b/i);
      expect(textContent).not.toMatch(/\bCenter\b/i);
      expect(textContent).not.toMatch(/\bTheater\b/i);
      expect(textContent).not.toMatch(/\bSynchronize\b/i);
      expect(textContent).not.toMatch(/\bDigitize\b/i);
    });
  });
});
