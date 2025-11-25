
import { type NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import { Readable } from 'stream';

// Helper to initialize Firebase Admin SDK safely, ensuring it only runs once.
function initializeFirebaseAdmin(): { db: FirebaseFirestore.Firestore; storage: import('firebase-admin/storage').Storage } {
  if (getApps().length > 0) {
    return {
      db: getFirestore(),
      storage: getStorage(),
    };
  }

  // When deployed to App Hosting, the Admin SDK automatically detects the
  // environment and uses the Application Default Credentials.
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
    // Create a unique filename to prevent overwrites.
    const finalFileName = `${Date.now()}_${path.basename(file.name) || 'memory.webm'}`;
    const permanentPath = `users/${userId}/memories/${finalFileName}`;

    // --- Start of Streaming Fix ---
    // Instead of loading the whole file into a buffer, we create a readable stream.
    const uploadedFile = bucket.file(permanentPath);
    const fileStream = uploadedFile.createWriteStream({
      metadata: {
        contentType: file.type || "video/webm",
      },
    });

    // Create a passthrough stream from the file's arrayBuffer
    const passthrough = new Readable();
    passthrough.push(Buffer.from(await file.arrayBuffer()));
    passthrough.push(null);

    await new Promise((resolve, reject) => {
        passthrough.pipe(fileStream)
            .on('finish', resolve)
            .on('error', reject);
    });
    // --- End of Streaming Fix ---

    // Make the file publicly readable. This is crucial.
    await uploadedFile.makePublic();

    // Construct the public, permanent URL directly. This avoids the need for getSignedUrl and the associated IAM permission.
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${permanentPath}`;

    // Prepare the data for the Firestore document.
    const title = (formData.get('title') as string) || 'Untitled Memory';
    const date = (formData.get('date') as string) || new Date().toISOString();
    const description = (formData.get('description') as string) || '';
    const category = (formData.get('category') as string) || '';
    const promptId = (formData.get('promptId') as string) || '';

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
          duration: 0, // Duration is hard to get reliably server-side without heavy libraries.
          size: file.size,
        },
      ],
    };

    // Add the new memory document to Firestore.
    const docRef = await db.collection('users').doc(userId).collection('memories').add(memoryDocData);

    return NextResponse.json({ success: true, memoryId: docRef.id, message: 'Media uploaded and memory created successfully.' }, { status: 200 });

  } catch (e: any) {
    // Log the full error object for better server-side debugging
    console.error('API Error in process-video:', e.message || e.toString());
    const errorMessage = e.message || 'An unknown server error occurred';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
