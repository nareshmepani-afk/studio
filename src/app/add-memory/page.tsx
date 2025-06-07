
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import type { Memory } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { mockMemories } from '@/lib/mockData'; // For fetching memory to edit
import { Loader2 } from 'lucide-react';

export default function AddMemoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memoryToEdit, setMemoryToEdit] = useState<Memory | undefined>(undefined);
  const [isLoadingMemory, setIsLoadingMemory] = useState(true);

  const editMemoryId = searchParams.get('editMemoryId');
  const promptIdFromQuery = searchParams.get('promptId'); // For linking memory to prompt

  useEffect(() => {
    if (editMemoryId) {
      // Simulate fetching memory
      setIsLoadingMemory(true);
      setTimeout(() => {
        const foundMemory = mockMemories.find(m => m.id === editMemoryId && m.userId === user?.id);
        if (foundMemory) {
          setMemoryToEdit(foundMemory);
        } else {
          toast({ title: "Memory not found", description: "Could not load the memory for editing.", variant: "destructive" });
          router.push('/timeline'); // Or to prompts page
        }
        setIsLoadingMemory(false);
      }, 300);
    } else {
      setIsLoadingMemory(false);
      setMemoryToEdit(undefined); // Ensure it's undefined if not editing
    }
  }, [editMemoryId, user?.id, router]);

  const handleSubmit = async (memoryData: Omit<Memory, 'id' | 'userId'>, userProfileForCues?: string, mediaFileToUpload?: File) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add or edit a memory.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    let finalMemoryData: Memory;

    if (memoryToEdit) { // Editing existing memory
      finalMemoryData = {
        ...memoryToEdit, // Start with existing data
        ...memoryData, // Override with form data
        userId: user.id,
        // Ensure promptId from original memory is preserved if not re-prompted, or use new one
        promptId: promptIdFromQuery || memoryToEdit.promptId, 
      };
    } else { // Adding new memory
      finalMemoryData = {
        ...memoryData,
        id: Date.now().toString(),
        userId: user.id,
        promptId: promptIdFromQuery || undefined, // Add promptId if creating from a prompt
      };
    }
    
    if (mediaFileToUpload && finalMemoryData.mediaAttachments && finalMemoryData.mediaAttachments.length > 0) {
      console.log('Media file to upload:', mediaFileToUpload.name);
      finalMemoryData.mediaAttachments[0].url = `mock_uploaded_url/${mediaFileToUpload.name}`; // Simulate upload
      finalMemoryData.mediaAttachments[0].filename = mediaFileToUpload.name;
    }

    console.log(editMemoryId ? 'Updated memory data:' : 'New memory data:', finalMemoryData);

    // Mock saving to localStorage or an API
    // This part would need to be more robust in a real app, likely involving updating an array in localStorage
    let existingMemories: Memory[] = [];
    const storedMemoriesJson = localStorage.getItem('mockMemories'); // Assuming we'd save all mockMemories
    if (storedMemoriesJson) {
        try { existingMemories = JSON.parse(storedMemoriesJson); } catch (e) { console.error(e); }
    } else { // Initialize if not present (mainly for dev)
        existingMemories = mockMemories;
    }

    if (editMemoryId) {
        const index = existingMemories.findIndex(m => m.id === editMemoryId);
        if (index !== -1) {
            existingMemories[index] = finalMemoryData;
        } else { // Should not happen if editMemoryId is valid
            existingMemories.push(finalMemoryData);
        }
    } else {
        existingMemories.push(finalMemoryData);
    }
    localStorage.setItem('mockMemories', JSON.stringify(existingMemories)); // Save back
    // Also, update the actual mockMemories array if it's being used by other parts of the app directly (for demo)
    const mockIndex = mockMemories.findIndex(m => m.id === finalMemoryData.id);
    if (mockIndex !== -1) mockMemories[mockIndex] = finalMemoryData; else mockMemories.push(finalMemoryData);


    await new Promise(resolve => setTimeout(resolve, 1000));

    if (userProfileForCues && user.profileInfo !== userProfileForCues) {
      console.log("User profile for cues updated (mock):", userProfileForCues);
    }

    setIsSubmitting(false);
    toast({
      title: memoryToEdit ? "Memory Updated!" : "Memory Added!",
      description: `"${finalMemoryData.title}" has been saved.`,
    });
    // Redirect to Life Journey if it came from a prompt, otherwise timeline
    if (finalMemoryData.promptId) {
        router.push('/prompts');
    } else {
        router.push('/timeline');
    }
  };

  if (isLoadingMemory) {
    return (
      <AuthenticatedPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading Memory Editor...</h2>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <MemoryForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          memory={memoryToEdit} // Pass memory for editing
        />
      </div>
    </AuthenticatedPageWrapper>
  );
}
