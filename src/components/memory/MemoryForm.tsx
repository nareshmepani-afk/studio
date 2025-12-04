
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
import { Sparkles, Loader2, Paperclip, ArrowRight, Tag, MapPin, ArrowLeft, Eye, Layers, Scissors, Timer } from 'lucide-react';
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
  const { user } = useAuth();
  const router = useRouter();
  const isEditing = !!memory;

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(memoryCategoriesList[0]);

  const [selectedYear, setSelectedYear] = useState<number>(globalCurrentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<number>(getDate(new Date()));

  const [description, setDescription] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>([]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(SLIDE_INDEX_DETAILS);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null); 
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  const [mediaDuration, setMediaDuration] = useState(0);

  const [trimValues, setTrimValues] = useState<[number, number]>([0, 0]);

  const [isPreparingMedia, setIsPreparingMedia] = useState(false);

  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setLocation(memory.location || '');
      setSelectedCategory(memory.category || memoryCategoriesList[0]);
      setCountry(memory.country || 'United Kingdom');
      setDescription(memory.description || '');
      setSelectedEmotionTags(memory.emotionTags || []);
      
      const memoryDate = memory.date ? parseISO(memory.date) : new Date();
      if (isValid(memoryDate)) {
        setSelectedYear(getYear(memoryDate));
        setSelectedMonth(getMonth(memoryDate));
        setSelectedDay(getDate(memoryDate));
      }

      const initialMedia = memory.mediaAttachments?.[0];
      if (initialMedia?.url) {
        setMediaPreviewUrl(initialMedia.url);
        setMediaType(initialMedia.type);
        const duration = initialMedia.duration || 0;
        setMediaDuration(duration);
        const startTime = initialMedia.startTime || 0;
        const endTime = initialMedia.endTime || duration;
        setTrimValues([startTime, endTime]);
      }
    } else {
      let determinedInitialTitle = '';
      if (initialCustomPromptText) {
        determinedInitialTitle = initialCustomPromptText;
      } else if (initialPromptId) {
        const foundPrompt = mockPromptGroups.flatMap(g => g.prompts).find(p => p.id === initialPromptId);
        determinedInitialTitle = foundPrompt ? foundPrompt.text.en : '';
      }
      setTitle(determinedInitialTitle);
    }
  }, [memory, initialPromptId, initialCustomPromptText]);

  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(new Date(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const dayOptions = useMemo(() => {
    return Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  }, [daysInSelectedMonth]);

 useEffect(() => {
    if (!carouselApi) return;
    carouselApi.scrollTo(currentSlide, true);
    carouselApi.on("select", () => setCurrentSlide(carouselApi.selectedScrollSnap()));
  }, [carouselApi, currentSlide]);

  useEffect(() => { if (selectedDay > daysInSelectedMonth) setSelectedDay(daysInSelectedMonth); }, [selectedDay, daysInSelectedMonth]);

  useEffect(() => {
    const urlToRevoke = mediaPreviewUrl;
    return () => {
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [mediaPreviewUrl]);

  const handleMediaReady = useCallback((mediaData: { file: File; type: 'video' | 'audio'; duration: number; }) => {
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(mediaData.file);
    setMediaFile(mediaData.file);
    setMediaPreviewUrl(newPreviewUrl);
    setMediaType(mediaData.type);
    setMediaDuration(mediaData.duration);
    setTrimValues([0, mediaData.duration]);
    setCurrentSlide(SLIDE_INDEX_PREVIEW);
  }, [mediaPreviewUrl]);

  const triggerSubmitProcess = useCallback(() => {
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    let mediaAttachments: MediaAttachment[] | undefined = undefined;

    if (mediaType && mediaPreviewUrl) {
        mediaAttachments = [{
            id: memory?.mediaAttachments?.[0]?.id || 'new-media-1',
            type: mediaType,
            url: mediaPreviewUrl,
            startTime: trimValues[0],
            endTime: trimValues[1],
            duration: mediaDuration,
            size: mediaFile?.size,
        }];
    }
    
    const submissionData = { 
        title, 
        date: finalDate.toISOString(), 
        description, 
        emotionTags: selectedEmotionTags, 
        mediaAttachments,
        location, 
        country, 
        category: selectedCategory, 
        promptId: initialPromptId || memory?.promptId, 
        isLegacy: memory?.isLegacy || false 
    };

    onSubmit(submissionData as Omit<Memory, 'id' | 'userId'>, mediaFile || undefined);
  }, [
    title, selectedYear, selectedMonth, selectedDay, description, selectedEmotionTags, 
    mediaType, mediaPreviewUrl, trimValues, mediaDuration, mediaFile, 
    location, country, selectedCategory, initialPromptId, memory, onSubmit
  ]);

  const handleFormSubmit = (event: FormEvent) => { 
    event.preventDefault();
    if (currentSlide === SLIDE_INDEX_PREVIEW) {
        triggerSubmitProcess();
    }
  };

  const currentPromptIdForTeleprompter = initialPromptId || memory?.promptId;
  const initialMediaForRecorder = useMemo(() => (
    (memory?.mediaAttachments?.[0] && !mediaFile) ? {
      type: memory.mediaAttachments[0].type,
      previewUrl: memory.mediaAttachments[0].url,
      duration: memory.mediaAttachments[0].duration || 0,
      size: memory.mediaAttachments[0].size || 0,
    } : undefined
  ), [memory, mediaFile]);

  let mockMemoryForPreview: Memory | undefined = undefined;
  if (currentSlide === SLIDE_INDEX_PREVIEW) {
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    let mediaAttachmentsForPreview: MediaAttachment[] | undefined = undefined;
    if (mediaType && mediaPreviewUrl) {
      mediaAttachmentsForPreview = [{
        id: memory?.mediaAttachments?.[0]?.id || 'preview-media-1',
        type: mediaType, 
        url: mediaPreviewUrl, 
        filename: mediaFile?.name,
        startTime: trimValues[0],
        endTime: trimValues[1],
        duration: mediaDuration, 
        size: mediaFile?.size,
      }];
    }

    mockMemoryForPreview = {
      id: memory?.id || 'preview-id', 
      title: title.trim() || "Untitled Chapter", 
      date: isValid(finalDate) ? finalDate.toISOString() : new Date().toISOString(),
      description: description.trim() || "No description provided.", 
      emotionTags: selectedEmotionTags, 
      mediaAttachments: mediaAttachmentsForPreview,
      location: location.trim() || undefined, 
      country: country.trim() || undefined, 
      category: selectedCategory,
      userId: user?.id || 'preview-user-id',
      promptId: initialPromptId || memory?.promptId, 
      isLegacy: memory?.isLegacy || false,
    };
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: false, draggable: false }} className="w-full max-w-3xl mx-auto py-4">
        <CarouselContent>
          <CarouselItem>
            <Card className="w-full">
              <CardHeader><CardTitle className="font-headline text-2xl">{isEditing ? 'Edit Chapter' : 'New Chapter'} (Step {SLIDE_INDEX_DETAILS + 1} of {TOTAL_SLIDES})</CardTitle><CardDescription>Capture the details of your moment. Fields marked with * are mandatory.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Summer Vacation in Italy" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="year-select">Date *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                      <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                      <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
                      <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                      <SelectContent>{dayOptions.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="location"><MapPin className="inline-block mr-1 h-4 w-4" />Location (Optional)</Label>
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Eiffel Tower, Paris" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="country-select">Country (Optional)</Label>
                        <Select value={country} onValueChange={setCountry}>
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
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your memory..." rows={4} required/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emotion-tags"><Tag className="inline-block mr-1 h-4 w-4" />Emotion Tags (Optional)</Label>
                  <div id="emotion-tags" className="flex flex-wrap gap-2 pt-1">{emotionTagsList.map((tag) => (<Button type="button" key={tag} variant={selectedEmotionTags.includes(tag) ? 'default' : 'outline'} size="sm" onClick={() => setSelectedEmotionTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])} className="text-xs h-auto py-1 px-2">{tag}</Button>))}</div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
          <CarouselItem>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="font-headline text-lg">Media Attachment for {title ? `"${title}"` : 'this chapter'} * (Step {SLIDE_INDEX_MEDIA + 1} of {TOTAL_SLIDES})</CardTitle>
                <CardDescription>Record or upload a video/audio for your memory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <MediaCaptureControl
                    onMediaReady={handleMediaReady}
                    onPreparingChange={setIsPreparingMedia}
                    initialMedia={initialMediaForRecorder}
                    promptIdForTeleprompter={currentPromptIdForTeleprompter}
                    chapterTitleForTeleprompter={title}
                    trimValues={trimValues}
                  />
                  {(mediaPreviewUrl) && (
                    <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center"><Scissors className="mr-2 h-4 w-4"/>Trim Media</CardTitle>
                            <CardDescription className="text-xs">
                                Drag the handles to select the part of the media you want to save. The player will preview this selection.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Slider
                                    min={0}
                                    max={mediaDuration}
                                    step={0.1}
                                    value={trimValues}
                                    onValueChange={(vals) => setTrimValues(vals as [number, number])}
                                    minStepsBetweenThumbs={1}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                    <span>Start: {formatSecondsToTime(trimValues[0])}</span>
                                    <span>Duration: {formatSecondsToTime(trimValues[1] - trimValues[0])}</span>
                                    <span><Timer className="inline h-3 w-3 mr-1" />{formatSecondsToTime(trimValues[1])}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                  )}
              </CardContent>
            </Card>
          </CarouselItem>
          <CarouselItem>
            <Card className="w-full">
              <CardHeader><CardTitle className="font-headline text-2xl">{isEditing ? 'Preview Changes' : 'Preview Chapter'} (Step {SLIDE_INDEX_PREVIEW + 1} of {TOTAL_SLIDES})</CardTitle><CardDescription>Review your chapter details and media. Go back to make changes or click '{isEditing ? 'Update Memory' : 'Save Memory'}' to save.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {mockMemoryForPreview ? (<div className="border p-1 sm:p-2 rounded-lg bg-background shadow-sm"><MemoryCard memory={mockMemoryForPreview} userMode="guest" /></div>)
                : (<p className="text-muted-foreground text-center py-8">Preparing preview...</p>)}
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className="max-w-3xl mx-auto flex justify-between items-center pt-4 px-1 sm:px-0">
        <Button type="button" onClick={() => setCurrentSlide(p => p > 0 ? p - 1 : 0)} disabled={isParentSubmitting || isPreparingMedia || currentSlide === 0} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Previous</Button>
        {currentSlide < SLIDE_INDEX_PREVIEW && <Button type="button" onClick={() => setCurrentSlide(p => p < TOTAL_SLIDES - 1 ? p + 1 : p)} disabled={isParentSubmitting || isPreparingMedia || (currentSlide === SLIDE_INDEX_MEDIA && !mediaPreviewUrl)}><Eye className="mr-2 h-4 w-4" />Next to Preview</Button>}
        {currentSlide === SLIDE_INDEX_PREVIEW && <Button type="submit" disabled={isParentSubmitting || isPreparingMedia || !mockMemoryForPreview}>{(isParentSubmitting || isPreparingMedia) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Sparkles className="mr-2 h-4 w-4" />{isEditing ? 'Update Memory' : 'Save Memory'}</Button>}
      </div>
    </form>
  );
}
