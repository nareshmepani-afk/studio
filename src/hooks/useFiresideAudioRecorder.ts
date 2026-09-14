import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RecordingLifecycleStatus,
  MicrophonePermissionState,
  FiresideAudioMetrics,
  FIRESIDE_HAPTIC_PATTERNS,
} from '@/types/fireside';

export interface UseFiresideAudioRecorderOptions {
  onRecordingComplete?: (audioBlob: Blob, durationSeconds: number) => void;
  onReset?: () => void;
  maxDurationSeconds?: number;
}

export interface UseFiresideAudioRecorderReturn {
  status: RecordingLifecycleStatus;
  permissionState: MicrophonePermissionState;
  durationSeconds: number;
  formattedDuration: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  volume: number;
  waveform: number[];
  isWakeLockActive: boolean;
  errorMessage: string | null;
  audioMetrics: FiresideAudioMetrics | null;
  startRecording: () => Promise<boolean>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
  retryPermission: () => Promise<void>;
}

/**
 * Formats a duration in seconds into a high-contrast MM:SS string
 */
export function formatDurationMMSS(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
}

/**
 * Resolves the best supported audio MIME type for MediaRecorder across browsers
 */
export function getSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm;codecs=opus';
  }

  const preferredTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/aac',
  ];

  for (const type of preferredTypes) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch {
      // Continue searching
    }
  }

  return ''; // Browser default
}

