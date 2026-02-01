import { adminStorage } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// A placeholder for validating an invite ID against your database.
async function validateInvite(inviteId: string): Promise<boolean> {
  // In a real application, you would query Firestore or your DB
  // to see if the inviteId is active and valid.
  console.log(`Validating invite ID: ${inviteId}`);
  // For now, we'll assume all non-empty invite IDs are valid.
  return !!inviteId;
}

export async function POST(req: Request) {
  try {
    const { fileName, contentType, inviteId } = await req.json();

    if (!fileName || !contentType || !inviteId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // 1. Validate the inviteId to ensure this storyteller is authorized
    const isInviteValid = await validateInvite(inviteId);
    if (!isInviteValid) {
      return NextResponse.json({ error: 'Invalid or expired invite.' }, { status: 403 });
    }

    if (!adminStorage) {
      return NextResponse.json({ error: 'Storage not initialized' }, { status: 500 });
    }
    const bucket = adminStorage.bucket();
    // Sanitize filename and create a unique path
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = `storyteller-uploads/${inviteId}/${Date.now()}-${safeFileName}`;
    const file = bucket.file(filePath);

    // 2. Generate a Pre-signed URL (valid for 15 minutes)
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 mins
      contentType,
    });

    return NextResponse.json({ uploadUrl: url, fileKey: file.name });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: 'Could not create upload URL.' }, { status: 500 });
  }
}
