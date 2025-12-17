
export const dynamic = 'force-dynamic';

import React from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { mockPromptGroups } from '@/lib/mockData';
import type { Memory } from '@/types';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptsPageContent } from '@/components/prompts/PromptsPageContent';

// FIX: This function is now async to properly use the `cookies` API.
async function getUserIdFromCookie(): Promise<string | null> {
    // FIX: `cookies()` is now awaited.
    const sessionCookie = (await cookies()).get('firebase-auth-token')?.value;
    if (!sessionCookie) return null;
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
        return decodedToken.uid;
    } catch (error) {
        console.error('[PROMPTS_PAGE_SERVER] Error verifying session cookie:', (error as Error).message);
        return null;
    }
}

async function getUserMemories(userId: string): Promise<Memory[]> {
    const memoriesQuery = adminDb.collection("users").doc(userId).collection("memories");
    const snapshot = await memoriesQuery.get();
    return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        // FIX: Convert Firestore Timestamps to serializable ISO strings.
        // This prevents the "Only plain objects can be passed to Client Components" error.
        return {
            ...data,
            id: docSnap.id,
            date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Memory;
    });
}

async function getUserPromptFlags(userId: string): Promise<Set<string>> {
    const flagsDocRef = adminDb.collection('userPromptFlags').doc(userId);
    const docSnap = await flagsDocRef.get();
    if (docSnap.exists) {
        const data = docSnap.data();
        return new Set(Object.keys(data!).filter(key => data![key]));
    }
    return new Set();
}

export default async function LifeJourneyPage() {
  const userId = await getUserIdFromCookie();

  if (!userId) {
    return (
      <AuthenticatedPageWrapper>
        <PromptsPageContent 
            initialMemories={[]}
            initialFlaggedPromptIds={new Set()}
            mockPromptGroups={mockPromptGroups}
        />
      </AuthenticatedPageWrapper>
    );
  }

  const [memories, flaggedPromptIds] = await Promise.all([
    getUserMemories(userId),
    getUserPromptFlags(userId),
  ]);

  return (
    <AuthenticatedPageWrapper>
      <PromptsPageContent 
        initialMemories={memories}
        initialFlaggedPromptIds={flaggedPromptIds}
        mockPromptGroups={mockPromptGroups}
      />
    </AuthenticatedPageWrapper>
  );
}
