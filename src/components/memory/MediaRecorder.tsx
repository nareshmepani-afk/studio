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
import { formatSecondsToTime, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { teleprompterScripts, defaultTeleprompterFallbackScript } from '@/lib/teleprompterScripts';
import { mockPromptGroups } from '@/lib/mockData';
import type { MediaAttachment } from '@/types';
import { getFFmpegInstance, getDurationWithFFmpeg, trimMediaWithFFmpeg } from '@/lib/ffmpeg';

// Maximum duration constants (in seconds)
const MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS = 300; // 5 minutes for raw recording
const MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS = 600; // 10 minutes
const MAX_TRIMMED_VIDEO_DURATION_SECONDS = 180; // 3 minutes for final trimmed video
const MAX_TRIMMED_AUDIO_DURATION_SECONDS = 300; // 5 minutes for final trimmed audio

interface MediaCaptureControlProps {
  onMediaReady: (media: {
    file: File;
    type: 'video' | 'audio';
    startTime?: number;
    endTime?: number;
    duration: number;
    size: number;
  }) => void;
  onDiscard: () => void;
  initialMedia?: {
    type: 'video' | 'audio';
    previewUrl: string;
    startTime?: number;
    endTime?: number;
    duration: number;
    size: number;
  };
  promptIdForTeleprompter?: string;
  chapterTitleForTeleprompter?: string;
}

export function MediaCaptureControl({
  onMediaReady,
  onDiscard,
  initialMedia,
  promptIdForTeleprompter,
  chapterTitleForTeleprompter
}: MediaCaptureControlProps) {
  const { user, storageQuotaBytes, hostPassStatus } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);

  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [streamForVideoFeed, setStreamForVideoFeed] = useState<MediaStream | null>(null);
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

  const [currentRecordingDuration, setCurrentRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [rawPreviewReady, setRawPreviewReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');

  const canRecordOrUpload =
    hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';

  const [isFFmpegInstanceReady, setIsFFmpegInstanceReady] = useState(false);

  useEffect(() => {
    setProcessingStatusText('Initializing media tools...');
    getFFmpegInstance()
      .then(() => {
        setIsFFmpegInstanceReady(true);
        setProcessingStatusText('');
      })
      .catch(error => {
        console.error("FFmpeg instance failed to initialize in MediaRecorder:", error);
        toast({
          title: "Media Tools Failed",
          description: "Could not load media processing tools. Trimming may be unavailable.",
          variant: "destructive",
          duration: 10000,
        });
        setProcessingStatusText('Media tools failed to load');
      });
  }, []);

  useEffect(() => { latestTrimValuesRef.current = { startTime, endTime }; }, [startTime, endTime]);

  const cleanupStreamTracks = useCallback((streamToClean: MediaStream | null) => {
    if (streamToClean) {
      streamToClean.getTracks().forEach(track => track.stop());
    }
  }, []);

  const cleanupAndFinalizeRecording = useCallback((streamUsedForRecording: MediaStream | null) => {
    cleanupStreamTracks(streamUsedForRecording);
    setStreamForVideoFeed(prevStream => {
      if (prevStream === streamUsedForRecording) return null;
      return prevStream;
    });
    mediaRecorderRef.current = null;
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setCurrentRecordingDuration(0);
  }, [cleanupStreamTracks]);

  const getPermissions = useCallback(async (type: 'video' | 'audio'): Promise<MediaStream | null> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setHasCameraPermission(true);
      return mediaStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasCameraPermission(false);
      setTimeout(() =>
        toast({
          variant: 'destructive',
          title: 'Permissions Denied',
          description: `Please enable ${type === 'video' ? 'camera and microphone' : 'microphone'} permissions in your browser settings to use this feature. You may need to refresh the page.`,
          duration: 7000
        }), 0
      );
      return null;
    }
  }, []);

  useEffect(() => {
    let currentLiveVideoElement = liveVideoRef.current;
    if (isRecording && mediaType === 'video' && streamForVideoFeed && currentLiveVideoElement) {
      if (currentLiveVideoElement.srcObject !== streamForVideoFeed) {
        currentLiveVideoElement.srcObject = streamForVideoFeed;
      }
      currentLiveVideoElement.play().catch(e => console.warn("Live video play interrupted:", e));
      setCurrentRecordingDuration(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => {
        setCurrentRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (!isRecording) {
      if (currentLiveVideoElement && currentLiveVideoElement.srcObject) {
        if (currentLiveVideoElement.srcObject === streamForVideoFeed || !streamForVideoFeed) {
          currentLiveVideoElement.srcObject = null;
        }
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording, mediaType, streamForVideoFeed]);

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

  const revokeCurrentInternalPreviewUrl = useCallback(() => {
    if (internalPreviewUrl && internalPreviewUrl.startsWith('blob:') && internalPreviewUrl !== initialMedia?.previewUrl) {
      URL.revokeObjectURL(internalPreviewUrl);
    }
  }, [internalPreviewUrl, initialMedia?.previewUrl]);

  const performDiscardReset = useCallback((showToast: boolean) => {
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
    setRawPreviewReady(false);
    setShowTeleprompter(false);
    setCurrentTeleprompterScript(null);
    onDiscard();
    if (showToast) setTimeout(() => toast({ title: "Media Discarded" }), 0);
  }, [initialMedia, onDiscard, revokeCurrentInternalPreviewUrl]);

  const handleDiscardMedia = useCallback((showToast = true) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        cleanupAndFinalizeRecording(streamForVideoFeed);
        performDiscardReset(showToast);
      };
      mediaRecorderRef.current.stop();
    } else {
      cleanupAndFinalizeRecording(streamForVideoFeed);
      performDiscardReset(showToast);
    }
  }, [cleanupAndFinalizeRecording, performDiscardReset, streamForVideoFeed]);

  const handleStartRecording = async (type: 'video' | 'audio') => {
    if (isRecording || !checkHostPass()) return;
    revokeCurrentInternalPreviewUrl();
    setRecordedFile(null); setInternalPreviewUrl(null); setMediaType(type); setStartTime(0); setEndTime(0); setMediaDuration(0); setMediaSize(0);
    latestTrimValuesRef.current = { startTime: 0, endTime: 0 };
    recordedChunks.current = [];
    setRawPreviewReady(false);
    setShowTeleprompter(false);
    setCurrentTeleprompterScript(null);
    cleanupStreamTracks(streamForVideoFeed);
    const streamForNewRecording = await getPermissions(type);
    if (!streamForNewRecording || !streamForNewRecording.active) {
      cleanupStreamTracks(streamForNewRecording);
      setStreamForVideoFeed(null);
      return;
    }
    setStreamForVideoFeed(streamForNewRecording);
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
    let selectedMimeType = '';
    try {
      const preferredVideoMimeTypes = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=h264,opus', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/webm'];
      const preferredAudioMimeTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];
      const typesToTest = type === 'video' ? preferredVideoMimeTypes : preferredAudioMimeTypes;
      for (const mime of typesToTest) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }
      const recorderOptions = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      const recorder = new window.MediaRecorder(streamForNewRecording, recorderOptions);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunks.current.push(event.data); };
      recorder.onstop = () => {
        const currentRecordedChunksCopy = [...recordedChunks.current];
        recordedChunks.current = [];
        if (currentRecordedChunksCopy.length === 0) {
          setTimeout(() => toast({ variant: 'destructive', title: 'No Data Recorded', description: 'The recording seems to be empty. Please try again, ensuring your microphone/camera is active.', duration: 7000 }), 0);
          cleanupAndFinalizeRecording(streamForNewRecording);
          return;
        }
        const blobMimeTypeToUse = mediaRecorderRef.current?.mimeType || (type === 'video' ? (selectedMimeType || 'video/webm') : (selectedMimeType || 'audio/webm'));
        const blob = new Blob(currentRecordedChunksCopy, { type: blobMimeTypeToUse });
        if (blob.size < 1024) {
          setTimeout(() => toast({ variant: 'destructive', title: 'Recording Error', description: 'Recorded data is too small or corrupted. Please try a longer recording.', duration: 7000 }), 0);
          cleanupAndFinalizeRecording(streamForNewRecording);
          return;
        }
        if (!checkStorageQuota(blob.size)) {
          cleanupAndFinalizeRecording(streamForNewRecording);
          return;
        }
        const file = new File([blob], `recording.${blob.type.split('/')[1]?.split(';')[0] || 'bin'}`, { type: blob.type });
        const newObjectUrlForPreview = URL.createObjectURL(blob);
        requestAnimationFrame(() => {
          setRecordedFile(file);
          setInternalPreviewUrl(newObjectUrlForPreview);
          setMediaType(type);
          setMediaSize(file.size);
          setMediaDuration(0);
          setStartTime(0);
          setEndTime(0);
          latestTrimValuesRef.current = { startTime: 0, endTime: 0 };
          setRawPreviewReady(true);
        });
        setTimeout(() => toast({ title: "Recording Complete!", description: "Preview your raw recording and click 'Accept Recording' to proceed." }), 0);
        cleanupAndFinalizeRecording(streamForNewRecording);
      };
      recorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        cleanupAndFinalizeRecording(streamForNewRecording);
        setTimeout(() => toast({ variant: 'destructive', title: 'Recording Error', description: event.error?.message || 'Something went wrong during recording. Please try again.' }), 0);
      };
      recorder.start(1000);
      setIsRecording(true);
      setTimeout(() => toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} recording started.` }),0);
    } catch (err) {
      console.error("Error initializing MediaRecorder:", err);
      cleanupStreamTracks(streamForNewRecording);
      setStreamForVideoFeed(null);
      setShowTeleprompter(false);
      setCurrentTeleprompterScript(null);
      setIsRecording(false);
      mediaRecorderRef.current = null;
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
      setCurrentRecordingDuration(0);
      setTimeout(() => toast({ variant: 'destructive', title: 'Recording Setup Failed', description: 'Could not start recording. Check device compatibility or permissions.' }), 0);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    } else if (isRecording) {
      cleanupAndFinalizeRecording(streamForVideoFeed);
    }
  };

  const processDuration = (durationValue: number) => {
    const currentMaxRawDuration = mediaType === 'video' ? MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS : MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS;
    const currentMaxTrimmedDuration = mediaType === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;
    if (durationValue > currentMaxRawDuration) {
      setTimeout(() => toast({ variant: 'destructive', title: `${mediaType === 'video' ? 'Video' : 'Audio'} Too Long`, description: `Recording is ${formatSecondsToTime(durationValue)}. Maximum allowed is ${formatSecondsToTime(currentMaxRawDuration)}. Please re-record or upload a shorter segment.`, duration: 10000 }), 0);
      handleDiscardMedia(false);
      return;
    }
    setMediaDuration(durationValue);
    setEndTime(durationValue);
    setStartTime(0);
    latestTrimValuesRef.current = { startTime: 0, endTime: durationValue };
    setRawPreviewReady(false);
    if (durationValue > currentMaxTrimmedDuration) {
      setTimeout(() => toast({ title: "Media Ready for Trimming", description: `Your ${formatSecondsToTime(durationValue)} ${mediaType} needs to be trimmed to ${formatSecondsToTime(currentMaxTrimmedDuration)} or less.`, duration: 10000, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> }), 0);
    } else {
      setTimeout(() => toast({ title: "Media Verified", description: `Duration: ${formatSecondsToTime(durationValue)}. You can now trim or use the media.` }), 0);
    }
  };

  const handleAcceptRawRecording = useCallback(async () => {
    if (!recordedFile) {
      toast({variant: 'destructive', title: 'Preview Error', description: 'No media file to accept.'});
      return;
    }
    if (!isFFmpegInstanceReady) {
      toast({variant: 'destructive', title: 'Tools Not Ready', description: 'Video processing tools are still loading. Please try again in a moment.'});
      return;
    }
    setIsProcessing(true);
    setProcessingStatusText('Analyzing media... (this may take a moment)');
    try {
      const duration = await getDurationWithFFmpeg(recordedFile);
      processDuration(duration);
    } catch (error) {
      console.error("Error getting media duration with FFmpeg:", error);
      toast({ variant: 'destructive', title: 'Recording Processing Error', description: `Could not verify media. The file might be corrupted. Error: ${(error as Error).message}`, duration: 8000 });
      handleDiscardMedia(false);
    }
    setIsProcessing(false);
    setProcessingStatusText('');
  }, [recordedFile, mediaType, checkStorageQuota, handleDiscardMedia, isFFmpegInstanceReady]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkHostPass()) { event.target.value = ''; return; }
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const fileType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : null;
      if (!fileType) { setTimeout(() => toast({ title: "Invalid File Type", description:"Please upload a valid video or audio file.", variant: "destructive" }), 0); return; }
      if (!checkStorageQuota(file.size)) { event.target.value = ''; return; }
      revokeCurrentInternalPreviewUrl();
      setRecordedFile(null); setInternalPreviewUrl(null);
      cleanupStreamTracks(streamForVideoFeed); setStreamForVideoFeed(null);
      setRawPreviewReady(false);
      setShowTeleprompter(false);
      setCurrentTeleprompterScript(null);
      const newObjectUrlForPreview = URL.createObjectURL(file);
      requestAnimationFrame(() => {
          setRecordedFile(file);
          setInternalPreviewUrl(newObjectUrlForPreview);
          setMediaType(fileType);
          setMediaSize(file.size);
          setMediaDuration(0);
          setStartTime(0);
          setEndTime(0);
          latestTrimValuesRef.current = { startTime: 0, endTime: 0 };
          setRawPreviewReady(true);
      });
      setTimeout(() => toast({ title: "File Uploaded", description: `${file.name}. Preview and accept to proceed.` }), 0);
      event.target.value = '';
    }
  };

  const handleLoadSampleMedia = async (type: 'video' | 'audio') => {
    if (!checkHostPass()) return;
    setIsLoadingSample(true); setSampleLoadingType(type);
    revokeCurrentInternalPreviewUrl();
    setRecordedFile(null); setInternalPreviewUrl(null);
    cleanupStreamTracks(streamForVideoFeed); setStreamForVideoFeed(null);
    setRawPreviewReady(false);
    setShowTeleprompter(false);
    setCurrentTeleprompterScript(null);
    const sampleUrl = type === 'video' ? "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" : "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";
    const filename = type === 'video' ? 'sample_video.mp4' : 'sample_audio.mp3';
    const mimeType = type === 'video' ? 'video/mp4' : 'audio/mpeg';
    try {
      const response = await fetch(sampleUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: mimeType });
      if (!checkStorageQuota(file.size)) { setIsLoadingSample(false); setSampleLoadingType(null); return; }
      const newInternalBlobUrl = URL.createObjectURL(blob);
      requestAnimationFrame(() => {
          setRecordedFile(file);
          setInternalPreviewUrl(newInternalBlobUrl);
          setMediaType(type);
          setMediaSize(file.size);
          setMediaDuration(0);
          setStartTime(0);
          setEndTime(0);
          latestTrimValuesRef.current = { startTime: 0, endTime: 0 };
          setRawPreviewReady(true);
      });
      setTimeout(() => toast({ title: `Sample ${type} loaded`, description: `${filename}. Preview and accept to proceed.` }), 0);
    } catch (error) {
      console.error(`Error loading sample ${type}:`, error);
      setTimeout(() => toast({ variant: 'destructive', title: `Failed to Load Sample ${type.charAt(0).toUpperCase() + type.slice(1)}` }), 0);
    } finally { setIsLoadingSample(false); setSampleLoadingType(null); }
  };

  const handleUseMedia = async () => {
    if (!checkHostPass() || !isFFmpegInstanceReady) {
      if (!isFFmpegInstanceReady) toast({ title: "Media Tools Not Ready", description: "Please wait for media tools to initialize.", variant: "destructive" });
      return;
    }
    const currentStartTime = latestTrimValuesRef.current.startTime;
    const currentEndTime = latestTrimValuesRef.current.endTime;
    if (currentStartTime >= currentEndTime && currentEndTime > 0) {
      toast({ title: "Invalid Trim: Start time must be before end time", variant: "destructive" });
      return;
    }
    if (currentEndTime > mediaDuration && mediaDuration > 0) {
      toast({ title: "Invalid End Time", description: `End (${formatSecondsToTime(currentEndTime)}) > duration (${formatSecondsToTime(mediaDuration)}).`, variant: "destructive" });
      return;
    }
    const selectedSegmentDuration = currentEndTime - currentStartTime;
    const currentMaxTrimmedDuration = mediaType === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;
    if (selectedSegmentDuration > currentMaxTrimmedDuration) {
      toast({ title: `Trimmed ${mediaType} Exceeds Limit`, description: `Selected segment is ${formatSecondsToTime(selectedSegmentDuration)}. Max allowed is ${formatSecondsToTime(currentMaxTrimmedDuration)}. Please trim further.`, variant: "destructive", duration: 10000 });
      return;
    }
    if (!recordedFile) {
      toast({ title: "No Media File", description: "Please record or upload media first.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      setProcessingStatusText('Trimming media...');
      const trimmedBlob = await trimMediaWithFFmpeg(recordedFile, currentStartTime, currentEndTime);
      setProcessingStatusText('Verifying trimmed media...');
      const newDuration = await getDurationWithFFmpeg(trimmedBlob);
      if (!checkStorageQuota(trimmedBlob.size)) {
        return; // checkStorageQuota shows its own toast
      }
      const newFile = new File([trimmedBlob], `trimmed_${recordedFile.name}`, { type: trimmedBlob.type });
      onMediaReady({
        file: newFile,
        type: mediaType!,
        startTime: 0,
        endTime: newDuration,
        duration: newDuration,
        size: newFile.size,
      });
      toast({ title: "Media Trimmed and Ready!", description: `Final duration: ${formatSecondsToTime(newDuration)}.`, icon: <CheckCircle className="h-4 w-4" /> });
    } catch (error) {
      console.error("Error during media processing:", error);
      toast({ title: "Processing Failed", description: "Could not trim the media. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setProcessingStatusText('');
    }
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
    setRawPreviewReady(false);
    setShowTeleprompter(false);
    setCurrentTeleprompterScript(null);
  }, [initialMedia]);

  useEffect(() => {
    const currentInternalUrl = internalPreviewUrl;
    const initialPreview = initialMedia?.previewUrl;
    return () => {
      if (currentInternalUrl && currentInternalUrl.startsWith('blob:') && currentInternalUrl !== initialPreview) {
        URL.revokeObjectURL(currentInternalUrl);
      }
    };
  }, [internalPreviewUrl, initialMedia?.previewUrl]);

  useEffect(() => {
    if (rawPreviewReady) return;
    const mediaElement = mediaType === 'video' ? videoRef.current : audioPreviewRef.current;
    if (!mediaElement || !internalPreviewUrl || !(mediaDuration > 0)) return;
    const getPlaybackStartTime = () => latestTrimValuesRef.current.startTime; const getPlaybackEndTime = () => latestTrimValuesRef.current.endTime;
    const onPlayHandler = () => { const numericStartTime = getPlaybackStartTime(); if (mediaElement.currentTime < numericStartTime - 0.05 || (mediaElement.currentTime >= getPlaybackEndTime() - 0.05 && getPlaybackEndTime() < mediaDuration - 0.05) ) mediaElement.currentTime = numericStartTime; };
    const onTimeUpdateHandler = () => { const numericEndTime = getPlaybackEndTime(); if (mediaElement.currentTime >= numericEndTime - 0.05) { mediaElement.pause(); if (mediaElement.currentTime > numericEndTime) mediaElement.currentTime = numericEndTime; } };
    if (mediaElement.paused && startTime !== undefined) { const numericStartTime = getPlaybackStartTime(); if (Math.abs(mediaElement.currentTime - numericStartTime) > 0.1) mediaElement.currentTime = numericStartTime; }
    mediaElement.addEventListener('play', onPlayHandler); mediaElement.addEventListener('timeupdate', onTimeUpdateHandler);
    return () => { mediaElement.removeEventListener('play', onPlayHandler); mediaElement.removeEventListener('timeupdate', onTimeUpdateHandler); };
  }, [internalPreviewUrl, mediaType, mediaDuration, videoRef, audioPreviewRef, startTime, rawPreviewReady]);

  const currentFinalMaxDuration = mediaType === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;
  const isReady = isFFmpegInstanceReady && canRecordOrUpload;

  return (
    <Card>
      <CardHeader><CardTitle className="font-headline text-lg">Record or Upload Media</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {hasCameraPermission === false && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Permissions Required</AlertTitle><AlertDescription>Camera/mic permissions needed. Enable in browser & refresh.</AlertDescription></Alert>)}
        {!canRecordOrUpload && (<Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>Host Pass Required</AlertTitle><AlertDescription>An active Host Pass is needed to record or upload new media. Please check your pass status in Settings.</AlertDescription></Alert>)}

        {!internalPreviewUrl && !isRecording && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => handleStartRecording('video')} className="flex-1" disabled={!isReady || isRecording || hasCameraPermission === false}>
                <Video className="mr-2" /> Start Video
              </Button>
              <Button onClick={() => handleStartRecording('audio')} className="flex-1" disabled={!isReady || isRecording || hasCameraPermission === false}>
                <Mic className="mr-2" /> Start Audio
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center w-full">
                <Label htmlFor="media-upload" className={cn(
                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-secondary",
                    !isReady && "cursor-not-allowed opacity-50"
                )}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or D&D</p>
                        <p className="text-xs text-muted-foreground">Video (max 5:00.0) / Audio (max 10:00.0)</p>
                    </div>
                    <Input id="media-upload" type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*" disabled={!isReady} />
                </Label>
            </div> 
            <div className="text-center text-xs text-muted-foreground pt-1">
                Or, load a sample to test:
                <Button variant="link" size="sm" onClick={() => handleLoadSampleMedia('video')} disabled={isLoadingSample || !isReady} className="text-xs h-auto px-1 py-0">{isLoadingSample && sampleLoadingType==='video' ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : null}Sample Video</Button>
                <Button variant="link" size="sm" onClick={() => handleLoadSampleMedia('audio')} disabled={isLoadingSample || !isReady} className="text-xs h-auto px-1 py-0">{isLoadingSample && sampleLoadingType==='audio' ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : null}Sample Audio</Button>
            </div>
          </div>
        )}

        {(isRecording || (mediaType === 'video' && internalPreviewUrl)) && (
            <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                <video ref={isRecording ? liveVideoRef : videoRef} src={isRecording ? undefined : internalPreviewUrl || ''} autoPlay={isRecording} muted={isRecording} playsInline controls={!isRecording} className="w-full h-full object-contain" />
                {isRecording && (
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center">
                        <Timer className="h-3 w-3 mr-1 text-red-500 animate-pulse" />
                        {formatSecondsToTime(currentRecordingDuration)} / {formatSecondsToTime(mediaType === 'video' ? MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS : MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS)}
                    </div>
                )}
            </div>
        )}

        {showTeleprompter && isRecording && (
          <Dialog open={showTeleprompter} onOpenChange={setShowTeleprompter}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="font-headline text-lg flex items-center"><BookOpen className="mr-2 h-5 w-5"/>Teleprompter</DialogTitle><DialogDescription>Use these talking points to guide your recording.</DialogDescription></DialogHeader>
              <ScrollArea className="h-72 w-full rounded-md border p-4">
                 <p className="whitespace-pre-wrap">{currentTeleprompterScript}</p>
              </ScrollArea>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTeleprompter(false)}>Close Prompter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {isRecording && (
          <Button onClick={handleStopRecording} className="w-full" variant="destructive"><StopCircle className="mr-2"/> Stop Recording</Button>
        )}

        {internalPreviewUrl && !isRecording && (
          <div className="space-y-4">
            {mediaType === 'audio' && (
              <div className="p-4 bg-muted rounded-md">
                <audio ref={audioPreviewRef} src={internalPreviewUrl} controls className="w-full" />
              </div>
            )}
            
            {rawPreviewReady ? (
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleAcceptRawRecording} className="flex-1" disabled={isProcessing}><CheckCircle className="mr-2"/>{isProcessing ? <><Loader2 className="mr-2 animate-spin"/>{processingStatusText || 'Accepting...'}</> : `Accept ${mediaType === 'video' ? 'Video' : 'Audio'}`}</Button>
                    <Button onClick={() => handleDiscardMedia()} className="flex-1" variant="outline"><RotateCcw className="mr-2"/>Discard & Restart</Button>
                 </div>
            ) : (
                <>
                  <div className="space-y-2">
                    <Label>Trim Your {mediaType}</Label>
                    <Slider
                        min={0}
                        max={mediaDuration}
                        step={0.1}
                        value={[startTime, endTime]}
                        onValueChange={(value) => {
                          if (Array.isArray(value)) {
                            setStartTime(value[0]);
                            setEndTime(value[1]);
                          }
                        }}
                        disabled={isProcessing}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Start: {formatSecondsToTime(startTime)}</span>
                        <span>End: {formatSecondsToTime(endTime)}</span>
                    </div>
                    <div className="text-center text-sm font-medium">
                        Selected Duration: {formatSecondsToTime(endTime - startTime)}
                        {((endTime - startTime) > currentFinalMaxDuration) &&
                          <span className="text-destructive ml-2">(exceeds {formatSecondsToTime(currentFinalMaxDuration)} max)</span>
                        }
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleUseMedia} className="flex-1" disabled={isProcessing}>
                      {isProcessing ? <><Loader2 className="mr-2 animate-spin"/>{processingStatusText || 'Processing...'}</> : <><CheckCircle className="mr-2"/>Use Trimmed Media</>}
                    </Button>
                    <Button onClick={() => handleDiscardMedia()} className="flex-1" variant="outline" disabled={isProcessing}>
                      <RotateCcw className="mr-2"/> Discard & Restart
                    </Button>
                  </div>
                </>
            )}
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}
