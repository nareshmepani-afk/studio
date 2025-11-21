
import { type NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';

// Helper to initialize Firebase Admin SDK safely
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return {
      db: getFirestore(),
      storage: getStorage(),
    };
  }

  // When deployed to App Hosting, the Admin SDK automatically detects the environment
  // and uses the Application Default Credentials. No service account key is needed.
  initializeApp({
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return {
    db: getFirestore(),
    storage: getStorage(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { db, storage } = initializeFirebaseAdmin();
    const formData = await req.formData();

    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    
    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or user ID.' }, { status: 400 });
    }

    const bucket = storage.bucket();
    // Use a unique name to prevent overwrites
    const finalFileName = `${Date.now()}_${file.name || 'memory.webm'}`;
    const permanentPath = `users/${userId}/memories/${finalFileName}`;
    
    // Convert file to buffer to upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload using the buffer
    const uploadedFile = bucket.file(permanentPath);
    await uploadedFile.save(fileBuffer, {
      metadata: {
        contentType: file.type || "video/webm",
      },
    });

    // Make the file publicly readable
    await uploadedFile.makePublic();

    // Construct the public URL directly
    // Format: https://storage.googleapis.com/<bucket-name>/<file-path>
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${permanentPath}`;

    // Create Firestore document
    const title = (formData.get('title') as string) || 'Untitled Memory';
    const date = (formData.get('date') as string) || new Date().toISOString();
    const description = (formData.get('description') as string) || '';
    const category = (formData.get('category') as string) || '';
    const promptId = (formData.get('promptId') as string) || '';
    
    const duration = 0; // Duration is hard to get reliably without server-side processing libraries

    const memoryDocData = {
      title,
      date,
      description,
      category,
      promptId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      mediaAttachments: [
        {
          id: 'media' + Date.now(),
          type: file.type.startsWith('video') ? 'video' : 'audio',
          url: publicUrl,
          processingStatus: 'complete',
          filename: finalFileName,
          duration: duration,
          size: file.size,
        },
      ],
    };

    const docRef = await db.collection('users').doc(userId).collection('memories').add(memoryDocData);

    return NextResponse.json({ success: true, memoryId: docRef.id, message: 'Media uploaded and memory created successfully.' }, { status: 200 });

  } catch (e: any) {
    console.error('API Error in process-video:', e);
    const errorMessage = e.message || 'An unknown server error occurred';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
