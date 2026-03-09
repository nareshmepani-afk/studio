
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Memory } from '@/types';
import { mockPromptGroups } from '@/lib/mockData';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptsPageContent } from '@/components/prompts/PromptsPageContent';

async function getUserData(uid: string) {
  console.log("TESTIMONY: Fetching user data for UID:", uid);
  // This function would need to be adapted for client-side fetching or an API route
  // For now, we will rely on the auth state's user object which should be updated
  return null;
}

export default function LifeJourneyPage() {
  const { user } = useAuth();
  const [initialMemories, setInitialMemories] = useState<Memory[]>([]);
  const [initialFlaggedPromptIds, setInitialFlaggedPromptIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [hostPassStatus, setHostPassStatus] = useState('inactive'); // Add this line

  useEffect(() => {
    if (user?.hostPassStatus) {
      setHostPassStatus(user.hostPassStatus);
    }
  }, [user]);

  useEffect(() => {
    console.log('TESTIMONY: Prompts page loading started.');
    if (!user || !db) {
      console.log('TESTIMONY: User not authenticated, aborting data fetch.');
      setIsLoading(false);
      return;
    }

    console.log('TESTIMONY: User authenticated, fetching data for UID:', user.uid);

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

    const userDocRef = doc(db, 'users', user.uid);
    const flagsUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log('TESTIMONY: Fetched user profile with flagged prompts:', userData.flaggedPrompts);
            setInitialFlaggedPromptIds(new Set(userData.flaggedPrompts || []));
        }
    });

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

    return () => flagsUnsubscribe();

  }, [user]);

  return (
    <AuthenticatedPageWrapper>
      <PromptsPageContent 
        initialMemories={initialMemories}
        initialFlaggedPromptIds={initialFlaggedPromptIds}
        mockPromptGroups={mockPromptGroups}
        isLoading={isLoading}
        hostPassStatus={hostPassStatus} // Pass this down
      />
    </AuthenticatedPageWrapper>
  );
}
