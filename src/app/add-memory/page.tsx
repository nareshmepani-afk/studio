
import React from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { Memory } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

async function getUserIdFromCookie(): Promise<string | null> {
    const sessionCookie = (await cookies()).get('firebase-auth-token')?.value;
    if (!sessionCookie) return null;
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken.uid;
    } catch (error) {
        console.error('[ADD_MEMORY_PAGE_SERVER] Error verifying session cookie:', (error as Error).message);
        return null;
    }
}

async function getMemory(editMemoryId: string, userId: string): Promise<{ memory: Memory | null; error: string | null; }> {
  if (!userId) {
    return { memory: null, error: "Authentication failed. You must be logged in to view this content." };
  }

  try {
    const memoryDocRef = adminDb.collection('users').doc(userId).collection('memories').doc(editMemoryId);
    const memoryDocSnap = await memoryDocRef.get();

    if (!memoryDocSnap.exists) {
      return { memory: null, error: "Memory not found. It may have been deleted or you don't have permission to view it." };
    }

    const data = memoryDocSnap.data();
    if (!data) {
        return { memory: null, error: "Memory data is empty or corrupted." };
    }

    // *** THE CRITICAL SERIALIZATION FIX ***
    // Ensure all Timestamp fields are converted to ISO strings before passing to client.
    const memory: Memory = {
      ...data,
      id: memoryDocSnap.id,
      date: (data.date as any)?.toDate ? (data.date as any).toDate().toISOString() : new Date().toISOString(),
      createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate().toISOString() : undefined,
      updatedAt: (data.updatedAt as any)?.toDate ? (data.updatedAt as any).toDate().toISOString() : undefined,
    } as Memory;
    
    return { memory, error: null };

  } catch (e) {
    console.error("[ADD_MEMORY_PAGE_SERVER] Error fetching memory:", e);
    return { memory: null, error: "A server error occurred while loading the memory." };
  }
}

interface AddMemoryPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AddMemoryPage({ searchParams }: AddMemoryPageProps) {
  
  // THE FINAL, CORRECTED FIX: Access searchParams directly as it's passed as a plain object by Next.js in this version.
  const editMemoryId = typeof searchParams.editMemoryId === 'string' ? searchParams.editMemoryId : undefined;
  const promptId = typeof searchParams.promptId === 'string' ? searchParams.promptId : undefined;
  const initialCustomPrompt = typeof searchParams.prompt === 'string' ? searchParams.prompt : undefined;
  
  const userId = await getUserIdFromCookie();

  if (!userId) {
      return (
        <AuthenticatedPageWrapper>
          <div className="container mx-auto py-8 px-4">
              <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>You must be logged in to access this page. Your session may have expired.</AlertDescription>
              </Alert>
          </div>
        </AuthenticatedPageWrapper>
      );
  }

  const componentKey = editMemoryId ? `edit-${editMemoryId}` : `new-${promptId || initialCustomPrompt || 'freeform'}`;

  if (editMemoryId) {
    const { memory, error } = await getMemory(editMemoryId, userId);

    return (
      <AuthenticatedPageWrapper>
        <AddMemoryPageContent
          key={componentKey}
          memoryToEdit={memory}
          promptId={promptId}
          initialCustomPrompt={initialCustomPrompt}
          error={error}
        />
      </AuthenticatedPageWrapper>
    );
  } else {
    return (
      <AuthenticatedPageWrapper>
        <AddMemoryPageContent
          key={componentKey}
          memoryToEdit={null}
          promptId={promptId}
          initialCustomPrompt={initialCustomPrompt}
          error={null}
        />
      </AuthenticatedPageWrapper>
    );
  }
}
