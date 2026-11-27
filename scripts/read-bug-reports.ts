import { getStagingAdmin } from './lib/stagingAdmin';
import { loadPlaneEnv, createPlaneIssue, updatePlaneIssueState } from './lib/planeClient';
import {
  generateBugReportId,
  isValidBugReportStatus,
  sanitizeBugDeepLinkRoute,
  type BugReportRecord,
  type BugReportStatus,
} from '../src/lib/bugReports';

export function formatBugReportForPlane(report: Partial<BugReportRecord>): {
  title: string;
  description: string;
} {
  const shortDesc = (report.description || 'No description').replace(/\s+/g, ' ').trim().slice(0, 90);
  const title = `[BUG ${report.reportId || 'unknown'}] ${shortDesc}`;
  const description = [
    `**Report ID:** ${report.reportId || 'N/A'}`,
    `**Trace ID:** ${report.traceId || 'N/A'}`,
    `**Status:** ${report.status || 'OPEN'}`,
    `**Route:** ${report.path || '/'}`,
    `**Reporter:** ${report.userEmail || 'unauthenticated'} (${report.userId || 'guest'})`,
    `**Version:** ${report.appVersion || 'unknown'}`,
    ...(report.fixedInCommitSha ? [`**Fixed Commit SHA:** ${report.fixedInCommitSha}`] : []),
    ...(report.cardId ? [`**QA Card Ref:** /admin/qa#card-${report.cardId}`] : []),
    `**Origin:** ${report.environmentHost || 'https://dev.memoryweaver.studio'}`,
    `**Logged At:** ${report.createdAtIso || 'N/A'}`,
    '',
    '### Description',
    report.description || '',
  ].join('\n');
  return { title, description };
}

function readArgValue(argv: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const eqArg = argv.find((a) => a.startsWith(prefix));
  if (eqArg) return eqArg.slice(prefix.length);
  const idx = argv.indexOf(`--${flag}`);
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) {
    return argv[idx + 1];
  }
  return undefined;
}

