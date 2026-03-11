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
import { MemoryCategory } from '@/types';
import SessionIdWitness from '../debug/SessionIdWitness';
import { createMemoryAction } from '@/actions';
import { toast } from 'sonner';

interface StudioProps {
  callId?: string;
  role?: string;
}

export const Studio = ({ callId, role = 'host' }: StudioProps) => {
  const studioState = useStudioState();
  const { mode, actions, isRecording, sessionId } = studioState;
  const [isRemoteControlOpen, setIsRemoteControlOpen] = useState(false);
  const { stream } = useCamera();
  const { startRecording, stopRecording, uploading, uploadProgress, uploadResult } = useMediaRecorder(stream);
  const router = useRouter();

  // Metadata State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>();
  const [location, setLocation] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));
  const days = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1);

  const handleEmotionTagToggle = (tagId: string) => {
    setSelectedEmotionTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Implement submission logic here
    console.log('Submitting:', { title, description, selectedCategory, location, selectedEmotionTags, selectedYear, selectedMonth, selectedDay });
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  useEffect(() => {
    const handleUploadCompletion = async () => {
      if (uploadResult) {
        const [memoryId, videoUrl] = uploadResult;
        console.log(`Video uploaded: ${videoUrl}. Now creating memory...`);

        const memoryData = {
          title,
          description,
          videoUrl,
          category: selectedCategory,
          emotionTags: selectedEmotionTags,
          memoryDate: new Date(selectedYear, selectedMonth - 1, selectedDay).toISOString(),
        };

        try {
          const result = await createMemoryAction(memoryData);

          if (result.success && result.memoryId) {
            toast.success("Memory Created!", { description: "Your new memory has been saved." });
            router.push(`/review/${result.memoryId}`);
          } else {
            toast.error("Error Creating Memory", { description: result.message });
          }
        } catch (error) {
          console.error("Failed to create memory:", error);
          toast.error("An Unexpected Error Occurred", { description: "Could not save the memory. Please try again." });
        }
      }
    };

    handleUploadCompletion();
  }, [uploadResult, router]);

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
      <SessionIdWitness sessionId={sessionId} />
      <div className="lg:col-span-7 flex flex-col h-full">
        <div className="flex-grow relative">
          {mode === 'solo' ? <Teleprompter /> : <DirectorMonitor />}
        </div>
      </div>
      <div className="lg:col-span-3 flex flex-col h-full bg-studio-card p-4 border-l border-studio-border">
        <div className="flex justify-center mb-6">
          <ModeSwitcher />
        </div>
        <MetadataInspector 
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          location={location}
          setLocation={setLocation}
          selectedEmotionTags={selectedEmotionTags}
          handleEmotionTagToggle={handleEmotionTagToggle}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          years={years}
          months={months}
          days={days}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
        />
        <div className="mt-auto space-y-4">
          {uploading && <Progress value={uploadProgress} />}
          <Button onClick={handleToggleRecording} className="w-full" disabled={uploading}>
            {isRecording ? 'Stop Session' : 'Start Session'}
          </Button>
          <Button onClick={() => setIsRemoteControlOpen(true)} className="w-full">Remote Control</Button>
        </div>
      </div>
      <RemoteControlDialog open={isRemoteControlOpen} onClose={() => setIsRemoteControlOpen(false)} sessionId={sessionId} />
    </div>
  );
};
