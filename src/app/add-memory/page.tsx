
import React from 'react';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { getFirestore, doc, getDoc } from 'firebase-admin/firestore';
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import type { Memory } from '@/types';
import { headers } from 'next/headers';

// Helper to initialize Firebase Admin SDK safely on the server.
function initializeFirebaseAdmin(): { db: FirebaseFirestore.Firestore } {
  if (getApps().length > 0) {
    return { db: getFirestore() };
  }
  const app = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "memory-weaver-8rk9t",
  });
  return { db: getFirestore(app) };
}

// Interface for the props, which now directly includes searchParams
interface AddMemoryPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AddMemoryPage({ searchParams }: AddMemoryPageProps) {
  const { db } = initializeFirebaseAdmin();
  const headersList = headers();
  // IMPORTANT: This is a simplified way to get the user ID on the server.
  // In a real app, this would come from a secure, server-side session management system.
  const userId = headersList.get('x-user-id'); 

  const editMemoryId = typeof searchParams.editMemoryId === 'string' ? searchParams.editMemoryId : undefined;
  const promptId = typeof searchParams.promptId === 'string' ? searchParams.promptId : undefined;
  const initialCustomPrompt = typeof searchParams.prompt === 'string' ? searchParams.prompt : undefined;

  let memoryToEdit: Memory | null = null;
  let error: string | null = null;

  if (editMemoryId && userId) {
    try {
      console.log(`[SERVER] Fetching memory with ID: ${editMemoryId} for user: ${userId}`);
      const memoryDocRef = doc(db, 'users', userId, 'memories', editMemoryId);
      const memoryDocSnap = await getDoc(memoryDocRef);
      if (memoryDocSnap.exists()) {
        const data = memoryDocSnap.data();
        // Convert Firestore Timestamps to ISO strings for serialization
        memoryToEdit = {
          ...data,
          id: memoryDocSnap.id,
          date: (data.date as FirebaseFirestore.Timestamp)?.toDate ? (data.date as FirebaseFirestore.Timestamp).toDate().toISOString() : new Date().toISOString(),
          createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate ? (data.createdAt as FirebaseFirestore.Timestamp).toDate().toISOString() : undefined,
          updatedAt: (data.updatedAt as FirebaseFirestore.Timestamp)?.toDate ? (data.updatedAt as FirebaseFirestore.Timestamp).toDate().toISOString() : undefined,
        } as Memory;
         console.log(`[SERVER] Memory found:`, memoryToEdit.title);
      } else {
        error = "Memory not found. It may have been deleted.";
        console.warn(`[SERVER] Memory not found for ID: ${editMemoryId}`);
      }
    } catch (e) {
      console.error("[SERVER] Error fetching memory:", e);
      error = "An error occurred while loading the memory.";
    }
  }

  const componentKey = editMemoryId ? `edit-${editMemoryId}` : `new-${promptId || initialCustomPrompt || 'freeform'}`;
  
  return (
    <AuthenticatedPageWrapper>
        <AddMemoryPageContent
          key={componentKey}
          memoryToEdit={memoryToEdit}
          promptId={promptId}
          initialCustomPrompt={initialCustomPrompt}
          error={error}
        />
    </AuthenticatedPageWrapper>
  );
}
