
"use client";

import { useState, type FormEvent, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Memory, User, MediaAttachment, Prompt, EmotionTag } from '@/types';
import { emotionTagsList } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaCaptureControl } from './MediaRecorder';
import { generateMemoryCuesAction } from '@/actions/generateMemoryCuesAction';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Lightbulb, Loader2, Paperclip, Trash2, Languages, RefreshCw, ArrowRight, Tag, MapPin } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { mockPrompts } from '@/lib/mockData';
import { getDaysInMonth, format, isValid, setDate, getMonth, getYear, getDate } from 'date-fns';
import { enGB } from 'date-fns/locale';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";


interface MemoryFormProps {
  memory?: Memory;
  onSubmit: (memoryData: Omit<Memory, 'id' | 'userId'>, userProfileForCues?: string, mediaFileToUpload?: File) => void;
  isSubmitting?: boolean;
}

type CurrentMediaData = {
  file: File;
  type: 'video' | 'audio';
  previewUrl: string;
  startTime?: number;
  endTime?: number;
  duration: number;
};

const globalCurrentYear = new Date().getFullYear();
const years: number[] = Array.from({ length: 101 }, (_, i) => globalCurrentYear - i);
const months: { value: number; label: string }[] = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(new Date(2000, i, 1), 'MMMM', { locale: enGB }),
}));

const SLIDE_INDEX_DETAILS = 0;
const SLIDE_INDEX_MEDIA = 1;
const SLIDE_INDEX_CUES = 2;

const countryOptions = [
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "France", label: "France" },
  { value: "Germany", label: "Germany" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
  { value: "India", label: "India" },
  { value: "Japan", label: "Japan" },
  { value: "Other", label: "Other" }, // Option for unlisted countries
];


