
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMonth, getDate, getYear, parseISO, getDaysInMonth, format } from 'date-fns';
import { mockPrompts as lifePrompts } from '@/lib/mockData';
import { teleprompterScripts, defaultTeleprompterFallbackScript } from '@/lib/teleprompterScripts';
import { emotionTagsList, memoryCategoriesList, type EmotionTag, type MemoryCategory, type Prompt as LifePrompt } from '@/types';
import type { Memory, MediaAttachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, ArrowRight, ArrowLeft, Scissors, Sparkles, MapPin, Info, QrCode, Flag, Smile, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, updateDoc, collection, arrayUnion, arrayRemove, onSnapshot, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { QrCodeDialog } from '@/components/prompts/QrCodeDialog';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Checkbox } from '@/components/ui/checkbox';

const MediaCaptureControl = dynamic(
  () => import('@/components/memory/MediaRecorder').then((mod) => mod.MediaCaptureControl),
  {
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }
);

const formatTime = (seconds: number) => {
    const totalSeconds = Math.round(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function MemoryFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const editMemoryId = searchParams.get('editMemoryId') || undefined;
  const promptId = searchParams.get('promptId') || undefined;

  const prompt = lifePrompts.flatMap((p: LifePrompt) => [p, ...(p.subPrompts || [])]).find((p: LifePrompt) => p.id === promptId);
  const initialTitle = prompt?.text.en || searchParams.get('customPrompt') || '';

  const isEditing = !!editMemoryId;

  const [memoryToEdit, setMemoryToEdit] = useState<Memory | null>(null);
  const [isLoadingMemory, setIsLoadingMemory] = useState(isEditing);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>();
  const [location, setLocation] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<string[]>([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(getDate(new Date()));

  const [mediaPayload, setMediaPayload] = useState<{ file: File, type: 'video' | 'audio', duration: number } | null>(null);
  const [initialMedia, setInitialMedia] = useState<MediaAttachment | null>(null);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [isLoadingFlag, setIsLoadingFlag] = useState(true);
  
  const years = Array.from({ length: 100 }, (_, i) => getYear(new Date()) - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(0, i), 'MMMM') }));
  const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (authLoading || !user || !promptId || !db) return;
    const userRef = doc(db!, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            setIsFlagged(userData.flaggedPrompts?.includes(promptId) || false);
        }
        setIsLoadingFlag(false);
    });
    return () => unsubscribe();
  }, [promptId, user, authLoading]);

  useEffect(() => {
    if (!editMemoryId || !user || authLoading || !db) {
      setIsLoadingMemory(false);
      return;
    }
    const fetchMemory = async () => {
      try {
        const memoryRef = doc(db!, 'users', user.uid, 'memories', editMemoryId);
        const docSnap = await getDoc(memoryRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const memory = { id: docSnap.id, ...data } as Memory;
          setMemoryToEdit(memory);
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
            const category = memoryCategoriesList.find(c => c.id === memory.category);
            setSelectedCategory(category);
          }
        }
      } catch (error) {
          toast({ title: 'Error', description: 'Failed to load memory.', variant: 'destructive'});
      } finally {
        setIsLoadingMemory(false);
      }
    };
    fetchMemory();
  }, [editMemoryId, user, authLoading, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !storage) return;
    setIsSubmitting(true);

    try {
      let finalMedia = initialMedia;

      if (mediaPayload?.file) {
        const fileRef = storageRef(storage!, `users/${user.uid}/memories/${Date.now()}`);
        await uploadBytes(fileRef, mediaPayload.file);
        const url = await getDownloadURL(fileRef);
        finalMedia = {
          id: crypto.randomUUID(),
          url,
          type: mediaPayload.type,
          duration: mediaPayload.duration,
          filename: mediaPayload.file.name
        };
      }

      const memoryData: Omit<Memory, 'id' | 'createdAt'> = {
        title,
        description,
        category: selectedCategory?.id || 'personal_reflection',
        location,
        emotionTags: selectedEmotionTags,
        date: new Date(selectedYear, selectedMonth, selectedDay).toISOString(),
        mediaAttachments: finalMedia ? [finalMedia] : [],
        updatedAt: new Date().toISOString(),
        userDefinedOrder: 0, // Default value
        userId: user.uid,
      };

      if (isEditing) {
        await updateDoc(doc(db!, 'users', user.uid, 'memories', editMemoryId!), memoryData);
      } else {
        const memoriesRef = collection(db!, 'users', user.uid, 'memories');
        const q = query(memoriesRef, orderBy('userDefinedOrder', 'desc'), limit(1));
        const lastMemory = await getDocs(q);
        const newOrder = lastMemory.empty ? 0 : (lastMemory.docs[0].data().userDefinedOrder || 0) + 1;
        
        await addDoc(memoriesRef, {
          ...memoryData,
          userDefinedOrder: newOrder,
          createdAt: new Date().toISOString(),
        });
      }

      toast({ title: "Success", description: "Memory saved!" });
      router.push('/timeline');
    } catch (err) {
      toast({ title: "Error", description: "Failed to save memory", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
    const handleEmotionTagToggle = (tagId: string) => {
        setSelectedEmotionTags(prev => 
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

  if (authLoading || isLoadingMemory) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AuthenticatedPageWrapper>
      <div className="container max-w-2xl py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Memory' : 'Add New Memory'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your memory a name..." />
              </div>

              <div className="space-y-2">
                <Label>Media</Label>
                <MediaCaptureControl onMediaReady={setMediaPayload} />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write about this moment..." />
              </div>
              
                <div className="space-y-2">
                    <Label className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> Location</Label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where did this take place?" />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4" /> Date</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                            <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                            <SelectContent>
                                {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                            <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                            <SelectContent>
                                {months.map(month => <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                            <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                            <SelectContent>
                                {days.map(day => <SelectItem key={day} value={day.toString()}>{day}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={(value) => setSelectedCategory(memoryCategoriesList.find(c => c.id === value))} value={selectedCategory?.id}>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                            {memoryCategoriesList.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

              <div className="space-y-2">
                <Label className="flex items-center"><Smile className="mr-2 h-4 w-4" /> Emotion Tags</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 rounded-lg border p-4">
                  {emotionTagsList.map(tag => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`emotion-${tag.id}`}
                        checked={selectedEmotionTags.includes(tag.id)}
                        onCheckedChange={() => handleEmotionTagToggle(tag.id)}
                      />
                      <Label htmlFor={`emotion-${tag.id}`} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {tag.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Memory'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthenticatedPageWrapper>
  );
}
