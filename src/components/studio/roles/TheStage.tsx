'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { getPrompt } from '@/app/actions/studio';
import { Skeleton } from '@/components/ui/skeleton';

// Define a type for the prompt data for better type safety
interface Prompt {
  id: string;
  [key: string]: any;
}

const TheStage = () => {
  const { sessionId } = useStudioState();

  // State for the prompt that is currently being pre-fetched
  const [prefetchedPrompt, setPrefetchedPrompt] = useState<Prompt | null>(null);
  
  // State for the prompt that should be actively displayed on stage
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  
  // State to track the ID of the prompt that should be active
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  // State to give visual feedback on the pre-fetching process
  const [fetchStatus, setFetchStatus] = useState('Idle');

  // Listen for changes in the session document (queuedPromptId and activePromptId)
  useEffect(() => {
    if (!sessionId) return;

    const unsub = onSnapshot(doc(db, 'studio', sessionId), (doc) => {
      const data = doc.data();
      
      // Handle pre-fetching when the queued prompt changes
      if (data?.queuedPromptId && data.queuedPromptId !== prefetchedPrompt?.id) {
        prefetchPromptContent(data.queuedPromptId);
      }
      
      // Handle the active prompt ID changing
      if (data?.activePromptId) {
        setActivePromptId(data.activePromptId);
      }
    });

    return () => unsub();
  }, [sessionId, prefetchedPrompt?.id]);

  // Effect to handle the "Ghost-to-Live" transition
  useEffect(() => {
    if (!activePromptId) return;

    // The "Happy Path": The active prompt is already pre-fetched
    if (prefetchedPrompt && prefetchedPrompt.id === activePromptId) {
      console.log('TESTIMONY: [TheStage] Instant transition. Prefetched data is ready.');
      setActivePrompt(prefetchedPrompt);
    } else {
      // The "Race Condition" or "Panic Fetch": The active prompt was not pre-fetched
      console.warn(`TESTIMONY: [TheStage] Panic Fetch! Prompt ${activePromptId} was not pre-fetched.`);
      setActivePrompt(null); // Clear the current prompt to show a loader
      fetchActivePromptContent(activePromptId);
    }
  }, [activePromptId, prefetchedPrompt]);

  const prefetchPromptContent = async (promptId: string) => {
    console.log(`TESTIMONY: [TheStage] Pre-fetching prompt: ${promptId}`);
    setFetchStatus('Fetching...');
    const { success, prompt } = await getPrompt(promptId);
    if (success && prompt) {
      console.log(`TESTIMONY: [TheStage] Pre-fetch successful for prompt: ${promptId}`);
      setPrefetchedPrompt({ id: promptId, ...prompt });
      setFetchStatus('Ready');
    } else {
      console.error(`TESTIMONY: [TheStage] Pre-fetch failed for prompt: ${promptId}`);
      setFetchStatus('Error');
    }
  };

  const fetchActivePromptContent = async (promptId: string) => {
    console.log(`TESTIMONY: [TheStage] Fetching active prompt: ${promptId}`);
    const { success, prompt } = await getPrompt(promptId);
    if (success && prompt) {
      console.log(`TESTIMONY: [TheStage] Active prompt fetch successful for: ${promptId}`);
      setActivePrompt({ id: promptId, ...prompt });
    } else {
      console.error(`TESTIMONY: [TheStage] Active prompt fetch failed for: ${promptId}`);
      // Handle error case, maybe show an error message to the user
    }
  };

  return (
    <div>
      <h1>The Stage (Storyteller)</h1>
      <div>Fetch Status: {fetchStatus}</div>
      <div className="mt-4 p-4 border rounded">
        <h2>Active Prompt</h2>
        {activePrompt ? (
          <pre>{JSON.stringify(activePrompt, null, 2)}</pre>
        ) : (
          <div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
      </div>
      <div className="mt-4 p-4 border rounded bg-gray-800">
        <h2>Ghost Card (Prefetched)</h2>
        {prefetchedPrompt ? (
          <pre>{JSON.stringify(prefetchedPrompt, null, 2)}</pre>
        ) : (
          <p>No prompt pre-fetched.</p>
        )}
      </div>
    </div>
  );
};

export default TheStage;
