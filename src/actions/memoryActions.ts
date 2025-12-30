'use server';

import { cookies } from 'next/headers';
import { adminDb, adminStorage, adminAuth } from '@/lib/firebase-admin';
import type { Memory, MediaAttachment } from '@/types.ts';
import { revalidatePath } from 'next/cache';
import { Buffer } from 'buffer';

// Helper function to get the authenticated user's ID from the cookie.
async function getUserIdFromCookie(): Promise<string | null> {
    const sessionCookie = (await cookies()).get('firebase-auth-token')?.value;

    if (!sessionCookie) {
        console.error('[AUTH_HELPER_ACTION] Session cookie not found.');
        return null;
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
        return decodedToken.uid;
    } catch (error: any) {
        console.error('[AUTH_HELPER_ACTION] CRITICAL: Failed to verify session cookie. Error:', error.message);
        return null;
    }
}

async function uploadToStorage(file: File, userId: string): Promise<{ publicUrl: string; filePath: string }> {
  console.log(`[ACTION] uploadToStorage: Starting upload for user ${userId}, file: ${file.name}, size: ${file.size}, type: ${file.type}`);
  const fileId = crypto.randomUUID();
  const fileExtension = file.name.split('.').pop();
  const filePath = `users/${userId}/media/${fileId}.${fileExtension}`;
  const bucket = adminStorage.bucket();
  console.log(`[ACTION] uploadToStorage: Using bucket: ${bucket.name}`);
  const fileRef = bucket.file(filePath);
  const fileBuffer = await file.arrayBuffer();
  await fileRef.save(Buffer.from(fileBuffer), { metadata: { contentType: file.type } });
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  console.log(`[ACTION] uploadToStorage: File uploaded successfully. Public URL: ${publicUrl}`);
  return { publicUrl, filePath };
}

export async function getMemoryById(id: string) {
  console.log(`[ACTION] getMemoryById: Initiated for memory ID: ${id}`);
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return { success: false, message: "Unauthorized: Missing session cookie." };
    }

    console.log(`[ACTION] getMemoryById: Authorized for user ${userId}`);

    const docRef = adminDb.collection('users').doc(userId).collection('memories').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.warn(`[ACTION] getMemoryById: Memory not found for id ${id} in user's subcollection.`);
      return { success: false, message: "Memory not found" };
    }

    const data = doc.data();

    if (!data) {
        console.error(`[ACTION] getMemoryById: Document ${id} exists but has no data.`);
        return { success: false, message: "Corrupt memory: document contains no data." };
    }

    if (data.userId !== userId) {
      console.error(`[ACTION] getMemoryById: SECURITY VIOLATION - User ${userId} attempted to access memory owned by ${data.userId}.`);
      return { success: false, message: "Forbidden: You do not own this memory." };
    }
    console.log(`[ACTION] getMemoryById: Ownership verified for user ${userId}`);

    console.log(`[ACTION] getMemoryById: Successfully fetched and returning memory titled \"${data.title}\".`);
    return { 
      success: true, 
      data: { 
        id: doc.id, 
        ...data,
        // CORRECTED: Convert all Firestore Timestamps to serializable ISO strings.
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Memory
    };

  } catch (error: any) {
    console.error(`[ACTION] getMemoryById CRASH for ID ${id}:`, error.message, error.stack);
    return { success: false, message: error.message || "A server error occurred while fetching the memory." };
  }
}


export async function saveMemory(formData: FormData, memoryId: string | null) {
  console.log(`[ACTION] saveMemory: Initiated for memoryId: ${memoryId}`);
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
        console.error("[ACTION] saveMemory: Unauthorized - no user ID from cookie.");
        return { success: false, message: "Unauthorized: You must be logged in to save a memory." };
    }
    console.log(`[ACTION] saveMemory: Authorized for user: ${userId}`);

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const category = formData.get('category') as string;
    const promptId = formData.get('promptId') as string | undefined;
    const location = formData.get('location') as string;
    const emotionTagsStr = formData.get('emotionTags') as string;
    const emotionTags = emotionTagsStr ? JSON.parse(emotionTagsStr) : [];

    console.log(`[ACTION] saveMemory: Parsed form data for title: ${title}`);

    let mediaAttachments: MediaAttachment[] = [];
    const mediaFile = formData.get('mediaFile') as File | null;

    if (mediaFile && mediaFile.size > 0) {
        console.log(`[ACTION] saveMemory: Found media file: ${mediaFile.name}, size: ${mediaFile.size}, type: ${mediaFile.type}`);
        const mediaMetadataStr = formData.get('mediaMetadata') as string;
        const { publicUrl } = await uploadToStorage(mediaFile, userId);
        const meta = JSON.parse(mediaMetadataStr);
        mediaAttachments.push({
            id: crypto.randomUUID(),
            url: publicUrl, 
            type: mediaFile.type.startsWith('video') ? 'video' : 'audio',
            startTime: meta.startTime,
            endTime: meta.endTime,
            isTrimmed: meta.isTrimmed,
            duration: meta.duration || 0,
            filename: mediaFile.name
        });
        console.log('[ACTION] saveMemory: New media attachment created.');
    } else {
        const existingMediaStr = formData.get('mediaAttachments') as string;
        if (existingMediaStr) {
            mediaAttachments = JSON.parse(existingMediaStr);
            console.log('[ACTION] saveMemory: Using existing media attachments.');
        }
    }

    if (mediaAttachments.length === 0) {
        console.error("[ACTION] Save Error: Attempted to save memory without media.");
        return { success: false, message: "A memory must have an associated media file." };
    }

    const memoryData: Partial<Memory> = {
      title,
      description,
      date,
      category,
      userId,
      mediaAttachments,
      emotionTags,
      location,
      updatedAt: new Date().toISOString(),
      ...(promptId && { promptId }),
    };
    
    console.log('[ACTION] saveMemory: Final memoryData object:', JSON.stringify(memoryData, null, 2));
    
    const collectionRef = adminDb.collection('users').doc(userId).collection('memories');

    if (memoryId) {
      console.log(`[ACTION] saveMemory: Updating existing memory with ID: ${memoryId}`);
      const docToUpdate = await collectionRef.doc(memoryId).get();
      if(docToUpdate.data()?.userId !== userId) {
        console.error(`[ACTION] saveMemory: Security violation - User ${userId} attempting to edit memory owned by another user.`);
        return { success: false, message: "Forbidden: You cannot edit this memory." };
      }
      await collectionRef.doc(memoryId).update(memoryData);
    } else {
      console.log('[ACTION] saveMemory: Creating new memory.');
      memoryData.createdAt = new Date().toISOString();
      await collectionRef.add(memoryData);
    }

    revalidatePath('/prompts');
    revalidatePath('/timeline');
    
    console.log(`[ACTION] saveMemory: Successfully saved memory. Memory ID: ${memoryId}`);
    return { success: true, message: memoryId ? "Memory updated" : "Memory saved" };
  } catch (error: any) {
    console.error("[ACTION] Save Error CRASH:", { message: error.message, stack: error.stack, details: error.details });
    return { 
      success: false, 
      message: `Server Action Failed: ${error.message}. Review the server console for the full error stack.`
    };
  }
}
