
"use client";

import React, { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export function ClientSideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This useEffect hook will run once on the client when the app loads.
  // It dynamically adds the FFmpeg script to the document head.
  useEffect(() => {
    if (!document.getElementById('ffmpeg-script')) {
      console.log('ClientSideLayout: Loading ffmpeg.js script...');
      const script = document.createElement('script');
      script.id = 'ffmpeg-script';
      script.src = '/ffmpeg.js'; // Points to the file in the public directory
      script.async = true;
      script.onload = () => {
        console.log('ClientSideLayout: ffmpeg.js script loaded successfully.');
        // You could potentially set a global state or fire an event here
        // to notify the rest of the app, but getFFmpegInstance handles waiting.
      };
      script.onerror = () => {
        console.error('ClientSideLayout: Failed to load the ffmpeg.js script.');
        toast({
          title: "Critical Error",
          description: "Media processing tools failed to load. Please refresh the page.",
          variant: "destructive",
          duration: Infinity, // Keep it visible until dismissed
        });
      };
      document.head.appendChild(script);
    }
  }, []);

  return <>{children}</>;
}
