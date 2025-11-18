
'use server';

import { getStorage } from 'firebase-admin/storage';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

interface UploadMemoryMediaInput {
  fileDataUrl: string;
  filePath: string;
  userId: string;
}

interface UploadMemoryMediaOutput {
  success: boolean;
  downloadURL?: string;
  error?: string;
}

export async function uploadMemoryMediaAction(input: UploadMemoryMediaInput): Promise<UploadMemoryMediaOutput> {
  const { fileDataUrl, filePath, userId } = input;

  try {
    console.log('[Server Action] Initializing Firebase Admin...');
    const adminApp = getFirebaseAdminApp();
    const bucket = getStorage(adminApp).bucket();
    console.log(`[Server Action] Uploading file to path: ${filePath}`);

    // Decode the Base64 string
    const matches = fileDataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid Data URL format.');
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a file in the bucket
    const file = bucket.file(filePath);

    // Upload the file
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        customMetadata: {
          userId: userId, // Embed userId in metadata for rules/auditing
        },
      },
    });

    console.log('[Server Action] File uploaded successfully. Getting public URL...');
    
    // Make the file public (or use getSignedUrl for private files)
    // For simplicity in this context, we make it public.
    await file.makePublic();
    
    const downloadURL = file.publicUrl();
    
    console.log(`[Server Action] Public URL generated: ${downloadURL}`);

    return {
      success: true,
      downloadURL: downloadURL,
    };
  } catch (error: any) {
    console.error('[Server Action] Error during server-side upload:', error);
    return {
      success: false,
      error: error.message || 'An unknown error occurred during upload.',
    };
  }
}
