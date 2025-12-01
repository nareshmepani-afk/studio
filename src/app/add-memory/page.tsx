
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
    
    // --- AUTHENTIC FIX: Sanitize data to remove 'undefined' values ---
    const cleanMemoryData: { [key: string]: any } = {};
    Object.keys(memoryData).forEach(key => {
      const value = (memoryData as any)[key];
      if (value !== undefined) {
        cleanMemoryData[key] = value;
      }
    });
    // --- END FIX ---

    try {
      if (mediaFileToUpload) {
        let memoryDocRef;
        // Step 1: Create/Update Firestore doc with 'processing' status
        if (editMemoryId) {
            memoryDocRef = doc(db, 'users', user.id, 'memories', editMemoryId);
            await updateDoc(memoryDocRef, { ...cleanMemoryData, updatedAt: serverTimestamp(), 'mediaAttachments.0.processingStatus': 'uploading' });
        } else {
            memoryDocRef = await addDoc(collection(db, 'users', user.id, 'memories'), { ...cleanMemoryData, userId: user.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), 'mediaAttachments.0.processingStatus': 'uploading' });
        }
        
        // Step 2: Upload file to Cloud Storage
        const storage = getStorage(app);
        const filePath = `users/${user.id}/memories/${memoryDocRef.id}/${mediaFileToUpload.name}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, mediaFileToUpload);

        // Step 3: Monitor upload progress
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
            toast.update(toastId, { title: "Upload Failed", description: "Your video could not be saved. Please try again.", variant: "destructive" });
            updateDoc(memoryDocRef, { 'mediaAttachments.0.processingStatus': 'failed' });
            setIsSubmitting(false);
          },
          async () => {
            // Step 4: Get download URL and update Firestore doc
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const mediaAttachmentUpdate: MediaAttachment = {
                ...(cleanMemoryData.mediaAttachments?.[0] as MediaAttachment),
                url: downloadURL,
                processingStatus: 'complete',
                filename: mediaFileToUpload.name,
                size: mediaFileToUpload.size,
            };
            await updateDoc(memoryDocRef, {
                'mediaAttachments.0': mediaAttachmentUpdate,
                 updatedAt: serverTimestamp(),
            });

            toast.update(toastId, { title: "Memory Saved!", description: "Your memory and media have been successfully saved.", variant: "success" });
            setIsSubmitting(false);
            if (cleanMemoryData.promptId) router.push('/prompts'); else router.push('/timeline');
          }
        );

      } else if (editMemoryId && memoryToEdit) {
        // SCENARIO 2: NO NEW MEDIA, JUST UPDATING METADATA
        const memoryDocRef = doc(db, 'users', user.id, 'memories', memoryToEdit.id);
        await updateDoc(memoryDocRef, { ...cleanMemoryData, updatedAt: serverTimestamp() });
        toast({ title: "Memory Updated!", variant: "success" });
        setIsSubmitting(false);
        if (cleanMemoryData.promptId) router.push('/prompts'); else router.push('/timeline');

      } else {
         // SCENARIO 3: CREATING A NEW MEMORY WITHOUT ANY MEDIA
        const memoriesCollectionRef = collection(db, 'users', user.id, 'memories');
        await addDoc(memoriesCollectionRef, { ...cleanMemoryData, userId: user.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        toast({ title: "Memory Saved!", variant: "success" });
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
