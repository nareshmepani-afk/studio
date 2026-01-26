'use client';

import { useStudioState } from '@/hooks/studio/useStudioState';
import { Camera, CameraOff } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';

export const DirectorMonitor = () => {
  const { isMirrored, isRecording } = useStudioState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, error } = useCamera();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isMirrored ? '-scale-x-100' : ''}`}
      />
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-50">
          {error ? (
            <div className="text-center">
              <CameraOff className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold">Camera Error</h2>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="text-center">
              <Camera className="w-16 h-16 animate-pulse mb-4" />
              <h2 className="text-2xl font-bold">Accessing Camera</h2>
              <p className="text-sm">Please grant permission to use your camera.</p>
            </div>
          )}
        </div>
      )}
       {isRecording && (
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-red-500 font-bold text-sm">ON AIR</span>
        </div>
      )}
    </div>
  );
};
