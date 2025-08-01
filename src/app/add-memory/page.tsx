
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
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
  const customPromptTextFromQuery = searchParams.get('prompt');
  const isCreatingNew = !editMemoryId;

  useEffect(() => {
    const loadOrCreateMemoryState = async () => {
      if (editMemoryId && user) {
        setIsLoadingMemory(true);
        try {
          const memoryDocRef = doc(db, "users", user.id, "memories", editMemoryId);
          const memorySnap = await getDoc(memoryDocRef);
          if (memorySnap.exists()) {
            const memoryData = memorySnap.data() as Omit<Memory, 'id'>;
            // Convert Firestore Timestamps to ISO strings for consistency
            const convertedData = {
              ...memoryData,
              date: (memoryData.date as any instanceof Timestamp) ? (memoryData.date as unknown as Timestamp).toDate().toISOString() : memoryData.date,
              createdAt: (memoryData.createdAt as any instanceof Timestamp) ? (memoryData.createdAt as unknown as Timestamp).toDate().toISOString() : memoryData.createdAt,
              updatedAt: (memoryData.updatedAt as any instanceof Timestamp) ? (memoryData.updatedAt as unknown as Timestamp).toDate().toISOString() : memoryData.updatedAt,
            };
            setMemoryToEdit({ id: memorySnap.id, ...convertedData });
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
        setMemoryToEdit(undefined);
        setIsLoadingMemory(false);
      }
    };

    if (!authLoading) {
      loadOrCreateMemoryState();
    }
  }, [editMemoryId, user, authLoading, router]);

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
        const uploadTask = await uploadBytes(fileRef, mediaFileToUpload);
        const downloadURL = await getDownloadURL(uploadTask.ref);

        if (memoryData.mediaAttachments && memoryData.mediaAttachments.length > 0) {
          processedMediaAttachments = [{
            ...memoryData.mediaAttachments[0],
            url: downloadURL,
            filename: mediaFileToUpload.name,
            size: mediaFileToUpload.size,
          }];
        } else {
           processedMediaAttachments = [{
            id: Date.now().toString(),
            type: mediaFileToUpload.type.startsWith('video/') ? 'video' : 'audio',
            url: downloadURL,
            filename: mediaFileToUpload.name,
            size: mediaFileToUpload.size,
          }];
        }
        
        if (oldMediaUrl && oldMediaUrl !== downloadURL && oldMediaUrl.includes('firebasestorage.googleapis.com')) {
          try {
            const oldFileStorageRef = storageRef(storage, oldMediaUrl);
            await deleteObject(oldFileStorageRef);
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
    } else if (!mediaFileToUpload && memoryData.mediaAttachments === undefined && oldMediaUrl) {
      processedMediaAttachments = undefined;
      if (oldMediaUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const oldFileStorageRef = storageRef(storage, oldMediaUrl);
          await deleteObject(oldFileStorageRef);
        } catch (deleteError: any) {
           if (deleteError.code !== 'storage/object-not-found') {
              console.warn("Could not delete old media (cleared by user) from storage:", deleteError);
           }
        }
      }
    }

    const finalPromptId = memoryData.promptId || promptIdFromQuery || memoryToEdit?.promptId || undefined;

    const dataToSave: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> & { userId: string; updatedAt: any; createdAt?: any, mediaAttachments?: MediaAttachment[], promptId?: string, date: any } = {
      ...memoryData,
      mediaAttachments: processedMediaAttachments,
      userId: user.id,
      promptId: finalPromptId,
      date: Timestamp.fromDate(new Date(memoryData.date)),
      updatedAt: serverTimestamp(),
    };

    try {
      if (memoryToEdit && editMemoryId) {
        const memoryDocRef = doc(db, "users", user.id, "memories", editMemoryId);
        await updateDoc(memoryDocRef, dataToSave);
        toast({ title: "Memory Updated!", description: `"${dataToSave.title}" has been saved.` });
      } else {
        const memoriesColRef = collection(db, "users", user.id, "memories");
        dataToSave.createdAt = serverTimestamp();
        await addDoc(memoriesColRef, dataToSave);
        toast({ title: "Memory Added!", description: `"${dataToSave.title}" has been saved.` });
      }

      await calculateAndUpdateStorageUsage(user.id);

      router.push(finalPromptId ? '/prompts' : '/timeline');
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
          key={memoryToEdit?.id || promptIdFromQuery || 'new-memory-form'}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          memory={memoryToEdit}
          initialPromptId={promptIdFromQuery ? decodeURIComponent(promptIdFromQuery) : undefined}
          initialCustomPromptText={customPromptTextFromQuery ? decodeURIComponent(customPromptTextFromQuery) : undefined}
        />
      </div>
    </AuthenticatedPageWrapper>
  );
}
