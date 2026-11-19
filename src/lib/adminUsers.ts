export type AdminUserSegment = 'ADMIN' | 'CUSTOMER' | 'TEST_ALIAS' | 'ANONYMOUS';

export interface AdminUserDirectoryEntry {
  uid: string;
  email: string | null;
  displayName: string;
  providers: string[];
  emailVerified: boolean;
  disabled: boolean;
  isAdminClaim: boolean;
  mfaVerifiedClaim: boolean;
  isWhitelistedAdmin: boolean;
  adminMfaSetupComplete: boolean;
  segment: AdminUserSegment;
  createdAt: string | null;
  lastSignInAt: string | null;
  firestoreUserDocExists: boolean;
  memoriesCount: number;
  chroniclesCount: number;
  subscriptionTier: string | null;
  isProtectedAdmin: boolean;
}

export interface AdminUserDirectoryCounts {
  total: number;
  admins: number;
  customers: number;
  testAliases: number;
  anonymous: number;
  disabled: number;
  totalMemories: number;
}

const SYNTHETIC_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'studio.com',
  'test.com',
  'invalid',
  'localhost',
]);

const SYNTHETIC_TLDS = ['.cum', '.invalid', '.local', '.test'];

const TEST_LOCAL_PART_RE =
  /(?:^|[._-])(?:test|tester|newtest|newtester|testpro|testuser|test\d+|qa|demo|dummy|fake|audit|staging|sandbox)(?:$|[._-]|\d+$)/i;

// Timestamped handles without '+' such as nareshmepani202601201725@hotmail.com
const LONG_TIMESTAMP_HANDLE_RE = /(?:20\d{6,}|02\d{6,})/;

export function normalizeEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase();
}

export function isLikelyTestOrAliasEmail(email: string | null | undefined): boolean {
  const norm = normalizeEmail(email);
  if (!norm || !norm.includes('@')) return false;

  const [localPart, domain] = norm.split('@');
  if (!localPart || !domain) return false;

  if (localPart.includes('+')) return true;
  if (SYNTHETIC_DOMAINS.has(domain)) return true;
  if (SYNTHETIC_TLDS.some((tld) => domain.endsWith(tld))) return true;
  if (TEST_LOCAL_PART_RE.test(localPart)) return true;
  if (LONG_TIMESTAMP_HANDLE_RE.test(localPart)) return true;

  return false;
}

export function classifyUserSegment(params: {
  email?: string | null;
  isAdminClaim?: boolean;
  isWhitelistedAdmin?: boolean;
}): AdminUserSegment {
  if (params.isAdminClaim || params.isWhitelistedAdmin) {
    return 'ADMIN';
  }
  const norm = normalizeEmail(params.email);
  if (!norm) {
    return 'ANONYMOUS';
  }
  if (isLikelyTestOrAliasEmail(norm)) {
    return 'TEST_ALIAS';
  }
  return 'CUSTOMER';
}

export interface MutateGuardInput {
  actorUid: string;
  actorEmail?: string | null;
  target: {
    uid: string;
    email?: string | null;
    isAdminClaim?: boolean;
    isWhitelistedAdmin?: boolean;
  };
}

export interface MutateGuardResult {
  allowed: boolean;
  status?: 400 | 403;
  reason?: string;
}

/**
 * Hard server-side safety guard for Disable / Delete operations in /api/admin/users.
 * Never allows self-mutation or mutating any admin account (Auth claim or admin_users whitelist).
 */
