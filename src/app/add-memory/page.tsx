
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
            // Ensure date is converted correctly from Firestore Timestamp
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
      // 1. Prepare the data, removing any undefined fields to prevent Firestore errors
      const cleanMemoryData: { [key: string]: any } = {};
      Object.entries(memoryData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanMemoryData[key] = value;
        }
      });
       Object.keys(cleanMemoryData).forEach(key => {
        // Also remove empty strings from optional fields, but keep for title/description
        if (key !== 'title' && key !== 'description' && cleanMemoryData[key] === '') {
            delete cleanMemoryData[key];
        }
    });


      const isEditing = !!editMemoryId;
      let memoryDocRef;

      if (isEditing) {
        memoryDocRef = doc(db, 'users', user.id, 'memories', editMemoryId!);
      } else {
        memoryDocRef = doc(collection(db, 'users', user.id, 'memories'));
      }

      // 2. Handle media upload if a file is present
      if (mediaFileToUpload) {
        const storage = getStorage(app);
        const filePath = `memories/${user.id}/${memoryDocRef.id}-${mediaFileToUpload.name}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, mediaFileToUpload);

        // Give immediate feedback that upload is starting
        const { id: toastId } = toast({
          title: "Uploading Media...",
          description: "Please wait while your media is being uploaded. You can follow the progress here.",
        });

        // The 'complete' function of the observer is the key to waiting for the upload
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              // Update progress
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              toast.update(toastId, {
                  title: `Uploading: ${Math.round(progress)}%`,
                  description: `Please stay on this page.`,
              });
            },
            (error) => {
              // Handle upload errors
              console.error("[handleSubmit] Upload failed:", error);
              toast.update(toastId, { title: "Upload Failed", description: `Your media could not be saved. Error: ${error.message}`, variant: "destructive" });
              setIsSubmitting(false);
              reject(error);
            },
            async () => {
              // Handle successful upload
              try {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  
                  // This is the correct point to build the final media attachment object
                  const newMediaAttachment: MediaAttachment = {
                      id: memoryData.mediaAttachments?.[0]?.id || 'media' + Date.now(),
                      type: mediaFileToUpload.type.startsWith('video') ? 'video' : 'audio',
                      url: downloadURL,
                      processingStatus: 'complete',
                      filename: mediaFileToUpload.name,
                      size: mediaFileToUpload.size,
                      duration: memoryData.mediaAttachments?.[0]?.duration,
                      startTime: memoryData.mediaAttachments?.[0]?.startTime,
                      endTime: memoryData.mediaAttachments?.[0]?.endTime,
                      isTrimmed: memoryData.mediaAttachments?.[0]?.isTrimmed || false,
                  };
      
                  const finalData = {
                    ...cleanMemoryData,
                    mediaAttachments: [newMediaAttachment],
                    updatedAt: serverTimestamp(),
                  };
                  
                  // Now save the complete data to Firestore
                  if (isEditing) {
                    await updateDoc(memoryDocRef, finalData);
                  } else {
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
        // 3. Handle saving data without a new media file (or if media was removed)
        const finalUpdateData = { ...cleanMemoryData, updatedAt: serverTimestamp() };
         // If media is explicitly removed during edit, ensure it's not in the final data
        if (isEditing && !memoryData.mediaAttachments) {
            finalUpdateData.mediaAttachments = deleteField();
        }

        if (isEditing) {
            await updateDoc(memoryDocRef, finalUpdateData);
            toast({ title: "Memory Updated!", variant: "success" });
        } else {
            await setDoc(memoryDocRef, { ...finalUpdateData, userId: user.id, createdAt: serverTimestamp() });
            toast({ title: "Memory Saved!", variant: "success" });
        }
      }

      // 4. Navigate on success
      if (cleanMemoryData.promptId) router.push('/prompts'); else router.push('/timeline');

    } catch (error) {
      // This is the top-level catch for the entire process
      console.error("[handleSubmit] An error occurred during the save process:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Failed to Save Memory", description: `An unexpected error occurred: ${errorMessage}`, variant: "destructive" });
    } finally {
      // This will always run, ensuring the UI is unlocked
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
