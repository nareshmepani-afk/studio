'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MemoryForm } from './MemoryForm';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Video, Disc, Square, AlertTriangle, UploadCloud, CheckCircle2, Scissors, 
  Play, Pause, Camera, Loader2, Mic2, MessageSquare, Volume2, Sparkles, 
  UserCircle, Languages, Layout, Zap, Settings2, RefreshCw, CheckCircle, 
  Rocket, PenTool, Mic, MapPin, Calendar, Tag, ArrowRight, ArrowLeft, 
  Film as FilmIcon, BrainCircuit, Maximize2, Minus, Plus, ChevronRight, ChevronLeft,
  Lock
} from 'lucide-react';
import { generateInterviewQuestion, analyzeFraming } from '@/actions/aiWeaver';
import { synthesizeStudioSpeech } from '@/actions/studio-vocal';
import { useCamera } from '@/hooks/useCamera';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { useAudioLevel } from '@/hooks/use-audio-level';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import DirectorsNotepad from './DirectorsNotepad';
import { generateDirectorsNotepad } from '@/actions/aiWeaver';
import { ProductionControlBar } from './ProductionControlBar';
import CinemaStageSwitch from './CinemaStageSwitch';
import { Memory } from '@/types';
import CinemaPoster from '../memory/CinemaPoster';
import { CinemaMonitor } from './CinemaMonitor';
import { useStudioState } from '@/hooks/studio/useStudioState';

