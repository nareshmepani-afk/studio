'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import MemoryForm from './MemoryForm';
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
import { Video, Disc, Square, AlertTriangle, UploadCloud, CheckCircle2, Scissors, Play, Pause, Camera, Loader2, Mic2, MessageSquare, Volume2, Sparkles, UserCircle } from 'lucide-react';
import { generateInterviewQuestion } from '@/actions/aiWeaver';
import { synthesizeStudioSpeech } from '@/actions/studio-vocal';
import { useCamera } from '@/hooks/useCamera';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

type MemoryData = any;

interface RoomProps {
    data: MemoryData;
    update: (updatedData: MemoryData) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function SoloStage({ data, update }: RoomProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 100]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);

  // MOD-12: AI Interviewer State
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('Achird');


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

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Mount Stream to Live Video Element
  useEffect(() => {
    if (videoRef.current && stream && !recordedBlob) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, recordedBlob]);

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
        }
      } catch (err) {
        console.error("Upload transmission failed.", err);
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
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.play();
  }, []);

  const triggerNextQuestion = async () => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    
    // Ensure Interviewer role uses Achird (Interviewer)
    const interviewerVoice = 'Achird';
    
    try {
      const question = await generateInterviewQuestion(data?.prose || '', interviewHistory);
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
      vid.currentTime = trimRange[0]; // Loops visually for them!
      setIsPlaying(false);
    }
  };

  // SIGNAL SHIELD: Ensure that every save from the director dashboard PRESERVES the latest hardware status
  const shieldedUpdate = useCallback((updatedData: MemoryData) => {
    update({
        ...updatedData,
        cameraActive: isCameraActive,
    });
  }, [update, isCameraActive]);

  return (
    <div className="flex flex-col gap-8 w-full h-full pb-10">
      
      {/* Top Banner: The Local Camera Canvas or Finished Video */}
      {data?.videoUrl ? (
          <div className="w-full relative bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] flex flex-col items-center justify-center p-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6 drop-shadow-md" />
            <h2 className="text-3xl font-bold font-headline text-white mb-8 tracking-wide">Memory Completed</h2>
            
            <video src={data.videoUrl} controls playsInline className="w-full max-w-3xl rounded-xl shadow-2xl mb-8 border border-white/10" />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="px-8 py-3 bg-rose-500/10 text-rose-400 font-bold border border-rose-500/50 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg flex items-center gap-3 group">
                  <Video className="w-5 h-5 group-hover:animate-pulse" />
                  Delete & Retake Video
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold font-headline">Delete This Recording?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/60 leading-relaxed">
                    Are you sure you want to completely delete this video and record it again? This cannot be reversed and the current file will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/10">Keep Recording</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                        shieldedUpdate({ ...data, videoUrl: null, status: 'idle' });
                        setIsCameraActive(true);
                        clearRecording();
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Yes, Delete Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
      ) : (
        <div className="w-full relative bg-black border border-white/10 rounded-2xl shadow-xl overflow-hidden min-h-[400px]">
           
           {/* Live Camera Feed */}
           <video 
             ref={videoRef}
             autoPlay 
             playsInline 
             muted
             className="absolute inset-0 w-full h-full object-cover z-0"
           />

           {/* Gradient Overlay for Legible UI */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />

           {/* Cinematic UI Overlay */}
           <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 w-full max-w-7xl mx-auto pointer-events-none">
             
             {/* Header: Status & Warning */}
             <div className="flex justify-between items-start w-full pointer-events-auto">
               
               {/* Recording Status Bubble / Initial Limit State */}
               <AnimatePresence>
                 {isRecording ? (
                   <motion.div 
                     key="recording"
                     initial={{ opacity: 0, y: -20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     className={`flex items-center gap-3 px-4 py-2 rounded-full font-mono font-bold tracking-widest backdrop-blur-md border shadow-lg ${
                       isWarningLimit 
                         ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-amber-500/20' 
                         : 'bg-rose-500/20 border-rose-500 text-rose-200'
                     }`}
                   >
                     <motion.div 
                       animate={{ opacity: [1, 0, 1] }} 
                       transition={{ repeat: Infinity, duration: isWarningLimit ? 0.5 : 1.5 }}
                       className={`w-3 h-3 rounded-full ${isWarningLimit ? 'bg-amber-400' : 'bg-rose-500'}`} 
                     />
                     {formatTime(recordingTime)}
                     <span className="text-xs opacity-60">/ 07:00</span>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="idle"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-white/50 backdrop-blur-md font-medium text-xs tracking-wider"
                   >
                     <Disc className="w-3.5 h-3.5" />
                     MAX SAVED RECORDING: 5 MINUTES
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* 5-Minute Pulse Warning */}
               <AnimatePresence>
                 {isRecording && isWarningLimit && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0 }}
                     className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-extrabold rounded-lg shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-pulse border border-amber-300"
                   >
                     <AlertTriangle className="w-5 h-5" />
                     WARNING: 2 MINUTES REMAINING
                   </motion.div>
                 )}
               </AnimatePresence>
               
               {/* Upload / Save State Overlay (Placeholder logic for Phase 4) */}
               <AnimatePresence>
                 {uploading && (
                   <motion.div 
                     initial={{ opacity: 0, y: -20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500 text-blue-200 backdrop-blur-md"
                   >
                     <UploadCloud className="w-5 h-5 animate-bounce" />
                     <span className="font-bold tracking-wide">Safely Uploading... {Math.round(uploadProgress)}%</span>
                   </motion.div>
                 )}
                 {uploadResult && (
                   <motion.div 
                     initial={{ opacity: 0, y: -20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500 text-emerald-200 backdrop-blur-md"
                   >
                     <CheckCircle2 className="w-5 h-5" />
                     <span className="font-bold tracking-wide">Memory Saved</span>
                   </motion.div>
                 )}
               </AnimatePresence>

             </div>

             {/* MOD-12: AI Interviewer HUD */}
             <div className="flex-1 flex flex-col items-center justify-center p-4">
                <AnimatePresence>
                  {isInterviewMode && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="max-w-xl w-full bg-slate-950/60 backdrop-blur-2xl border border-sky-500/30 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center pointer-events-auto ring-1 ring-sky-500/20"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/30">
                          <Mic2 className="w-6 h-6 text-sky-400" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em]">AI Interviewer</span>
                          <span className="text-xs text-white/40 font-bold uppercase tracking-widest">{selectedVoice} (Studio)</span>
                        </div>
                      </div>

                      {currentQuestion ? (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-2xl font-headline text-white leading-relaxed mb-8"
                        >
                          "{currentQuestion}"
                        </motion.p>
                      ) : (
                        <p className="text-white/40 italic mb-8">Ready to hear your story. Click below to begin the interview or narrate your script.</p>
                      )}

                      <div className="flex flex-col gap-4 w-full">
                         <div className="flex items-center gap-4 justify-center">
                            <button 
                              onClick={triggerNextQuestion}
                              disabled={isSynthesizing}
                              className="px-8 py-3 bg-sky-500 text-slate-950 font-black rounded-full hover:scale-105 transition-all shadow-lg flex items-center gap-2 group/btn disabled:opacity-50"
                            >
                              {isSynthesizing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Mic2 className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                              )}
                              Ask Next Question (Achird)
                            </button>
                            
                            {data?.aiTakes?.poetic && (
                               <button 
                                 onClick={handleNarratePoetic}
                                 disabled={isSynthesizing}
                                 className="px-8 py-3 bg-amber-500 text-slate-950 font-black rounded-full hover:scale-105 transition-all shadow-lg flex items-center gap-2 group/btn disabled:opacity-50"
                               >
                                 <Volume2 className="w-4 h-4" />
                                 Narrate Poetic Take (Achernar)
                               </button>
                            )}
                         </div>

                         {currentQuestion && (
                            <button 
                              onClick={() => {
                                 synthesizeStudioSpeech(currentQuestion, 'Achird').then(playAudio);
                              }}
                              className="text-[10px] font-black text-sky-400/60 uppercase tracking-widest hover:text-sky-400 transition-all"
                            >
                              Replay Last Question
                            </button>
                         )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* Footer: Controls */}
             <div className="flex justify-between items-center w-full px-12 pb-6 pointer-events-auto">
                <div className="flex items-center gap-4">
                   <button 
                     onClick={() => setIsInterviewMode(!isInterviewMode)}
                     className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border ${
                       isInterviewMode 
                         ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)]' 
                         : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:bg-black/60'
                     }`}
                   >
                     <UserCircle className="w-4 h-4" />
                     {isInterviewMode ? 'Interviewer Active' : 'Start AI Interview'}
                   </button>

                   {isInterviewMode && (
                     <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1.5 rounded-xl">
                       {['Achird', 'Achernar', 'Zephyr'].map(v => (
                         <button 
                           key={v}
                           onClick={() => setSelectedVoice(v)}
                           className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${selectedVoice === v ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
                         >
                           {v}
                         </button>
                       ))}
                     </div>
                   )}
                </div>

                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    disabled={!stream || uploading}
                    className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-4 border-white/40 hover:border-rose-500 hover:bg-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-500 group-hover:scale-125 transition-transform" />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      stopRecording();
                      setIsCameraActive(false); // Strictly power-cycle hardware off!
                    }}
                    className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-rose-500/20 border-4 border-rose-500 hover:bg-rose-500 transition-all shadow-[0_0_40px_rgba(244,63,94,0.4)]"
                  >
                    <Square className="w-6 h-6 text-white shrink-0 group-hover:scale-90 transition-transform fill-current" />
                  </button>
                )}

                <div className="w-[200px] flex justify-end">
                   {/* Balancing element */}
                </div>
             </div>

           </div>

           {/* PHASE 3: Preview & Save Overlay */}
           {recordedBlob && previewUrl && (
              <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center">
                 
                 <video 
                   ref={previewVideoRef}
                   src={previewUrl} 
                   playsInline
                   onEnded={() => setIsPlaying(false)}
                   onLoadedMetadata={(e) => {
                     const vid = e.currentTarget;
                     // MediaRecorder blobfix: Duration is often Infinity
                     if (vid.duration === Infinity || isNaN(vid.duration)) {
                       vid.currentTime = 1e101; 
                       vid.ontimeupdate = () => {
                          vid.ontimeupdate = null;
                          const trueDuration = vid.duration;
                          setVideoDuration(trueDuration);
                          setTrimRange([0, trueDuration]);
                          vid.currentTime = 0;
                       };
                     } else {
                       setVideoDuration(vid.duration);
                       setTrimRange([0, vid.duration]);
                     }
                   }}
                   onTimeUpdate={handlePreviewTimeUpdate}
                   className="absolute inset-0 w-full h-full object-cover z-0 opacity-90 cursor-pointer" 
                   onClick={togglePreviewPlay}
                 />
                 
                 {/* Controls Gradient Overlay */}
                 <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black/80 z-10" />
                 
                 <div className="absolute top-0 inset-x-0 p-6 z-20 flex justify-between items-center pointer-events-none">
                   <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-white/80 font-medium tracking-wide backdrop-blur-md">
                      <Disc className="w-4 h-4 text-emerald-400" />
                      Reviewing Memory
                   </div>
                 </div>

                 {/* Center Giant Play Button Overlay */}
                 <AnimatePresence>
                   {!isPlaying && (
                     <motion.button 
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.8 }}
                       onClick={togglePreviewPlay}
                       className="z-30 p-6 bg-white/10 backdrop-blur-md rounded-full shadow-2xl border border-white/20 hover:bg-white/20 hover:scale-110 transition-all group"
                     >
                       <Play className="w-12 h-12 text-white fill-current opacity-80 group-hover:opacity-100 ml-1" />
                     </motion.button>
                   )}
                 </AnimatePresence>
                 
                 {/* Pre-Production Trimmer Strip */}
                 <div className="absolute bottom-0 inset-x-0 p-6 z-20 flex flex-col gap-6 w-full max-w-4xl mx-auto">
                   
                   {/* Soft-Clip Slider */}
                   {!uploadResult && (
                     <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-lg flex flex-col gap-3">
                       <div className="flex justify-between items-center text-xs font-bold text-white/50 tracking-widest uppercase">
                         <span className="flex items-center gap-2"><Scissors className="w-4 h-4" /> Start Time: {formatTime(Math.round(trimRange[0]))}</span>
                         <span>End Time: {formatTime(Math.round(trimRange[1]))}</span>
                       </div>
                       <Slider 
                         value={trimRange}
                         min={0}
                         max={videoDuration || 100}
                         step={0.1}
                         onValueChange={(val: [number, number]) => setTrimRange(val)}
                         className="cursor-pointer"
                       />
                       <p className="text-[10px] text-white/30 text-center uppercase tracking-widest">Adjust handles to soft-clip head movements</p>
                     </div>
                   )}

                   {/* Action Bar */}
                   <div className="flex justify-between items-center bg-black/60 border border-white/5 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl">
                      <button 
                        onClick={() => {
                          clearRecording();
                          setIsCameraActive(true); // Re-initialize instantly!
                        }}
                        disabled={uploading}
                        className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        Retake Video
                      </button>

                      {/* PREMIUM: Slow Motion Toggle */}
                      <button 
                        onClick={() => {
                          const newSlowMo = !isSlowMo;
                          setIsSlowMo(newSlowMo);
                          if (previewVideoRef.current) {
                            previewVideoRef.current.playbackRate = newSlowMo ? 0.25 : 1.0;
                          }
                        }}
                        disabled={uploading}
                        className={`flex items-center gap-2 px-6 py-3 border font-bold rounded-xl transition-all disabled:opacity-50 ${
                          isSlowMo 
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        }`}
                        title="Slow Motion (0.25x)"
                      >
                        <span className="text-lg">🐢</span>
                        <span className="text-sm">Slow-Mo</span>
                      </button>

                      {/* PREMIUM: Snapshot Picker */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleCaptureThumbnail}
                          disabled={isCapturingThumbnail || uploading}
                          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                          title="Capture Frame"
                        >
                          {isCapturingThumbnail ? (
                             <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          ) : (
                             <Camera className="w-4 h-4 text-emerald-400" />
                          )}
                          {data?.posterImageUrl ? "Update Poster" : "Set as Poster"}
                        </button>

                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                          title="Upload Portrait"
                        >
                          <UploadCloud className="w-4 h-4 text-sky-400" />
                          Upload
                        </button>
                        <input 
                           type="file" 
                           ref={fileInputRef}
                           onChange={handleUploadPoster}
                           accept="image/*"
                           className="hidden"
                        />
                      </div>

                      {!uploadResult ? (
                        <button 
                          onClick={handleSaveMemory}
                          disabled={uploading}
                          className="px-8 py-3 bg-[var(--room-accent)] text-slate-900 font-extrabold rounded-xl hover:brightness-110 shadow-[0_0_30px_rgba(251,191,36,0.2)] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-wait"
                        >
                          {uploading ? (
                            <>
                              <UploadCloud className="w-5 h-5 animate-bounce" />
                              Safely Uploading... {Math.round(uploadProgress)}%
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              Save Trims & Output
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="px-8 py-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-extrabold rounded-xl transition-all flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5" />
                          Memory Safely Persisted
                        </div>
                      )}
                   </div>

                 </div>
              </div>
           )}

           {!isCameraActive && !recordedBlob ? (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                 <Video className="w-16 h-16 text-white/20 mb-6" />
                 <h3 className="text-xl font-bold text-white font-headline mb-2">Camera is Offline</h3>
                 <p className="text-white/60 mb-8 max-w-sm text-center">Enable your camera to preview your shot before recording your memory.</p>
                 <button 
                   onClick={() => setIsCameraActive(true)}
                   className="px-8 py-3 bg-[var(--room-accent)] text-slate-900 font-bold rounded-full hover:brightness-110 shadow-lg hover:shadow-[var(--room-accent)]/20 transition-all flex items-center gap-2"
                 >
                   <Video className="w-5 h-5" />
                   Initialize Camera
                 </button>
              </div>
           ) : !stream && !error ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                 <div className="text-white/60 font-medium animate-pulse tracking-widest text-sm flex items-center gap-3">
                   <Video className="w-5 h-5" />
                   INITIALIZING OPTICS...
                 </div>
              </div>
           ) : error && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6">
                 <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                 <h3 className="text-xl font-bold text-white mb-2">Camera Disconnected</h3>
                 <p className="text-rose-200/80 text-center max-w-md">{error}</p>
                 <button 
                   onClick={() => setIsCameraActive(false)}
                   className="mt-6 px-6 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all"
                 >
                   Cancel
                 </button>
              </div>
           )}
        </div>
      )}

      {/* The Central Engine: The Story Script Outline */}
      <MemoryForm data={data} update={shieldedUpdate} />

    </div>
  );
}
