
"use server";

import { cookies } from 'next/headers';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, doc, getDoc } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { Memory } from '@/types';

// This is the secure data-fetching logic, encapsulated in a Server Action.
// It is guaranteed to run on the server in a Node.js environment.

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

  // Read the cookie directly within the server action.
  const token = cookies().get('firebase-auth-token')?.value;
  if (!token) return null;

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('[GET_MEMORY_ACTION] Error verifying auth token:', (error as Error).message);
    return null;
  }
}

interface ActionResult {
    memory: Memory | null;
    error: string | null;
}

export async function getMemory(editMemoryId: string): Promise<ActionResult> {
  const userId = await getUserIdFromCookie();

  if (!userId) {
    return { memory: null, error: "Authentication failed. You must be logged in to view this content." };
  }

  try {
    const db = getFirestore();
    console.log(`[GET_MEMORY_ACTION] Fetching memory: ${editMemoryId} for user: ${userId}`);
    const memoryDocRef = doc(db, 'users', userId, 'memories', editMemoryId);
    const memoryDocSnap = await getDoc(memoryDocRef);

    if (!memoryDocSnap.exists()) {
      return { memory: null, error: "Memory not found. It may have been deleted or you don't have permission to view it." };
    }

    const data = memoryDocSnap.data();
    const memory: Memory = {
      ...data,
      id: memoryDocSnap.id,
      date: (data.date as any)?.toDate ? (data.date as any).toDate().toISOString() : new Date().toISOString(),
      createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate().toISOString() : undefined,
      updatedAt: (data.updatedAt as any)?.toDate ? (data.updatedAt as any).toDate().toISOString() : undefined,
    } as Memory;
    
    return { memory, error: null };

  } catch (e) {
    console.error("[GET_MEMORY_ACTION] Error fetching memory:", e);
    return { memory: null, error: "A server error occurred while loading the memory." };
  }
}
