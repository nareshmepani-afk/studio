import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filePath, contentType } = body;

    if (!filePath || !contentType || !adminStorage) {
      return NextResponse.json(
        { error: 'Missing parameters or storage not initialized.' },
        { status: 400 }
      );
    }

    const bucket = adminStorage.bucket();
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
