'use client';

import { useStudioState } from '@/hooks/studio/useStudioState';
import { useEffect } from 'react';
import SessionIdWitness from '../debug/SessionIdWitness';
import CommandCenter from './CommandCenter';
import TheDeck from './TheDeck';
import TheStage from './TheStage';
import TheGallery from './TheGallery';

// Define a more specific type for the role prop
export type StudioRole = 'host' | 'Interviewer' | 'Storyteller' | 'guest';

interface StudioProps {
  callId?: string;
  role: StudioRole;
}

export const Studio = ({ callId, role }: StudioProps) => {
  const { sessionId } = useStudioState();

  // This effect can be used for debugging or initial setup if needed.
  useEffect(() => {
    console.log(`TESTIMONY: Studio component mounted for role: ${role}`);
  }, [role]);

  const renderRoleSpecificUI = () => {
    switch (role) {
      case 'host':
        return <CommandCenter />;
      case 'Interviewer':
        return <TheDeck />;
      case 'Storyteller':
        return <TheStage />;
      case 'guest':
        return <TheGallery />;
      default:
        // This case should ideally not be reached if props are passed correctly
        return <div>Loading workspace...</div>;
    }
  };

  return (
    <div className="h-screen bg-studio-black text-studio-text">
      <SessionIdWitness sessionId={sessionId} />
      {renderRoleSpecificUI()}
    </div>
  );
};
