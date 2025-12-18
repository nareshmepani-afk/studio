"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Sparkles, Loader2, ArrowRight, MapPin, ArrowLeft, Eye, Scissors } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDaysInMonth, format, getMonth, getYear, parseISO, getDate } from 'date-fns';
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

type CurrentMediaData = {
  file: File;
  type: 'video' | 'audio';
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  isTrimmed: boolean;
};

const SLIDE_INDEX_DETAILS = 0;
const SLIDE_INDEX_MEDIA = 1;
const SLIDE_INDEX_PREVIEW = 2;

function formatSecondsToTime(timeInSeconds: number | undefined): string {
  if (timeInSeconds === undefined || isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
  const totalSecs = Math.floor(timeInSeconds);
  const minutes = Math.floor(totalSecs / 60);
  const seconds = totalSecs % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function MemoryForm({ memoryToEdit, promptId, initialCustomPrompt }: { memoryToEdit: Memory | null; promptId?: string; initialCustomPrompt?: string; }) {
  const { user } = useAuth();
  const router = useRouter();
  const isEditing = !!memoryToEdit;

  // --- LAZY INITIALIZATION (Fixes the 'eT' ReferenceError) ---
  const [title, setTitle] = useState(() => initialCustomPrompt || '');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>(() => memoryCategoriesList?.[0]);
  const [description, setDescription] = useState('');
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>([]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => getMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => getDate(new Date()));

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(SLIDE_INDEX_DETAILS);
  const currentSlideRef = useRef(currentSlide);
  const [currentMedia, setCurrentMedia] = useState<CurrentMediaData | null>(null);
  const [currentMediaPreviewUrl, setCurrentMediaPreviewUrl] = useState<string | null>(null);
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 0]);
  const [mediaKey, setMediaKey] = useState("initial");
  const [isParentSubmitting, setIsParentSubmitting] = useState(false);
  const [isPreparingMedia, setIsPreparingMedia] = useState(false);

  // --- HYDRATION ---
  useEffect(() => {
    if (memoryToEdit) {
      setTitle(memoryToEdit.title || '');
      setLocation(memoryToEdit.location || '');
      setDescription(memoryToEdit.description || '');
      setSelectedCategory(memoryToEdit.category || memoryCategoriesList[0]);
      setSelectedEmotionTags(memoryToEdit.emotionTags || []);
      
      const validDate = memoryToEdit.date ? parseISO(memoryToEdit.date) : new Date();
      setSelectedYear(getYear(validDate));
      setSelectedMonth(getMonth(validDate));
      setSelectedDay(getDate(validDate));

      if (memoryToEdit.mediaAttachments?.[0]) {
        const m = memoryToEdit.mediaAttachments[0];
        setCurrentMedia({
          file: new File([], "placeholder"),
          type: m.type,
          startTime: m.startTime || 0,
          endTime: m.endTime || m.duration || 0,
          duration: m.duration || 0,
          size: m.size || 0,
          isTrimmed: !!m.isTrimmed
        });
        setCurrentMediaPreviewUrl(m.url);
        setTrimValues([m.startTime || 0, m.endTime || m.duration || 0]);
      }
    }
  }, [memoryToEdit]);

  // --- CONDITIONAL REPAIR (Fixes Trim Wipeout) ---
  const handleMediaReady = useCallback((payload: MediaFromRecorder) => {
    setCurrentMedia(prev => {
      const isExisting = isEditing && prev?.file.name === "placeholder";
      
      // Only repair if the UI has 0 duration and NO saved trim data
      const needsRepair = trimValues[0] === 0 && trimValues[1] === 0;

      if (isExisting && !needsRepair) {
        console.log("✅ Keeping saved trim:", trimValues);
        return { ...payload, startTime: trimValues[0], endTime: trimValues[1], isTrimmed: true };
      }

      setTrimValues([0, payload.duration]);
      if (currentMediaPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(currentMediaPreviewUrl);
      setCurrentMediaPreviewUrl(URL.createObjectURL(payload.file));
      return { ...payload, startTime: 0, endTime: payload.duration, isTrimmed: false };
    });
  }, [isEditing, trimValues, currentMediaPreviewUrl]);

  const handleSetCurrentSlide = useCallback((idx: number) => {
    setCurrentSlide(idx);
    currentSlideRef.current = idx;
    if (carouselApi) carouselApi.scrollTo(idx);
  }, [carouselApi]);

  const triggerSubmit = async () => {
    if (!user) return;
    setIsParentSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', new Date(selectedYear, selectedMonth, selectedDay).toISOString());
    
    if (currentMedia) {
      const meta = { startTime: trimValues[0], endTime: trimValues[1], isTrimmed: trimValues[0] > 0 || trimValues[1] < currentMedia.duration };
      if (currentMedia.file.name !== "placeholder") {
        formData.append('mediaFile', currentMedia.file);
        formData.append('mediaMetadata', JSON.stringify(meta));
      } else {
        formData.append('mediaAttachments', JSON.stringify([{ ...memoryToEdit?.mediaAttachments[0], ...meta }]));
      }
    }

    const res = await saveMemory(formData, user.id, memoryToEdit?.id || null);
    setIsParentSubmitting(false);
    if (res.success) router.push('/timeline');
  };

  const years = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(2000, i, 1), 'MMMM') }));
  const days = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth)) }, (_, i) => i + 1);

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <Carousel setApi={setCarouselApi} opts={{ watchDrag: false }}>
        <CarouselContent>
          <CarouselItem>
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                   <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                   <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent></Select>
                   <Select value={selectedDay.toString()} onValueChange={v => setSelectedDay(parseInt(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{days.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent></Select>
                </div>
                <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              </CardContent>
            </Card>
          </CarouselItem>

          <CarouselItem>
            <Card>
              <CardHeader><CardTitle>Media</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <MediaCaptureControl 
                  key={mediaKey}
                  onMediaReady={handleMediaReady}
                  onPreparingChange={setIsPreparingMedia}
                  initialMedia={currentMedia && currentMediaPreviewUrl ? { type: currentMedia.type, previewUrl: currentMediaPreviewUrl, duration: currentMedia.duration, size: currentMedia.size } : undefined}
                  trimValues={trimValues}
                />
                {currentMedia && currentMedia.duration > 0 && (
                  <div className="pt-4 space-y-2">
                    <Label className="flex items-center"><Scissors className="w-4 h-4 mr-2" />Trim Settings</Label>
                    <Slider min={0} max={currentMedia.duration} step={0.1} value={trimValues} onValueChange={v => setTrimValues(v as [number, number])} />
                    <div className="flex justify-between text-xs font-mono">
                      <span>{formatSecondsToTime(trimValues[0])}</span>
                      <span>{formatSecondsToTime(trimValues[1])}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          <CarouselItem>
             <Card>
               <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
               <CardContent>
                  {/* Preview Component Logic */}
                  <div className="p-4 border rounded bg-secondary/20">
                    <h3 className="font-bold">{title}</h3>
                    <p className="text-sm opacity-70">{description}</p>
                  </div>
               </CardContent>
             </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => currentSlide === 0 ? router.back() : handleSetCurrentSlide(currentSlide - 1)}>Back</Button>
        <Button onClick={() => currentSlide === 2 ? triggerSubmit() : handleSetCurrentSlide(currentSlide + 1)}>
          {currentSlide === 2 ? 'Save' : 'Next'}
        </Button>
      </div>
    </div>
  );
}