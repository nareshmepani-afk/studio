
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import type { Memory, MediaAttachment } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Star, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase'; // Added storage
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Added Firebase Storage functions

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
    isFetchingHostPassPrice: isFetchingAuthHostPassPrice, 
    loading: authLoading 
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memoryToEdit, setMemoryToEdit] = useState<Memory | undefined>(undefined);
  const [isLoadingMemory, setIsLoadingMemory] = useState(true);

  const editMemoryId = searchParams.get('editMemoryId');
  const promptIdFromQuery = searchParams.get('promptId');
  const isCreatingNew = !editMemoryId;

  useEffect(() => {
    const loadMemory = async () => {
      if (editMemoryId && user) {
        setIsLoadingMemory(true);
        try {
          const memoryDocRef = doc(db, "users", user.id, "memories", editMemoryId);
          const memorySnap = await getDoc(memoryDocRef);
          if (memorySnap.exists()) {
            const memoryData = memorySnap.data() as Omit<Memory, 'id'>;
            setMemoryToEdit({ id: memorySnap.id, ...memoryData });
          } else {
            toast({ title: "Memory not found", description: "Could not load the memory for editing.", variant: "destructive" });
            router.push('/timeline');
          }
        } catch (error) {
          console.error("Error fetching memory:", error);
          toast({ title: "Error Loading Memory", description: "Failed to fetch memory details.", variant: "destructive" });
          router.push('/timeline');
        } finally {
          setIsLoadingMemory(false);
        }
      } else {
        setIsLoadingMemory(false);
        setMemoryToEdit(undefined);
      }
    };

    if (user) { 
      loadMemory();
    } else if (!authLoading) { 
       setIsLoadingMemory(false);
       setMemoryToEdit(undefined);
    }
  }, [editMemoryId, user, router, authLoading]);

  const handleSubmit = async (
    memoryData: Omit<Memory, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { promptId?: string },
    mediaFileToUpload?: File 
  ) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    let processedMediaAttachments: MediaAttachment[] | undefined = memoryData.mediaAttachments;
    const oldMediaUrl = memoryToEdit?.mediaAttachments?.[0]?.url;

    if (mediaFileToUpload) {
      const filePath = `memories/${user.id}/${Date.now()}-${mediaFileToUpload.name}`;
      const fileRef = storageRef(storage, filePath);
      try {
        toast({ title: "Uploading Media...", description: "Please wait while your media is being uploaded.", duration: 5000 });
        await uploadBytes(fileRef, mediaFileToUpload);
        const downloadURL = await getDownloadURL(fileRef);
        
        if (memoryData.mediaAttachments && memoryData.mediaAttachments.length > 0) {
          processedMediaAttachments = [{
            ...memoryData.mediaAttachments[0], // Keep existing startTime, endTime, etc.
            url: downloadURL,
            filename: mediaFileToUpload.name,
            size: mediaFileToUpload.size, // Ensure size is from the new file
          }];
        } else { // Should ideally not happen if mediaFileToUpload is present, but as a fallback
           processedMediaAttachments = [{
            id: Date.now().toString(), // new media ID
            type: mediaFileToUpload.type.startsWith('video/') ? 'video' : 'audio',
            url: downloadURL,
            filename: mediaFileToUpload.name,
            size: mediaFileToUpload.size,
            // startTime, endTime, duration would come from MediaCaptureControl via MemoryForm if it was a new recording/upload
            // For simplicity if memoryData.mediaAttachments was empty, we might lose trim from a new recording.
            // This path is less likely as MemoryForm should construct mediaAttachments[0] with new trim data.
          }];
        }

        // Delete old media from Storage if it existed and is different
        if (isCreatingNew && oldMediaUrl && oldMediaUrl !== downloadURL && oldMediaUrl.includes('firebasestorage.googleapis.com')) {
          // This case is for when creating new, but somehow oldMediaUrl was set (should not happen often)
           console.warn("Old media URL present when creating new memory, deleting if from storage.");
           try {
                const oldFileStorageRef = storageRef(storage, oldMediaUrl);
                await deleteObject(oldFileStorageRef);
                console.log("Old media deleted from storage (new memory context):", oldMediaUrl);
            } catch (deleteError: any) {
                 if (deleteError.code !== 'storage/object-not-found') {
                    console.warn("Could not delete old media from storage (new memory context):", deleteError);
                 }
            }
        } else if (!isCreatingNew && oldMediaUrl && oldMediaUrl !== downloadURL && oldMediaUrl.includes('firebasestorage.googleapis.com')) {
          console.log("New media uploaded, deleting old media from storage:", oldMediaUrl);
          try {
            const oldFileStorageRef = storageRef(storage, oldMediaUrl);
            await deleteObject(oldFileStorageRef);
            console.log("Old media deleted from storage:", oldMediaUrl);
          } catch (deleteError: any) {
            if (deleteError.code !== 'storage/object-not-found') {
                console.warn("Could not delete old media from storage:", deleteError);
            }
          }
        }
      } catch (uploadError) {
        console.error("Error uploading media to Firebase Storage:", uploadError);
        toast({ title: "Media Upload Failed", description: "Could not save your media file. Please try again.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    } else if (isCreatingNew && !mediaFileToUpload) {
      // No new file for a new memory, and mediaAttachments might be undefined or empty from form
      processedMediaAttachments = undefined;
    } else if (!isCreatingNew && !mediaFileToUpload && memoryData.mediaAttachments === undefined && oldMediaUrl) {
      // User explicitly cleared media for an existing memory
      console.log("Media cleared for existing memory, deleting from storage:", oldMediaUrl);
      processedMediaAttachments = undefined; // Mark for removal from Firestore
      if (oldMediaUrl.includes('firebasestorage.googleapis.com')) {
          try {
            const oldFileStorageRef = storageRef(storage, oldMediaUrl);
            await deleteObject(oldFileStorageRef);
            console.log("Old media (cleared by user) deleted from storage:", oldMediaUrl);
          } catch (deleteError: any) {
             if (deleteError.code !== 'storage/object-not-found') {
                console.warn("Could not delete old media (cleared by user) from storage:", deleteError);
             }
          }
      }
    } else if (!isCreatingNew && !mediaFileToUpload && memoryData.mediaAttachments && memoryToEdit?.mediaAttachments) {
        // No new file, but existing media details might have been re-submitted (e.g. trim changed on existing storage URL)
        // This should be handled by MemoryForm passing existing attachment data correctly.
        // The 'processedMediaAttachments' from memoryData should be correct here.
    }


    const dataToSave: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> & { userId: string; updatedAt: Timestamp; createdAt?: Timestamp, mediaAttachments?: MediaAttachment[] } = {
      ...memoryData,
      mediaAttachments: processedMediaAttachments, // This can be undefined to remove it
      userId: user.id,
      promptId: promptIdFromQuery || memoryData.promptId || memoryToEdit?.promptId || undefined,
      updatedAt: serverTimestamp() as Timestamp,
    };

    try {
      if (memoryToEdit && editMemoryId) {
        const memoryDocRef = doc(db, "users", user.id, "memories", editMemoryId);
        await updateDoc(memoryDocRef, dataToSave);
        toast({ title: "Memory Updated!", description: `"${dataToSave.title}" has been saved.` });
      } else {
        const memoriesColRef = collection(db, "users", user.id, "memories");
        dataToSave.createdAt = serverTimestamp() as Timestamp;
        await addDoc(memoriesColRef, dataToSave);
        toast({ title: "Memory Added!", description: `"${dataToSave.title}" has been saved.` });
      }

      await calculateAndUpdateStorageUsage(user.id);

      if (promptIdFromQuery || memoryData.promptId || memoryToEdit?.promptId) {
        router.push('/prompts');
      } else {
        router.push('/timeline');
      }
    } catch (error) {
      console.error("Error saving memory to Firestore:", error);
      toast({ title: "Save Failed", description: "Could not save memory to the database.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
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
    let titleText = "Activate Host Pass to Create Memories";
    let descriptionText = "To create new memories, you need an active Host Pass. Activate your 6-month free pass now, or purchase a 31-day pass if your free period has ended.";


    if (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') {
      buttonText = "Purchase Host Pass";
      ButtonIcon = Zap;
      action = purchasePaidHostPass;
      titleText = "Renew Host Pass to Create Memories";
      if (isFetchingAuthHostPassPrice) {
        buttonText = "Fetching price...";
        disabled = true;
      } else if (hostPassPriceDetails) {
        priceString = ` (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.passPrice)})`;
        buttonText += priceString;
      } else {
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
              <p>{descriptionText}</p>
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
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(promptIdFromQuery ? '/prompts' : '/timeline')}>
                      {promptIdFromQuery ? 'Back to Life Journey' : 'Back to Timeline'}
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
          key={memoryToEdit?.id || 'new-memory-form'} 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          memory={memoryToEdit}
        />
      </div>
    </AuthenticatedPageWrapper>
  );
}
    
