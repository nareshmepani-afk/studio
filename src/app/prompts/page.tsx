
"use client";

import React from 'react';
import { mockPromptGroups } from '@/lib/mockData';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptsPageContent } from '@/components/prompts/PromptsPageContent';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Memory } from '@/types';
import { useState, useEffect } from 'react';

// This page is now a client component to handle client-side data fetching.
export default function LifeJourneyPage() {
  const { user } = useAuth();
  const [initialMemories, setInitialMemories] = useState<Memory[]>([]);
  const [initialFlaggedPromptIds, setInitialFlaggedPromptIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Fetch initial memories
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

    // Set up listener for prompt flags
    const flagsDocRef = doc(db, 'userPromptFlags', user.uid);
    const flagsUnsubscribe = onSnapshot(flagsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setInitialFlaggedPromptIds(new Set(Object.keys(data).filter(key => data[key])));
        } else {
            setInitialFlaggedPromptIds(new Set());
        }
    });

    Promise.all([memoriesPromise])
      .then(([memories]) => {
        setInitialMemories(memories);
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      flagsUnsubscribe();
    };

  }, [user]);

  return (
    <AuthenticatedPageWrapper>
      <PromptsPageContent 
        initialMemories={initialMemories}
        initialFlaggedPromptIds={initialFlaggedPromptIds}
        mockPromptGroups={mockPromptGroups}
        isLoading={isLoading}
      />
    </AuthenticatedPageWrapper>
  );
}
