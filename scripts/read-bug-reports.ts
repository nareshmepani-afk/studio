import https from 'https';
import fs from 'fs';
import path from 'path';
import { getStagingAdmin } from './lib/stagingAdmin';
import type { BugReportRecord } from '../src/lib/bugReports';

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
    `**Origin:** ${report.environmentHost || 'https://dev.memoryweaver.studio'}`,
    `**Logged At:** ${report.createdAtIso || 'N/A'}`,
    '',
    '### Description',
    report.description || '',
  ].join('\n');
  return { title, description };
}

function loadPlaneEnv(): { apiKey: string; workspaceSlug: string; projectId: string } | null {
  const readKey = (k: string): string => {
    if (process.env[k]) return process.env[k]!;
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return '';
    const match = fs.readFileSync(envPath, 'utf8').match(new RegExp(`^${k}\\s*=\\s*(.+)$`, 'm'));
    return match ? match[1].trim() : '';
  };

  const apiKey = readKey('PLANE_API_KEY');
  const workspaceSlug = readKey('PLANE_WORKSPACE_SLUG') || 'memory-weaver';
  const projectId = readKey('PLANE_PROJECT_ID') || 'ef45f4c8-ea7e-490d-8282-e959e484ae07';
  if (!apiKey) return null;
  return { apiKey, workspaceSlug, projectId };
}

async function createPlaneIssue(
  cfg: { apiKey: string; workspaceSlug: string; projectId: string },
  title: string,
  descriptionText: string
): Promise<string> {
  const payload = JSON.stringify({
    name: title,
    description_html: `<p>${descriptionText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</p>`,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.plane.so',
        path: `/api/v1/workspaces/${cfg.workspaceSlug}/projects/${cfg.projectId}/issues/`,
        method: 'POST',
        headers: {
          'x-api-key': cfg.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && parsed.sequence_id) {
              resolve(`MW-${parsed.sequence_id}`);
            } else {
              reject(new Error(`Plane API ${res.statusCode}: ${body.slice(0, 200)}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

export async function readBugReports(argv: string[] = process.argv.slice(2)) {
  const syncPlane = argv.includes('--sync-plane');
  const { adminDb } = getStagingAdmin();

  const snap = await adminDb.collection('bug_reports').orderBy('createdAt', 'desc').limit(100).get();
  const reports: BugReportRecord[] = snap.docs.map((d) => ({
    ...(d.data() as BugReportRecord),
    reportId: d.id,
  }));

  console.log(`\n🐞 STAGING BUG TRIAGE QUEUE [bug_reports] (memory-weaver-dev)`);
  console.log(`Total Loaded: ${reports.length} | OPEN: ${reports.filter((r) => r.status === 'OPEN').length} | TRIAGED: ${reports.filter((r) => r.status === 'TRIAGED').length} | FIXED_ON_DEV: ${reports.filter((r) => r.status === 'FIXED_ON_DEV').length} | VERIFIED: ${reports.filter((r) => r.status === 'VERIFIED').length}\n`);

  if (reports.length === 0) {
    console.log('🟢 Zero bug reports found in staging Firestore.');
    return { total: 0, synced: 0 };
  }

  for (const r of reports) {
    console.log(`────────────────────────────────────────────────────────────`);
    console.log(`[${r.status}] ${r.reportId} | Plane: ${r.planeIssueId || 'UNLINKED'}`);
    console.log(`Route: ${r.path} | Reporter: ${r.userEmail} (${r.userId}) | Trace: ${r.traceId}`);
    console.log(`Description: ${r.description}`);
    if (r.resolutionNotes) console.log(`Resolution: ${r.resolutionNotes}`);
  }
  console.log(`────────────────────────────────────────────────────────────\n`);

  let synced = 0;
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
    if (unsyncedOpen.length === 0) {
      console.log('✅ All OPEN bug reports already have Plane ticket links.');
    }
  }

  return { total: reports.length, synced };
}

if (require.main === module) {
  readBugReports()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to inspect staging bug_reports:', err?.message || err);
      process.exit(1);
    });
}
