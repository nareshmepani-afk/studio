'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import { Video, Disc, Square, AlertTriangle, UploadCloud, CheckCircle2, Scissors, Play, Pause, Camera, Loader2, Mic2, MessageSquare, Volume2, Sparkles, UserCircle, Languages, Layout, Zap, Settings2, RefreshCw, CheckCircle } from 'lucide-react';
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
import { BrainCircuit, Maximize2, Minus, Plus, ChevronRight, ChevronLeft, Film as FilmIcon } from 'lucide-react';
import CinemaStageSwitch from './CinemaStageSwitch';
import { Memory } from '@/types';

interface RoomProps {
    data: Memory;
    update: (updatedData: Memory) => void;
    modality?: 'pen' | 'voice' | null;
    setModality?: (val: 'pen' | 'voice' | null) => void;
    onWordCountChange?: (count: number) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function SoloStage({ data, update, modality, setModality, onWordCountChange }: RoomProps) {
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

  // Cinematic Pipeline State (Shared via Firestore)
  const productionStage = data?.productionStage || 0;
  const setProductionStage = (stage: number) => {
    update({ ...data, productionStage: stage });
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

  // NEW: Auto-activate camera when entering Production Stage (Stage 1)
  useEffect(() => {
    if (productionStage === 1 && !isCameraActive && !recordedBlob) {
      setIsCameraActive(true);
    }
  }, [productionStage, isCameraActive, recordedBlob]);

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
        ...data,
        trimStart: trimRange[0],
        trimEnd: trimRange[1],
      });
      
      try {
        const url = await uploadVideo(recordedBlob, data.id);
        if (url) {
          update({
            ...data,
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
               update({ ...data, posterImageUrl: url }); // STANDARDIZE: Use posterImageUrl globally
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
            update({ ...data, posterImageUrl: url });
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

  const shieldedUpdate = useCallback((updatedData: MemoryData) => {
    update({
        ...updatedData,
        cameraActive: isCameraActive,
    });
  }, [update, isCameraActive, data?.cameraActive]);

  // --- SUB-RENDERERS FOR 5-ACT JOURNEY ---
  
  const renderHook = () => (
    <div className="max-w-5xl mx-auto w-full pb-20 transition-all duration-700">
      <MemoryForm 
        data={data} 
        update={shieldedUpdate} 
        productionStage={0} 
        setProductionStage={setProductionStage}
        forceAct="guide"
        modality={modality}
        setModality={setModality}
        onWordCountChange={onWordCountChange}
      />
    </div>
  );

  const renderWeave = () => (
    <div className="max-w-4xl mx-auto w-full pb-20 transition-all duration-1000">
      <MemoryForm 
        data={data} 
        update={shieldedUpdate} 
        productionStage={1} 
        setProductionStage={setProductionStage}
        forceAct="weave" // New Stage: Full Scripting
        modality={modality}
        setModality={setModality}
        onWordCountChange={onWordCountChange}
      />
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
            <div className={`flex-grow pr-4 custom-scrollbar scroll-smooth overflow-y-auto ${prompterSize === 'sm' ? 'text-sm' : prompterSize === 'md' ? 'text-lg' : 'text-2xl'} font-medium text-white/95 leading-relaxed italic`}>
              {data?.prose ? (
                <div dangerouslySetInnerHTML={{ __html: data.prose }} className="prose-invert opacity-90 first-letter:text-4xl first-letter:font-black first-letter:mr-2 first-letter:float-left select-none" />
              ) : (
                <div className="text-white/20 text-sm font-black uppercase tracking-widest text-center py-20 flex flex-col items-center gap-4">
                  <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
                  Awaiting Narrative Weave...
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
                     <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className={`w-3 h-3 rounded-full ${isWarningLimit ? 'bg-amber-400' : 'bg-rose-500'}`} />
                     {formatTime(recordingTime)}
                   </motion.div>
                 ) : (
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-white/50 backdrop-blur-md text-xs">
                     <Disc className="w-3.5 h-3.5" /> STUDIO READY
                   </div>
                 )}
               </AnimatePresence>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center p-4">
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

          {!isCameraActive && (
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
    <div className="max-w-4xl mx-auto w-full pt-4 pb-20 text-center space-y-12">
       <motion.div 
         initial={{ scale: 0.8, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         transition={{ duration: 1, ease: "easeOut" }}
         className="relative inline-block"
       >
          <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full animate-pulse" />
          <div className="relative w-40 h-40 bg-slate-950 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(244,63,94,0.2)]">
             <FilmIcon className="w-16 h-16 text-rose-500" />
          </div>
       </motion.div>
       
       <motion.div 
         initial={{ y: 20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.5, duration: 0.8 }}
         className="space-y-4"
       >
          <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">Production Wrap</h2>
          <p className="text-white/40 text-xl font-medium max-w-xl mx-auto">Your cinematic journey is secured. The Memory Weaver is now processing the final showcase.</p>
       </motion.div>

       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 1.2, duration: 1 }}
         className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12"
       >
          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] text-left space-y-4 group hover:bg-slate-800/40 transition-all">
             <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center ring-1 ring-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
             </div>
             <h4 className="font-black text-white text-lg uppercase tracking-tight">Footage Secured</h4>
             <p className="text-sm text-white/40 leading-relaxed font-medium">Your narrative and recordings are encrypted and stored in the primary cinematic vault.</p>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] text-left space-y-4 group hover:bg-slate-800/40 transition-all">
             <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center ring-1 ring-sky-500/30">
                <BrainCircuit className="w-6 h-6 text-sky-400" />
             </div>
             <h4 className="font-black text-white text-lg uppercase tracking-tight">Director's Cut</h4>
             <p className="text-sm text-white/40 leading-relaxed font-medium">AI agents are currently analyzing your talking points to refine labels and theatrical beats.</p>
          </div>
       </motion.div>

       <motion.button 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => window.location.href = '/timeline'} 
          className="px-16 py-6 bg-white text-slate-950 font-black rounded-3xl uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
       >
          Return to Studio Slate
       </motion.button>
    </div>
  );

  return (
    <CinemaStageSwitch
      currentStage={productionStage}
      onStageChange={setProductionStage}
      acts={[
        { id: 0, title: 'Hook', label: 'ACT I' },
        { id: 1, title: 'Weave', label: 'ACT II' },
        { id: 2, title: 'Capture', label: 'ACT III' },
        { id: 3, title: 'Cut', label: 'ACT IV' },
        { id: 4, title: 'Premiere', label: 'ACT V' },
      ]}
    >
      {renderHook()}
      {renderWeave()}
      {renderRecording()}
      {renderNotepad()}
      {renderShowcase()}
    </CinemaStageSwitch>
  );
}
