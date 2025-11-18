
"use client";

import { Suspense } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Memory, User, MediaAttachment } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { app } from '@/lib/firebase';
import { getFirestore, addDoc, doc, updateDoc, getDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2 } from 'lucide-react';


function AddMemoryPageComponent() {
  const { user, calculateAndUpdateStorageUsage } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const editMemoryId = searchParams.get('editMemoryId');
  const initialPromptId = searchParams.get('promptId') || undefined;
  const initialCustomPromptText = searchParams.get('prompt') || undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memoryToEdit, setMemoryToEdit] = useState<Memory | undefined>(undefined);
  const [isLoadingMemory, setIsLoadingMemory] = useState(true);

  
  

  useEffect(() => {
    if (editMemoryId && user) {
      const db = getFirestore(app);
      const fetchMemory = async () => {
        setIsLoadingMemory(true);
        try {
          const memoryDocRef = doc(db, 'users', user.id, 'memories', editMemoryId);
          const docSnap = await getDoc(memoryDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Ensure date is in ISO string format
            const date = data.date?.toDate ? data.date.toDate().toISOString() : data.date;
            setMemoryToEdit({ id: docSnap.id, ...data, date } as Memory);
          } else {
            toast({ title: "Memory not found", variant: "destructive" });
            router.push('/timeline');
          }
        } catch (error) {
          toast({ title: "Error loading memory", variant: "destructive" });
          console.error("Error fetching memory:", error);
          router.push('/timeline');
        } finally {
          setIsLoadingMemory(false);
        }
      };
      fetchMemory();
    } else {
        setIsLoadingMemory(false);
    }
  }, [editMemoryId, user, router]);

  const handleSubmit = async (
    memoryData: Omit<Memory, 'id' | 'userId'> & { promptId?: string },
    mediaFileToUpload?: File
  ) => {
    if (!user) {
      toast({ title: "Authentication Error", variant: "destructive" });
      console.error("[handleSubmit] Stopped: No authenticated user.");
      return;
    }
    setIsSubmitting(true);
    console.log("[handleSubmit] Started. User:", user.id);

    try {
      const db = getFirestore(app);
      const storage = getStorage(app);
      let finalMediaAttachments = memoryData.mediaAttachments;

      if (mediaFileToUpload) {
        console.log("[handleSubmit] Media file to upload found:", mediaFileToUpload);
        const filePath = `users/${user.id}/memories/${Date.now()}_${mediaFileToUpload.name}`;
        const fileRef = storageRef(storage, filePath);
        
        console.log(`[handleSubmit] Preparing to upload to: ${filePath}`);
        
        toast({ title: "Uploading media...", description: "Please wait, this may take a moment."});
        
        console.log('[handleSubmit] Calling uploadBytes...');
        const uploadResult = await uploadBytes(fileRef, mediaFileToUpload);
        console.log('[handleSubmit] uploadBytes promise resolved. Result:', uploadResult);
        
        const downloadURL = await getDownloadURL(uploadResult.ref);

        console.log('[handleSubmit] Client-side upload successful. Download URL:', downloadURL);
        toast({ title: "Media Upload Complete!", variant: "success" });

        if (finalMediaAttachments && finalMediaAttachments.length > 0) {
            finalMediaAttachments[0].url = downloadURL;
        } else {
            finalMediaAttachments = [{
                id: 'media' + Date.now(),
                type: mediaFileToUpload.type.startsWith('video') ? 'video' : 'audio',
                url: downloadURL,
                filename: mediaFileToUpload.name,
                duration: memoryData.mediaAttachments?.[0]?.duration,
                size: mediaFileToUpload.size,
            }];
        }
        console.log('[handleSubmit] Final media attachments object:', finalMediaAttachments);

      } else {
          console.log("[handleSubmit] No new media file to upload.");
      }

      if (editMemoryId && memoryToEdit) {
        // Update existing memory
        console.log(`[handleSubmit] Updating existing memory: ${memoryToEdit.id}`);
        const memoryDocRef = doc(db, 'users', user.id, 'memories', memoryToEdit.id);
        await updateDoc(memoryDocRef, {
            ...memoryData,
            mediaAttachments: finalMediaAttachments,
            updatedAt: serverTimestamp()
        });
        toast({ title: "Memory Updated Successfully!", variant: "success" });
      } else {
        // Create new memory
        console.log("[handleSubmit] Creating new memory document.");
        const memoriesCollectionRef = collection(db, 'users', user.id, 'memories');
        await addDoc(memoriesCollectionRef, {
            ...memoryData,
            userId: user.id,
            mediaAttachments: finalMediaAttachments,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        toast({ title: "Memory Saved Successfully!", variant: "success" });
      }
      
      // Update storage usage in background
      console.log("[handleSubmit] Calculating and updating storage usage.");
      calculateAndUpdateStorageUsage(user.id);
      
      // Redirect based on whether it was a prompt-based chapter or a freeform one
      if (memoryData.promptId) {
        console.log('[handleSubmit] Redirecting to /prompts');
        router.push('/prompts');
      } else {
        console.log('[handleSubmit] Redirecting to /timeline');
        router.push('/timeline');
      }

    } catch (error) {
      console.error("[handleSubmit] Error saving memory:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Failed to Save Memory", description: `An error occurred while saving: ${errorMessage}`, variant: "destructive" });
    } finally {
      console.log('[handleSubmit] Finished.');
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingMemory) {
      return (
          <AuthenticatedPageWrapper>
              <div className="container mx-auto py-8 px-4 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground mt-4">Loading memory...</p>
              </div>
          </AuthenticatedPageWrapper>
      );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <MemoryForm
          memory={memoryToEdit}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialPromptId={initialPromptId}
          initialCustomPromptText={initialCustomPromptText}
        />
      </div>
    </AuthenticatedPageWrapper>
  );
}

export default function AddMemoryPage() {
    return (
        <Suspense fallback={
            <AuthenticatedPageWrapper>
                <div className="container mx-auto py-8 px-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                </div>
            </AuthenticatedPageWrapper>
        }>
            <AddMemoryPageComponent />
        </Suspense>
    );
}

    