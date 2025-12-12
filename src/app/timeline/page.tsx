
export const dynamic = 'force-dynamic';

import React from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Import the singletons
import type { Memory } from '@/types';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { TimelinePageContent } from '@/components/memory/TimelinePageContent';

// The page no longer initializes the SDK. It uses the imported singletons.

async function getUserIdFromCookie(): Promise<string | null> {
    const sessionCookie = cookies().get('firebase-auth-token')?.value;
    if (!sessionCookie) return null;
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
        return decodedToken.uid;
    } catch (error) {
        console.error('[TIMELINE_PAGE_SERVER] Error verifying session cookie:', (error as Error).message);
        return null;
    }
}

async function getUserMemories(userId: string): Promise<Memory[]> {
    const memoriesQuery = adminDb.collection("users").doc(userId).collection("memories").orderBy('date', 'desc');
    const snapshot = await memoriesQuery.get();
    return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            title: data.title || '',
            date: (data.date as any)?.toDate ? (data.date as any).toDate().toISOString() : new Date().toISOString(),
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            category: data.category || 'personal',
            isLegacy: data.isLegacy || false,
            promptId: data.promptId || null,
        } as Memory;
    });
}

export default async function TimelinePage() {
  const userId = await getUserIdFromCookie();

  let memories: Memory[] = [];
  if (userId) {
    try {
      memories = await getUserMemories(userId);
    } catch (error) {
      console.error("[TIMELINE_PAGE_SERVER] Failed to fetch memories:", error);
    }
  }

  return (
    <AuthenticatedPageWrapper>
      <TimelinePageContent initialMemories={memories} />
    </AuthenticatedPageWrapper>
  );
}
