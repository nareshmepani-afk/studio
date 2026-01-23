'''
import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

export function useCamera({ enabled = true }: { enabled?: boolean } = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const stopCurrentStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const getStream = useCallback(async (constraints: MediaStreamConstraints) => {
    stopCurrentStream();
    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
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
    if (!enabled) {
      stopCurrentStream();
      return;
    }

    const initializeCamera = async () => {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tempStream.getTracks().forEach(track => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const availableVideoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (availableVideoDevices.length === 0) {
          setError("No video devices found.");
          return;
        }

        setVideoDevices(availableVideoDevices);

        if (isMobile) {
          const frontCameraIndex = availableVideoDevices.findIndex(device => 
            device.label.toLowerCase().includes('front')
          );
          setCurrentDeviceIndex(frontCameraIndex !== -1 ? frontCameraIndex : 0);
        } else {
          setCurrentDeviceIndex(0);
        }
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
  }, [enabled, isMobile]);


  useEffect(() => {
    if (!enabled || videoDevices.length === 0) return;
    
    const currentDevice = videoDevices[currentDeviceIndex];
    if (!currentDevice) return;

    const supportsFacingMode = navigator.mediaDevices.getSupportedConstraints().facingMode;
    let constraints: MediaStreamConstraints;

    if (isMobile && supportsFacingMode) {
        const isFront = currentDevice.label.toLowerCase().includes('front');
        constraints = {
            video: { facingMode: isFront ? 'user' : 'environment' },
            audio: true
        };
    } else {
        constraints = {
            video: { deviceId: { exact: currentDevice.deviceId } },
            audio: true
        };
    }
    
    getStream(constraints);

    return () => {
      stopCurrentStream();
    };

  }, [currentDeviceIndex, videoDevices, isMobile, getStream, enabled]);

  const switchCamera = useCallback(() => {
    if (videoDevices.length > 1) {
      setCurrentDeviceIndex(prevIndex => (prevIndex + 1) % videoDevices.length);
    }
  }, [videoDevices.length]);
  
  const hasMultipleCameras = videoDevices.length > 1;

  return { stream, error, switchCamera, hasMultipleCameras, currentDevice: videoDevices[currentDeviceIndex] };
}
''