"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';
import SplashScreen from './SplashScreen';
import { Loader2 } from 'lucide-react';

import { CinematicBackground } from '@/components/ui/CinematicBackground';

interface AuthenticatedPageWrapperProps {
  children: React.ReactNode;
  theme?: 'amber' | 'blue' | 'default';
}

export function AuthenticatedPageWrapper({ children, theme = 'default' }: AuthenticatedPageWrapperProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isGuestMode = searchParams.get('mode') === 'guest';
  const hasSessionId = !!searchParams.get('sessionId');

  useEffect(() => {
    // GUEST BYPASS: If we are in guest mode with a session ID, don't redirect to login.
    const isGuestBypass = pathname?.startsWith('/studio') && isGuestMode && hasSessionId;

    if (!authLoading && !user && !isGuestBypass) {
      console.log(`[AuthenticatedPageWrapper] No user found at ${pathname}, redirecting to /login`);
      router.push(`/login?reason=unauthenticated&from=${encodeURIComponent(pathname || '/')}`);
    }
  }, [user, authLoading, router, pathname, isGuestMode, hasSessionId]);

  // While we are checking (loading is true), show the splash screen
  if (authLoading) {
    return <SplashScreen />;
  }

  // GUEST BYPASS: If we are in guest mode with a session ID, we permit rendering.
  const isGuestBypass = pathname?.startsWith('/studio') && isGuestMode && hasSessionId;

  // If loading is finished but no user, and no guest bypass, we render the loader while wait for the redirect.
  if (!user && !isGuestBypass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  // Success!
  return (
    <CinematicBackground theme={theme}>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 animate-fade-in">
          {children}
        </main>
      </div>
    </CinematicBackground>
  );
}
