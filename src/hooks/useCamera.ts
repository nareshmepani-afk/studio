import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCameraOptions {
  enabled?: boolean;
}

export function useCamera({ enabled = false }: UseCameraOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [zoomValue, setZoomValue] = useState(1);
  const [capabilities, setCapabilities] = useState<any>(null);

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
    stopStream();
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 4096, max: 4096 }, // Target 4K/FullHD
          height: { ideal: 2160, max: 2160 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        },
      });
      streamRef.current = newStream;
      setStream(newStream);
      setError(null);

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
    } catch (err) {
      setError('Camera access denied or not available');
      console.error(err);
    }
  }, [facingMode, stopStream]);

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
    if (enabled) {
      startStream();
    } else {
      stopStream();
      setError(null);
    }
    return () => stopStream();
  }, [enabled, facingMode, startStream, stopStream]); // Restarts when mode changes

  return { 
    stream, 
    error, 
    switchCamera, 
    hasMultipleCameras, 
    facingMode,
    zoomValue,
    applyZoom,
    capabilities
  };
}