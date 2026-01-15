'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Import the non-nullable auth singleton
import { toast } from 'react-hot-toast';

export default function SessionWatcher() {
  const router = useRouter();

  useEffect(() => {
    // onIdTokenChanged handles token refreshes and expirations, making it robust.
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        // Check if the user was previously logged in to prevent firing on initial load
        const wasLoggedIn = localStorage.getItem('wasLoggedIn') === 'true';
        if (wasLoggedIn) {
          localStorage.removeItem('wasLoggedIn');
          toast.error("Session expired. Please log in again.");
          // Redirect with a reason for better user experience
          router.push('/login?reason=session_expired');
        }
      } else {
        // When a user is confirmed, mark them as having been logged in
        localStorage.setItem('wasLoggedIn', 'true');
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [router]);

  // This component does not render anything to the DOM
  return null;
}
