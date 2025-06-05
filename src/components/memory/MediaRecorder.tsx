
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Video, StopCircle, UploadCloud, RotateCcw, CheckCircle, AlertTriangle, Film, Waves, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MediaCaptureControlProps {
  onMediaReady: (mediaData: { file: File; type: 'video' | 'audio'; previewUrl: string; startTime?: number; endTime?: number, duration: number }) => void;
  onDiscard: () => void;
  initialMedia?: { type: 'video' | 'audio'; previewUrl: string; startTime?: number; endTime?: number, duration: number };
}

const SAMPLE_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_VIDEO_DURATION = 596.48; // Approximate duration
const SAMPLE_AUDIO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";
const SAMPLE_AUDIO_DURATION = 1.88; // Approximate duration

export function MediaCaptureControl({ onMediaReady, onDiscard, initialMedia }: MediaCaptureControlProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(initialMedia?.type || null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialMedia?.previewUrl || null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<globalThis.MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const [startTime, setStartTime] = useState<number>(initialMedia?.startTime || 0);
  const [endTime, setEndTime] = useState<number>(initialMedia?.endTime || 0);
  const [mediaDuration, setMediaDuration] = useState<number>(initialMedia?.duration || 0);
  
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleLoadingType, setSampleLoadingType] = useState<'video' | 'audio' | null>(null);


  const getPermissions = useCallback(async (type: 'video' | 'audio') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });
      setStream(mediaStream);
      setHasCameraPermission(true);
      if (type === 'video' && liveVideoRef.current) {
        liveVideoRef.current.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasCameraPermission(false);
      setTimeout(() => {
        toast({
          variant: 'destructive',
          title: 'Permissions Denied',
          description: `Please enable ${type === 'video' ? 'camera and microphone' : 'microphone'} permissions in your browser settings.`,
        });
      }, 0);
      return null;
    }
  }, []);

  const cleanupStream = useCallback((streamToClean: MediaStream | null) => {
    if (streamToClean) {
      streamToClean.getTracks().forEach(track => track.stop());
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const handleStartRecording = async (type: 'video' | 'audio') => {
    if (isRecording) return;

    setRecordedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setMediaType(type);
    setStartTime(0);
    setEndTime(0);
    setMediaDuration(0);
    recordedChunks.current = [];

    cleanupStream(stream);
    setStream(null);

    const currentStream = await getPermissions(type);
    if (!currentStream) {
      setIsRecording(false);
      return;
    }
    
    if (!currentStream.active) {
        console.error("Stream is not active before initializing MediaRecorder.");
        setTimeout(() => {
            toast({ variant: 'destructive', title: 'Stream Error', description: 'The media stream is not active. Please try again.' });
        }, 0);
        cleanupStream(currentStream);
        setStream(null);
        setIsRecording(false);
        return;
    }

    try {
      const recorder = new window.MediaRecorder(currentStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = type === 'video' ? 'video/webm' : 'audio/webm';
        const blob = new Blob(recordedChunks.current, { type: mime });
        const file = new File([blob], `recording.${type === 'video' ? 'webm' : 'ogg'}`, { type: mime });
        const url = URL.createObjectURL(blob);
        
        setRecordedFile(file);
        setPreviewUrl(url);
        setIsRecording(false); 

        const tempMediaElement = document.createElement(type);
        tempMediaElement.src = url;
        tempMediaElement.onloadedmetadata = () => {
          setMediaDuration(tempMediaElement.duration);
          setEndTime(tempMediaElement.duration); 
        };
        
        cleanupStream(currentStream);
        setStream(null); 
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setTimeout(() => {
          toast({ variant: 'destructive', title: 'Recording Error', description: `An error occurred during recording: ${(event as any)?.error?.name || 'Unknown error'}` });
        }, 0);
        setIsRecording(false);
        cleanupStream(currentStream);
        setStream(null);
      };

      recorder.start();
      setIsRecording(true); 
      setTimeout(() => {
        toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} recording started.` });
      },0);

    } catch (err) {
      console.error("Error initializing or starting MediaRecorder:", err);
      setTimeout(() => {
         toast({ variant: 'destructive', title: 'Recording Setup Failed', description: 'Could not start recording. Please check permissions and device.' });
      }, 0);
      setIsRecording(false);
      cleanupStream(currentStream); 
      setStream(null);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      cleanupStream(stream);
      setStream(null);
    }
  };
  
  const handleVideoLoadedMetadata = (event: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement, Event>) => {
     if (previewUrl && !mediaDuration && initialMedia?.previewUrl !== previewUrl) {
        const duration = event.currentTarget.duration;
        if (duration && isFinite(duration)) {
            setMediaDuration(duration);
            if (!initialMedia || initialMedia.endTime === undefined || initialMedia.endTime === 0 || initialMedia.previewUrl !== previewUrl) {
                 setEndTime(duration);
            }
        }
     } else if (previewUrl && initialMedia?.previewUrl === previewUrl && mediaDuration === 0 && initialMedia.duration) {
        setMediaDuration(initialMedia.duration);
        setEndTime(initialMedia.endTime !== undefined ? initialMedia.endTime : initialMedia.duration);
     }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : null;
      if (!type) {
        setTimeout(() => {
          toast({ title: "Invalid File Type", description: "Please upload a video or audio file.", variant: "destructive" });
        }, 0);
        return;
      }
      handleDiscardMedia(false); 

      setMediaType(type);
      setRecordedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      const tempMediaElement = document.createElement(type);
      tempMediaElement.src = url;
      tempMediaElement.onloadedmetadata = () => {
        const newDuration = tempMediaElement.duration;
        if (newDuration && isFinite(newDuration)) {
          setMediaDuration(newDuration);
          setStartTime(0);
          setEndTime(newDuration);
        }
      };
      setTimeout(() => {
        toast({ title: "File Uploaded", description: file.name });
      }, 0);
    }
  };

  const handleLoadSampleMedia = async (type: 'video' | 'audio') => {
    setIsLoadingSample(true);
    setSampleLoadingType(type);
    handleDiscardMedia(false); // Silently discard any current media

    const url = type === 'video' ? SAMPLE_VIDEO_URL : SAMPLE_AUDIO_URL;
    const duration = type === 'video' ? SAMPLE_VIDEO_DURATION : SAMPLE_AUDIO_DURATION;
    const filename = type === 'video' ? 'sample_video.mp4' : 'sample_audio.mp3';
    const mimeType = type === 'video' ? 'video/mp4' : 'audio/mpeg';

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: mimeType });
      const preview = URL.createObjectURL(blob);

      setMediaType(type);
      setRecordedFile(file);
      setPreviewUrl(preview);
      setMediaDuration(duration);
      setStartTime(0);
      setEndTime(duration);
      setTimeout(() => {
        toast({ title: `Sample ${type} loaded`, description: filename });
      }, 0);
    } catch (error) {
      console.error(`Error loading sample ${type}:`, error);
      setTimeout(() => {
        toast({ variant: 'destructive', title: `Failed to load sample ${type}`, description: 'Please check your connection or try again.' });
      }, 0);
    } finally {
      setIsLoadingSample(false);
      setSampleLoadingType(null);
    }
  };


  const handleUseMedia = () => {
    if (recordedFile && previewUrl && mediaType && (mediaDuration > 0 || (mediaDuration === 0 && startTime === 0 && endTime ===0) )) { 
      if (startTime > endTime && endTime > 0) { 
        setTimeout(() => {
          toast({ title: "Invalid Trim Times", description: "Start time cannot be after end time.", variant: "destructive" });
        }, 0);
        return;
      }
       if (startTime === endTime && startTime > 0) { 
        setTimeout(() => {
          toast({ title: "Invalid Trim Times", description: "Start time cannot be the same as end time unless both are zero.", variant: "destructive" });
        }, 0);
        return;
      }
      if (endTime > mediaDuration && mediaDuration > 0) { 
         setTimeout(() => {
          toast({ title: "Invalid End Time", description: "End time cannot exceed media duration.", variant: "destructive" });
        }, 0);
        return;
      }

      const isTrimmed = (startTime && startTime > 0.01) || (endTime && mediaDuration && Math.abs(endTime - mediaDuration) > 0.01 && endTime < mediaDuration);
      let toastDescription = "This media will be attached to your memory.";
      if (isTrimmed) {
        toastDescription = `Media will be attached, trimmed from ${startTime.toFixed(1)}s to ${endTime.toFixed(1)}s.`;
      }
      
      onMediaReady({ file: recordedFile, type: mediaType, previewUrl, startTime, endTime, duration: mediaDuration });
      setTimeout(() => {
        toast({ title: "Media Selected", description: toastDescription, icon: <CheckCircle className="h-4 w-4" /> });
      }, 0);

    } else if (!recordedFile && initialMedia && previewUrl && mediaType) { 
       if (startTime > endTime && endTime > 0) {
        setTimeout(() => { toast({ title: "Invalid Trim Times", description: "Start time cannot be after end time.", variant: "destructive" }); }, 0);
        return;
      }
      if (startTime === endTime && startTime > 0) {
         setTimeout(() => { toast({ title: "Invalid Trim Times", description: "Start time cannot be the same as end time unless both are zero.", variant: "destructive" }); }, 0);
        return;
      }
      if (endTime > mediaDuration && mediaDuration > 0) {
         setTimeout(() => { toast({ title: "Invalid End Time", description: "End time cannot exceed media duration.", variant: "destructive" }); }, 0);
        return;
      }
      
      const placeholderFile = new File([], initialMedia.previewUrl.split('/').pop() || "existing_media", {type: mediaType === "video" ? "video/mp4" : "audio/mp3"});
      const isTrimmed = (startTime && startTime > 0.01) || (endTime && mediaDuration && Math.abs(endTime - mediaDuration) > 0.01 && endTime < mediaDuration);
      let toastDescription = "Existing media will be used.";
      if (isTrimmed) {
        toastDescription = `Existing media trim updated: ${startTime.toFixed(1)}s to ${endTime.toFixed(1)}s.`;
      } else if (mediaDuration > 0) {
        toastDescription = "Existing media will be used in full.";
      }
      
      onMediaReady({ file: placeholderFile, type: mediaType, previewUrl, startTime, endTime, duration: mediaDuration });
      setTimeout(() => { toast({ title: "Media Updated", description: toastDescription, icon: <CheckCircle className="h-4 w-4" /> }); }, 0);


    } else {
       setTimeout(() => {
          toast({ title: "Media Not Ready", description: "Please record or upload media first, or ensure duration is loaded.", variant: "destructive" });
        }, 0);
    }
  };

  const handleDiscardMedia = (showToast = true) => {
    setIsRecording(false); 
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop(); 
    } else {
        cleanupStream(stream); 
        setStream(null);
    }
    mediaRecorderRef.current = null; 

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedFile(null);
    setPreviewUrl(initialMedia?.previewUrl || null); 
    setMediaType(initialMedia?.type || null); 
    setStartTime(initialMedia?.startTime || 0);
    const initialEndTime = initialMedia?.endTime;
    const initialDuration = initialMedia?.duration || 0;
    setEndTime(initialEndTime !== undefined ? initialEndTime : initialDuration);
    setMediaDuration(initialDuration);
    
    recordedChunks.current = [];
    onDiscard(); 
    if (showToast) {
      setTimeout(() => {
        toast({ title: "Media Discarded" });
      }, 0);
    }
  };

  useEffect(() => {
    setMediaType(initialMedia?.type || null);
    setPreviewUrl(initialMedia?.previewUrl || null);
    setStartTime(initialMedia?.startTime || 0);
    const initialEndTime = initialMedia?.endTime;
    const initialDuration = initialMedia?.duration || 0;
    setEndTime(initialEndTime !== undefined ? initialEndTime : initialDuration);
    setMediaDuration(initialDuration);
    setIsRecording(false); 
    setRecordedFile(null);
    
  }, [initialMedia]);


  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      cleanupStream(stream); 
      if (previewUrl && previewUrl.startsWith('blob:')) { 
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stream, previewUrl, cleanupStream]); 


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Record or Upload Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Permissions Required</AlertTitle>
              <AlertDescription>
                Camera and/or microphone permissions are needed to record media. Please enable them in your browser settings and refresh the page.
              </AlertDescription>
            </Alert>
        )}

        {!previewUrl && !isRecording && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
             <Button onClick={() => handleStartRecording('video')} variant="outline" className="w-full py-6" disabled={isRecording || hasCameraPermission === false}>
              <Video className="mr-2 h-5 w-5" /> Start Video Recording
            </Button>
            <Button onClick={() => handleStartRecording('audio')} variant="outline" className="w-full py-6" disabled={isRecording || hasCameraPermission === false}>
              <Mic className="mr-2 h-5 w-5" /> Start Audio Recording
            </Button>
            <div className="md:col-span-3">
              <Label htmlFor="media-upload" className="sr-only">Upload Media</Label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="media-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-secondary">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-muted-foreground">Video or Audio files</p>
                  </div>
                  <Input id="media-upload" type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*" disabled={isRecording} />
                </label>
              </div>
            </div>
            <div className="md:col-span-3 pt-2 border-t">
                 <p className="text-sm text-muted-foreground mb-2 text-center">Or, quickly load a sample to test trimming:</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button onClick={() => handleLoadSampleMedia('video')} variant="secondary" size="sm" disabled={isLoadingSample}>
                        {isLoadingSample && sampleLoadingType === 'video' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                        Use Sample Video
                    </Button>
                    <Button onClick={() => handleLoadSampleMedia('audio')} variant="secondary" size="sm" disabled={isLoadingSample}>
                        {isLoadingSample && sampleLoadingType === 'audio' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Waves className="mr-2 h-4 w-4" />}
                        Use Sample Audio
                    </Button>
                 </div>
            </div>
          </div>
        )}

        {isRecording && mediaType === 'video' && (
            <video ref={liveVideoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
        )}
        {isRecording && (
          <div className="text-center space-y-2">
            <p className="text-sm text-primary animate-pulse">
              {mediaType === 'video' ? 'Video' : 'Audio'} Recording in Progress...
            </p>
            <Button onClick={handleStopRecording} variant="destructive" className="w-full md:w-auto">
              <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
            </Button>
          </div>
        )}

        {previewUrl && !isRecording && mediaType && (
          <div className="space-y-4">
            <p className="text-sm font-medium">
              Media available: <span className="text-primary">{recordedFile?.name || (initialMedia && initialMedia.previewUrl === previewUrl ? "Previously attached media" : 'Recorded Media')}</span>
              {(mediaDuration > 0 || (mediaDuration === 0 && startTime === 0 && endTime ===0)) && ` (Duration: ${mediaDuration.toFixed(2)}s)`}
            </p>
            
            {mediaType === 'video' ? (
              <video ref={videoRef} src={previewUrl} controls className="w-full aspect-video rounded-md bg-muted" onLoadedMetadata={handleVideoLoadedMetadata} key={previewUrl} />
            ) : (
              <audio src={previewUrl} controls className="w-full" onLoadedMetadata={handleVideoLoadedMetadata} key={previewUrl} />
            )}

            {(mediaDuration > 0 || (mediaDuration === 0 && startTime === 0 && endTime ===0)) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time (s)</Label>
                  <Input 
                    id="start-time" 
                    type="number" 
                    value={startTime.toString()} 
                    onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                    max={mediaDuration > 0 ? (endTime > 0 ? Math.min(endTime, mediaDuration) : mediaDuration).toString() : "0"}
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time (s)</Label>
                  <Input 
                    id="end-time" 
                    type="number" 
                    value={endTime.toString()} 
                    onChange={(e) => setEndTime(Math.max(0, parseFloat(e.target.value) || 0))}
                    min={startTime > 0 ? startTime.toString() : "0"}
                    max={mediaDuration > 0 ? mediaDuration.toString() : "0"}
                    step="0.1"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button onClick={handleUseMedia} className="w-full sm:w-auto flex-1" disabled={!mediaType || (mediaDuration === 0 && !(startTime === 0 && endTime ===0) )}>
                <CheckCircle className="mr-2 h-4 w-4" /> Use This Media
              </Button>
              <Button onClick={() => handleDiscardMedia(true)} variant="outline" className="w-full sm:w-auto flex-1">
                <RotateCcw className="mr-2 h-4 w-4" /> Discard and Record/Upload Again
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2 text-center">Or, load a different sample to test trimming:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    handleDiscardMedia(false); // Silently discard current
                    handleLoadSampleMedia('video');
                  }}
                  variant="secondary"
                  size="sm"
                  disabled={isLoadingSample}
                >
                  {isLoadingSample && sampleLoadingType === 'video' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                  Load Sample Video
                </Button>
                <Button
                  onClick={() => {
                    handleDiscardMedia(false); // Silently discard current
                    handleLoadSampleMedia('audio');
                  }}
                  variant="secondary"
                  size="sm"
                  disabled={isLoadingSample}
                >
                  {isLoadingSample && sampleLoadingType === 'audio' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Waves className="mr-2 h-4 w-4" />}
                  Load Sample Audio
                </Button>
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}
    

    