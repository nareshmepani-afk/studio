import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { isSafeQaFixtureForCleanup } from '@/lib/qa/qaFixtureSeeder';
import { requireAdminSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const DEFAULT_TESTER_UID = 'TQdB395kXxaAGPhFxk1LVWuT8cg2';
const SAFE_UID_REGEX = /^[a-zA-Z0-9_-]{6,128}$/;
const SAFE_DOC_ID_REGEX = /^qa_fixture_[a-zA-Z0-9_-]{4,160}$/;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialised' }, { status: 503 });
    }

    const userId = (request.nextUrl.searchParams.get('userId') || DEFAULT_TESTER_UID).trim();
    const docId = (request.nextUrl.searchParams.get('docId') || `qa_fixture_${userId}_55_5`).trim();

    if (!SAFE_UID_REGEX.test(userId) || !SAFE_DOC_ID_REGEX.test(docId)) {
      return NextResponse.json({ success: false, error: 'Invalid userId or fixture docId' }, { status: 400 });
    }

    const snap = await adminDb.collection('users').doc(userId).collection('memories').doc(docId).get();
    if (!snap.exists) {
      return NextResponse.json({ success: true, exists: false, docId, proseLength: 0 });
    }

    const data = snap.data() || {};
    const prose = typeof data.prose === 'string' ? data.prose : '';
    return NextResponse.json(
      { success: true, exists: true, docId, proseLength: prose.length },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    console.error('[GET /api/admin/qa/fixtures] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialised' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || DEFAULT_TESTER_UID).trim();
    const docId = String(body.docId || '').trim();
    const sceneId = String(body.sceneId || 'part-1-scene-1').trim();

    if (!SAFE_UID_REGEX.test(userId) || !SAFE_DOC_ID_REGEX.test(docId)) {
      return NextResponse.json({ success: false, error: 'Invalid userId or qa_fixture_ docId' }, { status: 400 });
    }

    const now = Date.now();
    const payload = {
      id: docId,
      userId,
      sceneId,
      promptId: sceneId,
      title: 'QA Sandbox Scene',
      prose: '',
      isQATestFixture: true,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('users').doc(userId).collection('memories').doc(docId).set(payload, { merge: true });
    await adminDb.collection('memories').doc(docId).set(payload, { merge: true });

    return NextResponse.json({ success: true, docId, userId, sceneId });
  } catch (err: any) {
    console.error('[POST /api/admin/qa/fixtures] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialised' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || DEFAULT_TESTER_UID).trim();
    const docId = String(body.docId || '').trim();

    if (!SAFE_UID_REGEX.test(userId) || !SAFE_DOC_ID_REGEX.test(docId)) {
      return NextResponse.json({ success: false, error: 'Invalid userId or qa_fixture_ docId' }, { status: 400 });
    }

    const purged: string[] = [];
    const userRef = adminDb.collection('users').doc(userId).collection('memories').doc(docId);
    const userSnap = await userRef.get();
    if (userSnap.exists && isSafeQaFixtureForCleanup(userSnap.id, userSnap.data())) {
      await userRef.delete();
      purged.push(`users/${userId}/memories/${docId}`);
    }

    const rootRef = adminDb.collection('memories').doc(docId);
    const rootSnap = await rootRef.get();
    if (rootSnap.exists && isSafeQaFixtureForCleanup(rootSnap.id, rootSnap.data())) {
      await rootRef.delete();
      purged.push(`memories/${docId}`);
    }

    return NextResponse.json({ success: true, docId, purged });
  } catch (err: any) {
    console.error('[DELETE /api/admin/qa/fixtures] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
