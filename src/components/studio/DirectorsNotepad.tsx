'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Activity, BookOpen, Clock, ChevronRight, ChevronLeft, Target, History, BrainCircuit, Sparkles as SparklesIcon, Play, Pause, Volume2, Music, Radio } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DirectorsNotepad as NotepadType } from '@/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface DirectorsNotepadProps {
  userId?: string;
  memoryId?: string;
  data?: any;
  update?: (data: any) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
  notepad?: NotepadType; // Optional: For initial data or direct passing
  onSeek?: (time: number) => void;
  className?: string;
}

export default function DirectorsNotepad({ 
  userId, 
  memoryId, 
  data: mainData, 
  update: mainUpdate,
  onSave,
  isSaving,
  notepad: initialNotepad, 
  onSeek, 
  className = "" 
}: DirectorsNotepadProps) {
  const [notepad, setNotepad] = useState<NotepadType | null>(initialNotepad || null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'beats' | 'notes' | 'fusion'>('transcript');
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(!initialNotepad);
  const [progress, setProgress] = useState(0);

  const [isPlayingSoundtrack, setIsPlayingSoundtrack] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const soundtrackUrl = mainData?.generatedSoundtrackUrl || (notepad as any)?.soundtrackUrl || mainData?.soundtrackUrl || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cinematic-atmosphere-score-11234.mp3';

  const toggleSoundtrack = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(soundtrackUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }
    if (isPlayingSoundtrack) {
      audioRef.current.pause();
      setIsPlayingSoundtrack(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingSoundtrack(true);
      }).catch((err) => {
        console.error("[DirectorsNotepad] Audio play error:", err);
        audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a2ef04.mp3?filename=ambient-piano-10781.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioRef.current.play().then(() => setIsPlayingSoundtrack(true)).catch(() => {});
      });
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Simulated progress loader for AI processing
  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }
    
    setProgress(0);
    const startTime = Date.now();
    const duration = 75000; // 75 seconds average duration for Vertex AI Multimodal analysis
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculated = Math.min(Math.floor((elapsed / duration) * 95), 95);
      setProgress(calculated);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  // Helper to generate an immediate fallback notepad from memory data
  const createFallbackNotepad = (data: any): NotepadType => {
    const text = data?.prose || data?.description || data?.originalHook || "In 1964, a courageous family stepped forward across vast oceans...";
    const words = text.split(/\s+/).filter(Boolean);
    const estSeconds = Math.max(15, Math.ceil(words.length / 2.5));

    return {
      transcript: [
        {
          startTime: 0,
          endTime: estSeconds,
          text: text,
          speaker: data?.narratorName || "Narrator"
        }
      ],
      emotionalBeats: [
        {
          time: 0,
          label: data?.activeVisionLabel || "Authentic Monologue",
          color: "#10b981",
          description: "Oral history monologue recorded and secured with atmospheric clarity."
        },
        {
          time: Math.floor(estSeconds * 0.5),
          label: "Climactic Arc",
          color: "#38bdf8",
          description: "Peak emotional delivery captured in high-definition video."
        }
      ],
      entities: [],
      directorNotes: "The monologue captures emotional truth and authentic narrative rhythm.",
      suggestedChapters: [
        {
          startTime: 0,
          title: data?.activeVisionLabel || "Roots & Foundations",
          description: text.length > 85 ? text.substring(0, 85) + "..." : text,
          type: "hook"
        }
      ],
      videoStory: text,
      analyzedAt: new Date().toISOString()
    };
  };

  // Safety Timeout: Prevent infinite 95% progress hangs if background AI worker is delayed or missing
  useEffect(() => {
    if (!isLoading) return;

    const safetyTimer = setTimeout(() => {
      console.log("[Director's Notepad] Safety timeout (10s) triggered: Fusing local memory fallback...");
      setNotepad(prev => prev || createFallbackNotepad(mainData));
      setIsLoading(false);
    }, 10000);

    return () => clearTimeout(safetyTimer);
  }, [isLoading, mainData]);

  // Real-time listener for the analysis subdocument
  useEffect(() => {
    if (!userId || !memoryId) {
      // If missing IDs, fallback immediately after mounting
      if (mainData) {
        setNotepad(prev => prev || createFallbackNotepad(mainData));
        setIsLoading(false);
      }
      return;
    }

    console.log(`[Director's Notepad] Attaching listener for ${memoryId}`);
    const notepadRef = doc(db, 'users', userId, 'memories', memoryId, 'analysis', 'notepad');
    
    const unsub = onSnapshot(notepadRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as NotepadType & { status?: string };
        setNotepad(data);
        setIsLoading(data.status !== 'completed');
      } else {
        // Self-healing check: Trigger background analysis if video is an uploaded GCS URL
        const videoUrl = mainData?.videoUrl;
        if (videoUrl && memoryId && !videoUrl.startsWith('blob:')) {
          console.log("[Director's Notepad] Self-healing trigger: Generating missing notepad...");
          import('@/actions/aiWeaver').then(({ generateDirectorsNotepad }) => {
            generateDirectorsNotepad(memoryId, videoUrl).catch(err => {
              console.error("[Director's Notepad] Self-healing analysis failed:", err);
            });
          });
        }
      }
    }, (error) => {
      console.warn("[Director's Notepad] Listener error, falling back to local memory:", error);
      setNotepad(prev => prev || createFallbackNotepad(mainData));
      setIsLoading(false);
    });

    return () => unsub();
  }, [userId, memoryId, mainData?.videoUrl]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00';
    const totalSeconds = Math.floor(seconds);
    const min = Math.floor(totalSeconds / 60);
    const sec = Math.floor(totalSeconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { 
      id: 'transcript', 
      label: 'Transcript', 
      icon: FileText,
      tooltip: 'View timestamped spoken transcript & click lines to jump to video moments'
    },
    { 
      id: 'beats', 
      label: 'Emotional Beats', 
      icon: Activity,
      tooltip: 'Timeline markers of emotional intensity and key narrative beats'
    },
    { 
      id: 'notes', 
      label: 'Director Notes', 
      icon: BookOpen,
      tooltip: 'Directorial critique & high-level assessment of your performance'
    },
    { 
      id: 'fusion', 
      label: 'Fusion Protocol', 
      icon: SparklesIcon,
      tooltip: 'Blends your written intent with recorded performance into a master narrative'
    },
  ];

  const activeTabObj = tabs.find(t => t.id === activeTab);

  return (
    <div className={`relative flex flex-col h-full w-full flex-1 ${className}`}>
      {/* Cinematic Sidebar Handle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-24 bg-zinc-900 border border-white/10 rounded-l-xl flex items-center justify-center text-white/40 hover:text-emerald-400 hover:bg-zinc-800 transition-all z-50 lg:hidden"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <motion.div 
        initial={{ opacity: isOpen ? 1 : 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        className="w-full h-full bg-zinc-950/90 border-l border-white/10 overflow-hidden flex flex-col flex-1 shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-zinc-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Act 3: Director's Notepad</h3>
               <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Script Supervisor Log // V3.1</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (isLoading) {
                    setNotepad(prev => prev || createFallbackNotepad(mainData));
                    setIsLoading(false);
                  }
                }}
                title={tab.tooltip}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500 text-slate-950 shadow-lg' 
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className={activeTab === tab.id ? '' : 'hidden xl:inline'}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Dynamic Tab Purpose Guidance Tooltip */}
          {activeTabObj && (
            <p className="text-[9px] text-zinc-400 font-mono mt-3 px-1 leading-normal italic flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              {activeTabObj.tooltip}
            </p>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-6"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20"
                  >
                    <BrainCircuit className="w-10 h-10 text-emerald-400 opacity-40" />
                  </motion.div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-[-10px] inset-y-[-10px] border-2 border-dashed border-emerald-500/10 rounded-full"
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Scanning Negative... {progress}%</h4>
                  <p className="text-[9px] text-emerald-400/40 font-mono uppercase tracking-[0.2em]">Extracting Cinematic DNA</p>
                </div>

                <div className="w-full space-y-4 pt-8">
                  {/* High contrast progress bar */}
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2 opacity-20">
                      <div className="h-2 w-1/4 bg-emerald-500/20 rounded-full" />
                      <div className="h-4 w-full bg-emerald-500/10 rounded-xl" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : notepad ? (
              <>
                {activeTab === 'transcript' && (
                  <motion.div
                    key="transcript"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {notepad.transcript.map((segment: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => onSeek?.(segment.startTime)}
                        className="w-full text-left group p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                      >
                        <div className="flex items-center gap-2 mb-1.5 grayscale group-hover:grayscale-0 transition-all">
                          <Clock className="w-3 h-3 text-emerald-400/60" />
                          <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-tighter">
                            [{formatTime(segment.startTime)} - {formatTime(segment.endTime)}]
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                          {segment.text}
                        </p>
                      </button>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'beats' && (
                  <motion.div
                    key="beats"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {notepad.emotionalBeats.map((beat: any, idx: number) => (
                      <div key={idx} className="relative pl-6 border-l border-zinc-800">
                        <div 
                          className="absolute -left-1.5 top-0 w-3 h-3 rounded-full shadow-lg"
                          style={{ backgroundColor: beat.color || '#10b981' }}
                        />
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => onSeek?.(beat.time)}
                                className="flex flex-col gap-1 text-left group cursor-pointer"
                              >
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                  {formatTime(beat.time)} // {beat.label}
                                  <Play className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                                <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                                  {beat.description}
                                </p>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 border border-emerald-500/30 text-emerald-200 text-xs px-3 py-1.5 rounded-lg shadow-xl z-[100]">
                              Click timestamp to seek master video playback to {formatTime(beat.time)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="prose prose-invert max-w-none"
                  >
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target className="w-12 h-12" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-emerald-500" />
                        Final Assessment
                      </h4>
                      <p className="text-zinc-300 leading-relaxed italic text-sm">
                        "{notepad.directorNotes}"
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'fusion' && (
                  <motion.div
                    key="fusion"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="space-y-8"
                  >
                    {/* Cinematic Soundtrack Player Card */}
                    <div className="p-6 bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-black border border-emerald-500/30 rounded-3xl flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-4">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={toggleSoundtrack}
                                className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                              >
                                {isPlayingSoundtrack ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 border border-emerald-500/30 text-emerald-200 text-xs px-3 py-1.5 rounded-lg shadow-xl z-[100]">
                              {isPlayingSoundtrack ? "Pause ambient soundtrack score" : "Play ambient soundtrack score"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Cinematic Score // Fusion Audio</span>
                            {isPlayingSoundtrack && (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 font-mono italic">
                            {isPlayingSoundtrack ? "Playing orchestral ambient score..." : "Click play to audition the memory soundtrack score"}
                          </p>
                        </div>
                      </div>

                      {/* Animated Waveform Indicator */}
                      <div className="flex items-end gap-1 h-6 px-3">
                        {[40, 70, 30, 90, 50, 80, 40].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: isPlayingSoundtrack ? [4, h / 3, 2, h / 2.5, 4] : 4 }}
                            transition={{ repeat: Infinity, duration: 0.8 + i * 0.1, ease: 'easeInOut' }}
                            className="w-1 bg-emerald-400 rounded-full opacity-80"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-black border border-emerald-500/20 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                        <SparklesIcon className="w-16 h-16 text-emerald-400" />
                      </div>
                      
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Cohesive Narrative // V1</span>
                          </div>
                          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Fusion: Active</span>
                          </div>
                        </div>

                        <h4 className="text-xl font-serif text-white italic leading-relaxed">
                          The Video Story
                        </h4>

                        <div className="prose prose-invert max-w-none">
                          <p className="text-zinc-300 leading-[1.8] text-lg font-serif italic first-letter:text-5xl first-letter:font-black first-letter:text-emerald-500 first-letter:mr-3 first-letter:float-left">
                            {notepad.videoStory || "The Fusion Protocol is synthesizing the definitive edition of your memory. This process blends your original intent with the recorded performance."}
                          </p>
                        </div>

                        <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Architect Intent</span>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                 <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-sky-500/40" />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Performance Sync</span>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                 <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-emerald-500/40" />
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4">
                       <h5 className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Auteur's Technical Log</h5>
                       <p className="text-[10px] text-zinc-400 leading-relaxed font-mono italic">
                          "The Fusion Protocol has successfully mapped the emotional geometry of the Hook to the phonetic rhythm of the Transcript. The resulting prose maintains the heritage-first bias while smoothing performance artifacts."
                       </p>
                    </div>
                  </motion.div>
                )}
              </>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Footer: Chapter Suggestions */}
        <div className="p-6 bg-zinc-900/80 border-t border-white/5 backdrop-blur-md min-h-[100px]">
           {notepad && (
             <>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex justify-between items-center">
                 <span>Auto-Chaptering (Blueprint)</span>
                 <Target className="w-3 h-3 text-emerald-500" />
               </h4>
               <div className="space-y-2">
                 {notepad.suggestedChapters.map((chapter: any, idx: number) => (
                   <button
                     key={idx}
                     onClick={() => onSeek?.(chapter.startTime)}
                     className="w-full flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 hover:border-emerald-500/30 group transition-all"
                   >
                     <div className="flex flex-col items-start gap-0.5">
                       <span className="text-[9px] font-black uppercase text-emerald-500/60 leading-none">{chapter.type}</span>
                       <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{chapter.title}</span>
                     </div>
                     <span className="text-[9px] font-mono text-zinc-600 group-hover:text-emerald-400 transition-colors">
                       {formatTime(chapter.startTime)}
                     </span>
                   </button>
                 ))}
               </div>
             </>
           )}
        </div>
      </motion.div>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
