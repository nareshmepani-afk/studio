'use client';

import { DirectorMonitor } from '@/components/studio/DirectorMonitor';
import { MetadataInspector } from '@/components/studio/MetadataInspector';
import { ModeSwitcher } from '@/components/studio/ModeSwitcher';
import { Teleprompter } from '@/components/studio/Teleprompter';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { RemoteControlDialog } from './RemoteControlDialog';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { useCamera } from '@/hooks/useCamera';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

export const Studio = () => {
  const { mode, actions, isRecording } = useStudioState();
  const [isRemoteControlOpen, setIsRemoteControlOpen] = useState(false);
  const { stream } = useCamera();
  const { startRecording, stopRecording, uploading, uploadProgress, lastUploadUrl } = useMediaRecorder(stream);
  const router = useRouter();

  useEffect(() => {
    if (lastUploadUrl) {
      router.push(lastUploadUrl);
    }
  }, [lastUploadUrl, router]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    actions.toggleRecording();
  };

  return (
    <div className="grid lg:grid-cols-10 h-screen bg-studio-black text-studio-text">
      {/* Main Content (70%) */}
      <div className="lg:col-span-7 flex flex-col h-full">
        <div className="flex-grow relative">
          {mode === 'solo' ? <Teleprompter /> : <DirectorMonitor />}
        </div>
      </div>

      {/* Sidebar (30%) */}
      <div className="lg:col-span-3 flex flex-col h-full bg-studio-card p-4 border-l border-studio-border">
        <div className="flex justify-center mb-6">
          <ModeSwitcher />
        </div>
        <MetadataInspector />
        <div className="mt-auto space-y-4">
          {uploading && <Progress value={uploadProgress} />}
          <Button onClick={handleToggleRecording} className="w-full" disabled={uploading}>
            {isRecording ? 'Stop Session' : 'Start Session'}
          </Button>
          <Button onClick={() => setIsRemoteControlOpen(true)} className="w-full">Remote Control</Button>
        </div>
      </div>
      <RemoteControlDialog open={isRemoteControlOpen} onClose={() => setIsRemoteControlOpen(false)} />
    </div>
  );
};
