import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

let corsConfigured = false;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filePath, contentType, bucketName } = body;

    if (!filePath || !contentType || !adminStorage) {
      return NextResponse.json(
        { error: 'Missing parameters or storage not initialized.' },
        { status: 400 }
      );
    }

    const bucket = bucketName ? adminStorage.bucket(bucketName) : adminStorage.bucket();

    // Auto-configure CORS for the GCS bucket once per container lifecycle
    if (!corsConfigured) {
      try {
        await bucket.setCorsConfiguration([
          {
            maxAgeSeconds: 3600,
            method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            origin: ['*'],
            responseHeader: ['Content-Type', 'Range', 'Content-Range'],
          }
        ]);
        corsConfigured = true;
        console.log('[GCS:CORS] Configured CORS on bucket successfully.');
      } catch (corsErr: any) {
        console.error('[GCS:CORS] Failed to set CORS configuration:', corsErr.message);
      }
    }

    const file = bucket.file(filePath);

    // Request the GCS Native Resumable Session URL
    const [sessionUrl] = await file.createResumableUpload({
      metadata: { contentType },
    });

    return NextResponse.json({ sessionUrl });
  } catch (error: any) {
    console.error('[GCS:Session] Generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
