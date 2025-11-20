
import { type NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { formidable } from 'formidable';
import * as fs from 'fs/promises';
import path from 'path';

// Helper function to initialize Firebase Admin SDK safely
function initializeFirebaseAdmin() {
  if (getApps().length) {
    return {
      db: getFirestore(),
      storage: getStorage().bucket(),
    };
  }

  // This check is crucial for the build process and for runtime.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in the environment variables.');
  }

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return {
    db: getFirestore(),
    storage: getStorage().bucket(),
  };
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse form data
async function parseForm(req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const chunks: Uint8Array[] = [];
  const reader = req.body!.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const body = Buffer.concat(chunks);
  
  return new Promise((resolve, reject) => {
    const form = formidable({});
    form.parse(body, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { db, storage } = initializeFirebaseAdmin();

    const { fields, files } = await parseForm(req);

    const file = (files.file as formidable.File[])?.[0];
    const userId = (fields.userId as string[])?.[0];

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or user ID.' }, { status: 400 });
    }

    const tempFilePath = file.filepath;
    const finalFileName = path.basename(file.originalFilename || 'memory.webm');
    
    // Upload the original file to a permanent location
    const permanentPath = `users/${userId}/memories/${Date.now()}_${finalFileName}`;
    const [uploadedFile] = await storage.upload(tempFilePath, {
      destination: permanentPath,
      metadata: {
        contentType: file.mimetype || "video/webm",
      },
    });

    // Get a long-lived signed URL for public access.
    const publicUrl = await uploadedFile.getSignedUrl({
        action: "read",
        expires: "03-09-2491", // A very distant future date
    }).then((urls) => urls[0]);

    // Create Firestore document
    const title = (fields.title as string[])?.[0] || 'Untitled Memory';
    const date = (fields.date as string[])?.[0] || new Date().toISOString();
    const description = (fields.description as string[])?.[0];
    const category = (fields.category as string[])?.[0];
    const promptId = (fields.promptId as string[])?.[0];

    const fileStats = await fs.stat(tempFilePath);
    
    // Duration is hard to get reliably without ffmpeg, so we omit it for now
    const duration = 0; 

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
          type: 'video', // Assuming video for now, can be enhanced
          url: publicUrl,
          processingStatus: 'complete',
          filename: finalFileName,
          duration: duration,
          size: fileStats.size,
        },
      ],
    };

    const docRef = await db.collection('users').doc(userId).collection('memories').add(memoryDocData);

    await fs.unlink(tempFilePath);

    return NextResponse.json({ success: true, memoryId: docRef.id, message: 'Media uploaded and memory created successfully.' }, { status: 200 });

  } catch (e: any) {
    console.error('API Error in process-video:', e);
    const errorMessage = e.message || 'An unknown server error occurred';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
