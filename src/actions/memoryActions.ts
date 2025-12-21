'use server';

import { cookies } from 'next/headers';
import { db, storage } from '@/lib/firebase-admin';
import type { Memory, MediaAttachment } from '@/types';
import { revalidatePath } from 'next/cache';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { Buffer } from 'buffer';

// Helper to upload a file to Firebase Storage
async function uploadToStorage(file: File, userId: string): Promise<{ publicUrl: string; filePath: string }> {
  const fileId = crypto.randomUUID();
  const fileExtension = file.name.split('.').pop();
  const filePath = `users/${userId}/media/${fileId}.${fileExtension}`;

  const bucket = storage.bucket(); 
  const fileRef = bucket.file(filePath);

  const fileBuffer = await file.arrayBuffer();
  
  await fileRef.save(Buffer.from(fileBuffer), {
    metadata: {
      contentType: file.type,
    },
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  return { publicUrl, filePath };
}

// CORRECTED based on your accurate feedback
export async function getMemoryById(id: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return { success: false, message: "Unauthorized" };
    }

    const docRef = db.collection('memories').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, message: "Memory not found" };
    }

    const data = doc.data();
    
    // CRITICAL FIX: Serialize the date object to an ISO string
    const date = data?.date?.toDate ? data.date.toDate().toISOString() : data?.date;

    return { 
      success: true, 
      data: { 
        id: doc.id, 
        ...data,
        date,
      } as Memory
    };
  } catch (error: any) {
    console.error("[ACTION] getMemoryById error:", error.message);
    return { success: false, message: error.message || "Server error fetching memory" };
  }
}

// CORRECTED to be consistent with the data model
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

    const memoryData: Omit<Memory, 'id'> = {
      title,
      description,
      date,
      category,
      userId, // Ensure userId is saved with the memory
      mediaAttachments,
      emotionTags: [], // Placeholder
      updatedAt: new Date().toISOString(),
      ...(promptId && { promptId }),
    };

    // CRITICAL FIX: Write to the top-level 'memories' collection
    const collectionRef = db.collection('memories');

    if (memoryId) {
      await collectionRef.doc(memoryId).update(memoryData);
    } else {
      await collectionRef.add({ ...memoryData, createdAt: new Date().toISOString() });
    }

    revalidatePath('/prompts');
    revalidatePath('/timeline');
    revalidatePath('/memories');
    
    return { success: true, message: memoryId ? "Memory updated" : "Memory saved" };
  } catch (error: any) {
    console.error("[ACTION] Save Error:", error.message);
    return { success: false, message: error.message || "Failed to save memory" };
  }
}
