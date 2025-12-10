
"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFirestore, collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { app } from '@/lib/firebase';
import type { Memory } from '@/types';
import { useAuth } from './useAuth';

const db = getFirestore(app);

export function useMemories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isInitialSnapshotLoading, setInitialSnapshotLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setInitialSnapshotLoading(false);
        // When user logs out, clear the memories data
        queryClient.setQueryData(['memories', user?.id], []);
        return;
    }

    setInitialSnapshotLoading(true);

    const memoriesQuery = query(collection(db, "users", user.id, "memories"), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(memoriesQuery, (snapshot) => {
      const fetchedMemories = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        // ** THE FIX IS HERE **
        // Ensure the ID from the document snapshot is always correctly assigned.
        // This guarantees data integrity for all downstream components.
        return {
          ...data,
          id: docSnap.id, // Explicitly assign the document ID
          date: (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString() : data.date,
        } as Memory;
      });
      
      queryClient.setQueryData(['memories', user.id], fetchedMemories);
      setInitialSnapshotLoading(false);

    }, (error) => {
        console.error("Error fetching memories snapshot:", error);
        setInitialSnapshotLoading(false);
    });

    return () => unsubscribe();
  }, [user, queryClient]);

  const { data: memories, isError } = useQuery<Memory[]>({ 
    queryKey: ['memories', user?.id],
    // The queryFn is no longer needed as the onSnapshot listener populates the cache.
    // We provide an empty array as the initial data.
    initialData: [],
    enabled: !!user,
    staleTime: Infinity,
  });

  return {
    memories: memories ?? [],
    completedPromptIds: new Set((memories ?? []).map(m => m.promptId).filter(Boolean) as string[]),
    isLoading: !!user && isInitialSnapshotLoading,
    isError,
  };
}
