
import React from 'react';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Memory } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// Define the props for the server component
interface AddMemoryPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getUserIdFromCookie(): Promise<string | null> {
    // Robustness Check: Ensure adminAuth is initialized
    if (!adminAuth) {
        console.error("[SERVER] adminAuth is not initialized. Cannot get user ID.");
        return null;
    }
    try {
        const sessionCookie = cookies().get('firebase-session')?.value;
        if (!sessionCookie) return null;
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken.uid;
    } catch (error) {
        console.error("[SERVER] Error verifying session cookie:", error);
        return null;
    }
}

async function getMemory(memoryId: string): Promise<Memory | null> {
    // Robustness Check: Ensure adminDb is initialized
    if (!adminDb) {
        console.error("[SERVER] adminDb is not initialized. Cannot fetch memory.");
        return null;
    }

    const userId = await getUserIdFromCookie();
    if (!userId) {
        console.error("[SERVER] Could not get user ID, aborting memory fetch.");
        return null;
    }

    try {
        const docRef = adminDb.collection('users').doc(userId).collection('memories').doc(memoryId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            if (!data) return null;
            // Serialize Timestamps to ISO strings to safely pass to the client component.
            return {
                id: docSnap.id,
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            } as Memory;
        }
        console.warn(`[SERVER] Memory with ID ${memoryId} not found for user ${userId}.`);
        return null;
    } catch (error) {
        console.error("[SERVER] Failed to fetch memory:", error);
        return null;
    }
}

// The main Server Component for the page.
export default async function AddMemoryPage({ searchParams }: AddMemoryPageProps) {
    const editMemoryId = typeof searchParams.editMemoryId === 'string' ? searchParams.editMemoryId : undefined;
    const promptId = typeof searchParams.promptId === 'string' ? searchParams.promptId : undefined;
    const initialCustomPrompt = typeof searchParams.customPrompt === 'string' ? searchParams.customPrompt : undefined;
    
    let memoryToEdit: Memory | null = null;
    if (editMemoryId) {
        memoryToEdit = await getMemory(editMemoryId);
    }
    
    // Pass serialized data as a prop. If memoryToEdit is null, the form will act as a "new memory" form.
    return (
        <MemoryForm 
          memoryToEdit={memoryToEdit}
          promptId={promptId}
          initialCustomPrompt={initialCustomPrompt}
        />
    );
}

