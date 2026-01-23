
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMonth, getDate, getYear, parseISO, getDaysInMonth, format } from 'date-fns';
import { mockPrompts as lifePrompts } from '@/lib/mockData';
import { teleprompterScripts, defaultTeleprompterFallbackScript } from '@/lib/teleprompterScripts';
import { emotionTagsList, memoryCategoriesList, type MemoryCategory, type Prompt as LifePrompt } from '@/types';
import type { Memory, MediaAttachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, MapPin, Info, QrCode, Flag, Smile, CalendarIcon, Layers, Video, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, updateDoc, collection, arrayUnion, arrayRemove, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { QrCodeDialog } from '@/components/prompts/QrCodeDialog';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const MediaCaptureControl = dynamic(
  () => import('@/components/memory/MediaRecorder').then((mod) => mod.MediaCaptureControl),
  {
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }
);

export default function MemoryFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const editMemoryId = searchParams.get('editMemoryId') || undefined;
  const promptId = searchParams.get('promptId') || undefined;

  const prompt = lifePrompts.flatMap((p: LifePrompt) => [p, ...(p.subPrompts || [])]).find((p: LifePrompt) => p.id === promptId);
  const initialTitle = prompt?.text.en || searchParams.get('customPrompt') || '';

  const isEditing = !!editMemoryId;

  const [isLoadingMemory, setIsLoadingMemory] = useState(isEditing);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(memoryCategoriesList.find(c => c.id === 'personal_reflection'));
  const [location, setLocation] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<string[]>([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(getDate(new Date()));

  const [mediaPayload, setMediaPayload] = useState<{ file: File, type: 'video' | 'audio', duration: number, trimValues?: [number, number] } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [isLoadingFlag, setIsLoadingFlag] = useState(true);
  
  const years = Array.from({ length: 100 }, (_, i) => getYear(new Date()) - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(0, i), 'MMMM') }));
  const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const [qrCodeDialog, setQrCodeDialog] = useState({ open: false, url: '', title: '' });
  const teleprompterScript = teleprompterScripts[promptId as keyof typeof teleprompterScripts] || defaultTeleprompterFallbackScript;

  const handleShowQrCode = () => {
    const url = `${window.location.origin}/memory/${editMemoryId}`;
    setQrCodeDialog({ open: true, url, title: title || "My Memory" });
  };

  useEffect(() => {
    if (authLoading || !user || !promptId || !db) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            setIsFlagged(userData.flaggedPrompts?.includes(promptId) || false);
        }
        setIsLoadingFlag(false);
    });
    return () => unsubscribe();
  }, [promptId, user, authLoading, db]);

  useEffect(() => {
    if (!editMemoryId || !user || authLoading || !db) {
      setIsLoadingMemory(false);
      return;
    }
    const fetchMemory = async () => {
      try {
        const memoryRef = doc(db, 'users', user.uid, 'memories', editMemoryId);
        const docSnap = await getDoc(memoryRef);
        if (docSnap.exists()) {
          const memory = { id: docSnap.id, ...docSnap.data() } as Memory;
          setTitle(memory.title);
          setDescription(memory.description || '');
          setSelectedEmotionTags(memory.emotionTags || []);
          setLocation(memory.location || '');
          if (memory.date) {
            const memoryDate = parseISO(memory.date);
            setSelectedYear(getYear(memoryDate));
            setSelectedMonth(getMonth(memoryDate));
            setSelectedDay(getDate(memoryDate));
          }
          if (memory.category) {
            const category = memoryCategoriesList.find(c => (typeof memory.category === 'string' ? c.id === memory.category : c.id === memory.category.id));
            setSelectedCategory(category);
          }
        }
      } catch (error) {
          console.error("Failed to load memory", { error });
          toast({ title: 'Error', description: 'Failed to load memory.', variant: 'destructive'});
      } finally {
        setIsLoadingMemory(false);
      }
    };
    fetchMemory();
  }, [editMemoryId, user, authLoading, toast, db]);

  const handleToggleFlagPrompt = async () => {
    if (!user || !promptId || !db) return;
    const userRef = doc(db, 'users', user.uid);
    try {
        await updateDoc(userRef, {
            flaggedPrompts: isFlagged ? arrayRemove(promptId) : arrayUnion(promptId)
        });
        toast({ title: isFlagged ? 'Prompt Unflagged' : 'Prompt Flagged' });
    } catch (error) {
        toast({ title: 'Error', description: 'Could not update flag', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !storage) return;
    setIsSubmitting(true);
    console.log('TESTIMONY - add-memory-ts-handle-submit - START');

    if (mediaPayload && mediaPayload.duration > 360) {
        toast({
            title: "Video too long",
            description: "Please keep your memories under 6 minutes.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }

    try {
      let mediaAttachment: MediaAttachment | null = null;

      if (mediaPayload?.file) {
        const fileRef = storageRef(storage, `users/${user.uid}/memories/${Date.now()}`);
        const metadata = {
            contentType: mediaPayload.file.type,
            customMetadata: {
                duration: mediaPayload.duration.toString(),
                trimStart: mediaPayload.trimValues ? mediaPayload.trimValues[0].toString() : '0',
                trimEnd: mediaPayload.trimValues ? mediaPayload.trimValues[1].toString() : mediaPayload.duration.toString(),
            },
        };
        await uploadBytes(fileRef, mediaPayload.file, metadata);
        const url = await getDownloadURL(fileRef);
        mediaAttachment = {
          id: crypto.randomUUID(),
          url,
          type: mediaPayload.type,
          duration: mediaPayload.duration,
          filename: mediaPayload.file.name,
          trimStart: mediaPayload.trimValues ? mediaPayload.trimValues[0] : 0,
          trimEnd: mediaPayload.trimValues ? mediaPayload.trimValues[1] : mediaPayload.duration,
        };
      }

      const memoryData: any = {
        title,
        description,
        category: selectedCategory?.id || 'personal_reflection',
        location,
        emotionTags: selectedEmotionTags,
        date: new Date(selectedYear, selectedMonth, selectedDay).toISOString(),
        mediaAttachments: mediaAttachment ? [mediaAttachment] : [],
        updatedAt: serverTimestamp(),
        userId: user.uid,
        promptId: promptId,
      };

      if (isEditing) {
        await updateDoc(doc(db, 'users', user.uid, 'memories', editMemoryId!), memoryData);
      } else {
        memoryData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'users', user.uid, 'memories'), memoryData);
      }

      toast({ title: "Success", description: "Memory saved!", variant: "success" });
      console.log('TESTIMONY - add-memory-ts-handle-submit - END - Success');
      router.push('/timeline');
    } catch (err) {
      console.error("handleSubmit failed with error", { err });
      toast({ title: "Error", description: "Failed to save memory", variant: "destructive" });
      console.log('TESTIMONY - add-memory-ts-handle-submit - END - Error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEmotionTagToggle = (tagId: string) => {
      setSelectedEmotionTags(prev => 
          prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
      );
  };

  if (authLoading || isLoadingMemory) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto max-w-4xl py-8">
        <form onSubmit={handleSubmit}>
          <Card className="flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-xl animate-fade-in h-full relative border-muted/60">
            
            {/* --- CONTENT SECTION --- */}
            <CardHeader className="pb-2">
              <div className='space-y-1'>
                <Label htmlFor='title' className="text-sm font-medium text-muted-foreground">Title</Label>
                <Input id='title' value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your memory a name..." className='text-xl font-headline h-auto p-0 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0' />
              </div>
              <div className="flex flex-col gap-2 mt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs text-muted-foreground"><CalendarIcon className="mr-1.5 h-3 w-3" /> Date</Label>
                      <div className="grid grid-cols-3 gap-1">
                        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                          <SelectTrigger className='h-8 text-xs'><SelectValue placeholder="Year" /></SelectTrigger>
                          <SelectContent>{years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                          <SelectTrigger className='h-8 text-xs'><SelectValue placeholder="Month" /></SelectTrigger>
                          <SelectContent>{months.map(month => <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                         <SelectTrigger className='h-8 text-xs'><SelectValue placeholder="Day" /></SelectTrigger>
                          <SelectContent>{days.map(day => <SelectItem key={day} value={day.toString()}>{day}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center text-xs text-muted-foreground"><MapPin className="mr-1.5 h-3 w-3" /> Location</Label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where did this happen?" className='h-8 text-xs' />
                    </div>
                 </div>
              </div>
            </CardHeader>

            <CardContent className="flex-grow py-4 space-y-4">
              <div className='space-y-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea id='description' value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the moment..." className='leading-relaxed' />
              </div>
              
              <div className="flex flex-wrap gap-2">
                  <Select onValueChange={(value) => setSelectedCategory(memoryCategoriesList.find(c => c.id === value))} value={selectedCategory?.id}>
                    <SelectTrigger className='text-xs h-7 w-auto gap-1.5 pl-2 pr-2 border-dashed'>
                      <Layers className="h-3 w-3" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {memoryCategoriesList.map(cat => <SelectItem key={cat.id} value={cat.id} className='text-xs'>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                
                {mediaPayload && (
                  <Badge variant="outline" className="text-[10px] h-7 border-dashed pointer-events-none">
                    {mediaPayload.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Mic className="h-3 w-3 mr-1" />}
                    {mediaPayload.type.charAt(0).toUpperCase() + mediaPayload.type.slice(1)} Ready
                  </Badge>
                )}
                {emotionTagsList.map(tag => (
                  <div key={tag.id} 
                    onClick={() => handleEmotionTagToggle(tag.id)} 
                    className={`flex items-center rounded-full border px-2 py-0.5 text-xs cursor-pointer transition-colors ${selectedEmotionTags.includes(tag.id) ? 'bg-primary/10 border-primary/40' : 'border-dashed hover:border-primary/40'}`}>
                      <Smile className="h-3 w-3 mr-1 opacity-60" />
                      {tag.label}
                  </div>
                ))}
              </div>
                
              {/* --- MEDIA SECTIONS MOVED HERE --- */}
              {promptId && (
                <div className='space-y-2 pt-4 border-t'>
                   <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label className="flex items-center"><Info className="mr-2 h-4 w-4" /> Teleprompter Script</Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Use this script in a teleprompter app to guide your recording.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Textarea readOnly value={teleprompterScript} className="h-auto flex-1 bg-background/50 text-sm" />
                </div>
              )}
              <div className="space-y-2 pt-4 border-t">
                <Label>Record or Upload Media</Label>
                <div className="p-4 rounded-md border bg-muted/50">
                    <MediaCaptureControl onMediaReady={setMediaPayload} deferCameraInit />
                </div>
              </div>
            </CardContent>

            {/* --- FOOTER ACTIONS --- */}
            <CardFooter className="flex flex-col items-stretch gap-4 pt-4 border-t border-muted/40">
                {promptId && (
                  <div className="flex items-center justify-start rounded-lg border p-3">
                      <div className="flex items-center space-x-2">
                          <Checkbox id="flag-checkbox" checked={isFlagged} onCheckedChange={handleToggleFlagPrompt} disabled={isLoadingFlag} />
                          <div className="space-y-0.5">
                              <Label htmlFor='flag-checkbox' className="flex items-center text-sm"><Flag className="mr-2 h-4 w-4" /> Flag for Reuse</Label>
                              <p className="text-xs text-muted-foreground">Mark this prompt as important to revisit.</p>
                          </div>
                      </div>
                  </div>
                )}
                {isEditing && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                        <Label className="flex items-center text-sm"><QrCode className="mr-2 h-4 w-4" /> Shareable QR Code</Label>
                        <p className="text-xs text-muted-foreground">Generate a QR code to share this memory.</p>
                    </div>
                    <Button type="button" variant="outline" size='sm' onClick={handleShowQrCode}>Show QR</Button>
                  </div>
                )}
                <Button type="submit" disabled={isSubmitting} className="w-full text-base py-5">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? 'Save Changes' : 'Save Memory')}
                </Button>
            </CardFooter>
          </Card>
        </form>
        <QrCodeDialog
          open={qrCodeDialog.open}
          url={qrCodeDialog.url}
          title={qrCodeDialog.title}
          onClose={() => setQrCodeDialog({ open: false, url: '', title: '' })}
        />
      </div>
    </AuthenticatedPageWrapper>
  );
}
