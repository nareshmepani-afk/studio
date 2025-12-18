"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Video, StopCircle, UploadCloud, RotateCcw, AlertTriangle, Loader2, BookOpen } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/useAuth';
import { teleprompterScripts, defaultTeleprompterFallbackScript } from '@/lib/teleprompterScripts';
import { MAX_RECORDING_HARD_LIMIT, MAX_UPLOAD_DURATION_SECONDS } from '@/lib/constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  trimValues,
}: MediaCaptureControlProps) {
  const { storageQuotaBytes, hostPassStatus } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { isTrimming, isProcessing: isTrimmerProcessing } = useMediaTrimmer();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<globalThis.MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hardLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentTeleprompterScript, setCurrentTeleprompterScript] = useState<string | null>(null);
  const [currentRecordingDuration, setCurrentRecordingDuration] = useState(0);

  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const canRecordOrUpload = hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';

  // --- INITIALIZATION ---
  useEffect(() => {
    if (initialMedia) {
      setMediaType(initialMedia.type);
      setPreviewUrl(initialMedia.previewUrl);
    }
  }, [initialMedia]);

  useEffect(() => {
    onPreparingChange(isTrimming || isTrimmerProcessing);
  }, [isTrimming, isTrimmerProcessing, onPreparingChange]);

  // --- REPAIR HANDSHAKE ---
  /**
   * Fires when video/audio metadata is loaded.
   * If the parent state has duration 0, we push the real duration back up.
   */
  const handleMetadataLoaded = useCallback(() => {
    const media = videoRef.current || audioPreviewRef.current;
    if (!media) return;

    const actualDuration = media.duration;
    
    // If the element finds a real duration but the UI is locked at 0
    if (actualDuration > 0 && (initialMedia?.duration === 0 || trimValues[1] === 0)) {
      console.log("🛠️ [REPAIR] Found real duration from metadata:", actualDuration);
      onMediaReady({
        file: new File([], "existing_media", { type: mediaType === 'video' ? 'video/mp4' : 'audio/mpeg' }),
        type: mediaType as 'video' | 'audio',
        duration: actualDuration,
        size: initialMedia?.size || 0
      });
    }
  }, [mediaType, initialMedia, trimValues, onMediaReady]);

  // --- CLEANUP ---
  const cleanupStream = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setAudioData(null);
  }, []);

  // --- CORE LOGIC ---
  const getPermissions = useCallback(async (type: 'video' | 'audio'): Promise<boolean> => {
    cleanupStream();
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setHasPermission(true);
      return true;
    } catch (error) {
      setHasPermission(false);
      toast({
        variant: 'destructive',
        title: 'Permissions Denied',
        description: `Please enable camera/microphone in browser settings.`,
      });
      return false;
    }
  }, [cleanupStream]);

  const processAndFinalizeMedia = useCallback(async (blob: Blob, type: 'video' | 'audio', fileName: string) => {
    onPreparingChange(true);
    const file = new File([blob], fileName, { type: blob.type });

    try {
      const duration = await new Promise<number>((resolve, reject) => {
        const mediaElement = document.createElement(type);
        mediaElement.src = URL.createObjectURL(file);
        mediaElement.onloadedmetadata = () => {
          URL.revokeObjectURL(mediaElement.src);
          if (mediaElement.duration > MAX_UPLOAD_DURATION_SECONDS) {
            reject(new Error(`Max limit: ${formatSecondsToTime(MAX_UPLOAD_DURATION_SECONDS)}.`));
          } else {
            resolve(mediaElement.duration);
          }
        };
        mediaElement.onerror = () => reject(new Error("Metadata error."));
      });

      onMediaReady({ file, type, duration, size: file.size });
    } catch (error: any) {
      toast({ title: "Processing Failed", description: error.message, variant: "destructive" });
    } finally {
      onPreparingChange(false);
    }
  }, [onMediaReady, onPreparingChange]);

  const handleStartRecording = async (type: 'video' | 'audio') => {
    if (isRecording || !canRecordOrUpload) return;
    onPreparingChange(true);
    const permissionGranted = await getPermissions(type);
    if (!permissionGranted || !streamRef.current) { onPreparingChange(false); return; }

    if (type === 'audio') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      sourceRef.current.connect(analyserRef.current);
      const draw = () => {
        if (analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          setAudioData(new Uint8Array(data));
        }
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    setPreviewUrl(null);
    setMediaType(type);
    recordedChunks.current = [];
    const script = teleprompterScripts[promptIdForTeleprompter || ''] || (type === 'video' ? defaultTeleprompterFallbackScript : null);
    if (script) setCurrentTeleprompterScript(script);

    try {
      const recorder = new window.MediaRecorder(streamRef.current, { mimeType: type === 'video' ? 'video/webm' : 'audio/webm' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
      recorder.onstop = () => {
        cleanupStream();
        const blob = new Blob(recordedChunks.current, { type: recorder.mimeType });
        processAndFinalizeMedia(blob, type, `recording.${type === 'video' ? 'webm' : 'webm'}`);
      };
      recorder.start();
      setIsRecording(true);
      setCurrentRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => setCurrentRecordingDuration(prev => prev + 1), 1000);
      hardLimitTimeoutRef.current = setTimeout(() => mediaRecorderRef.current?.stop(), MAX_RECORDING_HARD_LIMIT * 1000);
    } catch (err) {
      cleanupStream();
      toast({ variant: 'destructive', title: 'Recording Failed' });
    } finally {
      onPreparingChange(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (hardLimitTimeoutRef.current) clearTimeout(hardLimitTimeoutRef.current);
  };

  const handleDiscardMedia = () => {
    if (isRecording) handleStopRecording();
    setPreviewUrl(null);
    setMediaType(null);
    toast({ title: "Media Discarded" });
  };

  // --- TRIM PLAYBACK CONTROL ---
  useEffect(() => {
    const media = videoRef.current || audioPreviewRef.current;
    if (!media || !previewUrl) return;

    const [start, end] = trimValues;
    if (start === 0 && end === 0) return; // Wait for repair

    const handleTimeUpdate = () => {
      if (media.currentTime >= end) {
        media.pause();
        media.currentTime = start;
      }
      if (media.currentTime < start) media.currentTime = start;
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    return () => media.removeEventListener('timeupdate', handleTimeUpdate);
  }, [previewUrl, trimValues]);

  useEffect(() => {
    if (isRecording && mediaType === 'video' && liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
    }
  }, [mediaType, isRecording]);

  if (isTrimmerProcessing || isTrimming) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Preparing media...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="font-headline text-lg">Record or Upload Media</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {!previewUrl && !isRecording && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => handleStartRecording('video')} className="flex-1"><Video className="mr-2" /> Record Video</Button>
              <Button onClick={() => handleStartRecording('audio')} className="flex-1"><Mic className="mr-2" /> Record Audio</Button>
            </div>
            <Label htmlFor="media-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-secondary">
              <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
              <span className="text-sm font-semibold">Click to upload</span>
              <Input id="media-upload" type="file" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processAndFinalizeMedia(file, file.type.startsWith('video/') ? 'video' : 'audio', file.name);
              }} accept="video/*,audio/*" />
            </Label>
          </div>
        )}

        {isRecording && (
          <div className="space-y-4">
            {mediaType === 'video' && (
              <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                <video ref={liveVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
                {currentTeleprompterScript && (
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-2">
                    <Accordion type="single" collapsible className="w-full bg-black/70 text-white rounded-md">
                      <AccordionItem value="item-1" className="border-b-0">
                        <AccordionTrigger className="px-4 py-2 hover:no-underline text-sm"><BookOpen className="h-4 w-4 mr-2" /> Teleprompter</AccordionTrigger>
                        <AccordionContent className="p-4 h-40 overflow-y-auto whitespace-pre-wrap">{currentTeleprompterScript}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </div>
            )}
            <Button onClick={handleStopRecording} className="w-full" variant="destructive">
              <StopCircle className="mr-2"/> Stop ({formatSecondsToTime(currentRecordingDuration)})
            </Button>
          </div>
        )}

        {previewUrl && !isRecording && (
          <div className="space-y-4">
            {mediaType === 'video' ? (
              <video 
                ref={videoRef} 
                src={previewUrl} 
                controls 
                onLoadedMetadata={handleMetadataLoaded}
                className="w-full aspect-video bg-black rounded-md" 
              />
            ) : (
              <audio 
                ref={audioPreviewRef} 
                src={previewUrl} 
                controls 
                onLoadedMetadata={handleMetadataLoaded}
                className="w-full" 
              />
            )}
            <Button onClick={handleDiscardMedia} className="w-full" variant="outline"><RotateCcw className="mr-2"/> Discard & Restart</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}