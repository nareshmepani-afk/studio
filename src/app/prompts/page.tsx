export const dynamic = 'force-dynamic';

import React from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { mockPromptGroups } from '@/lib/mockData';
import type { Memory } from '@/types';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptsPageContent } from '@/components/prompts/PromptsPageContent';

// This is the definitive check. If firebase-admin failed, this will throw a clear error.
if (!adminAuth || !adminDb) {
  throw new Error(
    'CRITICAL: Firebase Admin SDK is not initialized. Check the server logs for the original error in firebase-admin.ts. The service account key is likely missing or malformed in the environment variables.'
  );
}

// *** THE CRITICAL COOKIE FIX ***
// This function must be async to correctly handle the cookies() API.
async function getUserIdFromCookie(): Promise<string | null> {
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
        // *** THE CRITICAL SERIALIZATION FIX ***
        return {
            ...data,
            id: docSnap.id,
            date: (data.date as any)?.toDate ? (data.date as any).toDate().toISOString() : data.date,
            createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate().toISOString() : undefined,
            updatedAt: (data.updatedAt as any)?.toDate ? (data.updatedAt as any).toDate().toISOString() : undefined,
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
    // Render for logged-out user or if cookie is invalid
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

  // Fetch user data now that we have a valid userId
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