export async function readBugReports(argv: string[] = process.argv.slice(2)) {
  const syncPlane = argv.includes('--sync-plane');
  const shouldCreate = argv.includes('--create') || argv.includes('--upsert');
  const shouldUpdate = argv.includes('--mark-fixed') || argv.includes('--update');
  const { adminDb } = getStagingAdmin();

  if (shouldCreate) {
    const desc = readArgValue(argv, 'desc') || readArgValue(argv, 'description');
    if (!desc || !desc.trim()) {
      throw new Error('--create requires --desc="..."');
    }
    const now = Date.now();
    const reportId = readArgValue(argv, 'report-id') || generateBugReportId(now);
    const traceId = readArgValue(argv, 'trace') || readArgValue(argv, 'trace-id') || `chat_${now}`;
    const rawStatus = readArgValue(argv, 'status');
    const status: BugReportStatus = isValidBugReportStatus(rawStatus) ? rawStatus : 'OPEN';
    const routePath = sanitizeBugDeepLinkRoute(readArgValue(argv, 'path') || '/');
    const fixedInCommitSha = readArgValue(argv, 'sha') || null;
    const cardRaw = readArgValue(argv, 'card');
    const cardId = cardRaw && Number.isInteger(Number(cardRaw)) && Number(cardRaw) > 0 ? Number(cardRaw) : null;
    let planeIssueId = readArgValue(argv, 'plane') || null;
    const resolutionNotes = readArgValue(argv, 'notes') || '';
    const title = readArgValue(argv, 'title') || undefined;
    const rawSteps = readArgValue(argv, 'steps');
    const rawChecks = readArgValue(argv, 'checks');
    const testSteps = rawSteps ? rawSteps.split('||').map((s) => s.trim()).filter(Boolean) : undefined;
    const verificationChecks = rawChecks ? rawChecks.split('||').map((c) => c.trim()).filter(Boolean) : undefined;
    const userEmail = readArgValue(argv, 'email') || 'nareshmepani@googlemail.com';
    const userId = readArgValue(argv, 'user-id') || 'founder_chat';

    const record: BugReportRecord = {
      reportId,
      traceId,
      userId,
      userEmail,
      path: routePath,
      appVersion: readArgValue(argv, 'version') || 'v1.1.0-beta',
      userAgent: 'Chat Triage CLI',
      ...(title ? { title } : {}),
      description: desc.trim(),
      ...(testSteps && testSteps.length > 0 ? { testSteps } : {}),
      ...(verificationChecks && verificationChecks.length > 0 ? { verificationChecks } : {}),
      status,
      createdAt: now,
      createdAtIso: new Date(now).toISOString(),
      updatedAt: now,
      updatedBy: 'qa:bugs --create',
      environmentHost: 'https://dev.memoryweaver.studio',
      planeIssueId,
      resolutionNotes,
      fixedInCommitSha,
      cardId,
      source: 'CHAT_TRIAGE',
    };

    if (syncPlane && !planeIssueId) {
      const planeCfg = loadPlaneEnv();
      if (!planeCfg) {
        throw new Error('PLANE_API_KEY is missing in environment or .env.local; cannot --sync-plane.');
      }
      const formatted = formatBugReportForPlane(record);
      planeIssueId = await createPlaneIssue(planeCfg, formatted.title, formatted.description);
      record.planeIssueId = planeIssueId;
    }

    await adminDb.collection('bug_reports').doc(reportId).set(record, { merge: true });
    console.log(
      `📝 Logged chat bug report ${reportId} [${record.status}] -> route=${record.path} | Plane=${record.planeIssueId || 'UNLINKED'}`
    );
    return { total: 1, synced: planeIssueId ? 1 : 0, closed: 0, reportId };
  }

  if (shouldUpdate) {
    const reportId = readArgValue(argv, 'report-id');
    if (!reportId) {
      throw new Error('--update / --mark-fixed requires --report-id=<id>');
    }
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
      updatedBy: 'qa:bugs --update',
    };
    const rawStatus = readArgValue(argv, 'status');
    if (rawStatus) {
      if (!isValidBugReportStatus(rawStatus)) {
        throw new Error(`Invalid --status=${rawStatus}`);
      }
      updates.status = rawStatus;
    } else if (argv.includes('--mark-fixed')) {
      updates.status = 'FIXED_ON_DEV';
    }
    const sha = readArgValue(argv, 'sha');
    if (sha !== undefined) updates.fixedInCommitSha = sha || null;
    const plane = readArgValue(argv, 'plane');
    if (plane !== undefined) updates.planeIssueId = plane || null;
    const notes = readArgValue(argv, 'notes');
    if (notes !== undefined) updates.resolutionNotes = notes;
    const title = readArgValue(argv, 'title');
    if (title !== undefined) updates.title = title || null;
    const rawSteps = readArgValue(argv, 'steps');
    if (rawSteps !== undefined) {
      updates.testSteps = rawSteps.split('||').map((s) => s.trim()).filter(Boolean);
    }
    const rawChecks = readArgValue(argv, 'checks');
    if (rawChecks !== undefined) {
      updates.verificationChecks = rawChecks.split('||').map((c) => c.trim()).filter(Boolean);
    }
    const cardRaw = readArgValue(argv, 'card');
    if (cardRaw !== undefined) {
      updates.cardId = Number.isInteger(Number(cardRaw)) && Number(cardRaw) > 0 ? Number(cardRaw) : null;
    }

    await adminDb.collection('bug_reports').doc(reportId).set(updates, { merge: true });
    console.log(`✅ Updated ${reportId} in Firestore:`, JSON.stringify(updates));
  }

  const snap = await adminDb.collection('bug_reports').orderBy('createdAt', 'desc').limit(100).get();
  const reports: BugReportRecord[] = snap.docs.map((d) => ({
    ...(d.data() as BugReportRecord),
    reportId: d.id,
  }));

  console.log(`\n🐞 STAGING BUG TRIAGE QUEUE [bug_reports] (memory-weaver-dev)`);
  console.log(
    `Total Loaded: ${reports.length} | OPEN: ${reports.filter((r) => r.status === 'OPEN').length} | TRIAGED: ${reports.filter((r) => r.status === 'TRIAGED').length} | FIXED_ON_DEV: ${reports.filter((r) => r.status === 'FIXED_ON_DEV').length} | VERIFIED: ${reports.filter((r) => r.status === 'VERIFIED').length}\n`
  );

  if (reports.length === 0) {
    console.log('🟢 Zero bug reports found in staging Firestore.');
    return { total: 0, synced: 0, closed: 0 };
  }

  for (const r of reports) {
    console.log(`────────────────────────────────────────────────────────────`);
    console.log(`[${r.status}] ${r.reportId} | Plane: ${r.planeIssueId || 'UNLINKED'}${r.fixedInCommitSha ? ` | SHA: ${r.fixedInCommitSha}` : ''}`);
    console.log(`Route: ${r.path} | Reporter: ${r.userEmail} (${r.userId}) | Trace: ${r.traceId}`);
    console.log(`Description: ${r.description}`);
    if (r.resolutionNotes) console.log(`Resolution: ${r.resolutionNotes}`);
  }
  console.log(`────────────────────────────────────────────────────────────\n`);

  let synced = 0;
  let closed = 0;
  if (syncPlane) {
    const planeCfg = loadPlaneEnv();
    if (!planeCfg) {
      throw new Error('PLANE_API_KEY is missing in environment or .env.local; cannot --sync-plane.');
    }

    const unsyncedOpen = reports.filter((r) => r.status === 'OPEN' && !r.planeIssueId);
    for (const r of unsyncedOpen) {
      const { title, description } = formatBugReportForPlane(r);
      const planeKey = await createPlaneIssue(planeCfg, title, description);
      await adminDb.collection('bug_reports').doc(r.reportId).set(
        {
          planeIssueId: planeKey,
          status: 'TRIAGED',
          updatedAt: Date.now(),
          updatedBy: 'qa:bugs --sync-plane',
        },
        { merge: true }
      );
      console.log(`📌 Created Plane ticket ${planeKey} and marked ${r.reportId} -> TRIAGED`);
      synced++;
    }

    const verifiedToClose = reports.filter(
      (r) => r.status === 'VERIFIED' && Boolean(r.planeIssueId) && !r.planeClosedAt
    );
    for (const r of verifiedToClose) {
      if (!r.planeIssueId) continue;
      await updatePlaneIssueState(planeCfg, r.planeIssueId, 'done');
      await adminDb.collection('bug_reports').doc(r.reportId).set(
        {
          planeClosedAt: Date.now(),
          updatedAt: Date.now(),
          updatedBy: 'qa:bugs --sync-plane',
        },
        { merge: true }
      );
      console.log(`🏁 Marked Plane ticket ${r.planeIssueId} Done for VERIFIED report ${r.reportId}`);
      closed++;
    }

    if (unsyncedOpen.length === 0 && verifiedToClose.length === 0) {
      console.log('✅ All OPEN reports have Plane tickets and all VERIFIED reports are closed in Plane.');
    }
  }

  return { total: reports.length, synced, closed };
}

if (require.main === module) {
  readBugReports()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to inspect staging bug_reports:', err?.message || err);
      process.exit(1);
    });
}
