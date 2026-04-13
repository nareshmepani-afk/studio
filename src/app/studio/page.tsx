
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudioData } from '@/hooks/studio/useStudioData';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { StudioDashboard } from '@/components/studio/StudioDashboard';

export default function StudioProductionPage() {
  const { user } = useAuth();
  const { chapters, memories, requests, stats, isLoading: studioLoading } = useStudioData(user?.uid);
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

  const isLoading = studioLoading || !user;

  return (
    <AuthenticatedPageWrapper>
      <StudioDashboard 
        chapters={chapters}
        requests={requests}
        stats={stats}
        initialFlaggedPromptIds={initialFlaggedPromptIds}
        isLoading={isLoading}
        directorPassStatus={directorPassStatus}
      />
    </AuthenticatedPageWrapper>
  );
}
