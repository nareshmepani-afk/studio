import { NextRequest, NextResponse } from 'next/server';
import type { UserRecord } from 'firebase-admin/auth';
import { adminApp, adminAuth, adminDb } from '@/lib/firebase-admin';
import { requireAdminSession } from '@/lib/session';
import { isProductionProject, resolveProjectId } from '@/config/environment';
import {
  assertCanMutateUserAccount,
  classifyUserSegment,
  computeAdminUserCounts,
  matchesDeleteConfirmation,
  normalizeEmail,
  type AdminUserDirectoryEntry,
} from '@/lib/adminUsers';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const MAX_AUTH_USERS = 5000;
const COUNT_CONCURRENCY = 20;
const VALID_UID_RE = /^[A-Za-z0-9:_-]{4,128}$/;

interface AdminWhitelistInfo {
  isActive: boolean;
  mfaSetupComplete: boolean;
}

async function loadAdminWhitelistMap(): Promise<Map<string, AdminWhitelistInfo>> {
  const map = new Map<string, AdminWhitelistInfo>();
  if (!adminDb) return map;

  const snap = await adminDb.collection('admin_users').get();
  for (const docSnap of snap.docs) {
    const data = docSnap.data() || {};
    map.set(normalizeEmail(docSnap.id), {
      isActive: data.isActive === true,
      mfaSetupComplete: data.mfaSetupComplete === true,
    });
  }
  return map;
}

async function listAllAuthUsers(): Promise<UserRecord[]> {
  if (!adminAuth) return [];
  const all: UserRecord[] = [];
  let nextPageToken: string | undefined;

  do {
    const result = await adminAuth.listUsers(1000, nextPageToken);
    all.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken && all.length < MAX_AUTH_USERS);

  return all;
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx]);
    }
  });
  await Promise.all(runners);
}

