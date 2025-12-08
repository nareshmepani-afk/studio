
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import React, from 'react';
import SplashScreen from './SplashScreen';

interface AuthenticatedPageWrapperProps {
  children: React.ReactNode;
}

export function AuthenticatedPageWrapper({ children }: AuthenticatedPageWrapperProps) {
  const { user, loading: authLoading } = useAuth();

  // This wrapper is now ONLY responsible for authentication.
  // It shows a splash screen until the user object is available.
  const isAuthenticating = authLoading || !user;

  if (isAuthenticating) {
    return <SplashScreen />;
  }

  // Once authenticated, it renders the Navbar and the page content.
  // The child page is now responsible for its own data fetching and loading states.
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
