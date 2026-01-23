import { useState, useEffect, useCallback } from 'react';

export type CameraResolution = '720p' | '1080p';

const RESOLUTION_CONSTRAINTS: Record<CameraResolution, MediaTrackConstraints> = {
  '720p': { width: { ideal: 1280 }, height: { ideal: 720 } },
  '1080p': { width: { ideal: 1920 }, height: { ideal: 1080 } },
};

export function useCameraManager() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState<number>(0);
  const [resolution, setResolution] = useState<CameraResolution>('720p');
  const [error, setError] = useState<string | null>(null);

  const stopCurrentStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const getStream = useCallback(async (constraints: MediaStreamConstraints) => {
    stopCurrentStream();
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { ...constraints },
        audio: true,
       });
      setStream(newStream);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while accessing the camera.');
      }
      console.error("Error accessing camera:", err);
    }
  }, [stopCurrentStream]);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        // Request permission and get a temporary stream to enumerate devices
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tempStream.getTracks().forEach(track => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const availableVideoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (availableVideoDevices.length === 0) {
          setError("No video devices found.");
          return;
        }

        setVideoDevices(availableVideoDevices);
        setCurrentDeviceIndex(0); // Default to the first camera
      } catch (err) {
        const errorMessage = err instanceof Error ? `Permission denied: ${err.message}` : 'Permission to access camera was denied.';
        setError(errorMessage);
        console.error("Permission error:", err);
      }
    };

    initializeCamera();
    
    return () => {
      stopCurrentStream();
    };
  }, []);

  useEffect(() => {
    if (videoDevices.length === 0) return;
    
    const currentDevice = videoDevices[currentDeviceIndex];
    if (!currentDevice) return;

    const constraints = {
      deviceId: { exact: currentDevice.deviceId },
      ...RESOLUTION_CONSTRAINTS[resolution],
    };
    
    getStream(constraints);

    return () => {
      stopCurrentStream();
    };

  }, [currentDeviceIndex, videoDevices, resolution, getStream]);

  const switchCamera = useCallback(() => {
    if (videoDevices.length > 1) {
      setCurrentDeviceIndex(prevIndex => (prevIndex + 1) % videoDevices.length);
    }
  }, [videoDevices.length]);
  
  const hasMultipleCameras = videoDevices.length > 1;

  return { 
    stream, 
    error, 
    switchCamera, 
    hasMultipleCameras, 
    currentDevice: videoDevices[currentDeviceIndex], 
    resolution,
    setResolution,
    videoDevices
  };
}
