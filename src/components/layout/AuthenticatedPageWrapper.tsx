
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import React, { useEffect, cloneElement } from 'react';
import SplashScreen from './SplashScreen';

interface AuthenticatedPageWrapperProps {
  children: React.ReactNode;
}

export function AuthenticatedPageWrapper({ children }: AuthenticatedPageWrapperProps) {
  const { user, loading: authLoading } = useAuth();

  // The wrapper is ONLY responsible for authentication. It will not fetch page-specific data.
  // This eliminates the race condition entirely. The child page is now responsible for its own data.
  const isAuthenticating = authLoading || !user;

  useEffect(() => {
    // This logging remains for diagnostic purposes
    console.log('[AuthWrapper] Loading State Check:', {
      authLoading,
      userExists: !!user,
      isAuthenticating,
    });
  }, [authLoading, user, isAuthenticating]);


  if (isAuthenticating) {
    return <SplashScreen />;
  }

  // The wrapper no longer needs to clone props. It just renders the children when auth is ready.
  // The child page will handle its own data fetching and loading states.
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
