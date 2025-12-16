
import React from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { Timestamp } from 'firebase-admin/firestore';
import type { Memory } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { cookies } from 'next/headers';

// 1. Define Props for Next.js 15 (searchParams is a Promise)
interface AddMemoryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AddMemoryPage(props: AddMemoryPageProps) {
  // SAFETY NET: Wrap everything in a try/catch to prevent navigation cancellation
  try {
    console.log("[SERVER] AddMemoryPage execution started.");

    // This function must be async to correctly handle the cookies() API.
    const getUserIdFromCookie = async (): Promise<string | null> => {
        const sessionCookie = (await cookies()).get('firebase-auth-token')?.value;
        if (!sessionCookie) return null;
        try {
            // A placeholder for full auth verification
            const decodedToken = JSON.parse(Buffer.from(sessionCookie.split('.')[1], 'base64').toString());
            return decodedToken.uid;
        } catch (error) {
            console.error('[ADD_MEMORY_PAGE_SERVER] Error decoding session cookie:', (error as Error).message);
            return null;
        }
    }

    // 1. Await Params (Fixes the Next.js 15 error)
    const params = await props.searchParams;
    const editMemoryId = typeof params.editMemoryId === 'string' ? params.editMemoryId : undefined;
    const promptId = typeof params.promptId === 'string' ? params.promptId : undefined;
    const initialCustomPrompt = typeof params.prompt === 'string' ? params.prompt : undefined;

    console.log(`[SERVER] Params resolved. editMemoryId: ${editMemoryId}, promptId: ${promptId}`);

    // 2. Server-Side Fetching Logic
    let memoryData: Memory | null = null;
    let fetchError: string | null = null;
    
    const userId = await getUserIdFromCookie();

    if (!userId) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>You must be logged in to access this page. Your session may have expired.</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (editMemoryId) {
      if (!adminDb) {
        throw new Error("adminDb is undefined. Check src/lib/firebase-admin.ts exports.");
      }

      console.log(`[SERVER] Fetching memory from Firestore: users/${userId}/memories/${editMemoryId}`);
      const docRef = adminDb.collection('users').doc(userId).collection('memories').doc(editMemoryId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const data = docSnap.data();
        console.log("[SERVER] Memory found. Serializing data...");

        // Serialize Timestamps to Strings
        memoryData = {
          id: docSnap.id,
          ...data,
          date: data?.date instanceof Timestamp ? data.date.toDate().toISOString() : new Date().toISOString(),
          createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined,
          updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : undefined,
        } as Memory;

      } else {
        console.warn(`[SERVER] Memory ID ${editMemoryId} not found.`);
        fetchError = "Memory not found. It may have been deleted or you don't have permission to view it.";
      }
    }

    const componentKey = editMemoryId ? `edit-${editMemoryId}` : `new-${promptId || initialCustomPrompt || 'blank'}`;

    // 3. Render Success
    return (
      <AddMemoryPageContent
        key={componentKey}
        memoryToEdit={memoryData}
        promptId={promptId}
        initialCustomPrompt={initialCustomPrompt}
        error={fetchError}
      />
    );

  } catch (error: any) {
    // 4. ERROR BOUNDARY (Renders the error on screen so we can see it)
    console.error("[SERVER CRITICAL ERROR]", error);
    return (
      <div className="p-8 max-w-2xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-lg">
        <h1 className="text-xl font-bold text-red-700 mb-4">Server Component Error</h1>
        <p className="text-red-600 mb-4">
          The navigation was blocked because the server component crashed. Here is the error:
        </p>
        <pre className="bg-white p-4 rounded border border-red-100 text-sm font-mono overflow-auto">
          {error?.message || "Unknown Error"}
        </pre>
        <div className="mt-4 text-xs text-gray-500">
          Check your terminal logs for the full stack trace.
        </div>
      </div>
    );
  }
}
