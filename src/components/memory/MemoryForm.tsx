
"use client";

import { type FormEvent, useCallback, useMemo, useRef, useState, useEffect } from 'react';
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
import { Sparkles, Loader2, ArrowRight, Tag, MapPin, ArrowLeft, Eye, Layers, Scissors, Timer, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDaysInMonth, format, isValid, setDate, getMonth, getYear, parseISO, getDate } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { countryOptions, MAX_RECORDING_DURATION } from '@/lib/constants';
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
  formState: {
    title: string;
    description: string;
    memoryDate: Date;
    location: string;
    country: string;
    selectedCategory: MemoryCategory | undefined;
    selectedEmotionTags: EmotionTag[];
    isLegacy: boolean;
    currentMedia: Omit<MediaAttachment, 'id'> | null;
  };
  isEditing: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  initialPromptId?: string;
  initialCustomPromptText?: string;
  onMediaDiscard: () => void;
  onNewMediaReady: (file: File, mediaData: Omit<MediaAttachment, 'id' | 'url'>) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onMemoryDateChange: (date: Date) => void;
  onLocationChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSelectedCategoryChange: (value: MemoryCategory | undefined) => void;
  onSelectedEmotionTagsChange: (tags: EmotionTag[]) => void;
  onIsLegacyChange: (value: boolean) => void;
}

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

