
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Video, StopCircle, Scissors, Trash2, UploadCloud } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function MediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  const [recordedMedia, setRecordedMedia] = useState<File | null>(null); // Placeholder for actual media file

  const handleStartRecording = (type: 'video' | 'audio') => {
    setIsRecording(true);
    setMediaType(type);
    // Placeholder for actual recording logic
    console.log(`Started ${type} recording...`);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Placeholder: simulate media file creation
    setRecordedMedia(new File(["mock content"], `mock_${mediaType}_file.${mediaType === 'video' ? 'mp4' : 'mp3'}`, { type: mediaType === 'video' ? 'video/mp4' : 'audio/mpeg' }));
    console.log('Stopped recording.');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setRecordedMedia(event.target.files[0]);
      console.log('File uploaded:', event.target.files[0].name);
    }
  };

  const handleTrim = () => console.log('Trim media (placeholder)');
  const handleDelete = () => {
    setRecordedMedia(null);
    setMediaType(null);
    console.log('Delete media (placeholder)');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Record or Upload Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isRecording && !recordedMedia && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => handleStartRecording('video')} variant="outline" className="w-full">
              <Video className="mr-2 h-4 w-4" /> Start Video Recording
            </Button>
            <Button onClick={() => handleStartRecording('audio')} variant="outline" className="w-full">
              <Mic className="mr-2 h-4 w-4" /> Start Audio Recording
            </Button>
             <div>
                <Label htmlFor="media-upload" className="sr-only">Upload Media</Label>
                 <div className="flex items-center justify-center w-full">
                    <label htmlFor="media-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-secondary">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">Video or Audio files</p>
                        </div>
                        <Input id="media-upload" type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*" />
                    </label>
                </div> 
            </div>
          </div>
        )}

        {isRecording && (
          <div className="text-center space-y-2">
            <p className="text-sm text-primary">
              {mediaType === 'video' ? 'Video' : 'Audio'} Recording in Progress...
            </p>
            <Button onClick={handleStopRecording} variant="destructive" className="w-full md:w-auto">
              <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
            </Button>
          </div>
        )}

        {recordedMedia && !isRecording && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Media captured: <span className="text-primary">{recordedMedia.name}</span> ({(recordedMedia.size / 1024 / 1024).toFixed(2)} MB)
            </p>
            {/* Placeholder for media preview */}
            <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
              {mediaType === 'video' || recordedMedia.type.startsWith('video/') ? 
                <Video className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
              <span className="ml-2">Preview (Placeholder)</span>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleTrim} variant="outline" size="sm">
                <Scissors className="mr-2 h-4 w-4" /> Trim
              </Button>
              <Button onClick={handleDelete} variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
