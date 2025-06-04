
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Video, StopCircle, UploadCloud, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { MediaAttachment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MediaRecorderProps {
  onMediaReady: (mediaData: { file: File; type: 'video' | 'audio'; previewUrl: string; startTime?: number; endTime?: number, duration: number }) => void;
  onDiscard: () => void;
  initialMedia?: { type: 'video' | 'audio'; previewUrl: string; startTime?: number; endTime?: number, duration: number };
}

export function MediaRecorder({ onMediaReady, onDiscard, initialMedia }: MediaRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(initialMedia?.type || null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialMedia?.previewUrl || null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const [startTime, setStartTime] = useState<number>(initialMedia?.startTime || 0);
  const [endTime, setEndTime] = useState<number>(initialMedia?.endTime || 0);
  const [mediaDuration, setMediaDuration] = useState<number>(initialMedia?.duration || 0);

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
  }, [toast]);

  const handleStartRecording = async (type: 'video' | 'audio') => {
    if (isRecording) return;
    setRecordedFile(null);
    setPreviewUrl(null);
    setMediaType(type);
    setStartTime(0);
    setEndTime(0);
    setMediaDuration(0);

    const currentStream = await getPermissions(type);
    if (!currentStream) return;

    recordedChunks.current = [];
    const recorder = new MediaRecorder(currentStream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
      const blob = new Blob(recordedChunks.current, { type: mimeType });
      const file = new File([blob], `recording.${type === 'video' ? 'webm' : 'ogg'}`, { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      setRecordedFile(file);
      setPreviewUrl(url);
      setIsRecording(false);

      // Get duration
      const tempMediaElement = document.createElement(type);
      tempMediaElement.src = url;
      tempMediaElement.onloadedmetadata = () => {
        setMediaDuration(tempMediaElement.duration);
        setEndTime(tempMediaElement.duration); // Default end time to full duration
      };

      // Stop stream tracks
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
      if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
    };

    recorder.start();
    setIsRecording(true);
    setTimeout(() => {
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} recording started.` });
    }, 0);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };
  
  const handleVideoLoadedMetadata = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
     if (previewUrl && !mediaDuration) { // only set if not already set (e.g. from recording)
        const duration = event.currentTarget.duration;
        if (duration && isFinite(duration)) {
            setMediaDuration(duration);
            if (!initialMedia || initialMedia.endTime === undefined || initialMedia.endTime === 0) {
                 setEndTime(duration);
            }
        }
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
      setMediaType(type);
      setRecordedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      const tempMediaElement = document.createElement(type);
      tempMediaElement.src = url;
      tempMediaElement.onloadedmetadata = () => {
        setMediaDuration(tempMediaElement.duration);
        setStartTime(0);
        setEndTime(tempMediaElement.duration);
      };
      setTimeout(() => {
        toast({ title: "File Uploaded", description: file.name });
      }, 0);
    }
  };

  const handleUseMedia = () => {
    if (recordedFile && previewUrl && mediaType && mediaDuration) {
      if (startTime >= endTime) {
        setTimeout(() => {
          toast({ title: "Invalid Trim Times", description: "Start time must be less than end time.", variant: "destructive" });
        }, 0);
        return;
      }
      if (endTime > mediaDuration) {
         setTimeout(() => {
          toast({ title: "Invalid End Time", description: "End time cannot exceed media duration.", variant: "destructive" });
        }, 0);
        return;
      }
      onMediaReady({ file: recordedFile, type: mediaType, previewUrl, startTime, endTime, duration: mediaDuration });
      setTimeout(() => {
        toast({ title: "Media Selected", description: "This media will be attached to your memory.", icon: <CheckCircle className="h-4 w-4" /> });
      }, 0);
    }
  };

  const handleDiscardMedia = () => {
    setRecordedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    setIsRecording(false);
    setStartTime(0);
    setEndTime(0);
    setMediaDuration(0);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
    mediaRecorderRef.current = null;
    recordedChunks.current = [];
    onDiscard();
    setTimeout(() => {
      toast({ title: "Media Discarded" });
    }, 0);
  };

  useEffect(() => {
    // Clean up blob URL
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [previewUrl, stream]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <Button onClick={() => handleStartRecording('video')} variant="outline" className="w-full py-6" disabled={isRecording || hasCameraPermission === false}>
              <Video className="mr-2 h-5 w-5" /> Start Video Recording
            </Button>
            <Button onClick={() => handleStartRecording('audio')} variant="outline" className="w-full py-6" disabled={isRecording || hasCameraPermission === false}>
              <Mic className="mr-2 h-5 w-5" /> Start Audio Recording
            </Button>
            <div className="md:col-span-2">
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
              Media captured: <span className="text-primary">{recordedFile?.name || 'Recorded Media'}</span>
              {mediaDuration > 0 && ` (Duration: ${mediaDuration.toFixed(2)}s)`}
            </p>
            
            {mediaType === 'video' ? (
              <video ref={videoRef} src={previewUrl} controls className="w-full aspect-video rounded-md bg-muted" onLoadedMetadata={handleVideoLoadedMetadata} />
            ) : (
              <audio src={previewUrl} controls className="w-full" onLoadedMetadata={handleVideoLoadedMetadata} />
            )}

            {mediaDuration > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time (s)</Label>
                  <Input 
                    id="start-time" 
                    type="number" 
                    value={startTime} 
                    onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                    max={mediaDuration}
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time (s)</Label>
                  <Input 
                    id="end-time" 
                    type="number" 
                    value={endTime} 
                    onChange={(e) => setEndTime(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                    max={mediaDuration}
                    step="0.1"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button onClick={handleUseMedia} className="w-full sm:w-auto flex-1">
                <CheckCircle className="mr-2 h-4 w-4" /> Use This Media
              </Button>
              <Button onClick={handleDiscardMedia} variant="outline" className="w-full sm:w-auto flex-1">
                <RotateCcw className="mr-2 h-4 w-4" /> Discard and Record/Upload Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

