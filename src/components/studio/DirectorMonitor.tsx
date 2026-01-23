import React, { useEffect, useRef } from 'react';

const DirectorMonitor = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-black rounded-lg overflow-hidden aspect-video">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full"></video>
    </div>
  );
};

export default DirectorMonitor;
