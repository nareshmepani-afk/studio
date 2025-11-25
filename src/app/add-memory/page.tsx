
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
import { Loader2 } from 'lucide-react';


function AddMemoryPageComponent() {
  const { user } = useAuth();
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
    memoryData: Omit<Memory, 'id' | 'userId'>,
    mediaFileToUpload?: File
  ) => {
    if (!user) {
      toast({ title: "Authentication Error", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const db = getFirestore(app);

    try {
      if (mediaFileToUpload) {
        // SCENARIO 1: A NEW MEDIA FILE IS BEING UPLOADED
        // This handles both creating new memories with media and replacing media on existing ones.
        toast({ title: "Uploading Media...", description: "Please wait, this may take a moment." });
        
        const formData = new FormData();
        formData.append('file', mediaFileToUpload);
        formData.append('userId', user.id);
        
        // Append other memory data to the form for the server to use
        formData.append('title', memoryData.title);
        formData.append('date', memoryData.date);
        formData.append('description', memoryData.description || '');
        if (memoryData.category) formData.append('category', memoryData.category);
        if (memoryData.promptId) formData.append('promptId', memoryData.promptId);
        
        // If we are editing, we pass the existing memory ID so the server can replace it.
        if (editMemoryId) {
            formData.append('memoryId', editMemoryId);
        }

        const response = await fetch('/api/process-video', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let errorText = 'Media processing failed on the server.';
          const rawText = await response.text(); 
          try {
              const result = JSON.parse(rawText);
              errorText = result.error || errorText;
          } catch(e) {
              errorText = rawText || errorText;
          }
          throw new Error(errorText);
        }

        toast({ title: "Memory Saved!", description: "Your memory has been processed and saved.", variant: "success" });

      } else if (editMemoryId && memoryToEdit) {
        // SCENARIO 2: NO NEW MEDIA, JUST UPDATING METADATA
        // This handles text-only changes for an existing memory.
        const memoryDocRef = doc(db, 'users', user.id, 'memories', memoryToEdit.id);
        
        // We can directly use memoryData because it contains all the updated text fields.
        // We just need to remove fields that shouldn't be directly written.
        const { mediaAttachments, ...dataToUpdate } = memoryData;
        
        // Firestore does not allow `undefined` values. We must clean the object.
        const cleanedDataToUpdate: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(dataToUpdate)) {
          if (value !== undefined) {
            cleanedDataToUpdate[key] = value;
          }
        }
        
        await updateDoc(memoryDocRef, {
            ...cleanedDataToUpdate,
            updatedAt: serverTimestamp()
        });
        toast({ title: "Memory Updated!", variant: "success" });

      } else {
         // SCENARIO 3: CREATING A NEW MEMORY WITHOUT ANY MEDIA
        const memoriesCollectionRef = collection(db, 'users', user.id, 'memories');
        await addDoc(memoriesCollectionRef, {
            ...memoryData,
            userId: user.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        toast({ title: "Memory Saved!", variant: "success" });
      }
      
      // Redirect after successful operation
      if (memoryData.promptId) {
        router.push('/prompts');
      } else {
        router.push('/timeline');
      }

    } catch (error) {
      console.error("[handleSubmit] Error saving memory:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Failed to Save Memory", description: `An error occurred: ${errorMessage}`, variant: "destructive" });
    } finally {
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
