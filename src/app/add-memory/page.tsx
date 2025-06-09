
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
  const { user, calculateAndUpdateStorageUsage } = useAuth(); // Added calculateAndUpdateStorageUsage
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
          router.push('/timeline'); 
        }
        setIsLoadingMemory(false);
      }, 300);
    } else {
      setIsLoadingMemory(false);
      setMemoryToEdit(undefined); 
    }
  }, [editMemoryId, user?.id, router]);

  const handleSubmit = async (memoryData: Omit<Memory, 'id' | 'userId'>, mediaFileToUpload?: File) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add or edit a memory.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    let finalMemoryData: Memory;

    if (memoryToEdit) { 
      finalMemoryData = {
        ...memoryToEdit, 
        ...memoryData, 
        userId: user.id,
        promptId: promptIdFromQuery || memoryToEdit.promptId, 
      };
    } else { 
      finalMemoryData = {
        ...memoryData,
        id: Date.now().toString(),
        userId: user.id,
        promptId: promptIdFromQuery || undefined, 
      };
    }
    
    // Ensure mediaAttachments has size if new file is uploaded or if mediaData has it
    if (mediaFileToUpload && finalMemoryData.mediaAttachments && finalMemoryData.mediaAttachments.length > 0) {
      console.log('Media file to upload:', mediaFileToUpload.name, 'Size:', mediaFileToUpload.size);
      finalMemoryData.mediaAttachments[0].url = `mock_uploaded_url/${mediaFileToUpload.name}`; 
      finalMemoryData.mediaAttachments[0].filename = mediaFileToUpload.name;
      // The size should already be on memoryData.mediaAttachments[0] from MemoryForm
      // If not, we could add it from mediaFileToUpload.size here, but MemoryForm should handle it
      if (!finalMemoryData.mediaAttachments[0].size) {
        finalMemoryData.mediaAttachments[0].size = mediaFileToUpload.size;
      }
    } else if (memoryData.mediaAttachments && memoryData.mediaAttachments.length > 0 && !finalMemoryData.mediaAttachments?.[0]?.size && mediaFileToUpload?.size) {
       // Fallback if size wasn't set correctly but we have a file
       if (finalMemoryData.mediaAttachments && finalMemoryData.mediaAttachments.length > 0) {
        finalMemoryData.mediaAttachments[0].size = mediaFileToUpload.size;
       }
    }


    console.log(editMemoryId ? 'Updated memory data:' : 'New memory data:', finalMemoryData);

    let existingMemories: Memory[] = [];
    const storedMemoriesJson = localStorage.getItem('mockMemories'); 
    if (storedMemoriesJson) {
        try { existingMemories = JSON.parse(storedMemoriesJson); } catch (e) { console.error(e); }
    } else { 
        existingMemories = mockMemories;
    }

    if (editMemoryId) {
        const index = existingMemories.findIndex(m => m.id === editMemoryId);
        if (index !== -1) {
            existingMemories[index] = finalMemoryData;
        } else { 
            existingMemories.push(finalMemoryData);
        }
    } else {
        existingMemories.push(finalMemoryData);
    }
    localStorage.setItem('mockMemories', JSON.stringify(existingMemories)); 
    
    const mockIndex = mockMemories.findIndex(m => m.id === finalMemoryData.id);
    if (mockIndex !== -1) mockMemories[mockIndex] = finalMemoryData; else mockMemories.push(finalMemoryData);

    await calculateAndUpdateStorageUsage(user.id); // Recalculate storage usage

    await new Promise(resolve => setTimeout(resolve, 1000));


    setIsSubmitting(false);
    toast({
      title: memoryToEdit ? "Memory Updated!" : "Memory Added!",
      description: `"${finalMemoryData.title}" has been saved.`,
    });
    
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
          memory={memoryToEdit}
        />
      </div>
    </AuthenticatedPageWrapper>
  );
}
