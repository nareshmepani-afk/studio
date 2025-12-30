
import React, { Suspense } from 'react';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Memory } from '@/types';
import { getAuth } from 'firebase/auth';

// This is the loading skeleton for the page.
function AddMemoryLoading() {
  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex justify-center mb-6 space-x-2">
        <Skeleton className="h-2 w-16 rounded-full" />
        <Skeleton className="h-2 w-16 rounded-full" />
      </div>
      <Card>
        <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Define the props for the server component
interface AddMemoryPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}


// This is the main Server Component for the page.
// It is responsible for fetching data on the server.
async function getMemory(memoryId: string, userId: string): Promise<Memory | null> {
    if (!userId) return null;
    try {
        const docRef = doc(db, 'users', userId, 'memories', memoryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Serialize Timestamps to ISO strings to safely pass to the client component.
            return {
                id: docSnap.id,
                ...data,
                date: (data?.date as any)?.toDate ? (data.date as any).toDate().toISOString() : data?.date,
                createdAt: (data?.createdAt as any)?.toDate ? (data.createdAt as any).toDate().toISOString() : undefined,
                updatedAt: (data?.updatedAt as any)?.toDate ? (data.updatedAt as any).toDate().toISOString() : undefined,
            } as Memory;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch memory:", error);
        return null;
    }
}


// The wrapper component handles suspense for a better loading experience.
export default function AddMemoryPageWrapper({ searchParams }: AddMemoryPageProps) {
    const editMemoryId = typeof searchParams.editMemoryId === 'string' ? searchParams.editMemoryId : undefined;
    const promptId = typeof searchParams.promptId === 'string' ? searchParams.promptId : undefined;
    const initialCustomPrompt = typeof searchParams.customPrompt === 'string' ? searchParams.customPrompt : undefined;
    
    return (
        <Suspense fallback={<AddMemoryLoading />}>
            <MemoryForm 
              editMemoryId={editMemoryId}
              promptId={promptId}
              initialCustomPrompt={initialCustomPrompt}
            />
        </Suspense>
    );
}
