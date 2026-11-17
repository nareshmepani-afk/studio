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
}

export function isValidBugReportStatus(value: unknown): value is BugReportStatus {
  return typeof value === 'string' && (BUG_REPORT_STATUSES as readonly string[]).includes(value);
}

export function generateBugReportId(now = Date.now()): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `bug_${now}_${rand}`;
}
