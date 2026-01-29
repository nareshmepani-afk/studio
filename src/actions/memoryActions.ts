'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { Memory } from '@/types';
import { revalidatePath } from 'next/cache';
import { mockPrompts } from '@/lib/mockData'; // Import mock data to find prompt details

async function getVerifiedUser(idToken: string): Promise<DecodedIdToken | null> {
    try {
        if (!adminAuth) {
          throw new Error("Firebase Admin SDK is not initialized.");
        }
        const decodedToken = await adminAuth.verifyIdToken(idToken, true);
        return decodedToken;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        return null;
    }
}

export async function getOrCreateMemoryForPrompt(promptId: string, idToken?: string): Promise<{ success: boolean; message: string; memoryId?: string; }> {
  if (!idToken) {
    return { success: false, message: "Authorization token is missing." };
  }

  const decodedToken = await getVerifiedUser(idToken);

  if (!decodedToken?.uid) {
    return { success: false, message: "Unauthorized" };
  }

  if (!adminDb) {
    return { success: false, message: "Database connection failed." };
  }

  const memoriesRef = adminDb.collection('users').doc(decodedToken.uid).collection('memories');
  
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
      userId: decodedToken.uid,
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
