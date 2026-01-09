'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from "@/lib/session";
import { Memory } from '@/types';

export async function getMemories(userId: string): Promise<Memory[]> {
  if (!adminDb) {
    throw new Error("Firestore is not initialized.");
  }
  const memoriesSnapshot = await adminDb.collection('memories').where('userId', '==', userId).get();
  const memories = memoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Memory[];
  return memories;
}

export async function getMemory(memoryId: string): Promise<Memory | null> {
  if (!adminDb) {
    throw new Error("Firestore is not initialized.");
  }
  const memoryDoc = await adminDb.collection('memories').doc(memoryId).get();
  if (!memoryDoc.exists) {
    return null;
  }
  return { id: memoryDoc.id, ...memoryDoc.data() } as Memory;
}

export async function saveMemory(
  memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>,
  memoryId: string | null
): Promise<{ success: boolean; message: string; data?: { id: string } }> {

  try {
    const session = await getSession();
    if (!session || session.uid !== memoryData.userId) {
      return { success: false, message: "Unauthorized or mismatched user."};
    }

    if (!adminDb) {
      throw new Error("Firestore is not initialized.");
    }

    if (memoryId) {
      // Update existing memory
      const memoryRef = adminDb.collection('memories').doc(memoryId);
      await memoryRef.update({
        ...memoryData,
        updatedAt: new Date(),
      });
      return { success: true, message: 'Memory updated successfully.', data: { id: memoryId } };
    } else {
      // Create new memory
      const newMemoryRef = adminDb.collection('memories').doc();
      await newMemoryRef.set({
        ...memoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { success: true, message: 'Memory saved successfully.', data: { id: newMemoryRef.id } };
    }
  } catch (error: any) {
    console.error("Error saving memory:", error);
    return { success: false, message: error.message };
  }
}
