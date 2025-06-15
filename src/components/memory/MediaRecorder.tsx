
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Video, StopCircle, UploadCloud, RotateCcw, CheckCircle, AlertTriangle, Film, Waves, Loader2, ShieldAlert, BookOpen } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatSecondsToTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { teleprompterScripts, defaultTeleprompterFallbackScript } from '@/lib/teleprompterScripts';
import { mockPromptGroups } from '@/lib/mockData';


interface MediaCaptureControlProps {
  onMediaReady: (mediaData: { file: File; type: 'video' | 'audio'; startTime?: number; endTime?: number, duration: number, size: number }) => void;
  onDiscard: () => void;
  initialMedia?: { type: 'video' | 'audio'; previewUrl: string; startTime?: number; endTime?: number, duration: number, size: number };
  promptIdForTeleprompter?: string;
  chapterTitleForTeleprompter?: string;
}

const SAMPLE_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_AUDIO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

const MAX_VIDEO_DURATION_SECONDS = 120;
const MAX_AUDIO_DURATION_SECONDS = 300;


export function MediaCaptureControl({ onMediaReady, onDiscard, initialMedia, promptIdForTeleprompter, chapterTitleForTeleprompter }: MediaCaptureControlProps) {
  const { user, storageQuotaBytes, hostPassStatus } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<globalThis.MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null); 
  const audioPreviewRef = useRef<HTMLAudioElement>(null); 
  const liveVideoRef = useRef<HTMLVideoElement>(null); 
  const recordedChunks = useRef<Blob[]>([]);

  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [mediaDuration, setMediaDuration] = useState<number>(0);
  const [mediaSize, setMediaSize] = useState<number>(0);

  const latestTrimValuesRef = useRef({ startTime: 0, endTime: 0 });
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleLoadingType, setSampleLoadingType] = useState<'video' | 'audio' | null>(null);

  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [currentTeleprompterScript, setCurrentTeleprompterScript] = useState<string | null>(null);

  const canRecordOrUpload = hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';

  useEffect(() => { latestTrimValuesRef.current = { startTime, endTime }; }, [startTime, endTime]);

  const getPermissions = useCallback(async (type: 'video' | 'audio') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setStream(mediaStream); setHasCameraPermission(true);
      if (type === 'video' && liveVideoRef.current) liveVideoRef.current.srcObject = mediaStream;
      return mediaStream;
    } catch (error) {
      console.error('Error accessing media devices:', error); setHasCameraPermission(false);
      setTimeout(() => toast({ variant: 'destructive', title: 'Permissions Denied', description: `Enable ${type === 'video' ? 'camera & mic' : 'mic'} permissions.` }), 0);
      return null;
    }
  }, []);

  const cleanupStream = useCallback((streamToClean: MediaStream | null) => {
    if (streamToClean) streamToClean.getTracks().forEach(track => track.stop());
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
  }, []);

  const checkStorageQuota = useCallback((fileSize: number): boolean => {
    if (fileSize > storageQuotaBytes) { // storageQuotaBytes is the PER_CHAPTER_QUOTA
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      const chapterQuotaMB = (storageQuotaBytes / (1024 * 1024)).toFixed(0); // Use 0 for integer display

      const description = `This file (${fileSizeMB} MB) exceeds the maximum allowed size per memory of ${chapterQuotaMB} MB.`;
      
      setTimeout(() => toast({ 
        variant: 'destructive', 
        title: 'File Size Exceeds Memory Limit', 
        description: description, 
        duration: 10000, 
        icon: <ShieldAlert className="h-5 w-5" /> 
      }), 0);
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

  const revokeCurrentInternalPreviewUrl = useCallback(() => {
    if (internalPreviewUrl && internalPreviewUrl.startsWith('blob:') && internalPreviewUrl !== initialMedia?.previewUrl) {
      URL.revokeObjectURL(internalPreviewUrl);
    }
  }, [internalPreviewUrl, initialMedia?.previewUrl]);


  const handleStartRecording = async (type: 'video' | 'audio') => {
    if (isRecording || !checkHostPass()) return;
    
    revokeCurrentInternalPreviewUrl();
    setRecordedFile(null); setInternalPreviewUrl(null); setMediaType(type); setStartTime(0); setEndTime(0); setMediaDuration(0); setMediaSize(0);
    latestTrimValuesRef.current = { startTime: 0, endTime: 0 }; recordedChunks.current = [];
    
    cleanupStream(stream); setStream(null); 
    const currentStream = await getPermissions(type);
    if (!currentStream) { setIsRecording(false); return; }
    if (!currentStream.active) { cleanupStream(currentStream); setStream(null); setIsRecording(false); return; }

    let scriptKey = promptIdForTeleprompter;
    if (!scriptKey && chapterTitleForTeleprompter) {
        for (const group of mockPromptGroups) {
            const foundPrompt = group.prompts.find(p => p.text.en.toLowerCase() === chapterTitleForTeleprompter.toLowerCase() || p.text.gu === chapterTitleForTeleprompter);
            if (foundPrompt) { scriptKey = foundPrompt.id; break; }
        }
    }
    const script = scriptKey ? teleprompterScripts[scriptKey] : null;
    if (script) { setCurrentTeleprompterScript(script); setShowTeleprompter(true); }
    else { setCurrentTeleprompterScript(defaultTeleprompterFallbackScript); setShowTeleprompter(true); }

    try {
      const recorder = new window.MediaRecorder(currentStream); mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunks.current.push(event.data); };
      recorder.onstop = () => {
        const mime = type === 'video' ? 'video/webm' : 'audio/webm';
        const blob = new Blob(recordedChunks.current, { type: mime });
        const file = new File([blob], `recording.${type === 'video' ? 'webm' : 'ogg'}`, { type: mime });
        
        if (!checkStorageQuota(file.size)) { 
          cleanupStream(currentStream); setStream(null); setIsRecording(false); recordedChunks.current = []; return; 
        }

        const url = URL.createObjectURL(blob); 
        const tempMediaElement = document.createElement(type); tempMediaElement.src = url;
        tempMediaElement.onloadedmetadata = () => {
          const newDuration = tempMediaElement.duration;
          let durationLimitExceeded = false; let limitMinutes = 0;
          if (type === 'video' && newDuration > MAX_VIDEO_DURATION_SECONDS) { durationLimitExceeded = true; limitMinutes = MAX_VIDEO_DURATION_SECONDS / 60; }
          else if (type === 'audio' && newDuration > MAX_AUDIO_DURATION_SECONDS) { durationLimitExceeded = true; limitMinutes = MAX_AUDIO_DURATION_SECONDS / 60; }
          if (durationLimitExceeded) {
            setTimeout(() => toast({ variant: 'destructive', title: `${type.charAt(0).toUpperCase() + type.slice(1)} Too Long`, description: `Recording is ${formatSecondsToTime(newDuration)}. Max is ${limitMinutes} min(s).`, duration: 7000 }), 0);
            URL.revokeObjectURL(url); cleanupStream(currentStream); setStream(null); setIsRecording(false); recordedChunks.current = []; return;
          }
          setRecordedFile(file); setInternalPreviewUrl(url); setMediaDuration(newDuration); setMediaSize(file.size);
          setStartTime(0); setEndTime(newDuration); latestTrimValuesRef.current = { startTime: 0, endTime: newDuration };
        };
        setIsRecording(false); cleanupStream(currentStream); setStream(null);
      };
      recorder.onerror = (event) => { console.error('MediaRecorder error:', event); setIsRecording(false); cleanupStream(currentStream); setStream(null); setShowTeleprompter(false); setCurrentTeleprompterScript(null); };
      recorder.start(); setIsRecording(true); setTimeout(() => toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} recording started.` }),0);
    } catch (err) { setIsRecording(false); cleanupStream(currentStream); setStream(null); setShowTeleprompter(false); setCurrentTeleprompterScript(null); }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
    else { setIsRecording(false); cleanupStream(stream); setStream(null); }
  };

  const handleVideoLoadedMetadata = (event: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement, Event>) => {
    const currentTarget = event.currentTarget;
     if (internalPreviewUrl && !mediaDuration && initialMedia?.previewUrl !== internalPreviewUrl) { 
        const duration = currentTarget.duration;
        if (duration && isFinite(duration)) { setMediaDuration(duration); if (!initialMedia || initialMedia.endTime === undefined || initialMedia.endTime === 0 || initialMedia.previewUrl !== internalPreviewUrl) { setEndTime(duration); latestTrimValuesRef.current = { startTime: startTime || 0, endTime: duration };} currentTarget.currentTime = startTime || 0;}
     } else if (internalPreviewUrl && initialMedia?.previewUrl === internalPreviewUrl && mediaDuration === 0 && initialMedia.duration) { 
        const newDuration = initialMedia.duration; const newEndTime = initialMedia.endTime !== undefined ? initialMedia.endTime : newDuration;
        setMediaDuration(newDuration); setEndTime(newEndTime); setMediaSize(initialMedia.size || 0);
        setStartTime(initialMedia.startTime || 0); 
        latestTrimValuesRef.current = { startTime: initialMedia.startTime || 0, endTime: newEndTime }; currentTarget.currentTime = initialMedia.startTime || 0;
     }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkHostPass()) { event.target.value = ''; return; }
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const fileType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : null;
      if (!fileType) { setTimeout(() => toast({ title: "Invalid File Type", variant: "destructive" }), 0); return; }
      if (!checkStorageQuota(file.size)) { event.target.value = ''; return; }
      
      revokeCurrentInternalPreviewUrl();
      setRecordedFile(null); setInternalPreviewUrl(null);

      const url = URL.createObjectURL(file); 
      const tempMediaElement = document.createElement(fileType); tempMediaElement.src = url;
      tempMediaElement.onloadedmetadata = () => {
        const newDuration = tempMediaElement.duration; let durationLimitExceeded = false; let limitMinutes = 0;
        if (fileType === 'video' && newDuration > MAX_VIDEO_DURATION_SECONDS) { durationLimitExceeded = true; limitMinutes = MAX_VIDEO_DURATION_SECONDS / 60; }
        else if (fileType === 'audio' && newDuration > MAX_AUDIO_DURATION_SECONDS) { durationLimitExceeded = true; limitMinutes = MAX_AUDIO_DURATION_SECONDS / 60; }
        if (durationLimitExceeded) {
          setTimeout(() => toast({ variant: 'destructive', title: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} Too Long`, description: `Uploaded file is ${formatSecondsToTime(newDuration)}. Max is ${limitMinutes} min(s).`, duration: 7000 }), 0);
          URL.revokeObjectURL(url); event.target.value = ''; return;
        }
        setMediaType(fileType); setRecordedFile(file); setInternalPreviewUrl(url); setMediaDuration(newDuration); setMediaSize(file.size);
        setStartTime(0); setEndTime(newDuration); latestTrimValuesRef.current = { startTime: 0, endTime: newDuration };
        setTimeout(() => toast({ title: "File Uploaded", description: file.name }), 0);
      };
      tempMediaElement.onerror = () => { URL.revokeObjectURL(url); event.target.value = ''; setTimeout(() => toast({ title: "Error Loading File", variant: "destructive" }),0); };
    }
  };

  const handleLoadSampleMedia = async (type: 'video' | 'audio') => {
    if (!checkHostPass()) return;
    setIsLoadingSample(true); setSampleLoadingType(type);
    revokeCurrentInternalPreviewUrl();
    setRecordedFile(null); setInternalPreviewUrl(null);

    const sampleUrl = type === 'video' ? SAMPLE_VIDEO_URL : SAMPLE_AUDIO_URL;
    const filename = type === 'video' ? 'sample_video.mp4' : 'sample_audio.mp3';
    const mimeType = type === 'video' ? 'video/mp4' : 'audio/mpeg';
    try {
      const response = await fetch(sampleUrl); const blob = await response.blob();
      const file = new File([blob], filename, { type: mimeType }); 
      if (!checkStorageQuota(file.size)) { setIsLoadingSample(false); setSampleLoadingType(null); return; }
      const newInternalBlobUrl = URL.createObjectURL(blob);
      const tempMediaElement = document.createElement(type); tempMediaElement.src = newInternalBlobUrl;
      tempMediaElement.onloadedmetadata = () => {
        const actualDuration = tempMediaElement.duration;
        setMediaType(type); setRecordedFile(file); setInternalPreviewUrl(newInternalBlobUrl); setMediaDuration(actualDuration); setMediaSize(file.size);
        setStartTime(0); latestTrimValuesRef.current = { startTime: 0, endTime: actualDuration };
        if (type === 'video' && actualDuration > MAX_VIDEO_DURATION_SECONDS) {
          setEndTime(MAX_VIDEO_DURATION_SECONDS); latestTrimValuesRef.current = { startTime: 0, endTime: MAX_VIDEO_DURATION_SECONDS };
          setTimeout(() => toast({ title: "Sample Loaded & Pre-trimmed", description: `Video is ${formatSecondsToTime(actualDuration)}. Pre-trimmed to ${MAX_VIDEO_DURATION_SECONDS / 60} min(s). Adjust trim, final selection <= ${MAX_VIDEO_DURATION_SECONDS / 60} min(s).`, duration: 10000 }), 0);
        } else if (type === 'audio' && actualDuration > MAX_AUDIO_DURATION_SECONDS) {
          setTimeout(() => toast({ variant: 'destructive', title: `Sample Audio Too Long`, description: `Audio is ${formatSecondsToTime(actualDuration)}. Max is ${MAX_AUDIO_DURATION_SECONDS / 60} min(s). Cannot load.`, duration: 7000 }), 0);
          URL.revokeObjectURL(newInternalBlobUrl); handleDiscardMedia(false); return;
        } else { setEndTime(actualDuration); latestTrimValuesRef.current = { startTime: 0, endTime: actualDuration }; setTimeout(() => toast({ title: `Sample ${type} loaded`, description: filename }), 0); }
      };
      tempMediaElement.onerror = () => { URL.revokeObjectURL(newInternalBlobUrl); handleDiscardMedia(false); setTimeout(() => toast({ title: "Error Loading Sample", variant: "destructive" }),0); };
    } catch (error) { console.error(`Error loading sample ${type}:`, error); setTimeout(() => toast({ variant: 'destructive', title: `Failed to load sample ${type}` }), 0);
    } finally { setIsLoadingSample(false); setSampleLoadingType(null); }
  };

  const handleUseMedia = () => {
    if (!checkHostPass()) return;
    const currentStartTime = latestTrimValuesRef.current.startTime; const currentEndTime = latestTrimValuesRef.current.endTime;
    if (currentStartTime > currentEndTime && currentEndTime > 0) { setTimeout(() => toast({ title: "Invalid Trim: Start after End", variant: "destructive" }), 0); return; }
    if (currentStartTime === currentEndTime && currentStartTime > 0 && mediaDuration > 0 ) { setTimeout(() => toast({ title: "Invalid Trim: Start equals End", variant: "destructive" }), 0); return; }
    if (currentEndTime > mediaDuration && mediaDuration > 0) { setTimeout(() => toast({ title: "Invalid End Time", description: `End (${formatSecondsToTime(currentEndTime)}) > duration (${formatSecondsToTime(mediaDuration)}).`, variant: "destructive" }), 0); return; }
    const selectedSegmentDuration = currentEndTime - currentStartTime;
    if (mediaType === 'video' && selectedSegmentDuration > MAX_VIDEO_DURATION_SECONDS) { setTimeout(() => toast({ title: "Trim Exceeds Video Limit", description: `Segment is ${formatSecondsToTime(selectedSegmentDuration)}. Max is ${MAX_VIDEO_DURATION_SECONDS / 60} min(s).`, variant: "destructive", duration: 7000 }), 0); return; }
    if (mediaType === 'audio' && selectedSegmentDuration > MAX_AUDIO_DURATION_SECONDS) { setTimeout(() => toast({ title: "Trim Exceeds Audio Limit", description: `Segment is ${formatSecondsToTime(selectedSegmentDuration)}. Max is ${MAX_AUDIO_DURATION_SECONDS / 60} min(s).`, variant: "destructive", duration: 7000 }), 0); return; }

    if (recordedFile && mediaType && (mediaDuration > 0 || (mediaDuration === 0 && currentStartTime === 0 && currentEndTime ===0) )) {
      onMediaReady({
        file: recordedFile,
        type: mediaType,
        startTime: currentStartTime,
        endTime: currentEndTime,
        duration: mediaDuration, 
        size: mediaSize
      });
      const isTrimmed = (currentStartTime > 0.01) || (mediaDuration && Math.abs(currentEndTime - mediaDuration) > 0.01 && currentEndTime < mediaDuration);
      let toastDesc = isTrimmed ? `Media selected, trimmed: ${formatSecondsToTime(currentStartTime)} to ${formatSecondsToTime(currentEndTime)}.` : "Media selected.";
      setTimeout(() => toast({ title: "Media Ready", description: toastDesc, icon: <CheckCircle className="h-4 w-4" /> }), 0);
    } else if (!recordedFile && initialMedia && mediaType) { 
      const placeholderFile = new File([], initialMedia.previewUrl.split('/').pop() || "existing_media_placeholder", {type: mediaType === "video" ? "video/mp4" : "audio/mp3"});
      onMediaReady({
        file: placeholderFile, 
        type: mediaType,
        startTime: currentStartTime,
        endTime: currentEndTime,
        duration: mediaDuration,
        size: mediaSize
      });
      const isTrimmed = (currentStartTime > 0.01) || (mediaDuration && Math.abs(currentEndTime - mediaDuration) > 0.01 && currentEndTime < mediaDuration);
      let toastDesc = isTrimmed ? `Existing media trim updated: ${formatSecondsToTime(currentStartTime)} to ${formatSecondsToTime(currentEndTime)}.` : (mediaDuration > 0 ? "Existing media used in full." : "Existing media re-selected.");
       setTimeout(() => toast({ title: "Media Updated", description: toastDesc, icon: <CheckCircle className="h-4 w-4" /> }), 0);
    } else { setTimeout(() => toast({ title: "Media Not Ready", variant: "destructive" }), 0); }
    setShowTeleprompter(false); setCurrentTeleprompterScript(null);
  };

  const handleDiscardMedia = (showToast = true) => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    else { cleanupStream(stream); setStream(null); }
    mediaRecorderRef.current = null;

    revokeCurrentInternalPreviewUrl();

    setRecordedFile(null);
    setInternalPreviewUrl(initialMedia?.previewUrl || null); 
    setMediaType(initialMedia?.type || null);

    const initStartTime = initialMedia?.startTime || 0;
    const initDuration = initialMedia?.duration || 0;
    const initEndTime = initialMedia?.endTime !== undefined ? initialMedia.endTime : initDuration;
    const initSize = initialMedia?.size || 0;

    setStartTime(initStartTime);
    setEndTime(initEndTime);
    latestTrimValuesRef.current = { startTime: initStartTime, endTime: initEndTime };
    setMediaDuration(initDuration);
    setMediaSize(initSize);

    recordedChunks.current = [];
    onDiscard(); 
    if (showToast) setTimeout(() => toast({ title: "Media Discarded" }), 0);
    setShowTeleprompter(false); setCurrentTeleprompterScript(null);
  };

  useEffect(() => { 
    setMediaType(initialMedia?.type || null);
    setInternalPreviewUrl(initialMedia?.previewUrl || null); 

    const initStartTime = initialMedia?.startTime || 0;
    const initDuration = initialMedia?.duration || 0;
    const initEndTime = initialMedia?.endTime !== undefined ? initialMedia.endTime : initDuration;
    const initSize = initialMedia?.size || 0;

    setStartTime(initStartTime);
    setEndTime(initEndTime);
    latestTrimValuesRef.current = { startTime: initStartTime, endTime: initEndTime };
    setMediaDuration(initDuration);
    setMediaSize(initSize);

    setIsRecording(false);
    setRecordedFile(null); 
  }, [initialMedia]);


  useEffect(() => { 
    const urlToClean = internalPreviewUrl;
    return () => {
      cleanupStream(stream);
      if (urlToClean && urlToClean.startsWith('blob:') && urlToClean !== initialMedia?.previewUrl) {
        URL.revokeObjectURL(urlToClean);
      }
    };
  }, [stream, internalPreviewUrl, cleanupStream, initialMedia?.previewUrl]);

  useEffect(() => { 
    const mediaElement = mediaType === 'video' ? videoRef.current : audioPreviewRef.current;
    if (!mediaElement || !internalPreviewUrl || !(mediaDuration > 0)) return;
    const getPlaybackStartTime = () => latestTrimValuesRef.current.startTime; const getPlaybackEndTime = () => latestTrimValuesRef.current.endTime;
    const onPlayHandler = () => { const numericStartTime = getPlaybackStartTime(); if (mediaElement.currentTime < numericStartTime - 0.05 || (mediaElement.currentTime >= getPlaybackEndTime() - 0.05 && getPlaybackEndTime() < mediaDuration - 0.05) ) mediaElement.currentTime = numericStartTime; };
    const onTimeUpdateHandler = () => { const numericEndTime = getPlaybackEndTime(); if (mediaElement.currentTime >= numericEndTime - 0.05) { mediaElement.pause(); if (mediaElement.currentTime > numericEndTime) mediaElement.currentTime = numericEndTime; } };
    if (mediaElement.paused && startTime !== undefined) { const numericStartTime = getPlaybackStartTime(); if (Math.abs(mediaElement.currentTime - numericStartTime) > 0.1) mediaElement.currentTime = numericStartTime; }
    mediaElement.addEventListener('play', onPlayHandler); mediaElement.addEventListener('timeupdate', onTimeUpdateHandler);
    return () => { mediaElement.removeEventListener('play', onPlayHandler); mediaElement.removeEventListener('timeupdate', onTimeUpdateHandler); };
  }, [internalPreviewUrl, mediaType, mediaDuration, videoRef, audioPreviewRef, startTime]);

  return (
    <Card>
      <CardHeader><CardTitle className="font-headline text-lg">Record or Upload Media</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {hasCameraPermission === false && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Permissions Required</AlertTitle><AlertDescription>Camera/mic permissions needed. Enable in browser & refresh.</AlertDescription></Alert>)}
        {!canRecordOrUpload && (<Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>Host Pass Required</AlertTitle><AlertDescription>An active Host Pass is needed to record or upload new media. Please check your pass status in Settings.</AlertDescription></Alert>)}

        {!internalPreviewUrl && !isRecording && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
             <Button onClick={() => handleStartRecording('video')} variant="outline" className="w-full py-6" disabled={isRecording || hasCameraPermission === false || !canRecordOrUpload} aria-label="Start video recording"><Video className="mr-2 h-5 w-5" /> Start Video</Button>
             <Button onClick={() => handleStartRecording('audio')} variant="outline" className="w-full py-6" disabled={isRecording || hasCameraPermission === false || !canRecordOrUpload} aria-label="Start audio recording"><Mic className="mr-2 h-5 w-5" /> Start Audio</Button>
            <div className="md:col-span-3">
              <Label htmlFor="media-upload" className="sr-only">Upload media file</Label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="media-upload" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${canRecordOrUpload ? 'cursor-pointer bg-muted hover:bg-secondary' : 'bg-muted/50 cursor-not-allowed'}`}><div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" /><p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or D&D</p><p className="text-xs text-muted-foreground">Video (max ${MAX_VIDEO_DURATION_SECONDS / 60}m) / Audio (max ${MAX_AUDIO_DURATION_SECONDS / 60}m)</p></div><Input id="media-upload" type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*" disabled={isRecording || !canRecordOrUpload} aria-label="Upload video or audio file" /></label>
              </div>
            </div>
            <div className="md:col-span-3 pt-2 border-t"><p className="text-sm text-muted-foreground mb-2 text-center">Or, load a sample to test:</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Button onClick={() => handleLoadSampleMedia('video')} variant="secondary" size="sm" disabled={isLoadingSample || !canRecordOrUpload} aria-label="Load sample video">{isLoadingSample && sampleLoadingType === 'video' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}Sample Video</Button><Button onClick={() => handleLoadSampleMedia('audio')} variant="secondary" size="sm" disabled={isLoadingSample || !canRecordOrUpload} aria-label="Load sample audio">{isLoadingSample && sampleLoadingType === 'audio' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Waves className="mr-2 h-4 w-4" />}Sample Audio</Button></div></div>
          </div>
        )}

        {isRecording && mediaType === 'video' && (<video ref={liveVideoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />)}
        {isRecording && (<div className="text-center space-y-2"><p className="text-sm text-primary animate-pulse">{mediaType === 'video' ? 'Video' : 'Audio'} Recording...</p><Button onClick={handleStopRecording} variant="destructive" className="w-full md:w-auto" aria-label="Stop recording"><StopCircle className="mr-2 h-4 w-4" /> Stop</Button></div>)}

        {internalPreviewUrl && !isRecording && mediaType && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Media: <span className="text-primary">{recordedFile?.name || (initialMedia?.previewUrl === internalPreviewUrl ? "Existing media" : 'Recorded Media')}</span>{mediaDuration > 0 && ` (Full: ${formatSecondsToTime(mediaDuration)})`}</p>
            {mediaType === 'video' ? (<video ref={videoRef} src={internalPreviewUrl} controls className="w-full aspect-video rounded-md bg-muted object-cover" onLoadedMetadata={handleVideoLoadedMetadata} key={internalPreviewUrl} preload="metadata"/>) : (<audio ref={audioPreviewRef} src={internalPreviewUrl} controls className="w-full" onLoadedMetadata={handleVideoLoadedMetadata} key={internalPreviewUrl} preload="metadata"/>)}
            {(mediaDuration > 0 || (mediaDuration === 0 && startTime === 0 && endTime ===0)) && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm"><span className="text-green-500">Start: {formatSecondsToTime(startTime)}</span><span className="text-red-500">End: {formatSecondsToTime(endTime)}</span></div>
                <div className="text-center my-2 space-y-0.5"><span className="text-lg font-bold text-primary">Trimmed: {formatSecondsToTime(Math.max(0, endTime - startTime))}</span>{mediaType && (<p className="text-sm text-muted-foreground">(Max Allowed: {formatSecondsToTime(mediaType === 'video' ? MAX_VIDEO_DURATION_SECONDS : MAX_AUDIO_DURATION_SECONDS)})</p>)}</div>
                <Slider disabled={!mediaDuration && mediaDuration !==0} value={[startTime, endTime]} onValueChange={(vals) => { setStartTime(vals[0]); setEndTime(vals[1]); latestTrimValuesRef.current = { startTime: vals[0], endTime: vals[1] }; }} min={0} max={mediaDuration} step={0.1} className="w-full" aria-label={`Trim media between ${formatSecondsToTime(startTime)} and ${formatSecondsToTime(endTime)}`} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>{formatSecondsToTime(0)}</span><span>{formatSecondsToTime(mediaDuration)}</span></div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button onClick={handleUseMedia} className="w-full sm:w-auto flex-1" disabled={!mediaType || (mediaDuration === 0 && !(latestTrimValuesRef.current.startTime === 0 && latestTrimValuesRef.current.endTime ===0)) || !canRecordOrUpload} aria-label="Use this media"><CheckCircle className="mr-2 h-4 w-4" /> Use Media</Button>
              <Button onClick={() => handleDiscardMedia(true)} variant="outline" className="w-full sm:w-auto flex-1" aria-label="Discard current media and re-do"><RotateCcw className="mr-2 h-4 w-4" /> Discard & Re-do</Button>
            </div>
            <div className="mt-6 pt-4 border-t"><p className="text-sm text-muted-foreground mb-2 text-center">Or, load a different sample:</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Button onClick={() => handleLoadSampleMedia('video')} variant="secondary" size="sm" disabled={isLoadingSample || !canRecordOrUpload} aria-label="Load different sample video">{isLoadingSample && sampleLoadingType === 'video' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}Load Sample Video</Button><Button onClick={() => handleLoadSampleMedia('audio')} variant="secondary" size="sm" disabled={isLoadingSample || !canRecordOrUpload} aria-label="Load different sample audio">{isLoadingSample && sampleLoadingType === 'audio' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Waves className="mr-2 h-4 w-4" />}Load Sample Audio</Button></div></div>
          </div>
        )}

        {showTeleprompter && currentTeleprompterScript && (
          <Dialog open={showTeleprompter} onOpenChange={(isOpen) => {
              if (!isOpen) {
                  setShowTeleprompter(false);
              }
          }}>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                  <DialogHeader>
                      <DialogTitle className="font-headline text-xl flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" />Recording Cue</DialogTitle>
                      <DialogDescription>
                          Use the points below as a guide. You can scroll through the text.
                      </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="flex-grow py-4 pr-2 my-2 border-y">
                      <p className="text-sm whitespace-pre-line">{currentTeleprompterScript}</p>
                  </ScrollArea>
                  <DialogFooter>
                      <Button variant="outline" onClick={() => setShowTeleprompter(false)} aria-label="Close teleprompter">Close Prompter</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

