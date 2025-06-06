
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import type { Memory } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast'; 
import { useState } from 'react';

export default function AddMemoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (memoryData: Omit<Memory, 'id' | 'userId'>, userProfileForCues?: string, mediaFileToUpload?: File) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add a memory.", variant: "destructive" }); 
      return;
    }
    setIsSubmitting(true);
    
    // In a real app, you would upload mediaFileToUpload if it exists, 
    // get its URL, and then update memoryData.mediaAttachments[0].url
    // For now, we'll just log it.

    const fullMemoryData: Memory = {
      ...memoryData,
      id: Date.now().toString(), 
      userId: user.id,
    };

    if (mediaFileToUpload) {
      console.log('Media file to upload:', mediaFileToUpload.name, mediaFileToUpload.type, mediaFileToUpload.size);
      // Simulate upload and URL replacement
      if (fullMemoryData.mediaAttachments && fullMemoryData.mediaAttachments.length > 0) {
        fullMemoryData.mediaAttachments[0].url = `mock_uploaded_url/${mediaFileToUpload.name}`;
        console.log("Mock uploaded media URL:", fullMemoryData.mediaAttachments[0].url);
      }
    }
    
    console.log('New memory data:', fullMemoryData);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    if (userProfileForCues && user.profileInfo !== userProfileForCues) {
      // In a real app, you might update the user's profileInfo if it has changed
      console.log("User profile for cues updated (mock):", userProfileForCues);
      // Example: await updateUserProfile(user.id, { profileInfo: userProfileForCues });
    }

    setIsSubmitting(false);
    toast({ 
      title: "Memory Added!",
      description: `"${memoryData.title}" has been saved.`,
    });
    router.push('/timeline'); 
  };

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <MemoryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </AuthenticatedPageWrapper>
  );
}

    