"use client";

import { useEffect, useState } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { Loader2, Calendar } from 'lucide-react';
import type { Memory } from '@/types';

export default function TimelinePage() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    // Guard: Ensure both user and db are initialized
    if (user && db) {
      setIsLoading(true);
      
      // Use non-null assertion db! and ensure user.uid exists
      const memoriesQuery = query(
        collection(db, "users", user.uid, "memories"), 
        orderBy('date', 'desc')
      );
        
      unsubscribe = onSnapshot(memoriesQuery, 
        (snapshot) => {
          const memoriesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Memory[];
          setMemories(memoriesData);
          setIsLoading(false);
        },
        (error) => {
          console.error("Timeline: Error fetching memories:", error);
          setIsLoading(false);
        }
      );
    } else if (!user) {
      // If there's no user, we stop loading but don't try to fetch
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, [user]);

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center space-x-2 mb-8">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-4xl">Your Timeline</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : memories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground text-lg">No memories found. Start by creating one!</p>
          </div>
        )}
      </div>
    </AuthenticatedPageWrapper>
  );
}