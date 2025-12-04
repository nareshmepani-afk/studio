
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Video, StopCircle, UploadCloud, RotateCcw, AlertTriangle, Loader2, ShieldAlert, BookOpen } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/useAuth';
import { teleprompterScripts, defaultTeleprompterFallbackScript } from '@/lib/teleprompterScripts';
import { mockPromptGroups } from '@/lib/mockData';
import { MAX_RECORDING_HARD_LIMIT, MAX_UPLOAD_DURATION_SECONDS } from '@/lib/constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { MediaAttachment } from '@/types';
import { useMediaTrimmer } from '@/hooks/use-media-trimmer';

function formatSecondsToTime(timeInSeconds: number | undefined): string {
  if (timeInSeconds === undefined || isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
  const totalSecs = Math.floor(timeInSeconds);
  const minutes = Math.floor(totalSecs / 60);
  const seconds = totalSecs % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface MediaCaptureControlProps {
  onMediaReady: (mediaData: { file: File; type: 'video' | 'audio'; duration: number; size: number }) => void;
  onPreparingChange: (isPreparing: boolean) => void;
  initialMedia?: {
    type: 'video' | 'audio';
    previewUrl: string;
    duration: number;
    size: number;
  };
  promptIdForTeleprompter?: string;
  chapterTitleForTeleprompter?: string;
  trimValues: [number, number];
}

export function MediaCaptureControl({
  onMediaReady,
  onPreparingChange,
  initialMedia,
  promptIdForTeleprompter,
  chapterTitleForTeleprompter,
  trimValues,
}: MediaCaptureControlProps) {
  const { storageQuotaBytes, hostPassStatus } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { trim, isTrimming, isProcessing: isTrimmerProcessing } = useMediaTrimmer();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<globalThis.MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const hardLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentTeleprompterScript, setCurrentTeleprompterScript] = useState<string | null>(null);
  const [currentRecordingDuration, setCurrentRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const canRecordOrUpload = hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';

  useEffect(() => {
    onPreparingChange(isTrimming || isTrimmerProcessing);
  }, [isTrimming, isTrimmerProcessing, onPreparingChange]);

  const cleanupStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setAudioData(null);
  }, []);

  const getPermissions = useCallback(async (type: 'video' | 'audio'): Promise<boolean> => {
    cleanupStream();
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('[MediaRecorder] Error accessing media devices:', error);
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

  useEffect(() => {
    if (initialMedia) {
      setMediaType(initialMedia.type);
      setPreviewUrl(initialMedia.previewUrl);
    } else {
      setMediaType(null);
      setPreviewUrl(null);
    }
  }, [initialMedia]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setCurrentTeleprompterScript(null);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (hardLimitTimeoutRef.current) clearTimeout(hardLimitTimeoutRef.current);
  }, []);
  
  const handleDiscardMedia = useCallback(() => {
    if (isRecording) handleStopRecording();
    revokeCurrentPreviewUrl();
    setPreviewUrl(null);
    setMediaType(null);
    setCurrentTeleprompterScript(null);
    toast({ title: "Media Discarded" });
  }, [isRecording, revokeCurrentPreviewUrl, handleStopRecording]);


  const processAndFinalizeMedia = useCallback(async (blob: Blob, type: 'video' | 'audio', fileName: string) => {
    onPreparingChange(true);

    if (!checkStorageQuota(blob.size)) {
      handleDiscardMedia();
      onPreparingChange(false);
      return;
    }
    
    const file = new File([blob], fileName, { type: blob.type });

    try {
        const duration = await new Promise<number>((resolve, reject) => {
            const mediaElement = document.createElement(type);
            mediaElement.src = URL.createObjectURL(file);
            mediaElement.onloadedmetadata = () => {
                URL.revokeObjectURL(mediaElement.src);
                 if (mediaElement.duration > MAX_UPLOAD_DURATION_SECONDS) {
                     reject(new Error(`Uploaded file is too long. Max duration is ${formatSecondsToTime(MAX_UPLOAD_DURATION_SECONDS)}.`));
                     return;
                }
                resolve(mediaElement.duration);
            };
            mediaElement.onerror = (e) => {
                URL.revokeObjectURL(mediaElement.src);
                console.error('[MediaRecorder] Error loading media metadata', e);
                reject(new Error("Could not read the media file to determine its duration."));
            };
        });

        onMediaReady({ file, type, duration, size: file.size });
    } catch(error: any) {
        toast({ title: "Processing Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
        handleDiscardMedia();
    } finally {
        onPreparingChange(false);
    }
  }, [checkStorageQuota, onMediaReady, handleDiscardMedia, onPreparingChange]);

  const handleStartRecording = async (type: 'video' | 'audio') => {
    if (isRecording || !checkHostPass()) return;

    onPreparingChange(true);
    const permissionGranted = await getPermissions(type);
    if (!permissionGranted || !streamRef.current) { onPreparingChange(false); return; }

    if (type === 'audio') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      sourceRef.current.connect(analyserRef.current);
      
      const draw = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          setAudioData(new Uint8Array(dataArrayRef.current));
        }
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    revokeCurrentPreviewUrl();
    setPreviewUrl(null);
    setMediaType(type);
    recordedChunks.current = [];

    let scriptKey = promptIdForTeleprompter;
    if (!scriptKey && chapterTitleForTeleprompter) {
        for (const group of mockPromptGroups) {
            const foundPrompt = group.prompts.find(p => p.text.en.toLowerCase() === chapterTitleForTeleprompter.toLowerCase() || p.text.gu === chapterTitleForTeleprompter);
            if (foundPrompt) { scriptKey = foundPrompt.id; break; }
        }
    }
    const script = scriptKey ? teleprompterScripts[scriptKey] : null;
    if (script) {
        setCurrentTeleprompterScript(script);
    } else if (type === 'video') {
        setCurrentTeleprompterScript(defaultTeleprompterFallbackScript);
    }

    try {
      const recorder = new window.MediaRecorder(streamRef.current, { mimeType: type === 'video' ? 'video/webm' : 'audio/webm' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunks.current.push(event.data); };
      recorder.onstop = () => {
        cleanupStream();
        const blob = new Blob(recordedChunks.current, { type: recorder.mimeType });
        recordedChunks.current = [];
        if (blob.size < 1024) {
          toast({ title: 'Recording Error', description: 'Recorded data is too small. Please try a longer recording.' });
          handleDiscardMedia();
          return;
        }
        processAndFinalizeMedia(blob, type, `recording.${type === 'video' ? 'webm' : 'webm'}`);
      };
      recorder.start();
      setIsRecording(true);
      onPreparingChange(false);
      setCurrentRecordingDuration(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => { setCurrentRecordingDuration(prev => prev + 1); }, 1000);

      if (hardLimitTimeoutRef.current) clearTimeout(hardLimitTimeoutRef.current);
      hardLimitTimeoutRef.current = setTimeout(() => {
        toast({ title: "Recording Limit Reached", description: `Recording automatically stopped at ${formatSecondsToTime(MAX_RECORDING_HARD_LIMIT)}.`, variant: "default" });
        handleStopRecording();
      }, MAX_RECORDING_HARD_LIMIT * 1000);
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} recording started.`, variant: "success" });
    } catch (err) {
      console.error("[MediaRecorder] Error initializing MediaRecorder:", err);
      cleanupStream(); onPreparingChange(false);
      toast({ variant: 'destructive', title: 'Recording Setup Failed', description: 'Could not start recording. Check device compatibility or permissions.' });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkHostPass()) { event.target.value = ''; return; }
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : null;
    if (!fileType) { toast({ title: "Invalid File Type", description: "Please upload a valid video or audio file." }); return; }

    processAndFinalizeMedia(file, fileType, file.name);
    event.target.value = '';
  };

  useEffect(() => {
    if (isRecording && mediaType === 'video' && liveVideoRef.current && streamRef.current) {
        liveVideoRef.current.srcObject = streamRef.current;
    }
  }, [mediaType, isRecording]);

  useEffect(() => {
    return () => {
      cleanupStream();
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (hardLimitTimeoutRef.current) clearTimeout(hardLimitTimeoutRef.current);
    };
  }, [cleanupStream]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (video && trimValues) {
        const [start, end] = trimValues;
        const handleTimeUpdate = () => {
            if (video.currentTime > end) {
                video.pause();
                video.currentTime = start;
            }
        };
        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [previewUrl, trimValues]);

  const isProcessing = isTrimmerProcessing || isTrimming;
  
  if (isProcessing) {
      return (
        <Card>
            <CardHeader><CardTitle className="font-headline text-lg">Processing Media</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">{isTrimming ? 'Trimming your media...' : 'Preparing your file...'}</p>
            </CardContent>
        </Card>
      )
  }

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
                <Video className="mr-2" /> Record Video
              </Button>
              <Button onClick={() => handleStartRecording('audio')} className="flex-1" disabled={!canRecordOrUpload || isRecording}>
                <Mic className="mr-2" /> Record Audio
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
                <p className="text-xs text-muted-foreground">Video/Audio (max {formatSecondsToTime(MAX_UPLOAD_DURATION_SECONDS)})</p>
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
                    {currentTeleprompterScript && (
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-2">
                        <Accordion type="single" collapsible className="w-full bg-black/70 text-white rounded-md">
                          <AccordionItem value="item-1" className="border-b-0">
                            <AccordionTrigger className="text-sm font-semibold px-4 py-2 hover:no-underline">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Show/Hide Teleprompter
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <ScrollArea className="h-40 w-full p-4">
                                <p className="whitespace-pre-wrap text-base leading-relaxed">{currentTeleprompterScript}</p>
                              </ScrollArea>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                </div>
            )}

            {mediaType === 'audio' && (
                <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-md space-y-4">
                    <div className="flex items-end justify-center h-16 w-full gap-1">
                      {audioData && Array.from(audioData).slice(0, 32).map((value, index) => (
                        <div
                          key={index}
                          className="w-2 bg-primary rounded-full"
                          style={{ height: `${Math.max(2, (value / 255) * 100)}%`, transition: 'height 0.1s ease-in-out' }}
                        />
                      ))}
                      {!audioData && Array.from({length: 32}).map((_, index) => (
                         <div key={index} className="w-2 h-1 bg-primary/50 rounded-full" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Recording audio...</p>
                </div>
            )}

            <Button onClick={handleStopRecording} className="w-full" variant="destructive">
                <StopCircle className="mr-2"/>
                <span>Stop Recording</span>
                <span className="font-mono ml-2 text-sm tabular-nums">({formatSecondsToTime(currentRecordingDuration)} / {formatSecondsToTime(MAX_RECORDING_HARD_LIMIT)})</span>
            </Button>
          </div>
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

    