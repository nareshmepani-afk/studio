
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { ReactNode, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthenticatedPageWrapperProps {
  children: ReactNode;
}

export function AuthenticatedPageWrapper({ children }: AuthenticatedPageWrapperProps) {
  const { isAuthenticated, loading } = useAuth();

  // The main loading gate is now in AuthContext, so we don't need to check `isAuthenticated` here.
  // We just show a skeleton if the context itself is loading.
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-8 w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If the user is not authenticated, AuthContext will redirect them.
  // If they are authenticated, it's safe to render the children.
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
