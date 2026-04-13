'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect from legacy /create to the new branded /director route.
 */
export default function CreateRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/director');
  }, [router]);

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center text-white/50 text-sm">
      Entering Memory Collaboration...
    </div>
  );
}

