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
  Lock, ShieldAlert, Smartphone
} from 'lucide-react';
import { generateInterviewQuestion, analyzeFraming } from '@/actions/aiWeaver';
import { synthesizeStudioSpeech } from '@/actions/studio-vocal';
import { useCamera } from '@/hooks/useCamera';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { useAudioLevel } from '@/hooks/use-audio-level';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
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
import { Teleprompter } from './Teleprompter';
import { useAudioMonitor } from '@/hooks/useAudioMonitor';
import { useCaptureLogic } from '@/hooks/studio/useCaptureLogic';
import { useAlchemy } from '@/hooks/studio/useAlchemy';
import { useQRBridge } from '@/hooks/studio/useQRBridge';
import { useInterviewMode } from '@/hooks/studio/useInterviewMode';
import { QRController } from './QRController';
import { BeatSheet } from './BeatSheet';

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
  const [prompterSize, setPrompterSize] = useState<'mini' | 'sm' | 'md' | 'lg'>('md');
  const [prompterLayout, setPrompterLayout] = useState<'side' | 'center'>('side');
  const [techAlignmentConfirmed, setTechAlignmentConfirmed] = useState(false);
  const [opticsBrightness, setOpticsBrightness] = useState(100);
  const [opticsContrast, setOpticsContrast] = useState(110);
  const [opticsFilter, setOpticsFilter] = useState<'default' | 'warm' | 'cool' | 'noir'>('default');

  const stageRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const { isReviewing, isProductionLocked, selectedTake, actions: globalActions } = useStudioState();
  
  // QR Mobile Remote Bridge
  const { peerState } = useQRBridge(data?.id);
  
  // Interview Modality Modeler
  const {
    modalityMode,
    toggleModalityMode,
    triggerNextCue,
    activeBeatIndex,
    setActiveBeatIndex
  } = useInterviewMode();
  
  // Cinematic Pipeline State (Shared via Firestore)
  // BUGFIX: Prioritize global stage from prop, but allow local data fallback ONLY if prop is undefined.
  // We use currentStage prop as the source of truth from ProductionDeck.
  const productionStage = currentStage ?? (data?.productionStage || 0);
  const unmuteOptics = useCallback(() => {
    console.log("[SoloStage] Unmuting optics via Tech-Scout ceremony hotspot...");
    localStorage.setItem('privacy_optics_muted', 'false');
    window.dispatchEvent(new Event('privacy-optics-changed'));
  }, []);

  const setProductionStage = (stage: number) => {
    console.log(`[SoloStage] Advancing to Stage: ${stage}`);
    update((prev: any) => ({ ...prev, productionStage: stage }));
    globalActions.setStage(stage);
  };



  // 1. Initialize local Camera stream (Only when explicitly enabled)
  const { stream, error, cameraError, isMuted, capabilities, applyZoom, zoomValue, switchCamera, hasMultipleCameras } = useCamera({ enabled: isCameraActive });
  const [isPersistenceSaving, setIsPersistenceSaving] = useState(false);
  
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

  // Bind Cinematic Capture & Sealing Hooks
  const {
    countIn,
    isCountingIn,
    statusLabel,
    startCapture,
    cancelCapture
  } = useCaptureLogic({
    stream,
    startRecording,
    stopRecording,
    isRecording
  });

  // Listen to remote reset / restart take commands safely
  useEffect(() => {
    const handleRestartTake = () => {
      cancelCapture();
      setActiveBeatIndex(0);
      toast.info("Take Restarted", { description: "Prompt scroll position and recording state have been safely reset." });
    };
    window.addEventListener('studio-restart-take', handleRestartTake);
    return () => window.removeEventListener('studio-restart-take', handleRestartTake);
  }, [cancelCapture, setActiveBeatIndex]);

  // Floating Remote Command Alert Overlay
  const [remoteCommandAlert, setRemoteCommandAlert] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleRemoteCommand = (e: Event) => {
      const customEvent = e as CustomEvent<{ command: string }>;
      const cmd = customEvent.detail?.command;
      if (!cmd) return;
      
      const labelMap: Record<string, string> = {
        PLAY_PAUSE: 'Remote Scroll Toggled',
        NEXT_CUE: 'Remote Advancing Cue',
        RESTART_TAKE: 'Remote Restarting Take'
      };
      
      setRemoteCommandAlert(labelMap[cmd] || 'Remote Command Received');
      
      clearTimeout(timer);
      timer = setTimeout(() => {
        setRemoteCommandAlert(null);
      }, 1500);
    };
    
    window.addEventListener('studio-remote-command', handleRemoteCommand);
    return () => {
      window.removeEventListener('studio-remote-command', handleRemoteCommand);
      clearTimeout(timer);
    };
  }, []);

  const {
    isSaving: isAlchemySaving,
    progress: alchemyProgress,
    error: alchemyError,
    isComplete: isAlchemyComplete,
    isRetrying: isAlchemyRetrying,
    startAlchemy
  } = useAlchemy({
    userId: data?.userId,
    memoryId: data?.id,
    selectedTake: selectedTake || data?.prose || data?.description || null,
    wordCount: wordCount || 0,
    onComplete: () => {
      console.log("[SoloStage] Alchemy Complete! Advancing production deck to Act IV.");
    }
  });

  // AUTOMATION: Silently upload and seal take in database immediately upon MediaRecorder stop
  useEffect(() => {
    if (recordedBlob && !isAlchemySaving && !isAlchemyComplete) {
      console.log("[SoloStage] Compiled performance reel acquired. Triggering silent Alchemy save...");
      startAlchemy(recordedBlob);
    }
  }, [recordedBlob, isAlchemySaving, isAlchemyComplete, startAlchemy]);

  const micLevel = useAudioLevel(stream);
  
  // NEW: Tap into live MediaStream for frequency & volume monitoring
  const { volume, waveform } = useAudioMonitor(stream, cameraError);

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

  const playAudio = useCallback((base64: string) => {
    // PREMIUM: Natural Pause (Realism Injection)
    setTimeout(() => {
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audio.play();
    }, 600); 
  }, []);

  const hasPlayedMentorCue = useRef(false);
  
  useEffect(() => {
    if (productionStage === 2 && !hasPlayedMentorCue.current) {
      hasPlayedMentorCue.current = true;
      console.log("[SoloStage] tech-scout ceremony entered. Synthesizing Stage Manager whisper...");
      const playMentorCue = async () => {
        try {
          const whisper = "The floor is yours. Settle in, check your framing, and ignite the prompter when you are ready.";
          const audio = await synthesizeStudioSpeech(whisper, 'Achird');
          if (audio) {
            playAudio(audio);
          }
        } catch (e) {
          console.warn("[SoloStage] Stage Manager cue failed:", e);
        }
      };
      playMentorCue();
    }
  }, [productionStage, playAudio]);

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
    if (isAnalyzingFraming || isSynthesizing) return;
    
    setIsAnalyzingFraming(true);
    try {
      let imageBase64 = '';
      if (videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        }
      }

      let feedback = null;
      if (imageBase64) {
        try {
          feedback = await analyzeFraming(imageBase64, interviewLanguage);
        } catch (e) {
          console.warn("AI Framing API check failed, utilizing fallback:", e);
        }
      }

      if (!feedback) {
        // PREMIUM Directorial Fallback Feedback
        feedback = "Headroom is perfect. Try shifting slightly to the left to align with the Rule of Thirds. Lighting is a bit warm; your silhouette is authorised, but a touch more front-light would help your eyes sparkle.";
      }

      toast.info("Director Analysis", { 
        description: feedback,
        duration: 8000
      });
      const interviewerVoice = interviewLanguage === 'gu' ? selectedVoice : 'Achird';
      const audio = await synthesizeStudioSpeech(feedback, interviewerVoice);
      if (audio) playAudio(audio);
    } catch (err) {
      console.error("Framing Analysis Error:", err);
      toast.error("Framing Analyser Interrupted");
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
       <div 
         ref={videoContainerRef}
         className={`w-full max-w-[90vw] xl:max-w-7xl aspect-video relative bg-black border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-1000 ${isRecording ? 'ring-2 ring-rose-500/50 shadow-[0_0_120px_rgba(244,63,94,0.3)] scale-[1.01]' : 'shadow-2xl'}`}
       >
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className={cn(
              "absolute inset-0 w-full h-full object-cover z-0 transition-all duration-500 ease-out",
              isCountingIn ? "blur-[20px]" : "blur-0"
            )}
            style={{
              filter: `
                brightness(${opticsBrightness || 100}%) 
                contrast(${opticsContrast || 100}%) 
                ${opticsFilter === 'noir' ? 'grayscale(1) contrast(1.2)' : ''}
                ${opticsFilter === 'warm' ? 'sepia(0.2) saturate(1.1) hue-rotate(-10deg)' : ''}
                ${opticsFilter === 'cool' ? 'saturate(0.9) hue-rotate(10deg)' : ''}
              `
            }}
          />
          {mounted && isMuted && (
            <div 
              onClick={unmuteOptics}
              className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-[35] animate-fade-in border border-rose-500/20 rounded-[2.5rem] cursor-pointer group/cam transition-all duration-500 hover:bg-slate-950/90"
              title="Click anywhere to ignite camera and mic"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center max-w-md text-center px-8 py-8 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-headline text-base font-bold text-white uppercase tracking-widest mb-1">Standing By // Awaiting Narrator</h3>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-6">Cinematic Rehearsal Checklist</p>

                <div className="w-full space-y-3.5 mb-8 text-left">
                  {/* Item 1: Optics Check */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Camera className="w-4 h-4 text-rose-400 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/90">Optics check</span>
                        <span className="text-[9px] text-white/40">Camera stream muted by Privacy Shield</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[8px] font-black uppercase tracking-wider text-rose-400">
                      Muted
                    </span>
                  </div>

                  {/* Item 2: Acoustics Check */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/90">Acoustics check</span>
                        <span className="text-[9px] text-white/40">Microphone stream muted by Privacy Shield</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[8px] font-black uppercase tracking-wider text-rose-400">
                      Muted
                    </span>
                  </div>

                  {/* Item 3: Blueprint Check */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/90">Blueprint check</span>
                        <span className="text-[9px] text-white/40">Cinematic memory text loaded successfully</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider text-emerald-400">
                      Authorised
                    </span>
                  </div>

                  {/* Dynamic AI Director Standby Cue (MW-39 integration) */}
                  {mentorActive && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.02)] animate-pulse">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Director's Rehearsal Tip</span>
                        <span className="text-[10px] text-white/60 leading-relaxed font-sans">Relax, frame yourself in the center, and click below to ignite camera & mic. We will linter your shot once live.</span>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={unmuteOptics}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  Ignite Camera & Mic
                </button>
              </motion.div>
            </div>
          )}

          {/* AI Director Mentor Panel (Symmetric Left Overlay) */}
          <AnimatePresence>
            {mounted && mentorActive && !isMuted && (
              <motion.div
                initial={{ opacity: 0, x: -50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 120, damping: 22 }}
                className="absolute left-10 top-10 w-72 h-[340px] bg-zinc-950/85 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl z-30 flex flex-col justify-between pointer-events-auto hover:bg-zinc-900/90 duration-700"
              >
                <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar select-none">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2 text-emerald-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Director Active</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                        🎬 Eye-Contact Rule
                      </span>
                      <p className="text-[10px] text-white/70 leading-relaxed">
                        Maintain direct eye contact with the camera lens. Let the teleprompter mirror guide your gaze naturally.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                        🗣️ Sensory Pacing
                      </span>
                      <p className="text-[10px] text-white/70 leading-relaxed">
                        Speak slowly. Pause and breathe at sensory highlights (marked in green, amber, and purple) to let emotion weave.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                        📐 Framing Linter
                      </span>
                      <p className="text-[10px] text-white/70 leading-relaxed">
                        Align your eyes with the upper-third line of the shot. Run live linter below to verify rule-of-thirds.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 mt-2">
                  <button
                    onClick={handleCheckFraming}
                    disabled={isAnalyzingFraming}
                    className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 transition-all font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer group shadow-[0_0_15px_rgba(16,185,129,0.05)] disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>{isAnalyzingFraming ? 'Analyzing crop...' : 'Check Shot Linter'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating 'Start Performance' Red record ignition trigger overlay */}
          {mounted && !isMuted && !isRecording && !isCountingIn && techAlignmentConfirmed && (
            <div className="absolute left-[25%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-[35] pointer-events-none animate-fade-in">
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05, border: '2px solid rgba(239, 68, 68, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={startCapture}
                className="pointer-events-auto px-8 py-4 bg-zinc-950/70 border-2 border-white/20 hover:border-rose-500/50 hover:bg-rose-950/30 text-white font-black text-xs uppercase tracking-[0.3em] rounded-full shadow-[0_0_60px_rgba(239,68,68,0.2)] backdrop-blur-md transition-all flex items-center gap-3.5 cursor-pointer group"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 group-hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.8)] transition-all animate-pulse" />
                <span>Start Performance</span>
              </motion.button>
            </div>
          )}

          {/* Floating 'Director's Tech Scout' Calibration Card (MW-39 full-view check) */}
          {mounted && !isMuted && !techAlignmentConfirmed && (
            <div className="absolute inset-0 flex items-center justify-center z-[35] pointer-events-none animate-fade-in bg-black/5">
              <motion.div 
                drag
                dragConstraints={videoContainerRef}
                dragElastic={0.05}
                dragMomentum={false}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ touchAction: 'none' }}
                className="flex flex-col items-center max-w-md text-center px-8 pt-3 pb-8 bg-slate-900/75 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] pointer-events-auto cursor-grab active:cursor-grabbing select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag Grip Indicator Handle */}
                <div className="w-12 h-1 rounded-full bg-white/10 hover:bg-white/20 mb-4 shrink-0 transition-colors" />
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-headline text-base font-bold text-white uppercase tracking-widest mb-1">Director's Tech Scout</h3>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-6">Camera, Lighting & Sound Check</p>

                <div className="w-full space-y-3.5 mb-8 text-left">
                  {/* Item 1: Camera Check */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Camera className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/90">Camera Angle & Lighting</span>
                        <span className="text-[9px] text-white/40">Optics active. Video stream is in full view.</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider text-emerald-400 shrink-0">
                      Active
                    </span>
                  </div>

                  {/* Item 2: Acoustics Check (Live Sound Check Visualiser) */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3 w-full">
                      <Mic className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                      <div className="flex flex-col w-full min-w-0 pr-2">
                        <span className="text-xs font-bold text-white/90">Acoustics Check</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] text-white/40 uppercase tracking-wider font-mono">Live levels:</span>
                          <div className="flex-grow bg-white/10 h-1.5 rounded-full overflow-hidden relative">
                            <div 
                              className="bg-emerald-400 h-full rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
                              style={{ width: `${volume}%` }} 
                            />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-emerald-400 shrink-0">{volume}%</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider text-emerald-400 shrink-0">
                      {volume > 5 ? 'Active' : 'Listening'}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-white/50 leading-relaxed mb-8 italic">
                  Take a moment to verify your framing, lighting, and background in full view. Click below once you are satisfied with the setup.
                </p>

                <button 
                  onClick={() => {
                    setTechAlignmentConfirmed(true);
                    toast.success("Technical Alignment Confirmed", {
                      description: "Engaging prompter guide. Settle in for your performance!"
                    });
                  }}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  Confirm Technical Alignment
                </button>
              </motion.div>
            </div>
          )}

          {/* Floating 'Camera Control Deck' calibration overlay */}
          {mounted && !isMuted && !techAlignmentConfirmed && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 z-[35] pointer-events-auto">
               <motion.div
                 drag
                 dragConstraints={videoContainerRef}
                 dragElastic={0.05}
                 dragMomentum={false}
                 initial={{ scale: 0.9, opacity: 0, x: 50 }}
                 animate={{ scale: 1, opacity: 1, x: 0 }}
                 style={{ touchAction: 'none' }}
                 className="flex flex-col w-72 bg-slate-900/75 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl cursor-grab active:cursor-grabbing select-none space-y-5"
               >
                 {/* Drag handle */}
                 <div className="w-12 h-1 rounded-full bg-white/10 mx-auto hover:bg-white/20 transition-colors shrink-0" />
                 
                 <div className="border-b border-white/5 pb-2">
                   <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Optics Grading</span>
                   <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-0.5">Cinematic Styling</h4>
                 </div>

                 {/* Brightness Control */}
                 <div className="space-y-1.5">
                   <div className="flex items-center justify-between text-[10px] text-white/60">
                     <span>Brightness</span>
                     <span className="font-mono text-emerald-400">{opticsBrightness}%</span>
                   </div>
                   <input
                     type="range"
                     min="60"
                     max="140"
                     value={opticsBrightness}
                     onChange={(e) => setOpticsBrightness(Number(e.target.value))}
                     className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                   />
                 </div>

                 {/* Contrast Control */}
                 <div className="space-y-1.5">
                   <div className="flex items-center justify-between text-[10px] text-white/60">
                     <span>Contrast</span>
                     <span className="font-mono text-emerald-400">{opticsContrast}%</span>
                   </div>
                   <input
                     type="range"
                     min="60"
                     max="140"
                     value={opticsContrast}
                     onChange={(e) => setOpticsContrast(Number(e.target.value))}
                     className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                   />
                 </div>

                 {/* Zoom Control (Hardware Zoom if supported, otherwise digital scale fallback) */}
                 <div className="space-y-1.5">
                   <div className="flex items-center justify-between text-[10px] text-white/60">
                     <span>Zoom Level</span>
                     <span className="font-mono text-emerald-400">{capabilities?.zoom ? `${zoomValue}x` : '1.0x (Standard)'}</span>
                   </div>
                   <input
                     type="range"
                     min={capabilities?.zoom?.min || 1}
                     max={capabilities?.zoom?.max || 3}
                     step={capabilities?.zoom?.step || 0.1}
                     value={zoomValue}
                     onChange={(e) => applyZoom(Number(e.target.value))}
                     disabled={!capabilities?.zoom}
                     className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                   />
                   {!capabilities?.zoom && (
                     <span className="text-[7px] text-white/30 uppercase tracking-wider block">Hardware zoom not supported by webcam</span>
                   )}
                 </div>

                 {/* Cinematic Filter Presets */}
                 <div className="space-y-2">
                   <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold block">Color Grade Filter</span>
                   <div className="grid grid-cols-2 gap-1.5">
                     {(['default', 'warm', 'cool', 'noir'] as const).map((filter) => (
                       <button
                         key={filter}
                         onClick={() => setOpticsFilter(filter)}
                         className={cn(
                           "py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer",
                           opticsFilter === filter 
                             ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                             : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                         )}
                       >
                         {filter === 'default' && 'Default'}
                         {filter === 'warm' && 'Warm Tint'}
                         {filter === 'cool' && 'Cool modern'}
                         {filter === 'noir' && 'Noir Slate'}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Camera Switcher (Only if multi-cam) */}
                 {hasMultipleCameras && (
                   <button
                     onClick={switchCamera}
                     className="w-full py-2.5 mt-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                   >
                     <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                     <span>Switch Camera Feed</span>
                   </button>
                 )}
               </motion.div>
             </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 z-10 pointer-events-none" />
          
          {/* Cinematic Teleprompter Overlay */}
          <motion.div 
            key={`${prompterLayout}-${prompterSize}`}
            drag={prompterLayout === 'side'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={videoContainerRef}
            dragElastic={0.05}
            dragMomentum={false}
            animate={prompterLayout === 'center' ? {
              left: "50%",
              top: "50%",
              x: "-50%",
              y: "-50%",
              width: "75%",
              height: "65%",
            } : {
              left: "auto",
              right: 40,
              top: 40,
              width: prompterSize === 'mini' ? 280 : prompterSize === 'sm' ? 380 : prompterSize === 'md' ? 580 : 820,
              height: prompterSize === 'mini' ? 180 : prompterSize === 'sm' ? 350 : prompterSize === 'md' ? 520 : 720
            }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
            className={cn(
              "z-30 border border-white/10 rounded-[2.5rem] shadow-2xl group/points overflow-hidden flex flex-col pointer-events-auto transition-all duration-1000",
              prompterSize === 'mini' ? "p-4 bg-zinc-950/90" : "p-8",
              (isMuted || !mounted || !techAlignmentConfirmed) && "hidden",
              (!isRecording && !isCountingIn)
                ? "opacity-30 grayscale-[0.3] blur-[0.5px] pointer-events-none"
                : "opacity-100 blur-0",
              prompterLayout === 'center'
                ? "absolute bg-zinc-950/65 backdrop-blur-md"
                : "absolute bg-zinc-950/85 backdrop-blur-3xl"
            )}
          >
            <div 
              onPointerDown={(e) => prompterLayout === 'side' && dragControls.start(e)}
              style={{ touchAction: 'none' }}
              className={cn(
                "flex items-center justify-between shrink-0 select-none",
                prompterSize === 'mini' ? "mb-2" : "mb-4",
                prompterLayout === 'side' ? "cursor-grab active:cursor-grabbing border-b border-white/5 pb-2" : ""
              )}
            >
              <div className="flex items-center gap-3">
                {prompterLayout === 'side' && (
                  <div className="flex flex-col gap-0.5 text-white/30 mr-1 shrink-0">
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-current" />
                      <div className="w-1 h-1 rounded-full bg-current" />
                    </div>
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-current" />
                      <div className="w-1 h-1 rounded-full bg-current" />
                    </div>
                  </div>
                )}
                <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`} />
                {prompterSize !== 'mini' && (
                  <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.3em] animate-pulse">BLUEPRINT: SELECTED TAKE (ACT II)</span>
                )}
                {prompterSize === 'mini' && (
                  <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-widest animate-pulse">BLUEPRINT</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* QR Remote Controller Pair Trigger */}
                {prompterSize !== 'mini' && (
                  <QRController memoryId={data?.id || ''} peerState={peerState} />
                )}

                {/* Modality Mode Toggle Button */}
                {prompterSize !== 'mini' && (
                  <button
                    onClick={toggleModalityMode}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                      modalityMode === 'interview'
                        ? "bg-sky-500/20 border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:bg-sky-500/30"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                    )}
                    title="Toggle Scripted vs Interview Mode"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{modalityMode === 'interview' ? 'Interview' : 'Scripted'}</span>
                  </button>
                )}

                <button 
                  onClick={() => setPrompterLayout(prev => prev === 'side' ? 'center' : 'side')}
                  className={cn(
                    "p-1.5 rounded-lg border text-white/30 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5",
                    prompterLayout === 'center' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10"
                  )}
                  title="Toggle Eye-Contact Center Mode"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                    {prompterLayout === 'center' ? 'Center' : 'Overlay'}
                  </span>
                </button>
                <button 
                  onClick={() => setPrompterSize(prev => prev === 'mini' ? 'sm' : prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'mini')}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Toggle Teleprompter Size"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className={cn("flex-grow flex overflow-hidden min-h-0", prompterSize === 'mini' ? "gap-2" : "gap-8")}>
              {/* Main Teleprompter */}
              <div className="flex-grow min-w-0 h-full">
                <Teleprompter 
                  modalityMode={modalityMode}
                  activeBeatIndex={activeBeatIndex}
                  onActiveBeatChange={setActiveBeatIndex}
                  isMini={prompterSize === 'mini'}
                />
              </div>

              {/* Directorial Sidebar (Conditional) - Restricted to 'lg' size to prevent layout collisions */}
              {data?.structuredScript && prompterSize === 'lg' && (
                <div className="w-64 flex-none border-l border-white/5 pl-8 space-y-8 overflow-y-auto custom-scrollbar">
                  <BeatSheet 
                    beats={data.structuredScript.beatSheet}
                    activeBeatIndex={activeBeatIndex}
                    onBeatClick={(i) => {
                      window.dispatchEvent(new CustomEvent('studio-scroll-to-beat', { detail: { index: i } }));
                    }}
                  />

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
            {/* Mini Selfie Feed (Floating inside Teleprompter) */}
            {stream && prompterSize !== 'mini' && (
              <div className="absolute bottom-6 right-6 w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-none z-50">
                 <video
                   autoPlay
                   playsInline
                   muted
                   className="w-full h-full object-cover scale-x-[-1]"
                   ref={(el) => {
                     if (el && stream) {
                       el.srcObject = stream;
                     }
                   }}
                 />
                 <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 border border-white/10 text-[7px] font-black uppercase tracking-wider text-white">
                   Selfie
                 </div>
              </div>
            )}
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

             {/* Remote Connection Pulse HUD (Top Right) */}
             <AnimatePresence>
               {peerState === 'authorised' && (
                 <motion.div
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   className="absolute top-8 right-8 flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] pointer-events-auto"
                 >
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Remote Linked
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <div className="absolute inset-0 z-20 flex flex-col justify-between p-10 w-full mx-auto pointer-events-none">
             <div className="flex justify-between items-start w-full pointer-events-auto">
               <AnimatePresence mode="wait">
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
                 ) : isCountingIn ? (
                    <motion.div 
                      key="countin"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 px-4 py-2 rounded-full font-mono font-bold tracking-widest backdrop-blur-md border bg-emerald-500/20 border-emerald-500 text-emerald-200"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      {statusLabel}
                    </motion.div>
                  ) : (
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md text-xs transition-all font-mono font-bold tracking-wider",
                      (mounted && isMuted)
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse"
                        : (mounted && error)
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-black/40 border-white/20 text-white/50"
                    )}>
                      {mounted && isMuted ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span>OPTICS SHIELD ACTIVE // RE-ENABLE HARDWARE TO RECORD</span>
                        </>
                      ) : mounted && error ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>HARDWARE ACCESS DENIED</span>
                        </>
                      ) : (
                        <>
                          <Disc className="w-3.5 h-3.5" /> {statusLabel}
                        </>
                      )}
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
                  {isCountingIn && countIn !== null && (
                    <motion.div 
                      key="countdown"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-40"
                    >
                      <span className="font-serif text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                        {countIn}
                      </span>
                      <span className="text-xs font-mono uppercase tracking-[0.4em] text-white/40 mt-4 animate-pulse">
                        {statusLabel}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isInterviewMode && !isCountingIn && (
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

                {isCountingIn ? (
                  <button onClick={cancelCapture} className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500 hover:bg-emerald-500/30 transition-all flex items-center justify-center animate-pulse group">
                    <Square className="w-6 h-6 text-emerald-400 fill-current" />
                  </button>
                ) : !isRecording ? (
                    <button 
                      onClick={startCapture} 
                      disabled={!stream || uploading || isAlchemySaving || !techAlignmentConfirmed} 
                      className="w-20 h-20 rounded-full bg-white/10 border-4 border-white/40 hover:border-rose-500 hover:bg-rose-500/20 transition-all flex items-center justify-center group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/40 disabled:hover:bg-white/10"
                      title={!stream ? "Hardware access muted or blocked. Re-enable camera and mic access to record." : !techAlignmentConfirmed ? "Please confirm technical alignment before starting performance." : undefined}
                    >
                      <div className="w-6 h-6 rounded-full bg-rose-500 group-hover:scale-125 group-disabled:group-hover:scale-100 transition-all" />
                    </button>
                ) : (
                  <button onClick={() => { stopRecording(); setIsCameraActive(false); }} className="w-20 h-20 rounded-full bg-rose-500/20 border-4 border-rose-500 hover:bg-rose-500 transition-all flex items-center justify-center">
                    <Square className="w-6 h-6 text-white fill-current" />
                  </button>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 pointer-events-auto">
                    <Volume2 className={cn("w-4 h-4 transition-colors", isRecording ? "text-rose-400" : "text-emerald-400")} />
                    {/* Glowing Frequency Waveform Visualizer */}
                    <div className="flex items-end gap-[2px] h-6 w-32 px-1">
                      {waveform.slice(0, 24).map((value, i) => (
                        <motion.div
                          key={i}
                          className={cn(
                            "w-[3px] rounded-full transition-all",
                            isRecording 
                              ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" 
                              : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          )}
                          animate={{ height: `${Math.max(4, value * (isRecording ? 48 : 24))}px` }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        />
                      ))}
                    </div>
                    <span className={cn("text-[10px] font-mono font-bold w-8 text-right transition-colors", isRecording ? "text-rose-400" : "text-emerald-400")}>{volume}%</span>
                  </div>
                </div>
             </div>

             {/* Cinematic Slate / Alchemy Saving Ceremony Overlay (MW-35) */}
             <AnimatePresence>
                {isAlchemySaving && (
                   <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-2xl p-10"
                   >
                      {/* Vintage Projector/Slate Style Loader */}
                      <div className="relative w-80 aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl mb-8 bg-black">
                         {recordedBlob && (
                            <video 
                               autoPlay 
                               loop 
                               muted 
                               playsInline
                               className="w-full h-full object-cover opacity-60 grayscale scale-102 blur-[0.5px]"
                               src={URL.createObjectURL(recordedBlob)}
                            />
                         )}
                         {/* Mastering Watermark */}
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                            <div className="border border-rose-500/40 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 font-mono text-[9px] uppercase tracking-widest animate-pulse flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                               Mastering in Progress
                            </div>
                         </div>
                      </div>

                      <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2 text-center">
                         {isAlchemyRetrying ? "Sync Interrupted" : "Synthesising Master"}
                      </h3>
                      
                      <p className="text-xs text-white/50 max-w-sm text-center leading-relaxed mb-6 font-mono uppercase tracking-wider">
                         {isAlchemyRetrying 
                            ? "Connection interrupted. Retrying authorisation..."
                            : "Sealing Ceremony in progress. Please do not close the studio."}
                      </p>

                      {/* Progress Bar */}
                      <div className="w-full max-w-md bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 relative mb-4">
                         <motion.div 
                            className={cn(
                              "h-full rounded-full transition-all duration-300", 
                              isAlchemyRetrying ? "bg-amber-500" : "bg-emerald-500"
                            )} 
                            style={{ width: `${alchemyProgress}%` }}
                         />
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[9px] text-white/30 uppercase tracking-widest">
                         <span>Archival Progress:</span>
                         <span className={isAlchemyRetrying ? "text-amber-400 animate-pulse" : "text-emerald-400 font-bold"}>{alchemyProgress}%</span>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>

          {error ? (() => {
            const errType = cameraError?.type || 'unknown';
            
            let icon = <Lock className="w-8 h-8" />;
            let title = "Optics & Mic Locked";
            let subtitle = "To record your cinematic memory, browser access to your camera and microphone is required. Your stream is processed entirely locally.";
            let actionLabel = "Re-attempt Access";
            let guideTitle = "How to Unlock Permissions";
            
            let guideContent = (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                 {/* Chrome/Edge/Firefox Instruction */}
                 <div className="space-y-2">
                    <div className="font-bold text-white flex items-center gap-2">
                       <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                       Chrome / Edge / Firefox
                    </div>
                    <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                       <li>Click the <strong className="text-white font-semibold">Site Settings / Lock Icon (🔒 or 🎛️ sliders)</strong> next to the URL in the address bar.</li>
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
            );

            if (errType === 'notFound') {
              icon = <AlertTriangle className="w-8 h-8" />;
              title = "No Media Devices Found";
              subtitle = "No camera or microphone device could be recognised on this system. Please check your physical connections.";
              actionLabel = "Scan for Hardware";
              guideTitle = "Hardware Verification Steps";
              guideContent = (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                         Physical Connections
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Verify that your external webcam or microphone is firmly plugged in.</li>
                         <li>Try using a different USB port directly on your computer.</li>
                      </ul>
                   </div>
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                         System Privacy Settings
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>On Windows, go to <strong className="text-white font-semibold">Settings &gt; Privacy &gt; Camera</strong> and enable access.</li>
                         <li>On macOS, open <strong className="text-white font-semibold">System Settings &gt; Privacy & Security &gt; Camera</strong> and check your browser.</li>
                      </ul>
                   </div>
                </div>
              );
            } else if (errType === 'notReadable') {
              icon = <RefreshCw className="w-8 h-8" />;
              title = "Hardware Already Sourced";
              subtitle = "The camera or microphone is already in use by another programme or browser tab.";
              actionLabel = "Re-attempt Access";
              guideTitle = "Device Conflict Resolution";
              guideContent = (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                         Active Background Applications
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Close video-conferencing apps like Zoom, Microsoft Teams, Google Meet, or Skype.</li>
                         <li>Ensure no other browser tabs or software are actively using your camera/mic.</li>
                      </ul>
                   </div>
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                         Hard Refresh & Re-attempt
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Click the <strong className="text-white font-semibold">Re-attempt Access</strong> button below to force-release the device.</li>
                         <li>Restart your browser if the device handle remains locked by the operating system.</li>
                      </ul>
                   </div>
                </div>
              );
            } else if (errType === 'overconstrained') {
              icon = <Settings2 className="w-8 h-8" />;
              title = "Optics Resolution Mismatch";
              subtitle = "The requested premium 4K or HD video resolution constraints could not be satisfied by your media hardware.";
              actionLabel = "Retry Lower Cascade";
              guideTitle = "Constraint Resolution Guide";
              guideContent = (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                         Resolution Limits
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Your camera may not support the high resolution constraints (e.g. 4K, 1080p, or 720p).</li>
                         <li>The adaptive resolution system will automatically fall back to standard settings on retry.</li>
                      </ul>
                   </div>
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                         Force Default Settings
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Click <strong className="text-white font-semibold">Retry Lower Cascade</strong> to cycle down through the adaptive cascade constraints.</li>
                      </ul>
                   </div>
                </div>
              );
            } else if (errType === 'unknown') {
              icon = <AlertTriangle className="w-8 h-8" />;
              title = "Hardware Bridge Interrupted";
              subtitle = "An unexpected error occurred while establishing the connection to your media devices.";
              actionLabel = "Re-attempt Access";
              guideTitle = "System Recovery Guide";
              guideContent = (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                         Quick Reconnect
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Unplug and plug your camera/mic back in to trigger system level driver resets.</li>
                         <li>Check if the device functions properly in other web browser applications.</li>
                      </ul>
                   </div>
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                         System Diagnostics
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Perform a full page reload (Ctrl+R or Cmd+R) to clear all stale navigator handles.</li>
                         <li>Verify that your browser is up-to-date and fully supports WebRTC capture.</li>
                      </ul>
                   </div>
                </div>
              );
            }

            return (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar">
                 {/* Premium Warning Lock Icon */}
                 <div className="relative mb-6">
                   <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
                   <div className="relative w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      {icon}
                   </div>
                 </div>

                 {/* Title */}
                 <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2 text-center">
                   {title}
                 </h3>
                 
                 {/* Subtitle */}
                 <p className="text-sm text-white/60 max-w-md text-center leading-relaxed mb-6">
                   {subtitle}
                 </p>

                 {/* Step-by-Step Instructions */}
                 <div className="w-full max-w-xl bg-white/[0.02] border border-white/5 rounded-3xl p-6 mb-6 text-left space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{guideTitle}</span>
                       <span className="text-[9px] font-mono text-rose-500/80 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10 uppercase">Required</span>
                    </div>
                    
                    {guideContent}

                    <p className="text-[10px] text-white/30 text-center italic pt-2 border-t border-white/5">
                       Tip: You may need to refresh the browser if your device updates don't apply immediately.
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
                       {actionLabel}
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
            );
          })() : !isCameraActive && (
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
    <>
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

      {/* Floating Remote Command Alert Overlay */}
      <AnimatePresence>
        {remoteCommandAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-500/90 text-slate-950 font-black text-xs uppercase tracking-[0.2em] px-6 py-3 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-400 flex items-center gap-2 pointer-events-none"
          >
            <Smartphone className="w-4 h-4 animate-bounce" />
            <span>{remoteCommandAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
