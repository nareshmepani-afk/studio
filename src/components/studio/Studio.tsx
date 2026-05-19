'use client';

import { useStudioState } from '@/hooks/studio/useStudioState';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import SessionIdWitness from '../debug/SessionIdWitness';

const CommandCenter = dynamic(() => import('./CommandCenter'), { ssr: false });
const TheDeck = dynamic(() => import('./TheDeck'), { ssr: false });
const TheStage = dynamic(() => import('./TheStage'), { ssr: false });
const TheGallery = dynamic(() => import('./TheGallery'), { ssr: false });

// Define a more specific type for the role prop
export type StudioRole = 'director' | 'Interviewer' | 'Storyteller' | 'guest';

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
      case 'director':
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
