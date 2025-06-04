
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import type { Memory } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast'; // Changed import
import { useState } from 'react';

export default function AddMemoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  // const { toast } = useToast(); // Removed useToast() call
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (memoryData: Omit<Memory, 'id' | 'userId'>, userProfileForCues?: string, mediaFile?: File) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add a memory.", variant: "destructive" }); // Direct use
      return;
    }
    setIsSubmitting(true);
    
    const fullMemoryData: Memory = {
      ...memoryData,
      id: Date.now().toString(), 
      userId: user.id,
    };

    console.log('New memory data:', fullMemoryData);
    if (mediaFile) {
      console.log('Media file to upload:', mediaFile.name, mediaFile.type, mediaFile.size);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (userProfileForCues && user.profileInfo !== userProfileForCues) {
      console.log("User profile for cues updated (mock):", userProfileForCues);
    }

    setIsSubmitting(false);
    toast({ // Direct use
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
