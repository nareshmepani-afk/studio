
"use client";

import { Suspense } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Memory, MediaAttachment, EmotionTag, MemoryCategory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { app } from '@/lib/firebase';
import { getFirestore, addDoc, doc, updateDoc, getDoc, collection, serverTimestamp, deleteField, setDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { Loader2 } from 'lucide-react';
import { parseISO, isValid, format, getYear } from 'date-fns';
import { enGB } from 'date-fns/locale';

// Define date constants here, as they are used by the Select components in this component's render method
const globalCurrentYear = new Date().getFullYear();
const years: number[] = Array.from({ length: 101 }, (_, i) => globalCurrentYear - i);
const months: { value: number; label: string }[] = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(new Date(2000, i, 1), 'MMMM', { locale: enGB }),
}));


function AddMemoryPageComponent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const editMemoryId = searchParams.get('editMemoryId');
  const initialPromptId = searchParams.get('promptId') || undefined;
  const initialCustomPromptText = searchParams.get('prompt') || undefined;

  // --- State Lifted to Parent Component ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMemory, setIsLoadingMemory] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memoryDate, setMemoryDate] = useState<Date>(new Date());
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(undefined);
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>([]);
  const [isLegacy, setIsLegacy] = useState(false);

  const [currentMedia, setCurrentMedia] = useState<Omit<MediaAttachment, 'id'> | null>(null);
  const [mediaFileToUpload, setMediaFileToUpload] = useState<File | null>(null);
  const [mediaHasBeenRemoved, setMediaHasBeenRemoved] = useState(false);
  const [originalMemory, setOriginalMemory] = useState<Memory | null>(null);

  useEffect(() => {
    console.log("[AddMemoryPage] useEffect: Main effect triggered.");
    if (editMemoryId && user) {
      console.log(`[AddMemoryPage] useEffect: Fetching memory with ID: ${editMemoryId}`);
      const db = getFirestore(app);
      const fetchMemory = async () => {
        setIsLoadingMemory(true);
        try {
          const memoryDocRef = doc(db, 'users', user.id, 'memories', editMemoryId);
          const docSnap = await getDoc(memoryDocRef);
          if (docSnap.exists()) {
            console.log("[AddMemoryPage] useEffect: Document found. Populating ALL state in parent.");
            const data = docSnap.data() as Memory;
            setOriginalMemory({ ...data, id: docSnap.id }); // Store original for comparison

            setTitle(data.title || '');
            setDescription(data.description || '');
            setMemoryDate(data.date && isValid(parseISO(data.date)) ? parseISO(data.date) : new Date());
            setLocation(data.location || '');
            setCountry(data.country || '');
            setSelectedCategory(data.category);
            setSelectedEmotionTags(data.emotionTags || []);
            setIsLegacy(data.isLegacy || false);
            
            if (data.mediaAttachments && data.mediaAttachments.length > 0) {
              console.log("[AddMemoryPage] useEffect: Populating existing media state.", data.mediaAttachments[0]);
              setCurrentMedia(data.mediaAttachments[0]);
            } else {
              console.log("[AddMemoryPage] useEffect: No existing media found.");
              setCurrentMedia(null);
            }
            setMediaFileToUpload(null);
            setMediaHasBeenRemoved(false);

          } else {
            console.error(`[AddMemoryPage] Memory with ID ${editMemoryId} not found.`);
            toast({ title: "Memory not found", variant: "destructive" });
            router.push('/timeline');
          }
        } catch (error) {
          console.error("[AddMemoryPage] Error fetching memory:", error);
          toast({ title: "Error loading memory", variant: "destructive" });
        } finally {
          console.log("[AddMemoryPage] useEffect: Finished fetching memory.");
          setIsLoadingMemory(false);
        }
      };
      fetchMemory();
    } else {
        // New memory setup
        console.log("[AddMemoryPage] useEffect: No editMemoryId, setting up for new memory.");
        setIsLoadingMemory(false);
        setTitle(initialCustomPromptText || '');
        // Reset all other fields for a clean form
        setDescription('');
        setMemoryDate(new Date());
        setLocation('');
        setCountry('');
        setSelectedCategory(undefined);
        setSelectedEmotionTags([]);
        setIsLegacy(false);
        setCurrentMedia(null);
        setMediaFileToUpload(null);
        setMediaHasBeenRemoved(false);
        setOriginalMemory(null);
    }
  }, [editMemoryId, user, router, initialCustomPromptText]);

  const handleMediaDiscard = useCallback(() => {
    console.log("[AddMemoryPage] handleMediaDiscard: Clearing media state.");
    setCurrentMedia(null);
    setMediaFileToUpload(null);
    setMediaHasBeenRemoved(true); // Flag that media was explicitly removed
  }, []);

  const handleNewMediaReady = useCallback((newFile: File, mediaData: Omit<MediaAttachment, 'id' | 'url'>) => {
      console.log("[AddMemoryPage] handleNewMediaReady: New media is ready.", { newFile, mediaData });
      setCurrentMedia({ ...mediaData, url: URL.createObjectURL(newFile) });
      setMediaFileToUpload(newFile);
      setMediaHasBeenRemoved(false); // New media is present, so it hasn't been "removed"
  }, []);


  const handleSubmit = async () => {
    console.log("[AddMemoryPage] handleSubmit: Initiating save process.");
    if (!user) {
      toast({ title: "Authentication Error", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const db = getFirestore(app);
    const storage = getStorage(app);

    try {
      const isEditing = !!editMemoryId;
      const memoryDocRef = isEditing
        ? doc(db, 'users', user.id, 'memories', editMemoryId!)
        : doc(collection(db, 'users', user.id, 'memories'));
      
      let finalMediaAttachment: Omit<MediaAttachment, 'id'> | null | undefined = currentMedia;
      
      // Handle Deletion of Old Media if a new file is uploaded or media was removed
      const oldMediaUrl = originalMemory?.mediaAttachments?.[0]?.url;
      if (isEditing && oldMediaUrl && (mediaFileToUpload || mediaHasBeenRemoved)) {
          console.log("[AddMemoryPage] handleSubmit: Deleting old media from Storage.");
          try {
              const oldFileRef = storageRef(storage, oldMediaUrl);
              await deleteObject(oldFileRef);
          } catch (deleteError: any) {
              if (deleteError.code === 'storage/object-not-found') {
                  console.warn("[AddMemoryPage] Old media file not found in Storage, but proceeding anyway.");
              } else {
                  throw deleteError; // Rethrow other deletion errors
              }
          }
      }

      // Handle Upload of New Media
      if (mediaFileToUpload && currentMedia) {
        console.log("[AddMemoryPage] handleSubmit: Uploading new media file.");
        const filePath = `memories/${user.id}/${memoryDocRef.id}-${mediaFileToUpload.name}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, mediaFileToUpload);

        const { id: toastId } = toast({ title: "Uploading Media 0%...", description: "Your file is being uploaded. Please wait." });

        const downloadURL = await new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`[AddMemoryPage] Upload progress: ${progress}%`);
              toast.update(toastId, { title: `Uploading Media ${Math.round(progress)}%...`});
            },
            (error) => { 
                console.error("[AddMemoryPage] Upload failed.", error);
                reject(error); 
            },
            async () => { 
                try {
                    console.log("[AddMemoryPage] Upload complete, getting download URL.");
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(url);
                } catch(error) {
                    console.error("[AddMemoryPage] Failed to get download URL.", error);
                    reject(error);
                }
            }
          );
        });
        
        finalMediaAttachment = {
          ...currentMedia,
          url: downloadURL,
          size: mediaFileToUpload.size, // Ensure final size is from the uploaded file
        };
        toast.update(toastId, { title: "Upload Complete!", description: "Finalizing memory...", variant: "success" });
      }

      // Construct final data for Firestore
      console.log("[AddMemoryPage] handleSubmit: Constructing final data for Firestore.");
      const memoryDataForFirestore: Omit<Memory, 'id'> = {
        title,
        description,
        date: memoryDate.toISOString(),
        location: location || undefined,
        country: country || undefined,
        category: selectedCategory,
        emotionTags: selectedEmotionTags,
        isLegacy,
        promptId: isEditing ? (originalMemory?.promptId || initialPromptId) : initialPromptId,
        userId: user.id,
        createdAt: isEditing ? originalMemory?.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        mediaAttachments: mediaHasBeenRemoved ? [] : (finalMediaAttachment ? [finalMediaAttachment] : (isEditing ? originalMemory?.mediaAttachments || [] : [])),
      };
      
      // Special handling for delete field
      const finalUpdateData: { [key: string]: any } = { ...memoryDataForFirestore };
      if (mediaHasBeenRemoved && isEditing) {
          console.log("[AddMemoryPage] handleSubmit: Media was removed, using deleteField() for update.");
          finalUpdateData.mediaAttachments = deleteField();
      }

      if (isEditing) {
          console.log("[AddMemoryPage] handleSubmit: Updating existing document.");
          await updateDoc(memoryDocRef, finalUpdateData);
          toast({ title: "Memory Updated!", variant: "success" });
      } else {
          console.log("[AddMemoryPage] handleSubmit: Creating new document.");
          await setDoc(memoryDocRef, finalUpdateData);
          toast({ title: "Memory Saved!", variant: "success" });
      }

      if (finalUpdateData.promptId) router.push('/prompts'); else router.push('/timeline');

    } catch (error) {
      console.error("[AddMemoryPage] An error occurred during the save process:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Failed to Save Memory", description: `An unexpected error occurred: ${errorMessage}`, variant: "destructive" });
    } finally {
      console.log("[AddMemoryPage] handleSubmit: Save process finished.");
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

  // Combine all state into a single object for MemoryForm's formState prop
  const formState = {
    title,
    description,
    memoryDate,
    location,
    country,
    selectedCategory,
    selectedEmotionTags,
    isLegacy,
    currentMedia,
  };

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <MemoryForm
          formState={formState}
          isEditing={!!editMemoryId}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialPromptId={initialPromptId}
          initialCustomPromptText={initialCustomPromptText}
          onMediaDiscard={handleMediaDiscard}
          onNewMediaReady={handleNewMediaReady}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onMemoryDateChange={setMemoryDate}
          onLocationChange={setLocation}
          onCountryChange={setCountry}
          onSelectedCategoryChange={setSelectedCategory}
          onSelectedEmotionTagsChange={setSelectedEmotionTags}
          onIsLegacyChange={setIsLegacy}
          years={years}
          months={months}
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

