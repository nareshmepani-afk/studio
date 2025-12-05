
"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFirestore, collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useEffect } from 'react';
import { app } from '@/lib/firebase';
import type { Memory } from '@/types';
import { useAuth } from './useAuth';

const db = getFirestore(app);

export function useMemories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const memoriesQuery = query(collection(db, "users", user.id, "memories"), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(memoriesQuery, (snapshot) => {
      const fetchedMemories = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString() : data.date,
        } as Memory;
      });
      queryClient.setQueryData(['memories', user.id], fetchedMemories);
    });

    return () => unsubscribe();
  }, [user, queryClient]);

  const { data, isLoading, isError } = useQuery<Memory[]>({
    queryKey: ['memories', user?.id],
    queryFn: async () => {
      // The query will be populated by the snapshot listener,
      // so this function can be a placeholder or fetch initial data if needed.
      return [];
    },
    enabled: !!user,
    staleTime: Infinity, // Data is managed by the real-time listener
  });

  return {
    memories: data ?? [],
    completedPromptIds: new Set((data ?? []).map(m => m.promptId).filter(Boolean) as string[]),
    isLoading: isLoading || (!!user && data === undefined), // More robust loading state
    isError,
  };
}
