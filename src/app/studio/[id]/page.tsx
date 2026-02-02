'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useAuth } from '@/hooks/useAuth';
import { Studio } from '@/components/studio/Studio';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { OnScreenConsole } from '@/components/studio/OnScreenConsole';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

export default function StudioPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const role = searchParams.get('role');
  const isDebugMode = searchParams.get('debug') === 'true';
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

  useEffect(() => {
    if (isDebugMode) {
      console.log(`TESTIMONY: Debug mode activated via URL parameter.`);
    }

    let client: StreamVideoClient;

    const setupVideoClient = async () => {
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

      if (!apiKey) {
        console.error("TESTIMONY: Stream API key is missing!");
        return;
      }
      
      console.log("TESTIMONY: Setting up Stream video client.");
      client = new StreamVideoClient({
        apiKey,
        user: {
          id: user.uid,
          name: user.displayName || user.email || undefined,
          image: user.photoURL || undefined,
        },
        tokenProvider: async () => {
          console.log("TESTIMONY: Token provider invoked for user:", user.uid);
          try {
            const response = await fetch('/api/auth/stream-token', {
              method: 'POST',
              body: JSON.stringify({ userId: user.uid }),
              headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
              const errorText = await response.text();
              console.error("TESTIMONY: Failed to fetch stream token:", errorText);
              throw new Error('Failed to fetch stream token');
            }
            const { token } = await response.json();
            console.log("TESTIMONY: Successfully received stream token.");
            return token;
          } catch (error) {
            console.error("TESTIMONY: Error in tokenProvider:", error);
            return null;
          }
        },
      });
      console.log("TESTIMONY: StreamVideoClient instance created.");
      setVideoClient(client);
    };

    setupVideoClient();

    return () => {
      if (videoClient) {
        console.log("TESTIMONY: Cleaning up StudioClientPage, disconnecting user.");
        videoClient.disconnectUser();
        setVideoClient(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isDebugMode]);

  const renderLoading = () => {
    let loadingMessage = "Loading...";
    if (loading) {
      loadingMessage = "Authenticating...";
    } else if (!videoClient) {
      loadingMessage = "Connecting to recording studio...";
    }
    console.log("TESTIMONY: Render loading state:", loadingMessage);
    return <div>{loadingMessage}</div>;
  };

  return (
    <>
      {isDebugMode && <OnScreenConsole />}
      {(loading || !videoClient) ? renderLoading() : (
        <StreamVideo client={videoClient}>
          <Studio callId={params.id} role={role || 'guest'} />
        </StreamVideo>
      )}
    </>
  );
}
