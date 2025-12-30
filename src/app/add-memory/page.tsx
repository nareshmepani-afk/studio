
import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { MemoryForm } from '@/components/memory/MemoryForm';
import type { Memory } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Timestamp } from 'firebase-admin/firestore';
import { notFound } from 'next/navigation';

async function getUserIdFromCookie(): Promise<string | null> {
    const sessionCookie = cookies().get('firebase-auth-token')?.value;
    if (!sessionCookie) return null;
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken.uid;
    } catch (error) {
        console.error('[SERVER/add-memory] Error verifying session cookie:', (error as Error).message);
        return null;
    }
}

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

interface AddMemoryPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function AddMemoryPage({ searchParams }: AddMemoryPageProps) {
  const { editMemoryId, promptId, customPrompt } = searchParams;
  const userId = await getUserIdFromCookie();
  
  if (!userId) {
    // This should be caught by middleware or auth context, but as a fallback
    return <div className="text-center text-red-500">You must be logged in to view this page.</div>;
  }

  let memoryToEdit: Memory | null = null;
  
  if (typeof editMemoryId === 'string' && editMemoryId) {
    try {
        const docRef = adminDb.collection('users').doc(userId).collection('memories').doc(editMemoryId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            // Serialize data for client
            memoryToEdit = {
                id: docSnap.id,
                ...data,
                date: data?.date instanceof Timestamp ? data.date.toDate().toISOString() : data?.date,
                createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data?.createdAt,
                updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
            } as Memory;
        } else {
            console.warn(`[SERVER/add-memory] Memory ID ${editMemoryId} not found for user ${userId}.`);
            notFound();
        }
    } catch(error) {
        console.error(`[SERVER/add-memory] Failed to fetch memory ${editMemoryId}:`, error);
        // Render an error state or redirect
        return <div className="text-center text-red-500">Failed to load memory. Please try again.</div>;
    }
  }

  return (
    <MemoryForm 
      memoryToEdit={memoryToEdit} 
      promptId={typeof promptId === 'string' ? promptId : undefined}
      initialCustomPrompt={typeof customPrompt === 'string' ? customPrompt : undefined}
    />
  );
}


export default function AddMemoryPageWrapper(props: AddMemoryPageProps) {
    return (
        <Suspense fallback={<AddMemoryLoading />}>
            <AddMemoryPage {...props} />
        </Suspense>
    );
}
