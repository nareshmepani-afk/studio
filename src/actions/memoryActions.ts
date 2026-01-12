'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from "@/lib/session";
import { Memory } from '@/types';
import { revalidatePath } from 'next/cache';


export async function createMemoryAction(data: { title: string, story: string }): Promise<{ success: boolean; message: string; memoryId?: string; }> {
  const session = await getSession();

  if (!session || !session.uid) {
    return { success: false, message: "Unauthorized. Please log in." };
  }

  if (!adminDb) {
    return { success: false, message: "Database connection failed." };
  }

  const { title, story } = data;

  if (!title.trim() || !story.trim()) {
    return { success: false, message: "Title and story cannot be empty." };
  }

  try {
    const newMemoryRef = adminDb.collection('memories').doc();
    const newMemory: Omit<Memory, 'id'> = {
      userId: session.uid,
      title,
      story,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await newMemoryRef.set(newMemory);
    
    // Revalidate paths to ensure fresh data is shown after creation
    revalidatePath('/timeline');
    revalidatePath('/prompts');

    return { success: true, message: "Memory created successfully!", memoryId: newMemoryRef.id };

  } catch (error) {
    console.error("Error creating memory:", error);
    // It's better to return a generic error message to the client
    return { success: false, message: "An unexpected error occurred while saving your memory." };
  }
}

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
