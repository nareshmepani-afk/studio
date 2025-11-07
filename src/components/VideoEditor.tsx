'use client';

import { useEffect, useRef } from 'react';
import styles from './VideoEditor.module.css';

export default function VideoEditor() {
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    const videoPlayer = videoPlayerRef.current;

    if (!dropZone || !videoPlayer) return;

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (dropZone) {
        dropZone.style.backgroundColor = '#eee';
      }
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      if (dropZone) {
        dropZone.style.backgroundColor = 'transparent';
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      if (dropZone) {
        dropZone.style.backgroundColor = 'transparent';
      }
      if (event.dataTransfer && event.dataTransfer.files[0]) {
        const file = event.dataTransfer.files[0];
        if (file.type.startsWith('video/')) {
          const videoURL = URL.createObjectURL(file);
          if (videoPlayer) {
            videoPlayer.src = videoURL;
          }
        } else {
          alert('Please drop a valid video file.');
        }
      }
    };

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleTrim = () => {
    const startTime = parseFloat(startTimeInputRef.current?.value || '0');
    const endTime = parseFloat(endTimeInputRef.current?.value || '0');
    const videoPlayer = videoPlayerRef.current;

    if (!videoPlayer || isNaN(startTime) || isNaN(endTime) || startTime < 0 || endTime <= startTime) {
      alert('Invalid start or end time.');
      return;
    }

    videoPlayer.currentTime = startTime;
    videoPlayer.play();

    setTimeout(() => {
      videoPlayer.pause();
    }, (endTime - startTime) * 1000);
  };

  return (
    <div>
      <h1>Simple Video Editor</h1>
      <div ref={dropZoneRef} className={styles.dropZone}>
        <p>Drag and drop your video here</p>
      </div>
      <video ref={videoPlayerRef} className={styles.videoPlayer} controls />
      <div>
        <label htmlFor="start-time">Start Time:</label>
        <input type="number" id="start-time" ref={startTimeInputRef} defaultValue="0" />
        <label htmlFor="end-time">End Time:</label>
        <input type="number" id="end-time" ref={endTimeInputRef} defaultValue="10" />
        <button onClick={handleTrim}>Trim Video</button>
      </div>
    </div>
  );
}
