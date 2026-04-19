'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Activity, BookOpen, Clock, ChevronRight, ChevronLeft, Target, History, BrainCircuit, Sparkles as SparklesIcon } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'transcript' | 'beats' | 'notes'>('transcript');
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(!initialNotepad);

  // Real-time listener for the analysis subdocument
  useEffect(() => {
    if (!userId || !memoryId) return;

    console.log(`[Director's Notepad] Attaching listener for ${memoryId}`);
    const notepadRef = doc(db, 'users', userId, 'memories', memoryId, 'analysis', 'notepad');
    
    const unsub = onSnapshot(notepadRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as NotepadType & { status?: string };
        setNotepad(data);
        setIsLoading(data.status !== 'completed');
      } else {
        setNotepad(null);
        setIsLoading(true);
      }
    });

    return () => unsub();
  }, [userId, memoryId]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'beats', label: 'Emotional Beats', icon: Activity },
    { id: 'notes', label: 'Director Notes', icon: BookOpen },
  ];

  return (
    <div className={`relative flex h-full ${className}`}>
      {/* Cinematic Sidebar Handle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-24 bg-zinc-900 border border-white/10 rounded-l-xl flex items-center justify-center text-white/40 hover:text-emerald-400 hover:bg-zinc-800 transition-all z-50"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <motion.div 
        initial={false}
        animate={{ width: isOpen ? 400 : 0, opacity: isOpen ? 1 : 0 }}
        className="h-full bg-zinc-950 border-l border-white/10 overflow-hidden flex flex-col shadow-2xl"
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
                onClick={() => setActiveTab(tab.id as any)}
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
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Scanning Negative...</h4>
                  <p className="text-[9px] text-emerald-400/40 font-mono uppercase tracking-[0.2em]">Extracting Cinematic DNA</p>
                </div>

                <div className="w-full space-y-4 pt-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2 opacity-20">
                      <div className="h-2 w-1/4 bg-emerald-500/20 rounded-full animate-pulse" />
                      <div className="h-4 w-full bg-emerald-500/10 rounded-xl animate-pulse" />
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
                        <button
                          onClick={() => onSeek?.(beat.time)}
                          className="flex flex-col gap-1 text-left group"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-emerald-400 transition-colors">
                            {formatTime(beat.time)} // {beat.label}
                          </span>
                          <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                            {beat.description}
                          </p>
                        </button>
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

                    <div className="mt-8">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Resolved Entities</h4>
                      <div className="flex flex-wrap gap-2">
                        {notepad.entities.map((entity: any, idx: number) => (
                          <div key={idx} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] text-zinc-400 flex flex-col gap-0.5">
                            <span className="font-black text-white uppercase tracking-tighter">{entity.name}</span>
                            <span className="opacity-40">{entity.type}</span>
                          </div>
                        ))}
                      </div>
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
