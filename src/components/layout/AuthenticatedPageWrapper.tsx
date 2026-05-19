"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';
import SplashScreen from './SplashScreen';
import { Loader2 } from 'lucide-react';

import { deleteSessionAction } from '@/actions/createSessionAction';
import { CinematicBackground } from '@/components/ui/CinematicBackground';

interface AuthenticatedPageWrapperProps {
  children: React.ReactNode;
  theme?: 'amber' | 'blue' | 'default';
}

export function AuthenticatedPageWrapper({ children, theme = 'default' }: AuthenticatedPageWrapperProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Prevent SSR hydration mismatches by syncing URL checks inside a useEffect on mount
  const [isGuestMode, setIsGuestMode] = React.useState(false);
  const [hasSessionId, setHasSessionId] = React.useState(false);

  useEffect(() => {
    setIsGuestMode(window.location.search.includes('mode=guest'));
    setHasSessionId(window.location.search.includes('sessionId='));
  }, []);

  useEffect(() => {
    // SYNC STATE: If Firebase says no user, ensure the server session is also cleared.
    // This prevents the Middleware from thinking we are logged in (based on a stale cookie).
    if (!authLoading && !user) {
      deleteSessionAction().then(() => {
        const isGuestBypass = pathname?.startsWith('/studio') && isGuestMode && hasSessionId;
        if (!isGuestBypass) {
          console.log(`[AuthenticatedPageWrapper] Session cleared. Safe to redirect.`);
        }
      });
    }
  }, [user, authLoading, isGuestMode, hasSessionId, pathname]);

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
      <div className="flex flex-col min-h-[calc(100vh-64px)]">
        <main className="flex-1 animate-fade-in">
          {children}
        </main>
      </div>
    </CinematicBackground>
  );
}
