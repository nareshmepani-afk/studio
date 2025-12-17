"use client";

import { useState, type FormEvent, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Memory, MediaAttachment, EmotionTag, MemoryCategory } from '@/types';
import { emotionTagsList, memoryCategoriesList } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MemoryCard } from './MemoryCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Loader2, ArrowRight, Tag, MapPin, ArrowLeft, Eye, Layers, Scissors, Timer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDaysInMonth, format, isValid, setDate, getMonth, getYear, parseISO, getDate } from 'date-fns';
import { enGB } from 'date-fns/locale';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { countryOptions } from '@/lib/constants';
import { mockPromptGroups } from '@/lib/mockData';
import { Slider } from '@/components/ui/slider';
import dynamic from 'next/dynamic';
import { saveMemory } from '@/actions/memoryActions';

const MediaCaptureControl = dynamic(
  () => import('@/components/memory/MediaRecorder').then((mod) => mod.MediaCaptureControl),
  { 
    ssr: false, 
    loading: () => <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
);

type MediaFromRecorder = {
  file: File;
  type: 'video' | 'audio';
  duration: number;
  size: number;
};

type CurrentMediaData = {
  file: File;
  type: 'video' | 'audio';
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  isTrimmed: boolean;
};

const globalCurrentYear = new Date().getFullYear();
const years: number[] = Array.from({ length: 101 }, (_, i) => globalCurrentYear - i);
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(new Date(2000, i, 1), 'MMMM', { locale: enGB }),
}));

const SLIDE_INDEX_DETAILS = 0;
const SLIDE_INDEX_MEDIA = 1;
const SLIDE_INDEX_PREVIEW = 2;
const TOTAL_SLIDES = 3;

