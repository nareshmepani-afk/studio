import { NextRequest, NextResponse } from 'next/server';
import { resolvePublicAppUrl } from '@/config/environment';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdminSession } from '@/lib/session';
import {
  generateBugReportId,
  isValidBugReportStatus,
  sanitizeBugDeepLinkRoute,
  type BugReportRecord,
} from '@/lib/bugReports';
import {
  addPlaneIssueComment,
  loadPlaneEnv,
  updatePlaneIssueState,
} from '@/lib/planeClient';
import { normalisePlaneIssueKey, type PlaneSyncResult } from '@/lib/planeTypes';

export const dynamic = 'force-dynamic';

const COLLECTION = 'bug_reports';
const VALID_ID_RE = /^[A-Za-z0-9_-]{4,120}$/;

function sanitizeStringList(raw: unknown, maxItems = 12, maxLen = 500): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((item) => String(item ?? '').trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitizeIndexList(raw: unknown): number[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < 50);
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialised' }, { status: 503 });
    }

    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    const filterStatus = searchParams.get('status')?.trim() || '';
    const filterTraceId = searchParams.get('traceId')?.trim() || '';
    const filterReportId = searchParams.get('reportId')?.trim() || '';
    const filterUserId = searchParams.get('userId')?.trim() || '';

    const snap = await adminDb.collection(COLLECTION).orderBy('createdAt', 'desc').limit(150).get();
    let reports: BugReportRecord[] = snap.docs.map((doc) => ({
      ...(doc.data() as BugReportRecord),
      reportId: doc.id,
    }));

    if (filterStatus && filterStatus !== 'ALL') {
      reports = reports.filter((r) => r.status === filterStatus);
    }
    if (filterTraceId) {
      reports = reports.filter((r) => r.traceId === filterTraceId);
    }
    if (filterReportId) {
      reports = reports.filter((r) => r.reportId === filterReportId);
    }
    if (filterUserId) {
      reports = reports.filter((r) => r.userId === filterUserId);
    }

    return NextResponse.json(
      { success: true, reports },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    console.error('[GET /api/admin/bugs] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialised' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const description = String(body.description || '').trim().slice(0, 4000);
    if (!description) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }

    const now = Date.now();
    const reportId = body.reportId && VALID_ID_RE.test(String(body.reportId).trim())
      ? String(body.reportId).trim()
      : generateBugReportId(now);
    const status = isValidBugReportStatus(body.status) ? body.status : 'OPEN';
    const parsedCardId = Number(body.cardId);
    const testSteps = sanitizeStringList(body.testSteps);
    const verificationChecks = sanitizeStringList(body.verificationChecks);

    const record: BugReportRecord = {
      reportId,
      traceId: String(body.traceId || `chat_${now}`).trim().slice(0, 120),
      userId: String(body.userId || authResult.session.uid || 'founder').trim().slice(0, 120),
      userEmail: String(body.userEmail || authResult.session.email || 'admin@memoryweaver.studio').trim().slice(0, 160),
      path: sanitizeBugDeepLinkRoute(body.path),
      appVersion: String(body.appVersion || 'v1.1.0-beta').trim().slice(0, 64),
      userAgent: String(body.userAgent || 'Chat Triage CLI').trim().slice(0, 240),
      ...(body.title ? { title: String(body.title).trim().slice(0, 200) } : {}),
      description,
      ...(testSteps ? { testSteps } : {}),
      ...(verificationChecks ? { verificationChecks } : {}),
      status,
      createdAt: now,
      createdAtIso: new Date(now).toISOString(),
      updatedAt: now,
      updatedBy: authResult.session.email || 'admin@memoryweaver.studio',
      environmentHost: String(body.environmentHost || resolvePublicAppUrl()).trim().slice(0, 160),
      planeIssueId: body.planeIssueId ? String(body.planeIssueId).trim().slice(0, 64) : null,
      resolutionNotes: String(body.resolutionNotes || '').trim().slice(0, 2000),
      fixedInCommitSha: body.fixedInCommitSha ? String(body.fixedInCommitSha).trim().slice(0, 64) : null,
      cardId: Number.isInteger(parsedCardId) && parsedCardId > 0 ? parsedCardId : null,
      source: String(body.source || 'CHAT_TRIAGE').trim().slice(0, 40),
    };

    await adminDb.collection(COLLECTION).doc(reportId).set(record, { merge: true });
    return NextResponse.json({ success: true, report: record }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/admin/bugs] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialised' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const reportId = String(body.reportId || '').trim();
    if (!VALID_ID_RE.test(reportId)) {
      return NextResponse.json({ success: false, error: 'Invalid reportId' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
      updatedBy: authResult.session.email || 'admin@memoryweaver.studio',
    };

    if ('status' in body && body.status !== undefined) {
      if (!isValidBugReportStatus(body.status)) {
        return NextResponse.json({ success: false, error: 'Invalid status value' }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === 'OPEN') {
        updates.planeClosedAt = null;
      }
    }

    if ('title' in body && body.title !== undefined) {
      updates.title = body.title === null ? null : String(body.title).trim().slice(0, 200);
    }

    if ('testSteps' in body && body.testSteps !== undefined) {
      const steps = sanitizeStringList(body.testSteps);
      if (steps) updates.testSteps = steps;
    }

    if ('verificationChecks' in body && body.verificationChecks !== undefined) {
      const checks = sanitizeStringList(body.verificationChecks);
      if (checks) updates.verificationChecks = checks;
    }

    if ('checkedIndices' in body && body.checkedIndices !== undefined) {
      const checked = sanitizeIndexList(body.checkedIndices);
      if (checked) updates.checkedIndices = checked;
    }

    if ('founderFeedback' in body && body.founderFeedback !== undefined) {
      updates.founderFeedback =
        body.founderFeedback === null ? null : String(body.founderFeedback).trim().slice(0, 4000);
    }

    if ('consoleLog' in body && body.consoleLog !== undefined) {
      updates.consoleLog =
        body.consoleLog === null ? null : String(body.consoleLog).trim().slice(0, 4000);
    }

    if ('telemetryTrace' in body && body.telemetryTrace !== undefined) {
      updates.telemetryTrace =
        body.telemetryTrace === null ? null : String(body.telemetryTrace).trim().slice(0, 4000);
    }

    if ('planeIssueId' in body && body.planeIssueId !== undefined) {
      const planeVal = body.planeIssueId === null ? null : String(body.planeIssueId).trim().slice(0, 64);
      updates.planeIssueId = planeVal || null;
    }

    if ('resolutionNotes' in body && body.resolutionNotes !== undefined) {
      updates.resolutionNotes = String(body.resolutionNotes).trim().slice(0, 2000);
    }

    if ('fixedInCommitSha' in body && body.fixedInCommitSha !== undefined) {
      const shaVal = body.fixedInCommitSha === null ? null : String(body.fixedInCommitSha).trim().slice(0, 64);
      updates.fixedInCommitSha = shaVal || null;
    }

    if ('cardId' in body && body.cardId !== undefined) {
      if (body.cardId === null || body.cardId === '') {
        updates.cardId = null;
      } else {
        const parsedCardId = Number(body.cardId);
        if (!Number.isInteger(parsedCardId) || parsedCardId <= 0) {
          return NextResponse.json({ success: false, error: 'Invalid cardId' }, { status: 400 });
        }
        updates.cardId = parsedCardId;
      }
    }

    const docRef = adminDb.collection(COLLECTION).doc(reportId);
    let planeSync: PlaneSyncResult = { attempted: false, ok: false, action: 'SKIPPED' };

    if (updates.status === 'VERIFIED') {
      const planeCfg = loadPlaneEnv({ allowDotEnvLocal: false });
      if (!planeCfg) {
        planeSync = {
          attempted: false,
          ok: false,
          configured: false,
          action: 'SKIPPED',
          reason: 'PLANE_API_KEY not bound on server runtime.',
        };
      } else {
        let existingData: Partial<BugReportRecord> | null = null;
        if (typeof (docRef as any).get === 'function') {
          const existingSnap = await docRef.get().catch(() => null);
          existingData = existingSnap?.exists ? (existingSnap.data() as Partial<BugReportRecord>) : null;
        }

        const candidatePlaneId: string | null =
          typeof updates.planeIssueId === 'string'
            ? updates.planeIssueId
            : existingData?.planeIssueId || null;
        const normalisedKey = normalisePlaneIssueKey(candidatePlaneId);

        // Idempotency guard: avoid duplicate Plane transitions/comments if already closed
        if (normalisedKey && existingData?.planeClosedAt && existingData?.status === 'VERIFIED') {
          planeSync = {
            attempted: false,
            ok: true,
            configured: true,
            action: 'SKIPPED',
            issueKey: normalisedKey,
            reason: 'Already closed in Plane.',
          };
        } else if (normalisedKey) {
          try {
            const actor = authResult.session.email || 'admin@memoryweaver.studio';
            const updatedIssue = await updatePlaneIssueState(planeCfg, normalisedKey, 'done');
            await addPlaneIssueComment(
              planeCfg,
              updatedIssue.issueId,
              `[Founder Sign-Off VERIFIED • ${actor}] Bug report ${reportId} verified via Admin Hub.`
            ).catch(() => null);
            updates.planeClosedAt = Date.now();
            planeSync = {
              attempted: true,
              ok: true,
              configured: true,
              action: 'CLOSED',
              issueKey: normalisedKey,
            };
          } catch (planeErr: any) {
            planeSync = {
              attempted: true,
              ok: false,
              configured: true,
              action: 'SKIPPED',
              issueKey: normalisedKey,
              reason: planeErr?.message || 'Plane auto-close failed.',
            };
          }
        }
      }
    }

    await docRef.set(updates, { merge: true });
    return NextResponse.json({ success: true, reportId, ...updates, planeSync });
  } catch (err: any) {
    console.error('[PATCH /api/admin/bugs] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
