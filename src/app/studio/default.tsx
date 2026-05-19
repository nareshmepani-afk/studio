'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
