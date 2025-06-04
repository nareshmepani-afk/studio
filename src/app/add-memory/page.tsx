
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

  const handleSubmit = async (memoryData: Omit<Memory, 'id' | 'userId'>, userProfileForCues?: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add a memory.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    console.log('New memory data:', { ...memoryData, userId: user.id });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // If AI cues were used, maybe update user profile.
    if (userProfileForCues && user.profileInfo !== userProfileForCues) {
      // Mock update user profile
      console.log("User profile for cues updated (mock):", userProfileForCues);
      // In a real app: updateUser({ ...user, profileInfo: userProfileForCues });
    }

    setIsSubmitting(false);
    toast({
      title: "Memory Added!",
      description: `"${memoryData.title}" has been saved.`,
    });
    router.push('/'); // Redirect to timeline
  };

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <MemoryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </AuthenticatedPageWrapper>
  );
}
