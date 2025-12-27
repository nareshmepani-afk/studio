'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Mic, Video, XCircle, CheckCircle, Loader2, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE_MB = 100;
const MAX_RECORDING_SECONDS = 330; // 5 minutes and 30 seconds
const RECORDING_INTERVAL_MS = 1000;

// Helper to format time
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function MediaCaptureControl({ onMediaReady, initialMedia, trimValues }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const [status, setStatus] = useState('idle'); // idle, recording, preview, error
  const [media, setMedia] = useState<any>(null);
  const [recordingType, setRecordingType] = useState<'video' | 'audio'>('video');
  const [recordingTime, setRecordingTime] = useState(0);

  // Effect to handle initial media passed as a prop
  useEffect(() => {
    if (initialMedia?.previewUrl) {
      setMedia({
        type: initialMedia.type || 'video',
        url: initialMedia.previewUrl,
        source: 'initial',
        duration: initialMedia.duration || 0
      });
      setStatus('preview');
    }
  }, [initialMedia]);

  // Effect for component cleanup
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleMetadata = useCallback(() => {
    const videoEl = videoRef.current;
    if (videoEl && media?.source === 'initial' && videoEl.duration !== Infinity && onMediaReady) {
      onMediaReady({
        file: new File([], "existing"),
        type: media.type,
        duration: videoEl.duration
      });
    }
  }, [media, onMediaReady]);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !trimValues || (trimValues[0] === 0 && trimValues[1] === media?.duration)) return;
    if (video.currentTime < trimValues[0] || video.currentTime >= trimValues[1]) {
      video.currentTime = trimValues[0];
    }
  }, [trimValues, media]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !trimValues || (trimValues[0] === 0 && trimValues[1] === media?.duration)) return;
    if (video.currentTime >= trimValues[1]) {
      video.pause();
    }
  }, [trimValues, media]);


  const startRecording = async (type: 'audio' | 'video') => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      setRecordingType(type);
      setStatus('recording');
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      mediaStreamRef.current = stream;

      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(console.error);
      }

      const mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) throw new Error(`${mimeType} is not supported`);

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const mediaEl = document.createElement(type === 'video' ? 'video' : 'audio');
        mediaEl.src = url;
        mediaEl.onloadedmetadata = () => {
            const newMedia = {
                file: new File([blob], `recording.${type === 'video' ? 'webm' : 'mp3'}`),
                type: type,
                duration: mediaEl.duration
            };
            setMedia({ url, type, source: 'new', duration: mediaEl.duration });
            onMediaReady(newMedia);
            setStatus('preview');
        };
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      };

      recorder.start();
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          if (newTime >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
          return newTime;
        });
      }, RECORDING_INTERVAL_MS);

    } catch (err: any) {
        console.error("Error starting recording:", err);
        toast({ title: "Recording Error", description: err.message, variant: "destructive" });
        setStatus('error');
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('idle');
       if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: "File too large", description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
        return;
    }

    const url = URL.createObjectURL(file);
    const mediaEl = document.createElement(file.type.startsWith('video') ? 'video' : 'audio');
    mediaEl.src = url;

    mediaEl.onloadedmetadata = () => {
        const newMedia = {
            file,
            type: file.type.startsWith('video') ? 'video' : 'audio',
            duration: mediaEl.duration
        };
        setMedia({ url, type: newMedia.type, source: 'new', duration: mediaEl.duration });
        onMediaReady(newMedia);
        setStatus('preview');
    };
    event.target.value = '';
  };

  const clearMedia = () => {
    if (media?.url && media.source === 'new') URL.revokeObjectURL(media.url);
    setMedia(null);
    onMediaReady(null);
    setStatus('idle');
  };

  if (status === 'preview' && media?.url) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            src={media.url}
            onLoadedMetadata={handleMetadata}
            onPlay={handlePlay}
            onTimeUpdate={handleTimeUpdate}
            controls
            className="w-full rounded bg-black aspect-video"
          />
        </div>
        <Button onClick={clearMedia} variant="outline" className="w-full">
          Replace Media
        </Button>
      </div>
    );
  }

  if (status === 'recording') {
    const timerDisplay = `${formatTime(recordingTime)} / ${formatTime(MAX_RECORDING_SECONDS)}`;
    if (recordingType === 'video') {
        return (
            <div className="space-y-4">
                <div className="relative w-full rounded bg-black aspect-video overflow-hidden">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover scale-x-[-1]"
                        autoPlay
                        muted
                        playsInline
                    />
                     <div className="absolute top-2 left-2 flex items-center space-x-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span>REC</span>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded font-mono">
                        {timerDisplay}
                    </div>
                </div>
                <Button onClick={stopRecording} variant="destructive" className="w-full">
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Recording
                </Button>
            </div>
        );
    } else { // audio
         return (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-primary bg-background p-8 text-center h-48">
                <div className="flex items-center text-primary mb-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    <span>Recording Audio...</span>
                </div>
                <div className="text-primary font-mono text-lg">
                    {timerDisplay}
                </div>
                <Button onClick={stopRecording} variant="destructive" size="icon" className="rounded-full mt-2">
                    <StopCircle className="h-6 w-6" />
                </Button>
            </div>
        )
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted bg-background p-8 text-center h-48">
        <div className="flex items-center space-x-4">
            <Button onClick={() => startRecording('video')} variant="outline" size="icon" className="h-16 w-16 rounded-full">
                <Video className="h-8 w-8" />
            </Button>
            <Button onClick={() => startRecording('audio')} variant="outline" size="icon" className="h-16 w-16 rounded-full">
                <Mic className="h-8 w-8" />
            </Button>
        </div>
         <div className="text-sm text-muted-foreground">or</div>
        <div className="relative">
            <Button asChild>
                <label htmlFor="file-upload">
                    <Upload className="mr-2 h-4 w-4" /> Upload File
                </label>
            </Button>
            <input id="file-upload" type="file" className="sr-only" onChange={handleFileUpload} accept="video/*,audio/*" />
        </div>
    </div>
  );
}
