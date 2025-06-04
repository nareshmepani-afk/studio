
"use client";

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import type { Memory, MemoryCategory, User, MediaAttachment } from '@/types';
import { memoryCategories } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaCaptureControl } from './MediaRecorder'; // Corrected import path
import { generateMemoryCuesAction } from '@/actions/generateMemoryCuesAction';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Lightbulb, Loader2, Paperclip, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MemoryFormProps {
  memory?: Memory;
  onSubmit: (memoryData: Omit<Memory, 'id' | 'userId'>, userProfileForCues?: string, mediaFile?: File) => void;
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

export function MemoryForm({ memory, onSubmit, isSubmitting }: MemoryFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(memory?.title || '');
  const [date, setDate] = useState<Date | undefined>(memory ? new Date(memory.date) : new Date());
  const [description, setDescription] = useState(memory?.description || '');
  const [category, setCategory] = useState<MemoryCategory>(memory?.category || memoryCategories[0]);
  const [userProfile, setUserProfile] = useState(user?.profileInfo || '');
  const [aiCues, setAiCues] = useState<string[]>([]);
  const [isLoadingCues, setIsLoadingCues] = useState(false);

  const [currentMedia, setCurrentMedia] = useState<CurrentMediaData | null>(() => {
    if (memory?.mediaAttachments && memory.mediaAttachments.length > 0) {
      const firstMedia = memory.mediaAttachments[0];
      return {
        file: new File([], firstMedia.filename || "existing_media", {type: firstMedia.type === 'video' ? 'video/webm' : 'audio/webm'}),
        type: firstMedia.type,
        previewUrl: firstMedia.url,
        startTime: firstMedia.startTime,
        endTime: firstMedia.endTime,
        duration: firstMedia.duration || 0,
      };
    }
    return null;
  });


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
        currentDate: new Date().toISOString().split('T')[0],
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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter a title for the memory.", variant: "destructive" });
      return;
    }
    if (!date) {
      toast({ title: "Date Required", description: "Please select a date for the memory.", variant: "destructive" });
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
      const isNewFile = currentMedia.file.name !== "existing_media";
      const originalMediaAttachment = memory?.mediaAttachments?.[0];

      mediaAttachmentsForSubmission = [{
        id: originalMediaAttachment?.id || Date.now().toString(),
        type: currentMedia.type,
        url: isNewFile ? currentMedia.previewUrl : (originalMediaAttachment?.url || currentMedia.previewUrl), // Placeholder for new, original for existing
        filename: currentMedia.file.name,
        startTime: currentMedia.startTime,
        endTime: currentMedia.endTime,
        duration: currentMedia.duration,
      }];
    }

    onSubmit(
      { title, date: date.toISOString(), description, category, mediaAttachments: mediaAttachmentsForSubmission },
      userProfile,
      currentMedia && currentMedia.file.name !== "existing_media" ? currentMedia.file : undefined
    );
  };

  const initialMediaForRecorder = memory?.mediaAttachments?.[0] ? {
    type: memory.mediaAttachments[0].type,
    previewUrl: memory.mediaAttachments[0].url,
    startTime: memory.mediaAttachments[0].startTime,
    endTime: memory.mediaAttachments[0].endTime,
    duration: memory.mediaAttachments[0].duration || 0,
  } : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{memory ? 'Edit Memory' : 'Add New Memory'}</CardTitle>
          <CardDescription>Capture the details of your moment. All fields marked with * are mandatory.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Summer Vacation in Italy" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="date">Date *</Label>
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your memory..." rows={4} />
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
                <video src={currentMedia.previewUrl} controls className="w-full aspect-video rounded-md mt-2 bg-muted" />
                )}
                {currentMedia.type === 'audio' && currentMedia.previewUrl && (
                <audio src={currentMedia.previewUrl} controls className="w-full mt-2" />
                )}
                <p className="text-sm text-muted-foreground mt-1">Duration: {currentMedia.duration.toFixed(2)}s</p>
                {currentMedia.startTime !== undefined && <p className="text-sm text-muted-foreground">Trim Start: {currentMedia.startTime.toFixed(2)}s</p>}
                {currentMedia.endTime !== undefined && currentMedia.duration !== currentMedia.endTime && <p className="text-sm text-muted-foreground">Trim End: {currentMedia.endTime.toFixed(2)}s</p>}
                <Button variant="outline" type="button" onClick={() => {
                    // To re-enable MediaCaptureControl to edit existing, discard currentMedia
                    // and MediaCaptureControl will re-appear allowing re-selection or new recording.
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
          <Button type="button" onClick={handleGenerateCues} disabled={isLoadingCues} variant="outline">
            {isLoadingCues ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
            Get AI Cues
          </Button>
          {aiCues.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-medium">Suggested Cues:</h4>
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (memory ? 'Save Changes' : 'Add Memory')}
        </Button>
      </CardFooter>
    </form>
  );
}
