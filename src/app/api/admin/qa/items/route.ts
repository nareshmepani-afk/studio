import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdminSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const COLLECTION_PATH = 'qa_suites/active_deck/items';
const ITEM_ID_REGEX = /^\d+(\.\d+)?$/;
const ALLOWED_FIELDS = [
  'verdict',
  'notes',
  'telemetryTrace',
  'screenshots',
  'title',
  'targetRoute',
  'developerResolution',
  'resolutionStatus',
] as const;

function sanitizeUpdatePayload(rawUpdates: Record<string, unknown>, adminEmail: string): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {
    updatedAt: Date.now(),
    updatedBy: adminEmail,
  };
  for (const key of ALLOWED_FIELDS) {
    if (!(key in rawUpdates) || rawUpdates[key] === undefined) continue;
    if (key === 'screenshots' && Array.isArray(rawUpdates[key])) {
      sanitized[key] = rawUpdates[key].filter(
        (u): u is string =>
          typeof u === 'string' &&
          (u.startsWith('https://') || u.startsWith('http://') || u.startsWith('/api/admin/qa/evidence?'))
      );
      continue;
    }
    sanitized[key] = rawUpdates[key];
  }
  return sanitized;
}

export async function GET() {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialised' }, { status: 503 });
    }

    const snap = await adminDb.collection(COLLECTION_PATH).get();
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(
      { success: true, items },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    console.error('[GET /api/admin/qa/items] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

async function handleUpsert(request: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialised' }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const itemId = String(body.id || '').trim();
    if (!ITEM_ID_REGEX.test(itemId)) {
      return NextResponse.json({ success: false, error: 'Invalid QA item ID' }, { status: 400 });
    }

    const rawUpdates =
      body.updates && typeof body.updates === 'object' ? (body.updates as Record<string, unknown>) : (body as Record<string, unknown>);
    const payload = sanitizeUpdatePayload(rawUpdates, authResult.session.email || 'admin@memoryweaver.studio');

    await adminDb.collection(COLLECTION_PATH).doc(itemId).set(payload, { merge: true });
    return NextResponse.json({ success: true, id: itemId, updatedAt: payload.updatedAt });
  } catch (err: any) {
    console.error('[PATCH /api/admin/qa/items] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return handleUpsert(request);
}

export async function POST(request: Request) {
  return handleUpsert(request);
}
