
"use client";

import { useState, type FormEvent, useEffect, useCallback, useMemo } from 'react';
import type { Memory, MemoryCategory, User, MediaAttachment, Prompt } from '@/types';
import { memoryCategories } from '@/types';
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
import { Sparkles, Lightbulb, Loader2, Paperclip, Trash2, Languages, RefreshCw, ArrowRight } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { mockPrompts } from '@/lib/mockData';
import { getDaysInMonth, format } from 'date-fns';

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

const currentGlobalYear = new Date().getFullYear();
const years: number[] = Array.from({ length: 101 }, (_, i) => currentGlobalYear - i);
const months: { value: number; label: string }[] = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(new Date(2000, i, 1), 'MMMM'),
}));

export function MemoryForm({ memory, onSubmit, isSubmitting }: MemoryFormProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isEditing = !!memory;

  const [title, setTitle] = useState(memory?.title || '');

  const initializeDateComponent = (component: 'year' | 'month' | 'day') => {
    const dateToParse = isEditing && memory?.date ? new Date(memory.date) : new Date();
    if (dateToParse instanceof Date && !isNaN(dateToParse.getTime())) {
      if (component === 'year') return dateToParse.getFullYear();
      if (component === 'month') return dateToParse.getMonth(); // 0-11
      if (component === 'day') return dateToParse.getDate();
    }
    // Fallback to current date components
    const today = new Date();
    if (component === 'year') return today.getFullYear();
    if (component === 'month') return today.getMonth();
    return today.getDate();
  };

  const [selectedYear, setSelectedYear] = useState<number>(initializeDateComponent('year'));
  const [selectedMonth, setSelectedMonth] = useState<number>(initializeDateComponent('month')); // 0-11
  const [selectedDay, setSelectedDay] = useState<number>(initializeDateComponent('day'));


  const [description, setDescription] = useState(memory?.description || '');
  const [category, setCategory] = useState<MemoryCategory>(memory?.category || memoryCategories[0]);
  const [userProfile, setUserProfile] = useState(user?.profileInfo || '');
  const [aiCues, setAiCues] = useState<string[]>([]);
  const [isLoadingCues, setIsLoadingCues] = useState(false);
  const [cueLanguage, setCueLanguage] = useState<'en' | 'gu'>('en');
  const [inspirationPrompts, setInspirationPrompts] = useState<Prompt[]>([]);

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
  }, [selectedDay, daysInSelectedMonth]);


  const loadInspirationPrompts = useCallback(() => {
    const shuffled = [...mockPrompts].sort(() => 0.5 - Math.random());
    setInspirationPrompts(shuffled.slice(0, 3));
  }, []);

  useEffect(() => {
    loadInspirationPrompts();
  }, [cueLanguage, loadInspirationPrompts]);


  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl && !memory) {
      setTitle(decodeURIComponent(promptFromUrl));
    }
  }, [searchParams, memory]);


  useEffect(() => {
    if (user?.profileInfo && !memory) {
      setUserProfile(user.profileInfo);
    }
  }, [user, memory]);

  const handleMediaReady = useCallback((mediaData: CurrentMediaData) => {
    setCurrentMedia(mediaData);
  }, []);

  const handleMediaDiscard = useCallback(() => {
    setCurrentMedia(null);
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
        currentDate: new Date().toISOString().split('T')[0], // Current date for context
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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter a title for the memory.", variant: "destructive" });
      return;
    }
    // Date is now constructed from selectedYear, selectedMonth, selectedDay
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    if (isNaN(finalDate.getTime())) {
      toast({ title: "Invalid Date", description: "Please select a valid date.", variant: "destructive" });
      return;
    }

    if (!description.trim()) {
      toast({ title: "Description Required", description: "Please enter a description for the memory.", variant: "destructive" });
      return;
    }
    if (!currentMedia) {
      toast({ title: "Media Required", description: "A media attachment (video or audio) is required.", variant: "destructive" });
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
      { title, date: finalDate.toISOString(), description, category, mediaAttachments: mediaAttachmentsForSubmission },
      userProfile,
      currentMedia && currentMedia.file.name !== "existing_media" && currentMedia.file.size > 0 ? currentMedia.file : undefined
    );
  };

  const initialMediaForRecorder = useMemo(() => {
    if (memory?.mediaAttachments && memory.mediaAttachments.length > 0) {
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
  }, [memory?.mediaAttachments]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{memory ? 'Edit Memory' : 'Add New Memory'}</CardTitle>
          <CardDescription>Capture the details of your moment. Fields marked with * are mandatory.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Summer Vacation in Italy" />
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
                  <SelectTrigger id="year-select">
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

          <div className="space-y-1">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your memory..." rows={4} required/>
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={(value: MemoryCategory) => setCategory(value)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {memoryCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-lg">Media Attachment *</CardTitle>
            {!currentMedia && <CardDescription>Record or upload a video/audio for your memory.</CardDescription>}
        </CardHeader>
        <CardContent>
            {!currentMedia && (
              <MediaCaptureControl
                  onMediaReady={handleMediaReady}
                  onDiscard={handleMediaDiscard}
                  initialMedia={initialMediaForRecorder}
              />
            )}

            {currentMedia && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center"><Paperclip className="mr-2 h-5 w-5 inline-block" />Attached Media</p>
                    <Button variant="ghost" size="icon" onClick={handleMediaDiscard} aria-label="Remove media">
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
                 <Button variant="outline" type="button" onClick={() => {
                    handleMediaDiscard();
                 }} className="w-full mt-2">
                    Change Media or Re-trim
                </Button>
              </div>
            )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" />AI-Powered Memory Cues</CardTitle>
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

      <CardFooter className="flex justify-end p-0 pt-6">
        <Button type="submit" disabled={!!isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (memory ? 'Save Changes' : 'Add Memory')}
        </Button>
      </CardFooter>
    </form>
  );
}
