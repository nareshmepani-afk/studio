
"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { app } from '@/lib/firebase';
import { useAuth } from './useAuth';

const db = getFirestore(app);

export function usePromptFlags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const promptFlagsDocRef = doc(db, 'userPromptFlags', user.id);
    
    const unsubscribe = onSnapshot(promptFlagsDocRef, (docSnap) => {
      const flags = new Set(Object.entries(docSnap.data() || {}).filter(([, v]) => v === true).map(([k]) => k));
      queryClient.setQueryData(['promptFlags', user.id], flags);
    });

    return () => unsubscribe();
  }, [user, queryClient]);

  const { data, isLoading, isError } = useQuery<Set<string>>({
    queryKey: ['promptFlags', user?.id],
    queryFn: async () => new Set<string>(), // populated by listener
    enabled: !!user,
    staleTime: Infinity,
  });

  return {
    flaggedPromptIds: data ?? new Set(),
    isLoading,
    isError,
  };
}
