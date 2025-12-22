'use server';

import { cookies } from 'next/headers';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import type { Memory, MediaAttachment } from '@/types';
import { revalidatePath } from 'next/cache';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { Buffer } from 'buffer';

async function uploadToStorage(file: File, userId: string): Promise<{ publicUrl: string; filePath: string }> {
  const fileId = crypto.randomUUID();
  const fileExtension = file.name.split('.').pop();
  const filePath = `users/${userId}/media/${fileId}.${fileExtension}`;
  const bucket = adminStorage.bucket();
  const fileRef = bucket.file(filePath);
  const fileBuffer = await file.arrayBuffer();
  await fileRef.save(Buffer.from(fileBuffer), { metadata: { contentType: file.type } });
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  return { publicUrl, filePath };
}

export async function getMemoryById(id: string) {
  console.log(`[ACTION] getMemoryById: Initiated for memory ID: ${id}`);
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) {
      console.error('[ACTION] getMemoryById: Auth cookie not found.');
      return { success: false, message: "Unauthorized: Missing session cookie." };
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (e) {
      console.error('[ACTION] getMemoryById: Failed to parse session cookie.');
      return { success: false, message: "Unauthorized: Invalid session format." };
    }

    const userId = session?.uid;
    if (!userId) {
      console.error('[ACTION] getMemoryById: Session is invalid or does not contain UID.');
      return { success: false, message: "Unauthorized: Invalid session data." };
    }
    console.log(`[ACTION] getMemoryById: Authorized for user ${userId}`);

    const docRef = adminDb.collection('memories').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.warn(`[ACTION] getMemoryById: Memory not found for id ${id}`);
      return { success: false, message: "Memory not found" };
    }

    const data = doc.data();

    // --- CORRECTED: Added guard clause for undefined data ---
    if (!data) {
        console.error(`[ACTION] getMemoryById: Document ${id} exists but has no data.`);
        return { success: false, message: "Corrupt memory: document contains no data." };
    }

    if (data.userId !== userId) { // Optional chaining no longer needed here
      console.error(`[ACTION] getMemoryById: SECURITY VIOLATION - User ${userId} attempted to access memory owned by ${data.userId}.`);
      return { success: false, message: "Forbidden: You do not own this memory." };
    }
    console.log(`[ACTION] getMemoryById: Ownership verified for user ${userId}`);

    const date = data.date?.toDate ? data.date.toDate().toISOString() : data.date;

    console.log(`[ACTION] getMemoryById: Successfully fetched and returning memory titled \"${data.title}\".`);
    return { 
      success: true, 
      data: { 
        id: doc.id, 
        ...data,
        date,
      } as Memory
    };

  } catch (error: any) {
    console.error(`[ACTION] getMemoryById CRASH for ID ${id}:`, error.message, error.stack);
    return { success: false, message: error.message || "A server error occurred while fetching the memory." };
  }
}


export async function saveMemory(formData: FormData, memoryId: string | null) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return { success: false, message: "Unauthorized" };

    const session = JSON.parse(sessionCookie.value);
    const userId = session.uid;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const category = formData.get('category') as string;
    const promptId = formData.get('promptId') as string | undefined;
    const location = formData.get('location') as string;
    const emotionTagsStr = formData.get('emotionTags') as string;
    const emotionTags = emotionTagsStr ? JSON.parse(emotionTagsStr) : [];

    let mediaAttachments: MediaAttachment[] = [];
    const mediaFile = formData.get('mediaFile') as File | null;

    if (mediaFile && mediaFile.size > 0) {
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
    } else {
        const existingMediaStr = formData.get('mediaAttachments') as string;
        if (existingMediaStr) {
            mediaAttachments = JSON.parse(existingMediaStr);
        }
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
    
    const collectionRef = adminDb.collection('memories');

    if (memoryId) {
      const docToUpdate = await collectionRef.doc(memoryId).get();
      if(docToUpdate.data()?.userId !== userId) {
        return { success: false, message: "Forbidden: You cannot edit this memory." };
      }
      await collectionRef.doc(memoryId).update(memoryData);
    } else {
      memoryData.createdAt = new Date().toISOString();
      await collectionRef.add(memoryData);
    }

    revalidatePath('/prompts');
    revalidatePath('/timeline');
    
    return { success: true, message: memoryId ? "Memory updated" : "Memory saved" };
  } catch (error: any) {
    console.error("[ACTION] Save Error:", error.message);
    return { success: false, message: error.message || "Failed to save memory" };
  }
}
