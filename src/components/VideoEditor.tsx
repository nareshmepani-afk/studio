'use client';

import { useState, useEffect, useRef } from 'react';
import { getFFmpegInstance, fetchFile, trimMediaWithFFmpeg } from '@/lib/ffmpeg';
import styles from './VideoEditor.module.css';

// Utility to format seconds into a MIN:SEC.MS format
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00.0';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
};

export default function VideoEditor() {
  // FFmpeg and state management
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [trimmedVideo, setTrimmedVideo] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);

  // Refs for DOM elements
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const trimmedVideoOutputRef = useRef<HTMLVideoElement>(null);
  const trimStartInputRef = useRef<HTMLInputElement>(null);
  const trimEndInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Logging utility
  const log = (message: string, type = 'info') => {
    setStatus(message);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Initialize FFmpeg on component mount
  useEffect(() => {
    const initializeFFmpeg = async () => {
      log('Initializing FFmpeg...', 'info');
      try {
        const ffmpeg = await getFFmpegInstance();
        if (ffmpeg) {
            // @ts-ignore
            ffmpeg.setLogger(({ type, message }) => {
                if (type === 'ffout' || type === 'fferr') {
                    console.log(`FFMPEG [${type}]:`, message);
                }
            });
            // @ts-ignore
            ffmpeg.setProgress(({ progress, time }) => {
                if (isProcessing) {
                    const percentage = Math.min(Math.round(progress * 100), 100);
                    setProcessingProgress(percentage);
                    log(`Processing... ${percentage}%`, 'info');
                }
            });
            setFfmpegLoaded(true);
            log('FFmpeg loaded successfully!', 'success');
        } else {
             throw new Error("FFmpeg instance creation failed.");
        }
      } catch (error) {
        log('Failed to load FFmpeg. Please check console for details.', 'error');
        console.error(error);
        setFfmpegLoaded(false);
      }
    };

    initializeFFmpeg();
  }, [isProcessing]); // Re-check dependencies, added isProcessing to re-attach progress if needed.

  // Recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
      }
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;

      recorder.onstart = () => {
        const startTime = Date.now();
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setRecordingTime(0);
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedVideo(blob);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = URL.createObjectURL(blob);
        }
        stream.getTracks().forEach((track) => track.stop());
        log('Recording stopped. Video ready for trimming.', 'success');
        setIsRecording(false);
      };

      recorder.start();
      log('Recording started...', 'info');
      setIsRecording(true);

    } catch (error: any) {
      log(`Could not access camera/microphone: ${error.message}`, 'error');
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Trimming
  const handleTrim = async () => {
    if (!ffmpegLoaded) return log('Error: FFmpeg is not loaded.', 'error');
    if (!recordedVideo) return log('Error: No video has been recorded.', 'error');

    const start = parseFloat(trimStartInputRef.current?.value || '0');
    const end = parseFloat(trimEndInputRef.current?.value || '2');
    if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
        return log('Error: Invalid trim times. Start must be >= 0 and end > start.', 'error');
    }

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      log('Trimming video...', 'info');
      
      const trimmedBlob = await trimMediaWithFFmpeg(recordedVideo, start, end);
      
      setTrimmedVideo(trimmedBlob);
      if (trimmedVideoOutputRef.current) {
        trimmedVideoOutputRef.current.src = URL.createObjectURL(trimmedBlob);
      }
      log('Trimming complete!', 'success');

    } catch (error: any) {
      log(`Error during trimming: ${error.message}`, 'error');
      console.error('Error during trimming:', error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Uploading
  const handleUpload = async () => {
    if (!trimmedVideo) return log('Error: No trimmed video to upload.', 'error');

    const formData = new FormData();
    formData.append('video', trimmedVideo, 'trimmed-video.webm');

    try {
      log('Uploading video...', 'info');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        log(`Video uploaded successfully! Path: ${result.path}`, 'success');
      } else {
        log(`Video upload failed: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (error: any) {
      log(`Error during upload: ${error.message}`, 'error');
      console.error('Error during upload:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className="text-3xl font-bold mb-4 text-center">Video Editor</h1>
      <p className={styles.status}>{status}</p>

      <div className={styles.mainContent}>
        <div className={styles.videoSection}>
          <h2 className="text-xl font-semibold mb-2">Video Preview</h2>
          <video ref={videoPreviewRef} className="w-full bg-black rounded-md" controls autoPlay muted playsInline />
        </div>

        <div className={styles.controlsSection}>
          <h2 className="text-xl font-semibold mb-2">Controls</h2>
          <div className={styles.controlGroup}>
            <h3>Recording</h3>
            <button onClick={startRecording} disabled={isRecording || !ffmpegLoaded}>
              Start Recording
            </button>
            <button onClick={stopRecording} disabled={!isRecording}>
              Stop Recording
            </button>
            {isRecording && <p className={styles.timer}>Recording: {formatTime(recordingTime)}</p>}
          </div>

          <div className={styles.controlGroup}>
            <h3>Trimming</h3>
            <div>
              <label htmlFor="trim-start">Start (sec):</label>
              <input type="number" id="trim-start" ref={trimStartInputRef} defaultValue="0" min="0" disabled={!recordedVideo} />
            </div>
            <div>
              <label htmlFor="trim-end">End (sec):</label>
              <input type="number" id="trim-end" ref={trimEndInputRef} defaultValue="2" min="0" disabled={!recordedVideo} />
            </div>
            <button onClick={handleTrim} disabled={!recordedVideo || !ffmpegLoaded || isProcessing}>
              {isProcessing ? `Processing... ${processingProgress}%` : 'Trim Video'}
            </button>
            {isProcessing && <progress value={processingProgress} max="100" className="w-full" />}
          </div>

          <div className={styles.controlGroup}>
            <h3>Output</h3>
            <video ref={trimmedVideoOutputRef} className="w-full bg-black rounded-md" controls playsInline />
            <button onClick={handleUpload} disabled={!trimmedVideo}>
              Upload Trimmed Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
