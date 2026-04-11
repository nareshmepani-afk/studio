"use client";

import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import React from 'react';
import SplashScreen from './SplashScreen';

interface AuthenticatedPageWrapperProps {
  children: React.ReactNode;
}

export function AuthenticatedPageWrapper({ children }: AuthenticatedPageWrapperProps) {
  const { user, loading: authLoading } = useAuth();

  // While we are checking (loading is true), show the splash screen
  if (authLoading) {
    return <SplashScreen />;
  }

  // If loading is finished but no user, we render nothing. The hook handles the redirect.
  if (!user) {
    return null;
  }

  // Success!
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
