
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
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Paperclip, ArrowRight, Tag, MapPin, ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
import { getDaysInMonth, format, isValid, setDate, getMonth, getYear, getDate, parseISO } from 'date-fns';
import { enGB } from 'date-fns/locale';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { formatSecondsToTime } from '@/lib/utils';


interface MemoryFormProps {
  memory?: Memory; // Existing memory for editing
  onSubmit: (
    memoryData: Omit<Memory, 'id' | 'userId'> & { promptId?: string },
    mediaFileToUpload?: File
  ) => void;
  isSubmitting?: boolean; // From parent
}

type MediaRecorderData = {
  file: File;
  type: 'video' | 'audio';
  previewUrl: string;
  startTime?: number;
  endTime?: number;
  duration: number;
  size: number; // Added size
};

type CurrentMediaData = {
  file: File;
  type: 'video' | 'audio';
  startTime?: number;
  endTime?: number;
  duration: number;
  size: number; // Added size
};


const globalCurrentYear = new Date().getFullYear();
const years: number[] = Array.from({ length: 101 }, (_, i) => globalCurrentYear - i);
const months: { value: number; label: string }[] = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(new Date(2000, i, 1), 'MMMM', { locale: enGB }),
}));

const SLIDE_INDEX_DETAILS = 0;
const SLIDE_INDEX_MEDIA = 1;
const TOTAL_SLIDES = 2; 

