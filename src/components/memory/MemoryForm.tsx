
"use client";

import { useState, type FormEvent, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Memory, User, MediaAttachment, Prompt, EmotionTag, MemoryCategory } from '@/types';
import { emotionTagsList, memoryCategoriesList } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MemoryCard } from './MemoryCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Paperclip, ArrowRight, Tag, MapPin, ArrowLeft, Eye, Layers, Scissors, Timer } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { getFFmpeg } from '@/lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const MediaCaptureControl = dynamic(
  () => import('@/components/memory/MediaRecorder').then((mod) => mod.MediaCaptureControl),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
);

interface MemoryFormProps {
  memory?: Memory;
  onSubmit: (
    memoryData: Omit<Memory, 'id' | 'userId'> & { promptId?: string },
    mediaFileToUpload?: File
  ) => void;
  isSubmitting?: boolean;
  initialPromptId?: string; 
  initialCustomPromptText?: string; 
}

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

type MediaForRecorderInit = {
  type: 'video' | 'audio';
  previewUrl: string; 
  duration: number;
  size: number;
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


export function MemoryForm({ memory, onSubmit, isSubmitting: isParentSubmitting, initialPromptId, initialCustomPromptText }: MemoryFormProps) {
  const { user, hostPassStatus } = useAuth();
  const searchParams = useSearchParams(); 
  const router = useRouter();
  const isEditing = !!memory;

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const yearSelectRef = useRef<HTMLButtonElement>(null); 

  const step1AnchorRef = useRef<HTMLDivElement>(null);
  const step2AnchorRef = useRef<HTMLDivElement>(null);
  const step3AnchorRef = useRef<HTMLDivElement>(null);

  const visualScrollTimerRef = useRef<NodeJS.Timeout | null>();
  const initialScrollTimerRef = useRef<NodeJS.Timeout | null>();

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(memoryCategoriesList[0]);

  const getInitialDateComponent = useCallback((component: 'year' | 'month' | 'day', dateSource?: string) => {
    const dateToParse = dateSource ? parseISO(dateSource) : new Date();
    if (isValid(dateToParse)) {
      if (component === 'year') return getYear(dateToParse);
      if (component === 'month') return getMonth(dateToParse);
      if (component === 'day') return getDate(dateToParse);
    }
    const today = new Date();
    if (component === 'year') return getYear(today);
    if (component === 'month') return getMonth(today);
    return getDate(today);
  }, []);

  const [selectedYear, setSelectedYear] = useState<number>(globalCurrentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<number>(getDate(new Date()));

  const [description, setDescription] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>([]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(SLIDE_INDEX_DETAILS);
  const currentSlideRef = useRef(currentSlide);

  const [currentMedia, setCurrentMedia] = useState<CurrentMediaData | null>(null);
  const [currentMediaPreviewUrl, setCurrentMediaPreviewUrl] = useState<string | null>(null); 
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 100]);
  const [isTrimming, setIsTrimming] = useState(false);
  const [mediaKey, setMediaKey] = useState(Date.now().toString());

  const [pendingTrimmedMedia, setPendingTrimmedMedia] = useState<{ media: CurrentMediaData, url: string } | null>(null);

  useEffect(() => {
    if (pendingTrimmedMedia) {
      setCurrentMedia(null); // Unmount the component
      setCurrentMediaPreviewUrl(null);
      
      // In the next render cycle, set the new media
      // This timeout ensures React processes the null state first
      setTimeout(() => {
        setCurrentMedia(pendingTrimmedMedia.media);
        setCurrentMediaPreviewUrl(pendingTrimmedMedia.url);
        setTrimValues([0, pendingTrimmedMedia.media.duration]);
        setPendingTrimmedMedia(null);
        toast({ title: "Trim Applied!", description: "The media has been trimmed. You can now preview the result.", variant: "success" });
      }, 0);
    }
  }, [pendingTrimmedMedia]);


  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setLocation(memory.location || '');
      setSelectedCategory(memory.category || memoryCategoriesList[0]);

      let initialCountryValue = 'United Kingdom';
      if (memory.country) {
        if (memory.country.toUpperCase() === 'UK') initialCountryValue = 'United Kingdom';
        else if (memory.country.toUpperCase() === 'USA' || memory.country.toUpperCase() === 'US') initialCountryValue = 'United States';
        else { const foundOption = countryOptions.find(opt => opt.value.toLowerCase() === memory.country!.toLowerCase()); initialCountryValue = foundOption ? foundOption.value : 'United Kingdom'; }
      }
      setCountry(initialCountryValue);

      setDescription(memory.description || '');
      setSelectedEmotionTags(memory.emotionTags || []);
      setSelectedYear(getInitialDateComponent('year', memory.date));
      setSelectedMonth(getInitialDateComponent('month', memory.date));
      setSelectedDay(getInitialDateComponent('day', memory.date));

      if (memory.mediaAttachments && memory.mediaAttachments.length > 0 && memory.mediaAttachments[0].url) {
        const firstMedia = memory.mediaAttachments[0];
        const duration = (typeof firstMedia.duration === 'number' && !isNaN(firstMedia.duration)) ? firstMedia.duration : 0;
        const size = (typeof firstMedia.size === 'number' && !isNaN(firstMedia.size)) ? firstMedia.size : 0;
        
        const startTime = (typeof firstMedia.startTime === 'number' && !isNaN(firstMedia.startTime)) ? firstMedia.startTime : 0;
        const endTime = (typeof firstMedia.endTime === 'number' && !isNaN(firstMedia.endTime) && firstMedia.endTime <= duration) ? firstMedia.endTime : duration;

        setCurrentMedia({
            file: new File([], firstMedia.filename || "existing_media_placeholder", {type: firstMedia.type === 'video' ? 'video/webm' : 'audio/webm'}), 
            type: firstMedia.type,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            size: size,
            isTrimmed: firstMedia.isTrimmed || false,
        });
        setCurrentMediaPreviewUrl(firstMedia.url); 
        setTrimValues([startTime, endTime]);
      } else {
        setCurrentMedia(null); setCurrentMediaPreviewUrl(null);
      }
    } else { // New memory
      let determinedInitialTitle = '';
      if (initialCustomPromptText) {
        determinedInitialTitle = initialCustomPromptText;
      } else if (initialPromptId) {
        const foundPrompt = mockPromptGroups.flatMap(g => g.prompts).find(p => p.id === initialPromptId);
        determinedInitialTitle = foundPrompt ? foundPrompt.text.en : '';
      }
      setTitle(determinedInitialTitle);
      setLocation(''); setCountry('United Kingdom'); setDescription(''); setSelectedEmotionTags([]); setSelectedCategory(memoryCategoriesList[0]);
      setSelectedYear(getInitialDateComponent('year')); setSelectedMonth(getInitialDateComponent('month')); setSelectedDay(getInitialDateComponent('day'));
      setCurrentMedia(null); setCurrentMediaPreviewUrl(null);
    }
  }, [memory, initialPromptId, initialCustomPromptText, getInitialDateComponent]);


  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(new Date(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const dayOptions = useMemo(() => {
    return Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  }, [daysInSelectedMonth]);

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
        const currentScrollY = window.scrollY;
        const targetScrollY = elementRect.top + currentScrollY - navbarHeight;
        window.scrollTo({ top: targetScrollY, behavior: 'auto' });
      }
    }, 350);
  }, []);

  useEffect(() => { currentSlideRef.current = currentSlide; }, [currentSlide]);

 useEffect(() => {
    if (!carouselApi) return;
    carouselApi.scrollTo(currentSlide, true);
    performVisualScroll(currentSlide);
  }, [currentSlide, carouselApi, performVisualScroll]);

  useEffect(() => {
    if (!carouselApi) return;
    const handleApiEvent = () => { if (!carouselApi) return; const newSelectedSnap = carouselApi.selectedScrollSnap(); if (newSelectedSnap !== currentSlideRef.current) setCurrentSlide(newSelectedSnap); };
    const initialSnap = carouselApi.selectedScrollSnap();
    if (initialSnap !== currentSlideRef.current) setCurrentSlide(initialSnap);
    else { if (initialScrollTimerRef.current) clearTimeout(initialScrollTimerRef.current); initialScrollTimerRef.current = setTimeout(() => { if (carouselApi && carouselApi.selectedScrollSnap() === currentSlideRef.current) performVisualScroll(currentSlideRef.current); }, 100); }
    carouselApi.on("select", handleApiEvent); carouselApi.on("reInit", handleApiEvent);
    return () => { if (carouselApi) { carouselApi.off("select", handleApiEvent); carouselApi.off("reInit", handleApiEvent); } if (visualScrollTimerRef.current) clearTimeout(visualScrollTimerRef.current); if (initialScrollTimerRef.current) clearTimeout(initialScrollTimerRef.current); };
  }, [carouselApi, performVisualScroll]);

  useEffect(() => { if (selectedDay > daysInSelectedMonth) setSelectedDay(daysInSelectedMonth); }, [selectedDay, daysInSelectedMonth]);

  useEffect(() => {
    const urlToRevoke = currentMediaPreviewUrl;
    return () => {
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [currentMediaPreviewUrl]);

  const handleMediaReady = useCallback((mediaPayload: MediaFromRecorder) => {
    if (currentMediaPreviewUrl && currentMediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentMediaPreviewUrl);
    }
    const newPreviewUrlFromFile = URL.createObjectURL(mediaPayload.file);
    setCurrentMedia({ 
      file: mediaPayload.file,
      type: mediaPayload.type,
      startTime: 0,
      endTime: mediaPayload.duration,
      duration: mediaPayload.duration,
      size: mediaPayload.size,
      isTrimmed: false,
    });
    setTrimValues([0, mediaPayload.duration]);
    setCurrentMediaPreviewUrl(newPreviewUrlFromFile);
  }, [currentMediaPreviewUrl]);

  const handleMediaDiscard = useCallback(() => {
    if (currentMediaPreviewUrl && currentMediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentMediaPreviewUrl);
    }
    setCurrentMedia(null);
    setCurrentMediaPreviewUrl(null);
    setTrimValues([0, 100]);
  }, [currentMediaPreviewUrl]);

  const handleEmotionTagToggle = (tag: EmotionTag) => setSelectedEmotionTags(prevTags => prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]);
  
  const handleTrimChange = (newValues: [number, number]) => {
    if (currentMedia) {
      const [oldStart, oldEnd] = trimValues;
      const [newStart, newEnd] = newValues;

      if (newStart !== oldStart) {
        setTrimValues([newStart, oldEnd]);
      } else if (newEnd !== oldEnd) {
        setTrimValues([oldStart, newEnd]);
      } else {
        setTrimValues(newValues);
      }
    }
  };

  const handleApplyTrim = async () => {
    if (!currentMedia || isTrimming) return;
    
    const [start, end] = trimValues;
    if (end - start <= 0) {
        toast({ title: "Invalid Trim", description: "End time must be after start time.", variant: "destructive" });
        return;
    }

    setIsTrimming(true);
    toast({ title: "Applying Trim & Finalize...", description: "This may take a moment. Please wait." });

    try {
        const ffmpeg = await getFFmpeg();
        const inputFileName = `input.webm`;
        const outputFileName = `output.webm`;

        await ffmpeg.writeFile(inputFileName, await fetchFile(currentMedia.file));

        await ffmpeg.exec([
            '-i', inputFileName,
            '-ss', `${start}`,
            '-to', `${end}`,
            '-c', 'copy',
            outputFileName
        ]);

        const data = await ffmpeg.readFile(outputFileName);
        const newFile = new File([data], outputFileName, { type: currentMedia.file.type });

        if (currentMediaPreviewUrl && currentMediaPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(currentMediaPreviewUrl);
        }
        
        const newPreviewUrl = URL.createObjectURL(newFile);
        const newDuration = end - start;

        const newMediaData: CurrentMediaData = {
            file: newFile,
            type: currentMedia.type,
            startTime: 0,
            endTime: newDuration,
            duration: newDuration,
            size: newFile.size,
            isTrimmed: true,
        };
        
        setPendingTrimmedMedia({ media: newMediaData, url: newPreviewUrl });
        
    } catch (error) {
        console.error("Error applying trim:", error);
        toast({ title: "Trimming Failed", description: "Could not trim the media. Please try again.", variant: "destructive" });
    } finally {
        setIsTrimming(false);
    }
  };

  const triggerSubmitProcess = useCallback(() => {
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    let mediaAttachmentsForSubmission: MediaAttachment[] | undefined = undefined;
    let mediaFileToUpload: File | undefined = undefined;

    if (currentMedia) { 
      const isNewOrTrimmedFile = currentMedia.file.size > 0 && (currentMedia.file.name !== "existing_media_placeholder" || currentMedia.isTrimmed);
      if (isNewOrTrimmedFile) mediaFileToUpload = currentMedia.file;

      const originalMediaAttachmentId = memory?.mediaAttachments?.[0]?.id || Date.now().toString();
      const urlForSubmission = isNewOrTrimmedFile ? "placeholder_for_upload" : (currentMediaPreviewUrl || memory?.mediaAttachments?.[0]?.url || '');

      mediaAttachmentsForSubmission = [{
        id: originalMediaAttachmentId,
        type: currentMedia.type,
        url: urlForSubmission,
        filename: currentMedia.file.name, 
        startTime: currentMedia.isTrimmed ? 0 : trimValues[0],
        endTime: currentMedia.isTrimmed ? currentMedia.duration : trimValues[1],
        duration: currentMedia.duration,
        size: currentMedia.size,
        isTrimmed: currentMedia.isTrimmed,
      }];
    } else if (isEditing && memory?.mediaAttachments && memory.mediaAttachments.length > 0) {
        mediaAttachmentsForSubmission = undefined; 
    }
    
    const finalPromptIdToSave = initialPromptId || memory?.promptId || undefined;

    onSubmit(
      { title, date: finalDate.toISOString(), description, emotionTags: selectedEmotionTags, mediaAttachments: mediaAttachmentsForSubmission,
        location: location || undefined, country: country || undefined, category: selectedCategory, 
        promptId: finalPromptIdToSave, isLegacy: memory?.isLegacy || false },
      mediaFileToUpload
    );
  }, [title, selectedYear, selectedMonth, selectedDay, description, currentMedia, memory, onSubmit, currentMediaPreviewUrl, location, country, selectedCategory, initialPromptId, selectedEmotionTags, isEditing, trimValues]);

  const handleActionButtonClick = useCallback(() => {
    if (isParentSubmitting || isTrimming) return;
    if (currentSlide === SLIDE_INDEX_DETAILS) {
      if (!title.trim()) { toast({ title: "Title Required", variant: "destructive" }); setTimeout(() => titleInputRef.current?.focus(), 100); return; }
      let tempDate = new Date(selectedYear, selectedMonth, 1); tempDate = setDate(tempDate, selectedDay);
      if (!isValid(tempDate) || getYear(tempDate) !== selectedYear || getMonth(tempDate) !== selectedMonth || getDate(tempDate) !== selectedDay) { toast({ title: "Invalid Date", variant: "destructive" }); setTimeout(() => yearSelectRef.current?.focus(), 100); return; }
      if (!description.trim()) { toast({ title: "Description Required" }); setTimeout(() => descriptionTextareaRef.current?.focus(), 100); return; }
      if (!selectedCategory) { toast({ title: "Category Required" }); return; }
       setCurrentSlide(SLIDE_INDEX_MEDIA);
    } else if (currentSlide === SLIDE_INDEX_MEDIA) {
      if (!currentMedia && (!isEditing || !memory?.mediaAttachments?.length)) {
        toast({ title: "Media is Required to Proceed", description: "Please record a video or audio first, then you can proceed to the preview step." });
        return;
      }
      setMediaKey(Date.now().toString());
      setCurrentSlide(SLIDE_INDEX_PREVIEW);
    } else if (currentSlide === SLIDE_INDEX_PREVIEW) triggerSubmitProcess();
  }, [ isParentSubmitting, isTrimming, currentSlide, title, description, selectedYear, selectedMonth, selectedDay, selectedCategory, isEditing, triggerSubmitProcess, currentMedia, memory?.mediaAttachments ]);

  const handleFormSubmit = (event: FormEvent) => { event.preventDefault(); handleActionButtonClick(); };

  let actionButtonText = 'Next'; let ActionButtonIcon: React.ElementType = ArrowRight;
  const isNextToPreviewEnabled = !!currentMedia || (isEditing && !!memory?.mediaAttachments?.length);

  if (currentSlide === SLIDE_INDEX_MEDIA) { 
    actionButtonText = 'Next to Preview'; 
    ActionButtonIcon = Eye; 
  }
  else if (currentSlide === SLIDE_INDEX_PREVIEW) { 
    actionButtonText = isEditing ? 'Update Memory' : 'Save Memory'; 
    ActionButtonIcon = Sparkles; 
  }

  const mediaForRecorderProp = useMemo(() => {
    if (currentMedia && currentMediaPreviewUrl) {
      return {
        type: currentMedia.type,
        previewUrl: currentMediaPreviewUrl,
        duration: currentMedia.duration,
        size: currentMedia.size,
      };
    }
    return undefined;
  }, [currentMedia, currentMediaPreviewUrl]);
  
  const currentPromptIdForTeleprompter = initialPromptId || memory?.promptId;

  let mockMemoryForPreview: Memory | undefined = undefined;
  if (currentSlide === SLIDE_INDEX_PREVIEW) {
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    let mediaAttachmentsForPreview: MediaAttachment[] | undefined = undefined;
    if (currentMedia && currentMediaPreviewUrl) { 
      mediaAttachmentsForPreview = [{
        id: memory?.mediaAttachments?.[0]?.id || 'preview-media-1',
        type: currentMedia.type, url: currentMediaPreviewUrl, filename: currentMedia.file.name,
        startTime: currentMedia.isTrimmed ? 0 : trimValues[0],
        endTime: currentMedia.isTrimmed ? currentMedia.duration : trimValues[1],
        duration: currentMedia.duration, size: currentMedia.size,
        isTrimmed: currentMedia.isTrimmed,
      }];
    }
    mockMemoryForPreview = {
      id: memory?.id || 'preview-id', title: title.trim() || "Untitled Chapter", date: isValid(finalDate) ? finalDate.toISOString() : new Date().toISOString(),
      description: description.trim() || "No description provided.", emotionTags: selectedEmotionTags, mediaAttachments: mediaAttachmentsForPreview,
      location: location.trim() || undefined, country: country.trim() || undefined, category: selectedCategory,
      userId: user?.id || 'preview-user-id',
      promptId: initialPromptId || memory?.promptId, isLegacy: memory?.isLegacy || false,
    };
  }

  const isTrimChangedFromOriginal = currentMedia && !currentMedia.isTrimmed && (trimValues[0] > 0 || trimValues[1] < currentMedia.duration);
  
  const previewKey = `${mockMemoryForPreview?.id}-${mediaKey}`;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: false, draggable: false }} className="w-full max-w-3xl mx-auto py-4">
        <CarouselContent>
          <CarouselItem>
            <div ref={step1AnchorRef} />
            <Card className="w-full">
              <CardHeader><CardTitle className="font-headline text-2xl">{memory ? 'Edit Chapter' : 'New Chapter'} (Step {SLIDE_INDEX_DETAILS + 1} of {TOTAL_SLIDES})</CardTitle><CardDescription>Capture the details of your moment. Fields marked with * are mandatory.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="title">Title *</Label>
                  <Input ref={titleInputRef} id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Summer Vacation in Italy" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="year-select">Date *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="year-select" className="sr-only">Year</Label>
                      <Select key={`year-${selectedYear.toString()}-${memory?.id || 'new'}`} value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                          <SelectTrigger id="year-select" ref={yearSelectRef}><SelectValue placeholder="Year" /></SelectTrigger>
                          <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="month-select" className="sr-only">Month</Label>
                      <Select key={`month-${selectedMonth.toString()}-${memory?.id || 'new'}`} value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                        <SelectTrigger id="month-select"><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="day-select" className="sr-only">Day</Label>
                      <Select key={`day-${selectedDay.toString()}-${memory?.id || 'new'}`} value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                        <SelectTrigger id="day-select"><SelectValue placeholder="Day" /></SelectTrigger>
                        <SelectContent>{dayOptions.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="location"><MapPin className="inline-block mr-1 h-4 w-4" />Location (Optional)</Label>
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Eiffel Tower, Paris" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="country-select">Country (Optional)</Label>
                        <Select key={`country-${country}-${memory?.id || 'new'}`} value={country} onValueChange={setCountry}>
                            <SelectTrigger id="country-select"><SelectValue placeholder="Select Country" /></SelectTrigger>
                            <SelectContent>{countryOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="category-select">Category *</Label>
                  <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as MemoryCategory)}>
                    <SelectTrigger id="category-select"><Layers className="inline-block mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{memoryCategoriesList.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea ref={descriptionTextareaRef} id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your memory..." rows={4} required/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emotion-tags"><Tag className="inline-block mr-1 h-4 w-4" />Emotion Tags (Optional)</Label>
                  <div id="emotion-tags" className="flex flex-wrap gap-2 pt-1">{emotionTagsList.map((tag) => (<Button type="button" key={tag} variant={selectedEmotionTags.includes(tag) ? 'default' : 'outline'} size="sm" onClick={() => handleEmotionTagToggle(tag)} className="text-xs h-auto py-1 px-2">{tag}</Button>))}</div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
          <CarouselItem>
            <div ref={step2AnchorRef} />
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="font-headline text-lg">Media Attachment for {title ? `"${title}"` : 'this chapter'} * (Step {SLIDE_INDEX_MEDIA + 1} of {TOTAL_SLIDES})</CardTitle>
                {!currentMedia && <CardDescription>Record or upload a video/audio for your memory.</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                  {currentMedia ? (
                     <MediaCaptureControl
                        key={mediaKey}
                        onMediaReady={handleMediaReady}
                        onDiscard={handleMediaDiscard}
                        initialMedia={mediaForRecorderProp}
                        promptIdForTeleprompter={currentPromptIdForTeleprompter}
                        chapterTitleForTeleprompter={title}
                        trimValues={trimValues}
                    />
                  ) : (
                    <MediaCaptureControl onMediaReady={handleMediaReady} onDiscard={handleMediaDiscard} promptIdForTeleprompter={currentPromptIdForTeleprompter} chapterTitleForTeleprompter={title} trimValues={trimValues}/>
                  )}
                  {currentMedia && (
                    <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center"><Scissors className="mr-2 h-4 w-4"/>Trim Media (Client-Side)</CardTitle>
                            <CardDescription className="text-xs">
                                Drag the handles to select the part of the media you want to save. The player will preview this selection.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Slider
                                    min={0}
                                    max={currentMedia.duration}
                                    step={0.1}
                                    value={trimValues}
                                    onValueChange={(vals) => handleTrimChange(vals as [number, number])}
                                    minStepsBetweenThumbs={1}
                                    disabled={currentMedia.isTrimmed || isTrimming}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                    <span>Start: {formatSecondsToTime(trimValues[0])}</span>
                                    <span>End: {formatSecondsToTime(trimValues[1])}</span>
                                    <span><Timer className="inline h-3 w-3 mr-1" />{formatSecondsToTime(trimValues[1] - trimValues[0])}</span>
                                </div>
                            </div>
                           {isTrimChangedFromOriginal && (
                                <div className="mt-4">
                                    <Button onClick={handleApplyTrim} disabled={isTrimming} className="w-full">
                                        {isTrimming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scissors className="mr-2 h-4 w-4" />}
                                        {isTrimming ? 'Applying Trim & Finalize...' : 'Apply Trim & Finalize'}
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center mt-1">This will permanently trim the file for this memory.</p>
                                </div>
                           )}
                           {currentMedia.isTrimmed && (
                            <p className="text-sm text-green-600 mt-2 text-center">Trim has been applied.</p>
                           )}
                        </CardContent>
                    </Card>
                  )}
              </CardContent>
            </Card>
          </CarouselItem>
          <CarouselItem>
            <div ref={step3AnchorRef} />
            <Card className="w-full">
              <CardHeader><CardTitle className="font-headline text-2xl">{memory ? 'Preview Changes' : 'New Chapter'} (Step {SLIDE_INDEX_PREVIEW + 1} of {TOTAL_SLIDES})</CardTitle><CardDescription>Review your chapter details and media. Go back to make changes or click '{actionButtonText}' to save.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {mockMemoryForPreview && (<div className="border p-1 sm:p-2 rounded-lg bg-background shadow-sm"><MemoryCard key={previewKey} memory={mockMemoryForPreview} userMode="guest" /></div>)}
                {!mockMemoryForPreview && currentSlide === SLIDE_INDEX_PREVIEW && (<p className="text-muted-foreground text-center py-8">Preparing preview... If this persists, ensure all required fields in previous steps are complete.</p>)}
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className="max-w-3xl mx-auto flex justify-between items-center pt-4 px-1 sm:px-0">
        <Button type="button" onClick={() => { if (currentSlide === SLIDE_INDEX_DETAILS) router.back(); else if (currentSlide === SLIDE_INDEX_MEDIA) setCurrentSlide(SLIDE_INDEX_DETAILS); else if (currentSlide === SLIDE_INDEX_PREVIEW) setCurrentSlide(SLIDE_INDEX_MEDIA);}} disabled={!!isParentSubmitting || isTrimming} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{currentSlide === SLIDE_INDEX_DETAILS ? 'Back' : 'Previous'}</Button>
        <Button type="button" onClick={handleActionButtonClick} disabled={!!isParentSubmitting || isTrimming || (currentSlide === SLIDE_INDEX_MEDIA && !isNextToPreviewEnabled) || (currentSlide === SLIDE_INDEX_PREVIEW && !mockMemoryForPreview)}>{(isParentSubmitting || isTrimming) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<ActionButtonIcon className="mr-2 h-4 w-4" />{actionButtonText}</Button>
      </div>
    </form>
  );
}
