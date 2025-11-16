
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Video, StopCircle, UploadCloud, RotateCcw, CheckCircle, AlertTriangle, Loader2, ShieldAlert, BookOpen, Timer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { teleprompterScripts, defaultTeleprompterFallbackScript } from '@/lib/teleprompterScripts';
import { mockPromptGroups } from '@/lib/mockData';
import type { MediaAttachment } from '@/types';

// Moved from utils.ts to break circular dependency
function formatSecondsToTime(timeInSeconds: number | undefined): string {
  if (timeInSeconds === undefined || isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";

  const totalSecs = Math.floor(timeInSeconds);

  const minutes = Math.floor(totalSecs / 60);
  const seconds = totalSecs % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Maximum duration constants (in seconds)
const MAX_RECORDING_DURATION = 300; // 5 minutes for all recordings

interface MediaCaptureControlProps {
  onMediaReady: (media: {
    file: File;
    type: 'video' | 'audio';
    duration: number;
    size: number;
  }) => void;
  onDiscard: () => void;
  initialMedia?: {
    type: 'video' | 'audio';
    previewUrl: string;
    duration: number;
    size: number;
  };
  promptIdForTeleprompter?: string;
  chapterTitleForTeleprompter?: string;
  trimValues: [number, number]; // New prop for live trimming
}

export function MediaCaptureControl({
  onMediaReady,
  onDiscard,
  initialMedia,
  promptIdForTeleprompter,
  chapterTitleForTeleprompter,
  trimValues
}: MediaCaptureControlProps) {
  const { user, storageQuotaBytes, hostPassStatus } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<globalThis.MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [currentTeleprompterScript, setCurrentTeleprompterScript] = useState<string | null>(null);

  const [currentRecordingDuration, setCurrentRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const canRecordOrUpload =
    hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const getPermissions = useCallback(async (type: 'video' | 'audio'): Promise<boolean> => {
    cleanupStream();
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasPermission(false);
      setTimeout(() =>
        toast({
          variant: 'destructive',
          title: 'Permissions Denied',
          description: `Please enable ${type === 'video' ? 'camera and microphone' : 'microphone'} permissions in your browser settings to use this feature. You may need to refresh the page.`,
          duration: 7000
        }), 0
      );
      return false;
    }
  }, [cleanupStream]);

  const checkStorageQuota = useCallback((fileSize: number): boolean => {
    if (fileSize > storageQuotaBytes) {
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      const chapterQuotaMB = (storageQuotaBytes / (1024 * 1024)).toFixed(0);
      const description = `This file (${fileSizeMB} MB) exceeds the maximum allowed size per memory of ${chapterQuotaMB} MB.`;
      setTimeout(() => toast({ variant: 'destructive', title: 'File Size Exceeds Memory Limit', description: description, duration: 10000, icon: <ShieldAlert className="h-5 w-5" /> }), 0);
      return false;
    }
    return true;
  }, [storageQuotaBytes]);

  const checkHostPass = (): boolean => {
    if (!canRecordOrUpload) {
      let passMessage = "Activate your free Host Pass in Settings to add media.";
      if (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') {
        passMessage = "Your Host Pass has expired. Renew in Settings to add media.";
      } else if (hostPassStatus !== 'no_pass_initiated') {
        passMessage = "An active Host Pass is required to add media. Check Settings.";
      }
      setTimeout(() => toast({ variant: 'destructive', title: 'Host Pass Required', description: passMessage, duration: 7000 }), 0);
      return false;
    }
    return true;
  };
  
  const revokeCurrentPreviewUrl = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  // This effect now correctly handles initialization and subsequent updates from parent
  useEffect(() => {
    if (initialMedia) {
      setMediaType(initialMedia.type);
      setPreviewUrl(initialMedia.previewUrl);
    } else {
      setMediaType(null);
      setPreviewUrl(null);
    }
  }, [initialMedia]);

  // EFFECT FOR SOFT-PREVIEW TRIMMING
  useEffect(() => {
    const mediaElement = videoRef.current || audioPreviewRef.current;
    if (!mediaElement || !trimValues) return;

    const [startTime, endTime] = trimValues;

    const handleTimeUpdate = () => {
      if (mediaElement.currentTime > endTime || mediaElement.currentTime < startTime) {
        mediaElement.pause();
        mediaElement.currentTime = startTime;
      }
    };
    
    const handlePlay = () => {
      if (mediaElement.currentTime < startTime || mediaElement.currentTime >= endTime) {
        mediaElement.currentTime = startTime;
      }
    };

    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('play', handlePlay);

    // Set initial time if not playing
    if (mediaElement.paused && mediaElement.currentTime < startTime) {
        mediaElement.currentTime = startTime;
    }
    
    return () => {
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('play', handlePlay);
    };

  }, [trimValues]);


  const handleStartRecording = async (type: 'video' | 'audio') => {
    if (isRecording || !checkHostPass()) return;
    
    const permissionGranted = await getPermissions(type);
    if (!permissionGranted || !streamRef.current) return;
    
    revokeCurrentPreviewUrl();
    setPreviewUrl(null); 
    onDiscard(); // Inform parent that any existing media is now gone
    setMediaType(type); 
    recordedChunks.current = [];

    // Teleprompter Logic
    let scriptKey = promptIdForTeleprompter;
    if (!scriptKey && chapterTitleForTeleprompter) {
        for (const group of mockPromptGroups) {
            const foundPrompt = group.prompts.find(p => p.text.en.toLowerCase() === chapterTitleForTeleprompter.toLowerCase() || p.text.gu === chapterTitleForTeleprompter);
            if (foundPrompt) { scriptKey = foundPrompt.id; break; }
        }
    }
    const script = scriptKey ? teleprompterScripts[scriptKey] : null;
    if (script) { setCurrentTeleprompterScript(script); setShowTeleprompter(true); }
    else if (type === 'video') { setCurrentTeleprompterScript(defaultTeleprompterFallbackScript); setShowTeleprompter(true); }


    try {
      const recorder = new window.MediaRecorder(streamRef.current);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunks.current.push(event.data); };
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: recorder.mimeType });
        recordedChunks.current = [];

        if (blob.size < 1024) {
          setTimeout(() => toast({ variant: 'destructive', title: 'Recording Error', description: 'Recorded data is too small. Please try a longer recording.', duration: 7000 }), 0);
          handleDiscardMedia();
          return;
        }

        if (!checkStorageQuota(blob.size)) {
            handleDiscardMedia();
            return;
        }
        
        const file = new File([blob], `recording.${blob.type.split('/')[1]?.split(';')[0] || 'bin'}`, { type: blob.type });
        
        // Get duration
        const mediaElement = document.createElement(type);
        const objectUrlForDurationCheck = URL.createObjectURL(blob);
        mediaElement.src = objectUrlForDurationCheck;

        mediaElement.onloadedmetadata = () => {
             URL.revokeObjectURL(objectUrlForDurationCheck);
             if (mediaElement.duration > MAX_RECORDING_DURATION) {
                toast({ variant: 'destructive', title: 'Recording Too Long', description: `Recording is ${formatSecondsToTime(mediaElement.duration)}. Max allowed is ${formatSecondsToTime(MAX_RECORDING_DURATION)}. Please re-record.`, duration: 10000 });
                handleDiscardMedia();
                return;
            }
            onMediaReady({ file, type: type, duration: mediaElement.duration, size: file.size });
            toast({ title: "Recording Complete!", description: `Duration: ${formatSecondsToTime(mediaElement.duration)}. You can now save your memory.`, variant: "success" });
        };
      };

      recorder.start();
      setIsRecording(true);
      setCurrentRecordingDuration(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => {
        setCurrentRecordingDuration(prev => prev + 1);
      }, 1000);
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} recording started.`, variant: "success" });
    } catch (err) {
      console.error("Error initializing MediaRecorder:", err);
      cleanupStream();
      toast({ variant: 'destructive', title: 'Recording Setup Failed', description: 'Could not start recording. Check device compatibility or permissions.' });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      cleanupStream();
    }
  };
  
  const handleDiscardMedia = useCallback(() => {
    if (isRecording) {
        // Stop recording if it's active
        handleStopRecording();
    }
    revokeCurrentPreviewUrl();
    setPreviewUrl(null);
    setMediaType(null);
    onDiscard();
    toast({ title: "Media Discarded" });
  }, [isRecording, revokeCurrentPreviewUrl, onDiscard, handleStopRecording]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkHostPass()) { event.target.value = ''; return; }
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : null;
    if (!fileType) {
        toast({ title: "Invalid File Type", description: "Please upload a valid video or audio file.", variant: "destructive" });
        return;
    }
    if (!checkStorageQuota(file.size)) {
        event.target.value = '';
        return;
    }
    
    revokeCurrentPreviewUrl();
    
    const mediaElement = document.createElement(fileType);
    const newPreviewUrl = URL.createObjectURL(file);
    mediaElement.src = newPreviewUrl;
    mediaElement.onloadedmetadata = () => {
        // We don't revoke the URL here because we need it for the preview.
        // It will be revoked by the parent component's cleanup logic.
        if (mediaElement.duration > MAX_RECORDING_DURATION) {
            toast({ variant: 'destructive', title: 'File Too Long', description: `Uploaded file is ${formatSecondsToTime(mediaElement.duration)}. Max allowed is ${formatSecondsToTime(MAX_RECORDING_DURATION)}.`, duration: 10000 });
            URL.revokeObjectURL(newPreviewUrl); // Revoke if invalid
            return;
        }
        onMediaReady({ file, type: fileType, duration: mediaElement.duration, size: file.size });
        toast({ title: "File Ready!", description: `${file.name} is ready to be saved with your memory.`, variant: "success" });
    };
    event.target.value = ''; // Allow re-uploading the same file
  };
  
  useEffect(() => {
    if (streamRef.current && mediaType === 'video' && liveVideoRef.current) {
        liveVideoRef.current.srcObject = streamRef.current;
    }
  }, [mediaType, isRecording]);
  
  // Cleanup stream on component unmount
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  return (
    <Card>
      <CardHeader><CardTitle className="font-headline text-lg">Record or Upload Media</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {hasPermission === false && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Permissions Required</AlertTitle><AlertDescription>Camera/mic permissions were denied. Please enable them in your browser settings and refresh the page.</AlertDescription></Alert>)}
        {!canRecordOrUpload && (<Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>Host Pass Required</AlertTitle><AlertDescription>An active Host Pass is needed to record or upload new media. Please check your pass status in Settings.</AlertDescription></Alert>)}

        {!previewUrl && !isRecording && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => handleStartRecording('video')} className="flex-1" disabled={!canRecordOrUpload || isRecording}>
                <Video className="mr-2" /> Start Video
              </Button>
              <Button onClick={() => handleStartRecording('audio')} className="flex-1" disabled={!canRecordOrUpload || isRecording}>
                <Mic className="mr-2" /> Start Audio
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
            </div>
            <Label htmlFor="media-upload" className={cn("flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-secondary", !canRecordOrUpload && "cursor-not-allowed opacity-50")}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                <p className="text-xs text-muted-foreground">Video/Audio (max {formatSecondsToTime(MAX_RECORDING_DURATION)})</p>
              </div>
              <Input id="media-upload" type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*" disabled={!canRecordOrUpload} />
            </Label>
          </div>
        )}
        
        {isRecording && (
          <div className="space-y-4">
            {(mediaType === 'video') && (
                <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                    <video ref={liveVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
                </div>
            )}
    
            {mediaType === 'audio' && (
                <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-md space-y-4">
                     <Mic className="w-12 h-12 text-primary animate-pulse" />
                     <p className="text-sm text-muted-foreground">Recording audio...</p>
                </div>
            )}
            
            <Button onClick={handleStopRecording} className="w-full" variant="destructive">
                <StopCircle className="mr-2"/> 
                <span>Stop Recording</span>
                <span className="font-mono ml-2 text-sm tabular-nums">({formatSecondsToTime(currentRecordingDuration)})</span>
            </Button>
          </div>
        )}
        
        {showTeleprompter && isRecording && (
          <Dialog open={showTeleprompter} onOpenChange={setShowTeleprompter}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="font-headline text-lg flex items-center"><BookOpen className="mr-2 h-5 w-5"/>Teleprompter</DialogTitle><DialogDescription>Use these talking points to guide your recording.</DialogDescription></DialogHeader>
              <ScrollArea className="h-72 w-full rounded-md border p-4">
                 <p className="whitespace-pre-wrap">{currentTeleprompterScript}</p>
              </ScrollArea>
              <DialogFooter><Button variant="outline" onClick={() => setShowTeleprompter(false)}>Close Prompter</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {previewUrl && !isRecording && (
          <div className="space-y-4">
            {mediaType === 'video' && (
                <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
                    <video ref={videoRef} src={previewUrl} controls className="w-full h-full object-contain" />
                </div>
            )}
            {mediaType === 'audio' && (
              <div className="p-4 bg-muted rounded-md">
                <audio ref={audioPreviewRef} src={previewUrl} controls className="w-full" />
              </div>
            )}
            <Button onClick={handleDiscardMedia} className="w-full" variant="outline"><RotateCcw className="mr-2"/> Discard & Restart</Button>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}
