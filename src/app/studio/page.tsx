'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudioData } from '@/hooks/studio/useStudioData';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { StudioDashboard } from '@/components/studio/StudioDashboard';

export default function StudioProductionPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
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
  // We use URLSearchParams directly for the very first frame to avoid a flicker.
  const isGuestModeFromURL = typeof window !== 'undefined' && 
                            window.location.search.includes('mode=guest') &&
                            window.location.search.includes('sessionId=');

  const isGuest = isGuestModeFromURL || (!user && searchParams.get('mode') === 'guest');

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
        sessionId={searchParams.get('sessionId') || ''}
      />
    </AuthenticatedPageWrapper>
  );
}
