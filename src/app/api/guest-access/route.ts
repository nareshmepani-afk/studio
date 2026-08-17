import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { adminDb } from '@/lib/firebase-admin';

// Ensure the secret is loaded from environment variables and is of sufficient length
const GUEST_SECRET = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET);

/**
 * GET /api/guest-access?id={memoryId}
 * Used by /cinema/tv page to fetch a public memory document for Smart TV playback.
 * Uses inline adminDb query to avoid 'use server' action bundling boundary issues.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memoryId = searchParams.get('id');

  if (!memoryId) {
    return NextResponse.json({ error: 'Missing id parameter.' }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialised.' }, { status: 503 });
  }

  try {
    const memoryQuery = await adminDb.collectionGroup('memories').get();
    const targetDoc = memoryQuery.docs.find(d => d.id === memoryId);

    if (!targetDoc || !targetDoc.exists) {
      return NextResponse.json({ error: 'Memory not found.' }, { status: 404 });
    }

    const memoryData = { id: targetDoc.id, ...targetDoc.data() };
    return NextResponse.json(memoryData);
  } catch (error: any) {
    console.error('[GET /api/guest-access] Error fetching memory:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch memory.' }, { status: 500 });
  }
}

export async function POST() {
  // In a real-world application, this endpoint would be protected and 
  // might verify a purchase or a specific user right before issuing a pass.
  
  try {
    // Create the 6-month Guest Access Pass
    const token = await new SignJWT({ role: 'guest' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('180d') // 180 days
      .sign(GUEST_SECRET);

    const response = NextResponse.json({ success: true, message: "Guest Access Pass created." });

    // Set the pass in an HTTP-only cookie
    response.cookies.set('guest_pass', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 180, // 180 days in seconds
    });

    return response;
  } catch (error) {
    console.error('Error creating guest access pass:', error);
    return NextResponse.json({ success: false, error: 'Could not create guest pass.' }, { status: 500 });
  }
}
