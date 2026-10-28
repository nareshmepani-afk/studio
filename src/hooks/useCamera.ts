import React, { useState, useEffect, useCallback, useRef } from 'react';

export const PREFERRED_VIDEO_DEVICE_STORAGE_KEY = 'mw_preferred_video_device_id';
export const PREFERRED_AUDIO_DEVICE_STORAGE_KEY = 'mw_preferred_audio_device_id';

export interface CameraErrorDetails {
  name: string;
  message: string;
  type: 'permission' | 'notFound' | 'notReadable' | 'overconstrained' | 'unknown';
}

export interface HardwareDeviceOption {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput';
  groupId?: string;
  isExternalUsb?: boolean;
}

interface UseCameraOptions {
  enabled?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

const EXTERNAL_HARDWARE_REGEX =
  /usb|wireless|rode|dji|shure|blue|yeti|fifine|elgato|samson|audio-technica|receiver|external|headset|podcast|cam link|brio|logitech|insta360|osmo|sony|canon/i;

export function isExternalHardwareDevice(label: string = '', deviceId: string = ''): boolean {
  if (EXTERNAL_HARDWARE_REGEX.test(label)) return true;
  if (deviceId && deviceId !== 'default' && deviceId !== 'communications') return true;
  return false;
}

export function mapHeightToResolutionLabel(height?: number): '4K' | '1080P' | '720P' {
  if (typeof height === 'number') {
    if (height >= 2160) return '4K';
    if (height >= 1080) return '1080P';
    if (height >= 720) return '720P';
  }
  return '720P';
}

export function useCamera({ enabled = false, videoRef }: UseCameraOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRefHolder = useRef<React.RefObject<HTMLVideoElement | null> | undefined>(videoRef);
  videoRefHolder.current = videoRef;

  const [wirelessStream, setWirelessStream] = useState<MediaStream | null>(null);
  const [activeInput, setActiveInput] = useState<'studio' | 'wireless'>('studio');
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<CameraErrorDetails | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [zoomValue, setZoomValue] = useState(1);
  const [capabilities, setCapabilities] = useState<any>(null);

  // Native USB Camera & Microphone Discovery State (FEAT-MW-159)
  const [videoDevices, setVideoDevices] = useState<HardwareDeviceOption[]>([]);
  const [audioDevices, setAudioDevices] = useState<HardwareDeviceOption[]>([]);
  const audioDevicesRef = useRef<HardwareDeviceOption[]>([]);
  audioDevicesRef.current = audioDevices;

  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(PREFERRED_VIDEO_DEVICE_STORAGE_KEY) || '';
    }
    return '';
  });
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(PREFERRED_AUDIO_DEVICE_STORAGE_KEY) || '';
    }
    return '';
  });

  // Tracks the deviceIds of the currently running stream so initial auto-discovery does not re-trigger startStream
  const activeStreamDevicesRef = useRef<{ videoId: string; audioId: string; facingMode: string }>({
    videoId: '',
    audioId: '',
    facingMode: '',
  });

  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('STUDIO WEBCAM');
  const [activeMicLabel, setActiveMicLabel] = useState<string>('DEFAULT MICROPHONE');
  const [activeResolutionLabel, setActiveResolutionLabel] = useState<'4K' | '1080P' | '720P'>('720P');

  // WebRTC Remote Camera Hook Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRemoteCamera = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.stream) {
        console.log('[useCamera] Lock-on to P2P Wireless stream feed:', customEvent.detail.stream);
        setWirelessStream(customEvent.detail.stream);
        setActiveInput('wireless'); // Auto-switch to wireless lens on connection
      }
    };

    window.addEventListener('remote-camera-active', handleRemoteCamera);
    return () => {
      window.removeEventListener('remote-camera-active', handleRemoteCamera);
    };
  }, []);

  const switchInput = useCallback((input: 'studio' | 'wireless') => {
    if (input === 'wireless' && !wirelessStream) {
      console.warn('[useCamera] Cannot switch: Wireless lens is not linked.');
      return;
    }
    setActiveInput(input);
  }, [wirelessStream]);

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('privacy_optics_muted') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const handleMuteChange = () => {
      setIsMuted(localStorage.getItem('privacy_optics_muted') === 'true');
    };
    window.addEventListener('privacy-optics-changed', handleMuteChange);
    return () => window.removeEventListener('privacy-optics-changed', handleMuteChange);
  }, []);

  /**
   * Enumerate all connected videoinput and audioinput devices.
   * Validates persisted localStorage preferences (Guard 4) and gracefully falls back
   * to the system default if an external USB camera or microphone was unplugged.
   */
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return { video: [] as HardwareDeviceOption[], audio: [] as HardwareDeviceOption[] };
    }

    try {
      const rawDevices = await navigator.mediaDevices.enumerateDevices();
      const rawVideo = rawDevices.filter((d) => d.kind === 'videoinput');
      const rawAudio = rawDevices.filter((d) => d.kind === 'audioinput');

      const mappedVideo: HardwareDeviceOption[] = rawVideo.map((d, idx) => {
        const cleanLabel = d.label?.trim() || `Camera ${idx + 1}`;
        return {
          deviceId: d.deviceId,
          label: cleanLabel,
          kind: 'videoinput',
          groupId: d.groupId,
          isExternalUsb: isExternalHardwareDevice(cleanLabel, d.deviceId),
        };
      });

      const mappedAudio: HardwareDeviceOption[] = rawAudio.map((d, idx) => {
        const cleanLabel = d.label?.trim() || `Microphone ${idx + 1}`;
        return {
          deviceId: d.deviceId,
          label: cleanLabel,
          kind: 'audioinput',
          groupId: d.groupId,
          isExternalUsb: isExternalHardwareDevice(cleanLabel, d.deviceId),
        };
      });

      setVideoDevices(mappedVideo);
      setAudioDevices(mappedAudio);
      audioDevicesRef.current = mappedAudio;
      setHasMultipleCameras(mappedVideo.length > 1);

      // Guard 4: Verify saved video deviceId still exists when non-empty deviceIds are enumerated
      const hasResolvedVideoIds = mappedVideo.some((d) => Boolean(d.deviceId));
      if (hasResolvedVideoIds && typeof window !== 'undefined') {
        const savedVideoId = localStorage.getItem(PREFERRED_VIDEO_DEVICE_STORAGE_KEY);
        if (savedVideoId) {
          const exists = mappedVideo.some((d) => d.deviceId === savedVideoId);
          if (exists) {
            setSelectedVideoDeviceId((prev) => (prev !== savedVideoId ? savedVideoId : prev));
          } else {
            // Unplugged USB camera fallback to system default
            localStorage.removeItem(PREFERRED_VIDEO_DEVICE_STORAGE_KEY);
            const fallbackVideoId = mappedVideo[0]?.deviceId || '';
            setSelectedVideoDeviceId(fallbackVideoId);
          }
        }
      }

      // Guard 4: Verify saved audio deviceId still exists when non-empty deviceIds are enumerated
      const hasResolvedAudioIds = mappedAudio.some((d) => Boolean(d.deviceId));
      if (hasResolvedAudioIds && typeof window !== 'undefined') {
        const savedAudioId = localStorage.getItem(PREFERRED_AUDIO_DEVICE_STORAGE_KEY);
        if (savedAudioId) {
          const exists = mappedAudio.some((d) => d.deviceId === savedAudioId);
          if (exists) {
            setSelectedAudioDeviceId((prev) => (prev !== savedAudioId ? savedAudioId : prev));
          } else {
            // Unplugged USB microphone fallback to system default
            localStorage.removeItem(PREFERRED_AUDIO_DEVICE_STORAGE_KEY);
            const fallbackAudioId = mappedAudio[0]?.deviceId || '';
            setSelectedAudioDeviceId(fallbackAudioId);
          }
        }
      }

      return { video: mappedVideo, audio: mappedAudio };
    } catch (err) {
      console.warn('[useCamera] Device enumeration failed:', err);
      return { video: [] as HardwareDeviceOption[], audio: [] as HardwareDeviceOption[] };
    }
  }, []);

  // Initial enumeration & USB hot-plug listener (Deliverable 2.2)
  useEffect(() => {
    refreshDevices();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    const handleDeviceChange = () => {
      console.log('[useCamera] Hardware devicechange detected — re-enumerating USB buses...');
      refreshDevices();
    };

    try {
      navigator.mediaDevices.ondevicechange = handleDeviceChange;
    } catch {
      // Ignore if read-only in test environment
    }

    if (typeof navigator.mediaDevices.addEventListener === 'function') {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange === handleDeviceChange) {
          navigator.mediaDevices.ondevicechange = null;
        }
      } catch {
        // Ignore cleanup errors in read-only mocks
      }
      if (typeof navigator.mediaDevices?.removeEventListener === 'function') {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [refreshDevices]);

  /**
   * Guard 1 — Windows USB Track Teardown Order (NotReadableError Prevention):
   * Explicitly stops all active tracks and clears videoRef.current.srcObject = null
   * BEFORE requesting a new getUserMedia stream so Windows UVC drivers and shared USB-C
   * buses release hardware locks cleanly.
   */
  const stopStream = useCallback(() => {
    const currentStream = streamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track: MediaStreamTrack) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('[useCamera] Failed to stop track cleanly:', err);
        }
      });
      streamRef.current = null;
    }

    if (videoRefHolder.current?.current) {
      videoRefHolder.current.current.srcObject = null;
    }

    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((videoEl) => {
        if (currentStream && videoEl.srcObject === currentStream) {
          videoEl.srcObject = null;
        } else if (!currentStream && videoEl.srcObject) {
          videoEl.srcObject = null;
        }
      });
    }

    activeStreamDevicesRef.current = { videoId: '', audioId: '', facingMode: '' };
    setStream(null);
  }, []);

  const startStream = useCallback(async () => {
    if (isMuted) {
      console.log('[useCamera] Optics are muted by privacy shield. Aborting startStream.');
      stopStream();
      return;
    }

    const savedVideoId =
      selectedVideoDeviceId ||
      (typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_VIDEO_DEVICE_STORAGE_KEY) || '' : '');
    const savedAudioId =
      selectedAudioDeviceId ||
      (typeof window !== 'undefined' ? localStorage.getItem(PREFERRED_AUDIO_DEVICE_STORAGE_KEY) || '' : '');

    // Prevent redundant stream teardown if the active stream is already serving the exact requested deviceIds
    if (
      streamRef.current &&
      activeStreamDevicesRef.current.facingMode === facingMode &&
      (!savedVideoId || activeStreamDevicesRef.current.videoId === savedVideoId) &&
      (!savedAudioId || activeStreamDevicesRef.current.audioId === savedAudioId)
    ) {
      return;
    }

    // Guard 1: Synchronous track teardown + srcObject nulling prior to getUserMedia
    stopStream();
    setError(null);
    setCameraError(null);

    // Guard 2: External Microphone DSP & Auto-Gain Protection
    // Disable browser autoGainControl when an external USB/wireless mic is selected
    const matchedAudioOption = audioDevicesRef.current.find((d) => d.deviceId === savedAudioId);
    const disableAutoGain =
      Boolean(savedAudioId) || Boolean(matchedAudioOption?.isExternalUsb);

    const buildAudioConstraints = (useExactDevice: boolean): MediaTrackConstraints | boolean => {
      if (useExactDevice && savedAudioId) {
        return {
          deviceId: { exact: savedAudioId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: !disableAutoGain,
        };
      }
      return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: !disableAutoGain,
      };
    };

    const buildVideoBase = (useExactDevice: boolean): MediaTrackConstraints => {
      if (useExactDevice && savedVideoId) {
        return { deviceId: { exact: savedVideoId } };
      }
      return { facingMode };
    };

    // 5-Level Adaptive Resolution & Device Fallback Cascade (4K -> 1080p -> 720p -> Default -> Video-Only)
    const constraintsList: MediaStreamConstraints[] = [
      // Level 1: Premium 4K Target with preferred USB deviceIds
      {
        video: {
          ...buildVideoBase(true),
          width: { ideal: 4096, max: 4096 },
          height: { ideal: 2160, max: 2160 },
          frameRate: { ideal: 30 },
        },
        audio: buildAudioConstraints(true),
      },
      // Level 2: FullHD 1080p Fallback with preferred USB deviceIds
      {
        video: {
          ...buildVideoBase(true),
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: buildAudioConstraints(true),
      },
      // Level 3: HD 720p Fallback with preferred USB deviceIds
      {
        video: {
          ...buildVideoBase(true),
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: buildAudioConstraints(true),
      },
      // Level 4: Relaxed constraints (recovers if a specific resolution or stale deviceId threw OverconstrainedError)
      {
        video: true,
        audio: buildAudioConstraints(false),
      },
      // Level 5: Video Only (if audio device fails or isn't recognised)
      {
        video: true,
        audio: false,
      },
    ];

    let newStream: MediaStream | null = null;
    let lastError: any = null;

    for (let i = 0; i < constraintsList.length; i++) {
      try {
        console.log(`[useCamera] Attempting stream initialization (Level ${i + 1})...`);
        newStream = await navigator.mediaDevices.getUserMedia(constraintsList[i]);
        if (newStream) {
          console.log(`[useCamera] Successfully initialized stream at Level ${i + 1}`);
          break;
        }
      } catch (err: any) {
        console.warn(`[useCamera] Level ${i + 1} constraint initialization failed:`, err?.name || err);
        lastError = err;
        // If permission is denied, trying lower constraints won't help
        if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          break;
        }
      }
    }

    if (newStream) {
      streamRef.current = newStream;
      setStream(newStream);
      setError(null);
      setCameraError(null);

      // Re-enumerate immediately after getUserMedia permission grant so hardware labels populate
      const enumerated = await refreshDevices();

      // Guard 3: True Negotiated Resolution & Dynamic HUD Telemetry (track.getSettings())
      const videoTrack = newStream.getVideoTracks?.()[0];
      let negotiatedVideoId = savedVideoId;
      if (videoTrack) {
        const settings =
          typeof videoTrack.getSettings === 'function' ? videoTrack.getSettings() : ({} as MediaTrackSettings);
        const negotiatedRes = mapHeightToResolutionLabel(settings?.height);
        setActiveResolutionLabel(negotiatedRes);

        negotiatedVideoId = settings?.deviceId || savedVideoId;

        const matchedCam = enumerated.video.find((d) => d.deviceId === negotiatedVideoId);
        const label = videoTrack.label?.trim() || matchedCam?.label || 'STUDIO WEBCAM';
        setActiveCameraLabel(label);

        if ('getCapabilities' in videoTrack && typeof videoTrack.getCapabilities === 'function') {
          const caps = videoTrack.getCapabilities() as any;
          setCapabilities(caps);

          // Force focus to continuous if supported
          if (caps?.focusMode?.includes('continuous')) {
            try {
              await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
            } catch {
              console.warn('Continuous focus not supported');
            }
          }
        }
      }

      const audioTrack = newStream.getAudioTracks?.()[0];
      let negotiatedAudioId = savedAudioId;
      if (audioTrack) {
        const audioSettings =
          typeof audioTrack.getSettings === 'function' ? audioTrack.getSettings() : ({} as MediaTrackSettings);
        negotiatedAudioId = audioSettings?.deviceId || savedAudioId;
        const matchedMic = enumerated.audio.find((d) => d.deviceId === negotiatedAudioId);
        const micLabel = audioTrack.label?.trim() || matchedMic?.label || 'DEFAULT MICROPHONE';
        setActiveMicLabel(micLabel);
      }

      activeStreamDevicesRef.current = {
        videoId: negotiatedVideoId || '',
        audioId: negotiatedAudioId || '',
        facingMode,
      };

      if (negotiatedVideoId && !selectedVideoDeviceId) {
        setSelectedVideoDeviceId(negotiatedVideoId);
      }
      if (negotiatedAudioId && !selectedAudioDeviceId) {
        setSelectedAudioDeviceId(negotiatedAudioId);
      }
    } else {
      const errName = lastError?.name || '';
      const errMessage = lastError?.message || '';

      let type: CameraErrorDetails['type'] = 'unknown';
      let errorString = 'Camera access denied or not available';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        type = 'permission';
        errorString = 'Camera or microphone access was not authorised by the user.';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        type = 'notFound';
        errorString = 'No camera or microphone device could be recognised on this system.';
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        type = 'notReadable';
        errorString = 'The camera or microphone is already in use by another programme.';
      } else if (errName === 'OverconstrainedError') {
        type = 'overconstrained';
        errorString = 'The requested video resolution constraints could not be satisfied.';
      }

      setError(errorString);
      setCameraError({
        name: errName,
        message: errMessage,
        type,
      });

      if (type === 'permission') {
        console.warn('Camera permission state:', errMessage || lastError);
      } else {
        console.error(lastError);
      }
    }
  }, [
    facingMode,
    isMuted,
    stopStream,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    refreshDevices,
  ]);

  const applyZoom = useCallback(async (value: number) => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        try {
          await track.applyConstraints({ advanced: [{ zoom: value } as any] });
          setZoomValue(value);
        } catch (e) {
          console.warn('Zoom adjustment failed', e);
        }
      }
    }
  }, []);

  /**
   * Select a specific USB or integrated camera by deviceId and persist in localStorage (Guard 4).
   */
  const selectVideoDevice = useCallback((deviceId: string) => {
    if (typeof window !== 'undefined') {
      if (deviceId) {
        localStorage.setItem(PREFERRED_VIDEO_DEVICE_STORAGE_KEY, deviceId);
      } else {
        localStorage.removeItem(PREFERRED_VIDEO_DEVICE_STORAGE_KEY);
      }
    }
    setActiveInput('studio');
    setSelectedVideoDeviceId(deviceId);
  }, []);

  /**
   * Select a specific USB or wireless microphone by deviceId and persist in localStorage (Guard 4).
   */
  const selectAudioDevice = useCallback((deviceId: string) => {
    if (typeof window !== 'undefined') {
      if (deviceId) {
        localStorage.setItem(PREFERRED_AUDIO_DEVICE_STORAGE_KEY, deviceId);
      } else {
        localStorage.removeItem(PREFERRED_AUDIO_DEVICE_STORAGE_KEY);
      }
    }
    setSelectedAudioDeviceId(deviceId);
  }, []);

  /**
   * Cycle sequentially through all detected videoDevices by deviceId on desktop,
   * or toggle facingMode when deviceIds are unavailable.
   */
  const switchCamera = useCallback(() => {
    const resolvedDevices = videoDevices.filter((d) => Boolean(d.deviceId));
    if (resolvedDevices.length > 1) {
      const currentIdx = resolvedDevices.findIndex((d) => d.deviceId === selectedVideoDeviceId);
      const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % resolvedDevices.length : 1;
      const nextDevice = resolvedDevices[nextIdx];
      if (nextDevice) {
        selectVideoDevice(nextDevice.deviceId);
        return;
      }
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, [videoDevices, selectedVideoDeviceId, selectVideoDevice]);

  useEffect(() => {
    if (enabled && !isMuted) {
      startStream();
    } else if (!enabled || isMuted) {
      stopStream();
      setError(null);
      setCameraError(null);
    }
  }, [enabled, isMuted, facingMode, selectedVideoDeviceId, selectedAudioDeviceId, startStream, stopStream]);

  // Clean up tracks on component unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Listen to browser permission state changes and reload automatically when granted
  useEffect(() => {
    if (!enabled || !cameraError || cameraError.type !== 'permission') return;

    let cameraStatus: PermissionStatus | null = null;
    let micStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      const camGranted = cameraStatus ? cameraStatus.state === 'granted' : false;
      const micGranted = micStatus ? micStatus.state === 'granted' : false;

      if (camGranted || micGranted) {
        console.log('[useCamera] Permission granted via browser Site Settings. Reloading to apply settings...');
        window.location.reload();
      }
    };

    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'camera' as any })
        .then((status) => {
          cameraStatus = status;
          status.onchange = handlePermissionChange;
        })
        .catch((e) => console.warn('Permissions query for camera not supported', e));

      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((status) => {
          micStatus = status;
          status.onchange = handlePermissionChange;
        })
        .catch((e) => console.warn('Permissions query for microphone not supported', e));
    }

    return () => {
      if (cameraStatus) cameraStatus.onchange = null;
      if (micStatus) micStatus.onchange = null;
    };
  }, [enabled, cameraError]);

  // Dynamically resolve active stream
  const activeStream = activeInput === 'wireless' ? wirelessStream : stream;

  return {
    stream: activeStream,
    localStream: stream,
    wirelessStream,
    activeInput,
    switchInput,
    isWirelessLinked: !!wirelessStream,
    error,
    cameraError,
    switchCamera,
    hasMultipleCameras,
    facingMode,
    zoomValue,
    applyZoom,
    capabilities,
    isMuted,
    // Native USB Camera & Microphone Discovery & Selection API (FEAT-MW-159)
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    selectVideoDevice,
    selectAudioDevice,
    activeCameraLabel,
    activeMicLabel,
    activeResolutionLabel,
    refreshDevices,
  };
}
