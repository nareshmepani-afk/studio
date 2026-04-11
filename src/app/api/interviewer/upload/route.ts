import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

/**
 * FIREBASE STORAGE PROXY
 * Allows unauthenticated phones to upload video artifacts via the server.
 * This bypasses Firebase Storage domain white-listing (referer block).
 */

export const config = {
  api: {
    bodyParser: false, // Handle binary stream directly
  },
};

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostId = searchParams.get('hostId');
  const memoryId = searchParams.get('memoryId');

  if (!hostId || !memoryId || !adminStorage) {
    return NextResponse.json({ error: "Missing metadata or storage not initialized." }, { status: 400 });
  }

  try {
    const bucket = adminStorage.bucket();
    const filePath = `users/${hostId}/videos/${memoryId}.webm`;
    const file = bucket.file(filePath);

    // Get the blob as buffer
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await file.save(buffer, {
      metadata: { contentType: 'video/webm' },
    });

    // Generate a public URL (or a signed URL with long expiry)
    // For simplicity, we trigger a "makePublic" or just get the signed URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Effectively forever
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("[Proxy Upload] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
