
export const dynamic = 'force-dynamic';

import React from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Import the singletons
import { mockPromptGroups } from '@/lib/mockData';
import type { Memory } from '@/types';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptsPageContent } from '@/components/prompts/PromptsPageContent';

// The page no longer initializes the SDK. It uses the imported singletons.

async function getUserIdFromCookie(): Promise<string | null> {
    const sessionCookie = cookies().get('firebase-auth-token')?.value;
    if (!sessionCookie) return null;
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
        return decodedToken.uid;
    } catch (error) {
        // If the session cookie is invalid, it will be caught here.
        // We can log this for debugging, but it's a normal part of the flow.
        console.error('[PROMPTS_PAGE_SERVER] Error verifying session cookie:', (error as Error).message);
        return null;
    }
}

async function getUserMemories(userId: string): Promise<Memory[]> {
    const memoriesQuery = adminDb.collection("users").doc(userId).collection("memories");
    const snapshot = await memoriesQuery.get();
    return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            ...data,
            id: docSnap.id,
            date: (data.date as any)?.toDate ? (data.date as any).toDate().toISOString() : data.date,
        } as Memory;
    });
}

async function getUserPromptFlags(userId: string): Promise<Set<string>> {
    const flagsDocRef = adminDb.collection('userPromptFlags').doc(userId);
    const docSnap = await flagsDocRef.get();
    if (docSnap.exists) {
        const data = docSnap.data();
        // Filter out falsy values that might be stored from previous logic
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
