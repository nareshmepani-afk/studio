
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import SplashScreen from './SplashScreen';

interface AuthenticatedPageWrapperProps {
  children: ReactNode;
}

export function AuthenticatedPageWrapper({ children }: AuthenticatedPageWrapperProps) {
  const { loading } = useAuth();

  // The main loading gate is now in AuthContext, which shows a SplashScreen.
  // We can render the children directly here as the AuthContext handles the loading screen.
  // If not authenticated, the context will redirect.
  
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
