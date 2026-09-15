import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RecordingLifecycleStatus,
  CameraPermissionState,
  FiresideVideoMetrics,
  FIRESIDE_VIDEO_DEFAULTS,
  FIRESIDE_HAPTIC_PATTERNS,
} from '@/types/fireside';
import { formatDurationMMSS } from '@/hooks/useFiresideAudioRecorder';

export interface UseFiresideVideoRecorderOptions {
  onRecordingComplete?: (videoBlob: Blob, durationSeconds: number) => void;
  onReset?: () => void;
  maxDurationSeconds?: number;
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
  const { onRecordingComplete, onReset, maxDurationSeconds = 1800 } = options;

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
  const stopRecordingRef = useRef<() => Promise<Blob | null>>(() => Promise.resolve(null));

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
    setErrorMessage(null);
    setVideoUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setVideoBlob(null);

    try {
      // 1. Request Front-Facing Camera & Audio Stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
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

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraPermissionState('granted');

      // 2. Resolve Container & Codec
      const mimeType = getSupportedVideoMimeType();
      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: FIRESIDE_VIDEO_DEFAULTS.MAX_BITRATE_BPS, // 2 Mbps clamp
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      // 3. Initialise MediaRecorder with 5000ms timeslices for resilient ring buffering
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

      // 4. Start recording with 5s timeslice
      recorder.start(FIRESIDE_VIDEO_DEFAULTS.CHUNK_TIMESLICE_MS);

      // 5. Acquire Screen Wake Lock & Trigger Start Haptic
      await acquireWakeLock();
      triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.START);

      // 6. Update State & Start Timers
      setStatus('recording');
      setDurationSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds((prev) => {
          const next = prev + 1;
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
  }, [cleanupStream, acquireWakeLock, triggerHaptic, maxDurationSeconds]);

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
    if (status !== 'recording' && status !== 'paused') {
      return null;
    }

    setStatus('processing');
    triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.STOP);
    await releaseWakeLock();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const currentDuration = durationSeconds;

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
  }, [status, durationSeconds, releaseWakeLock, triggerHaptic, cleanupStream, onRecordingComplete]);

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
    setErrorMessage(null);
    setStatus('idle');
    recordedChunksRef.current = [];

    onReset?.();
  }, [cleanupStream, releaseWakeLock, onReset]);

  // ---------------------------------------------------------------------------
  // Retry Permission
  // ---------------------------------------------------------------------------
  const retryPermission = useCallback(async () => {
    setErrorMessage(null);
    setCameraPermissionState('prompt');
    await startRecording();
  }, [startRecording]);

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
  };
}