export async function GET(_req: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin services are offline.' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const [authUsers, whitelistMap, userDocRefs, userDocsSnap] = await Promise.all([
      listAllAuthUsers(),
      loadAdminWhitelistMap(),
      adminDb.collection('users').listDocuments(),
      adminDb.collection('users').select('displayName', 'name', 'tier', 'subscriptionTier', 'plan').get(),
    ]);

    const firestoreDocSet = new Set<string>(userDocsSnap.docs.map((d) => d.id));
    const firestoreProfileMap = new Map<string, { displayName?: string; tier?: string | null }>();
    for (const d of userDocsSnap.docs) {
      const data = d.data() || {};
      firestoreProfileMap.set(d.id, {
        displayName: typeof data.displayName === 'string' ? data.displayName : typeof data.name === 'string' ? data.name : undefined,
        tier:
          typeof data.subscriptionTier === 'string'
            ? data.subscriptionTier
            : typeof data.tier === 'string'
              ? data.tier
              : typeof data.plan === 'string'
                ? data.plan
                : null,
      });
    }

    // Only run aggregation counts for UIDs that exist in Firestore (including virtual parents)
    const activeFirestoreUids = new Set<string>(userDocRefs.map((ref) => ref.id));
    const uidsToCount = authUsers.map((u) => u.uid).filter((uid) => activeFirestoreUids.has(uid));

    const memoriesCountMap = new Map<string, number>();
    const chroniclesCountMap = new Map<string, number>();

    await runWithConcurrency(uidsToCount, COUNT_CONCURRENCY, async (uid) => {
      try {
        const userRef = adminDb!.collection('users').doc(uid);
        const [memCount, chronCount] = await Promise.all([
          userRef.collection('memories').count().get(),
          userRef.collection('chronicles').count().get(),
        ]);
        memoriesCountMap.set(uid, memCount.data().count || 0);
        chroniclesCountMap.set(uid, chronCount.data().count || 0);
      } catch (err) {
        console.warn(`[GET /api/admin/users] Count lookup skipped for ${uid}:`, err);
      }
    });

    const entries: AdminUserDirectoryEntry[] = authUsers.map((u) => {
      const normEmail = normalizeEmail(u.email);
      const whitelistEntry = normEmail ? whitelistMap.get(normEmail) : undefined;
      const isAdminClaim = u.customClaims?.isAdmin === true;
      const mfaVerifiedClaim = u.customClaims?.mfaVerified === true;
      const isWhitelistedAdmin = Boolean(whitelistEntry?.isActive);
      const adminMfaSetupComplete = Boolean(whitelistEntry?.mfaSetupComplete);
      const profile = firestoreProfileMap.get(u.uid);

      const segment = classifyUserSegment({
        email: u.email,
        isAdminClaim,
        isWhitelistedAdmin,
      });

      return {
        uid: u.uid,
        email: u.email || null,
        displayName: (u.displayName || profile?.displayName || '').trim(),
        providers: u.providerData.map((p) => p.providerId),
        emailVerified: Boolean(u.emailVerified),
        disabled: Boolean(u.disabled),
        isAdminClaim,
        mfaVerifiedClaim,
        isWhitelistedAdmin,
        adminMfaSetupComplete,
        segment,
        createdAt: u.metadata.creationTime || null,
        lastSignInAt: u.metadata.lastSignInTime || null,
        firestoreUserDocExists: firestoreDocSet.has(u.uid),
        memoriesCount: memoriesCountMap.get(u.uid) || 0,
        chroniclesCount: chroniclesCountMap.get(u.uid) || 0,
        subscriptionTier: profile?.tier || null,
        isProtectedAdmin: isAdminClaim || isWhitelistedAdmin,
      };
    });

    // Sort: Admins first, then Customers, then Test/Aliases, then Anonymous; newest sign-in first within segment
    const segmentRank: Record<AdminUserDirectoryEntry['segment'], number> = {
      ADMIN: 0,
      CUSTOMER: 1,
      TEST_ALIAS: 2,
      ANONYMOUS: 3,
    };

    entries.sort((a, b) => {
      if (segmentRank[a.segment] !== segmentRank[b.segment]) {
        return segmentRank[a.segment] - segmentRank[b.segment];
      }
      const timeA = Date.parse(a.lastSignInAt || a.createdAt || '') || 0;
      const timeB = Date.parse(b.lastSignInAt || b.createdAt || '') || 0;
      return timeB - timeA;
    });

    const projectId = resolveProjectId(adminApp?.options?.projectId) || 'unknown';
    const counts = computeAdminUserCounts(entries);

    return NextResponse.json(
      {
        success: true,
        projectId,
        environment: isProductionProject(projectId) ? 'PRODUCTION' : 'STAGING',
        actorUid: authResult.session?.uid || '',
        actorEmail: authResult.session?.email || '',
        counts,
        users: entries,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[GET /api/admin/users] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load user directory.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin services are offline.' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json().catch(() => null);
    const uid = typeof body?.uid === 'string' ? body.uid.trim() : '';
    const action = typeof body?.action === 'string' ? body.action.trim().toUpperCase() : '';

    if (!uid || !VALID_UID_RE.test(uid)) {
      return NextResponse.json(
        { success: false, error: 'Valid target UID is required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (action !== 'DISABLE' && action !== 'ENABLE') {
      return NextResponse.json(
        { success: false, error: 'Action must be DISABLE or ENABLE.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const targetRecord = await adminAuth.getUser(uid);
    const whitelistMap = await loadAdminWhitelistMap();
    const normEmail = normalizeEmail(targetRecord.email);
    const isWhitelistedAdmin = Boolean(normEmail && whitelistMap.get(normEmail)?.isActive);

    const guard = assertCanMutateUserAccount({
      actorUid: authResult.session?.uid || '',
      actorEmail: authResult.session?.email || null,
      target: {
        uid: targetRecord.uid,
        email: targetRecord.email,
        isAdminClaim: targetRecord.customClaims?.isAdmin === true,
        isWhitelistedAdmin,
      },
    });

    if (!guard.allowed) {
      return NextResponse.json(
        { success: false, error: guard.reason },
        { status: guard.status || 403, headers: NO_STORE_HEADERS }
      );
    }

    const shouldDisable = action === 'DISABLE';
    await adminAuth.updateUser(uid, { disabled: shouldDisable });
    if (shouldDisable) {
      await adminAuth.revokeRefreshTokens(uid);
    }

    return NextResponse.json(
      {
        success: true,
        uid,
        disabled: shouldDisable,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[PATCH /api/admin/users] Error:', err);
    const status = err?.code === 'auth/user-not-found' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update user account.' },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin services are offline.' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json().catch(() => null);
    const uid = typeof body?.uid === 'string' ? body.uid.trim() : '';
    const confirmation = typeof body?.confirmation === 'string' ? body.confirmation : '';
    const deleteFirestoreData = body?.deleteFirestoreData !== false;

    if (!uid || !VALID_UID_RE.test(uid)) {
      return NextResponse.json(
        { success: false, error: 'Valid target UID is required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const targetRecord = await adminAuth.getUser(uid);
    const whitelistMap = await loadAdminWhitelistMap();
    const normEmail = normalizeEmail(targetRecord.email);
    const isWhitelistedAdmin = Boolean(normEmail && whitelistMap.get(normEmail)?.isActive);

    const guard = assertCanMutateUserAccount({
      actorUid: authResult.session?.uid || '',
      actorEmail: authResult.session?.email || null,
      target: {
        uid: targetRecord.uid,
        email: targetRecord.email,
        isAdminClaim: targetRecord.customClaims?.isAdmin === true,
        isWhitelistedAdmin,
      },
    });

    if (!guard.allowed) {
      return NextResponse.json(
        { success: false, error: guard.reason },
        { status: guard.status || 403, headers: NO_STORE_HEADERS }
      );
    }

    if (!matchesDeleteConfirmation({ uid: targetRecord.uid, email: targetRecord.email }, confirmation)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation mismatch: please type the exact target email (or DELETE <UID> for anonymous accounts).',
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    await adminAuth.deleteUser(uid);

    let deletedFirestore = false;
    if (deleteFirestoreData) {
      await adminDb.recursiveDelete(adminDb.collection('users').doc(uid));
      deletedFirestore = true;
    }

    return NextResponse.json(
      {
        success: true,
        uid,
        email: targetRecord.email || null,
        deletedAuth: true,
        deletedFirestore,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[DELETE /api/admin/users] Error:', err);
    const status = err?.code === 'auth/user-not-found' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete user account.' },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}
