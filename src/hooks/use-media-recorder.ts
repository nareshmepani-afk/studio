import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// This tuple contains the generated memory ID and final download URL.
type UploadResult = [string, string];

export interface EDLTrackSegment {
  segmentId: string;
  blob: Blob;
  blobUrl: string;
  startOffset: number; // Cut start relative to segment (seconds)
  endOffset: number;   // Cut end relative to segment (seconds)
  duration: number;    // Resulting active duration (seconds)
}

export const useMediaRecorder = (stream: MediaStream | null) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  // Segmented multi-blob recording states
  const [recordedSegments, setRecordedSegments] = useState<EDLTrackSegment[]>([]);
  const segmentStartTimeRef = useRef(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const WARNING_LIMIT = 5 * 60; // 5 minutes
  const HARD_STOP_LIMIT = 7 * 60; // 7 minutes

  // Auto-consolidate segments into recordedBlob for backward compatibility
  useEffect(() => {
    if (recordedSegments.length > 0) {
      const mimeType = ['video/webm;codecs=vp9', 'video/webm'].find(MediaRecorder.isTypeSupported) || 'video/webm';
      const combined = new Blob(recordedSegments.map(s => s.blob), { type: mimeType });
      setRecordedBlob(combined);
    } else {
      setRecordedBlob(null);
    }
  }, [recordedSegments]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const startRecording = useCallback((isPunch: boolean = false) => {
    if (!stream) return;

    chunksRef.current = [];
    const mimeType = ['video/webm;codecs=vp9', 'video/webm'].find(MediaRecorder.isTypeSupported) || 'video/webm';
    
    // PREMIUM: Set a high bitrate (8Mbps) to ensure UHD/HD footage is crisp.
    const recorder = new MediaRecorder(stream, { 
      mimeType,
      videoBitsPerSecond: 8000000, 
      audioBitsPerSecond: 128000
    });
    
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      console.log(`[MediaRecorder] Segment stop event fired. Commencing compilation of ${chunksRef.current.length} chunks...`);
      const blob = new Blob(chunksRef.current, { type: mimeType });
      console.log(`[MediaRecorder] Compiled Segment Blob Info - Size: ${blob.size} bytes, Type: ${mimeType}`);
      setIsRecording(false);
      
      if (blob.size === 0) {
        console.error("[MediaRecorder] CRITICAL: Segment blob is empty. Trashing recording segment.");
        return;
      }

      // Calculate final active duration for this segment
      setRecordingTime((currentTotalTime) => {
        const duration = currentTotalTime - segmentStartTimeRef.current;
        if (duration > 0) {
          const newSegment: EDLTrackSegment = {
            segmentId: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            blob,
            blobUrl: URL.createObjectURL(blob),
            startOffset: 0,
            endOffset: duration,
            duration: duration
          };
          setRecordedSegments((prev) => [...prev, newSegment]);
          console.log(`[MediaRecorder] Added new segment: ${newSegment.segmentId} (duration: ${duration}s)`);
        }
        return currentTotalTime;
      });
    };

    console.log(`[MediaRecorder] Initiating recording with mimeType: ${mimeType}, high-bitrate target (8Mbps)`);
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    if (!isPunch) {
      setRecordingTime(0);
      segmentStartTimeRef.current = 0;
      // Revoke any existing URLs before clearing
      recordedSegments.forEach(s => {
        if (s.blobUrl) URL.revokeObjectURL(s.blobUrl);
      });
      setRecordedSegments([]);
      setRecordedBlob(null);
    } else {
      // Record relative to current punched playhead
      setRecordingTime((time) => {
        segmentStartTimeRef.current = time;
        return time;
      });
    }

    setUploadResult(null);
  }, [stream, recordedSegments]);

  // Live Tape-Style Punch In
  const punchIn = useCallback((timestamp: number) => {
    console.log(`[MediaRecorder] Punch-in request at: ${timestamp}s`);
    
    // Stop recording first if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.onstop = null; // Detach default stop to prevent race
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Compile remaining chunks before punching in
      const mimeType = ['video/webm;codecs=vp9', 'video/webm'].find(MediaRecorder.isTypeSupported) || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const duration = timestamp - segmentStartTimeRef.current;
      if (blob.size > 0 && duration > 0) {
        const lastSeg: EDLTrackSegment = {
          segmentId: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          blob,
          blobUrl: URL.createObjectURL(blob),
          startOffset: 0,
          endOffset: duration,
          duration: duration
        };
        setRecordedSegments((prev) => {
          const truncated = prev.slice();
          truncated.push(lastSeg);
          return truncated;
        });
      }
    }

    setRecordedSegments((prev) => {
      let accumulated = 0;
      const nextSegments: EDLTrackSegment[] = [];

      for (let i = 0; i < prev.length; i++) {
        const seg = prev[i];
        if (accumulated + seg.duration <= timestamp) {
          nextSegments.push(seg);
          accumulated += seg.duration;
        } else if (accumulated < timestamp) {
          const activeDuration = timestamp - accumulated;
          nextSegments.push({
            ...seg,
            endOffset: seg.startOffset + activeDuration,
            duration: activeDuration
          });
          accumulated += activeDuration;
          break;
        } else {
          break;
        }
      }

      // Revoke URLs of dropped segments
      const dropped = prev.slice(nextSegments.length);
      dropped.forEach(s => {
        if (s.blobUrl) {
          URL.revokeObjectURL(s.blobUrl);
        }
      });

      return nextSegments;
    });

    setRecordingTime(timestamp);
    segmentStartTimeRef.current = timestamp;

    // Start a new segment recording from this timestamp
    setTimeout(() => {
      startRecording(true);
    }, 150);
  }, [startRecording]);

  // Handle Recording Timer & 5+2 Rules
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          const nextTime = prev + 1;
          if (nextTime >= HARD_STOP_LIMIT) {
            stopRecording();
          }
          return nextTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, stopRecording]);

  const isWarningLimit = recordingTime >= WARNING_LIMIT;

  const { user } = useAuth();
  
  const uploadVideo = async (blob: Blob, memoryId: string, overrideUid?: string): Promise<string> => {
    setUploading(true);
    setUploadProgress(10);
    
    const activeUid = overrideUid || user?.uid;
    if (!activeUid) {
      setUploading(false);
      throw new Error("No active UID for upload.");
    }

    try {
      console.log(`[Upload Proxy] Commencing artifact transport for ${memoryId}...`);
      
      const response = await fetch(`/api/interviewer/upload?hostId=${activeUid}&memoryId=${memoryId}`, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload Proxy Failed: ${response.status}`);
      }

      const { url } = await response.json();
      setUploadProgress(100);
      setUploadResult([memoryId, url]);
      setUploading(false);
      return url;
    } catch (error) {
      setUploading(false);
      console.error("[Upload Proxy] FAILURE:", error);
      throw error;
    }
  };

  const clearRecording = useCallback(() => {
    recordedSegments.forEach(s => {
      if (s.blobUrl) {
        URL.revokeObjectURL(s.blobUrl);
      }
    });
    setRecordedSegments([]);
    setRecordedBlob(null);
    setUploadResult(null);
    setRecordingTime(0);
  }, [recordedSegments]);

  return { 
    isRecording, 
    startRecording, 
    stopRecording, 
    punchIn,
    recordingTime,
    isWarningLimit,
    recordedBlob,
    recordedSegments,
    setRecordedSegments,
    clearRecording,
    uploadVideo,
    uploadMediaBlob: uploadVideo,
    uploading, 
    uploadProgress, 
    uploadResult 
  };
};
