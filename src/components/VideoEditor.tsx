'use client';

import { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import styles from './VideoEditor.module.css';

export default function VideoEditor() {
  // FFmpeg and state management
  const [ffmpeg, setFfmpeg] = useState(null);
  const [status, setStatus] = useState('Initializing...');
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [trimmedVideo, setTrimmedVideo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);

  // Refs for DOM elements
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const trimmedVideoOutputRef = useRef<HTMLVideoElement>(null);
  const trimStartInputRef = useRef<HTMLInputElement>(null);
  const trimEndInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Logging utility
  const log = (message, type = 'info') => {
    setStatus(message);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Initialize FFmpeg on component mount
  useEffect(() => {
    const initializeFFmpeg = async () => {
      log('Initializing FFmpeg...', 'info');
      const ffmpegInstance = new FFmpeg();

      ffmpegInstance.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpegInstance.on('progress', ({ progress }) => {
        if (isProcessing) {
          const percentage = Math.round(progress * 100);
          setProcessingProgress(percentage);
          log(`Processing... ${percentage}%`, 'info');
        }
      });

      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        await ffmpegInstance.load({ coreURL, wasmURL });
        setFfmpeg(ffmpegInstance);
        log('FFmpeg loaded successfully!', 'success');
      } catch (error) {
        log('Failed to load FFmpeg. Please check console for details.', 'error');
        console.error(error);
      }
    };

    initializeFFmpeg();
  }, []); // Run only once

  // Recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoPreviewRef.current.srcObject = stream;
      const chunks = [];
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });

      mediaRecorderRef.current.onstart = () => {
        const startTime = Date.now();
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
      };

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        clearInterval(recordingIntervalRef.current);
        setRecordingTime(0);
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedVideo(blob);
        videoPreviewRef.current.srcObject = null;
        videoPreviewRef.current.src = URL.createObjectURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        log('Recording stopped. Video ready for trimming.', 'success');
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      log('Recording started...', 'info');
      setIsRecording(true);

    } catch (error) {
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
    if (!ffmpeg) return log('Error: FFmpeg is not loaded.', 'error');
    if (!recordedVideo) return log('Error: No video has been recorded.', 'error');

    const start = parseFloat(trimStartInputRef.current?.value || '0');
    const end = parseFloat(trimEndInputRef.current?.value || '2');
    if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
        return log('Error: Invalid trim times. Start must be >= 0 and end > start.', 'error');
    }

    const inputFileName = 'input.webm';
    const outputFileName = 'output.webm';

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      log('Trimming video...', 'info');

      await ffmpeg.writeFile(inputFileName, await fetchFile(recordedVideo));
      
      await ffmpeg.exec([
        '-i', inputFileName,
        '-ss', start.toString(),
        '-to', end.toString(),
        '-c', 'copy',
        outputFileName
      ]);

      const data = await ffmpeg.readFile(outputFileName);
      const trimmedBlob = new Blob([data.buffer], { type: 'video/webm' });
      setTrimmedVideo(trimmedBlob);
      trimmedVideoOutputRef.current.src = URL.createObjectURL(trimmedBlob);
      log('Trimming complete!', 'success');

    } catch (error) {
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

      if (response.ok) {
        log(`Video uploaded successfully! URL: ${result.url}`, 'success');
      } else {
        log(`Video upload failed: ${result.error}`, 'error');
      }
    } catch (error) {
      log(`Error during upload: ${error.message}`, 'error');
      console.error('Error during upload:', error);
    }
  };
  
  // Format time for display
  const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
  };

  return (
    <div className={styles.container}>
      <h1>Video Editor</h1>
      <p className={styles.status}>{status}</p>

      <div className={styles.mainContent}>
        <div className={styles.videoSection}>
          <h2>Video Preview</h2>
          <video ref={videoPreviewRef} width="640" height="480" controls autoPlay muted playsInline />
        </div>

        <div className={styles.controlsSection}>
          <h2>Controls</h2>
          <div className={styles.controlGroup}>
            <h3>Recording</h3>
            <button onClick={startRecording} disabled={isRecording || !ffmpeg}>
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
            <button onClick={handleTrim} disabled={!recordedVideo || !ffmpeg || isProcessing}>
              {isProcessing ? `Processing... ${processingProgress}%` : 'Trim Video'}
            </button>
            {isProcessing && <progress value={processingProgress} max="100" />}
          </div>

          <div className={styles.controlGroup}>
            <h3>Output</h3>
            <video ref={trimmedVideoOutputRef} width="320" height="240" controls playsInline />
            <button onClick={handleUpload} disabled={!trimmedVideo}>
              Upload Trimmed Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
