'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from "@/lib/session";
import { Memory } from '@/types';
import { revalidatePath } from 'next/cache';


export async function createMemoryAction(data: Partial<Memory>): Promise<{ success: boolean; message: string; memoryId?: string; }> {
  const session = await getSession();

  if (!session || !session.uid) {
    return { success: false, message: "Unauthorized. Please log in." };
  }

  if (!adminDb) {
    return { success: false, message: "Database connection failed." };
  }

  const { title, description, videoUrl, category, location, emotionTags, date } = data;

  if (!title?.trim() || !description?.trim()) {
    return { success: false, message: "Title and story cannot be empty." };
  }

  try {
    const newMemoryRef = adminDb.collection('users').doc(session.uid).collection('memories').doc();
    const newMemory: Omit<Memory, 'id'> = {
      userId: session.uid,
      title,
      description,
      videoUrl: videoUrl || '',
      category: category || 'personal',
      location: location || '',
      emotionTags: emotionTags || [],
      date: date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  const memoriesSnapshot = await adminDb.collection('users').doc(userId).collection('memories').get();
  const memories = memoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Memory[];
  return memories;
}

export async function getMemory(memoryId: string): Promise<Memory | null> {
    const session = await getSession();
    if (!session?.uid || !adminDb) {
        throw new Error("Unauthorized or DB not initialized.");
    }
    const memoryDoc = await adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId).get();
    if (!memoryDoc.exists) {
        return null;
    }
    return { id: memoryDoc.id, ...memoryDoc.data() } as Memory;
}
