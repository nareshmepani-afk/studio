
import React from 'react';
import { cookies } from 'next/headers';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { Memory } from '@/types';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { TimelinePageContent } from '@/components/memory/TimelinePageContent'; // We will create this client component next

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

// --- Server-Side Data Fetching --- //

async function getUserIdFromCookie(): Promise<string | null> {
    if (!getApps().length) return null;
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) return null;
    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error('[TIMELINE_PAGE_SERVER] Error verifying auth token:', (error as Error).message);
        return null;
    }
}

async function getUserMemories(userId: string): Promise<Memory[]> {
    const db = getFirestore();
    const memoriesQuery = query(collection(db, "users", userId, "memories"), orderBy('date', 'desc'));
    const snapshot = await getDocs(memoriesQuery);
    return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        // Ensure all necessary fields are correctly typed and handled, especially Timestamps
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

// --- The Server Component --- //

export default async function TimelinePage() {
  const userId = await getUserIdFromCookie();

  let memories: Memory[] = [];
  if (userId) {
    try {
      memories = await getUserMemories(userId);
    } catch (error) {
      console.error("[TIMELINE_PAGE_SERVER] Failed to fetch memories:", error);
      // Render the client component with empty memories in case of an error
    }
  }

  // Render the Client Component with the fetched data.
  // The client component will handle all filtering, sorting, and user interactions.
  return (
    <AuthenticatedPageWrapper>
      <TimelinePageContent initialMemories={memories} />
    </AuthenticatedPageWrapper>
  );
}
