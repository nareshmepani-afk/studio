
'use client';

import React from 'react';
import { assignRoleInStudioSession } from '@/actions/studioActions';
import { Button } from '@/components/ui/button';

interface LobbyProps {
  sessionId: string;
  userId: string;
}

const Lobby: React.FC<LobbyProps> = ({ sessionId, userId }) => {

  const handleRoleSelection = async (role: 'Interviewer' | 'Storyteller') => {
    await assignRoleInStudioSession(sessionId, userId, role);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-studio-black text-studio-text">
      <h1 className="text-4xl font-bold mb-8">Welcome to the Memory Studio</h1>
      <p className="text-lg mb-8">Please select your role to continue.</p>
      <div className="flex space-x-4">
        <Button onClick={() => handleRoleSelection('Interviewer')}>
          Join as Interviewer
        </Button>
        <Button onClick={() => handleRoleSelection('Storyteller')}>
          Join as Storyteller
        </Button>
      </div>
    </div>
  );
};

export default Lobby;
