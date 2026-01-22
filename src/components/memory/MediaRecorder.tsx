'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Mic, Video, Loader2, StopCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCamera } from '@/hooks/useCamera';
import { useIsMobile } from '@/hooks/use-mobile';

const MAX_FILE_SIZE_MB = 100;
const MAX_RECORDING_SECONDS = 360; // 6 minutes
const RECORDING_INTERVAL_MS = 1000;
const WARNING_THRESHOLD_SECONDS = 30;

// Helper to format time
const formatTime = (seconds: number) => {
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function MediaCaptureControl({ onMediaReady, initialMedia, trimValues }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [status, setStatus] = useState('idle'); // idle, recording, preview
  const [media, setMedia] = useState<any>(null);
  const [recordingType, setRecordingType] = useState<'video' | 'audio'>('video');
  const [recordingTime, setRecordingTime] = useState(0);

  // Hook for camera logic
  const { stream, error: cameraError, switchCamera, hasMultipleCameras } = useCamera();

  const stopRecordingAndCleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    if (cameraError) {
      toast({ title: "Camera Error", description: cameraError, variant: "destructive" });
    }
  }, [cameraError, toast]);

  useEffect(() => {
    if (status === 'recording' && stream && recordingType === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
  }, [stream, status, recordingType]);

  useEffect(() => {
    if (initialMedia?.previewUrl && !media) {
      const newMedia = {
        type: initialMedia.type || 'video',
        url: initialMedia.previewUrl,
        source: 'initial',
        duration: initialMedia.duration || 0
      };
      setMedia(newMedia);
      setStatus('preview');
      onMediaReady({ file: new File([], "existing"), type: newMedia.type, duration: newMedia.duration });
    }
  }, [initialMedia, media, onMediaReady]);

  useEffect(() => {
    return () => {
      stopRecordingAndCleanup();
    };
  }, [stopRecordingAndCleanup]);

  useEffect(() => {
      if (status === 'recording' && recordingTime >= MAX_RECORDING_SECONDS) {
          toast({ title: "Recording Limit Reached", description: `Recording stopped automatically after ${formatTime(MAX_RECORDING_SECONDS)}.` });
          stopRecordingAndCleanup();
      }
  }, [recordingTime, status, stopRecordingAndCleanup, toast]);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!trimValues || (trimValues[0] === 0 && trimValues[1] === media?.duration)) return;
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
    const testStepId = 'media-capture-ts-start-record';
    console.log(`TESTIMONY - ${testStepId} - START`);
    try {
      if (media?.url && media.source === 'new') {
        URL.revokeObjectURL(media.url);
      }
      stopRecordingAndCleanup();

      setRecordingType(type);
      setStatus('recording');
      setRecordingTime(0);

      if (!stream) throw new Error("Camera stream is not available.");

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
            console.log(`State After: Recording finished. Media payload is ready for preview.`);
        };
        recordedChunksRef.current = [];
      };

      recorder.start();
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), RECORDING_INTERVAL_MS);
      console.log(`State After: Media stream acquired. Recorder started.`);

    } catch (err: any) {
        console.error("Error starting recording:", err);
        toast({ title: "Recording Error", description: err.message, variant: "destructive" });
        setStatus(initialMedia ? 'preview' : 'idle');
        console.log(`State After: Error occurred. Status reset to '${initialMedia ? 'preview' : 'idle'}'.`);
    } finally {
        console.log(`TESTIMONY - ${testStepId} - END`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const testStepId = 'media-capture-ts-upload-file';
    console.log(`TESTIMONY - ${testStepId} - START`);
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
        console.log(`State After: File uploaded and media payload is ready for preview.`);
    };
    event.target.value = '';
    console.log(`TESTIMONY - ${testStepId} - END`);
  };

  const resetToInitial = useCallback(() => {
    const testStepId = 'media-capture-ts-discard-media';
    console.log(`TESTIMONY - ${testStepId} - START`);
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
      console.log('State After: Media discarded. Component reset to idle state.');
    }
    console.log(`TESTIMONY - ${testStepId} - END`);
  }, [media, initialMedia, onMediaReady]);

  const renderCaptureOptions = () => (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted bg-background p-8 text-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">Record a new clip or upload a file (max 6 minutes).</p>
        <div className="flex items-center space-x-4">
            <Button type="button" onClick={() => startRecording('video')} variant="outline" size="icon" className="h-16 w-16 rounded-full" disabled={!!cameraError}>
                <Video className="h-8 w-8" />
            </Button>
            <Button type="button" onClick={() => startRecording('audio')} variant="outline" size="icon" className="h-16 w-16 rounded-full">
                <Mic className="h-8 w-8" />
            </Button>
        </div>
         <div className="text-sm text-muted-foreground">or</div>
        <Button asChild type="button">
            <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Upload File
            </label>
        </Button>
        <input id="file-upload" type="file" className="sr-only" onChange={handleFileUpload} accept="video/*,audio/*" />
    </div>
  );

  if (status === 'recording') {
    const timerDisplay = `${formatTime(recordingTime)} / ${formatTime(MAX_RECORDING_SECONDS)}`;
    const isNearingLimit = MAX_RECORDING_SECONDS - recordingTime <= WARNING_THRESHOLD_SECONDS;

    const content = recordingType === 'video' ? (
        <video ref={videoRef} className={`w-full h-full object-cover ${isMobile ? '' : 'scale-x-[-1]'}`} autoPlay muted playsInline />
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
                <div className={`absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded font-mono z-10 transition-colors ${isNearingLimit ? 'text-red-400' : 'text-white'}`}>
                    {timerDisplay}
                </div>
                {recordingType === 'video' && hasMultipleCameras && (
                   <div className="absolute bottom-2 right-2 z-10">
                       <Button type="button" onClick={switchCamera} variant="outline" size="icon" className="rounded-full bg-black/30 hover:bg-black/50 border-white/30 text-white">
                           <RefreshCw className="h-5 w-5" />
                       </Button>
                   </div>
                )}
            </div>
            <Button type="button" onClick={stopRecordingAndCleanup} variant="destructive" className="w-full">
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
          <Button type="button" onClick={resetToInitial} variant="outline" className="w-full">
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
