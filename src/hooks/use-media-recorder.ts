
import { useState, useRef, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// This tuple contains the generated memory ID and the final download URL.
type UploadResult = [string, string];

export const useMediaRecorder = (stream: MediaStream | null) => {
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const startRecording = useCallback(() => {
    if (!stream) return;

    chunksRef.current = [];
    const mimeType = ['video/webm;codecs=vp9', 'video/webm'].find(MediaRecorder.isTypeSupported) || 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      await uploadVideo(blob);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setUploadResult(null);
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const uploadVideo = async (blob: Blob) => {
    setUploading(true);
    setUploadProgress(0);
    const memoryId = `${Date.now()}`;
    try {
      const storageRef = ref(storage, `memories/${memoryId}.webm`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          setUploading(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("Video uploaded successfully:", url);
          setUploadResult([memoryId, url]);
          setUploading(false);
        }
      );
    } catch (err) {
      console.error("Upload failed:", err);
      setUploading(false);
    }
  };

  return { isRecording, startRecording, stopRecording, uploading, uploadProgress, uploadResult };
};
