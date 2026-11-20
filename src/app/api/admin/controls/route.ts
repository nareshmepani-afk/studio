import { NextRequest, NextResponse } from 'next/server';
import { isProductionProject, PRODUCTION_APP_URL, resolveProjectId } from '@/config/environment';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdminSession } from '@/lib/session';
import {
  buildSeededReleaseControl,
  computeInboxBadgeCounts,
  DEFAULT_RELEASE_CONTROL_SEEDS,
  evaluateEnvironmentParity,
  evaluateReleaseControlTransition,
  RELEASE_CONTROLS_COLLECTION,
  sortReleaseControls,
  type EnvironmentParityReport,
  type EnvironmentVersionSnapshot,
  type ReleaseControlAction,
  type ReleaseControlRecord,
  type ReleaseControlSeverity,
  type ReleaseControlEnvTag,
} from '@/lib/releaseControls';
import {
  FOUNDER_DECISIONS_COLLECTION,
  type FounderDecisionRecord,
} from '@/lib/founderDecisions';
import type { BugReportRecord } from '@/lib/bugReports';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const VALID_ACTIONS = new Set<ReleaseControlAction>([
  'APPROVE',
  'HOLD',
  'DEFER_TO_PLANE',
  'REOPEN',
  'MARK_EXECUTED',
]);

function assertStagingOnly(): NextResponse | null {
  if (isProductionProject(resolveProjectId())) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Release controls and Founder Inbox are managed exclusively on the Staging Control Plane.',
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }
  return null;
}

async function ensureAndLoadReleaseControls(forceSeed = false): Promise<ReleaseControlRecord[]> {
  const now = Date.now();
  if (!adminDb) {
    return DEFAULT_RELEASE_CONTROL_SEEDS.map((s) => buildSeededReleaseControl(s, now));
  }

  const col = adminDb.collection(RELEASE_CONTROLS_COLLECTION);

  for (const seed of DEFAULT_RELEASE_CONTROL_SEEDS) {
    try {
      const ref = col.doc(seed.id);
      const snap = await ref.get();
      if (!snap.exists || forceSeed) {
        await ref.set(buildSeededReleaseControl(seed, now), { merge: !forceSeed });
      }
    } catch (seedErr) {
      console.warn(`[controls/route] Seed skipped for ${seed.id}:`, seedErr);
    }
  }

  const snap = await col.limit(100).get();
  const list: ReleaseControlRecord[] = snap.docs.map((d) => ({
    ...(d.data() as ReleaseControlRecord),
    id: d.id,
  }));

  return sortReleaseControls(list);
}

async function loadAggregatedInbox() {
  const [controls, decisionsSnap, bugsSnap] = await Promise.all([
    ensureAndLoadReleaseControls(false),
    adminDb ? adminDb.collection(FOUNDER_DECISIONS_COLLECTION).limit(100).get() : Promise.resolve(null),
    adminDb ? adminDb.collection('bug_reports').limit(150).get() : Promise.resolve(null),
  ]);

  const allDecisions: FounderDecisionRecord[] = decisionsSnap
    ? decisionsSnap.docs
        .map((d) => ({ ...(d.data() as FounderDecisionRecord), id: d.id }))
        .sort((a, b) => Number(a.order || 999) - Number(b.order || 999))
    : [];
  const pendingDecisions = allDecisions.filter((d) => d.status === 'PENDING');

  const allBugs: BugReportRecord[] = bugsSnap
    ? bugsSnap.docs
        .map((d) => ({ ...(d.data() as BugReportRecord), reportId: d.id }))
        .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))
    : [];
  const readyBugs = allBugs.filter((b) => b.status === 'FIXED_ON_DEV');

  const badges = computeInboxBadgeCounts({
    controls,
    pendingDecisionsCount: pendingDecisions.length,
    readyBugsCount: readyBugs.length,
  });

  return {
    controls,
    pendingDecisions,
    readyBugs,
    badges,
  };
}

