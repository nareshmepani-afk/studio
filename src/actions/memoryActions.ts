'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Memory } from '@/types';
import { cookies } from 'next/headers';

async function getAuthenticatedUser(sessionCookie: string | undefined) {
    if (!sessionCookie) {
        throw new Error("User not authenticated; no session cookie provided.");
    }
    if (!adminAuth) {
        console.error("[ACTION] CRITICAL: Firebase Admin SDK is not initialized. Ensure SERVICE_ACCOUNT_JSON is set.");
        throw new Error("Server authentication is not configured.");
    }
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch (error) {
        console.error("[ACTION] Auth Error: Invalid session cookie.", error);
        throw new Error("Invalid session");
    }
}

export async function getMemoryById(memoryId: string): Promise<{ success: boolean; data?: Memory; message?: string }> {
    try {
        if (!adminDb) {
            throw new Error("Database service is not available.");
        }
        const memorySnapshot = await adminDb.collectionGroup('memories').where('id', '==', memoryId).limit(1).get();
        if (memorySnapshot.empty) {
            console.warn('[ACTION] getMemoryById: A memory with ID "' + memoryId + '" was not found.');
            return { success: false, message: 'Memory not found.' };
        }
        const memoryDoc = memorySnapshot.docs[0];
        const memoryData = memoryDoc.data() as Omit<Memory, 'id'>;
        const memory = { ...memoryData, id: memoryDoc.id };
        return { success: true, data: memory };
    } catch (error: any) {
        console.error("[ACTION] GetMemoryById Error:", error);
        return { success: false, message: 'Failed to retrieve memory. Check server logs for details.' };
    }
}


export async function saveMemory(
    memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>,
    memoryId: string | null
  ): Promise<{ success: boolean; message: string; data?: { id: string } }> {
    let userId: string;
  
    try {
        const sessionCookie = cookies().get('session')?.value
        const decodedToken = await getAuthenticatedUser(sessionCookie);
        userId = decodedToken.uid;

        if (userId !== memoryData.userId) {
            throw new Error("Mismatched user ID.");
        }

    } catch (error: any) {
        return { success: false, message: 'Authentication failed: ' + error.message };
    }
  
    try {
      const isEditing = !!memoryId;
      
      const finalMemoryData: Partial<Memory> = {
        ...memoryData,
        updatedAt: new Date().toISOString(),
      };
  
      if (isEditing) {
        const memRef = adminDb.collection('users').doc(userId).collection('memories').doc(memoryId!);
        await memRef.update(finalMemoryData);
      } else {
        const newId = crypto.randomUUID();
        finalMemoryData.id = newId;
        finalMemoryData.createdAt = new Date().toISOString();
        const newMemRef = adminDb.collection('users').doc(userId).collection('memories').doc(newId);
        await newMemRef.set(finalMemoryData);
        memoryId = newId;
      }
      
      revalidatePath('/prompts');
      revalidatePath('/timeline');
      
      return { success: true, message: isEditing ? "Memory updated" : "Memory saved", data: { id: memoryId! } };

    } catch (error: any) {
      console.error("[ACTION] Save Error CRASH:", { message: error.message, stack: error.stack });
      return { 
        success: false, 
        message: "Server Action Failed: " + error.message 
      };
    }
  }
