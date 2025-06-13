
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import type { Memory } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { mockMemories } from '@/lib/mockData';
import { Loader2, Star, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AddMemoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    user, 
    calculateAndUpdateStorageUsage,
    hostPassStatus,
    activateFreeHostPass,
    purchasePaidHostPass,
    hostPassPriceDetails,
    isFetchingHostPassPrice: isFetchingAuthHostPassPrice, // Corrected alias
    loading: authLoading 
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memoryToEdit, setMemoryToEdit] = useState<Memory | undefined>(undefined);
  const [isLoadingMemory, setIsLoadingMemory] = useState(true);

  const editMemoryId = searchParams.get('editMemoryId');
  const promptIdFromQuery = searchParams.get('promptId');
  const isCreatingNew = !editMemoryId;

  useEffect(() => {
    if (editMemoryId) {
      setIsLoadingMemory(true);
      // Simulate fetching memory
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
      setMemoryToEdit(undefined); // Ensure memoryToEdit is undefined for new memories
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
    
    // Mock media upload and URL update
    if (mediaFileToUpload && finalMemoryData.mediaAttachments && finalMemoryData.mediaAttachments.length > 0) {
      // In a real app, upload mediaFileToUpload to storage and get the URL
      finalMemoryData.mediaAttachments[0].url = `mock_uploaded_url/${mediaFileToUpload.name}`; 
      finalMemoryData.mediaAttachments[0].filename = mediaFileToUpload.name;
      if (!finalMemoryData.mediaAttachments[0].size) { // Ensure size is set from uploaded file if not already
        finalMemoryData.mediaAttachments[0].size = mediaFileToUpload.size;
      }
    } else if (memoryData.mediaAttachments && memoryData.mediaAttachments.length > 0 && !finalMemoryData.mediaAttachments?.[0]?.size && mediaFileToUpload?.size) {
       // Case where media was selected but not a new file (e.g. re-trim of existing) and recorder provides a new size
       if (finalMemoryData.mediaAttachments && finalMemoryData.mediaAttachments.length > 0) {
        finalMemoryData.mediaAttachments[0].size = mediaFileToUpload.size;
       }
    }

    // Update mockMemories in localStorage and in-memory
    let existingMemories: Memory[] = [];
    const storedMemoriesJson = localStorage.getItem('mockMemories'); 
    if (storedMemoriesJson) {
        try { existingMemories = JSON.parse(storedMemoriesJson); } catch (e) { console.error(e); }
    } else { 
        existingMemories = mockMemories; // Fallback to initial mock data if localStorage is empty/corrupt
    }

    if (editMemoryId) {
        const index = existingMemories.findIndex(m => m.id === editMemoryId);
        if (index !== -1) {
            existingMemories[index] = finalMemoryData;
        } else { // Should not happen if editing, but as a fallback
            existingMemories.push(finalMemoryData);
        }
    } else {
        existingMemories.push(finalMemoryData);
    }
    localStorage.setItem('mockMemories', JSON.stringify(existingMemories)); 
    
    // Also update the in-memory mockMemories if it's used by other parts of the app directly
    const mockIndex = mockMemories.findIndex(m => m.id === finalMemoryData.id);
    if (mockIndex !== -1) mockMemories[mockIndex] = finalMemoryData; else mockMemories.push(finalMemoryData);

    await calculateAndUpdateStorageUsage(user.id);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    toast({
      title: memoryToEdit ? "Memory Updated!" : "Memory Added!",
      description: `"${finalMemoryData.title}" has been saved.`,
    });
    
    // Redirect after save
    if (finalMemoryData.promptId) {
        router.push('/prompts');
    } else {
        router.push('/timeline');
    }
  };

  if (authLoading || isLoadingMemory) {
    return (
      <AuthenticatedPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading Memory Editor...</h2>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  // Check for Host Pass if creating a new memory
  const needsPassActivation = isCreatingNew && (
    hostPassStatus === 'no_pass_initiated' ||
    hostPassStatus === 'free_host_pass_expired' ||
    hostPassStatus === 'paid_host_pass_expired'
  );

  if (needsPassActivation) {
    let buttonText = "Activate 6-Month Free Host Pass";
    let ButtonIcon = Star;
    let action = activateFreeHostPass;
    let priceString = "";
    let disabled = false;
    let titleText = "Activate Host Pass";

    if (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') {
      buttonText = "Purchase Host Pass";
      ButtonIcon = Zap;
      action = purchasePaidHostPass;
      titleText = "Renew Host Pass";
      if (isFetchingAuthHostPassPrice) {
        buttonText = "Fetching price...";
        disabled = true;
      } else if (hostPassPriceDetails) {
        priceString = ` (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.passPrice)})`;
        buttonText += priceString;
      } else {
         // Fallback mock price if details are not available
         buttonText += ` (£12.99 - Mock)`; 
      }
    }
  
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
          <Alert className="w-full max-w-lg bg-primary/10 border-primary/30 shadow-xl rounded-lg">
            <ButtonIcon className="h-5 w-5 text-primary" />
            <AlertTitle className="font-headline text-xl text-primary mt-1">
              {titleText}
            </AlertTitle>
            <AlertDescription className="text-primary/90 space-y-4 mt-2">
              <p>You need an active Host Pass to create new memories. Please activate your free pass or purchase one to continue.</p>
              <Button
                onClick={action}
                size="default"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={disabled || (isFetchingAuthHostPassPrice && hostPassStatus !== 'no_pass_initiated')}
              >
                {(isFetchingAuthHostPassPrice && hostPassStatus !== 'no_pass_initiated') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ButtonIcon className="mr-2 h-4 w-4" />}
                {buttonText}
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/settings')}>
                      Go to Settings
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/prompts')}>
                      Back to Life Journey
                  </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <MemoryForm
          key={memoryToEdit?.id || 'new-memory-form'} // Force re-mount when memoryToEdit changes
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          memory={memoryToEdit}
        />
      </div>
    </AuthenticatedPageWrapper>
  );
}

    