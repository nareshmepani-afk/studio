
import React from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { Timestamp } from 'firebase-admin/firestore';

interface AddMemoryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Helper function to securely get the user ID from the session cookie
async function getUserIdFromCookie(): Promise<string | null> {
    const sessionCookie = (await cookies()).get('firebase-auth-token')?.value;
    if (!sessionCookie) return null;
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken.uid;
    } catch (error) {
        console.error('[AUTH] Error verifying session cookie:', (error as Error).message);
        return null;
    }
}

export default async function AddMemoryPage(props: AddMemoryPageProps) {
  console.log("[SERVER] AddMemoryPage execution started.");
  let memoryData = null;
  let error: string | null = null;

  try {
    const params = await props.searchParams;
    const editMemoryId = typeof params.editMemoryId === 'string' ? params.editMemoryId : undefined;
    const promptId = typeof params.promptId === 'string' ? params.promptId : undefined;
    const promptText = typeof params.prompt === 'string' ? params.prompt : undefined;

    if (editMemoryId) {
      console.log(`[SERVER] Attempting to edit memory: ${editMemoryId}`);
      const userId = await getUserIdFromCookie();

      if (!userId) {
        console.error("[SERVER] Error: User is not authenticated but trying to edit a memory.");
        error = "You must be logged in to edit a memory. Please sign in and try again.";
      } else {
        console.log(`[SERVER] User ${userId} is authenticated. Fetching from sub-collection.`);
        
        const docRef = adminDb.collection('users').doc(userId).collection('memories').doc(editMemoryId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          console.log(`[SERVER] Success! Document ${editMemoryId} found for user ${userId}.`);
          const data = docSnap.data();
          memoryData = {
            id: docSnap.id,
            ...data,
            date: data?.date instanceof Timestamp ? data.date.toDate().toISOString() : data?.date,
            createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data?.createdAt,
            updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
          };
        } else {
          console.warn(`[SERVER] WARNING: Document ${editMemoryId} does not exist for user ${userId}.`);
          error = `The memory you are trying to edit (ID: ${editMemoryId}) could not be found in your account. It may have been deleted.`;
        }
      }
    }
    
    const componentKey = editMemoryId ? `edit-${editMemoryId}` : `new-${promptId || 'blank'}`;

    return (
      <AddMemoryPageContent
        key={componentKey}
        memoryToEdit={memoryData}
        promptId={promptId}
        initialCustomPrompt={promptText}
        error={error}
      />
    );

  } catch (e: any) {
    console.error("[SERVER CRITICAL ERROR]", e);
    error = e.message || "An unexpected error occurred while loading the page.";
    return (
      <AddMemoryPageContent
        memoryToEdit={null}
        error={error}
      />
    );
  }
}
