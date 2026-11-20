import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import {
  emailToPrelaunchDocId,
  extractUnboxingVoucherCode,
  isValidEmailAddress,
  normalizePrelaunchEmail,
  parseBulkEmailsInput,
} from '@/lib/prelaunch-shared';
import { ReportIssueTrigger } from '@/components/feedback/ReportIssueTrigger';

function createMemoryFirestore(seed: Record<string, Record<string, Record<string, any>>> = {}) {
  const collections = new Map<string, Map<string, Record<string, any>>>();

  for (const [colName, docs] of Object.entries(seed)) {
    const colMap = new Map<string, Record<string, any>>();
    for (const [docId, data] of Object.entries(docs)) {
      colMap.set(docId, { ...data });
    }
    collections.set(colName, colMap);
  }

  const getColMap = (name: string) => {
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name)!;
  };

  const makeDocRef = (colName: string, docId: string) => ({
    id: docId,
    async get() {
      const data = getColMap(colName).get(docId);
      return {
        exists: Boolean(data),
        id: docId,
        data: () => (data ? { ...data } : undefined),
      };
    },
    async set(data: Record<string, any>, options?: { merge?: boolean }) {
      const col = getColMap(colName);
      const existing = options?.merge ? col.get(docId) || {} : {};
      col.set(docId, { ...existing, ...data });
    },
    async delete() {
      getColMap(colName).delete(docId);
    },
  });

  const makeCollectionApi = (colName: string) => ({
    doc: (docId: string) => makeDocRef(colName, docId),
    orderBy: (field: string, dir: 'asc' | 'desc' = 'desc') => ({
      limit: (max: number) => ({
        async get() {
          const docs = Array.from(getColMap(colName).entries())
            .map(([id, data]) => ({ id, data: () => ({ ...data }) }))
            .sort((a, b) => {
              const av = Number(a.data()[field] || 0);
              const bv = Number(b.data()[field] || 0);
              return dir === 'desc' ? bv - av : av - bv;
            })
            .slice(0, max);
          return { docs };
        },
      }),
    }),
  });

  return {
    collection: makeCollectionApi,
    _raw: collections,
  };
}

