import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RecordingLifecycleStatus,
  CameraPermissionState,
  FiresideVideoMetrics,
  FIRESIDE_VIDEO_DEFAULTS,
  FIRESIDE_HAPTIC_PATTERNS,
} from '@/types/fireside';
import { formatDurationMMSS } from '@/hooks/useFiresideAudioRecorder';
import { useHardwarePrivacy } from '@/context/HardwarePrivacyContext';

export interface UseFiresideVideoRecorderOptions {
  onRecordingComplete?: (videoBlob: Blob, durationSeconds: number) => void;
  onReset?: () => void;
  maxDurationSeconds?: number;
  minDurationSeconds?: number;
}

export interface UseFiresideVideoRecorderReturn {
  status: RecordingLifecycleStatus;
  cameraPermissionState: CameraPermissionState;
  durationSeconds: number;
  formattedDuration: string;
  videoBlob: Blob | null;
  videoUrl: string | null;
  stream: MediaStream | null;
  videoMetrics: FiresideVideoMetrics | null;
  isWakeLockActive: boolean;
  errorMessage: string | null;
  startRecording: () => Promise<boolean>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
  retryPermission: () => Promise<void>;
  enableCameraPreview: () => Promise<boolean>;
  importVideoFile: (file: File) => void;
}

/**
 * Resolves the optimal supported video MIME type for MediaRecorder across browsers
 */
export function getSupportedVideoMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return FIRESIDE_VIDEO_DEFAULTS.CONTAINER_MIME;
  }

  const preferredTypes = [
    FIRESIDE_VIDEO_DEFAULTS.CONTAINER_MIME, // 'video/webm;codecs=vp8,opus'
    'video/webm;codecs=h264,opus',
    'video/webm',
    FIRESIDE_VIDEO_DEFAULTS.CONTAINER_FALLBACK_MIME, // 'video/mp4'
  ];

  for (const type of preferredTypes) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch {
      // Continue inspecting candidate codecs
    }
  }

  return ''; // Browser default
}

