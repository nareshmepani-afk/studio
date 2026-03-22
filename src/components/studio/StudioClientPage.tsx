'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Studio } from '@/components/studio/Studio';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { OnScreenConsole } from '@/components/studio/OnScreenConsole';
import { StudioProvider } from '@/hooks/studio/useStudioState';
import Lobby from '@/components/studio/Lobby';

export default function StudioClientPage({ params, initialState }: { params: { id: string }, initialState: any }) {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const isDebugMode = searchParams.get('debug') === 'true';

  useEffect(() => {
    if (isDebugMode) {
      console.log(`TESTIMONY: Debug mode activated via URL parameter.`);
    }

    const setupAuth = async () => {
      if (loading) return;
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("TESTIMONY: Anonymous sign-in failed.", error);
        }
      }
    };

    setupAuth();
  }, [user, loading, isDebugMode]);

  const renderLoading = () => {
    return <div>Authenticating...</div>;
  };

  const renderContent = () => {
    if (loading || !user) {
      return renderLoading();
    }

    if (!initialState) {
      return <div>Session not found. Please check the link and try again.</div>;
    }

    const isHost = initialState.hostId === user.uid;
    const participant = initialState.participants?.find((p: any) => p.uid === user.uid);
    const userRole = isHost ? 'host' : participant?.role;

    if (userRole) {
      return (
        <StudioProvider initialState={initialState}>
          <Studio callId={params.id} role={userRole} />
        </StudioProvider>
      );
    } else {
      return <Lobby sessionId={params.id} userId={user.uid} />;
    }
  };

  return (
    <>
      {isDebugMode && <OnScreenConsole />}
      {renderContent()}
    </>
  );
}
