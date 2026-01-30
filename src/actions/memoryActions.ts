'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Memory } from '@/types';
import { revalidatePath } from 'next/cache';
import { mockPrompts } from '@/lib/mockData'; // Import mock data to find prompt details

export async function getOrCreateMemoryForPrompt(promptId: string, idToken: string): Promise<{ success: boolean; message: string; memoryId?: string; }> {
  let uid: string;
  try {
    if (!adminAuth) {
      throw new Error("Firebase Admin SDK is not initialized.");
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    uid = decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return { success: false, message: "Unauthorized. Invalid token." };
  }

  if (!adminDb) {
    return { success: false, message: "Database connection failed." };
  }

  const memoriesRef = adminDb.collection('users').doc(uid).collection('memories');
  
  // 1. Check if a memory for this prompt already exists
  const existingMemoryQuery = await memoriesRef.where('promptId', '==', promptId).limit(1).get();

  if (!existingMemoryQuery.empty) {
    const existingMemoryId = existingMemoryQuery.docs[0].id;
    console.log(`Found existing memory ${existingMemoryId} for prompt ${promptId}`);
    return { success: true, message: "Existing memory found.", memoryId: existingMemoryId };
  }

  // 2. If not, create a new one
  console.log(`No existing memory for prompt ${promptId}. Creating a new one.`);
  const prompt = mockPrompts.find(p => p.id === promptId);
  if (!prompt) {
    return { success: false, message: "Prompt not found." };
  }

  try {
    const newMemoryRef = memoriesRef.doc();
    const newMemory: Omit<Memory, 'id'> = {
      userId: uid,
      promptId: promptId,
      title: prompt.title,
      description: 'Recording session initiated from QR code.', // Placeholder description
      videoUrl: '',
      category: 'personal',
      location: '',
      emotionTags: [],
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft' // Add a status to indicate it's not a complete memory yet
    };

    await newMemoryRef.set(newMemory);
    
    revalidatePath('/prompts'); // Revalidate to show the new session state

    console.log(`Created new memory ${newMemoryRef.id} for prompt ${promptId}`);
    return { success: true, message: "New memory session created.", memoryId: newMemoryRef.id };

  } catch (error) {
    console.error("Error creating memory for prompt:", error);
    return { success: false, message: "Failed to create a new memory session." };
  }
}


export async function createMemoryAction(data: Partial<Memory>): Promise<{ success: boolean; message: string; memoryId?: string; }> {
  // This action still relies on the session cookie. This is acceptable for now
  // as it is not part of the QR code flow.
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
    // This action still relies on the session cookie.
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

// We need to re-import getSession here because it was removed from the top of the file
import { getSession } from '@/lib/session';