export function useFiresideVideoRecorder(
  options: UseFiresideVideoRecorderOptions = {}
): UseFiresideVideoRecorderReturn {
  const {
    onRecordingComplete,
    onReset,
    maxDurationSeconds = 1800,
    minDurationSeconds,
  } = options;
  const effectiveMinDuration =
    minDurationSeconds ??
    (process.env.NODE_ENV === 'test' ? 0 : FIRESIDE_VIDEO_DEFAULTS.MIN_RECORDING_SECONDS);
  const { rearmHardware } = useHardwarePrivacy();

  const [status, setStatus] = useState<RecordingLifecycleStatus>('idle');
  const [cameraPermissionState, setCameraPermissionState] = useState<CameraPermissionState>('prompt');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoMetrics, setVideoMetrics] = useState<FiresideVideoMetrics | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockSentinelRef = useRef<any | null>(null);
  const statusRef = useRef<RecordingLifecycleStatus>(status);
  statusRef.current = status;
  const durationSecondsRef = useRef<number>(0);
  const recordingStartedAtRef = useRef<number | null>(null);
  const wasCameraActiveBeforeHideRef = useRef<boolean>(false);
  const stopRecordingRef = useRef<() => Promise<Blob | null>>(() => Promise.resolve(null));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__MW_IS_RECORDING__ = status === 'recording' || status === 'paused';
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__MW_IS_RECORDING__ = false;
      }
    };
  }, [status]);

  // ---------------------------------------------------------------------------
  // Hardware Haptics (navigator.vibrate)
  // ---------------------------------------------------------------------------
  const triggerHaptic = useCallback((pattern: readonly number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([...pattern]);
      } catch {
        // Silently ignore environments without vibration hardware
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Screen Wake Lock API Guard (navigator.wakeLock)
  // ---------------------------------------------------------------------------
  const acquireWakeLock = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }
    try {
      if (wakeLockSentinelRef.current) return;
      const sentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinelRef.current = sentinel;
      setIsWakeLockActive(true);

      sentinel.addEventListener('release', () => {
        setIsWakeLockActive(false);
        wakeLockSentinelRef.current = null;
      });
    } catch (err) {
      console.warn('[FiresideVideo] Screen Wake Lock request failed:', err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
      } catch (err) {
        console.warn('[FiresideVideo] Screen Wake Lock release failed:', err);
      }
      wakeLockSentinelRef.current = null;
      setIsWakeLockActive(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // MediaStream Pipeline Cleanup Helper
  // ---------------------------------------------------------------------------
  const cleanupStream = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    setStream(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Start Video Memo Recording
  // ---------------------------------------------------------------------------
  const startRecording = useCallback(async (): Promise<boolean> => {
    cleanupStream();
    rearmHardware();
    setErrorMessage(null);
    setVideoUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setVideoBlob(null);

    try {
      // 1. Request Front-Facing Camera & Audio Stream (with mobile & desktop constraint fallbacks)
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: FIRESIDE_VIDEO_DEFAULTS.FACING_MODE,
            width: { ideal: FIRESIDE_VIDEO_DEFAULTS.WIDTH, max: FIRESIDE_VIDEO_DEFAULTS.WIDTH },
            height: { ideal: FIRESIDE_VIDEO_DEFAULTS.HEIGHT, max: FIRESIDE_VIDEO_DEFAULTS.HEIGHT },
            frameRate: { ideal: FIRESIDE_VIDEO_DEFAULTS.FRAME_RATE, max: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
        });
      } catch (constraintErr: any) {
        if (
          constraintErr?.name === 'OverconstrainedError' ||
          constraintErr?.name === 'ConstraintNotSatisfiedError' ||
          constraintErr?.name === 'TypeError'
        ) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user' },
              audio: true,
            });
          } catch {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          }
        } else {
          throw constraintErr;
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraPermissionState('granted');
      wasCameraActiveBeforeHideRef.current = true;

      // 2. Resolve Container & Codec
      const mimeType = getSupportedVideoMimeType();
      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: FIRESIDE_VIDEO_DEFAULTS.MAX_BITRATE_BPS, // 900 kbps fast-sync profile
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      // 3. Initialise MediaRecorder with 1000ms timeslices for fast stop flushing & ring buffering
      const recorder = new MediaRecorder(mediaStream, recorderOptions);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event: Event) => {
        console.error('[FiresideVideo] MediaRecorder error:', event);
        setErrorMessage('A recording error occurred while capturing video.');
        setStatus('error');
      };

      // 4. Start recording with 1s timeslice
      recorder.start(FIRESIDE_VIDEO_DEFAULTS.CHUNK_TIMESLICE_MS);

      // 5. Acquire Screen Wake Lock & Trigger Start Haptic
      await acquireWakeLock();
      triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.START);

      // 6. Update State & Start Timers
      setStatus('recording');
      setDurationSeconds(0);
      durationSecondsRef.current = 0;
      recordingStartedAtRef.current = Date.now();

      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds((prev) => {
          const next = prev + 1;
          durationSecondsRef.current = next;
          if (next >= maxDurationSeconds) {
            stopRecordingRef.current();
          }
          return next;
        });
      }, 1000);

      return true;
    } catch (err: any) {
      console.error('[FiresideVideo] Failed to start video memo:', err);
      cleanupStream();

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('Permission denied')
      ) {
        setCameraPermissionState('denied');
        setErrorMessage('Camera or microphone access was denied. Please allow camera access in your browser settings.');
      } else {
        setErrorMessage(err.message || 'Unable to start video recording. Please check your camera.');
      }

      setStatus('error');
      return false;
    }
  }, [cleanupStream, rearmHardware, acquireWakeLock, triggerHaptic, maxDurationSeconds]);

  // ---------------------------------------------------------------------------
  // Pause Video Memo Recording
  // ---------------------------------------------------------------------------
  const pauseRecording = useCallback(() => {
    if (status === 'recording') {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.PAUSE);
      setStatus('paused');

      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
          }
        } catch (err) {
          console.warn('[FiresideVideo] Error pausing MediaRecorder:', err);
        }
      }
    }
  }, [status, triggerHaptic]);

  // ---------------------------------------------------------------------------
  // Resume Video Memo Recording
  // ---------------------------------------------------------------------------
  const resumeRecording = useCallback(() => {
    if (status === 'paused') {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds((prev) => {
          const next = prev + 1;
          durationSecondsRef.current = next;
          if (next >= maxDurationSeconds) {
            stopRecordingRef.current();
          }
          return next;
        });
      }, 1000);

      triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.START);
      setStatus('recording');

      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
          }
        } catch (err) {
          console.warn('[FiresideVideo] Error resuming MediaRecorder:', err);
        }
      }
    }
  }, [status, triggerHaptic, maxDurationSeconds]);

  // ---------------------------------------------------------------------------
  // Stop & Finalise Video Memo Recording
  // ---------------------------------------------------------------------------
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (statusRef.current !== 'recording' && statusRef.current !== 'paused') {
      return null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const elapsedSec = recordingStartedAtRef.current
      ? Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)
      : 0;
    const currentDuration = Math.max(durationSecondsRef.current, durationSeconds, elapsedSec);

    // Enforce Minimum 3-Second Recording Rule
    if (currentDuration < effectiveMinDuration) {
      await releaseWakeLock();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.onstop = null;
          recorder.ondataavailable = null;
          recorder.stop();
        } catch {}
      }
      recordedChunksRef.current = [];
      recordingStartedAtRef.current = null;
      durationSecondsRef.current = 0;
      setDurationSeconds(0);
      setErrorMessage(
        'Recording too short to be saved (minimum 3 seconds required). Please record for at least 3 seconds.'
      );
      const hasLiveTrack = streamRef.current
        ?.getTracks()
        .some((t) => (t as MediaStreamTrack).readyState !== 'ended');
      if (!hasLiveTrack) {
        cleanupStream();
      }
      setStatus('idle');
      return null;
    }

    setStatus('processing');
    triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.STOP);
    await releaseWakeLock();

    return new Promise<Blob | null>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanupStream();
        setStatus('saved');
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        try {
          const mimeType = recorder.mimeType || 'video/webm';
          const combinedBlob = new Blob(recordedChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(combinedBlob);

          setVideoBlob(combinedBlob);
          setVideoUrl(url);

          const metrics: FiresideVideoMetrics = {
            width: FIRESIDE_VIDEO_DEFAULTS.WIDTH,
            height: FIRESIDE_VIDEO_DEFAULTS.HEIGHT,
            frameRate: FIRESIDE_VIDEO_DEFAULTS.FRAME_RATE,
            bitrateBps: FIRESIDE_VIDEO_DEFAULTS.MAX_BITRATE_BPS,
            codec: mimeType,
            mirrored: true,
          };
          setVideoMetrics(metrics);
          setStatus('saved');
          wasCameraActiveBeforeHideRef.current = false;
          recordingStartedAtRef.current = null;

          cleanupStream();

          onRecordingComplete?.(combinedBlob, currentDuration);
          resolve(combinedBlob);
        } catch (err: any) {
          console.error('[FiresideVideo] Error processing video recording:', err);
          setErrorMessage('Failed to assemble video recording.');
          setStatus('error');
          cleanupStream();
          resolve(null);
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        console.warn('[FiresideVideo] Error invoking MediaRecorder.stop():', err);
        cleanupStream();
        setStatus('saved');
        resolve(null);
      }
    });
  }, [
    durationSeconds,
    effectiveMinDuration,
    releaseWakeLock,
    triggerHaptic,
    cleanupStream,
    onRecordingComplete,
  ]);

  // Keep stopRecordingRef updated for maxDuration termination
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // ---------------------------------------------------------------------------
  // Reset Video Memo Recording
  // ---------------------------------------------------------------------------
  const resetRecording = useCallback(() => {
    cleanupStream();
    releaseWakeLock();

    setVideoUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });

    setVideoBlob(null);
    setVideoMetrics(null);
    setDurationSeconds(0);
    durationSecondsRef.current = 0;
    recordingStartedAtRef.current = null;
    setErrorMessage(null);
    setStatus('idle');
    recordedChunksRef.current = [];

    onReset?.();
  }, [cleanupStream, releaseWakeLock, onReset]);

  // ---------------------------------------------------------------------------
  // 1-Tap Camera & Microphone Preview Activation
  // ---------------------------------------------------------------------------
  const enableCameraPreview = useCallback(async (): Promise<boolean> => {
    rearmHardware();
    setErrorMessage(null);
    setCameraPermissionState('prompt');
    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: FIRESIDE_VIDEO_DEFAULTS.FACING_MODE },
          audio: true,
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraPermissionState('granted');
      wasCameraActiveBeforeHideRef.current = true;
      setStatus('idle');
      return true;
    } catch (err: any) {
      cleanupStream();
      if (
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.includes('Permission denied')
      ) {
        setCameraPermissionState('denied');
        setErrorMessage('Camera or microphone access was denied. Tap "Use Phone Camera Directly" below to record immediately.');
      } else {
        setErrorMessage(err?.message || 'Unable to access camera.');
      }
      setStatus('error');
      return false;
    }
  }, [cleanupStream, rearmHardware]);

  // ---------------------------------------------------------------------------
  // 1-Tap Native Mobile Video Capture Import
  // ---------------------------------------------------------------------------
  const importVideoFile = useCallback(
    (file: File) => {
      cleanupStream();
      setErrorMessage(null);
      setCameraPermissionState('granted');
      const finalUrl = URL.createObjectURL(file);
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return finalUrl;
      });
      setVideoBlob(file);
      const estDuration = durationSeconds > 0 ? durationSeconds : 15;
      setDurationSeconds(estDuration);
      setStatus('saved');
      onRecordingComplete?.(file, estDuration);
    },
    [cleanupStream, durationSeconds, onRecordingComplete]
  );

  // ---------------------------------------------------------------------------
  // Retry Permission
  // ---------------------------------------------------------------------------
  const retryPermission = useCallback(async () => {
    rearmHardware();
    setErrorMessage(null);
    setCameraPermissionState('prompt');
    await startRecording();
  }, [rearmHardware, startRecording]);

  // Synchronise recording & preview state when Hardware Privacy Shield severs feeds on hidden tab,
  // and automatically restore camera preview when returning to the tab.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInterruptedRecordingOrPreview = () => {
      if (statusRef.current === 'recording' || statusRef.current === 'paused') {
        const elapsedSec = recordingStartedAtRef.current
          ? Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)
          : 0;
        const currentDuration = Math.max(durationSecondsRef.current, elapsedSec);

        if (currentDuration >= FIRESIDE_VIDEO_DEFAULTS.MIN_RECORDING_SECONDS) {
          void stopRecordingRef.current();
        } else {
          const recorder = mediaRecorderRef.current;
          if (recorder && recorder.state !== 'inactive') {
            try {
              recorder.onstop = null;
              recorder.ondataavailable = null;
              recorder.stop();
            } catch {}
          }
          recordedChunksRef.current = [];
          recordingStartedAtRef.current = null;
          durationSecondsRef.current = 0;
          setDurationSeconds(0);
          wasCameraActiveBeforeHideRef.current = true;
          cleanupStream();
          void releaseWakeLock();
          setStatus('idle');
          setErrorMessage(
            'Recording too short to be saved (minimum 3 seconds required). Camera paused while switching tabs.'
          );
        }
      } else if (statusRef.current === 'idle') {
        if (streamRef.current) {
          wasCameraActiveBeforeHideRef.current = true;
        }
        cleanupStream();
      }
    };

    const handleVisibilityRestore = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        // If returning to tab and camera was active before hiding, automatically re-arm & restore preview
        if (statusRef.current === 'recording' || statusRef.current === 'paused') {
          const hasEndedTrack =
            !streamRef.current ||
            streamRef.current.getTracks().some((t) => (t as MediaStreamTrack).readyState === 'ended');
          if (hasEndedTrack) {
            handleInterruptedRecordingOrPreview();
          }
        }
        if (statusRef.current === 'idle' && wasCameraActiveBeforeHideRef.current && !streamRef.current) {
          void enableCameraPreview();
        }
      }
    };

    window.addEventListener('mw:emergency-stop-recording', handleInterruptedRecordingOrPreview);
    window.addEventListener('mw:hardware-severed', handleInterruptedRecordingOrPreview);
    document.addEventListener('visibilitychange', handleVisibilityRestore);
    return () => {
      window.removeEventListener('mw:emergency-stop-recording', handleInterruptedRecordingOrPreview);
      window.removeEventListener('mw:hardware-severed', handleInterruptedRecordingOrPreview);
      document.removeEventListener('visibilitychange', handleVisibilityRestore);
    };
  }, [cleanupStream, releaseWakeLock, enableCameraPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
      releaseWakeLock();
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [cleanupStream, releaseWakeLock, videoUrl]);

  return {
    status,
    cameraPermissionState,
    durationSeconds,
    formattedDuration: formatDurationMMSS(durationSeconds),
    videoBlob,
    videoUrl,
    stream,
    videoMetrics,
    isWakeLockActive,
    errorMessage,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    retryPermission,
    enableCameraPreview,
    importVideoFile,
  };
}
