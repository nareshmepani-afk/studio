
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import React, { useEffect } from 'react';
import SplashScreen from './SplashScreen';
import { useMemories } from '@/hooks/useMemories';
import { usePromptFlags } from '@/hooks/usePromptFlags';

interface AuthenticatedPageWrapperProps {
  children: React.ReactNode;
}

export function AuthenticatedPageWrapper({ children }: AuthenticatedPageWrapperProps) {
  const { user, loading: authLoading } = useAuth();
  
  // Fetch data here in the stable wrapper
  const { memories, completedPromptIds, isLoading: isMemoriesLoading } = useMemories();
  const { flaggedPromptIds, isLoading: isFlagsLoading } = usePromptFlags();

  // SENIOR ENGINEER FIX:
  // The loading state is now determined by the definite presence of all required data objects.
  // This is the single source of truth. It will not turn false until `user`, `memories`,
  // and `flaggedPromptIds` are all populated, preventing the race condition.
  const isDataLoading = authLoading || !user || !memories || !flaggedPromptIds;
  
  useEffect(() => {
    // This logging remains for diagnostic purposes, but the logic above is the key fix.
    console.log('[AuthWrapper] Loading State Check:', {
      authLoading,
      userExists: !!user,
      memoriesExists: !!memories,
      flagsExist: !!flaggedPromptIds,
      isDataLoading,
    });
  }, [authLoading, user, memories, flaggedPromptIds, isDataLoading]);


  if (isDataLoading) {
    return <SplashScreen />;
  }

  // Clone children to pass down the fetched data as props.
  // This ensures the child page only renders when all data is available.
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { 
        memories, 
        completedPromptIds, 
        flaggedPromptIds,
      });
    }
    return child;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 animate-fade-in">
        {childrenWithProps}
      </main>
    </div>
  );
}
