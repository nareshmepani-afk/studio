'use client';

import { CheckCircle2, Heart, PlusCircle, XCircle } from 'lucide-react';

interface StorytellerSuccessProps {
  hostName: string;
  onRecordAnother: () => void;
}

export default function StorytellerSuccess({ hostName, onRecordAnother }: StorytellerSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-8 text-center">
      {/* 1. Success Animation/Icon */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse" />
        <CheckCircle2 size={80} className="text-amber-500 relative z-10" />
      </div>

      {/* 2. Emotional Confirmation */}
      <h1 className="text-3xl font-bold mb-4 tracking-tight">Memory Delivered!</h1>
      <p className="text-zinc-400 text-lg max-w-xs leading-relaxed">
        Thank you for sharing your story. It is now safely tucked away in 
        <span className="text-zinc-100 font-semibold"> {hostName}’s </span> vault.
      </p>

      {/* 3. Security Reassurance */}
      <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
        <Heart size={16} className="text-red-500" />
        <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
          Private & Secure
        </span>
      </div>

      {/* 4. Action Buttons */}
      <div className="mt-12 w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={onRecordAnother}
          className="w-full py-4 bg-zinc-100 text-zinc-950 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white transition-colors"
        >
          <PlusCircle size={20} />
          Record Another Memory
        </button>
        
        <button 
          onClick={() => window.close()} 
          className="w-full py-4 bg-transparent text-zinc-500 rounded-2xl font-medium hover:text-zinc-300 transition-colors"
        >
          I'm finished for now
        </button>
      </div>
    </div>
  );
}
