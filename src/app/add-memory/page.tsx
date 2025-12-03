
"use client";

import { Suspense } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Memory, MediaAttachment } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { app } from '@/lib/firebase';
import { getFirestore, addDoc, doc, updateDoc, getDoc, collection, serverTimestamp, deleteField, setDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
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
  const [mediaHasBeenRemoved, setMediaHasBeenRemoved] = useState(false);

  useEffect(() => {
    if (editMemoryId && user) {
      const db = getFirestore(app);
      const fetchMemory = async () => {
        console.log(`[AddMemoryPage] useEffect: Fetching memory with ID: ${editMemoryId}`);
        setIsLoadingMemory(true);
        try {
          const memoryDocRef = doc(db, 'users', user.id, 'memories', editMemoryId);
          const docSnap = await getDoc(memoryDocRef);
          if (docSnap.exists()) {
            console.log("[AddMemoryPage] useEffect: Document found, populating form state.");
            const data = docSnap.data();
            const date = data.date?.toDate ? data.date.toDate().toISOString() : data.date;
            setMemoryToEdit({ id: docSnap.id, ...data, date } as Memory);
          } else {
            console.error(`[AddMemoryPage] useEffect: Memory with ID ${editMemoryId} not found.`);
            toast({ title: "Memory not found", variant: "destructive" });
            router.push('/timeline');
          }
        } catch (error) {
          console.error("[AddMemoryPage] useEffect: Error fetching memory:", error);
          toast({ title: "Error loading memory", variant: "destructive" });
          router.push('/timeline');
        } finally {
          setIsLoadingMemory(false);
          console.log("[AddMemoryPage] useEffect: Finished fetching memory.");
        }
      };
      fetchMemory();
    } else {
        setIsLoadingMemory(false);
        if (editMemoryId) console.log(`[AddMemoryPage] useEffect: editMemoryId present but no user, skipping fetch.`);
    }
  }, [editMemoryId, user, router]);

  const handleMediaDiscard = useCallback(() => {
    console.log("[AddMemoryPage] handleMediaDiscard: Media has been explicitly discarded by the user.");
    setMediaHasBeenRemoved(true);
  }, []);

  const handleSubmit = async (
    memoryData: Omit<Memory, 'id' | 'userId'>,
    mediaFileToUpload?: File
  ) => {
    if (!user) {
      toast({ title: "Authentication Error", variant: "destructive" });
      console.error("[handleSubmit] User not authenticated.");
      return;
    }
    setIsSubmitting(true);
    console.log("[handleSubmit] Starting submission process...");
    const db = getFirestore(app);
    const storage = getStorage(app);

    try {
      const cleanMemoryData: { [key: string]: any } = {};
      Object.entries(memoryData).forEach(([key, value]) => {
        if (value !== undefined) cleanMemoryData[key] = value;
      });
      console.log("[handleSubmit] Cleaned memory data for submission:", cleanMemoryData);

      const isEditing = !!editMemoryId;
      const memoryDocRef = isEditing
        ? doc(db, 'users', user.id, 'memories', editMemoryId!)
        : doc(collection(db, 'users', user.id, 'memories'));
      console.log(`[handleSubmit] Mode: ${isEditing ? 'Editing' : 'Creating'}. Doc ID: ${memoryDocRef.id}`);

      // Handle deletion of old media if necessary (only in edit mode)
      const oldMediaUrl = isEditing ? memoryToEdit?.mediaAttachments?.[0]?.url : undefined;
      if (isEditing && oldMediaUrl && (mediaFileToUpload || mediaHasBeenRemoved)) {
          console.log("[handleSubmit] A new file is being uploaded or media was removed. Deleting old media from Storage:", oldMediaUrl);
          try {
              const oldFileRef = storageRef(storage, oldMediaUrl);
              await deleteObject(oldFileRef);
              console.log("[handleSubmit] Successfully deleted old media from Storage.");
          } catch (deleteError: any) {
              if (deleteError.code === 'storage/object-not-found') {
                  console.warn("[handleSubmit] Old media file not found in Storage, but proceeding anyway.");
              } else {
                  throw deleteError; // Rethrow other deletion errors
              }
          }
      }

      if (mediaFileToUpload) {
        console.log("[handleSubmit] New media file detected. Starting upload process.", { name: mediaFileToUpload.name, size: mediaFileToUpload.size });
        const filePath = `memories/${user.id}/${memoryDocRef.id}-${mediaFileToUpload.name}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, mediaFileToUpload);

        const { id: toastId } = toast({ title: "Uploading Media...", description: "Your file is being uploaded. Please wait." });

        const downloadURL = await new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => { /* Progress reporting */ },
            (error) => { reject(error); },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (finalError) {
                reject(finalError);
              }
            }
          );
        });

        console.log("[handleSubmit] Upload complete. Download URL obtained:", downloadURL);
        const newMediaAttachment: MediaAttachment = {
            id: 'media' + Date.now(),
            type: memoryData.mediaAttachments?.[0]?.type || 'video',
            url: downloadURL,
            processingStatus: 'complete',
            filename: mediaFileToUpload.name,
            size: mediaFileToUpload.size,
            duration: memoryData.mediaAttachments?.[0]?.duration,
            startTime: memoryData.mediaAttachments?.[0]?.startTime,
            endTime: memoryData.mediaAttachments?.[0]?.endTime,
            isTrimmed: memoryData.mediaAttachments?.[0]?.isTrimmed,
        };

        const finalData = { ...cleanMemoryData, mediaAttachments: [newMediaAttachment], updatedAt: serverTimestamp() };
        if (isEditing) {
          console.log("[handleSubmit] Updating Firestore document with new media info.");
          await updateDoc(memoryDocRef, finalData);
        } else {
          console.log("[handleSubmit] Creating Firestore document with new media info.");
          await setDoc(memoryDocRef, { ...finalData, userId: user.id, createdAt: serverTimestamp() });
        }
        toast.update(toastId, { title: "Memory Saved!", description: "Your memory and media have been successfully saved.", variant: "success", duration: 5000 });

      } else { // No new file to upload
        let finalUpdateData = { ...cleanMemoryData, updatedAt: serverTimestamp() };
        if (isEditing && mediaHasBeenRemoved) {
          console.log("[handleSubmit] Media explicitly removed during edit. Deleting field from Firestore.");
          finalUpdateData.mediaAttachments = deleteField();
        } else {
          console.log("[handleSubmit] No new media file. Updating text fields only or no media changes.");
        }

        if (isEditing) {
            await updateDoc(memoryDocRef, finalUpdateData);
            toast({ title: "Memory Updated!", variant: "success" });
        } else {
            await setDoc(memoryDocRef, { ...finalUpdateData, userId: user.id, createdAt: serverTimestamp() });
            toast({ title: "Memory Saved!", variant: "success" });
        }
      }

      console.log("[handleSubmit] Submission process successful. Navigating away.");
      if (cleanMemoryData.promptId) router.push('/prompts'); else router.push('/timeline');

    } catch (error) {
      console.error("[handleSubmit] An error occurred during the save process:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Failed to Save Memory", description: `An unexpected error occurred: ${errorMessage}`, variant: "destructive" });
    } finally {
      console.log("[handleSubmit] Unlocking UI, setting isSubmitting to false.");
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
          onMediaDiscard={handleMediaDiscard}
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
