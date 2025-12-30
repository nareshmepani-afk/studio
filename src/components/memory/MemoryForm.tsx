
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMonth, getDate, getYear, parseISO, getDaysInMonth, format } from 'date-fns';
import { emotionTagsList, memoryCategoriesList, type EmotionTag, type MemoryCategory } from '@/types';
import type { Memory, MediaAttachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Loader2, ArrowRight, ArrowLeft, Scissors, Sparkles, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

const MediaCaptureControl = dynamic(
  () => import('./MediaRecorder').then((mod) => mod.MediaCaptureControl),
  { 
    ssr: false, 
    loading: () => <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> 
  }
);

// Helper to format time
const formatTime = (seconds: number) => {
    const totalSeconds = Math.round(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// --- SERVER ACTION TO SAVE MEMORY ---
async function saveMemoryAction(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  'use server';
  
  // This server action needs access to firebase-admin, so we ensure it's initialized.
  const { adminAuth, adminDb, adminStorage } = await import('@/lib/firebase-admin');
  const { cookies } = await import('next/headers');
  const { revalidatePath } = await import('next/cache');

  let userId: string;
  try {
      console.log('[ACTION/saveMemory] Verifying user authentication...');
      const sessionCookie = cookies().get('firebase-auth-token')?.value;
      if (!sessionCookie) throw new Error("Session cookie is missing. User is not authenticated.");
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      userId = decodedToken.uid;
      console.log(`[ACTION/saveMemory] User ${userId} authenticated.`);
  } catch (error: any) {
      console.error("[ACTION/saveMemory] Auth Error:", error.message);
      return { success: false, message: 'Authentication failed: ' + error.message };
  }

  try {
    console.log('[ACTION/saveMemory] Processing form data...');
    const memoryId = formData.get('memoryId') as string | null;

    const memoryData: Partial<Memory> = {
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      location: formData.get('location') as string,
      emotionTags: JSON.parse(formData.get('emotionTags') as string),
      promptId: formData.get('promptId') as string | undefined,
      userId: userId,
      updatedAt: new Date().toISOString(),
    };

    const mediaFile = formData.get('mediaFile') as File | null;
    let existingAttachments: MediaAttachment[] = JSON.parse(formData.get('existingAttachments') as string);
    let newOrUpdatedAttachments = existingAttachments;
    console.log(`[ACTION/saveMemory] Memory ID: ${memoryId}, Has Media File: ${!!mediaFile}`);

    if (mediaFile && mediaFile.size > 0) {
      console.log(`[ACTION/saveMemory] New media file detected: ${mediaFile.name}, size: ${mediaFile.size}`);
      const bucket = adminStorage.bucket();
      const fileId = crypto.randomUUID();
      const fileExtension = mediaFile.name.split('.').pop() || 'tmp';
      const filePath = `users/${userId}/media/${fileId}.${fileExtension}`;
      const fileRef = bucket.file(filePath);
      
      const fileBuffer = await mediaFile.arrayBuffer();
      
      console.log(`[ACTION/saveMemory] Uploading to Storage path: ${filePath}`);
      await fileRef.save(Buffer.from(fileBuffer), { metadata: { contentType: mediaFile.type } });
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      console.log(`[ACTION/saveMemory] Upload successful. Public URL: ${publicUrl}`);
      
      newOrUpdatedAttachments = [{
        id: fileId,
        url: publicUrl,
        type: mediaFile.type.startsWith('video') ? 'video' : 'audio',
        filename: mediaFile.name,
      }];
    }
    
    const trimData = JSON.parse(formData.get('trimData') as string);
    if(newOrUpdatedAttachments[0]){
      newOrUpdatedAttachments[0] = { ...newOrUpdatedAttachments[0], ...trimData };
    }
    
    memoryData.mediaAttachments = newOrUpdatedAttachments;

    if (memoryId) {
      console.log(`[ACTION/saveMemory] Updating existing memory ${memoryId} in Firestore...`);
      const memRef = adminDb.collection('users').doc(userId).collection('memories').doc(memoryId);
      await memRef.update(memoryData as { [key: string]: any });
      console.log(`[ACTION/saveMemory] Update successful for memory ${memoryId}.`);
    } else {
      const newId = crypto.randomUUID();
      memoryData.id = newId;
      memoryData.createdAt = new Date().toISOString();
      console.log(`[ACTION/saveMemory] Creating new memory with ID ${newId} in Firestore...`);
      const newMemRef = adminDb.collection('users').doc(userId).collection('memories').doc(newId);
      await newMemRef.set(memoryData);
      console.log(`[ACTION/saveMemory] New memory ${newId} created successfully.`);
    }
    
    console.log('[ACTION/saveMemory] Revalidating paths: /prompts, /timeline');
    revalidatePath('/prompts');
    revalidatePath('/timeline');
    
    return { success: true, message: memoryId ? "Memory updated successfully" : "Memory saved successfully" };

  } catch (error: any) {
    console.error("[ACTION/saveMemory] Save Error:", { message: error.message, stack: error.stack });
    return { success: false, message: 'An unexpected error occurred on the server: ' + error.message };
  }
}
// --- END OF SERVER ACTION ---


interface MemoryFormProps {
  memoryToEdit: Memory | null;
  promptId?: string;
  initialCustomPrompt?: string;
}

export function MemoryForm({ memoryToEdit, promptId, initialCustomPrompt }: MemoryFormProps) {
  const router = useRouter();
  const { toast } = useToast(); 
  const isEditing = !!memoryToEdit;

  const [title, setTitle] = useState(() => initialCustomPrompt || '');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(memoryCategoriesList[0]);
  const [location, setLocation] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>([]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => getDate(new Date()));

  const [mediaPayload, setMediaPayload] = useState<{ file: File | null, type: 'video' | 'audio', duration: number } | null>(null);
  const [initialMedia, setInitialMedia] = useState<MediaAttachment | null>(null);
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 0]);
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const years = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(2000, i, 1), 'MMMM') }));
  const days = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth)) }, (_, i) => i + 1);

  useEffect(() => {
    if (memoryToEdit) {
      setTitle(memoryToEdit.title || '');
      setDescription(memoryToEdit.description || '');
      setLocation(memoryToEdit.location || '');

      const matchedCategory = memoryCategoriesList.find(c => {
        const categoryId = typeof memoryToEdit.category === 'string' ? memoryToEdit.category : memoryToEdit.category?.id;
        return c.id === categoryId;
      });
      setSelectedCategory(matchedCategory || memoryCategoriesList[0]);
      
      const matchedTags = (memoryToEdit.emotionTags || [])
        .map(tagId => emotionTagsList.find(tag => tag.id === tagId))
        .filter((tag): tag is EmotionTag => !!tag);
      setSelectedEmotionTags(matchedTags);

      if (memoryToEdit.date) {
        try {
          const date = parseISO(memoryToEdit.date);
          setSelectedYear(getYear(date));
          setSelectedMonth(getMonth(date));
          setSelectedDay(getDate(date));
        } catch (e) { console.error("Failed to parse date:", memoryToEdit.date); }
      }

      if (memoryToEdit.mediaAttachments?.[0]) {
        const m = memoryToEdit.mediaAttachments[0];
        setInitialMedia({
          id: m.id,
          url: m.url,
          type: m.type,
          filename: m.filename,
          duration: m.duration || 0,
        });
        setTrimValues([m.startTime || 0, m.endTime || m.duration || 0]);
      }
    }
  }, [memoryToEdit]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    onSelect();
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi]);

  const handleMediaReady = useCallback((payload: any) => {
    if (!payload) {
      setMediaPayload(null);
      setTrimValues([0, 0]);
      return;
    }
    setTrimValues([0, payload.duration]);
    setMediaPayload(payload);
  }, []);
  
  const currentMediaDuration = mediaPayload?.duration || initialMedia?.duration || 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!title) {
      toast({ title: "Missing Title", description: "Please give your memory a title.", variant: "destructive" });
      carouselApi?.scrollTo(0);
      return;
    }
    if (!mediaPayload && !initialMedia) {
      toast({ title: "Missing Media", description: "Please add a video or audio to your memory.", variant: "destructive" });
      carouselApi?.scrollTo(1);
      return;
    }
    
    setIsSubmitting(true);
    
    const formData = new FormData(event.currentTarget);
    if(memoryToEdit?.id) formData.append('memoryId', memoryToEdit.id);
    if(mediaPayload?.file) formData.append('mediaFile', mediaPayload.file);
    
    const existingAttachments = memoryToEdit?.mediaAttachments || [];
    formData.append('existingAttachments', JSON.stringify(existingAttachments));

    const trimData = {
      startTime: trimValues[0],
      endTime: trimValues[1],
      isTrimmed: trimValues[0] > 0 || (currentMediaDuration && trimValues[1] < currentMediaDuration),
      duration: currentMediaDuration
    };
    formData.append('trimData', JSON.stringify(trimData));
    
    const result = await saveMemoryAction(formData);
    
    setIsSubmitting(false);
    
    if (result.success) {
      toast({ title: "Success", description: result.message, variant: 'success' });
      router.push('/timeline');
      router.refresh(); 
    } else {
      toast({ title: "Error Saving Memory", description: result.message, variant: "destructive" });
    }
  };

  const toggleEmotionTag = (tag: EmotionTag) => {
    setSelectedEmotionTags(prev => 
      prev.some(t => t.id === tag.id) 
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag]
    );
  };
  
  const leftValueLabel = currentMediaDuration > 0 ? formatTime(trimValues[0]) : '';
  const rightValueLabel = currentMediaDuration > 0 ? formatTime(trimValues[1]) : '';
  const leftPosition = currentMediaDuration > 0 ? `calc(${(trimValues[0] / currentMediaDuration) * 100}% - ${leftValueLabel.length / 2}ch)` : '0%';
  const rightPosition = currentMediaDuration > 0 ? `calc(${(trimValues[1] / currentMediaDuration) * 100}% - ${rightValueLabel.length / 2}ch)` : '100%';

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-3xl mx-auto pb-20">
        <div className="flex justify-center mb-6 space-x-2">
          {[0, 1].map((step) => (
            <div key={step} className={`h-2 w-16 rounded-full transition-colors ${currentSlide === step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        <Carousel setApi={setCarouselApi} opts={{ watchDrag: false }} className="w-full">
          <CarouselContent>
            <CarouselItem>
              <Card>
                <CardHeader>
                  <CardTitle>The Details</CardTitle>
                  <CardDescription>When and where did this happen?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <input type="hidden" name="promptId" value={promptId} />
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input name="title" placeholder="e.g. My 30th Birthday" value={title} onChange={e => setTitle(e.target.value)} required/>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <input type="hidden" name="date" value={new Date(selectedYear, selectedMonth, selectedDay).toISOString()} />
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={selectedDay.toString()} onValueChange={v => setSelectedDay(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{days.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <input type="hidden" name="category" value={selectedCategory?.id || 'personal'} />
                      <Select value={selectedCategory?.id} onValueChange={(val) => setSelectedCategory(memoryCategoriesList.find(c => c.id === val))}>
                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                          {memoryCategoriesList.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input name="location" className="pl-8" placeholder="London, UK" value={location} onChange={e => setLocation(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" placeholder="Describe the memory..." className="min-h-[120px]" value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Emotions</Label>
                    <input type="hidden" name="emotionTags" value={JSON.stringify(selectedEmotionTags.map(t => t.id))} />
                    <div className="flex flex-wrap gap-2">
                      {emotionTagsList.map((tag: EmotionTag) => (
                        <Button 
                          key={tag.id} 
                          type="button"
                          variant={selectedEmotionTags.some(t => t.id === tag.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleEmotionTag(tag)}
                        >
                          {tag.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem>
              <Card>
                <CardHeader>
                  <CardTitle>{isEditing ? 'Edit Media' : 'Add Media'}</CardTitle>
                  <CardDescription>
                    {isEditing ? 'Replace or trim the existing media for this memory.' : 'Upload or record a video/audio for this memory.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <MediaCaptureControl 
                    onMediaReady={handleMediaReady} 
                    initialMedia={initialMedia ? { previewUrl: initialMedia.url, type: initialMedia.type, duration: initialMedia.duration } : null} 
                    trimValues={trimValues} 
                  />
                  {currentMediaDuration > 0 && (
                      <div className="pt-4 space-y-4 border-t">
                          <Label className="flex items-center text-primary"><Scissors className="w-4 h-4 mr-2"/> Trim Clip</Label>
                          <div className="relative">
                              <div className="relative h-8">
                                  <span className="text-xs text-muted-foreground font-mono absolute" style={{ left: leftPosition }}>
                                      {leftValueLabel}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-mono absolute" style={{ left: rightPosition }}>
                                      {rightValueLabel}
                                  </span>
                              </div>
                              <Slider 
                                  min={0} 
                                  max={currentMediaDuration} 
                                  step={0.1} 
                                  minStepsBetweenThumbs={1} 
                                  value={trimValues} 
                                  onValueChange={(v) => setTrimValues(v as [number, number])} 
                                  aria-label="Video trim slider"
                              />
                               <div className="flex justify-between mt-1">
                                  <span className="text-xs text-muted-foreground font-mono">{formatTime(0)}</span>
                                  <span className="text-xs text-muted-foreground font-mono">{currentMediaDuration ? formatTime(currentMediaDuration) : '00:00'}</span>
                              </div>
                          </div>
                      </div>
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
        <div className="flex justify-between mt-8 px-1">
          <Button type="button" variant="ghost" onClick={() => currentSlide === 0 ? router.back() : carouselApi?.scrollPrev()} disabled={isSubmitting}>
            {currentSlide === 0 ? 'Cancel' : <><ArrowLeft className="w-4 h-4 mr-2" /> Back</>}
          </Button>
          {currentSlide === 0 ? (
             <Button type="button" onClick={() => carouselApi?.scrollNext()} disabled={isSubmitting}>
              <span className="mr-2">Next</span> <ArrowRight className="w-4 h-4" />
             </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <><Sparkles className="w-4 h-4 mr-2" /> Save Memory</>}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
