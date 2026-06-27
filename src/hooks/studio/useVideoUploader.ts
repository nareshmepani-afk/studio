import { useState, useCallback } from 'react';
import { authorizeVideoProcessingSession } from '@/app/admin/videoActions';

export interface LocalEDLSegment {
  segmentId: string;
  blobUrl: string;
  startOffset: number;
  endOffset: number;
  duration: number;
}

export function useVideoUploader(edl: LocalEDLSegment[]) {
  const [isUploading, setIsUploading] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const executeStagingUpload = useCallback(async (inviteId: string) => {
    setIsUploading(true);
    setProgressPercentage(0);
    setError(null);

    try {
      const manifestPayload = {
        segments: edl.map(seg => ({
          segmentId: seg.segmentId,
          startOffset: seg.startOffset,
          endOffset: seg.endOffset,
          duration: seg.duration
        })),
        inviteId,
        outputName: `sequenced-${inviteId}.webm`
      };

      const authResult = await authorizeVideoProcessingSession(manifestPayload);
      if (!authResult.success || !authResult.uploadTokens) {
        throw new Error(authResult.message || 'Authorization failed.');
      }

      const tokens = authResult.uploadTokens;
      const totalSegments = edl.length;

      const progressTracker: Record<string, number> = {};
      tokens.forEach(t => {
        progressTracker[t.segmentId] = 0;
      });

      const updateOverallProgress = () => {
        const totalProgress = Object.values(progressTracker).reduce((sum, val) => sum + val, 0);
        setProgressPercentage(Math.round(totalProgress / totalSegments));
      };

      const uploadPromises = tokens.map(async (token) => {
        const edlSegment = edl.find(s => s.segmentId === token.segmentId);
        if (!edlSegment) {
          throw new Error(`EDL segment mapping lost for: ${token.segmentId}`);
        }

        const blobResponse = await fetch(edlSegment.blobUrl);
        const blob = await blobResponse.blob();

        const uploadWithRetry = async (url: string, data: Blob, retriesLeft = 3, delay = 1000): Promise<void> => {
          try {
            return await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('PUT', url);
              xhr.setRequestHeader('Content-Type', 'video/webm');

              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                  const percentComplete = (event.loaded / event.total) * 100;
                  progressTracker[token.segmentId] = percentComplete;
                  updateOverallProgress();
                }
              };

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  progressTracker[token.segmentId] = 100;
                  updateOverallProgress();
                  resolve();
                } else {
                  reject(new Error(`Server responded with status: ${xhr.status}`));
                }
              };

              xhr.onerror = () => reject(new Error('Network error occurred.'));
              xhr.send(data);
            });
          } catch (err) {
            if (retriesLeft > 0) {
              await new Promise(res => setTimeout(res, delay));
              return uploadWithRetry(url, data, retriesLeft - 1, delay * 2);
            }
            throw err;
          }
        };

        await uploadWithRetry(token.uploadUrl, blob);
      });

      await Promise.all(uploadPromises);
      setProgressPercentage(100);
      return { success: true };
    } catch (err: any) {
      console.error('Upload operation failed:', err);
      setError(err.message || 'Video staging upload transaction failure.');
      return { success: false, error: err.message };
    } finally {
      setIsUploading(false);
    }
  }, [edl]);

  return {
    isUploading,
    progressPercentage,
    error,
    executeStagingUpload
  };
}
