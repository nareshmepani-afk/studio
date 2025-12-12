
export const dynamic = 'force-dynamic';

import React from 'react';
import { cookies } from 'next/headers';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { mockPromptGroups } from '@/lib/mockData';
import type { Memory } from '@/types';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptsPageContent } from '@/components/prompts/PromptsPageContent'; // We will create this client component next

// Initialize Firebase Admin SDK (same as before)
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
        console.error('[PROMPTS_PAGE_SERVER] Error verifying auth token:', (error as Error).message);
        return null;
    }
}

async function getUserMemories(userId: string): Promise<Memory[]> {
    const db = getFirestore();
    const memoriesQuery = collection(db, "users", userId, "memories");
    const snapshot = await getDocs(memoriesQuery);
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
    const db = getFirestore();
    const flagsDocRef = doc(db, 'userPromptFlags', userId);
    const docSnap = await getDoc(flagsDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return new Set(Object.keys(data).filter(key => data[key]));
    }
    return new Set();
}

// --- The Server Component --- //

export default async function LifeJourneyPage() {
  const userId = await getUserIdFromCookie();

  // If no user, we can render a simple state without fetching data
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

  // Fetch all necessary data on the server, in parallel
  const [memories, flaggedPromptIds] = await Promise.all([
    getUserMemories(userId),
    getUserPromptFlags(userId),
  ]);

  // Now, render the client component with this fresh, reliable data
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