interface RoomProps {
    data: Memory;
    update: (updatedData: Partial<Memory> | ((prev: Partial<Memory>) => Partial<Memory>)) => void;
    modality?: 'pen' | 'voice' | null;
    setModality?: (val: 'pen' | 'voice' | null) => void;
    onWordCountChange?: (count: number) => void;
    currentStage?: number;
    mentorActive?: boolean;
    onToggleMentor?: (manual?: boolean) => void;
    onClarityChange?: (clarity: number) => void;
    onNext?: () => void;
    onPrev?: () => void;
    isComplete?: boolean;
    charge?: number;
    wordCount?: number;
    highlightClarity?: boolean;
    onboardingJustClosed?: boolean;
    isUntouched?: boolean;
    onActivity?: () => void;
    formRef?: React.RefObject<any>;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function SoloStage({ 
  data, update, modality, setModality, onWordCountChange, 
  currentStage, mentorActive, onToggleMentor, onClarityChange,
  onNext, onPrev, isComplete, charge, wordCount, highlightClarity,
  onboardingJustClosed, isUntouched, onActivity, formRef
}: RoomProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 100]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);

  // MOD-12: AI Interviewer State
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [interviewLanguage, setInterviewLanguage] = useState<'en' | 'gu'>('en');
  const [isFluidMode, setIsFluidMode] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('Achird');
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isAnalyzingFraming, setIsAnalyzingFraming] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState<string[]>([]);
  
  // MOD-13: Sound Check State
  const [showSoundCheck, setShowSoundCheck] = useState(false);
  const [hasDoneMicFeedback, setHasDoneMicFeedback] = useState(false);
  
  // MOD-14: Cinematic Polish State
  const [prompterSize, setPrompterSize] = useState<'sm' | 'md' | 'lg'>('md');

  const stageRef = useRef<HTMLDivElement>(null);
  const { isReviewing, isProductionLocked, actions: globalActions } = useStudioState();
  
  // Cinematic Pipeline State (Shared via Firestore)
  // BUGFIX: Prioritize global stage from prop, but allow local data fallback ONLY if prop is undefined.
  // We use currentStage prop as the source of truth from ProductionDeck.
  const productionStage = currentStage ?? (data?.productionStage || 0);
  const [isPersistenceSaving, setIsPersistenceSaving] = useState(false);
  
  const setProductionStage = (stage: number) => {
    console.log(`[SoloStage] Advancing to Stage: ${stage}`);
    update((prev: any) => ({ ...prev, productionStage: stage }));
    globalActions.setStage(stage);
  };



  // 1. Initialize local Camera stream (Only when explicitly enabled)
  const { stream, error } = useCamera({ enabled: isCameraActive });
  
  // 2. Bind the robust MediaRecorder Hook
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    recordingTime, 
    isWarningLimit,
    recordedBlob,
    clearRecording,
    uploadVideo,
    uploadMediaBlob,
    uploading, 
    uploadProgress, 
    uploadResult 
  } = useMediaRecorder(stream);

  const micLevel = useAudioLevel(stream);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Mount Stream to Live Video Element
  useEffect(() => {
    if (videoRef.current && stream && !recordedBlob) {
      videoRef.current.srcObject = stream;
    }
    
    // Auto-trigger sound check on initialization in Stage 1 (Recording)
    if (stream && !recordedBlob && !isRecording && !showSoundCheck && !data?.videoUrl && productionStage === 1 && !hasDoneMicFeedback) {
      setShowSoundCheck(true);
      setHasDoneMicFeedback(true);
    }
  }, [stream, recordedBlob, isRecording, showSoundCheck, data?.videoUrl, productionStage, hasDoneMicFeedback]);

  // Auto-advance to Stage 2 (Notepad) when recording completes
  useEffect(() => {
    if (recordedBlob && productionStage === 1) {
      setProductionStage(2);
    }
  }, [recordedBlob, productionStage]);

  // NEW: Manage camera activation based on active Production Stage (Stage 1/Weave & Stage 2/Recording)
  useEffect(() => {
    if ((productionStage === 1 || productionStage === 2) && !isCameraActive && !recordedBlob) {
      setIsCameraActive(true);
    } else if (productionStage !== 1 && productionStage !== 2 && isCameraActive) {
      setIsCameraActive(false);
    }
  }, [productionStage, isCameraActive, recordedBlob]);

  const handleReattemptAccess = useCallback(() => {
    setIsCameraActive(false);
    setTimeout(() => {
      setIsCameraActive(true);
    }, 150);
  }, []);

  // Phase 3 Preview Local URL
  const previewUrl = useMemo(() => {
    return recordedBlob ? URL.createObjectURL(recordedBlob) : null;
  }, [recordedBlob]);

  const togglePreviewPlay = () => {
    if (previewVideoRef.current) {
      if (isPlaying) {
        previewVideoRef.current.pause();
      } else {
        previewVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSaveMemory = async () => {
    if (recordedBlob && data?.id) {
      // "Soft-Clip": Inject raw numeric timestamps into Firebase payload!
      update({
        trimStart: trimRange[0],
        trimEnd: trimRange[1],
      });
      
      try {
        const url = await uploadVideo(recordedBlob, data.id);
        if (url) {
          update({
            trimStart: trimRange[0],
            trimEnd: trimRange[1],
            videoUrl: url,
            status: 'completed'
          });

          toast.success("Memory Secured", {
            description: "Footage uploaded. Director's analysis starting..."
          });
        }
      } catch (err) {
        console.error("Upload transmission failed.", err);
        toast.error("Upload Failed", { description: "The vault is currently closed. Please try again." });
      }
    } else {
      console.warn("Save requested but missing a valid Blob or Memory ID.");
    }
  };

  const [isCapturingThumbnail, setIsCapturingThumbnail] = useState(false);

  // SNAPSHOT: Capture current frame as thumbnail
  const handleCaptureThumbnail = async () => {
    if (!previewVideoRef.current || !data?.id) return;
    
    setIsCapturingThumbnail(true);
    try {
      const video = previewVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
         const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
         if (blob) {
            const url = await uploadMediaBlob(blob, data.id);
            if (url) {
               update({ posterImageUrl: url }); // STANDARDIZE: Use posterImageUrl globally
               toast.success("Poster Updated", { 
                 description: "This frame is now your cinematic poster image.",
                 icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
               });
            }
         }
      }
    } catch (e) {
      console.error("Snapshot capture failed:", e);
    } finally {
      setIsCapturingThumbnail(false);
    }
  };

  // MOD-12: Vocal Engine
  const playAudio = useCallback((base64: string) => {
    // PREMIUM: Natural Pause (Realism Injection)
    setTimeout(() => {
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audio.play();
    }, 600); 
  }, []);

  const triggerNextQuestion = async () => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    
    // Ensure Interviewer role uses language-appropriate voices
    const interviewerVoice = interviewLanguage === 'gu' ? selectedVoice : 'Achird';
    
    try {
      const question = await generateInterviewQuestion(
        data?.prose || '', 
        interviewHistory,
        interviewLanguage,
        isFluidMode ? 'fluid' : 'strict'
      );
      
      if (question) {
        setCurrentQuestion(question);
        setInterviewHistory(prev => [...prev, `AI: ${question}`]);
        
        const audio = await synthesizeStudioSpeech(question, interviewerVoice);
        if (audio) {
          playAudio(audio);
        }
      }
    } catch (err) {
      console.error("Interviewer Error:", err);
      toast.error("Vocal Bridge Interrupted");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCheckFraming = async () => {
    if (!videoRef.current || isAnalyzingFraming || isSynthesizing) return;
    
    setIsAnalyzingFraming(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        const feedback = await analyzeFraming(imageBase64, interviewLanguage);
        if (feedback) {
          toast.info("Director Analysis", { description: feedback });
          const interviewerVoice = interviewLanguage === 'gu' ? selectedVoice : 'Achird';
          const audio = await synthesizeStudioSpeech(feedback, interviewerVoice);
          if (audio) playAudio(audio);
        }
      }
    } catch (err) {
      console.error("Framing Analysis Error:", err);
    } finally {
      setIsAnalyzingFraming(false);
    }
  };

  // Intelligent Mic Feedback
  useEffect(() => {
    if (showSoundCheck && micLevel < 10 && !hasDoneMicFeedback && !isSynthesizing) {
       const timer = setTimeout(async () => {
         if (micLevel < 10) {
            const lowMicPrompt = interviewLanguage === 'gu' 
              ? "માફ કરશો, હું તમને સાંભળી શકતો નથી. શું તમે તમારા માઇકને તપાસો છો અથવા થોડા નજીક જશો?"
              : "I'm having a little trouble hearing you. Could you check your mic or move slightly closer?";
            
            const interviewerVoice = interviewLanguage === 'gu' ? selectedVoice : 'Achird';
            const audio = await synthesizeStudioSpeech(lowMicPrompt, interviewerVoice);
            if (audio) playAudio(audio);
            setHasDoneMicFeedback(true);
         }
       }, 3000);
       return () => clearTimeout(timer);
    }
  }, [showSoundCheck, micLevel, hasDoneMicFeedback, isSynthesizing, interviewLanguage, selectedVoice, playAudio]);

  const handleNarratePoetic = async () => {
    const poeticText = data?.aiTakes?.poetic;
    if (!poeticText || isSynthesizing) return;
    
    setIsSynthesizing(true);
    try {
      // Storyteller role uses Achernar (Deep/Narrative)
      const audio = await synthesizeStudioSpeech(poeticText, 'Achernar');
      if (audio) {
        playAudio(audio);
        toast.success("Achernar is reading your Poetic Take");
      }
    } catch (err) {
      console.error("Narration Error:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };


  // UPLOAD: Select file from computer as poster
  const handleUploadPoster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data?.id) return;

    if (!file.type.startsWith('image/')) {
        toast.error("Invalid File", { description: "Please upload an image for the poster." });
        return;
    }

    try {
        const url = await uploadMediaBlob(file, data.id);
        if (url) {
            update({ posterImageUrl: url });
            toast.success("Portrait Uploaded!", {
                description: "Your uploaded image is now the cinematic poster.",
                icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
            });
        }
    } catch (e) {
        console.error("Poster upload failed:", e);
        toast.error("Upload Failed");
    }
  };

  const handlePreviewTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const vid = e.currentTarget;
    const currentTime = vid.currentTime;
    
    // Safety check just in case Infinity slipped through
    if (videoDuration === 0 || !isFinite(videoDuration)) return;

    if (currentTime < trimRange[0]) vid.currentTime = trimRange[0];
    if (currentTime > trimRange[1]) {
      vid.pause();
      vid.currentTime = trimRange[0];
    }
  };

  const shieldedUpdate = useCallback((updatedDataOrFn: Partial<Memory> | ((prev: Partial<Memory>) => Partial<Memory>)) => {
    update((prev: Partial<Memory>) => {
      const resolved = typeof updatedDataOrFn === 'function' ? updatedDataOrFn(prev) : updatedDataOrFn;
      return {
          ...prev,
          ...resolved,
          cameraActive: isCameraActive,
      };
    });
  }, [update, isCameraActive]);

  // --- SUB-RENDERERS FOR 5-ACT JOURNEY ---
  
  const renderIncitingMemory = () => (
    <div className="max-w-5xl mx-auto w-full pb-2 transition-all duration-700">
      <MemoryForm ref={formRef} 
        data={data} 
        update={shieldedUpdate} 
        productionStage={0} 
        setProductionStage={setProductionStage}
        modality={modality}
        setModality={setModality}
        onWordCountChange={onWordCountChange}
        mentorActive={mentorActive}
        onToggleMentor={onToggleMentor}
        onClarityChange={onClarityChange}
        highlightClarity={highlightClarity}
        onboardingJustClosed={onboardingJustClosed}
        isUntouched={isUntouched}
        onActivity={onActivity}
      />
    </div>
  );

  const renderWeave = () => (
    <div className={cn(
      "w-full pb-2 transition-all duration-1000",
      data?.structuredScript ? "max-w-[95vw] xl:max-w-screen-2xl mx-auto h-[calc(100vh-180px)]" : "max-w-4xl mx-auto"
    )}>
      {/* PERSISTENCE MANTLE: Keep MemoryForm mounted for flush stability */}
      <div className={cn("w-full h-full", (data?.structuredScript && !isProductionLocked) ? "hidden" : "block")}>
        <MemoryForm ref={formRef} 
          data={data} 
          update={shieldedUpdate} 
          productionStage={1} 
          setProductionStage={setProductionStage}
          forceAct="weave" 
          modality={modality}
          setModality={setModality}
          onWordCountChange={onWordCountChange}
          mentorActive={mentorActive}
          onToggleMentor={onToggleMentor}
          onClarityChange={onClarityChange}
          highlightClarity={highlightClarity}
          onActivity={onActivity}
          onSavingChange={setIsPersistenceSaving}
        />
      </div>

      {data?.structuredScript && isReviewing && (
        <CinemaMonitor 
          structuredScript={data.structuredScript} 
          onActivity={onActivity}
          onNext={onNext}
          onBackToEditor={() => globalActions.setIsReviewing(false)}
          isProductionLocked={isProductionLocked}
          onUnlock={() => {
            console.log("[SoloStage] Unlocking production lock via CinemaMonitor HUD");
            globalActions.setIsProductionLocked(false);
            update({ isProductionLocked: false });
          }}
          isSaving={isPersistenceSaving}
        />
      )}
    </div>
  );

  const renderRecording = () => (
    <div className="w-full h-full flex flex-col items-center justify-center relative pb-24">
       <div className={`w-full max-w-[90vw] xl:max-w-7xl aspect-video relative bg-black border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-1000 ${isRecording ? 'ring-2 ring-rose-500/50 shadow-[0_0_120px_rgba(244,63,94,0.3)] scale-[1.01]' : 'shadow-2xl'}`}>
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="absolute inset-0 w-full h-full object-cover z-0 grayscale-[0.2] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 z-10 pointer-events-none" />
          
          {/* Cinematic Teleprompter Overlay */}
          <motion.div 
            animate={{ 
              width: prompterSize === 'sm' ? 320 : prompterSize === 'md' ? 480 : 720,
              height: prompterSize === 'sm' ? 300 : prompterSize === 'md' ? 500 : 700
            }}
            className="absolute top-10 right-10 z-30 bg-black/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[2rem] shadow-2xl group/points transition-all duration-700 hover:bg-black/60 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`} />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Stage Prompt // v2.0</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPrompterSize(prev => prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'sm')}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <div className="grow w-px h-4 bg-white/10 mx-1" />
                <div className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5 text-[8px] font-bold text-white/20 uppercase">Encrypted</div>
              </div>
            </div>
            <div className="flex-grow flex gap-8 overflow-hidden min-h-0">
              {/* Main Script Area */}
              <div className={cn(
                "flex-grow pr-4 custom-scrollbar scroll-smooth overflow-y-auto font-medium text-white/95 leading-relaxed italic",
                prompterSize === 'sm' ? 'text-sm' : prompterSize === 'md' ? 'text-lg' : 'text-2xl'
              )}>
                {data?.prose ? (
                  <div dangerouslySetInnerHTML={{ __html: data.prose }} className="prose-invert opacity-90 first-letter:text-4xl first-letter:font-black first-letter:mr-2 first-letter:float-left select-none" />
                ) : (
                  <div className="text-white/20 text-sm font-black uppercase tracking-widest text-center py-20 flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
                    Awaiting Narrative Weave...
                  </div>
                )}
              </div>

              {/* Directorial Sidebar (Conditional) */}
              {data?.structuredScript && prompterSize !== 'sm' && (
                <div className="w-64 flex-none border-l border-white/5 pl-8 space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sky-400/60">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Beat Sheet</span>
                    </div>
                    {data.structuredScript.beatSheet.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 group/beat">
                        <div className="w-1 h-1 rounded-full bg-sky-500/30 mt-1.5 group-hover/beat:bg-sky-400 transition-colors" />
                        <p className="text-[10px] font-bold text-white/50 leading-tight group-hover/beat:text-sky-300 transition-colors">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400/60">
                      <Video className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Live Cues</span>
                    </div>
                    {data.structuredScript.stageDirections.slice(0, 3).map((dir, i) => (
                      <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 hover:bg-white/10 transition-all">
                        <div className="flex items-center justify-between">
                           <span className="text-[8px] font-black text-emerald-400/60 uppercase">{dir.type}</span>
                           <span className="text-[8px] font-mono text-white/20">{dir.timecode}</span>
                        </div>
                        <p className="text-[10px] text-white/50 leading-snug">{dir.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center shrink-0">
               <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Master Production Reel</span>
               <div className="flex gap-1">
                 {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white/10" />)}
               </div>
            </div>
          </motion.div>

          {/* Cinematic Camera Overlays (Safe Areas/REC) */}
          <div className="absolute inset-0 z-20 pointer-events-none border-[40px] border-transparent">
             {/* Corner Accents */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-xl" />
             <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-xl" />
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-xl" />
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-xl" />
             
             {/* Safe Area Guides */}
             <div className="absolute inset-8 border border-dashed border-white/5 rounded-2xl" />
             
             {/* REC Indicator */}
             <AnimatePresence>
               {isRecording && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(244,63,94,0.4)]"
                 >
                   <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                   On Air • Recording
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <div className="absolute inset-0 z-20 flex flex-col justify-between p-10 w-full mx-auto pointer-events-none">
             <div className="flex justify-between items-start w-full pointer-events-auto">
               <AnimatePresence>
                 {isRecording ? (
                   <motion.div 
                     key="recording"
                     initial={{ opacity: 0, y: -20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`flex items-center gap-3 px-4 py-2 rounded-full font-mono font-bold tracking-widest backdrop-blur-md border ${isWarningLimit ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-rose-500/20 border-rose-500 text-rose-200'}`}
                   >
                     <motion.div 
                       initial={{ opacity: 1 }}
                       animate={{ opacity: [1, 0, 1] }} 
                       transition={{ repeat: Infinity, duration: 1.5 }} 
                       className={`w-3 h-3 rounded-full ${isWarningLimit ? 'bg-amber-400' : 'bg-rose-500'}`} 
                     />
                     {formatTime(recordingTime)}
                   </motion.div>
                 ) : (
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-white/50 backdrop-blur-md text-xs">
                     <Disc className="w-3.5 h-3.5" /> STUDIO READY
                   </div>
                 )}
               </AnimatePresence>
             </div>

             <div 
               ref={stageRef}
               data-blueprint="SoloStage:StageArea"
               className={cn(
                 "flex-1 relative min-h-0 flex flex-col items-center justify-start py-20 px-8 transition-all duration-700",
                 "overflow-y-auto custom-scrollbar",
                 modality === null ? "opacity-0 scale-95" : "opacity-100 scale-100"
               )}
             >
                <AnimatePresence>
                  {isInterviewMode && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full bg-slate-950/70 backdrop-blur-3xl border border-sky-500/30 rounded-[2.5rem] p-8 shadow-2xl text-center pointer-events-auto">
                        <p className="text-xl font-headline text-white leading-relaxed mb-6 italic">"{currentQuestion || 'Ready to start the interview...'}"</p>
                        <div className="flex items-center gap-4 justify-center">
                           <button onClick={triggerNextQuestion} disabled={isSynthesizing} className="px-6 py-3 bg-sky-500 text-slate-950 font-black rounded-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50">
                              <MessageSquare className="w-4 h-4" /> Next Question
                           </button>
                           <button onClick={handleCheckFraming} disabled={isAnalyzingFraming} className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50">
                              <Layout className="w-4 h-4 text-emerald-400" /> Check Shot
                           </button>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <div className="flex justify-between items-center w-full px-12 pb-6 pointer-events-auto">
                <button onClick={() => setIsInterviewMode(!isInterviewMode)} className={`px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${isInterviewMode ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-black/40 border-white/10 text-white/40'}`}>
                   {isInterviewMode ? 'Interviewer Active' : 'Start Interview'}
                </button>

                {!isRecording ? (
                  <button onClick={startRecording} disabled={!stream || uploading} className="w-20 h-20 rounded-full bg-white/10 border-4 border-white/40 hover:border-rose-500 hover:bg-rose-500/20 transition-all flex items-center justify-center group">
                    <div className="w-6 h-6 rounded-full bg-rose-500 group-hover:scale-125 transition-all" />
                  </button>
                ) : (
                  <button onClick={() => { stopRecording(); setIsCameraActive(false); }} className="w-20 h-20 rounded-full bg-rose-500/20 border-4 border-rose-500 hover:bg-rose-500 transition-all flex items-center justify-center">
                    <Square className="w-6 h-6 text-white fill-current" />
                  </button>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <Volume2 className="w-4 h-4 text-white/40" />
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <motion.div className="h-full bg-emerald-500" animate={{ width: `${micLevel}%` }} />
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {error ? (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar">
               {/* Premium Warning Lock Icon */}
               <div className="relative mb-6">
                 <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
                 <div className="relative w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Lock className="w-8 h-8" />
                 </div>
               </div>

               {/* Title */}
               <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2 text-center">
                 Optics & Mic Locked
               </h3>
               
               {/* Subtitle */}
               <p className="text-sm text-white/60 max-w-md text-center leading-relaxed mb-6">
                 To record your cinematic memory, browser access to your camera and microphone is required. Your stream is processed entirely locally.
               </p>

               {/* Step-by-Step Instructions */}
               <div className="w-full max-w-xl bg-white/[0.02] border border-white/5 rounded-3xl p-6 mb-6 text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">How to Unlock Permissions</span>
                     <span className="text-[9px] font-mono text-rose-500/80 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10 uppercase">Required</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                     {/* Chrome/Edge Instruction */}
                     <div className="space-y-2">
                        <div className="font-bold text-white flex items-center gap-2">
                           <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                           Chrome / Edge / Firefox
                        </div>
                        <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                           <li>Click the <strong className="text-white font-semibold">Lock Icon 🔒</strong> next to the URL in the address bar.</li>
                           <li>Toggle <strong className="text-white font-semibold">Camera</strong> and <strong className="text-white font-semibold">Microphone</strong> to <strong className="text-emerald-400 font-semibold">Allow</strong>.</li>
                        </ul>
                     </div>

                     {/* Safari Instruction */}
                     <div className="space-y-2">
                        <div className="font-bold text-white flex items-center gap-2">
                           <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                           Apple Safari
                        </div>
                        <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                           <li>Click <strong className="text-white font-semibold">Safari</strong> in the menu bar, then <strong className="text-white font-semibold">Settings for This Website...</strong></li>
                           <li>Set both <strong className="text-white font-semibold">Camera</strong> and <strong className="text-white font-semibold">Microphone</strong> to <strong className="text-emerald-400 font-semibold">Allow</strong>.</li>
                        </ul>
                     </div>
                  </div>

                  <p className="text-[10px] text-white/30 text-center italic pt-2 border-t border-white/5">
                     Tip: You may need to refresh the browser if permissions don't apply immediately.
                  </p>
               </div>

               {/* Action Buttons */}
               <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center">
                  {/* Re-attempt Access Button */}
                  <button 
                     onClick={handleReattemptAccess}
                     className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl hover:scale-102 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-98 transition-all flex items-center justify-center gap-2 group"
                  >
                     <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                     Re-attempt Access
                  </button>

                  {/* Go Back Button */}
                  <button 
                     onClick={() => {
                        // Retreat to Scribing (Stage 0)
                        setProductionStage(0);
                     }}
                     className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white font-bold text-[11px] uppercase tracking-widest rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                     Go Back
                  </button>
               </div>
            </div>
          ) : !isCameraActive && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
               <Video className="w-16 h-16 text-white/20 mb-6" />
               <h3 className="text-xl font-bold text-white mb-2">Camera Offline</h3>
               <button onClick={() => setIsCameraActive(true)} className="px-8 py-3 bg-white text-black font-bold rounded-full">Initialize optics</button>
            </div>
          )}
       </div>

       <AnimatePresence>
          {showSoundCheck && stream && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
                <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[3rem] p-10 text-center shadow-2xl">
                   <div className={`p-6 rounded-full border-4 mx-auto w-24 mb-8 ${micLevel > 15 ? 'bg-emerald-500/20 border-emerald-500' : 'bg-rose-500/10 border-rose-500/30'}`}>
                      <Mic2 className={`w-10 h-10 ${micLevel > 15 ? 'text-emerald-400' : 'text-rose-400'}`} />
                   </div>
                   <h2 className="text-2xl font-black text-white mb-4 uppercase">Sound Check</h2>
                   <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-8">
                      <motion.div className={`h-full ${micLevel > 15 ? 'bg-emerald-500' : 'bg-rose-500'}`} animate={{ width: `${micLevel}%` }} />
                   </div>
                   <button onClick={() => setShowSoundCheck(false)} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl uppercase tracking-widest">Enter Studio</button>
                </div>
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );

  const renderNotepad = () => (
    <div className="w-full max-w-[95vw] xl:max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-8 pb-24 h-[calc(100vh-140px)]">
       <div className="w-full lg:w-1/2 flex flex-col gap-8 h-full">
          <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative group">
             {previewUrl ? (
                <video 
                  ref={previewVideoRef}
                  src={previewUrl}
                  onTimeUpdate={handlePreviewTimeUpdate}
                  className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
                />
             ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/10 font-black uppercase tracking-[0.5em] text-xs">Awaiting Development Reel...</div>
             )}
              {/* Playback Overlay */}
              <div className="absolute bottom-8 left-8 right-8 z-20 flex items-center gap-6 p-4 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500">
                <button onClick={togglePreviewPlay} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-all">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <div className="flex-1">
                   <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Master Reel Progress</span>
                      <span className="font-mono text-[10px] text-emerald-400">{formatTime(trimRange[0])} / {formatTime(videoDuration)}</span>
                   </div>
                    <div className="relative pt-2">
                       <Slider 
                          value={trimRange} 
                          onValueChange={(val) => setTrimRange(val as [number, number])}
                          min={0}
                          max={videoDuration || 100}
                          step={0.1}
                       />
                       {/* Beat Markers Overlay */}
                       <div className="absolute top-0 left-0 right-0 h-4 pointer-events-none">
                          {videoDuration > 0 && data?.emotionalBeats?.map((beat: any, idx: number) => {
                             const percent = (beat.time / videoDuration) * 100;
                             if (percent > 100) return null;
                             return (
                               <motion.div 
                                 key={idx}
                                 initial={{ scale: 0 }}
                                 animate={{ scale: 1 }}
                                 className="absolute w-1 h-3 bg-emerald-500/60 rounded-full"
                                 style={{ left: `${percent}%`, top: '8px' }}
                                 title={beat.label}
                               />
                             );
                          })}
                       </div>
                    </div>
                </div>
              </div>
          </div>
          
          <div className="flex-1 bg-white/[0.02] border border-white/5 p-12 rounded-[3rem] flex flex-col justify-center items-center text-center space-y-6">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Camera className="w-6 h-6 text-emerald-400" />
             </div>
             <div>
                <h3 className="text-xl font-headline text-white italic mb-2">Cinematic Visualization</h3>
                <p className="text-xs text-white/30 max-w-xs uppercase tracking-widest font-bold leading-relaxed">Capture a frame from your reel to anchor the theatrical showcase poster.</p>
             </div>
             <button 
                onClick={handleCaptureThumbnail} 
                disabled={isCapturingThumbnail} 
                className="px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
             >
                {isCapturingThumbnail ? 'Capturing Snapshot...' : 'Snap Production Frame'}
             </button>
          </div>
       </div>

       <div className="w-full lg:w-1/2 bg-black/40 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl h-full">
          <div className="h-full overflow-y-auto custom-scrollbar">
            <DirectorsNotepad 
              userId={data?.userId}
              memoryId={data?.id}
              data={data} 
              update={update} 
              onSave={handleSaveMemory}
              isSaving={uploading}
            />
          </div>
       </div>
    </div>
  );

  const renderShowcase = () => (
    <div className="max-w-6xl mx-auto w-full pt-10 pb-32 space-y-16">
       <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 1 }}
         className="text-center space-y-6"
       >
          <div className="flex items-center justify-center gap-4 text-emerald-400 font-black text-[10px] uppercase tracking-[0.8em] mb-4">
            <div className="w-12 h-px bg-emerald-500/30" />
            Premiere: Act V
            <div className="w-12 h-px bg-emerald-500/30" />
          </div>
          <h2 className="text-7xl font-serif text-white/90 italic leading-tight tracking-tighter">Your Memory, Immortalized.</h2>
          <p className="text-white/40 text-xl font-serif italic max-w-2xl mx-auto leading-relaxed">
            The weave is complete. Your story has been transformed from a fleeting thought into a cinematic treasure.
          </p>
       </motion.div>
       
       <div className="flex flex-col lg:flex-row gap-20 items-center justify-center">
          {/* THE POSTER (LEFT) */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, rotateY: 20 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            className="relative group perspective-2000"
          >
             <div className="absolute -inset-20 bg-sky-500/10 blur-[120px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
             <div className="relative z-10">
                <CinemaPoster memory={data} />
             </div>
             
             {/* Filmic Reflections */}
             <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden opacity-30">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-2000" />
             </div>
          </motion.div>

          {/* PRODUCTION STATS & ACTIONS (RIGHT) */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="flex-1 space-y-10 max-w-md text-left"
          >
             <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                   <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                   </div>
                   <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest mb-1">Negative Mastered</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">All visual and auditory catalysts have been processed into the final narrative weave.</p>
                   </div>
                </div>

                <div className="flex items-start gap-6 group">
                   <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-sky-500/10 group-hover:border-sky-500/30 transition-all">
                      <BrainCircuit className="w-7 h-7 text-sky-400" />
                   </div>
                   <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest mb-1">AI Metadata Synced // VERIFIED</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">Emotional beats and entity mapping have been secured for the global cinematic archive.</p>
                   </div>
                </div>

                <div className="flex items-start gap-6 group">
                   <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all">
                      <Sparkles className="w-7 h-7 text-amber-400" />
                   </div>
                   <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest mb-1">Fusion Protocol // ACTIVE</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">Original intent and performance have been synthesized into a prestigious video story.</p>
                   </div>
                </div>

                <div className="flex items-start gap-6 group">
                   <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-rose-500/10 group-hover:border-rose-500/30 transition-all">
                      <Rocket className="w-7 h-7 text-rose-400" />
                   </div>
                   <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest mb-1">Archive Entry</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">Your memory is now a permanent chapter in your life's cinematic timeline.</p>
                   </div>
                </div>
             </div>

             {data.videoStory && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 1.2 }}
                 className="mt-8 p-8 bg-gradient-to-br from-emerald-500/5 via-white/5 to-transparent border border-white/10 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group"
               >
                 <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <FilmIcon className="w-16 h-16 text-white" />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-6 flex items-center gap-3">
                   <Sparkles className="w-4 h-4" />
                   The Narrative Fusion
                 </h4>
                 <p className="text-xl text-white/90 leading-relaxed font-medium italic serif">
                   "{data.videoStory}"
                 </p>
                 <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-white/20">Auteur Synthesis // AI-Fused Narrative</span>
                    <div className="flex gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                    </div>
                 </div>
               </motion.div>
             )}

             <div className="pt-8 space-y-4">
                <button 
                  onClick={() => window.location.href = `/memory/${data.id}`} 
                  className="w-full py-6 bg-white text-slate-950 font-black rounded-3xl uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3"
                >
                  <Play className="w-4 h-4 fill-current" />
                  View Premiere
                </button>
                
                <button 
                  onClick={() => window.location.href = '/timeline'} 
                  className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-3xl uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3"
                >
                  Return to Studio Slate
                </button>
             </div>
          </motion.div>
       </div>
    </div>
  );

  return (
    <CinemaStageSwitch
      currentStage={productionStage}
      onStageChange={setProductionStage}
      acts={[
        { id: 0, title: 'Inciting Memory', label: 'ACT I' },
        { id: 1, title: 'Weave', label: 'ACT II' },
        { id: 2, title: 'Capture', label: 'ACT III' },
        { id: 3, title: 'Director\'s Cut', label: 'ACT IV' },
        { id: 4, title: 'Premiere', label: 'ACT V' },
      ]}
    >
      {renderIncitingMemory()}
      {renderWeave()}
      {renderRecording()}
      {renderNotepad()}
      {renderShowcase()}
    </CinemaStageSwitch>
  );
}
