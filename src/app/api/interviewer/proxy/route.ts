import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * FIREBASE AUTH PROXY
 * This API allows unauthenticated mobile devices to interact with specific memory documents
 * by using the server's elevated privileges (Service Account). This bypasses the need for 
 * Firebase Auth on the phone client, resolving the "Domain Blocked" and "Missing Permissions" errors.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostId = searchParams.get('hostId');
  const memoryId = searchParams.get('memoryId');

  if (!hostId || !memoryId || !adminDb) {
    return NextResponse.json({ error: "Missing required identifiers or DB not initialized." }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection('users').doc(hostId).collection('memories').doc(memoryId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Memory not found." }, { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error: any) {
    console.error("[Proxy GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostId = searchParams.get('hostId');
  const memoryId = searchParams.get('memoryId');
  const body = await request.json();

  if (!hostId || !memoryId || !adminDb) {
    return NextResponse.json({ error: "Missing required identifiers." }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection('users').doc(hostId).collection('memories').doc(memoryId);
    
    // Inject server-side heartbeat for every activity
    const updatePayload = {
      ...body,
      lastSeen: Date.now()
    };

    console.log(`[Proxy PATCH] Host: ${hostId} | Memory: ${memoryId} | Payload:`, JSON.stringify(updatePayload));

    await docRef.update(updatePayload);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Proxy PATCH] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
