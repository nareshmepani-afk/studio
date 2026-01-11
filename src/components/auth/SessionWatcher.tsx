'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Import the singleton
import { toast } from 'react-hot-toast';

export default function SessionWatcher() {
  const router = useRouter();

  useEffect(() => {
    // onIdTokenChanged is more robust than onAuthStateChanged 
    // because it also triggers when the token is refreshed or expires.
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        const wasLoggedIn = localStorage.getItem('wasLoggedIn') === 'true';
        if (wasLoggedIn) {
          localStorage.removeItem('wasLoggedIn');
          toast.error("Session expired. Please log in again.");
          router.push('/login?reason=expired');
        }
      } else {
        localStorage.setItem('wasLoggedIn', 'true');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return null;
}
