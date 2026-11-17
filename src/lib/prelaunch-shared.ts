export const PRELAUNCH_CONFIG_COLLECTION = 'prelaunch_config';
export const PRELAUNCH_CONFIG_DOC_ID = 'settings';
export const PRELAUNCH_LIST_COLLECTION = 'prelaunch_list';

export type PrelaunchMode = 'RESTRICTED' | 'PUBLIC';
export type PrelaunchStatus = 'WAITLIST' | 'TESTER';
export type PrelaunchSource = 'SELF_SIGNUP' | 'ADMIN_ADD' | 'SHEET_IMPORT' | 'GIFT_VOUCHER';

export interface PrelaunchEntry {
  emailKey: string;
  email: string;
  name: string;
  isTester: boolean;
  status: PrelaunchStatus;
  source: PrelaunchSource;
  createdAt: number;
  updatedAt: number;
  createdAtIso?: string;
  updatedBy?: string;
}

export interface PrelaunchAccessCheckResult {
  allowed: boolean;
  mode: PrelaunchMode;
  reason?: 'PUBLIC_MODE' | 'ADMIN' | 'TESTER' | 'GIFT_VOUCHER';
  code?: 'PRELAUNCH_RESTRICTED';
  addedToList?: boolean;
  alreadyListed?: boolean;
  message?: string;
}

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

export function normalizePrelaunchEmail(raw: string): string {
  return String(raw || '').trim().toLowerCase();
}

export function isValidEmailAddress(raw: string): boolean {
  const norm = normalizePrelaunchEmail(raw);
  return norm.length >= 5 && norm.length <= 254 && EMAIL_RE.test(norm);
}

export function emailToPrelaunchDocId(email: string): string {
  return encodeURIComponent(normalizePrelaunchEmail(email));
}

export function extractUnboxingVoucherCode(redirectPath?: string | null): string | null {
  if (!redirectPath || typeof redirectPath !== 'string') return null;
  let decoded = redirectPath;
  try {
    decoded = decodeURIComponent(redirectPath);
  } catch {
    decoded = redirectPath;
  }
  const match = decoded.match(/\/unboxing\/([A-Za-z0-9-]{4,64})/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Parses emails pasted directly from Google Sheets (TSV), CSV, semicolon-separated lists,
 * or "Name <email@domain.com>" entries into deduplicated valid entries.
 */
export function parseBulkEmailsInput(rawText: string): {
  validEntries: { email: string; name: string }[];
  invalidTokens: string[];
  duplicateCount: number;
} {
  const seen = new Set<string>();
  const validEntries: { email: string; name: string }[] = [];
  const invalidTokens: string[] = [];
  let duplicateCount = 0;

  const lines = String(rawText || '').split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Support Google Sheets TSV rows ("First Name\tEmail" or "Email\tName") when tabs exist, else comma/semicolon-delimited
    const tabCols = trimmedLine.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const hasEmailInTab =
      tabCols.length > 1 &&
      tabCols.some((c) => isValidEmailAddress(c) || /<[^>]+@[^>]+>/.test(c));

    const tokens = hasEmailInTab
      ? tabCols
      : trimmedLine.split(/[,;]+/).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    let rowName = '';
    const rowEmails: string[] = [];

    for (const token of tokens) {
      if (!token) continue;
      const angleMatch = token.match(/^(.*?)<([^<>]+)>$/);
      if (angleMatch) {
        const candidateName = angleMatch[1].trim().replace(/^["']|["']$/g, '');
        const candidateEmail = normalizePrelaunchEmail(angleMatch[2]);
        if (candidateName && !rowName) rowName = candidateName;
        if (isValidEmailAddress(candidateEmail)) {
          rowEmails.push(candidateEmail);
        } else {
          invalidTokens.push(token);
        }
        continue;
      }

      const norm = normalizePrelaunchEmail(token);
      if (isValidEmailAddress(norm)) {
        rowEmails.push(norm);
      } else if (token.includes('@')) {
        invalidTokens.push(token);
      } else if (!/^email$/i.test(token) && !/^name$/i.test(token) && !rowName && tokens.length > 1) {
        rowName = token;
      }
    }

    for (const email of rowEmails) {
      if (seen.has(email)) {
        duplicateCount++;
        continue;
      }
      seen.add(email);
      validEntries.push({ email, name: rowName });
    }
  }

  return { validEntries, invalidTokens, duplicateCount };
}
