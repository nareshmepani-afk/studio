'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { getPrompt } from '@/app/actions/studio';

const TheStage = () => {
  const { sessionId } = useStudioState();
  const [prefetchedPrompt, setPrefetchedPrompt] = useState<any>(null);
  const [fetchStatus, setFetchStatus] = useState('Idle');

  useEffect(() => {
    if (!sessionId) return;

    const unsub = onSnapshot(doc(db, 'studio', sessionId), (doc) => {
      const data = doc.data();
      if (data && data.queuedPromptId) {
        prefetchPromptContent(data.queuedPromptId);
      }
    });

    return () => unsub();
  }, [sessionId]);

  const prefetchPromptContent = async (promptId: string) => {
    setFetchStatus('Fetching...');
    const { success, prompt } = await getPrompt(promptId);
    if (success) {
      setPrefetchedPrompt(prompt);
      setFetchStatus('Ready');
    } else {
      setFetchStatus('Error');
    }
  };

  return (
    <div>
      <h1>The Stage (Storyteller)</h1>
      <div>Fetch Status: {fetchStatus}</div>
      {prefetchedPrompt && (
        <div>
          <h2>Prefetched Prompt:</h2>
          <pre>{JSON.stringify(prefetchedPrompt, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TheStage;
