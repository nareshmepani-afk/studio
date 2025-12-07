
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
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

  const isDataLoading = authLoading || (user && (isMemoriesLoading || isFlagsLoading));

  if (isDataLoading) {
    return <SplashScreen />;
  }

  // Clone children to pass down the fetched data as props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { 
        memories, 
        completedPromptIds, 
        flaggedPromptIds,
        isDataLoading: isDataLoading 
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