export function MemoryForm({ memory, onSubmit, isSubmitting }: MemoryFormProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isEditing = !!memory;

  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleLabelRef = useRef<HTMLLabelElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const yearSelectRef = useRef<HTMLButtonElement>(null); // SelectTrigger is a button
  const memoryDetailsCardHeaderRef = useRef<HTMLDivElement>(null);
  const mediaCardHeaderRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(memory?.title || '');
  const [location, setLocation] = useState(memory?.location || '');
  const [country, setCountry] = useState(memory?.country || '');


  const getInitialDateComponent = useCallback((component: 'year' | 'month' | 'day', dateSource?: string) => {
    const dateToParse = dateSource ? new Date(dateSource) : new Date();
    if (isValid(dateToParse)) {
      if (component === 'year') return getYear(dateToParse);
      if (component === 'month') return getMonth(dateToParse); // 0-indexed
      if (component === 'day') return getDate(dateToParse);
    }
    const today = new Date();
    if (component === 'year') return getYear(today);
    if (component === 'month') return getMonth(today);
    return getDate(today);
  }, []);

  const [selectedYear, setSelectedYear] = useState<number>(() => getInitialDateComponent('year', memory?.date));
  const [selectedMonth, setSelectedMonth] = useState<number>(() => getInitialDateComponent('month', memory?.date));
  const [selectedDay, setSelectedDay] = useState<number>(() => getInitialDateComponent('day', memory?.date));

  const [description, setDescription] = useState(memory?.description || '');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>(memory?.emotionTags || []);
  const [userProfile, setUserProfile] = useState(user?.profileInfo || '');
  const [aiCues, setAiCues] = useState<string[]>([]);
  const [isLoadingCues, setIsLoadingCues] = useState(false);
  const [cueLanguage, setCueLanguage] = useState<'en' | 'gu'>('en');
  const [inspirationPrompts, setInspirationPrompts] = useState<Prompt[]>([]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const [currentMedia, setCurrentMedia] = useState<CurrentMediaData | null>(() => {
    if (memory?.mediaAttachments && memory.mediaAttachments.length > 0) {
      const firstMedia = memory.mediaAttachments[0];
      const filename = firstMedia.filename || "existing_media";
      const duration = (typeof firstMedia.duration === 'number' && !isNaN(firstMedia.duration)) ? firstMedia.duration : 0;
      return {
        file: new File([], filename, {type: firstMedia.type === 'video' ? 'video/webm' : 'audio/webm'}),
        type: firstMedia.type,
        previewUrl: firstMedia.url,
        startTime: firstMedia.startTime,
        endTime: firstMedia.endTime,
        duration: duration,
      };
    }
    return null;
  });
  
  const [mediaToInitializeRecorder, setMediaToInitializeRecorder] = useState<CurrentMediaData | null>(null);


  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(new Date(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const dayOptions = useMemo(() => {
    return Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  }, [daysInSelectedMonth]);

  useEffect(() => {
    if (selectedDay > daysInSelectedMonth) {
      setSelectedDay(daysInSelectedMonth);
    }
  }, [selectedDay, daysInSelectedMonth, selectedMonth, selectedYear]);


  const loadInspirationPrompts = useCallback(() => {
    const shuffled = [...mockPrompts].sort(() => 0.5 - Math.random());
    setInspirationPrompts(shuffled.slice(0, 3));
  }, []);

  useEffect(() => {
    loadInspirationPrompts();
  }, [cueLanguage, loadInspirationPrompts]);


  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl && !memory) { // Only apply if new memory and prompt exists
      setTitle(decodeURIComponent(promptFromUrl));
    }
  }, [searchParams, memory]);


  useEffect(() => {
    if (user?.profileInfo && !memory) { // Only for new memories
      setUserProfile(user.profileInfo);
    }
  }, [user, memory]);

  const handleMediaReady = useCallback((mediaData: CurrentMediaData) => {
    setCurrentMedia(mediaData);
    setMediaToInitializeRecorder(null); // Clear after media is configured
  }, []);

  const handleMediaDiscardInForm = useCallback(() => {
    // This function is for when the user clicks "Change Media or Re-trim"
    // It should take the currentMedia's details and prepare them for MediaCaptureControl
    if (currentMedia) {
      setMediaToInitializeRecorder(currentMedia);
    }
    setCurrentMedia(null); // This will hide the summary and show MediaCaptureControl
  }, [currentMedia]);
  
  const handleMediaDiscardInRecorder = useCallback(() => {
    // This is for the discard action *within* MediaCaptureControl (e.g., if it has initialMedia and user wants to start fresh)
    // It should not affect currentMedia in MemoryForm directly, MediaCaptureControl handles its own discard
    // We might want to clear mediaToInitializeRecorder if they discard *from* the recorder.
    setMediaToInitializeRecorder(null); 
  }, []);


  const handleGenerateCues = async () => {
    if (!userProfile.trim()) {
      toast({ title: "Profile Info Needed", description: "Please provide some information about yourself in the 'Your Profile for Cues' field.", variant: "destructive" });
      return;
    }
    setIsLoadingCues(true);
    try {
      const result = await generateMemoryCuesAction({
        userProfile: userProfile,
        currentDate: new Date().toISOString().split('T')[0], 
        language: cueLanguage,
      });
      setAiCues(result.memoryCues);
      if (result.memoryCues.length === 0) {
        toast({ title: "No Cues Generated", description: "Try refining your profile information." });
      } else {
        toast({ title: "Memory Cues Generated!", description: "Check the suggestions below." });
      }
    } catch (error) {
      console.error("Failed to generate cues", error);
      toast({ title: "Error Generating Cues", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
    setIsLoadingCues(false);
  };

  const handleCueClick = (cue: string) => {
    if (!title) setTitle(cue);
    else setDescription(prev => `${prev}${prev ? '\n' : ''}Inspired by: ${cue}`);
    toast({ title: "Cue Applied!", description: `"${cue}" added to your memory.` });
  };

  const handleInspirationPromptClick = (promptText: string) => {
    setTitle(promptText);
    toast({ title: "Title Updated", description: `Title set to: "${promptText}"` });
  };

  const handleEmotionTagToggle = (tag: EmotionTag) => {
    setSelectedEmotionTags(prevTags =>
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter a title for the memory.", variant: "destructive" });
      carouselApi?.scrollTo(SLIDE_INDEX_DETAILS, true);
      setTimeout(() => {
        titleLabelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        titleInputRef.current?.focus();
      }, 100);
      return;
    }
    
    let finalDate = new Date(selectedYear, selectedMonth, 1); 
    finalDate = setDate(finalDate, selectedDay);

    if (!isValid(finalDate) || getYear(finalDate) !== selectedYear || getMonth(finalDate) !== selectedMonth || getDate(finalDate) !== selectedDay) {
      toast({ title: "Invalid Date", description: "Please select a valid date.", variant: "destructive" });
      carouselApi?.scrollTo(SLIDE_INDEX_DETAILS, true);
      setTimeout(() => {
        memoryDetailsCardHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        yearSelectRef.current?.focus();
      }, 100);
      return;
    }

    if (!description.trim()) {
      toast({ title: "Description Required", description: "Please enter a description for the memory.", variant: "destructive" });
      carouselApi?.scrollTo(SLIDE_INDEX_DETAILS, true);
      setTimeout(() => {
        memoryDetailsCardHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        descriptionTextareaRef.current?.focus();
      }, 100);
      return;
    }
    if (!currentMedia) {
      toast({ title: "Media Required", description: "A media attachment (video or audio) is required.", variant: "destructive" });
      carouselApi?.scrollTo(SLIDE_INDEX_MEDIA, true);
      setTimeout(() => {
        mediaCardHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    let mediaAttachmentsForSubmission: MediaAttachment[] | undefined = undefined;
    if (currentMedia) {
      const isNewFile = currentMedia.file.name !== "existing_media" && currentMedia.file.size > 0;
      const originalMediaAttachment = memory?.mediaAttachments?.[0];
      const duration = (typeof currentMedia.duration === 'number' && !isNaN(currentMedia.duration)) ? currentMedia.duration : 0;

      mediaAttachmentsForSubmission = [{
        id: originalMediaAttachment?.id || Date.now().toString(),
        type: currentMedia.type,
        url: isNewFile ? "placeholder_url_to_be_replaced_after_upload" : (originalMediaAttachment?.url || currentMedia.previewUrl),
        filename: currentMedia.file.name,
        startTime: currentMedia.startTime,
        endTime: currentMedia.endTime,
        duration: duration,
      }];
    }

    onSubmit(
      { 
        title, 
        date: finalDate.toISOString(), 
        description, 
        emotionTags: selectedEmotionTags, 
        mediaAttachments: mediaAttachmentsForSubmission,
        location: location || undefined,
        country: country || undefined,
      },
      userProfile,
      currentMedia && currentMedia.file.name !== "existing_media" && currentMedia.file.size > 0 ? currentMedia.file : undefined
    );
  };
  
  const initialMediaForRecorderProp = useMemo(() => {
    // This is for editing an existing, saved memory
    if (isEditing && memory?.mediaAttachments && memory.mediaAttachments.length > 0) {
        const firstMedia = memory.mediaAttachments[0];
        const duration = (typeof firstMedia.duration === 'number' && !isNaN(firstMedia.duration)) ? firstMedia.duration : 0;
        return {
            type: firstMedia.type,
            previewUrl: firstMedia.url,
            startTime: firstMedia.startTime,
            endTime: firstMedia.endTime,
            duration: duration,
        };
    }
    return undefined;
  }, [memory?.mediaAttachments, isEditing]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Carousel 
        setApi={setCarouselApi} 
        opts={{ align: "start", loop: false }} 
        className="w-full max-w-3xl mx-auto py-4" 
      >
        <CarouselContent>
          <CarouselItem>
            <Card className="w-full">
              <CardHeader ref={memoryDetailsCardHeaderRef}>
                <CardTitle className="font-headline text-2xl">{memory ? 'Edit Memory' : 'Add New Memory'} (Step 1 of 3)</CardTitle>
                <CardDescription>Capture the details of your moment. Fields marked with * are mandatory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="title" ref={titleLabelRef}>Title *</Label>
                  <Input ref={titleInputRef} id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Summer Vacation in Italy" />
                  {inspirationPrompts.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="inspiration-prompts" className="text-xs text-muted-foreground">Need inspiration for your title?</Label>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={loadInspirationPrompts} className="text-xs h-7">
                            <RefreshCw className="mr-1 h-3 w-3" />
                            New Suggestions
                          </Button>
                          <Button type="button" variant="link" size="sm" onClick={() => router.push('/prompts')} className="text-xs h-7 px-2">
                            More Prompts <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div id="inspiration-prompts" className="flex flex-wrap gap-1">
                        {inspirationPrompts.map((prompt) => {
                          const promptText = prompt.text[cueLanguage] || prompt.text.en;
                          return (
                            <Button
                              type="button"
                              key={prompt.id}
                              variant="outline"
                              size="sm"
                              className="text-xs h-auto py-1 px-2"
                              onClick={() => handleInspirationPromptClick(promptText)}
                            >
                              {promptText}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Date *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="year-select" className="sr-only">Year</Label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger id="year-select" ref={yearSelectRef}>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="month-select" className="sr-only">Month</Label>
                      <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                        <SelectTrigger id="month-select">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="day-select" className="sr-only">Day</Label>
                      <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                        <SelectTrigger id="day-select">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOptions.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="location">Location (Optional)</Label>
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Eiffel Tower, Paris" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="country-select">Country (Optional)</Label>
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger id="country-select">
                                <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                                {countryOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea ref={descriptionTextareaRef} id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your memory..." rows={4} required/>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="emotion-tags">Emotion Tags (Optional)</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {emotionTagsList.map((tag) => (
                      <Button
                        type="button"
                        key={tag}
                        variant={selectedEmotionTags.includes(tag) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleEmotionTagToggle(tag)}
                        className="text-xs h-auto py-1 px-2"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
          
          <CarouselItem>
            <Card className="w-full">
              <CardHeader ref={mediaCardHeaderRef}>
                  <CardTitle className="font-headline text-lg">
                    Media Attachment for {title ? `"${title}"` : 'this memory'} * (Step 2 of 3)
                  </CardTitle>
                  {!currentMedia && <CardDescription>Record or upload a video/audio for your memory.</CardDescription>}
              </CardHeader>
              <CardContent>
                  {currentMedia ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                          <p className="text-sm font-medium flex items-center"><Paperclip className="mr-2 h-5 w-5 inline-block" />Attached Media</p>
                          <Button variant="ghost" size="icon" onClick={handleMediaDiscardInForm} aria-label="Remove media">
                              <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">Type: {currentMedia.type}</p>
                      <p className="text-sm text-muted-foreground">Filename: {currentMedia.file.name}</p>
                      {currentMedia.type === 'video' && currentMedia.previewUrl && (
                      <video src={currentMedia.previewUrl} controls className="w-full aspect-video rounded-md mt-2 bg-muted" key={currentMedia.previewUrl}/>
                      )}
                      {currentMedia.type === 'audio' && currentMedia.previewUrl && (
                      <audio src={currentMedia.previewUrl} controls className="w-full mt-2" key={currentMedia.previewUrl}/>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">Duration: {typeof currentMedia.duration === 'number' ? currentMedia.duration.toFixed(2) : 'N/A'}s</p>
                      {currentMedia.startTime !== undefined && <p className="text-sm text-muted-foreground">Trim Start: {currentMedia.startTime.toFixed(2)}s</p>}
                      {currentMedia.endTime !== undefined && currentMedia.duration !== currentMedia.endTime && <p className="text-sm text-muted-foreground">Trim End: {currentMedia.endTime.toFixed(2)}s</p>}
                      <Button variant="outline" type="button" onClick={handleMediaDiscardInForm} className="w-full mt-2">
                          Change Media or Re-trim
                      </Button>
                    </div>
                  ) : (
                    <MediaCaptureControl
                        onMediaReady={handleMediaReady}
                        onDiscard={handleMediaDiscardInRecorder}
                        initialMedia={mediaToInitializeRecorder || initialMediaForRecorderProp}
                    />
                  )}
              </CardContent>
            </Card>
          </CarouselItem>

          <CarouselItem>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" />AI-Powered Memory Cues (Step 3 of 3)</CardTitle>
                <CardDescription>Get suggestions for memories based on your profile and current context.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="user-profile">Your Profile for Cues (Interests, past events, etc.)</Label>
                  <Textarea id="user-profile" value={userProfile} onChange={(e) => setUserProfile(e.target.value)} placeholder="e.g., Loves hiking, visited Paris in 2022, recently started learning guitar." rows={3} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-grow space-y-1">
                      <Label htmlFor="cue-language">Language for Cues</Label>
                      <Select value={cueLanguage} onValueChange={(value: 'en' | 'gu') => setCueLanguage(value)}>
                          <SelectTrigger id="cue-language">
                              <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <Button type="button" onClick={handleGenerateCues} disabled={isLoadingCues} variant="outline" className="w-full sm:w-auto">
                      {isLoadingCues ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                      Get AI Cues
                  </Button>
                </div>
                {aiCues.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-sm font-medium">Suggested Cues for Description:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {aiCues.map((cue, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          <button type="button" onClick={() => handleCueClick(cue)} className="text-primary hover:underline text-left">
                            {cue}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      <CardFooter className="flex justify-end p-0 pt-6 max-w-3xl mx-auto">
        <Button type="submit" disabled={!!isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (memory ? 'Save Changes' : 'Add Memory')}
        </Button>
      </CardFooter>
    </form>
  );
}

