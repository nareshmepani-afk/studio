
export const dynamic = 'force-dynamic';

import React from 'react';
import { cookies } from 'next/headers';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { Memory } from '@/types';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { TimelinePageContent } from '@/components/memory/TimelinePageContent';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

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
