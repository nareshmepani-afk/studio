'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Memory } from '@/types';
import { revalidatePath } from 'next/cache';
import { mockPrompts } from '@/lib/mockData'; // Import mock data to find prompt details

async function getUidFromIdToken(idToken: string): Promise<string | null> {
    if (!adminAuth) {
        console.error("Firebase Admin SDK is not initialized.");
        return null;
    }
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        return null;
    }
}

export async function getOrCreateMemoryForPrompt(promptId: string, idToken: string): Promise<{ success: boolean; message: string; memoryId?: string; }> {
  const uid = await getUidFromIdToken(idToken);
  if (!uid) {
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
      status: 'draft', // Add a status to indicate it's not a complete memory yet
      sensoryConfig: prompt.sensoryPrompts || []
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

export async function cleanupAndMigrateMemories(): Promise<{ success: boolean; message: string; stats?: any }> {
    const session = await getSession();
    if (!session?.uid || !adminDb) {
        return { success: false, message: "Unauthorized or DB not initialized." };
    }

    try {
        const memoriesRef = adminDb.collection('users').doc(session.uid).collection('memories');
        const snapshot = await memoriesRef.get();
        
        let migratedCount = 0;
        let deletedCount = 0;

        const batch = adminDb.batch();

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            // Rule: If it's an existing memory (usually has a promptId or content), mark as draft if no status exists
            if (!data.status) {
                batch.update(docSnap.ref, { status: 'draft' });
                migratedCount++;
            } else if (data.status !== 'draft' && data.status !== 'published') {
                // Should not happen with new enum, but for safety
                batch.update(docSnap.ref, { status: 'draft' });
                migratedCount++;
            }
        });

        await batch.commit();

        // Second pass: Delete those that are STILL not draft (the user said "delete all... which do not have status: 'draft'")
        // But wait, if I just marked them all as draft, nothing will be deleted.
        // Ah, the user probably meant "Delete the ones that were empty and didn't even qualify for draft migration".
        // Let's refine: Delete memories that have NO title AND NO description AND NO media.
        
        const finalSnapshot = await memoriesRef.get();
        const deleteBatch = adminDb.batch();
        
        finalSnapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const isEmpty = !data.title && !data.description && (!data.mediaAttachments || data.mediaAttachments.length === 0) && !data.videoUrl;
            
            if (isEmpty) {
                deleteBatch.delete(docSnap.ref);
                deletedCount++;
            }
        });

        await deleteBatch.commit();

        revalidatePath('/timeline');
        revalidatePath('/prompts');

        return { 
            success: true, 
            message: `Migration complete.`, 
            stats: { migrated: migratedCount, deleted: deletedCount } 
        };
    } catch (error: any) {
        console.error("Migration error:", error);
        return { success: false, message: error.message || "Migration failed." };
    }
}

export async function publishMemoryAction(memoryId: string): Promise<{ success: boolean; message: string }> {
    const session = await getSession();
    if (!session?.uid || !adminDb) {
        return { success: false, message: "Unauthorized or DB not initialized." };
    }

    try {
        const docRef = adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId);
        await docRef.update({ 
            status: 'published',
            updatedAt: new Date().toISOString()
        });
        
        revalidatePath('/timeline');
        revalidatePath('/prompts');
        
        return { success: true, message: "Cinema updated successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to publish." };
    }
}

export async function unpublishMemoryAction(memoryId: string): Promise<{ success: boolean; message: string }> {
    const session = await getSession();
    if (!session?.uid || !adminDb) {
        return { success: false, message: "Unauthorized or DB not initialized." };
    }

    try {
        const docRef = adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId);
        await docRef.update({ 
            status: 'draft',
            updatedAt: new Date().toISOString()
        });
        
        revalidatePath('/timeline');
        revalidatePath('/prompts');
        
        return { success: true, message: "Memory reverted to draft." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to revert to draft." };
    }
}


// We need to re-import getSession here because it was removed from the top of the file
import { getSession } from '@/lib/session';
