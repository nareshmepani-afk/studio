import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMonth, getDate, getYear, parseISO, getDaysInMonth, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Memory, MediaAttachment, MemoryCategory } from '@/types';
import { memoryCategoriesList, emotionTagsList } from '@/types';

export function useStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const editMemoryId = searchParams.get('editMemoryId') || undefined;
  const promptId = searchParams.get('promptId') || undefined;

  const isEditing = !!editMemoryId;

  const [isLoadingMemory, setIsLoadingMemory] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(memoryCategoriesList.find(c => c.id === 'personal_reflection'));
  const [location, setLocation] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<string[]>([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(getDate(new Date()));

  const [mediaPayload, setMediaPayload] = useState<{ file: File, type: 'video' | 'audio', duration: number, trimValues?: [number, number] } | null>(null);
  
  const years = Array.from({ length: 100 }, (_, i) => getYear(new Date()) - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(0, i), 'MMMM') }));
  const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);


  useEffect(() => {
    if (!editMemoryId || !user || authLoading || !db) {
      setIsLoadingMemory(false);
      return;
    }
    const fetchMemory = async () => {
      try {
        const memoryRef = doc(db, 'users', user.uid, 'memories', editMemoryId);
        const docSnap = await getDoc(memoryRef);
        if (docSnap.exists()) {
          const memory = { id: docSnap.id, ...docSnap.data() } as Memory;
          setTitle(memory.title);
          setDescription(memory.description || '');
          setSelectedEmotionTags(memory.emotionTags || []);
          setLocation(memory.location || '');
          if (memory.date) {
            const memoryDate = parseISO(memory.date);
            setSelectedYear(getYear(memoryDate));
            setSelectedMonth(getMonth(memoryDate));
            setSelectedDay(getDate(memoryDate));
          }
          if (memory.category) {
            const category = memoryCategoriesList.find(c => (typeof memory.category === 'string' ? c.id === memory.category : c.id === memory.category.id));
            setSelectedCategory(category);
          }
        }
      } catch (error) {
          console.error("Failed to load memory", { error });
          toast({ title: 'Error', description: 'Failed to load memory.', variant: 'destructive'});
      } finally {
        setIsLoadingMemory(false);
      }
    };
    fetchMemory();
  }, [editMemoryId, user, authLoading, toast, db]);

  const handleSubmit = useCallback(async () => {
    if (!user || !db || !storage) return;
    setIsSubmitting(true);

    if (mediaPayload && mediaPayload.duration > 360) {
        toast({
            title: "Video too long",
            description: "Please keep your memories under 6 minutes.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }

    try {
      let mediaAttachment: MediaAttachment | null = null;

      if (mediaPayload?.file) {
        const fileRef = storageRef(storage, `users/${user.uid}/memories/${Date.now()}`);
        const metadata = {
            contentType: mediaPayload.file.type,
            customMetadata: {
                duration: mediaPayload.duration.toString(),
                trimStart: mediaPayload.trimValues ? mediaPayload.trimValues[0].toString() : '0',
                trimEnd: mediaPayload.trimValues ? mediaPayload.trimValues[1].toString() : mediaPayload.duration.toString(),
            },
        };
        await uploadBytes(fileRef, mediaPayload.file, metadata);
        const url = await getDownloadURL(fileRef);
        mediaAttachment = {
          id: crypto.randomUUID(),
          url,
          type: mediaPayload.type,
          duration: mediaPayload.duration,
          filename: mediaPayload.file.name,
          trimStart: mediaPayload.trimValues ? mediaPayload.trimValues[0] : 0,
          trimEnd: mediaPayload.trimValues ? mediaPayload.trimValues[1] : mediaPayload.duration,
        };
      }

      const memoryData: any = {
        title,
        description,
        category: selectedCategory?.id || 'personal_reflection',
        location,
        emotionTags: selectedEmotionTags,
        date: new Date(selectedYear, selectedMonth, selectedDay).toISOString(),
        mediaAttachments: mediaAttachment ? [mediaAttachment] : [],
        updatedAt: serverTimestamp(),
        userId: user.uid,
        promptId: promptId,
      };

      if (isEditing) {
        await updateDoc(doc(db, 'users', user.uid, 'memories', editMemoryId!), memoryData);
      } else {
        memoryData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'users', user.uid, 'memories'), memoryData);
      }

      toast({ title: "Success", description: "Memory saved!", variant: "success" });
      router.push('/timeline');
    } catch (err) {
      console.error("handleSubmit failed with error", { err });
      toast({ title: "Error", description: "Failed to save memory", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, db, storage, mediaPayload, title, description, selectedCategory, location, selectedEmotionTags, selectedYear, selectedMonth, selectedDay, promptId, isEditing, editMemoryId, router, toast]);
  
  const handleEmotionTagToggle = (tagId: string) => {
    setSelectedEmotionTags(prev => 
        prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  return {
    isEditing,
    isLoadingMemory,
    isSubmitting,
    title, setTitle,
    description, setDescription,
    selectedCategory, setSelectedCategory,
    location, setLocation,
    selectedEmotionTags, handleEmotionTagToggle,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    selectedDay, setSelectedDay,
    years,
    months,
    days,
    mediaPayload, setMediaPayload,
    handleSubmit,
    authLoading,
    promptId,
    isRecording,
    setIsRecording
  };
}
