
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { ReactNode, useEffect } from 'react';
// useRouter and usePathname are no longer needed here for redirection logic
import { Skeleton } from '@/components/ui/skeleton';

interface AuthenticatedPageWrapperProps {
  children: ReactNode;
}

export function AuthenticatedPageWrapper({ children }: AuthenticatedPageWrapperProps) {
  const { isAuthenticated, loading } = useAuth();
  // const router = useRouter(); // Removed: AuthContext now handles redirection

  // Removed useEffect that was pushing to '/login'
  // AuthContext will handle redirection if user is not authenticated and on a protected page.

  if (loading || !isAuthenticated) {
    // Show a loading state or a full-page loader
    // This skeleton will be shown while AuthContext determines auth status and potentially redirects.
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
    </div>
  );
}

    