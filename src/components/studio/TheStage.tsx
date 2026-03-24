
'use client';

import { useStudioState } from '@/hooks/studio/useStudioState';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firestore';
import { Prompt } from '@/types/prompt';
import { Skeleton } from '@/components/ui/skeleton';

const TheStage = () => {
  const { sessionId } = useStudioState();
  const [prefetchedPrompt, setPrefetchedPrompt] = useState<Prompt | null>(null);
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [fetchStatus, setFetchStatus] = useState('Idle');

  // TODO: Implement the actual fetch logic
  const prefetchPromptContent = async (promptId: string) => {
    console.log(`Prefetching prompt: ${promptId}`);
    setFetchStatus('Prefetching');
    // Simulate a fetch
    // In a real implementation, you would fetch from Firestore here
    // and then call setPrefetchedPrompt with the result.
    setFetchStatus('Ready');
  };

  // TODO: Implement the actual fetch logic
  const fetchActivePromptContent = async (promptId: string) => {
    console.log(`Panic Fetching prompt: ${promptId}`);
    // In a real implementation, you would fetch from Firestore here
    // and then call setActivePrompt with the result.
  };

  useEffect(() => {
    if (!sessionId) return;

    const unsub = onSnapshot(doc(db, 'studio', sessionId), (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      // 1. Handle Pre-fetching (The "Ghost")
      if (data.queuedPromptId && data.queuedPromptId !== prefetchedPrompt?.id) {
        prefetchPromptContent(data.queuedPromptId);
      }

      // 2. Handle Activation (The "Push")
      if (data.activePromptId) {
        if (prefetchedPrompt?.id === data.activePromptId) {
          setActivePrompt(prefetchedPrompt);
        } else {
          // Trigger Panic Fetch if the push beat the pre-fetch
          fetchActivePromptContent(data.activePromptId);
        }
      }
    });

    return () => unsub();
  }, [sessionId, prefetchedPrompt?.id]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">The Stage</h1>
        <div className={`px-3 py-1 rounded-full text-xs ${fetchStatus === 'Ready' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {fetchStatus}
        </div>
      </header>

      {/* Main Stage UI: The Storyteller sees this */}
      <div className="relative min-h-[300px] transition-all duration-500">
        {activePrompt ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <h2 className="text-4xl font-serif mb-4">{activePrompt.text}</h2>
             {/* Render your specific prompt fields here */}
          </div>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        )}
      </div>

      {/* Debug View: Will be hidden in production */}
      <footer className="mt-20 opacity-30 hover:opacity-100 transition-opacity">
        <p className="text-xs uppercase tracking-widest mb-2">Internal Ghost Buffer</p>
        <div className="bg-gray-900 p-4 rounded text-[10px] font-mono">
           {prefetchedPrompt ? `Ready: ${prefetchedPrompt.id}` : 'Buffer Empty'}
        </div>
      </footer>
    </div>
  );
};

export default TheStage;
