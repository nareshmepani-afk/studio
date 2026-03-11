'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Mic, Video, Loader2, StopCircle, RefreshCw, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useCamera } from '@/hooks/useCamera';
import { useMobile as useIsMobile } from '@/hooks/use-mobile'; 
import { Slider } from '@/components/ui/slider';

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

export function MediaCaptureControl({ onMediaReady, initialMedia, deferCameraInit = false }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isMobile = useIsMobile();
  
  const [status, setStatus] = useState('idle'); // idle, pre-recording, recording, preview
  const [media, setMedia] = useState<any>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [trimValues, setTrimValues] = useState([0, 0]);

  const [cameraEnabled, setCameraEnabled] = useState(!deferCameraInit);
  const [recordingType, setRecordingType] = useState<'video' | 'audio' | null>(null);

  // Hook for camera logic - now enabled on demand
  const { stream, error: cameraError, switchCamera, hasMultipleCameras } = useCamera({ enabled: cameraEnabled });

  const stopRecordingAndCleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!recordingType) return;

    const testStepId = 'media-capture-ts-start-record';
    console.log(`TESTIMONY - ${testStepId} - START`);
    try {
      if (media?.url && media.source === 'new') {
        URL.revokeObjectURL(media.url);
      }
      stopRecordingAndCleanup();

      setStatus('recording');
      setRecordingTime(0);

      if (!stream) {
        throw new Error("Camera stream is not available. Please grant permissions and try again.");
      }

      const mimeType = recordingType === 'video' ? 'video/webm' : 'audio/webm';
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
        const mediaEl = document.createElement(recordingType === 'video' ? 'video' : 'audio');
        mediaEl.src = url;
        mediaEl.onloadedmetadata = () => {
            const newMediaPayload = {
                file: new File([blob], `recording.${recordingType === 'video' ? 'webm' : 'mp3'}`),
                type: recordingType,
                duration: mediaEl.duration,
                trimValues: [0, mediaEl.duration]
            };
            setMedia({ url, type: recordingType, source: 'new', duration: mediaEl.duration });
            onMediaReady(newMediaPayload);
            setStatus('preview');
            setTrimValues([0, mediaEl.duration]);
        };
        recordedChunksRef.current = [];
      };

      recorder.start();
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), RECORDING_INTERVAL_MS);

    } catch (err: any) {
        console.error("Error starting recording:", err);
        toast.error("Recording Error", { description: err.message });
        setStatus(initialMedia ? 'preview' : 'idle');
    } finally {
        console.log(`TESTIMONY - ${testStepId} - END`);
    }
  }, [media, stopRecordingAndCleanup, stream, onMediaReady, initialMedia, recordingType]);

  const handleInitiateRecording = (type: 'video' | 'audio') => {
    setRecordingType(type);
    setCameraEnabled(true);
    setStatus('pre-recording');
  };

  useEffect(() => {
    if (cameraError) {
      toast.error("Camera Error", { description: cameraError });
      setCameraEnabled(false);
      setStatus('idle');
      setRecordingType(null);
    }
  }, [cameraError]);

  useEffect(() => {
    if (stream && (status === 'pre-recording' || status === 'recording') && recordingType === 'video' && videoRef.current) {
        if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
        }
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
      const initialTrim = [initialMedia.trimStart || 0, initialMedia.trimEnd || newMedia.duration];
      setTrimValues(initialTrim);
      onMediaReady({ file: new File([], "existing"), type: newMedia.type, duration: newMedia.duration, trimValues: initialTrim });
    }
  }, [initialMedia, media, onMediaReady]);

  useEffect(() => {
    return () => {
      stopRecordingAndCleanup();
    };
  }, [stopRecordingAndCleanup]);

  useEffect(() => {
      if (status === 'recording' && recordingTime >= MAX_RECORDING_SECONDS) {
          toast.info("Recording Limit Reached", { description: `Recording stopped automatically after ${formatTime(MAX_RECORDING_SECONDS)}.` });
          stopRecordingAndCleanup();
      }
  }, [recordingTime, status, stopRecordingAndCleanup]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (media?.url && media.source === 'new') URL.revokeObjectURL(media.url);

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error("File too large", { description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.` });
        return;
    }

    const url = URL.createObjectURL(file);
    const mediaEl = document.createElement(file.type.startsWith('video') ? 'video' : 'audio');
    mediaEl.src = url;

    mediaEl.onloadedmetadata = () => {
        const newMediaPayload = {
            file,
            type: file.type.startsWith('video') ? 'video' : 'audio',
            duration: mediaEl.duration,
            trimValues: [0, mediaEl.duration]
        };
        setMedia({ url, type: newMediaPayload.type, source: 'new', duration: mediaEl.duration });
        onMediaReady(newMediaPayload);
        setStatus('preview');
        setTrimValues([0, mediaEl.duration]);
    };
    event.target.value = '';
  };

  const handleTrimChange = (newValues: number[]) => {
    setTrimValues(newValues);
    if (videoRef.current) {
      videoRef.current.currentTime = newValues[0];
    }
    onMediaReady({ ...media, trimValues: newValues });
  };

  const cancelPreRecording = () => {
      setCameraEnabled(false);
      setStatus('idle');
      setRecordingType(null);
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
      const initialTrim = [initialMedia.trimStart || 0, initialMedia.trimEnd || newMedia.duration];
      setTrimValues(initialTrim);
      onMediaReady({ file: new File([], "existing"), type: newMedia.type, duration: newMedia.duration, trimValues: initialTrim });
    } else {
      setMedia(null);
      onMediaReady(null);
      setStatus('idle');
    }
    setCameraEnabled(false); 
    setRecordingType(null);
  }, [media, initialMedia, onMediaReady]);

  const renderCaptureOptions = () => (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted bg-background p-8 text-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">Record a new clip or upload a file (max 6 minutes).</p>
        <div className="flex items-center space-x-4">
            <Button type="button" onClick={() => handleInitiateRecording('video')} variant="outline" size="icon" className="h-16 w-16 rounded-full" disabled={!!cameraError}>
                <Video className="h-8 w-8" />
            </Button>
            <Button type="button" onClick={() => handleInitiateRecording('audio')} variant="outline" size="icon" className="h-16 w-16 rounded-full">
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
  
  const renderPreRecording = () => {
    const content = recordingType === 'video' ? (
        <video ref={videoRef} className={`w-full h-full object-cover ${isMobile ? '' : 'scale-x-[-1]'}`} autoPlay muted playsInline />
    ) : (
        <div className="flex flex-col items-center justify-center h-full text-primary">
            <Mic className="h-12 w-12"/>
            <span className="mt-2 text-lg font-semibold">Prepare to Record Audio</span>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="relative w-full rounded bg-black aspect-video overflow-hidden">
                {content}
                 <div className="absolute top-2 left-2 flex items-center space-x-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                    <Camera className="h-4 w-4" />
                    <span>Camera Preview</span>
                </div>
                {recordingType === 'video' && hasMultipleCameras && (
                   <div className="absolute bottom-2 right-2 z-10">
                       <Button type="button" onClick={switchCamera} variant="outline" size="icon" className="rounded-full bg-black/30 hover:bg-black/50 border-white/30 text-white">
                           <RefreshCw className="h-5 w-5" />
                       </Button>
                   </div>
                )}
            </div>
            <div className="flex space-x-4">
                <Button type="button" onClick={startRecording} className="w-full">
                    Start Recording
                </Button>
                <Button type="button" onClick={cancelPreRecording} variant="outline" className="w-full">
                    Cancel
                </Button>
            </div>
        </div>
    );
  }

  if (status === 'pre-recording') {
      return renderPreRecording();
  }

  if (status === 'recording') {
    const timerDisplay = `${formatTime(recordingTime)} / ${formatTime(MAX_RECORDING_SECONDS)}`;
    const isNearingLimit = MAX_RECORDING_SECONDS - recordingTime <= WARNING_THRESHOLD_SECONDS;
    
    const content = recordingType === 'video' ? (
        <video ref={videoRef} className={`w-full h-full object-cover ${isMobile ? '' : 'scale-x-[-1]'}`} autoPlay muted playsInline />
    ) : (
        <div className="flex flex-col items-center justify-center h-full text-primary">
            <Mic className="h-12 w-12"/>
            <span className="mt-2 text-lg font-semibold">Recording Audio...</span>
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
            onLoadedMetadata={(e) => {
              const videoElement = e.currentTarget;
              if (videoElement) {
                const initialTrim = [0, videoElement.duration];
                setTrimValues(initialTrim);
                onMediaReady({ ...media, trimValues: initialTrim });
              }
            }}
            onTimeUpdate={(e) => {
              const videoElement = e.currentTarget;
              if (videoElement && videoElement.currentTime > trimValues[1]) {
                videoElement.currentTime = trimValues[0];
                videoElement.pause();
              }
            }}
            controls
            className="w-full rounded bg-black aspect-video"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-mono">
            <span>{formatTime(trimValues[0])}</span>
            <span>{formatTime(trimValues[1])}</span>
          </div>
          <Slider
            min={0}
            max={media.duration || 0}
            step={0.1}
            value={trimValues}
            onValueChange={handleTrimChange}
            className="w-full"
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
