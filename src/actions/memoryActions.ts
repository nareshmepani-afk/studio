'use server';

import { revalidatePath } from 'next/cache';
import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';
import type { Memory, MediaAttachment } from '@/types';

// Initialize Firebase Admin SDK if not already initialized.
// This ensures a single, stable connection to our backend services.
if (!admin.apps.length) {
  try {
    let serviceAccount;
    // In a production environment (like Vercel), credentials are often stored in an environment variable.
    if (process.env.SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    } else {
      // For local development, we look for a physical service account file.
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(serviceAccountString);
      } else {
        throw new Error('Could not find service account credentials in environment variables or local file.');
      }
    }
    
    const bucketName = 'memory-weaver-8rk9t.appspot.com';

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ACTION/Init] CRITICAL: Firebase Admin initialization failed:', errorMessage);
  }
}

const adminDb = admin.firestore();
const adminStorage = getStorage();
const adminAuth = admin.auth();

// Authenticates a user based on the session cookie provided.
// This is a gatekeeper for all actions that require a logged-in user.
async function getAuthenticatedUser(sessionCookie: string | undefined) {
    if (!sessionCookie) {
        throw new Error("User not authenticated; no session cookie provided.");
    }
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch (error) {
        console.error("[ACTION] Auth Error: Invalid session cookie.", error);
        throw new Error("Invalid session");
    }
}

// Fetches a single memory document from anywhere in the database using its unique ID.
export async function getMemoryById(memoryId: string): Promise<{ success: boolean; data?: Memory; message?: string }> {
    try {
        // This query now authentically uses the memoryId variable to find the specific document.
        const memorySnapshot = await adminDb.collectionGroup('memories').where('id', '==', memoryId).limit(1).get();

        if (memorySnapshot.empty) {
            console.warn('[ACTION] getMemoryById: A memory with ID "' + memoryId + '" was not found.');
            return { success: false, message: 'Memory not found.' };
        }

        const memory = memorySnapshot.docs[0].data() as Memory;
        return { success: true, data: memory };
    } catch (error: any) {
        console.error("[ACTION] GetMemoryById Error:", error);
        // We explicitly mention the likely cause to guide future debugging.
        return { success: false, message: 'Failed to retrieve memory. Check server logs for details (a missing Firestore index is a common cause).' };
    }
}

// Handles the creation or updating of a memory.
export async function saveMemory(
    formData: FormData,
    memoryId: string | null // If null, we create; otherwise, we update.
  ): Promise<{ success: boolean; message: string }> {
    let userId: string;
  
    // 1. Authenticate the user. No action can proceed without a known author.
    try {
        const sessionCookie = formData.get('sessionCookie') as string | undefined;
        const decodedToken = await getAuthenticatedUser(sessionCookie);
        userId = decodedToken.uid;
    } catch (error: any) {
        return { success: false, message: 'Authentication failed: ' + error.message };
    }
  
    try {
      const isEditing = !!memoryId;
      
      // 2. Construct the core memory data from the form.
      // This object reveals the essential Being of a memory.
      const memoryData: Partial<Memory> = {
        title: formData.get('title') as string,
        date: formData.get('date') as string,
        category: formData.get('category') as string,
        location: formData.get('location') as string,
        description: formData.get('description') as string,
        emotionTags: formData.getAll('emotions') as string[],
        userId: userId, // Ensure ownership is clear.
        updatedAt: new Date().toISOString(),
      };
  
      const mediaFile = formData.get('mediaFile') as File | null;
      let existingAttachments: MediaAttachment[] = [];
      if (formData.has('existingMediaAttachments')) {
          existingAttachments = JSON.parse(formData.get('existingMediaAttachments') as string);
      }
      
      let newOrUpdatedAttachments = existingAttachments;
  
      // 3. Handle media file upload if a new one is provided.
      if (mediaFile && mediaFile.size > 0) {
        const bucket = adminStorage.bucket();
        const fileId = crypto.randomUUID();
        const fileExtension = mediaFile.name.split('.').pop();
        const filePath = `users/${userId}/media/${fileId}.${fileExtension}`;
        const fileRef = bucket.file(filePath);
        
        const fileBuffer = await mediaFile.arrayBuffer();
        await fileRef.save(Buffer.from(fileBuffer), { metadata: { contentType: mediaFile.type } });
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        
        newOrUpdatedAttachments = [{
          id: fileId,
          url: publicUrl,
          type: mediaFile.type.startsWith('video') ? 'video' : 'audio',
          filename: mediaFile.name,
        }];
      }
  
      memoryData.mediaAttachments = newOrUpdatedAttachments;
  
      // 4. Save the document to Firestore.
      if (isEditing) {
        const memRef = adminDb.collection('users').doc(userId).collection('memories').doc(memoryId);
        await memRef.update(memoryData);
      } else {
        const newId = crypto.randomUUID();
        memoryData.id = newId;
        memoryData.createdAt = new Date().toISOString();
        const newMemRef = adminDb.collection('users').doc(userId).collection('memories').doc(newId);
        await newMemRef.set(memoryData);
        memoryId = newId;
      }
      
      // 5. Revalidate cached paths to ensure the UI reflects the change immediately.
      revalidatePath('/prompts');
      revalidatePath('/timeline');
      
      return { success: true, message: memoryId ? "Memory updated" : "Memory saved" };

    } catch (error: any) {
      console.error("[ACTION] Save Error CRASH:", { message: error.message, stack: error.stack });
      return { 
        success: false, 
        message: "Server Action Failed: " + error.message 
      };
    }
  }
