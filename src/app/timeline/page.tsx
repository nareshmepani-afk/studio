
export const dynamic = 'force-dynamic';

import React from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Import the singletons
import type { Memory } from '@/types';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { TimelinePageContent } from '@/components/memory/TimelinePageContent';

// The page no longer initializes the SDK. It uses the imported singletons.

// *** THE CRITICAL COOKIE FIX ***
// This function must be async to correctly handle the cookies() API.
async function getUserIdFromCookie(): Promise<string | null> {
    const sessionCookie = (await cookies()).get('firebase-auth-token')?.value;
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
        // *** THE CRITICAL SERIALIZATION FIX ***
        return {
            id: docSnap.id,
            title: data.title || '',
            date: (data.date as any)?.toDate ? (data.date as any).toDate().toISOString() : new Date().toISOString(),
            description: data.description || '',
            mediaAttachments: data.mediaAttachments || [],
            imageUrl: data.imageUrl || '',
            category: data.category || 'personal',
            isLegacy: data.isLegacy || false,
            promptId: data.promptId || null,
            // Safely add createdAt and updatedAt
            createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate().toISOString() : undefined,
            updatedAt: (data.updatedAt as any)?.toDate ? (data.updatedAt as any).toDate().toISOString() : undefined,
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
      // We can render an empty state if fetching fails
    }
  }

  return (
    <AuthenticatedPageWrapper>
      <TimelinePageContent initialMemories={memories} />
    </AuthenticatedPageWrapper>
  );
}
