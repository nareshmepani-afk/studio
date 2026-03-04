'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Studio } from '@/components/studio/Studio';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { OnScreenConsole } from '@/components/studio/OnScreenConsole';
import { StudioProvider } from '@/hooks/studio/useStudioState';

export default function StudioClientPage({ params, initialState }: { params: { id: string }, initialState: any }) {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const role = searchParams.get('role');
  const isDebugMode = searchParams.get('debug') === 'true';

  useEffect(() => {
    if (isDebugMode) {
      console.log(`TESTIMONY: Debug mode activated via URL parameter.`);
    }

    const setupAuth = async () => {
      console.log("TESTIMONY: Setup sequence initiated.", { loading, user: !!user });

      if (loading) {
        console.log("TESTIMONY: Waiting for authentication to resolve.");
        return;
      }
      
      if (!user) {
        console.log("TESTIMONY: No user found. Attempting anonymous sign-in.");
        try {
          await signInAnonymously(auth);
          console.log("TESTIMONY: Anonymous sign-in flow completed. Awaiting effect re-run with user.");
        } catch (error) {
          console.error("TESTIMONY: Anonymous sign-in failed.", error);
        }
        return; 
      }
      
      console.log("TESTIMONY: User is authenticated:", user.uid);
    };

    setupAuth();
  }, [user, loading, isDebugMode]);

  const renderLoading = () => {
    let loadingMessage = "Loading...";
    if (loading) {
      loadingMessage = "Authenticating...";
    }
    console.log("TESTIMONY: Render loading state:", loadingMessage);
    return <div>{loadingMessage}</div>;
  };

  return (
    <>
      {isDebugMode && <OnScreenConsole />}
      {loading ? renderLoading() : (
        <StudioProvider initialState={initialState}>
          <Studio callId={params.id} role={role || 'guest'} />
        </StudioProvider>
      )}
    </>
  );
}
