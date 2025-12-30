
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';

// --- START DEFINITIVE FIX ---

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  console.log('[API/process-video] Initializing Firebase Admin...');
  try {
    let serviceAccount;
    // Try to get service account from environment variable first
    if (process.env.SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
      console.log('[API/process-video] Loaded service account from environment variable.');
    } else {
      // Fallback to file system
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(serviceAccountString);
        console.log('[API/process-video] Loaded service account from file system.');
      } else {
        throw new Error('Could not find service account credentials in env var or file.');
      }
    }
    
    // THE DEFINITIVE FIX: Hardcode the correct bucket name.
    const bucketName = 'memory-weaver-8rk9t.appspot.com';

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName
    });
    
    console.log(`[API/process-video] Initialized successfully. DEFINITIVE BUCKET: ${bucketName}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API/process-video] CRITICAL: Initialization failed:', errorMessage);
    // We will let the request fail downstream if services are unavailable.
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = getStorage();

// --- END DEFINITIVE FIX ---

export async function POST(req: NextRequest) {
  console.log('[API/process-video] Received POST request.');
  
  try {
    const sessionCookie = req.cookies.get('firebase-auth-token')?.value;
    if (!sessionCookie) {
      console.error('[API/process-video] Unauthorized: Missing session cookie.');
      return NextResponse.json({ error: 'Unauthorized: Missing session cookie.' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
      console.error('[API/process-video] Error verifying session cookie:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid session cookie.' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    console.log(`[API/process-video] Authenticated user: ${userId}`);

    const formData = await req.formData();
    const file = formData.get('mediaFile') as File | null;
    const memoryDataStr = formData.get('memoryData') as string | null;

    if (!file || !memoryDataStr) {
      console.error('[API/process-video] Bad Request: Missing media file or memory data.');
      return NextResponse.json({ error: 'Bad Request: Missing media file or memory data.' }, { status: 400 });
    }

    const memoryData = JSON.parse(memoryDataStr);
    console.log(`[API/process-video] Processing memory titled: "${memoryData.title}"`);

    const bucket = storage.bucket();
    console.log(`[API/process-video] Using storage bucket: ${bucket.name}`);

    const fileId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop();
    const filePath = `users/${userId}/media/${fileId}.${fileExtension}`;
    
    const fileRef = bucket.file(filePath);
    
    const fileBuffer = await file.arrayBuffer();
    
    await fileRef.save(Buffer.from(fileBuffer), {
      metadata: { contentType: file.type }
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    console.log(`[API/process-video] File uploaded successfully. Public URL: ${publicUrl}`);

    const newMediaAttachment = {
      id: crypto.randomUUID(),
      url: publicUrl,
      type: file.type.startsWith('video') ? 'video' : 'audio',
      filename: file.name,
      ...memoryData.mediaMetadata 
    };

    const memoryDocData = {
      ...memoryData,
      userId: userId,
      mediaAttachments: [newMediaAttachment], 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    delete memoryDocData.mediaMetadata;

    console.log('[API/process-video] Saving memory document to Firestore.');
    const docRef = await db.collection('users').doc(userId).collection('memories').add(memoryDocData);

    return NextResponse.json({ success: true, memoryId: docRef.id, message: 'Media uploaded and memory created successfully.' }, { status: 200 });

  } catch (e: any) {
    console.error('--- [API/process-video] UNHANDLED CRASH ---');
    console.error('Error Message:', e.message);
    console.error('Error Stack:', e.stack);
    console.error('Full Error Object:', e);
    console.error('--- END UNHANDLED CRASH ---');
    
    const errorMessage = e.message || 'An unknown server error occurred';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
