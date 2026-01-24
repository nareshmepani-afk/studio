import { useState, useEffect, useCallback } from 'react';

interface UseCameraOptions {
  enabled?: boolean;
}

export function useCamera({ enabled = false }: UseCameraOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Check for multiple cameras (Front vs Back)
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    });
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startStream = useCallback(async () => {
    stopStream();
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      setStream(newStream);
      setError(null);
    } catch (err) {
      setError('Camera access denied or not available');
      console.error(err);
    }
  }, [facingMode, stopStream]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  useEffect(() => {
    if (enabled) {
      startStream();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [enabled, facingMode]); // Restarts when mode changes

  return { 
    stream, 
    error, 
    switchCamera, 
    hasMultipleCameras, 
    facingMode 
  };
}