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
  description: string;
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
