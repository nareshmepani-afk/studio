'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Mic, Video, Loader2, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE_MB = 100;
const MAX_RECORDING_SECONDS = 330; // 5 minutes and 30 seconds
const RECORDING_INTERVAL_MS = 1000;

// Helper to format time
const formatTime = (seconds: number) => {
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function MediaCaptureControl({ onMediaReady, initialMedia, trimValues }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const [status, setStatus] = useState('idle'); // idle, recording, preview
  const [media, setMedia] = useState<any>(null);
  const [recordingType, setRecordingType] = useState<'video' | 'audio'>('video');
  const [recordingTime, setRecordingTime] = useState(0);

  const stopRecordingAndCleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
    }
    // Don't reset status here, onstop will handle it
  }, []);

  useEffect(() => {
    // Set initial media if it exists
    if (initialMedia?.previewUrl && !media) {
      const newMedia = {
        type: initialMedia.type || 'video',
        url: initialMedia.previewUrl,
        source: 'initial',
        duration: initialMedia.duration || 0
      };
      setMedia(newMedia);
      setStatus('preview');
      onMediaReady({
        file: new File([], "existing"),
        type: newMedia.type,
        duration: newMedia.duration
      });
    }
  }, [initialMedia, media, onMediaReady]);

  // Cleanup effect for streams
  useEffect(() => {
    return () => {
      stopRecordingAndCleanup();
    };
  }, [stopRecordingAndCleanup]);

  // Auto-stop timer effect
  useEffect(() => {
      if (status === 'recording' && recordingTime >= MAX_RECORDING_SECONDS) {
          toast({ title: "Recording Limit Reached", description: `Recording stopped automatically after ${formatTime(MAX_RECORDING_SECONDS)}.` });
          stopRecordingAndCleanup();
      }
  }, [recordingTime, status, stopRecordingAndCleanup, toast]);

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
      if (media?.url && media.source === 'new') {
        URL.revokeObjectURL(media.url);
      }
      stopRecordingAndCleanup();

      setRecordingType(type);
      setStatus('recording');
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      mediaStreamRef.current = stream;

      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
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
            const newMediaPayload = {
                file: new File([blob], `recording.${type === 'video' ? 'webm' : 'mp3'}`),
                type: type,
                duration: mediaEl.duration
            };
            setMedia({ url, type, source: 'new', duration: mediaEl.duration });
            onMediaReady(newMediaPayload);
            setStatus('preview');
        };
        recordedChunksRef.current = [];
        // Stream is stopped in stopRecordingAndCleanup
      };

      recorder.start();
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), RECORDING_INTERVAL_MS);

    } catch (err: any) {
        console.error("Error starting recording:", err);
        toast({ title: "Recording Error", description: err.message, variant: "destructive" });
        setStatus(initialMedia ? 'preview' : 'idle');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (media?.url && media.source === 'new') URL.revokeObjectURL(media.url);

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: "File too large", description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
        return;
    }

    const url = URL.createObjectURL(file);
    const mediaEl = document.createElement(file.type.startsWith('video') ? 'video' : 'audio');
    mediaEl.src = url;

    mediaEl.onloadedmetadata = () => {
        const newMediaPayload = {
            file,
            type: file.type.startsWith('video') ? 'video' : 'audio',
            duration: mediaEl.duration
        };
        setMedia({ url, type: newMediaPayload.type, source: 'new', duration: mediaEl.duration });
        onMediaReady(newMediaPayload);
        setStatus('preview');
    };
    event.target.value = '';
  };

  const resetToInitial = useCallback(() => {
    if (media?.url && media.source === 'new') URL.revokeObjectURL(media.url);
    
    if (initialMedia?.previewUrl) {
      const newMedia = {
        type: initialMedia.type || 'video',
        url: initialMedia.previewUrl,
        source: 'initial',
        duration: initialMedia.duration || 0
      };
      setMedia(newMedia);
      setStatus('preview');
      onMediaReady({ file: new File([], "existing"), type: newMedia.type, duration: newMedia.duration });
    } else {
      setMedia(null);
      onMediaReady(null);
      setStatus('idle');
    }
  }, [media, initialMedia, onMediaReady]);

  const renderCaptureOptions = () => (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted bg-background p-8 text-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">Record a new clip or upload a file.</p>
        <div className="flex items-center space-x-4">
            <Button onClick={() => startRecording('video')} variant="outline" size="icon" className="h-16 w-16 rounded-full">
                <Video className="h-8 w-8" />
            </Button>
            <Button onClick={() => startRecording('audio')} variant="outline" size="icon" className="h-16 w-16 rounded-full">
                <Mic className="h-8 w-8" />
            </Button>
        </div>
         <div className="text-sm text-muted-foreground">or</div>
        <Button asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Upload File
            </label>
        </Button>
        <input id="file-upload" type="file" className="sr-only" onChange={handleFileUpload} accept="video/*,audio/*" />
    </div>
  );

  if (status === 'recording') {
    const timerDisplay = `${formatTime(recordingTime)} / ${formatTime(MAX_RECORDING_SECONDS)}`;
    const content = recordingType === 'video' ? (
        <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
    ) : (
        <div className="flex flex-col items-center justify-center h-full text-primary">
            <Loader2 className="mr-2 h-8 w-8 animate-spin"/>
            <span className="mt-2">Recording Audio...</span>
        </div>
    );
    return (
        <div className="space-y-4">
            <div className="relative w-full rounded bg-black aspect-video overflow-hidden">
                {content}
                <div className="absolute top-2 left-2 flex items-center space-x-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span>REC</span>
                </div>
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded font-mono z-10">
                    {timerDisplay}
                </div>
            </div>
            <Button onClick={stopRecordingAndCleanup} variant="destructive" className="w-full">
                <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
            </Button>
        </div>
    );
  }

  if (status === 'preview' && media?.url) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            src={media.url}
            onPlay={handlePlay}
            onTimeUpdate={handleTimeUpdate}
            controls
            className="w-full rounded bg-black aspect-video"
          />
        </div>
        
        {media.source === 'new' && (
          <Button onClick={resetToInitial} variant="outline" className="w-full">
            {initialMedia ? 'Cancel and Revert to Original' : 'Start Over'}
          </Button>
        )}

        {media.source === 'initial' && (
          <>
            <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                <span className="relative bg-background px-2 text-sm text-muted-foreground uppercase">Or Replace Media</span>
            </div>
            {renderCaptureOptions()}
          </>
        )}
      </div>
    );
  }

  return renderCaptureOptions();
}
