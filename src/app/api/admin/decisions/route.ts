import { NextRequest, NextResponse } from 'next/server';
import { isProductionProject, resolveProjectId } from '@/config/environment';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdminSession } from '@/lib/session';
import {
  buildSeededDecisionRecord,
  DEFAULT_FOUNDER_DECISION_SEEDS,
  FOUNDER_DECISIONS_COLLECTION,
  type FounderDecisionRecord,
  type FounderDecisionStatus,
} from '@/lib/founderDecisions';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

function computeCounts(decisions: FounderDecisionRecord[]) {
  return {
    total: decisions.length,
    decided: decisions.filter((d) => d.status === 'DECIDED').length,
    deferred: decisions.filter((d) => d.status === 'DEFERRED_TO_PLANE').length,
    pending: decisions.filter((d) => d.status === 'PENDING').length,
  };
}

async function ensureAndLoadDecisions(forceSeed: boolean = false): Promise<FounderDecisionRecord[]> {
  const now = Date.now();
  const defaultList = DEFAULT_FOUNDER_DECISION_SEEDS.map((s) => buildSeededDecisionRecord(s, now));

  if (!adminDb) return defaultList;
  const col = adminDb.collection(FOUNDER_DECISIONS_COLLECTION);

  for (const seed of DEFAULT_FOUNDER_DECISION_SEEDS) {
    try {
      const ref = col.doc(seed.id);
      const snap = await ref.get();
      if (!snap.exists || forceSeed) {
        await ref.set(buildSeededDecisionRecord(seed, now), { merge: true });
      }
    } catch (seedErr) {
      console.warn(`[decisions/route] Seed error for ${seed.id}:`, seedErr);
    }
  }

  try {
    const snap = await col.orderBy('order', 'asc').limit(100).get();
    const list: FounderDecisionRecord[] = snap.docs.map((d) => ({
      ...(d.data() as FounderDecisionRecord),
      id: d.id,
    }));

    list.sort((a, b) => Number(a.order || 999) - Number(b.order || 999));
    if (list.length > 0) return list;
  } catch (orderErr) {
    console.warn('[decisions/route] Query orderBy failed, falling back to simple scan:', orderErr);
    try {
      const snap = await col.limit(100).get();
      const list: FounderDecisionRecord[] = snap.docs.map((d) => ({
        ...(d.data() as FounderDecisionRecord),
        id: d.id,
      }));
      list.sort((a, b) => Number(a.order || 999) - Number(b.order || 999));
      if (list.length > 0) return list;
    } catch (scanErr) {
      console.error('[decisions/route] Simple scan failed:', scanErr);
    }
  }

  return defaultList;
}

export async function GET() {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503 }
      );
    }

    // Never auto-seed staging cutover decision cards into production Firestore (prevents split approvals).
    if (isProductionProject(resolveProjectId())) {
      return NextResponse.json(
        {
          success: true,
          isProduction: true,
          decisions: [],
          counts: { total: 0, decided: 0, deferred: 0, pending: 0 },
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    const decisions = await ensureAndLoadDecisions();
    return NextResponse.json(
      { success: true, decisions, counts: computeCounts(decisions) },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[GET /api/admin/decisions] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

interface DecisionUpdateInput {
  id: string;
  selectedOptionId?: string;
  deferredToPlane?: boolean;
  notes?: string;
  status?: FounderDecisionStatus;
  planeDeferredRef?: string;
}

async function persistDecisionUpdates(
  updates: DecisionUpdateInput[],
  adminEmail: string
): Promise<FounderDecisionRecord[]> {
  if (!adminDb) return [];
  const col = adminDb.collection(FOUNDER_DECISIONS_COLLECTION);
  const now = Date.now();
  const seedMap = new Map(DEFAULT_FOUNDER_DECISION_SEEDS.map((s) => [s.id, s]));

  for (const item of updates) {
    if (!item || typeof item.id !== 'string' || !item.id.trim()) continue;
    const id = item.id.trim();
    const ref = col.doc(id);
    const snap = await ref.get();
    const existing = snap.exists ? (snap.data() as Partial<FounderDecisionRecord>) : null;
    const seed = seedMap.get(id);

    const base: Partial<FounderDecisionRecord> =
      existing || (seed ? buildSeededDecisionRecord(seed, now) : { id, createdAt: now });

    const deferred = Boolean(item.deferredToPlane);
    const selectedOptionId =
      typeof item.selectedOptionId === 'string' && item.selectedOptionId.trim()
        ? item.selectedOptionId.trim()
        : base.selectedOptionId || base.recommendedOptionId || '';

    const nextStatus: FounderDecisionStatus =
      item.status === 'PENDING' || item.status === 'DECIDED' || item.status === 'DEFERRED_TO_PLANE'
        ? item.status
        : deferred
          ? 'DEFERRED_TO_PLANE'
          : 'DECIDED';

    await ref.set(
      {
        ...base,
        id,
        selectedOptionId,
        deferredToPlane: deferred,
        status: nextStatus,
        notes: typeof item.notes === 'string' ? item.notes : base.notes || '',
        ...(item.planeDeferredRef !== undefined
          ? { planeDeferredRef: String(item.planeDeferredRef).trim() }
          : {}),
        decidedBy: adminEmail,
        updatedAt: now,
        updatedAtIso: new Date(now).toISOString(),
      },
      { merge: true }
    );
  }

  return ensureAndLoadDecisions();
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503 }
      );
    }
    if (isProductionProject(resolveProjectId())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Founder cutover decisions are managed exclusively on the Staging Control Plane (dev.memoryweaver.studio).',
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json();
    const adminEmail = authResult.session.email || 'founder-admin';

    const updates: DecisionUpdateInput[] = Array.isArray(body?.decisions)
      ? body.decisions
      : body?.id
        ? [body]
        : [];

    if (updates.length === 0 && body?.action !== 'seed') {
      return NextResponse.json(
        { success: false, error: 'decisions array or decision id is required' },
        { status: 400 }
      );
    }

    const decisions =
      updates.length > 0
        ? await persistDecisionUpdates(updates, adminEmail)
        : await ensureAndLoadDecisions(body?.action === 'seed');

    return NextResponse.json(
      { success: true, decisions, counts: computeCounts(decisions) },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[POST /api/admin/decisions] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503 }
      );
    }
    if (isProductionProject(resolveProjectId())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Founder cutover decisions are managed exclusively on the Staging Control Plane (dev.memoryweaver.studio).',
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json();
    if (!body?.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Decision id is required' },
        { status: 400 }
      );
    }

    const adminEmail = authResult.session.email || 'founder-admin';
    const decisions = await persistDecisionUpdates([body], adminEmail);
    const updated = decisions.find((d) => d.id === body.id) || null;

    return NextResponse.json(
      { success: true, decision: updated, decisions, counts: computeCounts(decisions) },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[PATCH /api/admin/decisions] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