export function MemoryForm({
  formState,
  isEditing,
  onSubmit,
  isSubmitting,
  initialPromptId,
  initialCustomPromptText,
  onMediaDiscard,
  onNewMediaReady,
  onTitleChange,
  onDescriptionChange,
  onMemoryDateChange,
  onLocationChange,
  onCountryChange,
  onSelectedCategoryChange,
  onSelectedEmotionTagsChange
}: MemoryFormProps) {
  const { user } = useAuth();
  const router = useRouter();

  const { title, description, memoryDate, location, country, selectedCategory, selectedEmotionTags, currentMedia } = formState;

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(SLIDE_INDEX_DETAILS);
  const [isPreparingMedia, setIsPreparingMedia] = useState(false);
  
  // Local state for trim values, derived from currentMedia
  const [trimValues, setTrimValues] = useState<[number, number]>([currentMedia?.startTime ?? 0, currentMedia?.endTime ?? currentMedia?.duration ?? 0]);

  useEffect(() => {
    console.log("[MemoryForm] formState.currentMedia changed:", currentMedia);
    setTrimValues([currentMedia?.startTime ?? 0, currentMedia?.endTime ?? currentMedia?.duration ?? 0]);
  }, [currentMedia]);

  const selectedYear = getYear(memoryDate);
  const selectedMonth = getMonth(memoryDate);
  const selectedDay = getDate(memoryDate);

  const daysInSelectedMonth = useMemo(() => getDaysInMonth(new Date(selectedYear, selectedMonth)), [selectedYear, selectedMonth]);
  const dayOptions = useMemo(() => Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1), [daysInSelectedMonth]);
  
  useEffect(() => { if (carouselApi) carouselApi.scrollTo(currentSlide, true); }, [currentSlide, carouselApi]);

  const handleDateChange = (part: 'day' | 'month' | 'year', value: number) => {
    let newDate = new Date(memoryDate);
    if (part === 'day') newDate.setDate(value);
    if (part === 'month') newDate.setMonth(value);
    if (part === 'year') newDate.setFullYear(value);
    
    // Validate and correct day if month/year change makes it invalid
    const newDaysInMonth = getDaysInMonth(newDate);
    if (newDate.getDate() > newDaysInMonth) {
        newDate.setDate(newDaysInMonth);
    }
    
    onMemoryDateChange(newDate);
  };

  const handleEmotionTagToggle = (tag: EmotionTag) => {
    const newTags = selectedEmotionTags.includes(tag) ? selectedEmotionTags.filter(t => t !== tag) : [...selectedEmotionTags, tag];
    onSelectedEmotionTagsChange(newTags);
  };

  const triggerSubmitProcess = useCallback(() => {
    console.log('[MemoryForm] Triggering parent submit process.');
    onSubmit();
  }, [onSubmit]);

  const trimmedDuration = useMemo(() => trimValues[1] - trimValues[0], [trimValues]);
  const isTrimmedDurationTooLong = useMemo(() => trimmedDuration > MAX_RECORDING_DURATION, [trimmedDuration]);

  const handleActionButtonClick = useCallback(() => {
    if (isSubmitting || isPreparingMedia) return;

    if (currentSlide === SLIDE_INDEX_DETAILS) {
      if (!title.trim()) { toast({ title: "Title Required", variant: "destructive" }); return; }
      setCurrentSlide(SLIDE_INDEX_MEDIA);
    } else if (currentSlide === SLIDE_INDEX_MEDIA) {
      if (!currentMedia) { toast({ title: "Media is Required", description: "Please record or upload a video or audio to proceed.", variant: "default" }); return; }
      if (isTrimmedDurationTooLong) { toast({ title: "Media Too Long", description: `Please shorten your playback selection to ${formatSecondsToTime(MAX_RECORDING_DURATION)} or less.`, variant: "destructive" }); return; }
      
      // Update the parent's media state with the final trim values before previewing
      if (currentMedia) {
        onNewMediaReady(
            (currentMedia as any).file, // A bit of a hack, assumes file is there for new media
            {...currentMedia, startTime: trimValues[0], endTime: trimValues[1]}
        );
      }
      
      setCurrentSlide(SLIDE_INDEX_PREVIEW);
    } else if (currentSlide === SLIDE_INDEX_PREVIEW) {
      triggerSubmitProcess();
    }
  }, [isSubmitting, isPreparingMedia, currentSlide, title, currentMedia, triggerSubmitProcess, isTrimmedDurationTooLong, trimValues, onNewMediaReady]);

  const handleFormSubmit = (event: FormEvent) => { event.preventDefault(); handleActionButtonClick(); };

  let actionButtonText = 'Next'; let ActionButtonIcon: React.ElementType = ArrowRight;
  if (currentSlide === SLIDE_INDEX_MEDIA) { actionButtonText = 'Next to Preview'; ActionButtonIcon = Eye; }
  else if (currentSlide === SLIDE_INDEX_PREVIEW) { actionButtonText = isEditing ? 'Update Memory' : 'Save Memory'; ActionButtonIcon = Sparkles; }
  
  const handleBack = () => {
    console.log(`[MemoryForm] Back/Previous button clicked on slide ${currentSlide}.`);
    if (currentSlide === SLIDE_INDEX_DETAILS) router.back(); 
    else setCurrentSlide(s => s - 1);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: false, draggable: false }} className="w-full max-w-3xl mx-auto py-4">
        <CarouselContent>
          <CarouselItem>
            <Card className="w-full">
              <CardHeader><CardTitle className="font-headline text-2xl">{isEditing ? 'Edit Chapter' : 'New Chapter'} (Step 1 of 3)</CardTitle><CardDescription>Capture the details of your moment. Fields marked with * are mandatory.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1"><Label htmlFor="title">Title *</Label><Input id="title" value={title} onChange={(e) => onTitleChange(e.target.value)} required placeholder="e.g., Summer Vacation in Italy" /></div>
                <div className="space-y-1"><Label htmlFor="year-select">Date *</Label><div className="grid grid-cols-3 gap-2"><div><Select value={selectedYear.toString()} onValueChange={(v) => handleDateChange('year', parseInt(v))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select></div><div><Select value={selectedMonth.toString()} onValueChange={(v) => handleDateChange('month', parseInt(v))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent></Select></div><div><Select value={selectedDay.toString()} onValueChange={(v) => handleDateChange('day', parseInt(v))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{dayOptions.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent></Select></div></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1"><Label htmlFor="location"><MapPin className="inline-block mr-1 h-4 w-4"/>Location (Optional)</Label><Input id="location" value={location} onChange={(e) => onLocationChange(e.target.value)} placeholder="e.g., Eiffel Tower, Paris"/></div><div className="space-y-1"><Label htmlFor="country-select">Country (Optional)</Label><Select value={country} onValueChange={onCountryChange}><SelectTrigger><SelectValue placeholder="Select Country"/></SelectTrigger><SelectContent>{countryOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select></div></div>
                <div className="space-y-1"><Label htmlFor="category-select">Category *</Label><Select value={selectedCategory} onValueChange={(v) => onSelectedCategoryChange(v as MemoryCategory)}><SelectTrigger><Layers className="inline-block mr-2 h-4 w-4 text-muted-foreground"/><SelectValue placeholder="Select category"/></SelectTrigger><SelectContent>{memoryCategoriesList.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-1"><Label htmlFor="description">Description *</Label><Textarea id="description" value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="Describe your memory..." rows={4} required/></div>
                <div className="space-y-1"><Label><Tag className="inline-block mr-1 h-4 w-4"/>Emotion Tags</Label><div className="flex flex-wrap gap-2 pt-1">{emotionTagsList.map(t => (<Button type="button" key={t} variant={selectedEmotionTags.includes(t) ? 'default' : 'outline'} size="sm" onClick={() => handleEmotionTagToggle(t)}>{t}</Button>))}</div></div>
              </CardContent>
            </Card>
          </CarouselItem>
          <CarouselItem>
            <Card className="w-full">
              <CardHeader><CardTitle className="font-headline text-lg">Media Attachment * (Step 2 of 3)</CardTitle><CardDescription>Record or upload media, then define a playback segment up to {formatSecondsToTime(MAX_RECORDING_DURATION)}.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                  <MediaCaptureControl 
                    onMediaReady={onNewMediaReady} 
                    onMediaDiscard={onMediaDiscard} 
                    onPreparingChange={setIsPreparingMedia} 
                    initialMedia={currentMedia ? { type: currentMedia.type, previewUrl: currentMedia.url, duration: currentMedia.duration, size: currentMedia.size } : undefined} 
                    promptIdForTeleprompter={initialPromptId} 
                    chapterTitleForTeleprompter={title} 
                  />
                  {currentMedia && (<Card className="bg-muted/50"><CardHeader className="pb-2"><CardTitle className="text-base font-medium flex items-center"><Scissors className="mr-2 h-4 w-4"/>Define Playback Segment</CardTitle><CardDescription className="text-xs">Drag the handles to set the start and end points. The player will preview this selection.</CardDescription></CardHeader><CardContent><div className="space-y-2"><Slider min={0} max={currentMedia.duration} step={0.1} value={trimValues} onValueChange={(v) => setTrimValues(v as [number, number])} minStepsBetweenThumbs={1}/><div className="flex justify-between text-xs text-muted-foreground font-mono"><span>Start: {formatSecondsToTime(trimValues[0])}</span><span>Duration: {formatSecondsToTime(trimmedDuration)}</span><span><Timer className="inline h-3 w-3 mr-1"/>{formatSecondsToTime(trimValues[1])}</span></div>{isTrimmedDurationTooLong && (<Alert variant="destructive" className="mt-2 text-xs"><AlertCircle className="h-4 w-4"/><AlertTitle>Selection Too Long</AlertTitle><AlertDescription>Your selected duration is {formatSecondsToTime(trimmedDuration)}, which exceeds the {formatSecondsToTime(MAX_RECORDING_DURATION)} limit.</AlertDescription></Alert>)}</div></CardContent></Card>)}
              </CardContent>
            </Card>
          </CarouselItem>
          <CarouselItem>
            <Card className="w-full">
              <CardHeader><CardTitle className="font-headline text-2xl">{isEditing ? 'Preview Changes' : 'New Chapter'} (Step 3 of 3)</CardTitle><CardDescription>Review your chapter. Go back to make changes or click '{actionButtonText}' to save.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="border p-1 sm:p-2 rounded-lg bg-background shadow-sm">
                    <MemoryCard 
                        memory={{
                            id: 'preview-id',
                            title: title,
                            date: memoryDate.toISOString(),
                            description: description,
                            userId: user?.id || 'preview-user',
                            mediaAttachments: currentMedia ? [{...currentMedia, id:'preview-media-id', startTime: trimValues[0], endTime: trimValues[1]}] : [],
                            emotionTags,
                            category: selectedCategory,
                            location,
                            country
                        }} 
                        userMode="guest"
                    />
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
      <div className="max-w-3xl mx-auto flex justify-between items-center pt-4 px-1 sm:px-0">
        <Button type="button" onClick={handleBack} disabled={isSubmitting || isPreparingMedia} variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/>{currentSlide === SLIDE_INDEX_DETAILS ? 'Back' : 'Previous'}</Button>
        <Button type="button" onClick={handleActionButtonClick} disabled={isSubmitting || isPreparingMedia || (currentSlide === SLIDE_INDEX_MEDIA && !currentMedia) || isTrimmedDurationTooLong}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : <><ActionButtonIcon className="mr-2 h-4 w-4"/>{actionButtonText}</>}</Button>
      </div>
    </form>
  );
}
