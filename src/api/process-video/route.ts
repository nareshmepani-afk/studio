
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
    const memoryId = formData.get('memoryId') as string | null; // ID of memory to update

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or user ID.' }, { status: 400 });
    }

    const bucket = storage.bucket();
    // Create a unique filename to prevent overwrites.
    const finalFileName = `${Date.now()}_${path.basename(file.name) || 'memory.webm'}`;
    const permanentPath = `users/${userId}/memories/${finalFileName}`;
    
    // --- Start of CORRECTED Streaming Fix ---
    // This is the correct way to stream a file from a Next.js API route.
    const uploadedFile = bucket.file(permanentPath);
    const fileStream = uploadedFile.createWriteStream({
      metadata: {
        contentType: file.type || "video/webm",
      },
    });

    // We get a ReadableStream from the file, which doesn't load it all into memory.
    const reader = file.stream().getReader();

    // We pipe the chunks to the Firebase Storage write stream.
    await new Promise((resolve, reject) => {
      const pump = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            fileStream.end();
            return resolve(undefined);
          }
          if (fileStream.write(value)) {
            pump();
          } else {
            fileStream.once('drain', pump);
          }
        }).catch(err => {
            console.error("Error reading from file stream:", err);
            fileStream.destroy(err);
            reject(err);
        });
      };
      
      fileStream.on('finish', resolve);
      fileStream.on('error', (err) => {
          console.error("Firebase Storage write stream error:", err);
          reject(err);
      });

      pump();
    });
    // --- End of CORRECTED Streaming Fix ---

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

    let docId: string;
    if (memoryId) {
        // If a memoryId is provided, we are UPDATING an existing document
        const docRef = db.collection('users').doc(userId).collection('memories').doc(memoryId);
        await docRef.update({ ...memoryDocData, updatedAt: new Date() });
        docId = memoryId;
    } else {
        // Otherwise, we are CREATING a new document
        const docRef = await db.collection('users').doc(userId).collection('memories').add({ ...memoryDocData, createdAt: new Date(), updatedAt: new Date() });
        docId = docRef.id;
    }

    return NextResponse.json({ success: true, memoryId: docId, message: 'Media uploaded and memory created successfully.' }, { status: 200 });

  } catch (e: any) {
    // Log the full error object for better server-side debugging
    console.error('API Error in process-video:', e); 
    const errorMessage = e.message || 'An unknown server error occurred';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
