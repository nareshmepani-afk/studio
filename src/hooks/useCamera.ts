import { useState, useEffect, useCallback, useRef } from 'react';

export interface CameraErrorDetails {
  name: string;
  message: string;
  type: 'permission' | 'notFound' | 'notReadable' | 'overconstrained' | 'unknown';
}

interface UseCameraOptions {
  enabled?: boolean;
}

export function useCamera({ enabled = false }: UseCameraOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [wirelessStream, setWirelessStream] = useState<MediaStream | null>(null);
  const [activeInput, setActiveInput] = useState<'studio' | 'wireless'>('studio');
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<CameraErrorDetails | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [zoomValue, setZoomValue] = useState(1);
  const [capabilities, setCapabilities] = useState<any>(null);

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

  // Check for multiple cameras (Front vs Back)
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    });
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const startStream = useCallback(async () => {
    if (isMuted) {
      console.log("[useCamera] Optics are muted by privacy shield. Aborting startStream.");
      stopStream();
      return;
    }
    stopStream();
    setError(null);
    setCameraError(null);

    // 5-Level Adaptive Resolution Cascade (4K -> 1080p -> 720p -> Default -> Video-Only)
    const constraintsList = [
      // Level 1: Premium 4K Target
      {
        video: { 
          facingMode,
          width: { ideal: 4096, max: 4096 },
          height: { ideal: 2160, max: 2160 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      },
      // Level 2: FullHD Fallback
      {
        video: { 
          facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      },
      // Level 3: HD Fallback
      {
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      },
      // Level 4: Standard constraints
      {
        video: true,
        audio: true
      },
      // Level 5: Video Only (if audio device fails or isn't recognised)
      {
        video: true,
        audio: false
      }
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
        console.warn(`[useCamera] Level ${i + 1} constraint initialization failed:`, err.name || err);
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

      // Get zoom and focus capabilities
      const track = newStream.getVideoTracks()[0];
      if (track && 'getCapabilities' in track) {
         const caps = track.getCapabilities() as any;
         setCapabilities(caps);
         
         // Force focus to continuous if supported
         if (caps.focusMode?.includes('continuous')) {
            try {
               await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
            } catch (e) { console.warn("Continuous focus not supported"); }
         }
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
        type
      });

      if (type === 'permission') {
        console.warn('Camera permission state:', errMessage || lastError);
      } else {
        console.error(lastError);
      }
    }
  }, [facingMode, isMuted, stopStream]);

  const applyZoom = useCallback(async (value: number) => {
     if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        if (track && 'applyConstraints' in track) {
           try {
              // Zoom standard is a bit experimental in some browsers
              await track.applyConstraints({ advanced: [{ zoom: value } as any] });
              setZoomValue(value);
           } catch (e) { console.warn("Zoom adjustment failed", e); }
        }
     }
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  useEffect(() => {
    if (enabled && !isMuted) {
      startStream();
    } else {
      stopStream();
      setError(null);
      setCameraError(null);
    }
    return () => stopStream();
  }, [enabled, isMuted, facingMode, startStream, stopStream]); // Restarts when mode or mute changes

  // Listen to browser permission state changes and reload automatically when granted
  useEffect(() => {
    if (!enabled || !cameraError || cameraError.type !== 'permission') return;

    let cameraStatus: PermissionStatus | null = null;
    let micStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      const camGranted = cameraStatus ? cameraStatus.state === 'granted' : false;
      const micGranted = micStatus ? micStatus.state === 'granted' : false;

      // In Chrome, if a previously denied permission changes to 'granted',
      // we can automatically trigger a page reload to apply the new devices cleanly
      // and close the browser's black reload bar instantly!
      if (camGranted || micGranted) {
        console.log('[useCamera] Permission granted via browser Site Settings. Reloading to apply settings...');
        window.location.reload();
      }
    };

    // Query camera status
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as any }).then(status => {
        cameraStatus = status;
        status.onchange = handlePermissionChange;
      }).catch(e => console.warn('Permissions query for camera not supported', e));

      // Query microphone status
      navigator.permissions.query({ name: 'microphone' as any }).then(status => {
        micStatus = status;
        status.onchange = handlePermissionChange;
      }).catch(e => console.warn('Permissions query for microphone not supported', e));
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
    isMuted
  };
}