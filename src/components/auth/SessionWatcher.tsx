'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

async function createSession(idToken: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (response.ok) {
      console.log('Session cookie created successfully.');
      return true;
    } else {
      const errorData = await response.json();
      toast.error(`Failed to create session: ${errorData.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error('Error in createSession:', error);
    toast.error('An unexpected error occurred while creating the session.');
    return false;
  }
}

async function clearSession(): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'DELETE' });
    console.log('Session cookie cleared.');
  } catch (error) {
    console.error('Error in clearSession:', error);
  }
}

export default function SessionWatcher() {
  const router = useRouter();
  const isHandlingTokenChange = useRef(false);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (isHandlingTokenChange.current) {
        return;
      }
      isHandlingTokenChange.current = true;

      if (user) {
        // User is signed in or token was refreshed.
        const idToken = await user.getIdToken();
        const sessionCreated = await createSession(idToken);
        if (sessionCreated) {
          // You could optionally refresh the page or router if needed
           router.refresh(); 
        }
      } else {
        // User is signed out.
        await clearSession();
        // Optional: Add logic to redirect or show a message on sign-out
      }

      isHandlingTokenChange.current = false;
    });

    return () => unsubscribe();
  }, [router]);

  return null;
}