async function probeProductionParity(): Promise<EnvironmentParityReport> {
  const stagingSnapshot: EnvironmentVersionSnapshot = {
    commitSha:
      process.env.NEXT_PUBLIC_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_GIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.BUILD_ID ||
      'dev',
    commitTimestamp: process.env.NEXT_PUBLIC_COMMIT_TIME || null,
    environment: 'staging',
    projectId: resolveProjectId(),
    reachable: true,
  };

  if (process.env.VITEST) {
    return evaluateEnvironmentParity(stagingSnapshot, {
      commitSha: null,
      commitTimestamp: null,
      reachable: false,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${PRODUCTION_APP_URL}/api/version`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) {
      return evaluateEnvironmentParity(stagingSnapshot, {
        commitSha: null,
        commitTimestamp: null,
        reachable: false,
      });
    }
    const data = await res.json().catch(() => null);
    const prodSnapshot: EnvironmentVersionSnapshot = {
      commitSha: data?.commitSha ? String(data.commitSha) : null,
      commitTimestamp: data?.commitTimestamp ? String(data.commitTimestamp) : null,
      environment: data?.environment ? String(data.environment) : 'production',
      projectId: data?.projectId ? String(data.projectId) : null,
      buildTimestamp: data?.buildTimestamp ? String(data.buildTimestamp) : null,
      reachable: Boolean(data?.commitSha),
    };
    return evaluateEnvironmentParity(stagingSnapshot, prodSnapshot);
  } catch {
    return evaluateEnvironmentParity(stagingSnapshot, {
      commitSha: null,
      commitTimestamp: null,
      reachable: false,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const prodBlocked = assertStagingOnly();
    if (prodBlocked) return prodBlocked;

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const searchParams = (req.nextUrl ?? new URL(req.url)).searchParams;
    const includeParity = searchParams.get('includeParity') === '1';

    const [payload, parity] = await Promise.all([
      loadAggregatedInbox(),
      includeParity ? probeProductionParity() : Promise.resolve(undefined),
    ]);

    return NextResponse.json(
      {
        success: true,
        environment: 'STAGING',
        ...payload,
        ...(parity ? { parity } : {}),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[GET /api/admin/controls] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const prodBlocked = assertStagingOnly();
    if (prodBlocked) return prodBlocked;

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (body.action === 'seed') {
      await ensureAndLoadReleaseControls(false);
      const payload = await loadAggregatedInbox();
      return NextResponse.json(
        { success: true, ...payload },
        { headers: NO_STORE_HEADERS }
      );
    }

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
    const knockOnImpact = typeof body.knockOnImpact === 'string' ? body.knockOnImpact.trim() : '';
    const severity: ReleaseControlSeverity = body.severity === 'RED' ? 'RED' : 'AMBER';
    const envTag: ReleaseControlEnvTag =
      body.envTag === '[ENV: PROD]' || body.envTag === '[ENV: STAGING]' || body.envTag === '[ENV: BOTH]'
        ? body.envTag
        : '[ENV: BOTH]';

    if (!id || !/^[a-z0-9_-]{3,80}$/i.test(id) || !title || !knockOnImpact) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid id, title, and 1-line knockOnImpact are required.',
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const now = Date.now();
    const record = buildSeededReleaseControl(
      {
        id,
        order: Number.isFinite(Number(body.order)) ? Number(body.order) : 50,
        title,
        summary: summary || title,
        severity,
        knockOnImpact,
        envTag,
        ticketRefs: Array.isArray(body.ticketRefs)
          ? body.ticketRefs.map((t: unknown) => String(t).trim()).filter(Boolean)
          : [],
      },
      now
    );
    record.updatedBy = authResult.session?.email || 'founder-admin';

    await adminDb.collection(RELEASE_CONTROLS_COLLECTION).doc(id).set(record, { merge: false });
    const payload = await loadAggregatedInbox();

    return NextResponse.json(
      { success: true, control: record, ...payload },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[POST /api/admin/controls] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const prodBlocked = assertStagingOnly();
    if (prodBlocked) return prodBlocked;

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    const action = typeof body?.action === 'string' ? (body.action.trim().toUpperCase() as ReleaseControlAction) : null;

    if (!id || !action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { success: false, error: 'Valid control id and action are required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const ref = adminDb.collection(RELEASE_CONTROLS_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: `Release control "${id}" not found.` },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const existing = { ...(snap.data() as ReleaseControlRecord), id: snap.id };
    const actor = authResult.session?.email || 'founder-admin';

    const transition = evaluateReleaseControlTransition(existing, {
      action,
      actor,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
      expectedUpdatedAt:
        typeof body.expectedUpdatedAt === 'number' ? body.expectedUpdatedAt : undefined,
      acknowledgedKnockOn: body.acknowledgedKnockOn === true,
      executedCommitSha:
        typeof body.executedCommitSha === 'string' ? body.executedCommitSha : undefined,
    });

    if (!transition.ok) {
      return NextResponse.json(
        { success: false, error: transition.error },
        { status: transition.status, headers: NO_STORE_HEADERS }
      );
    }

    await ref.set(transition.next, { merge: false });
    const payload = await loadAggregatedInbox();

    return NextResponse.json(
      {
        success: true,
        control: transition.next,
        ...payload,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[PATCH /api/admin/controls] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
