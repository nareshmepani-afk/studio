"use client";

import { useRef, useCallback, useEffect } from 'react';

// ... other imports ...

export function MediaCaptureControl({ onMediaReady, initialMedia, trimValues }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMetadata = useCallback(() => {
    const media = videoRef.current;
    if (!media) return;

    // Trigger update only if the parent thinks duration is 0
    if (media.duration > 0 && trimValues[1] === 0) {
      onMediaReady({
        file: new File([], "placeholder"),
        type: 'video',
        duration: media.duration,
        size: 0
      });
    }
  }, [onMediaReady, trimValues]);

  return (
    <div className="space-y-4">
      {initialMedia?.previewUrl && (
        <video 
          ref={videoRef}
          src={initialMedia.previewUrl} 
          onLoadedMetadata={handleMetadata}
          controls 
          className="w-full rounded bg-black"
        />
      )}
      {/* ... Recording controls ... */}
    </div>
  );
}