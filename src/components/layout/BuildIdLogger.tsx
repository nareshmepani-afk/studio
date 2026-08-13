"use client";

import { useEffect } from "react";

const BuildIdLogger = () => {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BUILD_ID) {
      console.log(`Build ID: ${process.env.NEXT_PUBLIC_BUILD_ID}`);
    }

    // Recover from stale build chunk mismatches automatically across deployments
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'reason' in event ? event.reason : event.error;
      const message = error?.message || error?.toString() || '';
      
      if (
        message.includes('Loading chunk') || 
        message.includes('ChunkLoadError') || 
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Script error')
      ) {
        console.warn('[BuildGuard] Detected stale build chunk mismatch across deployments. Auto-syncing latest application bundles...');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  return null;
};

export default BuildIdLogger;
