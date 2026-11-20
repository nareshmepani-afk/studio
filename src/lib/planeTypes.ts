/**
 * Pure, client-safe Plane.so types, key validators, and HTML-escaping helpers.
 * Zero Node built-in imports so both Client Components and Server Routes can import safely.
 */

export const PLANE_ISSUE_KEY_RE = /^(?:MW-)?(\d{1,6})$/i;

export interface PlaneStateOption {
  id: string;
  name: string;
  group: string;
  color?: string | null;
}

export interface PlaneCommentItem {
  id: string;
  bodyText: string;
  createdAt: string | null;
  updatedAt: string | null;
  actor: string | null;
}

export interface PlaneIssueDetail {
  id: string;
  key: string;
  sequenceId: number;
  projectId: string;
  name: string;
  descriptionText: string;
  priority: string;
  stateId: string;
  stateName: string;
  stateGroup: string;
  stateColor?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PlaneSyncResult {
  attempted: boolean;
  ok: boolean;
  configured?: boolean;
  action?: 'CREATED' | 'COMMENTED' | 'CLOSED' | 'SKIPPED';
  issueKey?: string | null;
  reason?: string;
}

export interface PlaneIssueApiResponse {
  success: boolean;
  configured: boolean;
  key?: string;
  reason?: string;
  error?: string;
  issue?: PlaneIssueDetail;
  comments?: PlaneCommentItem[];
  states?: PlaneStateOption[];
}

/**
 * Validates and normalises a Plane issue identifier (e.g. "mw-408", "408", "MW-408")
 * strictly to canonical "MW-408" format, or returns null for invalid/unsafe inputs.
 */
export function normalisePlaneIssueKey(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const match = trimmed.match(PLANE_ISSUE_KEY_RE);
  if (!match) return null;
  const seq = Number.parseInt(match[1], 10);
  if (!Number.isFinite(seq) || seq <= 0) return null;
  return `MW-${seq}`;
}

/**
 * Escapes HTML special characters before wrapping text for Plane's description_html / comment_html fields.
 */
export function escapeHtmlForPlane(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function textToPlaneHtml(raw: string): string {
  const escaped = escapeHtmlForPlane(raw.trim());
  return `<p>${escaped.replace(/\r?\n/g, '<br/>')}</p>`;
}

/**
 * Fallback plain-text converter when Plane omits description_stripped / comment_stripped.
 * Never rendered via dangerouslySetInnerHTML; output is treated strictly as plain text.
 */
export function stripHtmlToSafeText(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
