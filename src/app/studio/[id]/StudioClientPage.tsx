"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useAuth } from '@/hooks/useAuth';
import { Studio } from '@/components/studio/Studio';
import { signInAnonymously } from '@/app/auth/actions';
import { OnScreenConsole } from '@/components/studio/OnScreenConsole';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

export default function StudioClientPage({ id }: { id: string }) {
  console.log("TESTIMONY: StudioClientPage mounted for id:", id);
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const role = searchParams.get('role');
  const isDebugMode = searchParams.get('debug') === 'true';
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

  useEffect(() => {
    if (isDebugMode) {
      console.log(`TESTIMONY: Debug mode activated via URL parameter.`);
    }
  }, [isDebugMode]);

  useEffect(() => {
    console.log("TESTIMONY: Auth state changed:", { loading, user: !!user });
    const handleSignIn = async () => {
      if (!loading && !user) {
        console.log("TESTIMONY: No user found, attempting anonymous sign-in.");
        try {
          const result = await signInAnonymously();
          console.log("TESTIMONY: Anonymous sign-in successful.", result);
        } catch (error) {
          console.error("TESTIMONY: Error signing in anonymously:", error);
        }
      }
    };
    handleSignIn();
  }, [user, loading]);

  useEffect(() => {
    console.log("TESTIMONY: Video client setup effect triggered.", { userLoading: loading, userExists: !!user });
    if (loading || !user) {
        if(loading) console.log("TESTIMONY: Waiting for user authentication to complete.");
        if(!user) console.log("TESTIMONY: User not available, cannot setup video client.");
        return;
    };

    if (!apiKey) {
        console.error("TESTIMONY: Stream API key is missing!");
        throw new Error('Stream API key is missing');
    }
    
    console.log("TESTIMONY: User authenticated, setting up Stream video client for user:", user.uid);

    const client = new StreamVideoClient({
        apiKey,
        user: {
            id: user.uid,
            name: user.displayName || user.email || undefined,
            image: user.photoURL || undefined
        },
        tokenProvider: async () => {
            console.log("TESTIMONY: tokenProvider called for user:", user.uid);
            try {
                const response = await fetch('/api/auth/stream-token', {
                    method: 'POST',
                    body: JSON.stringify({ userId: user.uid }),
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log("TESTIMONY: Fetched stream token response:", { ok: response.ok, status: response.status });
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
        }
    });
    console.log("TESTIMONY: StreamVideoClient instance created.");
    setVideoClient(client);

    return () => {
      console.log("TESTIMONY: Cleaning up StudioClientPage, disconnecting user.");
      client.disconnectUser();
      setVideoClient(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const renderLoading = () => {
    let loadingMessage = "Loading...";
    if (loading) {
        loadingMessage = "Authenticating...";
    } else if (!videoClient) {
        loadingMessage = "Connecting to recording studio...";
    }
    console.log("TESTIMONY: Render loading state:", loadingMessage);
    return <div>{loadingMessage}</div>;
  }

  // Always render the page structure, including the console if enabled
  return (
    <>
      {isDebugMode && <OnScreenConsole />}
      {(loading || !videoClient) ? renderLoading() : (
        <StreamVideo client={videoClient}>
          <Studio callId={id} role={role || 'guest'} />
        </StreamVideo>
      )}
    </>
  );
}
