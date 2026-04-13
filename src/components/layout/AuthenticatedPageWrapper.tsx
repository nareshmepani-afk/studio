"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
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

  useEffect(() => {
    if (!authLoading && !user) {
      console.log(`[AuthenticatedPageWrapper] No user found at ${pathname}, redirecting to /login`);
      router.push(`/login?reason=unauthenticated&from=${encodeURIComponent(pathname || '/')}`);
    }
  }, [user, authLoading, router, pathname]);

  // While we are checking (loading is true), show the splash screen
  if (authLoading) {
    return <SplashScreen />;
  }

  // If loading is finished but no user, we render nothing while the redirect happens.
  if (!user) {
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