export function useFiresideAudioRecorder(
  options: UseFiresideAudioRecorderOptions = {}
): UseFiresideAudioRecorderReturn {
  const { onRecordingComplete, onReset, maxDurationSeconds = 1800 } = options;

  const [status, setStatus] = useState<RecordingLifecycleStatus>('idle');
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>('prompt');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [waveform, setWaveform] = useState<number[]>(new Array(32).fill(0));
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioMetrics, setAudioMetrics] = useState<FiresideAudioMetrics | null>(null);

  // References for Web Audio & MediaRecorder instances
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
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
      console.warn('Screen Wake Lock request failed:', err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
      } catch (err) {
        console.warn('Screen Wake Lock release failed:', err);
      }
      wakeLockSentinelRef.current = null;
      setIsWakeLockActive(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Resource Cleanup Helper
  // ---------------------------------------------------------------------------
  const cleanupAudioPipeline = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }

    if (compressorNodeRef.current) {
      try {
        compressorNodeRef.current.disconnect();
      } catch {}
      compressorNodeRef.current = null;
    }

    if (analyserNodeRef.current) {
      try {
        analyserNodeRef.current.disconnect();
      } catch {}
      analyserNodeRef.current = null;
    }

    if (destinationNodeRef.current) {
      try {
        destinationNodeRef.current.disconnect();
      } catch {}
      destinationNodeRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setVolume(0);
    setWaveform(new Array(32).fill(0));
  }, []);

  // ---------------------------------------------------------------------------
  // Start Voice Recording
  // ---------------------------------------------------------------------------
  const startRecording = useCallback(async (): Promise<boolean> => {
    cleanupAudioPipeline();
    setErrorMessage(null);

    try {
      // 1. Request Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;
      setPermissionState('granted');

      // 2. Initialise Web Audio Context
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      
      if (!AudioContextClass) {
        throw new Error('Web Audio API is not supported in this browser.');
      }

      const audioCtx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 48000 });
      audioContextRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // 3. Dynamics Compressor Node (Gentle speech leveller)
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
      compressor.knee.setValueAtTime(30, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressor.release.setValueAtTime(0.25, audioCtx.currentTime);
      compressorNodeRef.current = compressor;

      // 4. Analyser Node for Real-Time Waveform & VU Meter
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserNodeRef.current = analyser;

      // 5. Connect Source -> Compressor -> Analyser
      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      source.connect(compressor);
      compressor.connect(analyser);

      // 6. Connect to MediaStreamDestination if available, else record from raw stream
      let recordingStream = stream;
      if (typeof audioCtx.createMediaStreamDestination === 'function') {
        const destination = audioCtx.createMediaStreamDestination();
        destinationNodeRef.current = destination;
        compressor.connect(destination);
        if (destination.stream.getAudioTracks().length > 0) {
          recordingStream = destination.stream;
        }
      }

      // 7. Initialise MediaRecorder with Supported MimeType
      const mimeType = getSupportedAudioMimeType();
      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(recordingStream, recorderOptions);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // 8. Start MediaRecorder
      recorder.start(250); // Emit chunks every 250ms for streaming reliability

      // 9. Acquire Screen Wake Lock & Trigger Start Haptic
      await acquireWakeLock();
      triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.START);

      // 10. Update State & Start Timers
      setStatus('recording');
      setDurationSeconds(0);

      // Timer Interval
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            stopRecordingRef.current();
          }
          return next;
        });
      }, 1000);

      // Analyser Loop for VU & Waveform
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderAudioFrame = () => {
        if (!analyserNodeRef.current || statusRef.current === 'idle' || statusRef.current === 'saved') {
          return;
        }

        analyserNodeRef.current.getByteFrequencyData(dataArray);

        // Calculate average RMS for Volume (0 - 100)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = bufferLength > 0 ? sum / bufferLength : 0;
        setVolume(Math.min(100, Math.round((avg / 255) * 100)));

        // Downsample to 32 normalised bars for responsive rendering
        const step = Math.max(1, Math.floor(bufferLength / 32));
        const downsampled: number[] = [];
        for (let i = 0; i < 32; i++) {
          const val = dataArray[i * step] || 0;
          downsampled.push(Number((val / 255).toFixed(2)));
        }
        setWaveform(downsampled);

        animationFrameRef.current = requestAnimationFrame(renderAudioFrame);
      };

      animationFrameRef.current = requestAnimationFrame(renderAudioFrame);
      return true;
    } catch (err: any) {
      console.error('Failed to start Fireside Voice Recording:', err);
      cleanupAudioPipeline();

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('Permission denied')
      ) {
        setPermissionState('denied');
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser settings.');
      } else {
        setErrorMessage(err.message || 'Unable to start voice recording. Please check your microphone.');
      }

      setStatus('error');
      return false;
    }
  }, [cleanupAudioPipeline, acquireWakeLock, triggerHaptic, maxDurationSeconds]);

  // ---------------------------------------------------------------------------
  // Pause Voice Recording
  // ---------------------------------------------------------------------------
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.pause();
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.PAUSE);
        setStatus('paused');
      } catch (err) {
        console.warn('Error pausing MediaRecorder:', err);
      }
    }
  }, [status, triggerHaptic]);

  // ---------------------------------------------------------------------------
  // Resume Voice Recording
  // ---------------------------------------------------------------------------
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'paused') {
      try {
        if (mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.resume();
        }

        // Resume timer
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
      } catch (err) {
        console.warn('Error resuming MediaRecorder:', err);
      }
    }
  }, [status, triggerHaptic, maxDurationSeconds]);

  // ---------------------------------------------------------------------------
  // Stop & Finalise Voice Recording
  // ---------------------------------------------------------------------------
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || status === 'idle' || status === 'saved') {
      return null;
    }

    setStatus('processing');
    triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.STOP);

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        setStatus('idle');
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || getSupportedAudioMimeType() || 'audio/webm';
        const finalBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const finalUrl = URL.createObjectURL(finalBlob);

        setAudioBlob(finalBlob);
        setAudioUrl(finalUrl);
        setStatus('saved');

        // Compile Audio Metrics
        const metrics: FiresideAudioMetrics = {
          durationSeconds,
          sampleRate: audioContextRef.current?.sampleRate || 48000,
          channelCount: 1,
          averageRms: volume,
          peakDecibels: -6,
          codec: mimeType,
        };
        setAudioMetrics(metrics);

        // Release Wake Lock and Audio Hardware
        await releaseWakeLock();
        cleanupAudioPipeline();

        if (onRecordingComplete) {
          onRecordingComplete(finalBlob, durationSeconds);
        }

        resolve(finalBlob);
      };

      try {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        } else {
          recorder.onstop?.(new Event('stop'));
        }
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
        cleanupAudioPipeline();
        releaseWakeLock();
        setStatus('error');
        resolve(null);
      }
    });
  }, [status, durationSeconds, volume, releaseWakeLock, cleanupAudioPipeline, triggerHaptic, onRecordingComplete]);

  // ---------------------------------------------------------------------------
  // Reset Voice Recording
  // ---------------------------------------------------------------------------
  const resetRecording = useCallback(() => {
    cleanupAudioPipeline();
    releaseWakeLock();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setDurationSeconds(0);
    setVolume(0);
    setWaveform(new Array(32).fill(0));
    setStatus('idle');
    setErrorMessage(null);
    setAudioMetrics(null);

    if (onReset) {
      onReset();
    }
  }, [cleanupAudioPipeline, releaseWakeLock, audioUrl, onReset]);

  // ---------------------------------------------------------------------------
  // Retry Permission
  // ---------------------------------------------------------------------------
  const retryPermission = useCallback(async () => {
    setErrorMessage(null);
    setPermissionState('prompt');
    await startRecording();
  }, [startRecording]);

  // Synchronise stopRecording ref for timer intervals
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupAudioPipeline();
      releaseWakeLock();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanupAudioPipeline, releaseWakeLock, audioUrl]);

  return {
    status,
    permissionState,
    durationSeconds,
    formattedDuration: formatDurationMMSS(durationSeconds),
    audioBlob,
    audioUrl,
    volume,
    waveform,
    isWakeLockActive,
    errorMessage,
    audioMetrics,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    retryPermission,
  };
}
