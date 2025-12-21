"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { parseISO, format, getYear, getMonth, getDate } from 'date-fns';
import { memoryCategoriesList } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Loader2, ArrowRight, ArrowLeft, Scissors, Sparkles } from 'lucide-react';
import { saveMemory } from '@/actions/memoryActions';
import { useToast } from '@/hooks/use-toast'; 
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';

const MediaCaptureControl = dynamic(
  () => import('./MediaRecorder').then((mod) => mod.MediaCaptureControl),
  { ssr: false, loading: () => <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin" /></div> }
);

export function MemoryForm({ memoryToEdit, promptId, initialCustomPrompt }: any) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!memoryToEdit;

  // Lazy Init to prevent ReferenceError during server rendering
  const [title, setTitle] = useState(() => memoryToEdit?.title || initialCustomPrompt || '');
  const [description, setDescription] = useState(() => memoryToEdit?.description || '');
  const [selectedCategory, setSelectedCategory] = useState(() => memoryToEdit?.category || memoryCategoriesList[0]);
  const [selectedYear, setSelectedYear] = useState(() => getYear(memoryToEdit?.date ? parseISO(memoryToEdit.date) : new Date()));
  const [selectedMonth, setSelectedMonth] = useState(() => getMonth(memoryToEdit?.date ? parseISO(memoryToEdit.date) : new Date()));
  const [selectedDay, setSelectedDay] = useState(() => getDate(memoryToEdit?.date ? parseISO(memoryToEdit.date) : new Date()));

  const [currentMedia, setCurrentMedia] = useState<any>(null);
  const [currentMediaPreviewUrl, setCurrentMediaPreviewUrl] = useState<string | null>(null);
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 0]);
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hydrate form with existing memory data
  useEffect(() => {
    if (memoryToEdit?.mediaAttachments?.[0]) {
      const m = memoryToEdit.mediaAttachments[0];
      setCurrentMedia({ file: new File([], "existing"), type: m.type, duration: m.duration || 0 });
      setCurrentMediaPreviewUrl(m.url);
      setTrimValues([m.startTime || 0, m.endTime || m.duration || 0]);
    }
  }, [memoryToEdit]);

  const handleMediaReady = useCallback((payload: any) => {
    const hasSavedTrim = trimValues[0] !== 0 || trimValues[1] !== 0;
    if (isEditing && currentMedia?.file?.name === "existing" && hasSavedTrim) {
      return;
    }
    setCurrentMedia(payload);
    setTrimValues([0, payload.duration]);
    setCurrentMediaPreviewUrl(URL.createObjectURL(payload.file));
  }, [isEditing, trimValues, currentMedia]);

  const onSave = async () => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to save a memory.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', selectedCategory);
    formData.append('date', new Date(selectedYear, selectedMonth, selectedDay).toISOString());
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
        formData.append('mediaFile', currentMedia.file);
        formData.append('mediaMetadata', JSON.stringify(metadata));
      } else if (memoryToEdit?.mediaAttachments?.[0]) {
        const updatedAttachment = { ...memoryToEdit.mediaAttachments[0], ...metadata };
        formData.append('mediaAttachments', JSON.stringify([updatedAttachment]));
      }
    }

    const res = await saveMemory(formData, memoryToEdit?.id || null);
    setIsSubmitting(false);
    if (res.success) {
      toast({ title: "Success!", description: res.message });
      router.push('/prompts'); 
    } else {
      toast({ title: "Error", description: res.message, variant: "destructive" });
    }
  };

  // Handlers for carousel navigation
  const handleNext = () => {
    if (currentSlide === 0) {
      setCurrentSlide(1);
      carouselApi?.scrollNext();
    }
  };
  const handleBack = () => {
    if (currentSlide === 1) {
      setCurrentSlide(0);
      carouselApi?.scrollPrev();
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Carousel setApi={setCarouselApi} opts={{ watchDrag: false }}>
        <CarouselContent>
          <CarouselItem>
            <Card>
              <CardHeader><CardTitle>The Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                <Textarea placeholder="What happened in this memory?" value={description} onChange={e => setDescription(e.target.value)} rows={5} />
                 <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                        {memoryCategoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </CarouselItem>
          
          <CarouselItem>
            <Card>
              <CardHeader><CardTitle>Add Media</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <MediaCaptureControl onMediaReady={handleMediaReady} initialMedia={currentMediaPreviewUrl ? { previewUrl: currentMediaPreviewUrl, type: currentMedia?.type } : null} />
                {currentMedia?.duration > 0 && (
                  <div className="space-y-4 pt-4">
                    <Label className="flex items-center"><Scissors className="w-4 h-4 mr-2"/> Trim Your Clip</Label>
                    <Slider min={0} max={currentMedia.duration} step={0.1} value={trimValues} onValueChange={(v: [number, number]) => setTrimValues(v)} />
                    <div className="flex justify-between text-xs font-mono">
                      <span>Start: {trimValues[0].toFixed(1)}s</span>
                      <span>End: {trimValues[1].toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {currentSlide === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        {currentSlide === 0 ? (
          <Button onClick={handleNext} disabled={isSubmitting}>
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isEditing ? 'Update Memory' : 'Save Memory'}
          </Button>
        )}
      </div>
    </div>
  );
}