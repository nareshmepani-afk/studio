import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdminSession } from '@/lib/session';
import { isValidBugReportStatus, type BugReportRecord } from '@/lib/bugReports';

export const dynamic = 'force-dynamic';

const COLLECTION = 'bug_reports';
const VALID_ID_RE = /^[A-Za-z0-9_-]{4,120}$/;

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
    }

    if ('planeIssueId' in body && body.planeIssueId !== undefined) {
      const planeVal = body.planeIssueId === null ? null : String(body.planeIssueId).trim().slice(0, 64);
      updates.planeIssueId = planeVal || null;
    }

    if ('resolutionNotes' in body && body.resolutionNotes !== undefined) {
      updates.resolutionNotes = String(body.resolutionNotes).trim().slice(0, 2000);
    }

    await adminDb.collection(COLLECTION).doc(reportId).set(updates, { merge: true });
    return NextResponse.json({ success: true, reportId, ...updates });
  } catch (err: any) {
    console.error('[PATCH /api/admin/bugs] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
