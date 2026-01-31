'use client';

import { useState } from 'react';
import { Mic, Video, Square, Send, User } from 'lucide-react';

interface StorytellerBoothProps {
  hostName: string;
  memoryCategory?: string;
}

export default function StorytellerBooth({ hostName, memoryCategory }: StorytellerBoothProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* 1. Header: Contextual trust */}
      <header className="text-center mt-8">
        <div className="bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-widest p-1 mb-2 rounded">
          Storyteller Mode
        </div>
        <h1 className="text-xl font-medium">Sharing a memory with {hostName}</h1>
        {memoryCategory && (
          <p className="text-zinc-400 mt-1">Topic: <span className="text-zinc-200">{memoryCategory}</span></p>
        )}
      </header>

      {/* 2. Main Action: The Viewport/Recorder */}
      <main className="w-full max-w-md aspect-[3/4] bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-center relative overflow-hidden">
        {isRecording ? (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <span className="text-sm font-mono text-red-600">00:42</span>
          </div>
        ) : (
          <Video size={48} className="text-zinc-800" />
        )}
        
        {!mediaBlob && (
          <p className="text-zinc-500 text-sm">Camera preview will appear here</p>
        )}
      </main>

      {/* 3. Controls: High affordance */}
      <footer className="w-full max-w-md mb-12 flex flex-col gap-4">
        {!mediaBlob ? (
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all ${isRecording 
                ? 'bg-zinc-100 text-zinc-950 scale-95' 
                : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            {isRecording ? <Square fill="currentColor" /> : <Mic />}
            <span className="text-lg font-bold">
              {isRecording ? 'Stop Recording' : 'Start Storytelling'}
            </span>
          </button>
        ) : (
          <div className="flex gap-4">
            <button className="flex-1 py-4 bg-zinc-800 rounded-xl font-medium">Retake</button>
            <button className="flex-1 py-4 bg-amber-500 text-black rounded-xl font-bold flex items-center justify-center gap-2">
              <Send size={18} /> Send to {hostName}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
