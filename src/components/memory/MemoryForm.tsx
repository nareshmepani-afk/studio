
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
import { Sparkles, Loader2, Paperclip, ArrowRight, Tag, MapPin, ArrowLeft, Eye, Layers, Scissors, Timer, AlertCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getDaysInMonth, format, isValid, setDate, getMonth, getYear, parseISO, getDate } from 'date-fns';
import { enGB } from 'date-fns/locale';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { countryOptions, MAX_RECORDING_DURATION, MAX_UPLOAD_DURATION_SECONDS } from '@/lib/constants';
import { mockPromptGroups } from '@/lib/mockData';
import { Slider } from '@/components/ui/slider';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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
  file?: File; // File is optional for existing media
  type: 'video' | 'audio';
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  isTrimmed: boolean;
  url: string; // The URL to play from (blob or remote)
  filename: string;
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
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 100]);
  const [isTrimming, setIsTrimming] = useState(false);
  const [mediaKey, setMediaKey] = useState(Date.now().toString());

  const [isPreparingMedia, setIsPreparingMedia] = useState(false);

  useEffect(() => {
    console.log('[MemoryForm] useEffect: Initializing form state.');
    if (isEditing) {
      console.log('[MemoryForm] useEffect: Populating form for EDIT mode. Memory ID:', memory.id);
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
        console.log('[MemoryForm] useEffect: Existing media attachment found:', firstMedia);
        
        const duration = firstMedia.duration ?? 0;
        const startTime = firstMedia.startTime ?? 0;
        const endTime = firstMedia.endTime ?? duration;

        setCurrentMedia({
            type: firstMedia.type,
            startTime,
            endTime,
            duration,
            size: firstMedia.size ?? 0,
            isTrimmed: firstMedia.isTrimmed || false,
            url: firstMedia.url,
            filename: firstMedia.filename || "existing_media",
        });
        setTrimValues([startTime, endTime]);
      } else {
        console.log('[MemoryForm] useEffect: No existing media attachment.');
        setCurrentMedia(null);
      }
    } else {
      console.log('[MemoryForm] useEffect: Populating form for NEW mode.');
      let determinedInitialTitle = '';
      if (initialCustomPromptText) determinedInitialTitle = initialCustomPromptText;
      else if (initialPromptId) {
        const foundPrompt = mockPromptGroups.flatMap(g => g.prompts).find(p => p.id === initialPromptId);
        determinedInitialTitle = foundPrompt ? foundPrompt.text.en : '';
      }
      setTitle(determinedInitialTitle);
      setLocation(''); setCountry('United Kingdom'); setDescription(''); setSelectedEmotionTags([]); setSelectedCategory(memoryCategoriesList[0]);
      setSelectedYear(getInitialDateComponent('year')); setSelectedMonth(getInitialDateComponent('month')); setSelectedDay(getInitialDateComponent('day'));
      setCurrentMedia(null);
    }
  }, [memory, initialPromptId, initialCustomPromptText, getInitialDateComponent, isEditing]);


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
        const currentScrollY = window.scrollY;
        const targetScrollY = elementRect.top + currentScrollY - navbarHeight;
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
    const initialSnap = carouselApi.selectedScrollSnap();
    if (initialSnap !== currentSlideRef.current) handleSetCurrentSlide(initialSnap);
    else { if (initialScrollTimerRef.current) clearTimeout(initialScrollTimerRef.current); initialScrollTimerRef.current = setTimeout(() => { if (carouselApi && carouselApi.selectedScrollSnap() === currentSlideRef.current) performVisualScroll(currentSlideRef.current); }, 100); }
    carouselApi.on("select", handleApiEvent); carouselApi.on("reInit", handleApiEvent);
    return () => { if (carouselApi) { carouselApi.off("select", handleApiEvent); carouselApi.off("reInit", handleApiEvent); } if (visualScrollTimerRef.current) clearTimeout(visualScrollTimerRef.current); if (initialScrollTimerRef.current) clearTimeout(initialScrollTimerRef.current); };
  }, [carouselApi, performVisualScroll, handleSetCurrentSlide]);

  useEffect(() => { if (selectedDay > daysInSelectedMonth) setSelectedDay(daysInSelectedMonth); }, [selectedDay, daysInSelectedMonth]);

  useEffect(() => {
    const urlToRevoke = currentMedia?.url;
    return () => {
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        console.log('[MemoryForm] Cleanup: Revoking blob URL:', urlToRevoke);
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [currentMedia?.url]);

  const handleMediaReady = useCallback((mediaPayload: MediaFromRecorder) => {
    console.log('[MemoryForm] handleMediaReady: Received media from recorder.', mediaPayload);
    const newPreviewUrlFromFile = URL.createObjectURL(mediaPayload.file);
    console.log('[MemoryForm] handleMediaReady: Created new blob URL:', newPreviewUrlFromFile);
    setCurrentMedia({ 
      file: mediaPayload.file,
      type: mediaPayload.type,
      startTime: 0,
      endTime: mediaPayload.duration,
      duration: mediaPayload.duration,
      size: mediaPayload.size,
      isTrimmed: false,
      url: newPreviewUrlFromFile,
      filename: mediaPayload.file.name,
    });
    setTrimValues([0, mediaPayload.duration]);
    toast({ title: "Media Ready", description: "You can now preview and define a playback segment for your media.", variant: "success" });
  }, []);

  const handleMediaDiscard = useCallback(() => {
    console.log('[MemoryForm] handleMediaDiscard called. Resetting all media state.');
    setCurrentMedia(null);
    setTrimValues([0, 100]);
  }, []);

  const handleEmotionTagToggle = (tag: EmotionTag) => setSelectedEmotionTags(prevTags => prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]);
  const handleTrimChange = (newValues: [number, number]) => { if (currentMedia) setTrimValues(newValues); };

  const triggerSubmitProcess = useCallback(() => {
    console.log('[MemoryForm] triggerSubmitProcess: Triggering submission.');
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    const [startTime, endTime] = trimValues;
    
    let mediaAttachmentsPayload: MediaAttachment[] | null | undefined = undefined;

    if (currentMedia) {
        const hasBeenTrimmed = startTime > 0 || endTime < currentMedia.duration;
        mediaAttachmentsPayload = [{
            id: (isEditing && memory?.mediaAttachments?.[0]?.id) ? memory.mediaAttachments[0].id : 'media' + Date.now(),
            type: currentMedia.type,
            url: currentMedia.file ? '' : currentMedia.url,
            filename: currentMedia.filename,
            processingStatus: currentMedia.file ? 'uploading' : 'complete',
            startTime: startTime,
            endTime: endTime,
            duration: currentMedia.duration,
            size: currentMedia.size,
            isTrimmed: hasBeenTrimmed,
        }];
    } else if (isEditing) {
        mediaAttachmentsPayload = null; // Explicitly removing media
    }
    
    const submissionData = { 
        title, 
        date: finalDate.toISOString(), 
        description, 
        emotionTags: selectedEmotionTags,
        location: location || undefined, 
        country: country || undefined, 
        category: selectedCategory, 
        promptId: initialPromptId || memory?.promptId || undefined, 
        isLegacy: memory?.isLegacy || false,
        mediaAttachments: mediaAttachmentsPayload
    };
    
    console.log('[MemoryForm] triggerSubmitProcess: Calling parent onSubmit with data:', {
      submissionData,
      mediaFileToUpload: currentMedia?.file
    });

    onSubmit(
      submissionData as Omit<Memory, 'id' | 'userId'>,
      currentMedia?.file
    );
  }, [title, selectedYear, selectedMonth, selectedDay, description, currentMedia, memory, onSubmit, location, country, selectedCategory, initialPromptId, selectedEmotionTags, trimValues, isEditing]);

  const trimmedDuration = useMemo(() => currentMedia ? trimValues[1] - trimValues[0] : 0, [currentMedia, trimValues]);
  const isTrimmedDurationTooLong = useMemo(() => trimmedDuration > MAX_RECORDING_DURATION, [trimmedDuration]);


  const handleActionButtonClick = useCallback(() => {
    if (isParentSubmitting || isTrimming || isPreparingMedia) return;

    if (currentSlide === SLIDE_INDEX_DETAILS) {
      if (!title.trim()) { toast({ title: "Title Required", variant: "destructive" }); setTimeout(() => titleInputRef.current?.focus(), 100); return; }
      let tempDate = new Date(selectedYear, selectedMonth, 1); tempDate = setDate(tempDate, selectedDay);
      if (!isValid(tempDate) || getYear(tempDate) !== selectedYear || getMonth(tempDate) !== selectedMonth || getDate(tempDate) !== selectedDay) { toast({ title: "Invalid Date", variant: "destructive" }); setTimeout(() => yearSelectRef.current?.focus(), 100); return; }
      if (!description.trim()) { toast({ title: "Description Required", description: "Please provide a description for your memory.", variant: "default" }); setTimeout(() => descriptionTextareaRef.current?.focus(), 100); return; }
      if (!selectedCategory) { toast({ title: "Category Required", description: "Please select a category.", variant: "default" }); return; }
       handleSetCurrentSlide(SLIDE_INDEX_MEDIA);
    } else if (currentSlide === SLIDE_INDEX_MEDIA) {
      if (!currentMedia) {
        toast({ title: "Media is Required to Proceed", description: "Please record or upload a video or audio first, then you can proceed to the preview step.", variant: "default" });
        return;
      }
      if (isTrimmedDurationTooLong) {
        toast({ title: "Media Too Long", description: `Please shorten your playback selection to ${formatSecondsToTime(MAX_RECORDING_DURATION)} or less.`, variant: "destructive" });
        return;
      }
      setMediaKey(Date.now().toString());
      handleSetCurrentSlide(SLIDE_INDEX_PREVIEW);
    } else if (currentSlide === SLIDE_INDEX_PREVIEW) {
      triggerSubmitProcess();
    }
  }, [ isParentSubmitting, isTrimming, isPreparingMedia, currentSlide, title, description, selectedYear, selectedMonth, selectedDay, selectedCategory, triggerSubmitProcess, currentMedia, handleSetCurrentSlide, isTrimmedDurationTooLong ]);

  const handleFormSubmit = (event: FormEvent) => { event.preventDefault(); handleActionButtonClick(); };

  let actionButtonText = 'Next'; let ActionButtonIcon: React.ElementType = ArrowRight;
  const isNextToPreviewEnabled = !!currentMedia;

  if (currentSlide === SLIDE_INDEX_MEDIA) { actionButtonText = 'Next to Preview'; ActionButtonIcon = Eye; }
  else if (currentSlide === SLIDE_INDEX_PREVIEW) { actionButtonText = isEditing ? 'Update Memory' : 'Save Memory'; ActionButtonIcon = Sparkles; }

  let mockMemoryForPreview: Memory | undefined = undefined;
  if (currentSlide === SLIDE_INDEX_PREVIEW) {
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    let mediaAttachmentsForPreview: MediaAttachment[] | undefined = undefined;
    if (currentMedia) { 
      mediaAttachmentsForPreview = [{
        id: (isEditing && memory?.mediaAttachments?.[0]?.id) ? memory.mediaAttachments[0].id : 'preview-media-1',
        type: currentMedia.type, url: currentMedia.url, filename: currentMedia.filename,
        startTime: trimValues[0],
        endTime: trimValues[1],
        duration: currentMedia.duration, size: currentMedia.size,
        isTrimmed: currentMedia.isTrimmed || (trimValues[0] > 0 || trimValues[1] < currentMedia.duration),
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
                <CardDescription>Record, upload, and define a playback segment of up to {formatSecondsToTime(MAX_RECORDING_DURATION)}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <MediaCaptureControl
                    key={mediaKey}
                    onMediaReady={handleMediaReady}
                    onMediaDiscard={handleMediaDiscard}
                    onPreparingChange={setIsPreparingMedia}
                    initialMedia={currentMedia ? { type: currentMedia.type, previewUrl: currentMedia.url, duration: currentMedia.duration, size: currentMedia.size } : undefined}
                    promptIdForTeleprompter={initialPromptId || memory?.promptId}
                    chapterTitleForTeleprompter={title}
                    trimValues={trimValues}
                  />
                  {currentMedia && (
                    <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center"><Scissors className="mr-2 h-4 w-4"/>Define Playback Segment</CardTitle>
                            <CardDescription className="text-xs">
                                Drag the handles to set the start and end points. The player will preview this selection.
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
                                    disabled={isTrimming}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                    <span>Start: {formatSecondsToTime(trimValues[0])}</span>
                                    <span>Duration: {formatSecondsToTime(trimmedDuration)}</span>
                                    <span><Timer className="inline h-3 w-3 mr-1" />{formatSecondsToTime(trimValues[1])}</span>
                                </div>
                                {isTrimmedDurationTooLong && (
                                  <Alert variant="destructive" className="mt-2 text-xs">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertTitle>Selection Too Long</AlertTitle>
                                      <AlertDescription>
                                          Your selected duration is {formatSecondsToTime(trimmedDuration)}, which exceeds the {formatSecondsToTime(MAX_RECORDING_DURATION)} limit.
                                      </AlertDescription>
                                  </Alert>
                                )}
                            </div>
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
        <Button type="button" onClick={() => { if (currentSlide === SLIDE_INDEX_DETAILS) router.back(); else if (currentSlide === SLIDE_INDEX_MEDIA) handleSetCurrentSlide(SLIDE_INDEX_DETAILS); else if (currentSlide === SLIDE_INDEX_PREVIEW) handleSetCurrentSlide(SLIDE_INDEX_MEDIA);}} disabled={!!isParentSubmitting || isTrimming || isPreparingMedia} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{currentSlide === SLIDE_INDEX_DETAILS ? 'Back' : 'Previous'}</Button>
        <Button type="button" onClick={handleActionButtonClick} disabled={!!isParentSubmitting || isTrimming || isPreparingMedia || (currentSlide === SLIDE_INDEX_MEDIA && !isNextToPreviewEnabled) || (currentSlide === SLIDE_INDEX_PREVIEW && !mockMemoryForPreview) || isTrimmedDurationTooLong}>{isParentSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : isTrimming ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><ActionButtonIcon className="mr-2 h-4 w-4" />{actionButtonText}</>}</Button>
      </div>
    </form>
  );
}
