import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json(
        { error: 'Unauthorised. Please sign in to request an upload session.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { filePath, contentType, bucketName } = body;

    if (!filePath || typeof filePath !== 'string' || !contentType || !adminStorage) {
      return NextResponse.json(
        { error: 'Missing parameters or storage not initialised.' },
        { status: 400 }
      );
    }

    const expectedPrefix = `users/${session.uid}/`;
    if (
      !filePath.startsWith(expectedPrefix) ||
      filePath.includes('..') ||
      filePath.includes('\\')
    ) {
      return NextResponse.json(
        { error: 'Forbidden: storage path outside authenticated user boundary.' },
        { status: 403 }
      );
    }

    const bucket = bucketName ? adminStorage.bucket(bucketName) : adminStorage.bucket();
    const file = bucket.file(filePath);
    const origin = request.headers.get('origin') || undefined;

    // Request GCS Native Resumable Session URL scoped to caller origin (never mutate bucket CORS at runtime)
    const [sessionUrl] = await file.createResumableUpload({
      origin,
      metadata: { contentType },
    });

    return NextResponse.json({ sessionUrl });
  } catch (error: any) {
    console.error('[GCS:Session] Generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
