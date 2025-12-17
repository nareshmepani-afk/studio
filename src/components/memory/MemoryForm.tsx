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

// Represents the client-side state for media being worked on.
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
const months: { value: number; label: string }[] = Array.from({ length: 12 }, (_, i) => ({
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
  memoryToEdit: Memory | null; // The form now accepts the full memory object or null
  promptId?: string;
  initialCustomPrompt?: string;
}

// This is now a "dumb" component. It receives all data via props and does NOT fetch data itself.
export function MemoryForm({ memoryToEdit, promptId, initialCustomPrompt }: MemoryFormProps) {
  const { user } = useAuth();
  const router = useRouter();
 
  const isEditing = !!memoryToEdit;

  // Refs for focusing on validation error
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const yearSelectRef = useRef<HTMLButtonElement>(null);

  // Refs for scrolling to the current step
  const step1AnchorRef = useRef<HTMLDivElement>(null);
  const step2AnchorRef = useRef<HTMLDivElement>(null);
  const step3AnchorRef = useRef<HTMLDivElement>(null);

  // Timers for scroll management
  const visualScrollTimerRef = useRef<NodeJS.Timeout | null>();
  const initialScrollTimerRef = useRef<NodeJS.Timeout | null>();

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(memoryCategoriesList[0]);
  const [description, setDescription] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>([]);
 
  const [selectedYear, setSelectedYear] = useState<number>(globalCurrentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<number>(getDate(new Date()));
 
  // Carousel state for multi-step form
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(SLIDE_INDEX_DETAILS);
  const currentSlideRef = useRef(currentSlide);

  // Media state
  const [currentMedia, setCurrentMedia] = useState<CurrentMediaData | null>(null);
  const [currentMediaPreviewUrl, setCurrentMediaPreviewUrl] = useState<string | null>(null);
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 100]);
  const [isTrimming, setIsTrimming] = useState(false);
  const [mediaKey, setMediaKey] = useState(Date.now().toString());

  // Loading/submitting state
  const [isParentSubmitting, setIsParentSubmitting] = useState(false);
  const [isPreparingMedia, setIsPreparingMedia] = useState(false);

  // This useEffect now ONLY populates the form state from the prop. NO data fetching.
  useEffect(() => {
    if (memoryToEdit) {
      console.log(`[CLIENT] MemoryForm hydrating state from memoryToEdit prop: ${memoryToEdit.title}`);
      setTitle(memoryToEdit.title || '');
      setLocation(memoryToEdit.location || '');
      setSelectedCategory(memoryToEdit.category || memoryCategoriesList[0]);

      let initialCountryValue = 'United Kingdom';
      if (memoryToEdit.country) {
        if (memoryToEdit.country.toUpperCase() === 'UK') initialCountryValue = 'United Kingdom';
        else if (memoryToEdit.country.toUpperCase() === 'USA' || memoryToEdit.country.toUpperCase() === 'US') initialCountryValue = 'United States';
        else { const foundOption = countryOptions.find(opt => opt.value.toLowerCase() === memoryToEdit.country!.toLowerCase()); initialCountryValue = foundOption ? foundOption.value : 'United Kingdom'; }
      }
      setCountry(initialCountryValue);

      setDescription(memoryToEdit.description || '');
      setSelectedEmotionTags(memoryToEdit.emotionTags || []);
      const validDate = memoryToEdit.date && isValid(parseISO(memoryToEdit.date)) ? parseISO(memoryToEdit.date) : new Date();
      setSelectedYear(getYear(validDate));
      setSelectedMonth(getMonth(validDate));
      setSelectedDay(getDate(validDate));

      if (memoryToEdit.mediaAttachments && memoryToEdit.mediaAttachments.length > 0 && memoryToEdit.mediaAttachments[0].url) {
        const firstMedia = memoryToEdit.mediaAttachments[0];
        const duration = (typeof firstMedia.duration === 'number' && !isNaN(firstMedia.duration)) ? firstMedia.duration : 0;
        const size = (typeof firstMedia.size === 'number' && !isNaN(firstMedia.size)) ? firstMedia.size : 0;
        const startTime = (typeof firstMedia.startTime === 'number' && !isNaN(firstMedia.startTime)) ? firstMedia.startTime : 0;
        const endTime = (typeof firstMedia.endTime === 'number' && !isNaN(firstMedia.endTime) && firstMedia.endTime <= duration) ? firstMedia.endTime : duration;

        setCurrentMedia({
            file: new File([], firstMedia.filename || "existing_media_placeholder", {type: firstMedia.type === 'video' ? 'video/mp4' : 'audio/mp3'}),
            type: firstMedia.type,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            size: size,
            isTrimmed: firstMedia.isTrimmed || false,
        });
        setCurrentMediaPreviewUrl(firstMedia.url);
        // Correctly initialize trimValues based on the media's actual start and end times
        setTrimValues([startTime, endTime]);
      }
    } else {
        // Initialize for a new memory
        console.log(`[CLIENT] MemoryForm initializing for new memory.`);
        let determinedInitialTitle = '';
        if (initialCustomPrompt) determinedInitialTitle = initialCustomPrompt;
        else if (promptId) {
            const foundPrompt = mockPromptGroups.flatMap(g => g.prompts).find(p => p.id === promptId);
            determinedInitialTitle = foundPrompt ? foundPrompt.text.en : '';
        }
        setTitle(determinedInitialTitle);
        const today = new Date();
        setSelectedYear(getYear(today));
        setSelectedMonth(getMonth(today));
        setSelectedDay(getDate(today));
    }
  }, [memoryToEdit, promptId, initialCustomPrompt]);

  const daysInSelectedMonth = useMemo(() => getDaysInMonth(new Date(selectedYear, selectedMonth)), [selectedYear, selectedMonth]);
  const dayOptions = useMemo(() => Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1), [daysInSelectedMonth]);

  const performVisualScroll = useCallback((slideIndex: number) => {
    if (visualScrollTimerRef.current) clearTimeout(visualScrollTimerRef.current);
    visualScrollTimerRef.current = setTimeout(() => {
      let targetElementRef: React.RefObject<HTMLDivElement> | null = null;
      if (slideIndex === SLIDE_INDEX_DETAILS) targetElementRef = step1AnchorRef;
      else if (slideIndex === SLIDE_INDEX_MEDIA) targetElementRef = step2AnchorRef;
      else if (slideIndex === SLIDE_INDEX_PREVIEW) targetElementRef = step3AnchorRef;

      if (targetElementRef?.current) {
        const navbar = document.querySelector('header.sticky') as HTMLElement | null;
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const elementRect = targetElementRef.current.getBoundingClientRect();
        const targetScrollY = elementRect.top + window.scrollY - navbarHeight;
        window.scrollTo({ top: targetScrollY, behavior: 'auto' });
      }
    }, 350);
  }, []);

  useEffect(() => { currentSlideRef.current = currentSlide; }, [currentSlide]);

  const handleSetCurrentSlide = useCallback((newSlide: number) => {
    if (newSlide !== currentSlideRef.current) setCurrentSlide(newSlide);
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.scrollTo(currentSlide, true);
    performVisualScroll(currentSlide);
  }, [currentSlide, carouselApi, performVisualScroll]);

  useEffect(() => {
    if (!carouselApi) return;
    const handleApiEvent = () => { if (!carouselApi) return; const newSelectedSnap = carouselApi.selectedScrollSnap(); if (newSelectedSnap !== currentSlideRef.current) handleSetCurrentSlide(newSelectedSnap); };
    if (carouselApi.selectedScrollSnap() !== currentSlideRef.current) handleSetCurrentSlide(carouselApi.selectedScrollSnap());
    else { if (initialScrollTimerRef.current) clearTimeout(initialScrollTimerRef.current); initialScrollTimerRef.current = setTimeout(() => { if (carouselApi && carouselApi.selectedScrollSnap() === currentSlideRef.current) performVisualScroll(currentSlideRef.current); }, 100); }
    carouselApi.on("select", handleApiEvent); carouselApi.on("reInit", handleApiEvent);
    return () => { if (carouselApi) { carouselApi.off("select", handleApiEvent); carouselApi.off("reInit", handleApiEvent); } if (visualScrollTimerRef.current) clearTimeout(visualScrollTimerRef.current); if (initialScrollTimerRef.current) clearTimeout(initialScrollTimerRef.current); };
  }, [carouselApi, performVisualScroll, handleSetCurrentSlide]);

  useEffect(() => { if (selectedDay > daysInSelectedMonth) setSelectedDay(daysInSelectedMonth); }, [selectedDay, daysInSelectedMonth]);

  useEffect(() => {
    const urlToRevoke = currentMediaPreviewUrl;
    return () => { if (urlToRevoke && urlToRevoke.startsWith('blob:')) URL.revokeObjectURL(urlToRevoke); };
  }, [currentMediaPreviewUrl]);

  const handleMediaReady = useCallback((mediaPayload: MediaFromRecorder) => {
    if (currentMediaPreviewUrl && currentMediaPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(currentMediaPreviewUrl);
    const newPreviewUrlFromFile = URL.createObjectURL(mediaPayload.file);
    setCurrentMedia({ file: mediaPayload.file, type: mediaPayload.type, startTime: 0, endTime: mediaPayload.duration, duration: mediaPayload.duration, size: mediaPayload.size, isTrimmed: false });
    setTrimValues([0, mediaPayload.duration]);
    setCurrentMediaPreviewUrl(newPreviewUrlFromFile);
    handleSetCurrentSlide(SLIDE_INDEX_PREVIEW);
  }, [currentMediaPreviewUrl, handleSetCurrentSlide]);

  const handleEmotionTagToggle = (tag: EmotionTag) => setSelectedEmotionTags(prevTags => prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]);
 
  const handleTrimChange = (newValues: [number, number]) => {
    if (currentMedia) {
        setTrimValues(newValues);
    }
  };

  const onSubmitMemory = async (formData: FormData) => {
    if (!user) { toast({ title: "Authentication Error", description: "You must be logged in to save a memory.", variant: "destructive" }); return; }
    setIsParentSubmitting(true);
    const result = await saveMemory(formData, user.id, memoryToEdit?.id || null);
    setIsParentSubmitting(false);

    if (result.success) {
      toast({ title: result.message, variant: "success" });
      router.push(promptId ? '/prompts' : '/timeline');
    } else {
      toast({ title: "Failed to Save Memory", description: result.message, variant: "destructive" });
    }
  };

  const triggerSubmitProcess = useCallback(() => {
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('date', finalDate.toISOString());
    formData.append('description', description);
    formData.append('emotionTags', JSON.stringify(selectedEmotionTags));
    formData.append('category', selectedCategory || 'Other');
    if(location) formData.append('location', location);
    if(country) formData.append('country', country);
    const finalPromptId = promptId || memoryToEdit?.promptId;
    if (finalPromptId) formData.append('promptId', finalPromptId);
    formData.append('isLegacy', (memoryToEdit?.isLegacy || false).toString());

    // ** Corrected Media Handling Logic **
    if (currentMedia) {
        const isNewFile = currentMedia.file.size > 0 && currentMedia.file.name !== "existing_media_placeholder";

        if (isNewFile) {
            // User has recorded/uploaded a new file
            formData.append('mediaFile', currentMedia.file, currentMedia.file.name);
            const mediaMetadata = {
                type: currentMedia.type,
                duration: currentMedia.duration,
                size: currentMedia.size,
                startTime: trimValues[0],
                endTime: trimValues[1],
                isTrimmed: trimValues[0] > 0 || trimValues[1] < currentMedia.duration,
            };
            formData.append('mediaMetadata', JSON.stringify(mediaMetadata));
        } else if (isEditing && memoryToEdit?.mediaAttachments) {
            // User is editing but did NOT change the file. Send back existing info with new trim values.
            const updatedAttachment = {
                ...memoryToEdit.mediaAttachments[0], // Keep old URL, ID, etc.
                startTime: trimValues[0],
                endTime: trimValues[1],
                isTrimmed: trimValues[0] > 0 || trimValues[1] < (memoryToEdit.mediaAttachments[0].duration || currentMedia.duration),
            };
            formData.append('mediaAttachments', JSON.stringify([updatedAttachment]));
        }
    }
   
    onSubmitMemory(formData);
  }, [title, selectedYear, selectedMonth, selectedDay, description, currentMedia, memoryToEdit, location, country, selectedCategory, promptId, selectedEmotionTags, router, user, isEditing, trimValues]);

  const handleActionButtonClick = useCallback(() => {
    if (isParentSubmitting || isTrimming || isPreparingMedia) return;
    if (currentSlide === SLIDE_INDEX_DETAILS) {
      if (!title.trim()) { toast({ title: "Title Required", variant: "destructive" }); setTimeout(() => titleInputRef.current?.focus(), 100); return; }
      let tempDate = new Date(selectedYear, selectedMonth, 1); tempDate = setDate(tempDate, selectedDay);
      if (!isValid(tempDate) || getYear(tempDate) !== selectedYear || getMonth(tempDate) !== selectedMonth || getDate(tempDate) !== selectedDay) { toast({ title: "Invalid Date", variant: "destructive" }); setTimeout(() => yearSelectRef.current?.focus(), 100); return; }
      if (!description.trim()) { toast({ title: "Description Required", description: "Please provide a description.", variant: "default" }); setTimeout(() => descriptionTextareaRef.current?.focus(), 100); return; }
      if (!selectedCategory) { toast({ title: "Category Required", description: "Please select a category.", variant: "default" }); return; }
      handleSetCurrentSlide(SLIDE_INDEX_MEDIA);
    } else if (currentSlide === SLIDE_INDEX_MEDIA) {
      if (!currentMedia && !isEditing) {
        toast({ title: "Media is Required", description: "Please record or upload media to proceed.", variant: "default" }); return;
      }
      setMediaKey(Date.now().toString());
      handleSetCurrentSlide(SLIDE_INDEX_PREVIEW);
    } else if (currentSlide === SLIDE_INDEX_PREVIEW) {
      triggerSubmitProcess();
    }
  }, [isParentSubmitting, isTrimming, isPreparingMedia, currentSlide, title, description, selectedYear, selectedMonth, selectedDay, selectedCategory, isEditing, triggerSubmitProcess, currentMedia, handleSetCurrentSlide]);

  const handleFormSubmit = (event: FormEvent) => { event.preventDefault(); handleActionButtonClick(); };

  let actionButtonText = 'Next'; let ActionButtonIcon: React.ElementType = ArrowRight;
  const isNextToPreviewEnabled = !!currentMedia || isEditing;

  if (currentSlide === SLIDE_INDEX_MEDIA) { actionButtonText = 'Next to Preview'; ActionButtonIcon = Eye; }
  else if (currentSlide === SLIDE_INDEX_PREVIEW) { actionButtonText = isEditing ? 'Update Memory' : 'Save Memory'; ActionButtonIcon = Sparkles; }

  const mediaForRecorderProp = currentMedia && currentMediaPreviewUrl ? { type: currentMedia.type, previewUrl: currentMediaPreviewUrl, duration: currentMedia.duration, size: currentMedia.size } : undefined;
  const currentPromptIdForTeleprompter = promptId || memoryToEdit?.promptId;

  let mockMemoryForPreview: Memory | undefined = undefined;
  if (currentSlide === SLIDE_INDEX_PREVIEW) {
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    let mediaAttachmentsForPreview: MediaAttachment[] | undefined = undefined;
    if (currentMedia && currentMediaPreviewUrl) {
        const isNewFile = currentMedia.file.name !== "existing_media_placeholder";
        mediaAttachmentsForPreview = [{ 
            id: memoryToEdit?.mediaAttachments?.[0]?.id || 'preview-media-1', 
            type: currentMedia.type, 
            url: currentMediaPreviewUrl, // Use the live preview URL (blob or existing)
            filename: currentMedia.file.name, 
            // Use the live trim values from the slider
            startTime: trimValues[0], 
            endTime: trimValues[1], 
            duration: currentMedia.duration, 
            size: currentMedia.size, 
            isTrimmed: trimValues[0] > 0 || trimValues[1] < currentMedia.duration 
        }];
    } else if (isEditing && memoryToEdit?.mediaAttachments) { 
        mediaAttachmentsForPreview = memoryToEdit.mediaAttachments; 
    }

    mockMemoryForPreview = { id: memoryToEdit?.id || 'preview-id', title: title.trim() || "Untitled Chapter", date: isValid(finalDate) ? finalDate.toISOString() : new Date().toISOString(), description: description.trim() || "No description.", emotionTags: selectedEmotionTags, mediaAttachments: mediaAttachmentsForPreview, location: location.trim() || undefined, country: country.trim() || undefined, category: selectedCategory, userId: user?.id || 'preview-user-id', promptId: promptId || memoryToEdit?.promptId, isLegacy: memoryToEdit?.isLegacy || false };
  }
 
  const previewKey = `${mockMemoryForPreview?.id}-${mediaKey}-${trimValues[0]}-${trimValues[1]}`;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: false, draggable: false }} className="w-full max-w-3xl mx-auto py-4">
        <CarouselContent>
          <CarouselItem>
            <div ref={step1AnchorRef} />
            <Card className="w-full">
              <CardHeader><CardTitle className="font-headline text-2xl">{isEditing ? 'Edit Chapter' : 'New Chapter'} (Step {SLIDE_INDEX_DETAILS + 1} of {TOTAL_SLIDES})</CardTitle><CardDescription>Capture the details of your moment. Fields marked with * are mandatory.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1"><Label htmlFor="title">Title *</Label><Input ref={titleInputRef} id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Summer Vacation in Italy" /></div>
                <div className="space-y-1">
                  <Label htmlFor="year-select">Date *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label htmlFor="year-select" className="sr-only">Year</Label><Select key={`year-${selectedYear.toString()}-${memoryToEdit?.id || 'new'}`} value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}><SelectTrigger id="year-select" ref={yearSelectRef}><SelectValue placeholder="Year" /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="month-select" className="sr-only">Month</Label><Select key={`month-${selectedMonth.toString()}-${memoryToEdit?.id || 'new'}`} value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}><SelectTrigger id="month-select"><SelectValue placeholder="Month" /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="day-select" className="sr-only">Day</Label><Select key={`day-${selectedDay.toString()}-${memoryToEdit?.id || 'new'}`} value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}><SelectTrigger id="day-select"><SelectValue placeholder="Day" /></SelectTrigger><SelectContent>{dayOptions.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label htmlFor="location"><MapPin className="inline-block mr-1 h-4 w-4" />Location (Optional)</Label><Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Eiffel Tower, Paris" /></div>
                  <div className="space-y-1"><Label htmlFor="country-select">Country (Optional)</Label><Select key={`country-${country}-${memoryToEdit?.id || 'new'}`} value={country} onValueChange={setCountry}><SelectTrigger id="country-select"><SelectValue placeholder="Select Country" /></SelectTrigger><SelectContent>{countryOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent></Select></div>
                </div>
                <div className="space-y-1"><Label htmlFor="category-select">Category *</Label><Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as MemoryCategory)}><SelectTrigger id="category-select"><Layers className="inline-block mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{memoryCategoriesList.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-1"><Label htmlFor="description">Description *</Label><Textarea ref={descriptionTextareaRef} id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your memory..." rows={4} required/></div>
                <div className="space-y-1"><Label htmlFor="emotion-tags"><Tag className="inline-block mr-1 h-4 w-4" />Emotion Tags (Optional)</Label><div id="emotion-tags" className="flex flex-wrap gap-2 pt-1">{emotionTagsList.map((tag) => (<Button type="button" key={tag} variant={selectedEmotionTags.includes(tag) ? 'default' : 'outline'} size="sm" onClick={() => handleEmotionTagToggle(tag)} className="text-xs h-auto py-1 px-2">{tag}</Button>))}</div></div>
              </CardContent>
            </Card>
          </CarouselItem>
          <CarouselItem>
            <div ref={step2AnchorRef} />
            <Card className="w-full"><CardHeader><CardTitle className="font-headline text-lg">Media Attachment for {title ? `"${title}"` : 'this chapter'} * (Step {SLIDE_INDEX_MEDIA + 1} of {TOTAL_SLIDES})</CardTitle><CardDescription>Record or upload a video/audio for your memory.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <MediaCaptureControl key={mediaKey} onMediaReady={handleMediaReady} onPreparingChange={setIsPreparingMedia} initialMedia={mediaForRecorderProp} promptIdForTeleprompter={currentPromptIdForTeleprompter} chapterTitleForTeleprompter={title} trimValues={trimValues} />
                {currentMedia && (<Card className="bg-muted/50"><CardHeader className="pb-2"><CardTitle className="text-base font-medium flex items-center"><Scissors className="mr-2 h-4 w-4"/>Trim Media</CardTitle><CardDescription className="text-xs">Drag the handles to select the part of the media you want to save.</CardDescription></CardHeader><CardContent><div className="space-y-2"><Slider min={0} max={currentMedia.duration} step={0.1} value={trimValues} onValueChange={(vals) => handleTrimChange(vals as [number, number])} minStepsBetweenThumbs={1} disabled={isTrimming} /><div className="flex justify-between text-xs text-muted-foreground font-mono"><span>Start: {formatSecondsToTime(trimValues[0])}</span><span>Duration: {formatSecondsToTime(trimValues[1] - trimValues[0])}</span><span><Timer className="inline h-3 w-3 mr-1" />{formatSecondsToTime(trimValues[1])}</span></div></div></CardContent></Card>)}
              </CardContent>
            </Card>
          </CarouselItem>
          <CarouselItem>
            <div ref={step3AnchorRef} />
            <Card className="w-full"><CardHeader><CardTitle className="font-headline text-2xl">{isEditing ? 'Preview Changes' : 'New Chapter'} (Step {SLIDE_INDEX_PREVIEW + 1} of {TOTAL_SLIDES})</CardTitle><CardDescription>Review your chapter details and media. Go back to make changes or click '{actionButtonText}' to save.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {mockMemoryForPreview && (<div className="border p-1 sm:p-2 rounded-lg bg-background shadow-sm"><MemoryCard key={previewKey} memory={mockMemoryForPreview} userMode="guest" /></div>)}
                {!mockMemoryForPreview && currentSlide === SLIDE_INDEX_PREVIEW && (<p className="text-muted-foreground text-center py-8">Preparing preview...</p>)}
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
      <div className="max-w-3xl mx-auto flex justify-between items-center pt-4 px-1 sm:px-0">
        <Button type="button" onClick={() => { if (currentSlide === SLIDE_INDEX_DETAILS) router.back(); else if (currentSlide === SLIDE_INDEX_MEDIA) handleSetCurrentSlide(SLIDE_INDEX_DETAILS); else if (currentSlide === SLIDE_INDEX_PREVIEW) handleSetCurrentSlide(SLIDE_INDEX_MEDIA);}} disabled={!!isParentSubmitting || isTrimming || isPreparingMedia} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{currentSlide === SLIDE_INDEX_DETAILS ? 'Back' : 'Previous'}</Button>
        <Button type="button" onClick={handleActionButtonClick} disabled={!!isParentSubmitting || isTrimming || isPreparingMedia || (currentSlide === SLIDE_INDEX_MEDIA && !isNextToPreviewEnabled) || (currentSlide === SLIDE_INDEX_PREVIEW && !mockMemoryForPreview)}>{(isParentSubmitting || isTrimming || isPreparingMedia) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<ActionButtonIcon className="mr-2 h-4 w-4" />{actionButtonText}</Button>
      </div>
    </form>
  );
}
