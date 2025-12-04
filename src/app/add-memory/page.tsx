
"use client";

import { Suspense, useState, useEffect, useCallback } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Memory, MediaAttachment, EmotionTag, MemoryCategory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { parseISO, isValid, format, getYear, getMonth, getDate } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { saveMemory } from '@/actions/memoryActions';
import { app } from '@/lib/firebase';

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

  useEffect(() => {
    if (editMemoryId && user) {
      const db = getFirestore(app);
      const fetchMemory = async () => {
        setIsLoadingMemory(true);
        try {
          const memoryDocRef = doc(db, 'users', user.id, 'memories', editMemoryId);
          const docSnap = await getDoc(memoryDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Memory;
            setTitle(data.title || '');
            setDescription(data.description || '');
            setMemoryDate(data.date && isValid(parseISO(data.date)) ? parseISO(data.date) : new Date());
            setLocation(data.location || '');
            setCountry(data.country || '');
            setSelectedCategory(data.category);
            setSelectedEmotionTags(data.emotionTags || []);
            setIsLegacy(data.isLegacy || false);
            if (data.mediaAttachments && data.mediaAttachments.length > 0) {
              setCurrentMedia(data.mediaAttachments[0]);
            } else {
              setCurrentMedia(null);
            }
            setMediaFileToUpload(null);
            setMediaHasBeenRemoved(false);
          } else {
            toast({ title: "Memory not found", variant: "destructive" });
            router.push('/timeline');
          }
        } catch (error) {
          toast({ title: "Error loading memory", variant: "destructive" });
        } finally {
          setIsLoadingMemory(false);
        }
      };
      fetchMemory();
    } else {
        setIsLoadingMemory(false);
        setTitle(initialCustomPromptText || '');
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
    }
  }, [editMemoryId, user, router, initialCustomPromptText]);

  const handleMediaDiscard = useCallback(() => {
    setCurrentMedia(null);
    setMediaFileToUpload(null);
    setMediaHasBeenRemoved(true);
  }, []);

  const handleNewMediaReady = useCallback((newFile: File, mediaData: Omit<MediaAttachment, 'id' | 'url'>) => {
      setCurrentMedia({ ...mediaData, url: URL.createObjectURL(newFile) });
      setMediaFileToUpload(newFile);
      setMediaHasBeenRemoved(false);
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Authentication Error", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', memoryDate.toISOString());
    formData.append('location', location);
    formData.append('country', country);
    if(selectedCategory) formData.append('category', JSON.stringify(selectedCategory));
    formData.append('emotionTags', JSON.stringify(selectedEmotionTags));
    formData.append('isLegacy', JSON.stringify(isLegacy));
    if(initialPromptId) formData.append('promptId', initialPromptId);
    
    formData.append('mediaHasBeenRemoved', JSON.stringify(mediaHasBeenRemoved));

    if (mediaFileToUpload) {
        formData.append('mediaFile', mediaFileToUpload);
        if (currentMedia?.duration) {
            formData.append('mediaDuration', JSON.stringify(currentMedia.duration));
        }
    } else if (currentMedia && !mediaHasBeenRemoved) {
        formData.append('currentMedia', JSON.stringify(currentMedia));
    }
    
    const result = await saveMemory(formData, user.id, editMemoryId);

    if (result.success) {
      toast({ title: result.message, variant: "success" });
      if (initialPromptId) {
          router.push('/prompts');
      } else {
          router.push('/timeline');
      }
    } else {
      toast({ title: "Failed to Save Memory", description: result.message, variant: "destructive" });
    }

    setIsSubmitting(false);
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
