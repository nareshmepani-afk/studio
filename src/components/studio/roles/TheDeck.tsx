'use client';

import React from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { queuePrompt, setPrompt } from '@/app/actions/studio';

const TheDeck = () => {
  const { sessionId } = useStudioState();

  const handleQueueTestPrompt = async () => {
    if (!sessionId) return;
    const testPromptId = 'p4'; // A real prompt ID from premiumPrompts.ts
    await queuePrompt(sessionId, testPromptId);
  };

  const handlePushToStage = async () => {
    if (!sessionId) return;
    // In a real implementation, we'd get the queuedPromptId from the session
    // For now, we'll hardcode it to match the test prompt
    const queuedPromptId = 'p4'; 
    await setPrompt(sessionId, queuedPromptId);
  };

  return (
    <div>
      <h1>The Deck (Interviewer)</h1>
      <button 
        onClick={handleQueueTestPrompt}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Queue Test Prompt (p4)
      </button>
      <button 
        onClick={handlePushToStage}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
      >
        Push to Stage
      </button>
    </div>
  );
};

export default TheDeck;
