'use server';

import { revalidatePath } from 'next/cache';
import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';
import type { Memory, MediaAttachment } from '@/types';

if (!admin.apps.length) {
  console.log('[ACTION/saveMemory] Initializing Firebase Admin...');
  try {
    let serviceAccount;
    if (process.env.SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    } else {
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(serviceAccountString);
      } else {
        throw new Error('Could not find service account credentials.');
      }
    }
    
    const bucketName = 'memory-weaver-8rk9t.appspot.com';

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName
    });
    
    console.log('[ACTION/saveMemory] Initialized successfully. DEFINITIVE BUCKET: ' + bucketName);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ACTION/saveMemory] CRITICAL: Initialization failed:', errorMessage);
  }
}

const adminDb = admin.firestore();
const adminStorage = getStorage();
const adminAuth = admin.auth();

async function getAuthenticatedUser(sessionCookie: string | undefined) {
    if (!sessionCookie) {
        console.error("[ACTION] Auth Error: No session cookie provided.");
        throw new Error("User not authenticated");
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
        // --- START DEFINITIVE FIX ---
        // The previous code had a critical bug where it was querying for the literal string 'memoryId'
        // instead of the actual memoryId variable. This is the root cause of the "Failed to retrieve memory" error.
        const memorySnapshot = await adminDb.collectionGroup('memories').where('id', '==', memoryId).limit(1).get();
        // --- END DEFINITIVE FIX ---

        if (memorySnapshot.empty) {
            console.warn('[ACTION] getMemoryById: Memory with ID "' + memoryId + '" not found.');
            return { success: false, message: 'Memory not found.' };
        }

        const memory = memorySnapshot.docs[0].data() as Memory;
        console.log('[ACTION] getMemoryById: Successfully retrieved memory "' + memory.title + '"');
        return { success: true, data: memory };
    } catch (error: any) {
        console.error("[ACTION] GetMemoryById Error:", error);
        return { success: false, message: 'Failed to retrieve memory. Check server logs for details (likely a missing index).' };
    }
}

export async function saveMemory(
    formData: FormData,
    memoryId: string | null
  ): Promise<{ success: boolean; message: string }> {
    let userId: string;
  
    try {
        const sessionCookie = formData.get('sessionCookie') as string | undefined;
        if (!sessionCookie) throw new Error("Session cookie is missing.");
        const decodedToken = await getAuthenticatedUser(sessionCookie);
        userId = decodedToken.uid;
        console.log('[ACTION] saveMemory: Authenticated user ' + userId + '.');
    } catch (error: any) {
        console.error("[ACTION] saveMemory Auth Error:", error.message);
        return { success: false, message: 'Authentication failed: ' + error.message };
    }
  
    try {
      console.log('[ACTION] saveMemory: Starting save process for user ' + userId + '. Editing memory: ' + (memoryId || 'new'));
  
      const memoryData: Partial<Memory> = {
        title: formData.get('title') as string,
        date: formData.get('date') as string,
        category: formData.get('category') as string,
        location: formData.get('location') as string,
        description: formData.get('description') as string,
        emotionTags: formData.getAll('emotions') as string[],
        userId: userId,
        updatedAt: new Date().toISOString(),
      };
  
      const mediaFile = formData.get('mediaFile') as File | null;
      let existingAttachments: MediaAttachment[] = [];
      if (formData.has('existingMediaAttachments')) {
          existingAttachments = JSON.parse(formData.get('existingMediaAttachments') as string);
      }
      
      let newOrUpdatedAttachments = existingAttachments;
  
      if (mediaFile && mediaFile.size > 0) {
        console.log('[ACTION] saveMemory: New media file found: ' + mediaFile.name + ' (' + mediaFile.size + ' bytes). Uploading...');
        const bucket = adminStorage.bucket();
        console.log('[ACTION] saveMemory: Using storage bucket: ' + bucket.name);
        
        const fileId = crypto.randomUUID();
        const fileExtension = mediaFile.name.split('.').pop();
        const filePath = 'users/' + userId + '/media/' + fileId + '.' + fileExtension;
        const fileRef = bucket.file(filePath);
        
        const fileBuffer = await mediaFile.arrayBuffer();
        
        await fileRef.save(Buffer.from(fileBuffer), {
          metadata: { contentType: mediaFile.type },
        });
        
        const publicUrl = 'https://storage.googleapis.com/' + bucket.name + '/' + filePath;
        console.log('[ACTION] saveMemory: File uploaded to ' + publicUrl);
        
        newOrUpdatedAttachments = [{
          id: fileId,
          url: publicUrl,
          type: mediaFile.type.startsWith('video') ? 'video' : 'audio',
          filename: mediaFile.name,
        }];
      }
  
      memoryData.mediaAttachments = newOrUpdatedAttachments;
  
      if (memoryId) {
        const memRef = adminDb.collection('users').doc(userId).collection('memories').doc(memoryId);
        await memRef.update(memoryData);
        console.log('[ACTION] saveMemory: Successfully updated memory ' + memoryId);
      } else {
        const newId = crypto.randomUUID();
        memoryData.id = newId;
        memoryData.createdAt = new Date().toISOString();
        const newMemRef = adminDb.collection('users').doc(userId).collection('memories').doc(newId);
        await newMemRef.set(memoryData);
        memoryId = newId;
        console.log('[ACTION] saveMemory: Successfully created new memory ' + memoryId);
      }
      
      revalidatePath('/prompts');
      revalidatePath('/timeline');
      
      console.log('[ACTION] saveMemory: Successfully saved memory. Memory ID: ' + memoryId);
      return { success: true, message: memoryId ? "Memory updated" : "Memory saved" };

    } catch (error: any) {
      console.error("[ACTION] Save Error CRASH:", { message: error.message, stack: error.stack });
      const simplifiedMessage = 'Server Action Failed: ' + error.message;

      return { 
        success: false, 
        message: simplifiedMessage
      };
    }
  }
