'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudioData } from '@/hooks/studio/useStudioData';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { useRouter, usePathname } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { StudioDashboard } from '@/components/studio/StudioDashboard';

export default function StudioProductionPage() {
  const { user } = useAuth();
  const state = useStudioState();
  const { chapters, memories, requests, stats, isLoading: studioLoading } = useStudioData(user?.uid || 'guest');
  const [directorPassStatus, setDirectorPassStatus] = useState('inactive');
  const [initialFlaggedPromptIds, setInitialFlaggedPromptIds] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

  // Scroll Restoration Override: When navigating back from production modal, force scroll to top
  useEffect(() => {
    if (pathname === '/studio' && previousPathnameRef.current && previousPathnameRef.current.includes('/production/')) {
      console.log("[StudioProductionPage] Transition back to dashboard detected. Enforcing scroll override...");
      if (typeof window !== 'undefined') {
        try {
          window.history.scrollRestoration = 'manual';
          console.log("[StudioProductionPage] scrollRestoration set to manual");
        } catch (e) {
          console.warn("[StudioProductionPage] Failed to set scrollRestoration to manual:", e);
        }
        
        const forceScroll = () => {
          const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
          const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
          console.log(`[StudioProductionPage] Scroll Sync Check: pageHeight=${docHeight}px, scrollY=${currentY}px`);
          
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        };
        
        forceScroll();
        setTimeout(forceScroll, 50);
        setTimeout(forceScroll, 150);
        setTimeout(forceScroll, 350);
        setTimeout(forceScroll, 600);
        setTimeout(forceScroll, 1000);
      }
    }
    previousPathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (user?.directorPassStatus) {
      setDirectorPassStatus(user.directorPassStatus);
    }
    if (user?.flaggedPrompts) {
      setInitialFlaggedPromptIds(new Set(user.flaggedPrompts));
    }
  }, [user]);

  // GUEST MODE: Highest priority check for the loading state.
  // Prevent SSR hydration mismatch by resolving guest mode search parameters on mount
  const [isGuestModeFromURL, setIsGuestModeFromURL] = useState(false);

  useEffect(() => {
    setIsGuestModeFromURL(
      window.location.search.includes('mode=guest') &&
      window.location.search.includes('sessionId=')
    );
  }, []);

  const isGuest = isGuestModeFromURL || (!user && state?.mode === 'guest');

  const isLoading = isGuest ? false : (studioLoading || !user);

  return (
    <AuthenticatedPageWrapper>
      <StudioDashboard 
        chapters={chapters}
        requests={requests}
        stats={stats}
        initialFlaggedPromptIds={initialFlaggedPromptIds}
        isLoading={isLoading}
        directorPassStatus={directorPassStatus}
        isGuest={isGuest}
        sessionId={state?.sessionId || ''}
      />
    </AuthenticatedPageWrapper>
  );
}
