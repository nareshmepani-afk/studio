
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
        console.log(`[AddMemoryPage] useEffect: Fetching memory with ID: ${editMemoryId}`);
        setIsLoadingMemory(true);
        try {
          const memoryDocRef = doc(db, 'users', user.id, 'memories', editMemoryId);
          const docSnap = await getDoc(memoryDocRef);
          if (docSnap.exists()) {
            console.log("[AddMemoryPage] useEffect: Document found.");
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

    try {
      const cleanMemoryData: { [key: string]: any } = {};
      Object.entries(memoryData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanMemoryData[key] = value;
        }
      });
      Object.keys(cleanMemoryData).forEach(key => {
        if (key !== 'title' && key !== 'description' && cleanMemoryData[key] === '') {
            delete cleanMemoryData[key];
        }
      });
      console.log("[handleSubmit] Cleaned memory data for Firestore:", cleanMemoryData);

      const isEditing = !!editMemoryId;
      const memoryDocRef = isEditing
        ? doc(db, 'users', user.id, 'memories', editMemoryId!)
        : doc(collection(db, 'users', user.id, 'memories'));
      console.log(`[handleSubmit] Mode: ${isEditing ? 'Editing' : 'Creating'}. Doc ID: ${memoryDocRef.id}`);

      if (mediaFileToUpload) {
        console.log("[handleSubmit] New media file detected. Starting upload process.", { name: mediaFileToUpload.name, size: mediaFileToUpload.size });
        const storage = getStorage(app);
        const filePath = `memories/${user.id}/${memoryDocRef.id}-${mediaFileToUpload.name}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, mediaFileToUpload);

        const { id: toastId } = toast({
          title: "Uploading Media...",
          description: "Your file is being uploaded. Please wait.",
        });

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`[handleSubmit] Upload progress: ${progress}%`);
              toast.update(toastId, {
                  title: `Uploading: ${Math.round(progress)}%`,
                  description: `Please stay on this page.`,
              });
            },
            (error) => {
              console.error("[handleSubmit] Upload failed:", error);
              toast.update(toastId, { title: "Upload Failed", description: `Your media could not be saved. Error: ${error.message}`, variant: "destructive" });
              reject(error);
            },
            async () => {
              try {
                console.log("[handleSubmit] Upload complete. Getting download URL.");
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                const finalMediaAttachment = {
                  ...(memoryData.mediaAttachments?.[0]),
                  url: downloadURL,
                  processingStatus: 'complete',
                };
                console.log("[handleSubmit] Final media attachment object:", finalMediaAttachment);

                const finalData = {
                  ...cleanMemoryData,
                  mediaAttachments: [finalMediaAttachment],
                  updatedAt: serverTimestamp(),
                };
                
                if (isEditing) {
                  console.log("[handleSubmit] Updating Firestore document with new media info.");
                  await updateDoc(memoryDocRef, finalData);
                } else {
                  console.log("[handleSubmit] Creating Firestore document with new media info.");
                  await setDoc(memoryDocRef, { ...finalData, userId: user.id, createdAt: serverTimestamp() });
                }
      
                toast.update(toastId, { title: "Memory Saved!", description: "Your memory and media have been successfully saved.", variant: "success", duration: 5000 });
                resolve();
              } catch (finalSaveError) {
                  console.error("[handleSubmit] Error during final Firestore save after upload:", finalSaveError);
                  const errorMessage = finalSaveError instanceof Error ? finalSaveError.message : "An unknown error occurred.";
                  toast.update(toastId, { title: "Failed to Save Memory Data", description: `The media was uploaded, but saving the memory details failed. Error: ${errorMessage}`, variant: "destructive" });
                  reject(finalSaveError);
              }
            }
          );
        });
      } else {
        const finalUpdateData = { ...cleanMemoryData, updatedAt: serverTimestamp() };
        if (isEditing && memoryData.mediaAttachments === null) {
            console.log("[handleSubmit] Media explicitly removed during edit. Deleting field.");
            finalUpdateData.mediaAttachments = deleteField();
        } else if (isEditing) {
            console.log("[handleSubmit] No new media file. Updating text fields only.");
        } else {
            console.log("[handleSubmit] Creating new memory without a media file.");
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
