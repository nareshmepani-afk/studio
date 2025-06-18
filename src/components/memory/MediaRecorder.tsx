
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Video, StopCircle, UploadCloud, RotateCcw, CheckCircle, AlertTriangle, Film, Waves, Loader2, ShieldAlert, BookOpen, Timer } from 'lucide-react';
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

const MAX_TRIMMED_VIDEO_DURATION_SECONDS = 120;
const MAX_TRIMMED_AUDIO_DURATION_SECONDS = 300;

const MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS = MAX_TRIMMED_VIDEO_DURATION_SECONDS + 60;
const MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS = MAX_TRIMMED_AUDIO_DURATION_SECONDS + 60;


export function MediaCaptureControl({ onMediaReady, onDiscard, initialMedia, promptIdForTeleprompter, chapterTitleForTeleprompter }: MediaCaptureControlProps) {
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

  const canRecordOrUpload = hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';

  useEffect(() => { latestTrimValuesRef.current = { startTime, endTime }; }, [startTime, endTime]);

  const getPermissions = useCallback(async (type: 'video' | 'audio'): Promise<MediaStream | null> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setHasCameraPermission(true);
      return mediaStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasCameraPermission(false);
      setTimeout(() => toast({ variant: 'destructive', title: 'Permissions Denied', description: `Please enable ${type === 'video' ? 'camera and microphone' : 'microphone'} permissions in your browser settings to use this feature. You may need to refresh the page.`, duration: 7000 }), 0);
      return null;
    }
  }, []);

  const cleanupStreamTracks = useCallback((streamToClean: MediaStream | null) => {
    if (streamToClean) {
      streamToClean.getTracks().forEach(track => track.stop());
    }
  }, []);

  useEffect(() => {
    let currentStreamForFeed = streamForVideoFeed;
    let currentLiveVideoElement = liveVideoRef.current;

    if (isRecording && mediaType === 'video' && currentStreamForFeed && currentLiveVideoElement) {
      if(currentLiveVideoElement.srcObject !== currentStreamForFeed) {
        currentLiveVideoElement.srcObject = currentStreamForFeed;
      }
      currentLiveVideoElement.play().catch(e => console.warn("Live video play interrupted:", e));

      setCurrentRecordingDuration(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => {
        setCurrentRecordingDuration(prev => prev + 1);
      }, 1000);

    } else if (!isRecording) {
      if (currentLiveVideoElement && currentLiveVideoElement.srcObject) {
        cleanupStreamTracks(currentLiveVideoElement.srcObject as MediaStream);
        currentLiveVideoElement.srcObject = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      // This cleanup is important if the component unmounts while recording
      if (currentStreamForFeed && isRecording) { // Check isRecording React state here
        cleanupStreamTracks(currentStreamForFeed);
      }
    };
  }, [isRecording, mediaType, streamForVideoFeed, cleanupStreamTracks]);


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

  const handleStartRecording = async (type: 'video' | 'audio') => {
    if (isRecording || !checkHostPass()) return;

    revokeCurrentInternalPreviewUrl();
    setRecordedFile(null); setInternalPreviewUrl(null); setMediaType(type); setStartTime(0); setEndTime(0); setMediaDuration(0); setMediaSize(0);
    latestTrimValuesRef.current = { startTime: 0, endTime: 0 }; recordedChunks.current = [];

    cleanupStreamTracks(streamForVideoFeed); 
    const streamForNewRecording = await getPermissions(type);

    if (!streamForNewRecording || !streamForNewRecording.active) {
      cleanupStreamTracks(streamForNewRecording); 
      setStreamForVideoFeed(null);
      return;
    }

    setStreamForVideoFeed(streamForNewRecording); 
    setMediaType(type); 

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
      const recorder = new window.MediaRecorder(streamForNewRecording);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunks.current.push(event.data); };

      recorder.onstop = () => {
        setShowTeleprompter(false);
        setCurrentTeleprompterScript(null);

        const currentRecordedChunks = recordedChunks.current;
        recordedChunks.current = []; 

        if (currentRecordedChunks.length === 0) {
          setTimeout(() => toast({ variant: 'destructive', title: 'No Data Recorded', description: 'The recording seems to be empty. Please try again, ensuring your microphone/camera is active.', duration: 7000 }), 0);
          cleanupStreamTracks(streamForNewRecording);
          setStreamForVideoFeed(null);
          setIsRecording(false);
          mediaRecorderRef.current = null;
          return;
        }

        const blobMimeType = type === 'video' ? 'video/webm' : 'audio/webm';
        const blob = new Blob(currentRecordedChunks, { type: blobMimeType });

        if (blob.size < 1024) { 
          setTimeout(() => toast({ variant: 'destructive', title: 'Recording Error', description: 'Recorded data is too small or corrupted. Please try a longer recording.', duration: 7000 }), 0);
          cleanupStreamTracks(streamForNewRecording);
          setStreamForVideoFeed(null);
          setIsRecording(false);
          mediaRecorderRef.current = null;
          return;
        }

        const file = new File([blob], `recording.${type === 'video' ? 'webm' : 'webm'}`, { type: blob.type });

        if (!checkStorageQuota(file.size)) {
          cleanupStreamTracks(streamForNewRecording);
          setStreamForVideoFeed(null);
          setIsRecording(false);
          mediaRecorderRef.current = null;
          return;
        }

        const url = URL.createObjectURL(blob);
        const tempMediaElement = document.createElement(type);
        tempMediaElement.preload = "metadata";
        tempMediaElement.src = url;

        tempMediaElement.onloadedmetadata = () => {
          const newDuration = tempMediaElement.duration;
          URL.revokeObjectURL(url); 

          if (!isFinite(newDuration) || newDuration <= 0) {
            let errorDescription = 'Failed to read valid duration from recording. Media might be incomplete or corrupted.';
            if (newDuration === Infinity) {
              errorDescription = 'The recording\'s duration could not be determined (reported as infinite). This can happen with very short or interrupted recordings. Please try again.';
            }
            console.error("MediaRecorder onloadedmetadata: Duration is invalid. Read value:", newDuration);
            setTimeout(() => toast({ variant: 'destructive', title: 'Recording Processing Error', description: errorDescription, duration: 8000 }), 0);
            cleanupStreamTracks(streamForNewRecording);
            setStreamForVideoFeed(null);
            setIsRecording(false);
            mediaRecorderRef.current = null;
            return;
          }

          const currentMaxRawDuration = type === 'video' ? MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS : MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS;
          const currentMaxTrimmedDuration = type === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;

          if (newDuration > currentMaxRawDuration) {
            setTimeout(() => toast({ variant: 'destructive', title: `${type.charAt(0).toUpperCase() + type.slice(1)} Too Long`, description: `Recording is ${formatSecondsToTime(newDuration)}. Maximum allowed is ${formatSecondsToTime(currentMaxRawDuration)} (including trim buffer). Please re-record a shorter segment.`, duration: 10000 }), 0);
            cleanupStreamTracks(streamForNewRecording);
            setStreamForVideoFeed(null);
            setIsRecording(false);
            mediaRecorderRef.current = null;
            return;
          }

          const newObjectUrlForPreview = URL.createObjectURL(blob);
          setRecordedFile(file); setInternalPreviewUrl(newObjectUrlForPreview); setMediaDuration(newDuration); setMediaSize(file.size);
          setStartTime(0); setEndTime(newDuration); latestTrimValuesRef.current = { startTime: 0, endTime: newDuration };

          if (newDuration > currentMaxTrimmedDuration) {
            setTimeout(() => toast({ title: "Recording Complete - Trimming Required", description: `Your ${formatSecondsToTime(newDuration)} recording needs to be trimmed to ${formatSecondsToTime(currentMaxTrimmedDuration)} or less.`, duration: 10000, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> }),0);
          } else {
            setTimeout(() => toast({ title: "Recording Complete!", description: `Duration: ${formatSecondsToTime(newDuration)}.` }),0);
          }
          cleanupStreamTracks(streamForNewRecording); 
          setStreamForVideoFeed(null);
          setIsRecording(false);
          mediaRecorderRef.current = null;
        };

        tempMediaElement.onerror = () => {
            URL.revokeObjectURL(url);
            console.error(`MediaRecorder tempMediaElement.onerror: Failed to load metadata for ${type}. Blob URL might be invalid or media corrupted. Size: ${blob.size}, Type: ${blob.type}`);
            cleanupStreamTracks(streamForNewRecording);
            setStreamForVideoFeed(null);
            setIsRecording(false);
            mediaRecorderRef.current = null;
            setTimeout(() => toast({ variant: 'destructive', title: 'Media Loading Error', description: `Could not load the recorded ${type} for processing. It might be corrupted or in an unsupported format.`, duration: 7000 }), 0);
        };
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        cleanupStreamTracks(streamForNewRecording);
        setStreamForVideoFeed(null);
        setShowTeleprompter(false);
        setCurrentTeleprompterScript(null);
        setIsRecording(false);
        mediaRecorderRef.current = null;
        setTimeout(() => toast({ variant: 'destructive', title: 'Recording Error', description: 'Something went wrong during recording. Please try again.' }), 0);
      };
      recorder.start();
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
      setTimeout(() => toast({ variant: 'destructive', title: 'Recording Setup Failed', description: 'Could not start recording. Check device compatibility or permissions.' }), 0);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); 
      // setIsRecording(false) is now primarily handled in onstop/onerror
    } else {
      if (isRecording) { 
          setIsRecording(false); // Force UI reset if React state is desynced
          setShowTeleprompter(false);
          setCurrentTeleprompterScript(null);
          cleanupStreamTracks(streamForVideoFeed); // Use the state variable here as streamForNewRecording is out of scope
          setStreamForVideoFeed(null);
          mediaRecorderRef.current = null;
      }
    }
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
      if (!fileType) { setTimeout(() => toast({ title: "Invalid File Type", description:"Please upload a valid video or audio file.", variant: "destructive" }), 0); return; }
      if (!checkStorageQuota(file.size)) { event.target.value = ''; return; }

      revokeCurrentInternalPreviewUrl();
      setRecordedFile(null); setInternalPreviewUrl(null);
      cleanupStreamTracks(streamForVideoFeed); setStreamForVideoFeed(null);

      const url = URL.createObjectURL(file);
      const tempMediaElement = document.createElement(fileType); tempMediaElement.src = url;
      tempMediaElement.onloadedmetadata = () => {
        const newDuration = tempMediaElement.duration;
        URL.revokeObjectURL(url);

        if (!isFinite(newDuration) || newDuration <= 0) {
          setTimeout(() => toast({ variant: 'destructive', title: 'File Error', description: 'Could not determine a valid duration for the uploaded file. It might be corrupted or unsupported.', duration: 7000 }), 0);
          event.target.value = ''; return;
        }

        const currentMaxRawDuration = fileType === 'video' ? MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS : MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS;
        const currentMaxTrimmedDuration = fileType === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;

        if (newDuration > currentMaxRawDuration) {
          setTimeout(() => toast({ variant: 'destructive', title: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} Too Long`, description: `Uploaded file is ${formatSecondsToTime(newDuration)}. Maximum allowed is ${formatSecondsToTime(currentMaxRawDuration)} (including trim buffer). Please upload a shorter file or trim it first.`, duration: 10000 }), 0);
          event.target.value = ''; return;
        }

        const newObjectUrlForPreview = URL.createObjectURL(file);
        setMediaType(fileType); setRecordedFile(file); setInternalPreviewUrl(newObjectUrlForPreview); setMediaDuration(newDuration); setMediaSize(file.size);
        setStartTime(0); setEndTime(newDuration); latestTrimValuesRef.current = { startTime: 0, endTime: newDuration };

        if (newDuration > currentMaxTrimmedDuration) {
          setTimeout(() => toast({ title: "File Uploaded - Trimming Required", description: `Your ${formatSecondsToTime(newDuration)} file needs to be trimmed to ${formatSecondsToTime(currentMaxTrimmedDuration)} or less.`, duration: 10000, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> }), 0);
        } else {
          setTimeout(() => toast({ title: "File Uploaded", description: `${file.name} (${formatSecondsToTime(newDuration)})` }), 0);
        }
      };
      tempMediaElement.onerror = () => {
        URL.revokeObjectURL(url); event.target.value = '';
        setTimeout(() => toast({ title: "Error Loading File", description: "Could not load the uploaded file. It might be corrupted or an unsupported format.", variant: "destructive" }),0);
      };
    }
  };

  const handleLoadSampleMedia = async (type: 'video' | 'audio') => {
    if (!checkHostPass()) return;
    setIsLoadingSample(true); setSampleLoadingType(type);
    revokeCurrentInternalPreviewUrl();
    setRecordedFile(null); setInternalPreviewUrl(null);
    cleanupStreamTracks(streamForVideoFeed); setStreamForVideoFeed(null);

    const sampleUrl = type === 'video' ? SAMPLE_VIDEO_URL : SAMPLE_AUDIO_URL;
    const filename = type === 'video' ? 'sample_video.mp4' : 'sample_audio.mp3';
    const mimeType = type === 'video' ? 'video/mp4' : 'audio/mpeg';
    try {
      const response = await fetch(sampleUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: mimeType });
      if (!checkStorageQuota(file.size)) { setIsLoadingSample(false); setSampleLoadingType(null); return; }

      const tempMediaElement = document.createElement(type);
      const tempUrl = URL.createObjectURL(blob);
      tempMediaElement.src = tempUrl;
      tempMediaElement.preload = "metadata";

      tempMediaElement.onloadedmetadata = () => {
        const actualDuration = tempMediaElement.duration;
        URL.revokeObjectURL(tempUrl);

        if (!isFinite(actualDuration) || actualDuration <= 0) {
          setTimeout(() => toast({ variant: 'destructive', title: 'Sample Error', description: 'Could not determine a valid duration for the sample media.', duration: 7000 }), 0);
          setIsLoadingSample(false); setSampleLoadingType(null); return;
        }

        const currentMaxRawDuration = type === 'video' ? MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS : MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS;
        const currentMaxTrimmedDuration = type === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;

        if (actualDuration > currentMaxRawDuration) {
          setTimeout(() => toast({ variant: 'destructive', title: `Sample ${type.charAt(0).toUpperCase() + type.slice(1)} Too Long`, description: `Sample is ${formatSecondsToTime(actualDuration)}. Max allowed is ${formatSecondsToTime(currentMaxRawDuration)}. Cannot load.`, duration: 10000 }), 0);
          handleDiscardMedia(false); setIsLoadingSample(false); setSampleLoadingType(null); return;
        }

        const newInternalBlobUrl = URL.createObjectURL(blob);
        setMediaType(type); setRecordedFile(file); setInternalPreviewUrl(newInternalBlobUrl); setMediaDuration(actualDuration); setMediaSize(file.size);
        setStartTime(0); setEndTime(actualDuration); latestTrimValuesRef.current = { startTime: 0, endTime: actualDuration };

        if (actualDuration > currentMaxTrimmedDuration) {
           setTimeout(() => toast({ title: `Sample ${type} Loaded - Trimming Required`, description: `Sample is ${formatSecondsToTime(actualDuration)}. Needs trim to ${formatSecondsToTime(currentMaxTrimmedDuration)} or less.`, duration: 10000, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> }), 0);
        } else {
           setTimeout(() => toast({ title: `Sample ${type} loaded`, description: `${filename} (${formatSecondsToTime(actualDuration)})` }), 0);
        }
      };
      tempMediaElement.onerror = () => {
        URL.revokeObjectURL(tempUrl); handleDiscardMedia(false);
        setTimeout(() => toast({ title: "Error Loading Sample", description: "Could not load the sample media.", variant: "destructive" }),0);
      };
    } catch (error) {
      console.error(`Error loading sample ${type}:`, error);
      setTimeout(() => toast({ variant: 'destructive', title: `Failed to Load Sample ${type.charAt(0).toUpperCase() + type.slice(1)}` }), 0);
    } finally { setIsLoadingSample(false); setSampleLoadingType(null); }
  };

  const handleUseMedia = () => {
    if (!checkHostPass()) return;
    const currentStartTime = latestTrimValuesRef.current.startTime; const currentEndTime = latestTrimValuesRef.current.endTime;
    if (currentStartTime > currentEndTime && currentEndTime > 0) { setTimeout(() => toast({ title: "Invalid Trim: Start after End", variant: "destructive" }), 0); return; }
    if (currentStartTime === currentEndTime && currentStartTime >= 0 && mediaDuration > 0 ) { setTimeout(() => toast({ title: "Invalid Trim: Start equals End, or zero duration segment", variant: "destructive" }), 0); return; }
    if (currentEndTime > mediaDuration && mediaDuration > 0) { setTimeout(() => toast({ title: "Invalid End Time", description: `End (${formatSecondsToTime(currentEndTime)}) > duration (${formatSecondsToTime(mediaDuration)}).`, variant: "destructive" }), 0); return; }

    const selectedSegmentDuration = currentEndTime - currentStartTime;
    const currentMaxTrimmedDuration = mediaType === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;

    if (selectedSegmentDuration > currentMaxTrimmedDuration) {
      setTimeout(() => toast({ title: `Trimmed ${mediaType} Exceeds Limit`, description: `Selected segment is ${formatSecondsToTime(selectedSegmentDuration)}. Max allowed is ${formatSecondsToTime(currentMaxTrimmedDuration)}. Please trim further.`, variant: "destructive", duration: 10000 }), 0); return;
    }
    if (selectedSegmentDuration <= 0 && mediaDuration > 0) {
       setTimeout(() => toast({ title: "Invalid Trim", description: "Selected segment has zero or negative duration. Please adjust trim.", variant: "destructive" }), 0); return;
    }

    if (recordedFile && mediaType && (mediaDuration > 0 || (mediaDuration === 0 && currentStartTime === 0 && currentEndTime ===0) )) {
      onMediaReady({ file: recordedFile, type: mediaType, startTime: currentStartTime, endTime: currentEndTime, duration: mediaDuration, size: mediaSize });
      const isTrimmed = (currentStartTime > 0.01) || (mediaDuration && Math.abs(currentEndTime - mediaDuration) > 0.01 && currentEndTime < mediaDuration);
      let toastDesc = isTrimmed ? `Media selected, trimmed: ${formatSecondsToTime(currentStartTime)} to ${formatSecondsToTime(currentEndTime)}.` : "Media selected.";
      setTimeout(() => toast({ title: "Media Ready", description: toastDesc, icon: <CheckCircle className="h-4 w-4" /> }), 0);
    } else if (!recordedFile && initialMedia && mediaType) {
      const placeholderFile = new File([], initialMedia.previewUrl.split('/').pop() || "existing_media_placeholder", {type: mediaType === "video" ? "video/mp4" : "audio/mp3"});
      onMediaReady({ file: placeholderFile, type: mediaType, startTime: currentStartTime, endTime: currentEndTime, duration: mediaDuration, size: mediaSize });
      const isTrimmed = (currentStartTime > 0.01) || (mediaDuration && Math.abs(currentEndTime - mediaDuration) > 0.01 && currentEndTime < mediaDuration);
      let toastDesc = isTrimmed ? `Existing media trim updated: ${formatSecondsToTime(currentStartTime)} to ${formatSecondsToTime(currentEndTime)}.` : (mediaDuration > 0 ? "Existing media used in full." : "Existing media re-selected.");
       setTimeout(() => toast({ title: "Media Updated", description: toastDesc, icon: <CheckCircle className="h-4 w-4" /> }), 0);
    } else { setTimeout(() => toast({ title: "Media Not Ready", variant: "destructive" }), 0); }
  };

  const handleDiscardMedia = (showToast = true) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop(); 
    } else {
      cleanupStreamTracks(streamForVideoFeed);
      setStreamForVideoFeed(null);
    }
    if (isRecording) setIsRecording(false); 
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
    let streamToCleanOnUnmount = streamForVideoFeed;
    return () => {
      cleanupStreamTracks(streamToCleanOnUnmount);
      if (internalPreviewUrl && internalPreviewUrl.startsWith('blob:') && internalPreviewUrl !== initialMedia?.previewUrl) {
        URL.revokeObjectURL(internalPreviewUrl);
      }
    };
  }, [streamForVideoFeed, internalPreviewUrl, cleanupStreamTracks, initialMedia?.previewUrl]);

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

  const currentFinalMaxDuration = mediaType === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;

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
                <label htmlFor="media-upload" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${canRecordOrUpload ? 'cursor-pointer bg-muted hover:bg-secondary' : 'bg-muted/50 cursor-not-allowed'}`}><div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" /><p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or D&D</p><p className="text-xs text-muted-foreground">Video (max {formatSecondsToTime(MAX_TRIMMED_VIDEO_DURATION_SECONDS)}) / Audio (max {formatSecondsToTime(MAX_TRIMMED_AUDIO_DURATION_SECONDS)})</p></div><Input id="media-upload" type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*" disabled={isRecording || !canRecordOrUpload} aria-label="Upload video or audio file" /></label>
              </div>
            </div>
            <div className="md:col-span-3 pt-2 border-t"><p className="text-sm text-muted-foreground mb-2 text-center">Or, load a sample to test:</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Button onClick={() => handleLoadSampleMedia('video')} variant="secondary" size="sm" disabled={isLoadingSample || !canRecordOrUpload} aria-label="Load sample video">{isLoadingSample && sampleLoadingType === 'video' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}Sample Video</Button><Button onClick={() => handleLoadSampleMedia('audio')} variant="secondary" size="sm" disabled={isLoadingSample || !canRecordOrUpload} aria-label="Load sample audio">{isLoadingSample && sampleLoadingType === 'audio' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Waves className="mr-2 h-4 w-4" />}Sample Audio</Button></div></div>
          </div>
        )}

        {isRecording && mediaType === 'video' && liveVideoRef && (<video ref={liveVideoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />)}
        {isRecording && (
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center text-sm text-primary animate-pulse">
                    <Timer className="mr-2 h-4 w-4" />
                    {mediaType === 'video' ? 'Video' : 'Audio'} Recording: {formatSecondsToTime(currentRecordingDuration)}
                </div>
                <Button onClick={handleStopRecording} variant="destructive" className="w-full md:w-auto" aria-label="Stop recording">
                    <StopCircle className="mr-2 h-4 w-4" /> Stop
                </Button>
            </div>
        )}

        {internalPreviewUrl && !isRecording && mediaType && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Media: <span className="text-primary">{recordedFile?.name || (initialMedia?.previewUrl === internalPreviewUrl ? "Existing media" : 'Recorded Media')}</span>{mediaDuration > 0 && ` (Full: ${formatSecondsToTime(mediaDuration)})`}</p>
            {mediaType === 'video' ? (<video ref={videoRef} src={internalPreviewUrl} controls className="w-full aspect-video rounded-md bg-muted object-cover" onLoadedMetadata={handleVideoLoadedMetadata} key={internalPreviewUrl} preload="metadata"/>) : (<audio ref={audioPreviewRef} src={internalPreviewUrl} controls className="w-full" onLoadedMetadata={handleVideoLoadedMetadata} key={internalPreviewUrl} preload="metadata"/>)}
            {(mediaDuration > 0 || (mediaDuration === 0 && startTime === 0 && endTime ===0)) && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm"><span className="text-green-500">Start: {formatSecondsToTime(startTime)}</span><span className="text-red-500">End: {formatSecondsToTime(endTime)}</span></div>
                <div className="text-center my-2 space-y-0.5"><span className="text-lg font-bold text-primary">Trimmed: {formatSecondsToTime(Math.max(0, endTime - startTime))}</span>{mediaType && (<p className="text-sm text-muted-foreground">(Final Max Allowed: {formatSecondsToTime(currentFinalMaxDuration)})</p>)}</div>
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

