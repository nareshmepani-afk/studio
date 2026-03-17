
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Memory } from '@/types';
import { mockPromptGroups } from '@/lib/mockData';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptsPageContent } from '@/components/prompts/PromptsPageContent';

export default function LifeJourneyPage() {
  const { user } = useAuth();
  const [initialMemories, setInitialMemories] = useState<Memory[]>([]);
  const [initialFlaggedPromptIds, setInitialFlaggedPromptIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [hostPassStatus, setHostPassStatus] = useState('inactive');

  useEffect(() => {
    if (user?.hostPassStatus) {
      setHostPassStatus(user.hostPassStatus);
    }

    console.log('TESTIMONY: Prompts page loading started.');
    if (!user || !db) {
      console.log('TESTIMONY: User not available, aborting data fetch.');
      setIsLoading(false);
      return;
    }

    console.log('TESTIMONY: User authenticated, fetching data for UID:', user.uid);

    // Correctly use the flaggedPrompts from the auth context
    if (user.flaggedPrompts) {
      console.log('TESTIMONY: Found flagged prompts in user context:', user.flaggedPrompts);
      setInitialFlaggedPromptIds(new Set(user.flaggedPrompts));
    } else {
      console.log('TESTIMONY: No flagged prompts found in user context.');
    }

    const memoriesRef = collection(db, 'users', user.uid, 'memories');
    const memoriesPromise = getDocs(memoriesRef).then(snapshot => 
        snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                ...data,
                id: docSnap.id,
                date: (data.date as any)?.toDate ? data.date.toDate().toISOString() : data.date,
                createdAt: (data.createdAt as any)?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: (data.updatedAt as any)?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            } as Memory;
        })
    );

    memoriesPromise
      .then(memories => {
        console.log('TESTIMONY: Successfully fetched memories:', memories);
        setInitialMemories(memories);
      })
      .catch(error => {
        console.error('TESTIMONY: Error fetching memories:', error);
      })
      .finally(() => {
        console.log('TESTIMONY: Prompts page loading finished.');
        setIsLoading(false);
      });

    // The onSnapshot listener for user flags has been removed as it was redundant.
    // The user object from useAuth is the single source of truth.

  }, [user]);

  return (
    <AuthenticatedPageWrapper>
      <PromptsPageContent 
        initialMemories={initialMemories}
        initialFlaggedPromptIds={initialFlaggedPromptIds}
        mockPromptGroups={mockPromptGroups}
        isLoading={isLoading}
        hostPassStatus={hostPassStatus}
      />
    </AuthenticatedPageWrapper>
  );
}
