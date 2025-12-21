"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMonth, getDate, getYear, parseISO, getDaysInMonth, format } from 'date-fns';
import { emotionTagsList, memoryCategoriesList } from '@/types';
import type { Memory, EmotionTag, MemoryCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Loader2, ArrowRight, ArrowLeft, Scissors, Sparkles, MapPin } from 'lucide-react';
import { saveMemory } from '@/actions/memoryActions';
import { toast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

// Dynamically import Media Recorder to avoid SSR issues with Browser APIs
const MediaCaptureControl = dynamic(
  () => import('./MediaRecorder').then((mod) => mod.MediaCaptureControl),
  { 
    ssr: false, 
    loading: () => <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> 
  }
);

interface MemoryFormProps {
  memoryToEdit: Memory | null;
  promptId?: string;
  initialCustomPrompt?: string;
}

export function MemoryForm({ memoryToEdit, promptId, initialCustomPrompt }: MemoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!memoryToEdit;

  // --- 1. LAZY INITIALIZATION (Fixes ReferenceError) ---
  // We use functions () => ... for state defaults so constants aren't accessed before load.
  const [title, setTitle] = useState(() => initialCustomPrompt || '');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(() => memoryCategoriesList?.[0]);
  const [location, setLocation] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>([]);

  // Date State
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => getDate(new Date()));

  // Media State
  const [currentMedia, setCurrentMedia] = useState<any>(null);
  const [currentMediaPreviewUrl, setCurrentMediaPreviewUrl] = useState<string | null>(null);
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 0]);
  
  // UI State
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper arrays for Date Dropdowns
  const years = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(2000, i, 1), 'MMMM') }));
  const days = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth)) }, (_, i) => i + 1);

  // --- 2. HYDRATION (Populates Form on Edit) ---
  useEffect(() => {
    if (memoryToEdit) {
      setTitle(memoryToEdit.title || '');
      setDescription(memoryToEdit.description || '');
      setLocation(memoryToEdit.location || '');
      setSelectedCategory(memoryToEdit.category);
      setSelectedEmotionTags(memoryToEdit.emotionTags || []);

      const date = memoryToEdit.date ? parseISO(memoryToEdit.date) : new Date();
      setSelectedYear(getYear(date));
      setSelectedMonth(getMonth(date));
      setSelectedDay(getDate(date));

      if (memoryToEdit.mediaAttachments?.[0]) {
        const m = memoryToEdit.mediaAttachments[0];
        // We use a specific flag 'existing' to know this isn't a new file upload
        setCurrentMedia({ 
          file: new File([], "existing"), 
          type: m.type, 
          duration: m.duration || 0 
        });
        setCurrentMediaPreviewUrl(m.url);
        
        // Load the saved trim values
        setTrimValues([m.startTime || 0, m.endTime || m.duration || 0]);
      }
    }
  }, [memoryToEdit]);

  // --- 3. TRIM PROTECTION (Fixes Race Condition) ---
  const handleMediaReady = useCallback((payload: any) => {
    setCurrentMedia((prev: any) => {
      // Logic: If we are editing, and we already have valid trim values (not 0,0),
      // DO NOT overwrite them with the new file's full duration.
      const hasSavedTrim = trimValues[0] !== 0 || trimValues[1] !== 0;
      const isExistingFile = prev?.file?.name === "existing" || (memoryToEdit && payload.file.size === 0);

      if (isExistingFile && hasSavedTrim) {
        console.log("🔒 Protecting existing trim values:", trimValues);
        return { 
          ...payload, 
          startTime: trimValues[0], 
          endTime: trimValues[1],
          duration: payload.duration || prev.duration // Ensure duration isn't lost
        };
      }

      // If it's a fresh recording/upload, set trim to full length
      console.log("✨ New media detected, resetting trim to full length");
      setTrimValues([0, payload.duration]);
      
      // Update preview URL for new files
      if (payload.file.size > 0) {
        if (currentMediaPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(currentMediaPreviewUrl);
        setCurrentMediaPreviewUrl(URL.createObjectURL(payload.file));
      }
      
      return payload;
    });
  }, [isEditing, trimValues, currentMediaPreviewUrl, memoryToEdit]);

  // --- 4. SUBMISSION LOGIC ---
  const onSave = async () => {
    if (!title) {
      toast({ title: "Missing Title", description: "Please give your memory a title.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', selectedCategory?.id || 'personal');
    formData.append('date', new Date(selectedYear, selectedMonth, selectedDay).toISOString());
    formData.append('location', location);
    formData.append('emotionTags', JSON.stringify(selectedEmotionTags));
    if (promptId) formData.append('promptId', promptId);

    if (currentMedia) {
      const isNewFile = currentMedia.file.name !== "existing";
      const metadata = {
        startTime: trimValues[0],
        endTime: trimValues[1],
        isTrimmed: trimValues[0] > 0 || trimValues[1] < currentMedia.duration,
        duration: currentMedia.duration
      };

      if (isNewFile) {
        // Upload new file
        formData.append('mediaFile', currentMedia.file);
        formData.append('mediaMetadata', JSON.stringify(metadata));
      } else if (memoryToEdit?.mediaAttachments?.[0]) {
        // Update metadata for existing file
        const updatedAttachment = { ...memoryToEdit.mediaAttachments[0], ...metadata };
        formData.append('mediaAttachments', JSON.stringify([updatedAttachment]));
      }
    }

    const result = await saveMemory(formData, memoryToEdit?.id || null);
    
    setIsSubmitting(false);
    
    if (result.success) {
      toast({ title: "Success", description: "Memory saved successfully!" });
      router.push('/timeline');
      router.refresh(); // Refresh server components
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Progress Indicator */}
      <div className="flex justify-center mb-6 space-x-2">
        {[0, 1].map((step) => (
          <div key={step} className={`h-2 w-16 rounded-full transition-colors ${currentSlide === step ? 'bg-primary' : 'bg-secondary'}`} />
        ))}
      </div>

      <Carousel setApi={setCarouselApi} opts={{ watchDrag: false }} className="w-full">
        <CarouselContent>
          
          {/* SLIDE 1: DETAILS */}
          <CarouselItem>
            <Card>
              <CardHeader>
                <CardTitle>The Details</CardTitle>
                <CardDescription>When and where did this happen?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Title */}
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="e.g. My 30th Birthday" value={title} onChange={e => setTitle(e.target.value)} />
                </div>

                {/* Date Selectors */}
                <div className="space-y-2">
                  <Label>Date</Label>
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

                {/* Category & Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={selectedCategory?.id} onValueChange={(val) => setSelectedCategory(memoryCategoriesList?.find(c => c.id === val))}>
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {memoryCategoriesList?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-8" placeholder="London, UK" value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Describe the memory..." 
                    className="min-h-[120px]" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                  />
                </div>

              </CardContent>
            </Card>
          </CarouselItem>
          
          {/* SLIDE 2: MEDIA */}
          <CarouselItem>
            <Card>
              <CardHeader>
                <CardTitle>Add Media</CardTitle>
                <CardDescription>Upload or record a video/audio for this memory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <MediaCaptureControl 
                  onMediaReady={handleMediaReady} 
                  initialMedia={currentMediaPreviewUrl ? { 
                    previewUrl: currentMediaPreviewUrl, 
                    type: currentMedia?.type,
                    duration: currentMedia?.duration 
                  } : null} 
                  trimValues={trimValues} // Passing this down helps the child component know current state
                />

                {/* Trim Controls (Only show if we have duration > 0) */}
                {currentMedia && currentMedia.duration > 0 && (
                  <div className="pt-4 space-y-4 border-t">
                    <div className="flex justify-between items-center">
                      <Label className="flex items-center text-primary"><Scissors className="w-4 h-4 mr-2"/> Trim Clip</Label>
                      <span className="text-xs text-muted-foreground font-mono">
                        {trimValues[0].toFixed(1)}s - {trimValues[1].toFixed(1)}s
                      </span>
                    </div>
                    
                    <Slider 
                      min={0} 
                      max={currentMedia.duration} 
                      step={0.1} 
                      minStepsBetweenThumbs={1}
                      value={trimValues} 
                      onValueChange={(v) => setTrimValues(v as [number, number])} 
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0:00</span>
                      <span>Total: {currentMedia.duration.toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

        </CarouselContent>
      </Carousel>

      {/* Navigation Footer */}
      <div className="flex justify-between mt-8 px-1">
        <Button 
          variant="ghost" 
          onClick={() => currentSlide === 0 ? router.back() : carouselApi?.scrollPrev()} 
          disabled={isSubmitting}
        >
          {currentSlide === 0 ? 'Cancel' : <><ArrowLeft className="w-4 h-4 mr-2" /> Back</>}
        </Button>

        <Button 
          onClick={() => {
            if (currentSlide === 0) {
               setCurrentSlide(1);
               carouselApi?.scrollNext();
            } else {
               onSave();
            }
          }} 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 
           currentSlide === 0 ? <><span className="mr-2">Next</span> <ArrowRight className="w-4 h-4" /></> : 
           <><Sparkles className="w-4 h-4 mr-2" /> Save Memory</>}
        </Button>
      </div>
    </div>
  );
}
