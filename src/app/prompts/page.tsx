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

export default function LifeJourneyPage() {
  const { user } = useAuth();
  const [initialMemories, setInitialMemories] = useState<Memory[]>([]);
  const [initialFlaggedPromptIds, setInitialFlaggedPromptIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Adding db check here as well to be safe
    if (!user || !db) {
      setIsLoading(false);
      return;
    }

    // Fix: Added ! to db
    const memoriesRef = collection(db!, 'users', user.uid, 'memories');
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

    // Fix: Added ! to db on line 41
    const userDocRef = doc(db!, 'users', user.uid);
    const flagsUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            setInitialFlaggedPromptIds(new Set(userData.flaggedPrompts || []));
        }
    });

    memoriesPromise
      .then(memories => {
        setInitialMemories(memories);
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false);
      });

    return () => flagsUnsubscribe();

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