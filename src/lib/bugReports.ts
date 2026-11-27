import { resolvePublicAppUrl } from '@/config/environment';

export const BUG_REPORT_STATUSES = ['OPEN', 'TRIAGED', 'FIXED_ON_DEV', 'VERIFIED'] as const;

export type BugReportStatus = (typeof BUG_REPORT_STATUSES)[number];

export interface BugReportRecord {
  reportId: string;
  traceId: string;
  userId: string;
  userEmail: string;
  path: string;
  appVersion: string;
  userAgent: string;
  title?: string | null;
  description: string;
  testSteps?: string[];
  verificationChecks?: string[];
  checkedIndices?: number[];
  founderFeedback?: string | null;
  consoleLog?: string | null;
  telemetryTrace?: string | null;
  status: BugReportStatus;
  createdAt: number;
  createdAtIso: string;
  updatedAt: number;
  updatedBy?: string;
  environmentHost: string;
  planeIssueId: string | null;
  resolutionNotes: string;
  fixedInCommitSha?: string | null;
  cardId?: number | null;
  source?: 'IN_APP_MODAL' | 'CHAT_TRIAGE' | string;
  planeClosedAt?: number | null;
}

export interface DerivedBugCardPresentation {
  title: string;
  routeSlug: string;
  routePathname: string;
  exactRoute: string;
  fullTestUrl: string;
  testSteps: string[];
  verificationChecks: string[];
}

export function isValidBugReportStatus(value: unknown): value is BugReportStatus {
  return typeof value === 'string' && (BUG_REPORT_STATUSES as readonly string[]).includes(value);
}

export function generateBugReportId(now = Date.now()): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `bug_${now}_${rand}`;
}

export function sanitizeBugDeepLinkRoute(rawPath?: string | null): string {
  const trimmed = (rawPath || '/').trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/';
  }
  return trimmed;
}

export function formatPlaneBrowseUrl(
  planeIssueId?: string | null,
  workspaceSlug: string = 'memory-weaver-studio'
): string | null {
  const clean = (planeIssueId || '').trim().toUpperCase();
  if (!/^MW-\d+$/.test(clean)) return null;
  return `https://app.plane.so/${workspaceSlug}/browse/${clean}/`;
}

export function doesCommitShaMatchLive(
  fixedSha?: string | null,
  liveSha?: string | null
): boolean {
  const a = (fixedSha || '').trim().toLowerCase();
  const b = (liveSha || '').trim().toLowerCase();
  if (!a || !b) return false;
  const minLen = Math.min(a.length, b.length, 7);
  if (minLen < 6) return false;
  return a.startsWith(b.slice(0, minLen)) || b.startsWith(a.slice(0, minLen));
}

export function deriveBugCardPresentation(
  report: Partial<BugReportRecord>
): DerivedBugCardPresentation {
  const exactRoute = sanitizeBugDeepLinkRoute(report.path);
  const host = (report.environmentHost || resolvePublicAppUrl()).replace(/\/+$/, '');
  const fullTestUrl = `${host}${exactRoute}`;

  const qIdx = exactRoute.indexOf('?');
  const routePathname = qIdx === -1 ? exactRoute : exactRoute.slice(0, qIdx) || '/';
  const routeSlug =
    routePathname === '/'
      ? 'home'
      : routePathname.replace(/^\/+/, '').replace(/\/+/g, '_');

  const rawTitle = (report.title || '').trim();
  let derivedTitle = rawTitle;
  if (!derivedTitle) {
    const cleanedDesc = (report.description || '')
      .replace(/^\[ENV:\s*[^\]]+\]\s*/i, '')
      .replace(/^MW-\d+\s*:\s*/i, '')
      .trim();
    const colonIdx = cleanedDesc.indexOf(':');
    if (colonIdx > 4 && colonIdx <= 72) {
      derivedTitle = cleanedDesc.slice(0, colonIdx).trim();
    } else if (cleanedDesc.length > 0) {
      derivedTitle =
        cleanedDesc.length > 84 ? `${cleanedDesc.slice(0, 81).trim()}...` : cleanedDesc;
    } else {
      derivedTitle = report.planeIssueId || report.reportId || 'Staging Verification Item';
    }
  }

  const explicitSteps = Array.isArray(report.testSteps)
    ? report.testSteps.map((s) => String(s || '').trim()).filter(Boolean)
    : [];
  const testSteps =
    explicitSteps.length > 0
      ? explicitSteps
      : [
          `Open ${fullTestUrl} via the "Open Test Route" button on the top-right of this card.`,
          (report.description || '').replace(/^\[ENV:\s*[^\]]+\]\s*/i, '').trim() ||
            'Walk through the target user flow on Staging.',
          report.resolutionNotes
            ? `Verify fix behaviour: ${report.resolutionNotes}`
            : 'Confirm expected UI and functional behaviour, then select PASS, FAIL, or BACKLOG below.',
        ];

  const explicitChecks = Array.isArray(report.verificationChecks)
    ? report.verificationChecks.map((c) => String(c || '').trim()).filter(Boolean)
    : [];
  const verificationChecks =
    explicitChecks.length > 0
      ? explicitChecks
      : [
          (report.description || '').replace(/^\[ENV:\s*[^\]]+\]\s*/i, '').trim() ||
            'Target defect or polish requirement is resolved on Staging.',
          ...(report.resolutionNotes ? [report.resolutionNotes] : []),
        ];

  return {
    title: derivedTitle,
    routeSlug,
    routePathname,
    exactRoute,
    fullTestUrl,
    testSteps,
    verificationChecks,
  };
}
