
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Memory } from '@/types.ts';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { TimelinePageContent } from '@/components/memory/TimelinePageContent';
import { Loader2 } from 'lucide-react';

export default function TimelinePage() {
  const { user, loading: authLoading } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize an unsubscribe function to be a no-op.
    let unsubscribe: Unsubscribe = () => {};

    if (user) {
      setIsLoading(true);
      const memoriesQuery = query(collection(db, "users", user.uid, "memories"), orderBy('date', 'desc'));
      
      // Assign the onSnapshot unsubscribe function.
      unsubscribe = onSnapshot(memoriesQuery, 
        (snapshot) => {
          const fetchedMemories = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || '',
              date: (data.date as any)?.toDate ? (data.date as any).toDate().toISOString() : new Date().toISOString(),
              description: data.description || '',
              mediaAttachments: data.mediaAttachments || [],
              category: data.category || 'personal',
              isLegacy: data.isLegacy || false,
              promptId: data.promptId || null,
              createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate().toISOString() : undefined,
              updatedAt: (data.updatedAt as any)?.toDate ? (data.updatedAt as any).toDate().toISOString() : undefined,
            } as Memory;
          });
          setMemories(fetchedMemories);
          setIsLoading(false);
        }, 
        (error) => {
          // The error is now expected on logout, so we can log it less severely or ignore.
          // console.warn("[TIMELINE_PAGE_CLIENT] Snapshot listener error:", error.message);
          setMemories([]); // Clear memories on error/permission issue
          setIsLoading(false);
        }
      );
    } else {
      // If there is no user, clear memories and ensure loading is false.
      setMemories([]);
      setIsLoading(false);
    }

    // Return the cleanup function. On re-render or unmount, this will
    // be called, ensuring the listener is detached.
    return () => unsubscribe();
  }, [user]); // Depend only on the user object to manage the listener lifecycle.
  
  if (isLoading || authLoading) {
      return (
        <AuthenticatedPageWrapper>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-headline mb-2">Loading Timeline...</h2>
            </div>
        </AuthenticatedPageWrapper>
      )
  }

  return (
    <AuthenticatedPageWrapper>
      <TimelinePageContent initialMemories={memories} />
    </AuthenticatedPageWrapper>
  );
}