export function assertCanMutateUserAccount(input: MutateGuardInput): MutateGuardResult {
  const targetUid = (input.target.uid || '').trim();
  if (!targetUid) {
    return { allowed: false, status: 400, reason: 'Target user UID is required.' };
  }

  if (input.actorUid && input.actorUid === targetUid) {
    return {
      allowed: false,
      status: 403,
      reason: 'Self-protection lock: you cannot disable or delete your own active administrator account.',
    };
  }

  const actorEmail = normalizeEmail(input.actorEmail);
  const targetEmail = normalizeEmail(input.target.email);
  if (actorEmail && targetEmail && actorEmail === targetEmail) {
    return {
      allowed: false,
      status: 403,
      reason: 'Self-protection lock: target email matches your active administrator identity.',
    };
  }

  if (input.target.isAdminClaim) {
    return {
      allowed: false,
      status: 403,
      reason: 'Protected administrator account: users with the isAdmin custom claim cannot be disabled or deleted here.',
    };
  }

  if (input.target.isWhitelistedAdmin) {
    return {
      allowed: false,
      status: 403,
      reason: 'Protected administrator account: users listed in admin_users cannot be disabled or deleted here.',
    };
  }

  return { allowed: true };
}

export function getExpectedDeleteConfirmationToken(target: {
  uid: string;
  email?: string | null;
}): string {
  const normEmail = normalizeEmail(target.email);
  if (normEmail) {
    return normEmail;
  }
  return `DELETE ${target.uid.trim()}`;
}

export function matchesDeleteConfirmation(
  target: { uid: string; email?: string | null },
  confirmationInput: string | null | undefined
): boolean {
  const provided = (confirmationInput || '').trim();
  if (!provided) return false;

  const normEmail = normalizeEmail(target.email);
  if (normEmail) {
    return provided.toLowerCase() === normEmail;
  }
  return provided === `DELETE ${target.uid.trim()}`;
}

export function computeAdminUserCounts(users: AdminUserDirectoryEntry[]): AdminUserDirectoryCounts {
  return users.reduce<AdminUserDirectoryCounts>(
    (acc, user) => {
      acc.total += 1;
      if (user.segment === 'ADMIN') acc.admins += 1;
      else if (user.segment === 'CUSTOMER') acc.customers += 1;
      else if (user.segment === 'TEST_ALIAS') acc.testAliases += 1;
      else if (user.segment === 'ANONYMOUS') acc.anonymous += 1;

      if (user.disabled) acc.disabled += 1;
      acc.totalMemories += Number(user.memoriesCount || 0);
      return acc;
    },
    {
      total: 0,
      admins: 0,
      customers: 0,
      testAliases: 0,
      anonymous: 0,
      disabled: 0,
      totalMemories: 0,
    }
  );
}

export function filterAdminUsers(
  users: AdminUserDirectoryEntry[],
  options: {
    segment?: AdminUserSegment | 'ALL' | 'DISABLED';
    query?: string;
  }
): AdminUserDirectoryEntry[] {
  const seg = options.segment || 'ALL';
  const q = (options.query || '').trim().toLowerCase();

  return users.filter((u) => {
    if (seg === 'DISABLED') {
      if (!u.disabled) return false;
    } else if (seg !== 'ALL') {
      if (u.segment !== seg) return false;
    }

    if (!q) return true;

    return (
      u.uid.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.providers.some((p) => p.toLowerCase().includes(q)) ||
      (u.subscriptionTier || '').toLowerCase().includes(q)
    );
  });
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatAdminUsersCsv(users: AdminUserDirectoryEntry[]): string {
  const header = [
    'UID',
    'Email',
    'Display Name',
    'Segment',
    'Providers',
    'Email Verified',
    'Disabled',
    'Admin Claim',
    'Whitelisted Admin',
    'Firestore Doc',
    'Memories',
    'Chronicles',
    'Tier',
    'Created At',
    'Last Sign-In',
  ];

  const rows = users.map((u) =>
    [
      u.uid,
      u.email || '',
      u.displayName,
      u.segment,
      u.providers.join('; '),
      u.emailVerified,
      u.disabled,
      u.isAdminClaim,
      u.isWhitelistedAdmin,
      u.firestoreUserDocExists,
      u.memoriesCount,
      u.chroniclesCount,
      u.subscriptionTier || '',
      u.createdAt || '',
      u.lastSignInAt || '',
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return [header.join(','), ...rows].join('\n');
}