function formatSecondsToTime(timeInSeconds: number | undefined): string {
  if (timeInSeconds === undefined || isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
  const totalSecs = Math.floor(timeInSeconds);
  const minutes = Math.floor(totalSecs / 60);
  const seconds = totalSecs % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface MemoryFormProps {
  memoryToEdit: Memory | null;
  promptId?: string;
  initialCustomPrompt?: string;
}

export function MemoryForm({ memoryToEdit, promptId, initialCustomPrompt }: MemoryFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isEditing = !!memoryToEdit;

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const yearSelectRef = useRef<HTMLButtonElement>(null);
  const step1AnchorRef = useRef<HTMLDivElement>(null);
  const step2AnchorRef = useRef<HTMLDivElement>(null);
  const step3AnchorRef = useRef<HTMLDivElement>(null);
  const visualScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(memoryCategoriesList[0]);
  const [description, setDescription] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(globalCurrentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<number>(getDate(new Date()));

  // Navigation & Media State
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(SLIDE_INDEX_DETAILS);
  const currentSlideRef = useRef(currentSlide);
  const [currentMedia, setCurrentMedia] = useState<CurrentMediaData | null>(null);
  const [currentMediaPreviewUrl, setCurrentMediaPreviewUrl] = useState<string | null>(null);
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 100]);
  const [isTrimming, setIsTrimming] = useState(false);
  const [mediaKey, setMediaKey] = useState(Date.now().toString());
  const [isParentSubmitting, setIsParentSubmitting] = useState(false);
  const [isPreparingMedia, setIsPreparingMedia] = useState(false);

  // Hydration logic
  useEffect(() => {
    if (memoryToEdit) {
      setTitle(memoryToEdit.title || '');
      setLocation(memoryToEdit.location || '');
      setSelectedCategory(memoryToEdit.category || memoryCategoriesList[0]);
      
      let initialCountry = 'United Kingdom';
      if (memoryToEdit.country) {
        const found = countryOptions.find(opt => opt.value.toLowerCase() === memoryToEdit.country!.toLowerCase());
        initialCountry = found ? found.value : 'United Kingdom';
      }
      setCountry(initialCountry);
      setDescription(memoryToEdit.description || '');
      setSelectedEmotionTags(memoryToEdit.emotionTags || []);
      
      const validDate = memoryToEdit.date ? parseISO(memoryToEdit.date) : new Date();
      setSelectedYear(getYear(validDate));
      setSelectedMonth(getMonth(validDate));
      setSelectedDay(getDate(validDate));

      if (memoryToEdit.mediaAttachments?.[0]?.url) {
        const firstMedia = memoryToEdit.mediaAttachments[0];
        const duration = firstMedia.duration || 0;
        const startTime = firstMedia.startTime || 0;
        const endTime = firstMedia.endTime || duration;

        setCurrentMedia({
          file: new File([], firstMedia.filename || "existing_media_placeholder", { type: firstMedia.type === 'video' ? 'video/mp4' : 'audio/mp3' }),
          type: firstMedia.type,
          startTime,
          endTime,
          duration,
          size: firstMedia.size || 0,
          isTrimmed: firstMedia.isTrimmed || false,
        });
        setCurrentMediaPreviewUrl(firstMedia.url);
        setTrimValues([startTime, endTime]);
      }
    } else {
      let initialTitle = initialCustomPrompt || '';
      if (!initialTitle && promptId) {
        const found = mockPromptGroups.flatMap(g => g.prompts).find(p => p.id === promptId);
        initialTitle = found ? found.text.en : '';
      }
      setTitle(initialTitle);
    }
  }, [memoryToEdit, promptId, initialCustomPrompt]);

  const daysInSelectedMonth = useMemo(() => getDaysInMonth(new Date(selectedYear, selectedMonth)), [selectedYear, selectedMonth]);
  const dayOptions = useMemo(() => Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1), [daysInSelectedMonth]);

  const performVisualScroll = useCallback((slideIndex: number) => {
    if (visualScrollTimerRef.current) clearTimeout(visualScrollTimerRef.current);
    visualScrollTimerRef.current = setTimeout(() => {
      let targetRef = slideIndex === SLIDE_INDEX_DETAILS ? step1AnchorRef : slideIndex === SLIDE_INDEX_MEDIA ? step2AnchorRef : step3AnchorRef;
      if (targetRef.current) {
        const navbar = document.querySelector('header.sticky') as HTMLElement | null;
        const targetScrollY = targetRef.current.getBoundingClientRect().top + window.scrollY - (navbar?.offsetHeight || 0);
        window.scrollTo({ top: targetScrollY, behavior: 'auto' });
      }
    }, 350);
  }, []);

  const handleSetCurrentSlide = useCallback((newSlide: number) => {
    if (newSlide !== currentSlideRef.current) {
      setCurrentSlide(newSlide);
      currentSlideRef.current = newSlide;
    }
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.scrollTo(currentSlide, true);
    performVisualScroll(currentSlide);
  }, [currentSlide, carouselApi, performVisualScroll]);

  const handleMediaReady = useCallback((payload: MediaFromRecorder) => {
    if (currentMediaPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(currentMediaPreviewUrl);
    const newUrl = URL.createObjectURL(payload.file);
    setCurrentMedia({ ...payload, startTime: 0, endTime: payload.duration, isTrimmed: false });
    setTrimValues([0, payload.duration]);
    setCurrentMediaPreviewUrl(newUrl);
    handleSetCurrentSlide(SLIDE_INDEX_PREVIEW);
  }, [currentMediaPreviewUrl, handleSetCurrentSlide]);

  const handleTrimChange = (vals: [number, number]) => setTrimValues(vals);

  const triggerSubmitProcess = useCallback(async () => {
    if (!user) return;
    setIsParentSubmitting(true);
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('date', finalDate.toISOString());
    formData.append('description', description);
    formData.append('category', selectedCategory || 'Other');
    formData.append('emotionTags', JSON.stringify(selectedEmotionTags));
    if (location) formData.append('location', location);
    if (country) formData.append('country', country);
    formData.append('promptId', promptId || memoryToEdit?.promptId || '');

    if (currentMedia) {
      const isNew = currentMedia.file.size > 0 && currentMedia.file.name !== "existing_media_placeholder";
      const metadata = {
        startTime: trimValues[0],
        endTime: trimValues[1],
        isTrimmed: trimValues[0] > 0 || trimValues[1] < currentMedia.duration
      };

      if (isNew) {
        formData.append('mediaFile', currentMedia.file);
        formData.append('mediaMetadata', JSON.stringify(metadata));
      } else if (isEditing && memoryToEdit?.mediaAttachments) {
        formData.append('mediaAttachments', JSON.stringify([{ ...memoryToEdit.mediaAttachments[0], ...metadata }]));
      }
    }

    const result = await saveMemory(formData, user.id, memoryToEdit?.id || null);
    setIsParentSubmitting(false);
    if (result.success) {
      toast({ title: result.message, variant: "success" });
      router.push(promptId ? '/prompts' : '/timeline');
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }, [user, title, selectedYear, selectedMonth, selectedDay, description, selectedCategory, selectedEmotionTags, location, country, promptId, memoryToEdit, currentMedia, trimValues, isEditing, router]);

  const handleActionButtonClick = () => {
    if (isParentSubmitting || isTrimming || isPreparingMedia) return;
    if (currentSlide === SLIDE_INDEX_DETAILS) {
      if (!title.trim() || !description.trim()) {
        toast({ title: "Required Fields", description: "Title and Description are mandatory.", variant: "destructive" });
        return;
      }
      handleSetCurrentSlide(SLIDE_INDEX_MEDIA);
    } else if (currentSlide === SLIDE_INDEX_MEDIA) {
      if (!currentMedia && !isEditing) {
        toast({ title: "Media Required", description: "Please record or upload media.", variant: "destructive" });
        return;
      }
      setMediaKey(Date.now().toString());
      handleSetCurrentSlide(SLIDE_INDEX_PREVIEW);
    } else {
      triggerSubmitProcess();
    }
  };

  const actionButtonText = currentSlide === SLIDE_INDEX_PREVIEW ? (isEditing ? 'Update Memory' : 'Save Memory') : currentSlide === SLIDE_INDEX_MEDIA ? 'Next to Preview' : 'Next';
  const ActionButtonIcon = currentSlide === SLIDE_INDEX_PREVIEW ? Sparkles : currentSlide === SLIDE_INDEX_MEDIA ? Eye : ArrowRight;

  const mockMemoryForPreview: Memory | undefined = useMemo(() => {
    if (currentSlide !== SLIDE_INDEX_PREVIEW) return undefined;
    const date = new Date(selectedYear, selectedMonth, selectedDay).toISOString();
    const media = currentMedia ? [{
      id: 'preview',
      type: currentMedia.type,
      url: currentMediaPreviewUrl || '',
      startTime: trimValues[0],
      endTime: trimValues[1],
      duration: currentMedia.duration,
      isTrimmed: trimValues[0] > 0 || trimValues[1] < currentMedia.duration
    }] : (memoryToEdit?.mediaAttachments || []);

    return { 
      id: memoryToEdit?.id || 'preview', 
      title, date, description, category: selectedCategory, 
      emotionTags: selectedEmotionTags, mediaAttachments: media as MediaAttachment[],
      location, country, userId: user?.id || '', isLegacy: false 
    };
  }, [currentSlide, title, selectedYear, selectedMonth, selectedDay, description, selectedCategory, selectedEmotionTags, currentMedia, currentMediaPreviewUrl, trimValues, memoryToEdit, location, country, user]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleActionButtonClick(); }} className="space-y-6" noValidate>
      <Carousel setApi={setCarouselApi} opts={{ watchDrag: false }} className="w-full max-w-3xl mx-auto py-4">
        <CarouselContent>
          {/* Step 1: Details */}
          <CarouselItem>
            <div ref={step1AnchorRef} />
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{isEditing ? 'Edit Chapter' : 'New Chapter'} (1/3)</CardTitle>
                <CardDescription>Enter the details of your moment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1"><Label htmlFor="title">Title *</Label><Input ref={titleInputRef} id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent></Select>
                    <Select value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{dayOptions.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1"><Label htmlFor="location"><MapPin className="inline-block mr-1 h-4 w-4" />Location</Label><Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                   <div className="space-y-1"><Label htmlFor="country">Country</Label><Select value={country} onValueChange={setCountry}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{countryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-1"><Label>Category *</Label><Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as MemoryCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{memoryCategoriesList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label htmlFor="description">Description *</Label><Textarea ref={descriptionTextareaRef} id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></div>
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Step 2: Media */}
          <CarouselItem>
            <div ref={step2AnchorRef} />
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">{isEditing ? 'Edit Media' : 'Media Attachment'} (2/3)</CardTitle>
                <CardDescription>Record or upload your video/audio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MediaCaptureControl 
                  key={mediaKey} 
                  onMediaReady={handleMediaReady} 
                  onPreparingChange={setIsPreparingMedia} 
                  initialMedia={currentMedia && currentMediaPreviewUrl ? { type: currentMedia.type, previewUrl: currentMediaPreviewUrl, duration: currentMedia.duration, size: currentMedia.size } : undefined} 
                  chapterTitleForTeleprompter={title} 
                  trimValues={trimValues} 
                />
                {currentMedia && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center"><Scissors className="mr-2 h-4 w-4"/>Trim</CardTitle></CardHeader>
                    <CardContent>
                      <Slider min={0} max={currentMedia.duration} step={0.1} value={trimValues} onValueChange={(v) => handleTrimChange(v as [number, number])} />
                      <div className="flex justify-between text-[10px] mt-2 font-mono">
                        <span>Start: {formatSecondsToTime(trimValues[0])}</span>
                        <span>End: {formatSecondsToTime(trimValues[1])}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Step 3: Preview */}
          <CarouselItem>
            <div ref={step3AnchorRef} />
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{isEditing ? 'Preview Changes' : 'New Chapter'} (3/3)</CardTitle>
              </CardHeader>
              <CardContent>
                {mockMemoryForPreview && <MemoryCard key={`${mediaKey}-${trimValues[0]}`} memory={mockMemoryForPreview} userMode="guest" />}
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className="max-w-3xl mx-auto flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={() => currentSlide === 0 ? router.back() : handleSetCurrentSlide(currentSlide - 1)} disabled={isParentSubmitting}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Button type="button" onClick={handleActionButtonClick} disabled={isParentSubmitting || isPreparingMedia}>
          {isParentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <ActionButtonIcon className="mr-2 h-4 w-4" />{actionButtonText}
        </Button>
      </div>
    </form>
  );
}