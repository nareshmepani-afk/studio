
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Video, StopCircle, UploadCloud, RotateCcw, CheckCircle, AlertTriangle, Film, Waves, Loader2, ShieldAlert, BookOpen, Timer, PlayCircle, PauseCircle, Eye, EyeOff } from 'lucide-react';
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
  
  const [rawPreviewReady, setRawPreviewReady] = useState(false);

  const canRecordOrUpload = hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';

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
      setTimeout(() => toast({ variant: 'destructive', title: 'Permissions Denied', description: `Please enable ${type === 'video' ? 'camera and microphone' : 'microphone'} permissions in your browser settings to use this feature. You may need to refresh the page.`, duration: 7000 }), 0);
      return null;
    }
  }, []);


  useEffect(() => {
    let currentLiveVideoElement = liveVideoRef.current;

    if (isRecording && mediaType === 'video' && streamForVideoFeed && currentLiveVideoElement) {
      if(currentLiveVideoElement.srcObject !== streamForVideoFeed) {
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
      
      if (type === 'video') { for (const mime of preferredVideoMimeTypes) { if (MediaRecorder.isTypeSupported(mime)) { selectedMimeType = mime; break; } } }
      else if (type === 'audio') { for (const mime of preferredAudioMimeTypes) { if (MediaRecorder.isTypeSupported(mime)) { selectedMimeType = mime; break; } } }

      const recorderOptions = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      console.log(`Attempting to use MediaRecorder with options: `, recorderOptions || "Browser default for " + type);

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
        console.log("Blob created from chunks:", {size: blob.size, type: blob.type});

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
            setRawPreviewReady(true); // Enable raw preview mode
            setMediaDuration(0); 
            setStartTime(0);
            setEndTime(0);
            latestTrimValuesRef.current = { startTime: 0, endTime: 0 };
        });

        setTimeout(() => toast({ title: "Recording Complete!", description: "Preview your raw recording and click 'Accept Recording' to proceed." }), 0);
        cleanupAndFinalizeRecording(streamForNewRecording); 
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        cleanupAndFinalizeRecording(streamForNewRecording); 
        setTimeout(() => toast({ variant: 'destructive', title: 'Recording Error', description: 'Something went wrong during recording. Please try again.' }), 0);
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


  const handleAcceptRawRecording = () => {
    const mediaElement = mediaType === 'video' ? videoRef.current : audioPreviewRef.current;
    if (!mediaElement || !internalPreviewUrl) {
      toast({variant: 'destructive', title: 'Preview Error', description: 'No media to accept.'});
      return;
    }
  
    const processDuration = (durationValue: number) => {
      if (isFinite(durationValue) && durationValue > 0) {
        const currentMaxRawDuration = mediaType === 'video' ? MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS : MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS;
        const currentMaxTrimmedDuration = mediaType === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;
  
        if (durationValue > currentMaxRawDuration) {
          setTimeout(() => toast({ variant: 'destructive', title: `${mediaType === 'video' ? 'Video' : 'Audio'} Too Long`, description: `Recording is ${formatSecondsToTime(durationValue)}. Maximum allowed is ${formatSecondsToTime(currentMaxRawDuration)}. Please re-record or upload a shorter segment.`, duration: 10000 }), 0);
          handleDiscardMedia(false); // Discard and reset
          return;
        }
        
        setMediaDuration(durationValue);
        setEndTime(durationValue);
        setStartTime(0);
        latestTrimValuesRef.current = { startTime: 0, endTime: durationValue };
        mediaElement.currentTime = 0;
        setRawPreviewReady(false); // Move out of raw preview mode
  
        if (durationValue > currentMaxTrimmedDuration) {
          setTimeout(() => toast({ title: "Media Ready for Trimming", description: `Your ${formatSecondsToTime(durationValue)} ${mediaType} needs to be trimmed to ${formatSecondsToTime(currentMaxTrimmedDuration)} or less.`, duration: 10000, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> }), 0);
        } else {
          setTimeout(() => toast({ title: "Media Accepted", description: `Duration: ${formatSecondsToTime(durationValue)}. You can now trim or use the media.` }), 0);
        }
      } else {
        let errorDescription = 'Failed to read valid duration from the recording. It might be incomplete or corrupted.';
        if (durationValue === Infinity) {
          errorDescription = 'The recording\'s duration could not be determined (reported as infinite). This can happen with very short or interrupted recordings. Please try again.';
        }
        console.error("Raw Preview Accept onloadedmetadata: Duration is invalid. Read value:", durationValue);
        setTimeout(() => toast({ variant: 'destructive', title: 'Recording Processing Error', description: errorDescription, duration: 8000 }), 0);
        handleDiscardMedia(false); // Discard and reset
      }
    };
  
    let initialDuration = mediaElement.duration;
  
    if (!isFinite(initialDuration) || initialDuration <= 0) {
      console.warn("Raw Preview Accept: Initial duration read is invalid:", initialDuration, ". Will try again after short delay.");
      setTimeout(() => {
        let delayedDuration = mediaElement.duration;
        console.log("Raw Preview Accept: Duration after 200ms delay:", delayedDuration);
        processDuration(delayedDuration);
      }, 200);
    } else {
      processDuration(initialDuration);
    }
  };


  const handleVideoLoadedMetadata = (event: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement, Event>) => {
    if (rawPreviewReady) return; 
    
    const currentTarget = event.currentTarget;
    const newDuration = currentTarget.duration;

    if (internalPreviewUrl && internalPreviewUrl === currentTarget.src) { 
        if (isFinite(newDuration) && newDuration > 0) {
            const currentMaxRawDuration = mediaType === 'video' ? MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS : MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS;
            const currentMaxTrimmedDuration = mediaType === 'video' ? MAX_TRIMMED_VIDEO_DURATION_SECONDS : MAX_TRIMMED_AUDIO_DURATION_SECONDS;

            if (newDuration > currentMaxRawDuration) {
                setTimeout(() => toast({ variant: 'destructive', title: `${mediaType === 'video' ? 'Video' : 'Audio'} Too Long`, description: `Recording is ${formatSecondsToTime(newDuration)}. Maximum allowed is ${formatSecondsToTime(currentMaxRawDuration)}. Please re-record or upload a shorter segment.`, duration: 10000 }), 0);
                handleDiscardMedia(false);
                return;
            }
            
            setMediaDuration(newDuration);
            if (!recordedFile && initialMedia && initialMedia.previewUrl === internalPreviewUrl) {
                 const initStartTime = initialMedia.startTime || 0;
                 const initEndTime = initialMedia.endTime !== undefined ? initialMedia.endTime : newDuration;
                 setStartTime(initStartTime);
                 setEndTime(initEndTime);
                 latestTrimValuesRef.current = { startTime: initStartTime, endTime: initEndTime };
                 currentTarget.currentTime = initStartTime;
            } else {
                 setEndTime(newDuration);
                 setStartTime(0);
                 latestTrimValuesRef.current = { startTime: 0, endTime: newDuration };
                 currentTarget.currentTime = 0;
            }


            if (newDuration > currentMaxTrimmedDuration) {
                setTimeout(() => toast({ title: "Media Loaded - Trimming Required", description: `Your ${formatSecondsToTime(newDuration)} ${mediaType} needs to be trimmed to ${formatSecondsToTime(currentMaxTrimmedDuration)} or less.`, duration: 10000, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> }), 0);
            } else {
                setTimeout(() => toast({ title: "Media Ready for Trimming", description: `Duration: ${formatSecondsToTime(newDuration)}.` }), 0);
            }

        } else {
            let errorDescription = 'Failed to read valid duration from the media. It might be incomplete or corrupted.';
            if (newDuration === Infinity) {
                errorDescription = 'The media\'s duration could not be determined (reported as infinite). Please try again if this was a recording.';
            }
            console.error("Main Preview onloadedmetadata: Duration is invalid. Read value:", newDuration);
            setTimeout(() => toast({ variant: 'destructive', title: 'Media Processing Error', description: errorDescription, duration: 8000 }), 0);
            handleDiscardMedia(false);
        }
    } else if (initialMedia && initialMedia.previewUrl === currentTarget.src && mediaDuration === 0 && initialMedia.duration) {
        const initialLoadedDuration = initialMedia.duration;
        const initialLoadedEndTime = initialMedia.endTime !== undefined ? initialMedia.endTime : initialLoadedDuration;
        setMediaDuration(initialLoadedDuration);
        setEndTime(initialLoadedEndTime);
        setMediaSize(initialMedia.size || 0);
        setStartTime(initialMedia.startTime || 0);
        latestTrimValuesRef.current = { startTime: initialMedia.startTime || 0, endTime: initialLoadedEndTime };
        currentTarget.currentTime = initialMedia.startTime || 0;
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

    const sampleUrl = type === 'video' ? SAMPLE_VIDEO_URL : SAMPLE_AUDIO_URL;
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
    } else { setTimeout(() => toast({ title: "Media Not Ready", description: "Please record or upload valid media before proceeding.", variant: "destructive" }), 0); }
  };

  const handleDiscardMedia = (showToast = true) => {
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
  };
  
  const performDiscardReset = (showToast: boolean) => {
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
                <label htmlFor="media-upload" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${canRecordOrUpload ? 'cursor-pointer bg-muted hover:bg-secondary' : 'bg-muted/50 cursor-not-allowed'}`}><div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" /><p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or D&D</p><p className="text-xs text-muted-foreground">Video (max {formatSecondsToTime(MAX_RAW_VIDEO_RECORDING_DURATION_SECONDS)}) / Audio (max {formatSecondsToTime(MAX_RAW_AUDIO_RECORDING_DURATION_SECONDS)})</p></div><Input id="media-upload" type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*" disabled={isRecording || !canRecordOrUpload} aria-label="Upload video or audio file" /></label>
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
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={handleStopRecording} variant="destructive" className="w-full sm:w-auto" aria-label="Stop recording">
                        <StopCircle className="mr-2 h-4 w-4" /> Stop
                    </Button>
                    {currentTeleprompterScript && (
                        <Button variant="outline" onClick={() => setShowTeleprompter(prev => !prev)} className="w-full sm:w-auto" aria-label={showTeleprompter ? "Hide recording cue" : "Show recording cue"}>
                            {showTeleprompter ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                            {showTeleprompter ? "Hide Cue" : "Show Cue"}
                        </Button>
                    )}
                </div>
            </div>
        )}

        {internalPreviewUrl && !isRecording && mediaType && (
          <div className="space-y-4">
            {mediaType === 'video' ? (
                <video ref={videoRef} src={internalPreviewUrl} controls className="w-full aspect-video rounded-md bg-muted object-cover" onLoadedMetadata={handleVideoLoadedMetadata} key={internalPreviewUrl} preload="metadata"/>
            ) : (
                <audio ref={audioPreviewRef} src={internalPreviewUrl} controls className="w-full" onLoadedMetadata={handleVideoLoadedMetadata} key={internalPreviewUrl} preload="metadata"/>
            )}

            <p className="text-sm font-medium">Media: <span className="text-primary">{recordedFile?.name || (initialMedia?.previewUrl === internalPreviewUrl ? "Existing media" : 'Recorded Media')}</span>
              {rawPreviewReady && (<span className="text-muted-foreground"> (Raw Preview)</span>)}
              {!rawPreviewReady && mediaDuration > 0 && ` (Full: ${formatSecondsToTime(mediaDuration)})`}
            </p>

            {rawPreviewReady && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button onClick={handleAcceptRawRecording} className="w-full sm:w-auto flex-1" aria-label="Accept this recording and proceed to trimming"><PlayCircle className="mr-2 h-4 w-4" /> Accept Recording</Button>
                <Button onClick={() => handleDiscardMedia(true)} variant="outline" className="w-full sm:w-auto flex-1" aria-label="Discard current recording and re-do"><RotateCcw className="mr-2 h-4 w-4" /> Discard & Re-do</Button>
              </div>
            )}

            {!rawPreviewReady && mediaDuration > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm"><span className="text-green-500">Start: {formatSecondsToTime(startTime)}</span><span className="text-red-500">End: {formatSecondsToTime(endTime)}</span></div>
                <div className="text-center my-2 space-y-0.5"><span className="text-lg font-bold text-primary">Trimmed: {formatSecondsToTime(Math.max(0, endTime - startTime))}</span>{mediaType && (<p className="text-sm text-muted-foreground">(Final Max Allowed: {formatSecondsToTime(currentFinalMaxDuration)})</p>)}</div>
                <Slider disabled={mediaDuration === 0} value={[startTime, endTime]} onValueChange={(vals) => { setStartTime(vals[0]); setEndTime(vals[1]); latestTrimValuesRef.current = { startTime: vals[0], endTime: vals[1] }; }} min={0} max={mediaDuration || 1} step={0.1} className="w-full" aria-label={`Trim media between ${formatSecondsToTime(startTime)} and ${formatSecondsToTime(endTime)}`} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>{formatSecondsToTime(0)}</span><span>{formatSecondsToTime(mediaDuration || 0)}</span></div>
              </div>
            )}

            {!rawPreviewReady && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button onClick={handleUseMedia} className="w-full sm:w-auto flex-1" disabled={!mediaType || mediaDuration === 0 || !canRecordOrUpload} aria-label="Use this media"><CheckCircle className="mr-2 h-4 w-4" /> Use Media</Button>
                <Button onClick={() => handleDiscardMedia(true)} variant="outline" className="w-full sm:w-auto flex-1" aria-label="Discard current media and re-do"><RotateCcw className="mr-2 h-4 w-4" /> Discard & Re-do</Button>
              </div>
            )}
             
            <div className="mt-6 pt-4 border-t"><p className="text-sm text-muted-foreground mb-2 text-center">Or, load a different sample:</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Button onClick={() => handleLoadSampleMedia('video')} variant="secondary" size="sm" disabled={isLoadingSample || !canRecordOrUpload} aria-label="Load different sample video">{isLoadingSample && sampleLoadingType === 'video' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}Load Sample Video</Button><Button onClick={() => handleLoadSampleMedia('audio')} variant="secondary" size="sm" disabled={isLoadingSample || !canRecordOrUpload} aria-label="Load different sample audio">{isLoadingSample && sampleLoadingType === 'audio' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Waves className="mr-2 h-4 w-4" />}Load Sample Audio</Button></div></div>
          </div>
        )}

        {showTeleprompter && currentTeleprompterScript && (
          <Dialog modal={false} open={showTeleprompter} onOpenChange={(isOpen) => {
              if (!isOpen) {
                  setShowTeleprompter(false);
              }
          }}>
              <DialogContent 
                className={cn(
                  "sm:max-w-md max-h-[70vh] flex flex-col", 
                  "fixed top-4 right-4 bottom-auto left-auto translate-x-0 translate-y-0", 
                  "bg-background/90 backdrop-blur-sm shadow-xl rounded-lg border border-border/50"
                )}
                onInteractOutside={(e) => e.preventDefault()} 
              >
                  <DialogHeader>
                      <DialogTitle className="font-headline text-lg flex items-center"><BookOpen className="mr-2 h-4 w-4 text-primary" />Recording Cue</DialogTitle>
                      <DialogDescription className="text-xs">
                          Scroll through your talking points. You can hide/show this with the button under the timer.
                      </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="flex-grow py-2 pr-2 my-1 border-y">
                      <p className="text-sm whitespace-pre-line">{currentTeleprompterScript}</p>
                  </ScrollArea>
                  <DialogFooter className="pt-2">
                      <Button variant="outline" size="sm" onClick={() => setShowTeleprompter(false)} aria-label="Close teleprompter">Close Prompter</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
    
