
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import type { Memory } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function AddMemoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (memoryData: Omit<Memory, 'id' | 'userId'>, userProfileForCues?: string, mediaFile?: File) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add a memory.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const fullMemoryData: Memory = {
      ...memoryData,
      id: Date.now().toString(), // Mock ID generation
      userId: user.id,
    };

    console.log('New memory data:', fullMemoryData);
    if (mediaFile) {
      console.log('Media file to upload:', mediaFile.name, mediaFile.type, mediaFile.size);
      // In a real app:
      // 1. Upload mediaFile to Firebase Storage or other cloud storage.
      // 2. Get the download URL.
      // 3. Update fullMemoryData.mediaAttachments[0].url with this download URL.
      // For now, we are using the blob URL (previewUrl) if it's a new recording,
      // or the existing URL if editing.
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (userProfileForCues && user.profileInfo !== userProfileForCues) {
      console.log("User profile for cues updated (mock):", userProfileForCues);
    }

    setIsSubmitting(false);
    toast({
      title: "Memory Added!",
      description: `"${memoryData.title}" has been saved.`,
    });
    router.push('/'); 
  };

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <MemoryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </AuthenticatedPageWrapper>
  );
}
