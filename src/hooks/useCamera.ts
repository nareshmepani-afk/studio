
import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const stopCurrentStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
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
    const initializeCamera = async () => {
      // 1. Warm up and get permissions
      try {
        // Temporarily get a stream to ensure permissions and labels are available
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tempStream.getTracks().forEach(track => track.stop());
      } catch (err) {
         if (err instanceof Error) {
          setError(`Permission denied: ${err.message}`);
        } else {
          setError('Permission to access camera was denied.');
        }
        console.error("Permission error:", err);
        return;
      }

      // 2. Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const availableVideoDevices = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(availableVideoDevices);

      // 3. Set initial device
      if (availableVideoDevices.length > 0) {
        // For mobile, try to default to the front camera first
        if (isMobile) {
          const frontCameraIndex = availableVideoDevices.findIndex(device => 
            device.label.toLowerCase().includes('front')
          );
          const initialIndex = frontCameraIndex !== -1 ? frontCameraIndex : 0;
          setCurrentDeviceIndex(initialIndex);
        } else {
          setCurrentDeviceIndex(0);
        }
      } else {
        setError("No video devices found.");
      }
    };

    initializeCamera();
    
    // Cleanup on unmount
    return () => {
      stopCurrentStream();
    };
  }, [isMobile, stopCurrentStream]);


  useEffect(() => {
    if (videoDevices.length === 0) return;
    
    const supportsFacingMode = navigator.mediaDevices.getSupportedConstraints().facingMode;
    let constraints: MediaStreamConstraints;

    if (isMobile && supportsFacingMode) {
        const currentDevice = videoDevices[currentDeviceIndex];
        // Heuristic to determine facing mode from label if possible
        const isFront = currentDevice.label.toLowerCase().includes('front');
        constraints = {
            video: {
                facingMode: isFront ? 'user' : 'environment'
            },
            audio: true
        };
    } else {
        // Desktop or mobile that doesn't support facingMode
        constraints = {
            video: {
                deviceId: { exact: videoDevices[currentDeviceIndex].deviceId }
            },
            audio: true
        };
    }
    
    getStream(constraints);

  }, [currentDeviceIndex, videoDevices, isMobile, getStream]);

  const switchCamera = useCallback(() => {
    if (videoDevices.length > 1) {
      setCurrentDeviceIndex(prevIndex => (prevIndex + 1) % videoDevices.length);
    }
  }, [videoDevices.length]);
  
  const hasMultipleCameras = videoDevices.length > 1;

  return { stream, error, switchCamera, hasMultipleCameras, currentDevice: videoDevices[currentDeviceIndex] };
}