describe('Pre-Launch Shared Parsers & Security Isolation', () => {
  it('normalises emails, encodes doc keys safely, and extracts unboxing voucher codes', () => {
    expect(normalizePrelaunchEmail('  Tester@Example.COM  ')).toBe('tester@example.com');
    expect(isValidEmailAddress('founder@memoryweaver.studio')).toBe(true);
    expect(isValidEmailAddress('not-an-email')).toBe(false);
    expect(emailToPrelaunchDocId('A+B@Example.com')).toBe('a%2Bb%40example.com');

    expect(extractUnboxingVoucherCode('/login?redirect=%2Funboxing%2FMW-VAULT-7788')).toBe('MW-VAULT-7788');
    expect(extractUnboxingVoucherCode('/unboxing/mw-dir-9900')).toBe('MW-DIR-9900');
    expect(extractUnboxingVoucherCode('/studio/fireside')).toBeNull();
  });

  it('parses Google Sheets TSV, CSV, angle-bracket entries, and deduplicates rows cleanly', () => {
    const raw = [
      'Name\tEmail',
      'Asha Patel\tasha@example.com',
      '"Ravi Mehta", ravi@example.com',
      'Priya Nair <priya@example.com>; ASHA@example.com',
      'invalid-token@',
    ].join('\n');

    const parsed = parseBulkEmailsInput(raw);
    expect(parsed.validEntries).toEqual([
      { email: 'asha@example.com', name: 'Asha Patel' },
      { email: 'ravi@example.com', name: 'Ravi Mehta' },
      { email: 'priya@example.com', name: 'Priya Nair' },
    ]);
    expect(parsed.duplicateCount).toBe(1);
    expect(parsed.invalidTokens).toEqual(['invalid-token@']);
  });

  it('keeps client auth hooks & UI free of firebase-admin imports and leaves SoloStage.tsx untouched (Rule 22.2)', () => {
    const root = process.cwd();
    const clientFiles = [
      'src/hooks/useAuth.tsx',
      'src/components/auth/LoginForm.tsx',
      'src/app/register/RegisterContent.tsx',
      'src/components/admin/PrelaunchAccessConsole.tsx',
    ];
    for (const relPath of clientFiles) {
      const content = fs.readFileSync(path.join(root, relPath), 'utf8');
      expect(content).not.toMatch(/from ['"]@\/lib\/prelaunch['"]/);
    }

    const soloStageSrc = fs.readFileSync(
      path.join(root, 'src/components/studio/SoloStage.tsx'),
      'utf8'
    );
    expect(soloStageSrc).not.toContain('ReportIssueTrigger');
  });
});

describe('ReportIssueTrigger Component', () => {
  it('renders tactical trigger and dispatches global open-telemetry-report event on click', () => {
    const spy = vi.fn();
    window.addEventListener('open-telemetry-report', spy);

    const onTriggered = vi.fn();
    const { getByTestId } = render(
      React.createElement(ReportIssueTrigger, {
        variant: 'icon-pill',
        label: 'Report Issue',
        onTriggered,
      })
    );

    const btn = getByTestId('HS_REPORT_ISSUE_BTN');
    fireEvent.click(btn);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(onTriggered).toHaveBeenCalledTimes(1);
    window.removeEventListener('open-telemetry-report', spy);
  });
});

describe('Unified Pre-Launch Access Engine, Auth Gate & Admin CRUD', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to RESTRICTED on production and PUBLIC on staging when config document does not exist', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'memory-weaver-8rk9t');
    vi.stubEnv('GCLOUD_PROJECT', 'memory-weaver-8rk9t');
    const prodMemDb = createMemoryFirestore();
    const prodMod = await import('@/lib/prelaunch');
    const prodMode = await prodMod.getPrelaunchMode(prodMemDb as any);
    expect(prodMode.mode).toBe('RESTRICTED');
    expect(prodMode.defaultMode).toBe('RESTRICTED');
    expect(prodMode.isExplicit).toBe(false);

    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'memory-weaver-dev');
    vi.stubEnv('GCLOUD_PROJECT', 'memory-weaver-dev');
    const stageMemDb = createMemoryFirestore();
    const stageMod = await import('@/lib/prelaunch');
    const stageMode = await stageMod.getPrelaunchMode(stageMemDb as any);
    expect(stageMode.mode).toBe('PUBLIC');
    expect(stageMode.defaultMode).toBe('PUBLIC');
  });

  it('captures uninvited visitors in prelaunch_list as WAITLIST without creating auth users, allows active TESTER, ADMIN & unredeemed VOUCHER', async () => {
    const memDb = createMemoryFirestore({
      prelaunch_config: {
        settings: { mode: 'RESTRICTED' },
      },
      prelaunch_list: {
        [emailToPrelaunchDocId('tester@example.com')]: {
          emailKey: emailToPrelaunchDocId('tester@example.com'),
          email: 'tester@example.com',
          name: 'Active Tester',
          isTester: true,
          status: 'TESTER',
          source: 'ADMIN_ADD',
          createdAt: 1000,
          updatedAt: 1000,
        },
      },
      gift_vouchers: {
        'MW-GIFT-2026': { status: 'unredeemed', tier: 'director' },
        'MW-GIFT-USED': { status: 'redeemed', tier: 'director' },
      },
    });

    vi.doMock('@/lib/firebase-admin', () => ({
      adminDb: memDb,
      adminAuth: null,
    }));
    vi.doMock('@/lib/fraud-defense', () => ({
      verifyRecaptchaToken: vi.fn().mockResolvedValue({ isSafe: true, score: 0.95 }),
    }));
    vi.doMock('@/utils/telemetry/dbLogger', () => ({
      logToDb: vi.fn().mockResolvedValue(undefined),
    }));

    const { validateAuthAttempt, joinPrelaunchListAction } = await import('@/actions/authActions');

    // 1. Uninvited visitor submitting REGISTER -> denied & saved as WAITLIST
    const blockedRegister = await validateAuthAttempt('tok', 'REGISTER', 'NewUser@Example.com', {
      name: 'New Visitor',
    });
    expect(blockedRegister.success).toBe(false);
    expect(blockedRegister.code).toBe('PRELAUNCH_RESTRICTED');
    expect(blockedRegister.addedToList).toBe(true);

    const savedWaitlist = memDb._raw
      .get('prelaunch_list')
      ?.get(emailToPrelaunchDocId('newuser@example.com'));
    expect(savedWaitlist).toBeDefined();
    expect(savedWaitlist?.isTester).toBe(false);
    expect(savedWaitlist?.status).toBe('WAITLIST');
    expect(savedWaitlist?.source).toBe('SELF_SIGNUP');
    expect(savedWaitlist?.name).toBe('New Visitor');

    // 2. Duplicate waitlist submit preserves createdAt and sets alreadyListed: true
    const repeatRegister = await validateAuthAttempt('tok', 'REGISTER', 'newuser@example.com', {
      name: 'New Visitor',
    });
    expect(repeatRegister.success).toBe(false);
    expect(repeatRegister.alreadyListed).toBe(true);
    expect(repeatRegister.addedToList).toBe(false);

    // 3. Explicit waitlist join from /login
    const loginWaitlistJoin = await joinPrelaunchListAction({ email: 'waiter@example.com', name: 'Waiter' });
    expect(loginWaitlistJoin.success).toBe(true);
    expect(loginWaitlistJoin.status).toBe('WAITLIST');
    expect(
      memDb._raw.get('prelaunch_list')?.get(emailToPrelaunchDocId('waiter@example.com'))?.isTester
    ).toBe(false);

    // 4. Active Tester passes
    const testerAttempt = await validateAuthAttempt('tok', 'LOGIN', 'tester@example.com');
    expect(testerAttempt.success).toBe(true);

    // 5. Unredeemed gift voucher recipient bypasses
    const voucherAttempt = await validateAuthAttempt('tok', 'REGISTER', 'giftee@example.com', {
      name: 'Giftee',
      voucherCode: 'MW-GIFT-2026',
    });
    expect(voucherAttempt.success).toBe(true);

    // 6. Redeemed gift voucher does NOT bypass
    const usedVoucherAttempt = await validateAuthAttempt('tok', 'LOGIN', 'stranger@example.com', {
      voucherCode: 'MW-GIFT-USED',
    });
    expect(usedVoucherAttempt.success).toBe(false);
    expect(usedVoucherAttempt.code).toBe('PRELAUNCH_RESTRICTED');
  });

  it('fails closed on createSessionAction and POST /api/auth/session for non-testers when RESTRICTED', async () => {
    const memDb = createMemoryFirestore({
      prelaunch_config: { settings: { mode: 'RESTRICTED' } },
      prelaunch_list: {
        [emailToPrelaunchDocId('approved@example.com')]: {
          emailKey: emailToPrelaunchDocId('approved@example.com'),
          email: 'approved@example.com',
          name: 'Approved',
          isTester: true,
          status: 'TESTER',
          source: 'ADMIN_ADD',
          createdAt: 1,
          updatedAt: 1,
        },
      },
    });

    const createSessionCookieMock = vi.fn().mockResolvedValue('mock-session-cookie');
    const verifyIdTokenMock = vi.fn();

    vi.doMock('@/lib/firebase-admin', () => ({
      adminDb: memDb,
      adminAuth: {
        verifyIdToken: verifyIdTokenMock,
        createSessionCookie: createSessionCookieMock,
      },
    }));
    vi.doMock('@/lib/session', () => ({
      setSessionCookie: vi.fn().mockResolvedValue(undefined),
      deleteSession: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('next/headers', () => ({
      cookies: vi.fn().mockResolvedValue({
        set: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
      }),
    }));

    const { createSessionAction } = await import('@/actions/createSessionAction');
    const { POST: sessionPost } = await import('@/app/api/auth/session/route');

    // Non-tester ID token blocked in both endpoints
    verifyIdTokenMock.mockResolvedValue({ email: 'outsider@example.com', isAdmin: false });
    const actionBlocked = await createSessionAction('id-tok-outsider');
    expect(actionBlocked.success).toBe(false);
    expect((actionBlocked as any).code).toBe('PRELAUNCH_RESTRICTED');
    expect(createSessionCookieMock).not.toHaveBeenCalled();

    const routeBlocked = await sessionPost(
      new Request('https://dev.memoryweaver.studio/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ idToken: 'id-tok-outsider' }),
      })
    );
    expect(routeBlocked.status).toBe(403);
    expect(createSessionCookieMock).not.toHaveBeenCalled();

    // Admin claim passes
    verifyIdTokenMock.mockResolvedValue({ email: 'admin@example.com', isAdmin: true });
    const actionAdmin = await createSessionAction('id-tok-admin');
    expect(actionAdmin.success).toBe(true);
    expect(createSessionCookieMock).toHaveBeenCalledTimes(1);

    // Approved Tester passes API route
    verifyIdTokenMock.mockResolvedValue({ email: 'approved@example.com', isAdmin: false });
    const routeTester = await sessionPost(
      new Request('https://dev.memoryweaver.studio/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ idToken: 'id-tok-tester' }),
      })
    );
    expect(routeTester.status).toBe(200);
    expect(createSessionCookieMock).toHaveBeenCalledTimes(2);
  });

  it('auto-promotes gift voucher recipient to TESTER in prelaunch_list upon /api/gift/redeem', async () => {
    const memDb = createMemoryFirestore();
    const mockDbWithTx = {
      ...memDb,
      async runTransaction(fn: (tx: any) => Promise<any>) {
        return fn({
          get: async (ref: any) => {
            if (ref.id === 'MW-GIFT-OK') {
              return {
                exists: true,
                data: () => ({
                  code: 'MW-GIFT-OK',
                  status: 'unredeemed',
                  tier: 'director',
                  giverName: 'Grandma',
                  vaultQuotaGb: 5,
                  giftMessage: 'For your stories',
                }),
              };
            }
            return {
              exists: true,
              data: () => ({
                displayName: 'Sarah Gift',
                membershipTier: 'free',
                storageQuota: { used: 0, total: 1024 },
              }),
            };
          },
          update: vi.fn(),
        });
      },
    };

    vi.doMock('@/lib/firebase-admin', () => ({
      adminDb: mockDbWithTx,
      adminAuth: null,
    }));
    vi.doMock('@/lib/session', () => ({
      getSession: vi.fn().mockResolvedValue({
        uid: 'user-gift-1',
        email: 'sarah@example.com',
      }),
    }));

    const { POST: redeemPost } = await import('@/app/api/gift/redeem/route');
    const res = await redeemPost(
      new Request('https://dev.memoryweaver.studio/api/gift/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: 'MW-GIFT-OK' }),
      }) as any
    );

    expect(res.status).toBe(200);
    const saved = memDb._raw.get('prelaunch_list')?.get(emailToPrelaunchDocId('sarah@example.com'));
    expect(saved?.isTester).toBe(true);
    expect(saved?.status).toBe('TESTER');
    expect(saved?.source).toBe('GIFT_VOUCHER');
    expect(saved?.name).toBe('Sarah Gift');
  });

  it('gates /api/admin/prelaunch behind requireAdminSession and supports mode switch, 1-click Tester toggle & bulk Sheet import', async () => {
    const memDb = createMemoryFirestore();
    const requireAdminMock = vi.fn();

    vi.doMock('@/lib/firebaseAdmin', () => ({ adminDb: memDb }));
    vi.doMock('@/lib/firebase-admin', () => ({ adminDb: memDb, adminAuth: null }));
    vi.doMock('@/lib/session', () => ({ requireAdminSession: requireAdminMock }));

    const routeMod = await import('@/app/api/admin/prelaunch/route');

    // Unauthenticated blocked
    requireAdminMock.mockResolvedValue({
      authorized: false,
      status: 401,
      error: 'Unauthorized',
    });
    const unauthRes = await routeMod.GET(
      new Request('https://dev.memoryweaver.studio/api/admin/prelaunch') as any
    );
    expect(unauthRes.status).toBe(401);

    // Authorized admin flow
    requireAdminMock.mockResolvedValue({
      authorized: true,
      session: { email: 'naresh@memoryweaver.studio', isAdmin: true },
    });

    // Switch mode to RESTRICTED
    const modeRes = await routeMod.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/prelaunch', {
        method: 'PATCH',
        body: JSON.stringify({ mode: 'RESTRICTED' }),
      })
    );
    expect(modeRes.status).toBe(200);
    expect(memDb._raw.get('prelaunch_config')?.get('settings')?.mode).toBe('RESTRICTED');

    // Bulk import from Google Sheet paste as WAITLIST
    const importRes = await routeMod.POST(
      new Request('https://dev.memoryweaver.studio/api/admin/prelaunch', {
        method: 'POST',
        body: JSON.stringify({
          bulkText: 'Asha\tasha@example.com\nRavi <ravi@example.com>',
          asTester: false,
        }),
      })
    );
    const importJson = await importRes.json();
    expect(importRes.status).toBe(200);
    expect(importJson.importedCount).toBe(2);
    expect(importJson.status).toBe('WAITLIST');

    // 1-click flip asha@example.com -> Tester ON
    const flipRes = await routeMod.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/prelaunch', {
        method: 'PATCH',
        body: JSON.stringify({
          emailKey: emailToPrelaunchDocId('asha@example.com'),
          isTester: true,
        }),
      })
    );
    const flipJson = await flipRes.json();
    expect(flipRes.status).toBe(200);
    expect(flipJson.entry.isTester).toBe(true);
    expect(flipJson.entry.status).toBe('TESTER');

    // GET roster reports exact counts (1 tester, 1 waitlist)
    const getRes = await routeMod.GET(
      new Request('https://dev.memoryweaver.studio/api/admin/prelaunch') as any
    );
    const getJson = await getRes.json();
    expect(getRes.status).toBe(200);
    expect(getJson.mode).toBe('RESTRICTED');
    expect(typeof getJson.isProduction).toBe('boolean');
    expect(getJson.counts).toEqual({ total: 2, testers: 1, waitlist: 1 });
  });
});
