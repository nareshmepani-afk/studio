
import React, { useEffect, useRef } from 'react';
import { useStudio } from '@/hooks/studio/useStudio';

export const DirectorMonitor = () => {
  const { stream, isRecording } = useStudio();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-studio-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className="w-4 h-4 bg-studio-red rounded-full animate-tally-pulse"></div>
          <span className="text-studio-text font-bold text-lg">ON AIR</span>
        </div>
      )}
    </div>
  );
};
