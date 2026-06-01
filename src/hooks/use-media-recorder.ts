import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// This tuple contains the generated memory ID and final download URL.
type UploadResult = [string, string];

export const useMediaRecorder = (stream: MediaStream | null) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const WARNING_LIMIT = 5 * 60; // 5 minutes
  const HARD_STOP_LIMIT = 7 * 60; // 7 minutes

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!stream) return;

    chunksRef.current = [];
    const mimeType = ['video/webm;codecs=vp9', 'video/webm'].find(MediaRecorder.isTypeSupported) || 'video/webm';
    
    // PREMIUM: Set a high bitrate (8Mbps) to ensure UHD/HD footage is crisp.
    // Standard browser defaults are often too low (2.5Mbps).
    const recorder = new MediaRecorder(stream, { 
      mimeType,
      videoBitsPerSecond: 8000000, 
      audioBitsPerSecond: 128000
    });
    
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
        console.log(`[MediaRecorder] Chunk received: ${e.data.size} bytes. Total chunks: ${chunksRef.current.length}`);
      } else {
        console.warn("[MediaRecorder] Received empty or invalid chunk data.");
      }
    };

    recorder.onstop = () => {
      console.log(`[MediaRecorder] stop event fired. Commencing compilation of ${chunksRef.current.length} chunks...`);
      const blob = new Blob(chunksRef.current, { type: mimeType });
      console.log(`[MediaRecorder] Compiled Blob Info - Size: ${blob.size} bytes, Type: ${mimeType}`);
      setIsRecording(false);
      
      if (blob.size === 0) {
        console.error("[MediaRecorder] CRITICAL: Recording blob is completely empty (0 bytes). Trashing recording.");
        return;
      }

      console.log("[MediaRecorder] Successfully compiled recording blob. Updating recordedBlob state...");
      setRecordedBlob(blob);
    };

    console.log(`[MediaRecorder] Initiating recording with mimeType: ${mimeType}, high-bitrate target (8Mbps)`);
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingTime(0);
    setUploadResult(null);
    setRecordedBlob(null);
  }, [stream]);

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

  const { user } = useAuth(); // Import hook at the top level of this file!
  
  const uploadVideo = async (blob: Blob, memoryId: string, overrideUid?: string): Promise<string> => {
    setUploading(true);
    setUploadProgress(10); // Start progress for feedback
    
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

  const clearRecording = () => {
    setRecordedBlob(null);
    setUploadResult(null);
  };

  return { 
    isRecording, 
    startRecording, 
    stopRecording, 
    recordingTime,
    isWarningLimit,
    recordedBlob,
    clearRecording,
    uploadVideo,
    uploadMediaBlob: uploadVideo, // Generic alias for thumbnail snapshots
    uploading, 
    uploadProgress, 
    uploadResult 
  };
};
