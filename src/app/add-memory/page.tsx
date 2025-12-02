
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
import { getFirestore, addDoc, doc, updateDoc, getDoc, collection, serverTimestamp, deleteField, setDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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

    const cleanMemoryData: { [key: string]: any } = {};
    Object.entries(memoryData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanMemoryData[key] = value;
      }
    });
     // Special handling for empty strings to delete fields instead of saving them as empty
    Object.keys(cleanMemoryData).forEach(key => {
        if (cleanMemoryData[key] === '') {
            cleanMemoryData[key] = deleteField();
        }
    });

    try {
      let memoryDocRef;

      // Determine if we are creating or updating the Firestore document
      if (editMemoryId) {
        memoryDocRef = doc(db, 'users', user.id, 'memories', editMemoryId);
      } else {
        // For new memories, create the doc ref beforehand to get the ID
        memoryDocRef = doc(collection(db, 'users', user.id, 'memories'));
      }

      if (mediaFileToUpload) {
        // SCENARIO 1: NEW MEDIA UPLOAD (for new or existing memory)
        const storage = getStorage(app);
        const filePath = `memories/${user.id}/${memoryDocRef.id}-${mediaFileToUpload.name}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, mediaFileToUpload);

        const { id: toastId } = toast({
          title: "Uploading Media...",
          description: "Starting upload... 0%",
        });

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            toast.update(toastId, {
                description: `Upload is ${progress.toFixed(0)}% done`,
            });
          },
          (error) => {
            console.error("Upload failed:", error);
            toast.update(toastId, { title: "Upload Failed", description: `Your media could not be saved. Error: ${error.message}`, variant: "destructive" });
            setIsSubmitting(false);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const originalAttachmentData = (memoryData.mediaAttachments?.[0] || {}) as Partial<MediaAttachment>;

            const mediaAttachmentUpdate: MediaAttachment = {
                id: originalAttachmentData.id || 'media' + Date.now(),
                type: originalAttachmentData.type || 'video',
                startTime: originalAttachmentData.startTime || 0,
                endTime: originalAttachmentData.endTime || originalAttachmentData.duration || 0,
                duration: originalAttachmentData.duration || 0,
                isTrimmed: originalAttachmentData.isTrimmed || false,
                url: downloadURL,
                processingStatus: 'complete',
                filename: mediaFileToUpload.name,
                size: mediaFileToUpload.size,
            };

            const finalData = {
              ...cleanMemoryData,
              mediaAttachments: [mediaAttachmentUpdate],
              updatedAt: serverTimestamp(),
            };
            
            delete finalData.mediaFile; // Ensure no file object is sent to Firestore

            if (editMemoryId) {
              await updateDoc(memoryDocRef, finalData);
            } else {
              await setDoc(memoryDocRef, { ...finalData, userId: user.id, createdAt: serverTimestamp() });
            }

            toast.update(toastId, { title: "Memory Saved!", description: "Your memory and media have been successfully saved.", variant: "success" });
            setIsSubmitting(false);
            if (cleanMemoryData.promptId) router.push('/prompts'); else router.push('/timeline');
          }
        );

      } else {
        // SCENARIO 2: NO NEW MEDIA, JUST METADATA (CREATE OR UPDATE)
        const finalUpdateData = { ...cleanMemoryData, updatedAt: serverTimestamp() };
        
        if (editMemoryId) {
            await updateDoc(memoryDocRef, finalUpdateData);
            toast({ title: "Memory Updated!", variant: "success" });
        } else {
            await setDoc(memoryDocRef, { ...finalUpdateData, userId: user.id, createdAt: serverTimestamp() });
            toast({ title: "Memory Saved!", variant: "success" });
        }

        setIsSubmitting(false);
        if (cleanMemoryData.promptId) router.push('/prompts'); else router.push('/timeline');
      }

    } catch (error) {
      console.error("[handleSubmit] Error saving memory:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Failed to Save Memory", description: `An error occurred: ${errorMessage}`, variant: "destructive" });
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
