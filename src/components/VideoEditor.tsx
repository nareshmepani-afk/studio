
'use client';

import { useState, useEffect, useRef } from 'react';
import { getFFmpegInstance, trimMediaWithFFmpeg } from '@/lib/ffmpeg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Loader2, Video, Mic, UploadCloud, Scissors, StopCircle, Play } from 'lucide-react';

// Utility to format seconds into a MIN:SEC.MS format
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00.0';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
};

export default function VideoEditor() {
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [status, setStatus] = useState('Initializing Media Tools...');
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [trimmedVideo, setTrimmedVideo] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const trimmedVideoOutputRef = useRef<HTMLVideoElement>(null);
  const trimStartInputRef = useRef<HTMLInputElement>(null);
  const trimEndInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const log = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setStatus(message);
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (type === 'error') {
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    const initializeFFmpeg = async () => {
      log('Initializing FFmpeg...', 'info');
      try {
        const ffmpeg = await getFFmpegInstance();
        ffmpeg.setLogger(({ type, message }) => {
          if (type === 'ffout' || type === 'fferr') console.log(`FFMPEG [${type}]:`, message);
        });
        ffmpeg.setProgress(({ progress }) => {
          if (isProcessing) {
            const percentage = Math.min(Math.round(progress * 100), 100);
            setProcessingProgress(percentage);
            setStatus(`Processing... ${percentage}%`);
          }
        });
        setFfmpegLoaded(true);
        log('Media tools loaded successfully!', 'success');
      } catch (error) {
        log('Failed to load media tools. Please refresh.', 'error');
        console.error(error);
        setFfmpegLoaded(false);
      }
    };

    initializeFFmpeg();
  }, [isProcessing]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;

      recorder.onstart = () => {
        const startTime = Date.now();
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setRecordingTime(0);
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedVideo(blob);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = URL.createObjectURL(blob);
        }
        stream.getTracks().forEach((track) => track.stop());
        log('Recording stopped. Ready for trimming.', 'success');
        setIsRecording(false);
      };

      recorder.start();
      log('Recording started...', 'info');
      setIsRecording(true);
    } catch (error: any) {
      log(`Could not access camera/microphone: ${error.message}`, 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleTrim = async () => {
    if (!ffmpegLoaded) return log('Error: FFmpeg is not loaded.', 'error');
    if (!recordedVideo) return log('Error: No video has been recorded.', 'error');

    const start = parseFloat(trimStartInputRef.current?.value || '0');
    const end = parseFloat(trimEndInputRef.current?.value || '2');
    if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
      return log('Error: Invalid trim times. Start must be >= 0 and end > start.', 'error');
    }

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      log('Trimming video...', 'info');

      const trimmedBlob = await trimMediaWithFFmpeg(recordedVideo, start, end);
      
      setTrimmedVideo(trimmedBlob);
      if (trimmedVideoOutputRef.current) {
        trimmedVideoOutputRef.current.src = URL.createObjectURL(trimmedBlob);
      }
      log('Trimming complete!', 'success');
      toast({ title: 'Trimming Complete', description: 'Your video is ready for upload.' });
    } catch (error: any) {
      log(`Error during trimming: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!trimmedVideo) return log('Error: No trimmed video to upload.', 'error');
    const formData = new FormData();
    formData.append('video', trimmedVideo, 'trimmed-video.webm');

    try {
      log('Uploading video...', 'info');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result.success) {
        log(`Video uploaded successfully! Path: ${result.path}`, 'success');
        toast({ title: 'Upload Successful', description: `Video available at ${result.path}` });
      } else {
        log(`Video upload failed: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (error: any) {
      log(`Error during upload: ${error.message}`, 'error');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">Video Editor</h1>
        <p className="text-muted-foreground mt-2">{status}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-black rounded-md flex items-center justify-center">
                <video ref={videoPreviewRef} className="w-full h-full object-contain" controls autoPlay muted playsInline />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Video className="mr-2"/>Recording</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <Button onClick={startRecording} disabled={isRecording || !ffmpegLoaded}>
                    <Play className="mr-2"/> Start
                  </Button>
                  <Button onClick={stopRecording} disabled={!isRecording} variant="destructive">
                    <StopCircle className="mr-2"/> Stop
                  </Button>
              </div>
              {isRecording && (
                <div className="flex items-center justify-center text-sm font-mono bg-muted p-2 rounded-md">
                    <span className="text-red-500 mr-2">&#9679;</span>
                    REC: {formatTime(recordingTime)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Scissors className="mr-2"/>Trimming</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="trim-start">Start (sec)</Label>
                      <Input type="number" id="trim-start" ref={trimStartInputRef} defaultValue="0" min="0" disabled={!recordedVideo || isProcessing}/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="trim-end">End (sec)</Label>
                      <Input type="number" id="trim-end" ref={trimEndInputRef} defaultValue="2" min="0" disabled={!recordedVideo || isProcessing}/>
                  </div>
              </div>
              <Button onClick={handleTrim} disabled={!recordedVideo || !ffmpegLoaded || isProcessing} className="w-full">
                {isProcessing ? <Loader2 className="animate-spin"/> : 'Trim Video'}
              </Button>
              {isProcessing && <Progress value={processingProgress} className="w-full h-2"/>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><UploadCloud className="mr-2"/>Output</CardTitle>
                <CardDescription>Your trimmed video will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-black rounded-md flex items-center justify-center">
                <video ref={trimmedVideoOutputRef} className="w-full h-full object-contain" controls playsInline />
              </div>
              <Button onClick={handleUpload} disabled={!trimmedVideo} className="w-full">
                Upload Trimmed Video
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
