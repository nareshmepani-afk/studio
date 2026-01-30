"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useAuth } from '@/hooks/useAuth';
import { Studio } from '@/components/studio/Studio';
import { signInAnonymously } from '@/app/auth/actions';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

export default function StudioClientPage({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const role = searchParams.get('role');
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

  useEffect(() => {
    const handleSignIn = async () => {
      if (!loading && !user) {
        try {
          await signInAnonymously();
        } catch (error) {
          console.error('Error signing in anonymously:', error);
        }
      }
    };
    handleSignIn();
  }, [user, loading]);

  useEffect(() => {
    if (loading || !user) return;

    if (!apiKey) throw new Error('Stream API key is missing');

    const client = new StreamVideoClient({
        apiKey,
        user: {
            id: user.uid,
            name: user.displayName || user.email || undefined,
            image: user.photoURL || undefined
        },
        tokenProvider: async () => {
            const response = await fetch('/api/auth/stream-token', {
                method: 'POST',
                body: JSON.stringify({ userId: user.uid }),
                headers: { 'Content-Type': 'application/json' }
            });
            const { token } = await response.json();
            return token;
        }
    });
    setVideoClient(client);

    return () => {
      client.disconnectUser();
      setVideoClient(null);
    };
  }, [user, loading]);

  if (loading || !videoClient) {
    return <div>Loading...</div>;
  }

  return (
    <StreamVideo client={videoClient}>
      <Studio callId={id} role={role || 'guest'} />
    </StreamVideo>
  );
}
