"use client";

import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import React, { useEffect } from 'react'; // Fixed the comma error here too
import SplashScreen from './SplashScreen';
import { useRouter } from 'next/navigation';

interface AuthenticatedPageWrapperProps {
  children: React.ReactNode;
}

export function AuthenticatedPageWrapper({ children }: AuthenticatedPageWrapperProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect to home if we are CERTAIN the user is not logged in.
    // We wait for authLoading to be false.
    if (!authLoading && !user) {
      console.log("[WRAPPER] Definitively unauthenticated. Redirecting...");
      router.push('/'); 
    }
  }, [user, authLoading, router]);

  // While we are checking (loading is true), show the splash screen
  if (authLoading) {
    return <SplashScreen />;
  }

  // If loading is finished but no user, we return null 
  // (the useEffect above will handle the redirect)
  if (!user) {
    return null;
  }

  // Success!
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
