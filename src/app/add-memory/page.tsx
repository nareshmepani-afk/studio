
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMonth, getDate, getYear, parseISO, getDaysInMonth, format } from 'date-fns';
import { mockPrompts as lifePrompts } from '@/lib/mockData';
import { teleprompterScripts, defaultTeleprompterFallbackScript } from '@/lib/teleprompterScripts';
import { emotionTagsList, memoryCategoriesList, type EmotionTag, type MemoryCategory, type Prompt as LifePrompt } from '@/types';
import type { Memory, MediaAttachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, ArrowRight, ArrowLeft, Scissors, Sparkles, MapPin, Info, QrCode, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, addDoc, updateDoc, collection, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { QrCodeDialog } from '@/components/prompts/QrCodeDialog';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';

const MediaCaptureControl = dynamic(
  () => import('@/components/memory/MediaRecorder').then((mod) => mod.MediaCaptureControl),
  {
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }
);

const formatTime = (seconds: number) => {
    const totalSeconds = Math.round(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function MemoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth(); // Destructure authLoading

  const editMemoryId = searchParams.get('editMemoryId') || undefined;
  const promptId = searchParams.get('promptId') || undefined;

  const prompt = lifePrompts.flatMap((p: LifePrompt) => [p, ...(p.subPrompts || [])]).find((p: LifePrompt) => p.id === promptId);
  const teleprompterScript = teleprompterScripts[promptId || ''] || defaultTeleprompterFallbackScript;
  const initialTitle = prompt?.text.en || searchParams.get('customPrompt') || '';

  const isEditing = !!editMemoryId;

  const [memoryToEdit, setMemoryToEdit] = useState<Memory | null>(null);
  const [isLoadingMemory, setIsLoadingMemory] = useState(isEditing);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>();
  const [location, setLocation] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(getDate(new Date()));

  const [mediaPayload, setMediaPayload] = useState<{ file: File, type: 'video' | 'audio', duration: number } | null>(null);
  const [initialMedia, setInitialMedia] = useState<MediaAttachment | null>(null);
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 0]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [isLoadingFlag, setIsLoadingFlag] = useState(true); // Start as true
  const [qrCodeDialog, setQrCodeDialog] = useState<{ open: boolean; url: string; title: string; }>({ open: false, url: '', title: '' });

  useEffect(() => {
    // Wait for auth to finish loading and for a user to be present.
    if (authLoading || !user || !promptId) {
        return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (!docSnap.exists()) {
            setIsLoadingFlag(false);
            return;
        }

        const userData = docSnap.data();
        const newFlagState = userData.flaggedPrompts?.includes(promptId) || false;

        if (isLoadingFlag) { // First valid run
            console.log(`TESTIMONY - flag-tc1-ts1 - START`);
            console.log(`State Before: The initial state of the prompt flag is unknown.`);
            console.log(`Action: Listening for real-time updates to the prompt flag status.`);
            console.log(`State After: The initial state of prompt ${promptId} is isFlagged: ${newFlagState}.`);
            console.log(`TESTIMONY - flag-tc1-ts1 - END`);
            setIsLoadingFlag(false); // Mark initial load as complete
        } else if (isFlagged !== newFlagState) { // Subsequent updates from another client
            const testStepId = newFlagState ? 'flag-tc1-ts4' : 'flag-tc1-ts6';
            console.log(`TESTIMONY - ${testStepId} - START`);
            console.log(`State Before: The flag state is isFlagged: ${isFlagged}.`);
            console.log(`Action: Received a real-time update from Firestore.`);
            console.log(`State After: The flag state has been updated to isFlagged: ${newFlagState}.`);
            console.log(`TESTIMONY - ${testStepId} - END`);
        }

        setIsFlagged(newFlagState);
    }, (error) => {
        console.error("Error listening to user document for flag status:", error);
        toast({ title: 'Error', description: 'Could not sync prompt flag status.', variant: 'destructive'});
        setIsLoadingFlag(false);
    });

    return () => unsubscribe();
  }, [promptId, user, authLoading, toast, isFlagged, isLoadingFlag]); // Correctly add dependencies to fix stale closure


  const handleToggleFlag = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user || !promptId) return;

    const testStepId = isFlagged ? 'flag-tc1-ts5' : 'flag-tc1-ts3';
    console.log(`TESTIMONY - ${testStepId} - START`);
    console.log(`State Before: The prompt is currently ${isFlagged ? 'flagged' : 'unflagged'} (isFlagged: ${isFlagged}).`);
    console.log(`Action: User clicked the flag icon to ${isFlagged ? 'unflag' : 'flag'} the prompt.`);

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        flaggedPrompts: isFlagged ? arrayRemove(promptId) : arrayUnion(promptId)
      });
      toast({ title: isFlagged ? 'Prompt unflagged' : 'Prompt flagged for re-use', variant: 'success' });
    } catch (error) {
      console.error(`TESTIMONY - ${testStepId} - ERROR: Failed to update flag status.`, error);
      toast({ title: 'Error', description: 'Could not update flag status.', variant: 'destructive'});
    } finally {
      console.log(`TESTIMONY - ${testStepId} - END`);
    }
  };

  useEffect(() => {
    if (authLoading || !user || !editMemoryId) {
      setIsLoadingMemory(false);
      return;
    }

    const fetchMemory = async () => {
      try {
        const memoryRef = doc(db, 'users', user.uid, 'memories', editMemoryId);
        const docSnap = await getDoc(memoryRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const memory = {
            id: docSnap.id,
            ...data,
            date: (data.date as any)?.toDate ? data.date.toDate().toISOString() : data.date,
          } as Memory;
          setMemoryToEdit(memory);
        } else {
          toast({ title: 'Error', description: 'Memory not found.', variant: 'destructive'});
          router.push('/timeline');
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load memory.', variant: 'destructive'});
      } finally {
        setIsLoadingMemory(false);
      }
    };
    fetchMemory();
  }, [editMemoryId, user, authLoading, router, toast]);

  useEffect(() => {
    if (memoryToEdit) {
      if (!prompt) {
          setTitle(memoryToEdit.title || '');
      }
      setDescription(memoryToEdit.description || '');
      const matchedCategory = memoryCategoriesList.find(c => c.id === (typeof memoryToEdit.category === 'string' ? memoryToEdit.category : memoryToEdit.category?.id));
      setSelectedCategory(matchedCategory || memoryCategoriesList[0]);
      setLocation(memoryToEdit.location || '');

      const matchedTags = (memoryToEdit.emotionTags || []).map(tagId => emotionTagsList.find(tag => tag.id === tagId)).filter((tag): tag is EmotionTag => !!tag);
      setSelectedEmotionTags(matchedTags);

      if (memoryToEdit.date) {
        try {
          const date = parseISO(memoryToEdit.date);
          setSelectedYear(getYear(date));
          setSelectedMonth(getMonth(date));
          setSelectedDay(getDate(date));
        } catch (e) { console.error("Failed to parse date:", memoryToEdit.date); }
      }

      if (memoryToEdit.mediaAttachments?.[0]) {
        const m = memoryToEdit.mediaAttachments[0];
        setInitialMedia({
          id: m.id,
          url: m.url,
          type: m.type,
          filename: m.filename,
          duration: m.duration || 0,
        });
        setTrimValues([m.startTime || 0, m.endTime || m.duration || 0]);
      }
    }
  }, [memoryToEdit, prompt]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
        const index = carouselApi.selectedScrollSnap();
        setCurrentSlide(index);
    };
    carouselApi.on("select", onSelect);
    onSelect();
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi]);

  const handleMediaReady = useCallback((payload: any) => {
    if (!payload) {
      setMediaPayload(null);
      setTrimValues([0, 0]);
      return;
    }
    setTrimValues([0, payload.duration]);
    setMediaPayload(payload);
  }, []);

 const handleShowQrCode = useCallback(() => {
    const testStepId = 'qr-tc1-ts1';
    console.log(`TESTIMONY - ${testStepId} - START`);
    console.log('State Before: The QR code dialog is not visible.');
    console.log('Action: User clicked the QR code icon.');
    if (!promptId) return;
    const url = `${window.location.origin}/prompts/${promptId}`;
    setQrCodeDialog({ open: true, url, title: title || 'this prompt' });
    console.log(`State After: The QR code dialog is now visible with URL: ${url}`);
    console.log(`TESTIMONY - ${testStepId} - END`);
}, [promptId, title]);

  const currentMediaDuration = mediaPayload?.duration || initialMedia?.duration || 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const testCaseId = isEditing ? 'e2e-edit-memory' : 'e2e-add-memory';
    console.log(`TESTIMONY - ${testCaseId}-ts-submit - START`);

    try {
      console.log('State Before: User has filled the form and clicked the submit button.');

      if (!user) {
        throw new Error("You must be logged in to save a memory.");
      }
      if (!title) {
        carouselApi?.scrollTo(0);
        throw new Error("Please give your memory a title.");
      }
      if (!mediaPayload?.file && !initialMedia) {
        carouselApi?.scrollTo(1);
        throw new Error("Please add a video or audio to your memory.");
      }

      console.log('Action: Setting isSubmitting to true.');
      setIsSubmitting(true);
      console.log(`State After: isSubmitting is now true. The submit button is disabled.`);

      let newOrUpdatedAttachments: MediaAttachment[] = memoryToEdit?.mediaAttachments || [];

      if (mediaPayload?.file) {
        console.log(`TESTIMONY - ${testCaseId}-ts-upload-media - START`);
        const file = mediaPayload.file;
        const fileId = crypto.randomUUID();
        const fileExtension = file.name.split('.').pop() || 'tmp';
        const filePath = `users/${user.uid}/media/${fileId}.${fileExtension}`;
        const fileRef = storageRef(storage, filePath);

        console.log(`Action: Uploading file to Firebase Storage at path: ${filePath}`);
        await uploadBytes(fileRef, file);
        console.log(`State After: File upload completed successfully.`);

        console.log(`Action: Getting download URL for the uploaded file.`);
        const publicUrl = await getDownloadURL(fileRef);
        console.log(`State After: Successfully retrieved download URL: ${publicUrl}`);

        if (initialMedia?.url && initialMedia.url.includes('firebasestorage.googleapis.com')) {
          console.log(`Action: Deleting old media file from storage at URL: ${initialMedia.url}`);
          try {
            const oldFileRef = storageRef(storage, initialMedia.url);
            await deleteObject(oldFileRef);
            console.log(`State After: Successfully deleted old media file.`);
          } catch (deleteError: any) {
            if (deleteError.code !== 'storage/object-not-found') {
              console.warn("Could not delete old media from storage:", deleteError);
            } else {
              console.log("State After: Old media file was not found in storage, which is acceptable.");
            }
          }
        }

        newOrUpdatedAttachments = [{
          id: fileId,
          url: publicUrl,
          type: file.type.startsWith('video') ? 'video' : 'audio',
          filename: file.name,
        }];
        console.log(`TESTIMONY - ${testCaseId}-ts-upload-media - END`);
      }

      console.log(`TESTIMONY - ${testCaseId}-ts-prepare-data - START`);
      if (newOrUpdatedAttachments.length > 0) {
        newOrUpdatedAttachments[0] = {
          ...newOrUpdatedAttachments[0],
          startTime: trimValues[0],
          endTime: trimValues[1],
          isTrimmed: trimValues[0] > 0 || (!!currentMediaDuration && trimValues[1] < currentMediaDuration),
          duration: currentMediaDuration
        };
      }

      const memoryData: Omit<Memory, 'id'> = {
        title,
        date: new Date(selectedYear, selectedMonth, selectedDay).toISOString(),
        description,
        category: selectedCategory?.id || 'personal_reflection',
        location,
        emotionTags: selectedEmotionTags.map(t => t.id),
        promptId: promptId || memoryToEdit?.promptId,
        userId: user.uid,
        mediaAttachments: newOrUpdatedAttachments,
        updatedAt: new Date().toISOString(),
      };
      console.log('Action: Assembled memory data object for Firestore.', memoryData);
      console.log(`TESTIMONY - ${testCaseId}-ts-prepare-data - END`);

      console.log(`TESTIMONY - ${testCaseId}-ts-save-to-db - START`);
      if (isEditing && editMemoryId) {
        console.log(`Action: Updating existing memory document in Firestore with ID: ${editMemoryId}`);
        const memRef = doc(db, 'users', user.uid, 'memories', editMemoryId);
        await updateDoc(memRef, memoryData);
        console.log(`State After: Successfully updated memory document.`);
        toast({ title: "Success", description: "Memory updated successfully", variant: 'success' });
      } else {
        console.log(`Action: Creating new memory document in Firestore.`);
        const collectionRef = collection(db, 'users', user.uid, 'memories');
        const docRef = await addDoc(collectionRef, { ...memoryData, createdAt: new Date().toISOString() });
        console.log(`State After: Successfully created new memory document with ID: ${docRef.id}`);
        toast({ title: "Success", description: "Memory saved successfully", variant: 'success' });
      }
      console.log(`TESTIMONY - ${testCaseId}-ts-save-to-db - END`);

      console.log(`Action: Navigating to /timeline and refreshing the page.`);
      router.push('/timeline');
      router.refresh();

    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred.";
      console.error(`TESTIMONY - ${testCaseId}-ts-submit - FATAL_ERROR: An error occurred during the submission process.`, error);
      toast({
        title: error.message ? "Error" : "An Unknown Error Occurred",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      console.log('Action: Setting isSubmitting to false.');
      setIsSubmitting(false);
      console.log(`State After: isSubmitting is now false. The submit button is re-enabled.`);
      console.log(`TESTIMONY - ${testCaseId}-ts-submit - END`);
    }
  };

  const toggleEmotionTag = (tag: EmotionTag) => {
    setSelectedEmotionTags(prev =>
      prev.some(t => t.id === tag.id)
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag]
    );
  };

  const years = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(2000, i, 1), 'MMMM') }));
  const days = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth)) }, (_, i) => i + 1);

  const leftValueLabel = currentMediaDuration > 0 ? formatTime(trimValues[0]) : '';
  const rightValueLabel = currentMediaDuration > 0 ? formatTime(trimValues[1]) : '';
  const leftPosition = currentMediaDuration > 0 ? `calc(${(trimValues[0] / currentMediaDuration) * 100}% - ${leftValueLabel.length / 2}ch)` : '0%';
  const rightPosition = currentMediaDuration > 0 ? `calc(${(trimValues[1] / currentMediaDuration) * 100}% - ${rightValueLabel.length / 2}ch)` : '100%';

  if (isLoadingMemory || authLoading) { // Also consider authLoading
      return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center h-[calc(100vh-8rem)]">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading memory...</p>
            </div>
        </div>
      );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-center mb-6 space-x-2">
          {[0, 1].map((step) => (
            <div key={step} className={`h-2 w-16 rounded-full transition-colors ${currentSlide === step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        <Carousel setApi={setCarouselApi} opts={{ watchDrag: false }} className="w-full">
          <CarouselContent>
            <CarouselItem>
              <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>The Details</CardTitle>
                            <CardDescription>When and where did this happen?</CardDescription>
                        </div>
                        {promptId && (
                            <TooltipProvider>
                                <div className="flex items-center space-x-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                                                <Info className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" align="end" className="max-w-xs">
                                            <p className="text-sm">{teleprompterScript}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShowQrCode(); }}>
                                                <QrCode className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" align="end">
                                            <p>Show QR code for remote interview</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button type="button" variant="ghost" size="icon" onClick={handleToggleFlag} disabled={isLoadingFlag || authLoading}>
                                                <Flag className={`h-5 w-5 transition-colors ${isFlagged ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" align="end">
                                             <p>{isFlagged ? 'Unflag this prompt' : 'Flag this prompt to easily find and reuse it for future interviews.'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TooltipProvider>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input name="title" placeholder="e.g. My 30th Birthday" value={title} onChange={e => setTitle(e.target.value)} required/>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={selectedDay.toString()} onValueChange={v => setSelectedDay(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{days.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={selectedCategory?.id || ''} onValueChange={(val) => setSelectedCategory(memoryCategoriesList.find(c => c.id === val))}>
                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                          {memoryCategoriesList.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input name="location" className="pl-8" placeholder="London, UK" value={location} onChange={e => setLocation(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" placeholder="Describe the memory..." className="min-h-[120px]" value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Emotions</Label>
                    <div className="flex flex-wrap gap-2">
                      {emotionTagsList.map((tag: EmotionTag) => (
                        <Button
                          key={tag.id}
                          type="button"
                          variant={selectedEmotionTags.some(t => t.id === tag.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleEmotionTag(tag)}
                        >
                          {tag.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem>
              <Card>
                <CardHeader>
                  <CardTitle>{isEditing ? 'Edit Media' : 'Add Media'}</CardTitle>
                  <CardDescription>
                    {isEditing ? 'Replace or trim the existing media for this memory.' : 'Upload or record a video/audio for this memory.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <MediaCaptureControl
                    onMediaReady={handleMediaReady}
                    initialMedia={initialMedia ? { previewUrl: initialMedia.url, type: initialMedia.type, duration: initialMedia.duration } : null}
                    trimValues={trimValues}
                  />
                  {(mediaPayload || initialMedia) && currentMediaDuration > 0 && (
                      <div className="pt-4 space-y-4 border-t">
                          <Label className="flex items-center text-primary"><Scissors className="w-4 h-4 mr-2"/> Trim Clip</Label>
                          <div className="relative">
                              <div className="relative h-8">
                                  <span className="text-xs text-muted-foreground font-mono absolute" style={{ left: leftPosition }}>
                                      {leftValueLabel}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-mono absolute" style={{ left: rightPosition }}>
                                      {rightValueLabel}
                                  </span>
                              </div>
                              <Slider
                                  min={0}
                                  max={currentMediaDuration}
                                  step={0.1}
                                  minStepsBetweenThumbs={1}
                                  value={trimValues}
                                  onValueChange={(v) => {
                                      const newTrim = v as [number, number];
                                      setTrimValues(newTrim);
                                  }}
                                  aria-label="Video trim slider"
                              />
                               <div className="flex justify-between mt-1">
                                  <span className="text-xs text-muted-foreground font-mono">{formatTime(0)}</span>
                                  <span className="text-xs text-muted-foreground font-mono">{currentMediaDuration ? formatTime(currentMediaDuration) : '00:00'}</span>
                              </div>
                          </div>
                      </div>
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
        </Carousel>

        <QrCodeDialog
          open={qrCodeDialog.open}
          url={qrCodeDialog.url}
          title={qrCodeDialog.title}
          onClose={() => setQrCodeDialog({ open: false, url: '', title: '' })}
        />

        <div className="flex justify-between mt-8 px-1">
          <Button type="button" variant="ghost" onClick={() => currentSlide === 0 ? router.back() : carouselApi?.scrollPrev()} disabled={isSubmitting}>
            {currentSlide === 0 ? 'Cancel' : <><ArrowLeft className="w-4 h-4 mr-2" /> Back</>}
          </Button>
          {currentSlide === 0 ? (
             <Button type="button" onClick={() => {
                 carouselApi?.scrollNext();
             }} disabled={isSubmitting}>
              <span className="mr-2">Next</span> <ArrowRight className="w-4 h-4" />
             </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting || authLoading} className="min-w-[120px]">
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <><Sparkles className="w-4 h-4 mr-2" /> {isEditing ? 'Update Memory' : 'Save Memory'}</>}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}


export default function AddMemoryPage() {
    return (
      <AuthenticatedPageWrapper>
        <MemoryForm />
      </AuthenticatedPageWrapper>
    )
}
