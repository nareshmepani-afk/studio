
import { type NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { formidable, errors as FormidableErrors } from 'formidable';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Initialize Firebase Admin SDK
// Make sure to load the service account key from environment variables
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = getFirestore();
const storage = getStorage().bucket();

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse form data
async function parseForm(req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const contentType = req.headers.get('content-type');
  if (!contentType) {
    throw new Error('No content-type header');
  }

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
    const { fields, files } = await parseForm(req);

    const file = (files.file as formidable.File[])?.[0];
    const userId = (fields.userId as string[])?.[0];

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or user ID.' }, { status: 400 });
    }

    const tempFilePath = file.filepath;
    const finalFileName = path.basename(file.originalFilename || 'memory').replace(/\.[^/.]+$/, "") + ".mp4";
    const finalFilePath = path.join(os.tmpdir(), finalFileName);

    // 1. Convert video to MP4
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempFilePath)
        .outputOptions("-c:v", "libx264")
        .outputOptions("-preset", "ultrafast")
        .outputOptions("-c:a", "aac")
        .output(finalFilePath)
        .on("end", () => {
          console.log("FFmpeg conversion finished.");
          resolve();
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(new Error(`FFmpeg conversion failed: ${err.message}`));
        })
        .run();
    });

    // 2. Upload the converted file to a permanent location
    const permanentPath = `users/${userId}/memories/${Date.now()}_${finalFileName}`;
    const [uploadedFile] = await storage.upload(finalFilePath, {
      destination: permanentPath,
      metadata: {
        contentType: "video/mp4",
      },
    });

    // 3. Get the public URL.
    const publicUrl = await uploadedFile.getSignedUrl({
        action: "read",
        expires: "03-09-2491", // Far-future expiration date
    }).then((urls) => urls[0]);

    // 4. Create Firestore document
    const title = (fields.title as string[])?.[0] || 'Untitled Memory';
    const date = (fields.date as string[])?.[0] || new Date().toISOString();
    const description = (fields.description as string[])?.[0];
    const category = (fields.category as string[])?.[0];
    const promptId = (fields.promptId as string[])?.[0];

    const fileStats = await fs.stat(finalFilePath);
    
    // We need to get duration, which requires ffmpeg again on the converted file
     const duration = await new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(finalFilePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration || 0);
        });
    });


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
          type: 'video',
          url: publicUrl,
          processingStatus: 'complete',
          filename: finalFileName,
          duration: duration,
          size: fileStats.size,
        },
      ],
    };

    const docRef = await db.collection('users').doc(userId).collection('memories').add(memoryDocData);

    // 5. Clean up temporary files
    await fs.unlink(tempFilePath);
    await fs.unlink(finalFilePath);

    return NextResponse.json({ success: true, memoryId: docRef.id, message: 'Video processed and memory created.' }, { status: 200 });

  } catch (e: any) {
    console.error('API Error processing video:', e);
    const errorMessage = e instanceof FormidableErrors.FormidableError ? 'Error parsing form data.' : e.message;
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
