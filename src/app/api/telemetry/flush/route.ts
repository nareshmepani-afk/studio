import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-verification';

// Telemetry API route handler running on standard Node.js runtime to support firebase-admin batching

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict cryptographic session fencing
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAuthToken(token);
    const authUid = decodedToken.uid;

    const body = await req.json();
    const { userId, events } = body;

    // Guard against client-side spoofing or payload injection
    if (userId !== authUid) {
      return NextResponse.json({ error: 'Forbidden: Security context mismatch' }, { status: 403 });
    }

    if (!Array.isArray(events) || events.length > 20) {
      return NextResponse.json({ error: 'Bad Request: Event payload exceeds limits' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Server Error: Database offline' }, { status: 500 });
    }

    // 2. Atomic Batch Compilation to safeguard Edge CPU execution limits
    const batch = adminDb.batch();
    const journeyRef = adminDb.collection('user_journeys').doc(userId);

    // Prepare debounced timeline updates inside a single document write transaction
    const timestampNow = new Date();
    const timelineUpdates = events.map(e => ({
      eventId: e.eventId || crypto.randomUUID(),
      eventAction: e.eventAction,
      stage: e.stage,
      timestamp: e.timestamp || timestampNow.toISOString()
    }));

    // Update aggregated status and append the buffered matrix array
    batch.set(journeyRef, {
      userId,
      email: decodedToken.email || '',
      currentStep: events[events.length - 1].eventAction,
      lastActive: timestampNow,
      timeline: timelineUpdates
    }, { merge: true });

    await batch.commit();

    return NextResponse.json({ success: true, processedEvents: events.length }, { status: 200 });
  } catch (error: any) {
    console.error('[Telemetry Edge API Error]:', error);
    return NextResponse.json({ error: 'Internal server processing failure' }, { status: 500 });
  }
}