const countryOptions = [
  { value: "Afghanistan", label: "Afghanistan" }, { value: "Albania", label: "Albania" }, { value: "Algeria", label: "Algeria" }, { value: "Andorra", label: "Andorra" }, { value: "Angola", label: "Angola" }, { value: "Antigua and Barbuda", label: "Antigua and Barbuda" }, { value: "Argentina", label: "Argentina" }, { value: "Armenia", label: "Armenia" }, { value: "Australia", label: "Australia" }, { value: "Austria", label: "Austria" }, { value: "Azerbaijan", label: "Azerbaijan" }, { value: "Bahamas", label: "Bahamas" }, { value: "Bahrain", label: "Bahrain" }, { value: "Bangladesh", label: "Bangladesh" }, { value: "Barbados", label: "Barbados" }, { value: "Belarus", label: "Belarus" }, { value: "Belgium", label: "Belgium" }, { value: "Belize", label: "Belize" }, { value: "Benin", label: "Benin" }, { value: "Bhutan", label: "Bhutan" }, { value: "Bolivia", label: "Bolivia" }, { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina" }, { value: "Botswana", label: "Botswana" }, { value: "Brazil", label: "Brazil" }, { value: "Brunei", label: "Brunei" }, { value: "Bulgaria", label: "Bulgaria" }, { value: "Burkina Faso", label: "Burkina Faso" }, { value: "Burundi", label: "Burundi" }, { value: "Cabo Verde", label: "Cabo Verde" }, { value: "Cambodia", label: "Cambodia" }, { value: "Cameroon", label: "Cameroon" }, { value: "Canada", label: "Canada" }, { value: "Central African Republic", label: "Central African Republic" }, { value: "Chad", label: "Chad" }, { value: "Chile", label: "Chile" }, { value: "China", label: "China" }, { value: "Colombia", label: "Colombia" }, { value: "Comoros", label: "Comoros" }, { value: "Congo (Congo-Brazzaville)", label: "Congo (Congo-Brazzaville)" }, { value: "Congo (Democratic Republic of the)", label: "Congo (Democratic Republic of the)" }, { value: "Costa Rica", label: "Costa Rica" }, { value: "Croatia", label: "Croatia" }, { value: "Cuba", label: "Cuba" }, { value: "Cyprus", label: "Cyprus" }, { value: "Czech Republic (Czechia)", label: "Czech Republic (Czechia)" }, { value: "Denmark", label: "Denmark" }, { value: "Djibouti", label: "Djibouti" }, { value: "Dominica", label: "Dominica" }, { value: "Dominican Republic", label: "Dominican Republic" }, { value: "Ecuador", label: "Ecuador" }, { value: "Egypt", label: "Egypt" }, { value: "El Salvador", label: "El Salvador" }, { value: "Equatorial Guinea", label: "Equatorial Guinea" }, { value: "Eritrea", label: "Eritrea" }, { value: "Estonia", label: "Estonia" }, { value: "Eswatini (fmr. Swaziland)", label: "Eswatini (fmr. Swaziland)" }, { value: "Ethiopia", label: "Ethiopia" }, { value: "Fiji", label: "Fiji" }, { value: "Finland", label: "Finland" }, { value: "France", label: "France" }, { value: "Gabon", label: "Gabon" }, { value: "Gambia", label: "Gambia" }, { value: "Georgia", label: "Georgia" }, { value: "Germany", label: "Germany" }, { value: "Ghana", label: "Ghana" }, { value: "Greece", label: "Greece" }, { value: "Grenada", label: "Grenada" }, { value: "Guatemala", label: "Guatemala" }, { value: "Guinea", label: "Guinea" }, { value: "Guinea-Bissau", label: "Guinea-Bissau" }, { value: "Guyana", label: "Guyana" }, { value: "Haiti", label: "Haiti" }, { value: "Honduras", label: "Honduras" }, { value: "Hungary", label: "Hungary" }, { value: "Iceland", label: "Iceland" }, { value: "India", label: "India" }, { value: "Indonesia", label: "Indonesia" }, { value: "Iran", label: "Iran" }, { value: "Iraq", label: "Iraq" }, { value: "Ireland", label: "Ireland" }, { value: "Israel", label: "Israel" }, { value: "Italy", label: "Italy" }, { value: "Jamaica", label: "Jamaica" }, { value: "Japan", label: "Japan" }, { value: "Jordan", label: "Jordan" }, { value: "Kazakhstan", label: "Kazakhstan" }, { value: "Kenya", label: "Kenya" }, { value: "Kiribati", label: "Kiribati" }, { value: "Kuwait", label: "Kuwait" }, { value: "Kyrgyzstan", label: "Kyrgyzstan" }, { value: "Laos", label: "Laos" }, { value: "Latvia", label: "Latvia" }, { value: "Lebanon", label: "Lebanon" }, { value: "Lesotho", label: "Lesotho" }, { value: "Liberia", label: "Liberia" }, { value: "Libya", label: "Libya" }, { value: "Liechtenstein", label: "Liechtenstein" }, { value: "Lithuania", label: "Lithuania" }, { value: "Luxembourg", label: "Luxembourg" }, { value: "Madagascar", label: "Madagascar" }, { value: "Malawi", label: "Malawi" }, { value: "Malaysia", label: "Malaysia" }, { value: "Maldives", label: "Maldives" }, { value: "Mali", label: "Mali" }, { value: "Malta", label: "Malta" }, { value: "Marshall Islands", label: "Marshall Islands" }, { value: "Mauritania", label: "Mauritania" }, { value: "Mauritius", label: "Mauritius" }, { value: "Mexico", label: "Mexico" }, { value: "Micronesia", label: "Micronesia" }, { value: "Moldova", label: "Moldova" }, { value: "Monaco", label: "Monaco" }, { value: "Mongolia", label: "Mongolia" }, { value: "Montenegro", label: "Montenegro" }, { value: "Morocco", label: "Morocco" }, { value: "Mozambique", label: "Mozambique" }, { value: "Myanmar (formerly Burma)", label: "Myanmar (formerly Burma)" }, { value: "Namibia", label: "Namibia" }, { value: "Nauru", label: "Nauru" }, { value: "Nepal", label: "Nepal" }, { value: "Netherlands", label: "Netherlands" }, { value: "New Zealand", label: "New Zealand" }, { value: "Nicaragua", label: "Nicaragua" }, { value: "Niger", label: "Niger" }, { value: "Nigeria", label: "Nigeria" }, { value: "North Korea", label: "North Korea" }, { value: "North Macedonia (formerly Macedonia)", label: "North Macedonia (formerly Macedonia)" }, { value: "Norway", label: "Norway" }, { value: "Oman", label: "Oman" }, { value: "Pakistan", label: "Pakistan" }, { value: "Palau", label: "Palau" }, { value: "Palestine State", label: "Palestine State" }, { value: "Panama", label: "Panama" }, { value: "Papua New Guinea", label: "Papua New Guinea" }, { value: "Paraguay", label: "Paraguay" }, { value: "Peru", label: "Peru" }, { value: "Philippines", label: "Philippines" }, { value: "Poland", label: "Poland" }, { value: "Portugal", label: "Portugal" }, { value: "Qatar", label: "Qatar" }, { value: "Romania", label: "Romania" }, { value: "Russia", label: "Russia" }, { value: "Rwanda", label: "Rwanda" }, { value: "Saint Kitts and Nevis", label: "Saint Kitts and Nevis" }, { value: "Saint Lucia", label: "Saint Lucia" }, { value: "Saint Vincent and the Grenadines", label: "Saint Vincent and the Grenadines" }, { value: "Samoa", label: "Samoa" }, { value: "San Marino", label: "San Marino" }, { value: "Sao Tome and Principe", label: "Sao Tome and Principe" }, { value: "Saudi Arabia", label: "Saudi Arabia" }, { value: "Senegal", label: "Senegal" }, { value: "Serbia", label: "Serbia" }, { value: "Seychelles", label: "Seychelles" }, { value: "Sierra Leone", label: "Sierra Leone" }, { value: "Singapore", label: "Singapore" }, { value: "Slovakia", label: "Slovakia" }, { value: "Slovenia", label: "Slovenia" }, { value: "Solomon Islands", label: "Solomon Islands" }, { value: "Somalia", label: "Somalia" }, { value: "South Africa", label: "South Africa" }, { value: "South Korea", label: "South Korea" }, { value: "South Sudan", label: "South Sudan" }, { value: "Spain", label: "Spain" }, { value: "Sri Lanka", label: "Sri Lanka" }, { value: "Sudan", label: "Sudan" }, { value: "Suriname", label: "Suriname" }, { value: "Sweden", label: "Sweden" }, { value: "Switzerland", label: "Switzerland" }, { value: "Syria", label: "Syria" }, { value: "Taiwan", label: "Taiwan" }, { value: "Tajikistan", label: "Tajikistan" }, { value: "Tanzania", label: "Tanzania" }, { value: "Thailand", label: "Thailand" }, { value: "Timor-Leste", label: "Timor-Leste" }, { value: "Togo", label: "Togo" }, { value: "Tonga", label: "Tonga" }, { value: "Trinidad and Tobago", label: "Trinidad and Tobago" }, { value: "Tunisia", label: "Tunisia" }, { value: "Turkey", label: "Turkey" }, { value: "Turkmenistan", label: "Turkmenistan" }, { value: "Tuvalu", label: "Tuvalu" }, { value: "Uganda", label: "Uganda" }, { value: "Ukraine", label: "Ukraine" }, { value: "United Arab Emirates", label: "United Arab Emirates" }, { value: "United Kingdom", label: "United Kingdom" }, { value: "United States", label: "United States" }, { value: "Uruguay", label: "Uruguay" }, { value: "Uzbekistan", label: "Uzbekistan" }, { value: "Vanuatu", label: "Vanuatu" }, { value: "Vatican City (Holy See)", label: "Vatican City (Holy See)" }, { value: "Venezuela", label: "Venezuela" }, { value: "Vietnam", label: "Vietnam" }, { value: "Yemen", label: "Yemen" }, { value: "Zambia", label: "Zambia" }, { value: "Zimbabwe", label: "Zimbabwe" },
  { value: "Other (Not Listed)", label: "Other (Not Listed)"},
];

export function MemoryForm({ memory, onSubmit, isSubmitting: isParentSubmitting }: MemoryFormProps) {
  const { user, hostPassStatus } = useAuth(); 
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize router
  const isEditing = !!memory;

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const yearSelectRef = useRef<HTMLButtonElement>(null);

  const step1AnchorRef = useRef<HTMLDivElement>(null);
  const step2AnchorRef = useRef<HTMLDivElement>(null);
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  
  const visualScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestSelectedMediaDataRef = useRef<CurrentMediaData | null>(null);
  


  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('United Kingdom');


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
  
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);


  const [currentMedia, setCurrentMedia] = useState<CurrentMediaData | null>(null);
  const [currentMediaPreviewUrl, setCurrentMediaPreviewUrl] = useState<string | null>(null);
  const [mediaToInitializeRecorder, setMediaToInitializeRecorder] = useState<MediaRecorderData | null>(null);

  const promptIdFromQuery = searchParams.get('promptId');

  useEffect(() => {
    if (memory) { 
      setTitle(memory.title || '');
      setLocation(memory.location || '');

      let initialCountryValue = 'United Kingdom'; 
      if (memory.country) {
        if (memory.country.toUpperCase() === 'UK') {
          initialCountryValue = 'United Kingdom';
        } else if (memory.country.toUpperCase() === 'USA' || memory.country.toUpperCase() === 'US') {
           initialCountryValue = 'United States';
        } else {
          const foundOption = countryOptions.find(opt => opt.value.toLowerCase() === memory.country!.toLowerCase());
          initialCountryValue = foundOption ? foundOption.value : 'United Kingdom';
        }
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
        
        const existingMediaData: CurrentMediaData = {
          file: new File([], firstMedia.filename || "existing_media", {type: firstMedia.type === 'video' ? 'video/webm' : 'audio/webm'}),
          type: firstMedia.type,
          startTime: firstMedia.startTime,
          endTime: firstMedia.endTime,
          duration: duration,
          size: size,
        };
        setCurrentMedia(existingMediaData); 
        setCurrentMediaPreviewUrl(firstMedia.url); 
        latestSelectedMediaDataRef.current = existingMediaData;

        setMediaToInitializeRecorder({ 
            file: new File([], firstMedia.filename || "existing_media", {type: firstMedia.type === 'video' ? 'video/webm' : 'audio/webm'}),
            type: firstMedia.type,
            previewUrl: firstMedia.url || '',
            startTime: firstMedia.startTime,
            endTime: firstMedia.endTime,
            duration: duration,
            size: size,
        });
      } else { 
        setCurrentMedia(null);
        setCurrentMediaPreviewUrl(null);
        latestSelectedMediaDataRef.current = null;
        setMediaToInitializeRecorder(null);
      }
    } else { 
      const promptTextFromUrl = searchParams.get('prompt');
      setTitle(promptTextFromUrl ? decodeURIComponent(promptTextFromUrl) : '');
      setLocation('');
      setCountry('United Kingdom');
      setDescription('');
      setSelectedEmotionTags([]);
      setSelectedYear(getInitialDateComponent('year'));
      setSelectedMonth(getInitialDateComponent('month'));
      setSelectedDay(getInitialDateComponent('day'));
      setCurrentMedia(null);
      setCurrentMediaPreviewUrl(null);
      latestSelectedMediaDataRef.current = null;
      setMediaToInitializeRecorder(null);
    }
  }, [memory, searchParams, getInitialDateComponent]);


  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(new Date(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const dayOptions = useMemo(() => {
    return Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  }, [daysInSelectedMonth]);

 const performVisualScroll = useCallback((slideIndex: number) => {
    if (visualScrollTimerRef.current) {
      clearTimeout(visualScrollTimerRef.current);
    }
    visualScrollTimerRef.current = setTimeout(() => {
      let targetElementRef: React.RefObject<HTMLDivElement> | null = null;
      if (slideIndex === SLIDE_INDEX_DETAILS) targetElementRef = step1AnchorRef;
      else if (slideIndex === SLIDE_INDEX_MEDIA) targetElementRef = step2AnchorRef;

      if (targetElementRef?.current) {
        const navbar = document.querySelector('header.sticky') as HTMLElement | null;
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        
        const elementRect = targetElementRef.current.getBoundingClientRect();
        const currentScrollY = window.scrollY; 
        const targetScrollY = elementRect.top + currentScrollY - navbarHeight;

        window.scrollTo({
          top: targetScrollY,
          behavior: 'auto', 
        });
      }
    }, 350); 
  }, []);


  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);


 useEffect(() => { 
    if (!carouselApi) return;
    carouselApi.scrollTo(currentSlide, true); 
    performVisualScroll(currentSlide);
  }, [currentSlide, carouselApi, performVisualScroll]);

  useEffect(() => { 
    if (!carouselApi) return;

    const handleApiEvent = () => {
      if (!carouselApi) return;
      const newSelectedSnap = carouselApi.selectedScrollSnap();
      if (newSelectedSnap !== currentSlideRef.current) {
        setCurrentSlide(newSelectedSnap);
      }
    };

    const initialSnap = carouselApi.selectedScrollSnap();
    if (initialSnap !== currentSlideRef.current) { 
      setCurrentSlide(initialSnap); 
    } else { 
      if (initialScrollTimerRef.current) clearTimeout(initialScrollTimerRef.current);
      initialScrollTimerRef.current = setTimeout(() => {
         performVisualScroll(initialSnap);
      }, 100); 
    }

    carouselApi.on("select", handleApiEvent);
    carouselApi.on("reInit", handleApiEvent);

    return () => {
      if (carouselApi) {
        carouselApi.off("select", handleApiEvent);
        carouselApi.off("reInit", handleApiEvent);
      }
      if (visualScrollTimerRef.current) clearTimeout(visualScrollTimerRef.current);
      if (initialScrollTimerRef.current) clearTimeout(initialScrollTimerRef.current);
    };
  }, [carouselApi, performVisualScroll]);


  useEffect(() => {
    if (selectedDay > daysInSelectedMonth) setSelectedDay(daysInSelectedMonth);
  }, [selectedDay, daysInSelectedMonth]);


  useEffect(() => {
    let blobUrlToRevoke: string | null = null;
    if (currentMedia && currentMedia.file.name !== "existing_media" && currentMedia.file.size > 0) {
      blobUrlToRevoke = URL.createObjectURL(currentMedia.file);
      setCurrentMediaPreviewUrl(blobUrlToRevoke);
    }
    return () => {
      if (blobUrlToRevoke && blobUrlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlToRevoke);
      }
    };
  }, [currentMedia]);


  const handleMediaReady = useCallback((mediaDataFromRecorder: MediaRecorderData) => {
    setIsProcessingMedia(true);
    const newCurrentMediaData: CurrentMediaData = {
      file: mediaDataFromRecorder.file,
      type: mediaDataFromRecorder.type,
      startTime: mediaDataFromRecorder.startTime,
      endTime: mediaDataFromRecorder.endTime,
      duration: mediaDataFromRecorder.duration,
      size: mediaDataFromRecorder.size,
    };
    latestSelectedMediaDataRef.current = newCurrentMediaData;
    setCurrentMedia(newCurrentMediaData); 
  }, []);
  
  useEffect(() => {
    if (isProcessingMedia) {
        const refData = latestSelectedMediaDataRef.current;
        if (currentMedia && refData &&
            currentMedia.file.name === refData.file.name &&
            currentMedia.type === refData.type &&
            (currentMedia.file.name === "existing_media" ? currentMedia.size === refData.size : currentMedia.file.size === refData.file.size) && 
            Math.abs((currentMedia.duration ?? 0) - (refData.duration ?? 0)) < 0.01 &&
            Math.abs((currentMedia.startTime ?? 0) - (refData.startTime ?? 0)) < 0.01 &&
            Math.abs((currentMedia.endTime ?? 0) - (refData.endTime ?? 0)) < 0.01
        ) {
            setIsProcessingMedia(false); 
        } else if (!refData && currentMedia === null) { 
            setIsProcessingMedia(false);
        }
    }
  }, [currentMedia, isProcessingMedia]);


  const handleMediaDiscardInForm = useCallback(() => { 
    setCurrentMedia(null);
    setCurrentMediaPreviewUrl(null);
    setIsProcessingMedia(false);
  }, []);
  

  const handleMediaDiscardFromChild = useCallback(() => {
    if (isEditing && memory?.mediaAttachments?.[0]?.url) {
      const firstMedia = memory.mediaAttachments[0];
      const duration = (typeof firstMedia.duration === 'number' && !isNaN(firstMedia.duration)) ? firstMedia.duration : 0;
      const size = (typeof firstMedia.size === 'number' && !isNaN(firstMedia.size)) ? firstMedia.size : 0;
      setCurrentMedia({
        file: new File([], firstMedia.filename || "existing_media", {type: firstMedia.type === 'video' ? 'video/webm' : 'audio/webm'}),
        type: firstMedia.type,
        startTime: firstMedia.startTime,
        endTime: firstMedia.endTime,
        duration: duration,
        size: size,
      });
      setCurrentMediaPreviewUrl(firstMedia.url);
       setMediaToInitializeRecorder({ 
          file: new File([], firstMedia.filename || "existing_media", {type: firstMedia.type === 'video' ? 'video/webm' : 'audio/webm'}),
          type: firstMedia.type,
          previewUrl: firstMedia.url || '',
          startTime: firstMedia.startTime,
          endTime: firstMedia.endTime,
          duration: duration,
          size: size,
      });
    } else {
      setCurrentMedia(null);
      setCurrentMediaPreviewUrl(null);
      setMediaToInitializeRecorder(null);
    }
    latestSelectedMediaDataRef.current = null; 
    setIsProcessingMedia(false);
  }, [isEditing, memory?.mediaAttachments]);

  useEffect(() => {
    const mediaElement = currentMedia?.type === 'video' ? videoPreviewRef.current : audioPreviewRef.current;
    if (mediaElement && currentMedia && currentMediaPreviewUrl && mediaElement.src === currentMediaPreviewUrl) {
      const targetTime = (currentMedia.startTime !== undefined && isFinite(currentMedia.startTime)) ? currentMedia.startTime : 0.01;
      const applyStartTime = () => {
        if (mediaElement.readyState >= 1 && targetTime <= mediaElement.duration && Math.abs(mediaElement.currentTime - targetTime) > 0.1) {
          try { mediaElement.currentTime = targetTime; } catch (error) { console.warn("Error setting currentTime:", error); }
        }
      };
      if (mediaElement.readyState >= 1) applyStartTime();
      else mediaElement.addEventListener('loadedmetadata', applyStartTime, { once: true });
      return () => mediaElement.removeEventListener('loadedmetadata', applyStartTime);
    }
  }, [currentMedia, currentMediaPreviewUrl]);

  useEffect(() => {
      if (currentSlide !== SLIDE_INDEX_MEDIA && latestSelectedMediaDataRef.current) {
        latestSelectedMediaDataRef.current = null;
      }
    }, [currentSlide]);


  const handleEmotionTagToggle = (tag: EmotionTag) => {
    setSelectedEmotionTags(prevTags =>
      prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]
    );
  };

  const triggerSubmitProcess = useCallback(() => {
    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter a title for the memory.", variant: "destructive" });
      setCurrentSlide(SLIDE_INDEX_DETAILS); 
      setTimeout(() => titleInputRef.current?.focus(), 100);
      return;
    }
    let finalDate = new Date(selectedYear, selectedMonth, 1);
    finalDate = setDate(finalDate, selectedDay);
    if (!isValid(finalDate) || getYear(finalDate) !== selectedYear || getMonth(finalDate) !== selectedMonth || getDate(finalDate) !== selectedDay) {
      toast({ title: "Invalid Date", description: "Please select a valid date.", variant: "destructive" });
      setCurrentSlide(SLIDE_INDEX_DETAILS); 
      setTimeout(() => yearSelectRef.current?.focus(), 100);
      return;
    }
    if (!description.trim()) {
      toast({ title: "Description Required", description: "Please enter a description for the memory.", variant: "destructive" });
      setCurrentSlide(SLIDE_INDEX_DETAILS); 
      setTimeout(() => descriptionTextareaRef.current?.focus(), 100);
      return;
    }
    
    const finalMediaDataForSubmission = latestSelectedMediaDataRef.current || currentMedia;

    if (!finalMediaDataForSubmission && !isEditing) { 
        toast({ title: "Media Required", description: "A media attachment (video or audio) is required for new memories.", variant: "destructive" });
        setCurrentSlide(SLIDE_INDEX_MEDIA);
        return;
    }
    if (!finalMediaDataForSubmission && isEditing && (!memory?.mediaAttachments || memory.mediaAttachments.length === 0)) {
        toast({ title: "Media Required", description: "A media attachment (video or audio) is required for this memory.", variant: "destructive" });
        setCurrentSlide(SLIDE_INDEX_MEDIA);
        return;
    }


    let mediaAttachmentsForSubmission: MediaAttachment[] | undefined = undefined;
    let mediaFileToUpload: File | undefined = undefined;

    if (finalMediaDataForSubmission) { 
      const isNewFile = finalMediaDataForSubmission.file.name !== "existing_media" && finalMediaDataForSubmission.file.size > 0;
      if (isNewFile) {
        mediaFileToUpload = finalMediaDataForSubmission.file;
      }
      const originalMediaAttachment = memory?.mediaAttachments?.[0];
      const duration = (typeof finalMediaDataForSubmission.duration === 'number' && !isNaN(finalMediaDataForSubmission.duration)) ? finalMediaDataForSubmission.duration : 0;
      const size = (typeof finalMediaDataForSubmission.size === 'number' && !isNaN(finalMediaDataForSubmission.size)) ? finalMediaDataForSubmission.size : 0;
      
      mediaAttachmentsForSubmission = [{
        id: originalMediaAttachment?.id || Date.now().toString(),
        type: finalMediaDataForSubmission.type,
        url: (isNewFile ? "placeholder_for_upload" : (memory?.mediaAttachments?.[0]?.url || currentMediaPreviewUrl || '')),
        filename: finalMediaDataForSubmission.file.name,
        startTime: finalMediaDataForSubmission.startTime,
        endTime: finalMediaDataForSubmission.endTime,
        duration: duration,
        size: size,
      }];
    } else if (isEditing && memory?.mediaAttachments && memory.mediaAttachments.length > 0) {
        mediaAttachmentsForSubmission = memory.mediaAttachments;
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
        promptId: promptIdFromQuery || memory?.promptId || undefined,
      },
      mediaFileToUpload
    );
  }, [title, selectedYear, selectedMonth, selectedDay, description, currentMedia, memory, onSubmit, currentMediaPreviewUrl, location, country, promptIdFromQuery, selectedEmotionTags, isEditing, latestSelectedMediaDataRef, setCurrentSlide]);


  const handleActionButtonClick = useCallback(() => {
    if (isParentSubmitting || isProcessingMedia) return;

    if (currentSlide === SLIDE_INDEX_DETAILS) {
      if (!title.trim()) {
        toast({ title: "Title Required", description: "Please enter a title for the memory.", variant: "destructive" });
        setTimeout(() => titleInputRef.current?.focus(), 100);
        return; 
      }
      let tempDate = new Date(selectedYear, selectedMonth, 1);
      tempDate = setDate(tempDate, selectedDay);
      if (!isValid(tempDate) || getYear(tempDate) !== selectedYear || getMonth(tempDate) !== selectedMonth || getDate(tempDate) !== selectedDay) {
        toast({ title: "Invalid Date", description: "Please select a valid date.", variant: "destructive" });
        setTimeout(() => yearSelectRef.current?.focus(), 100);
        return;
      }
      if (!description.trim()) {
        toast({ title: "Description Required", description: "Please enter a description for the memory.", variant: "destructive" });
        setTimeout(() => descriptionTextareaRef.current?.focus(), 100);
        return; 
      }
    }

    if (currentSlide === SLIDE_INDEX_DETAILS) {
      setCurrentSlide(SLIDE_INDEX_MEDIA); 
    } else if (currentSlide === SLIDE_INDEX_MEDIA) {
       const mediaSource = latestSelectedMediaDataRef.current || currentMedia;
      if (!isEditing && !mediaSource) { 
          toast({ 
              title: "Media Required", 
              description: "Please record or upload a video or audio file for Step 2 before proceeding.", 
              variant: "destructive" 
          });
          return; 
      } else if (isEditing && !mediaSource && (!memory?.mediaAttachments || memory.mediaAttachments.length === 0)) {
           toast({ 
              title: "Media Required", 
              description: "Please record or upload a video or audio file for Step 2 before proceeding.", 
              variant: "destructive" 
          });
          return;
      }
      triggerSubmitProcess(); 
    }
  }, [
    isParentSubmitting, isProcessingMedia, currentSlide, title, description, selectedYear, selectedMonth, selectedDay,
    isEditing, triggerSubmitProcess, currentMedia, latestSelectedMediaDataRef, setCurrentSlide, memory?.mediaAttachments
  ]);

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleActionButtonClick(); 
  };

  let actionButtonText = 'Next';
  let ActionButtonIcon: React.ElementType = ArrowRight;

  if (currentSlide === SLIDE_INDEX_DETAILS) {
    actionButtonText = 'Next';
    ActionButtonIcon = ArrowRight;
  } else if (currentSlide === SLIDE_INDEX_MEDIA) {
    if (isEditing) {
      actionButtonText = 'Save Changes';
    } else { 
      actionButtonText = 'Add Memory';
    }
    ActionButtonIcon = Sparkles; 
  }

  const initialMediaForRecorderProp = useMemo(() => {
    if (isEditing && memory?.mediaAttachments && memory.mediaAttachments.length > 0) {
      const firstMedia = memory.mediaAttachments[0];
      const duration = (typeof firstMedia.duration === 'number' && !isNaN(firstMedia.duration)) ? firstMedia.duration : 0;
      const size = (typeof firstMedia.size === 'number' && !isNaN(firstMedia.size)) ? firstMedia.size : 0;
      return {
        file: new File([], firstMedia.filename || "existing_media", {type: firstMedia.type === 'video' ? 'video/webm' : 'audio/webm'}),
        type: firstMedia.type,
        previewUrl: firstMedia.url || '',
        startTime: firstMedia.startTime,
        endTime: firstMedia.endTime,
        duration: duration,
        size: size,
      };
    }
    return undefined; 
  }, [memory, isEditing]); 

  const currentPromptIdForTeleprompter = promptIdFromQuery || memory?.promptId;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: false }} className="w-full max-w-3xl mx-auto py-4">
        <CarouselContent>
          <CarouselItem>
            <div ref={step1AnchorRef} />
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{memory ? 'Edit Chapter' : 'New Chapter'} (Step {SLIDE_INDEX_DETAILS + 1} of {TOTAL_SLIDES})</CardTitle>
                <CardDescription>Capture the details of your moment. Fields marked with * are mandatory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="title" >Title *</Label>
                  <Input ref={titleInputRef} id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Summer Vacation in Italy" />
                </div>
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="year-select" className="sr-only">Year</Label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger id="year-select" ref={yearSelectRef}><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="month-select" className="sr-only">Month</Label>
                      <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                        <SelectTrigger id="month-select"><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="day-select" className="sr-only">Day</Label>
                      <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
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
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger id="country-select"><SelectValue placeholder="Select Country" /></SelectTrigger>
                            <SelectContent>{countryOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea ref={descriptionTextareaRef} id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your memory..." rows={4} required/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emotion-tags"><Tag className="inline-block mr-1 h-4 w-4" />Emotion Tags (Optional)</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {emotionTagsList.map((tag) => (
                      <Button type="button" key={tag} variant={selectedEmotionTags.includes(tag) ? 'default' : 'outline'} size="sm" onClick={() => handleEmotionTagToggle(tag)} className="text-xs h-auto py-1 px-2">
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
          <CarouselItem>
            <div ref={step2AnchorRef} />
            <Card className="w-full">
              <CardHeader>
                  <CardTitle className="font-headline text-lg">Media Attachment for {title ? `"${title}"` : 'this chapter'} * (Step {SLIDE_INDEX_MEDIA + 1} of {TOTAL_SLIDES})</CardTitle>
                  {!(currentMedia && currentMediaPreviewUrl) && <CardDescription>Record or upload a video/audio for your memory.</CardDescription>}
              </CardHeader>
              <CardContent>
                  {currentMedia && currentMediaPreviewUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                          <p className="text-sm font-medium flex items-center"><Paperclip className="mr-2 h-5 w-5 inline-block" />Attached Media</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Type: {currentMedia.type}</p>
                      <p className="text-sm text-muted-foreground">Filename: {currentMedia.file.name}</p>
                      {currentMedia.type === 'video' && (<video ref={videoPreviewRef} src={currentMediaPreviewUrl} controls className="w-full aspect-video rounded-md mt-2 bg-muted" key={currentMediaPreviewUrl} preload="auto"/>)}
                      {currentMedia.type === 'audio' && (<audio ref={audioPreviewRef} src={currentMediaPreviewUrl} controls className="w-full mt-2" key={currentMediaPreviewUrl} preload="auto"/>)}
                      <p className="text-sm text-muted-foreground mt-1">Duration: {formatSecondsToTime(currentMedia.duration)}</p>
                      {currentMedia.startTime !== undefined && <p className="text-sm text-muted-foreground">Trim Start: {formatSecondsToTime(currentMedia.startTime)}</p>}
                      {(currentMedia.endTime !== undefined && currentMedia.duration !== undefined && Math.abs(currentMedia.duration - currentMedia.endTime) > 0.01) && <p className="text-sm text-muted-foreground">Trim End: {formatSecondsToTime(currentMedia.endTime)}</p>}
                      <Button variant="outline" type="button" onClick={handleMediaDiscardInForm} className="w-full mt-2">Change Media or Re-trim</Button>
                    </div>
                  ) : ( 
                    <MediaCaptureControl 
                        key={hostPassStatus + (initialMediaForRecorderProp?.previewUrl || 'new') + (initialMediaForRecorderProp?.startTime?.toString() || '') + (initialMediaForRecorderProp?.endTime?.toString() || '')}
                        onMediaReady={handleMediaReady} 
                        onDiscard={handleMediaDiscardFromChild} 
                        initialMedia={initialMediaForRecorderProp} 
                        promptIdForTeleprompter={currentPromptIdForTeleprompter}
                        chapterTitleForTeleprompter={title}
                    /> 
                  )}
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
      
      <div className="max-w-3xl mx-auto flex justify-between items-center pt-4 px-1 sm:px-0">
        <Button 
          type="button" 
          onClick={() => {
            if (currentSlide === SLIDE_INDEX_DETAILS) {
              router.back();
            } else if (currentSlide > 0) {
              setCurrentSlide(currentSlide - 1);
            }
          }}
          disabled={!!isParentSubmitting || isProcessingMedia}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button" 
          onClick={handleActionButtonClick}
          disabled={
            !!isParentSubmitting || 
            isProcessingMedia
          }
        >
          {(isParentSubmitting || isProcessingMedia) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <ActionButtonIcon className="mr-2 h-4 w-4" />
          {actionButtonText}
        </Button>
      </div>
    </form>
  );
}

