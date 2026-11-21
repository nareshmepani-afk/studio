import fs from 'fs';
import path from 'path';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import {
  ALLOWED_TIER_3_GATE_CATEGORIES,
  buildSeededReleaseControl,
  computeInboxBadgeCounts,
  DEFAULT_RELEASE_CONTROL_SEEDS,
  deriveControlChecklistSteps,
  evaluateEnvironmentParity,
  evaluateReleaseControlTransition,
  formatReleaseControlForPlane,
  formatThreeZoneRadar,
  getReleaseControlTargetMeta,
  isValidTier3GateCategory,
  sortReleaseControls,
  type ReleaseControlSeed,
} from '@/lib/releaseControls';
import {
  escapeHtmlForPlane,
  normalisePlaneIssueKey,
  stripHtmlToSafeText,
  textToPlaneHtml,
} from '@/lib/planeTypes';
import {
  classifyStripeKeyMode,
  formatHealthProbeCliLines,
  formatHealthProbeMarkdownReceipt,
  runHealthProbe,
} from '@/lib/healthProbe';

const SYNTHETIC_RED_SEED: ReleaseControlSeed = {
  id: 'ctrl-test-red-gate',
  order: 1,
  title: 'Test RED Billing Gate',
  summary: 'Synthetic RED Tier-3 test gate.',
  severity: 'RED',
  knockOnImpact: 'Holding blocks live checkout.',
  envTag: '[ENV: PROD]',
  gateTier: 'TIER_3_FOUNDER',
  gateCategory: 'MONEY_BILLING',
  ticketRefs: ['MW-408'],
};

const SYNTHETIC_AMBER_SEED: ReleaseControlSeed = {
  id: 'ctrl-test-amber-mfa',
  order: 2,
  title: 'Test AMBER Vendor MFA Gate',
  summary: 'Synthetic AMBER Tier-3 vendor MFA gate.',
  severity: 'AMBER',
  knockOnImpact: 'Safe to hold until post-cutover.',
  envTag: '[ENV: STAGING]',
  gateTier: 'TIER_3_FOUNDER',
  gateCategory: 'NON_API_VENDOR_MFA',
  ticketRefs: ['MW-405'],
};

function createMemoryDb() {
  const store = new Map<string, Map<string, any>>();
  const ensureCol = (name: string) => {
    if (!store.has(name)) store.set(name, new Map());
    return store.get(name)!;
  };
  const makeSnap = (colName: string) => {
    const col = ensureCol(colName);
    const docs = Array.from(col.entries()).map(([id, data]) => ({
      id,
      exists: true,
      data: () => data,
    }));
    return { docs, size: docs.length, empty: docs.length === 0 };
  };

  return {
    _store: store,
    collection: (colName: string) => ({
      doc: (id: string) => ({
        get: async () => {
          const col = ensureCol(colName);
          return {
            id,
            exists: col.has(id),
            data: () => col.get(id),
          };
        },
        set: async (data: any, opts?: { merge?: boolean }) => {
          const col = ensureCol(colName);
          if (opts?.merge && col.has(id)) {
            col.set(id, { ...col.get(id), ...data });
          } else {
            col.set(id, data);
          }
        },
      }),
      orderBy: () => ({
        limit: () => ({ get: async () => makeSnap(colName) }),
      }),
      limit: () => ({ get: async () => makeSnap(colName) }),
      get: async () => makeSnap(colName),
    }),
  };
}

describe('Option B: Founder Inbox & Red/Amber Release Controls', () => {
  const savedEnv = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
  };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.GCLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-dev';
  });

  afterEach(() => {
    if (savedEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = savedEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (savedEnv.GCLOUD_PROJECT === undefined) delete process.env.GCLOUD_PROJECT;
    else process.env.GCLOUD_PROJECT = savedEnv.GCLOUD_PROJECT;
    if (savedEnv.GOOGLE_CLOUD_PROJECT === undefined) delete process.env.GOOGLE_CLOUD_PROJECT;
    else process.env.GOOGLE_CLOUD_PROJECT = savedEnv.GOOGLE_CLOUD_PROJECT;
  });

  it('prunes DEFAULT_RELEASE_CONTROL_SEEDS strictly to TIER_3_FOUNDER gates with allowlisted gateCategory', () => {
    expect(DEFAULT_RELEASE_CONTROL_SEEDS.length).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_RELEASE_CONTROL_SEEDS.map((s) => s.id)).toEqual(['ctrl-stripe-live-mode-switch']);
    for (const seed of DEFAULT_RELEASE_CONTROL_SEEDS) {
      expect(seed.gateTier).toBe('TIER_3_FOUNDER');
      expect(isValidTier3GateCategory(seed.gateCategory)).toBe(true);
    }
    expect(ALLOWED_TIER_3_GATE_CATEGORIES).toEqual([
      'MONEY_BILLING',
      'DESTRUCTIVE_LIVE_DATA',
      'EXTERNAL_CUSTOMER_LEGAL',
      'NON_API_VENDOR_MFA',
    ]);
  });

  it('enforces RED vs AMBER state transitions and 1A knock-on acknowledgement on RED defer', () => {
    const redRecord = buildSeededReleaseControl(SYNTHETIC_RED_SEED, 1000);
    const amberRecord = buildSeededReleaseControl(SYNTHETIC_AMBER_SEED, 1000);

    // RED HOLD -> HELD_BLOCKING; AMBER HOLD -> HELD
    const redHold = evaluateReleaseControlTransition(redRecord, {
      action: 'HOLD',
      actor: 'founder@googlemail.com',
      now: 2000,
    });
    expect(redHold.ok).toBe(true);
    if (redHold.ok) expect(redHold.next.status).toBe('HELD_BLOCKING');

    const amberHold = evaluateReleaseControlTransition(amberRecord, {
      action: 'HOLD',
      actor: 'founder@googlemail.com',
      now: 2000,
    });
    expect(amberHold.ok).toBe(true);
    if (amberHold.ok) expect(amberHold.next.status).toBe('HELD');

    // RED DEFER without acknowledgedKnockOn rejected with 400
    const redDeferBlocked = evaluateReleaseControlTransition(redRecord, {
      action: 'DEFER_TO_PLANE',
      actor: 'founder@googlemail.com',
      now: 3000,
    });
    expect(redDeferBlocked).toMatchObject({ ok: false, status: 400 });

    // RED DEFER with acknowledgedKnockOn: true succeeds & tags [DEFERRED-BLOCKER]
    const redDeferOk = evaluateReleaseControlTransition(redRecord, {
      action: 'DEFER_TO_PLANE',
      actor: 'founder@googlemail.com',
      now: 3000,
      acknowledgedKnockOn: true,
      notes: 'Waiting for weekend test window',
    });
    expect(redDeferOk.ok).toBe(true);
    if (redDeferOk.ok) {
      expect(redDeferOk.next.status).toBe('DEFERRED_TO_PLANE');
      expect(redDeferOk.next.acceptedKnockOnDelay).toBe(true);
      expect(redDeferOk.next.planeTag).toBe('[DEFERRED-BLOCKER]');
      const formatted = formatReleaseControlForPlane(redDeferOk.next);
      expect(formatted.title).toContain('[DEFERRED-BLOCKER]');
      expect(formatted.description).toContain('YES (Explicitly acknowledged by founder)');
    }

    // AMBER DEFER works in 1 click without knock-on confirmation
    const amberDefer = evaluateReleaseControlTransition(amberRecord, {
      action: 'DEFER_TO_PLANE',
      actor: 'founder@googlemail.com',
      now: 3000,
    });
    expect(amberDefer.ok).toBe(true);
    if (amberDefer.ok) {
      expect(amberDefer.next.planeTag).toBe('[DEFERRED-CONTROL]');
    }
  });

  it('rejects stale expectedUpdatedAt and terminal EXECUTED mutations with HTTP 409', () => {
    const record = buildSeededReleaseControl(SYNTHETIC_RED_SEED, 5000);

    // Stale tab timestamp rejected with 409
    const staleRes = evaluateReleaseControlTransition(record, {
      action: 'APPROVE',
      actor: 'founder@googlemail.com',
      expectedUpdatedAt: 4999,
      now: 6000,
    });
    expect(staleRes).toMatchObject({ ok: false, status: 409 });

    // Transition to EXECUTED, then reject any further mutation with 409
    const execRes = evaluateReleaseControlTransition(record, {
      action: 'MARK_EXECUTED',
      actor: 'qa:controls',
      executedCommitSha: 'b123284',
      now: 7000,
    });
    expect(execRes.ok).toBe(true);
    if (execRes.ok) {
      const postExecHold = evaluateReleaseControlTransition(execRes.next, {
        action: 'HOLD',
        actor: 'founder@googlemail.com',
        now: 8000,
      });
      expect(postExecHold).toMatchObject({ ok: false, status: 409 });
    }
  });

  it('computes sorted inbox order and RED/AMBER/ReadySignOff badge counts accurately', () => {
    const list = [
      buildSeededReleaseControl(SYNTHETIC_AMBER_SEED, 1000),
      buildSeededReleaseControl(SYNTHETIC_RED_SEED, 1000),
      buildSeededReleaseControl(
        { ...SYNTHETIC_RED_SEED, id: 'ctrl-test-red-2', order: 3 },
        1000
      ),
    ];
    const sorted = sortReleaseControls(list);
    expect(sorted[0].severity).toBe('RED');

    const badges = computeInboxBadgeCounts({
      controls: sorted,
      pendingDecisionsCount: 1,
      readyBugsCount: 2,
    });
    expect(badges).toEqual({
      red: 2,
      amber: 2, // 1 AMBER control + 1 pending decision
      approvedAwaitingCli: 0,
      readySignOff: 2,
      pendingDecisions: 1,
      totalActionable: 6,
    });
  });

  it('/api/admin/controls fails closed with 403 on production and enforces 409 concurrency on staging', async () => {
    const memDb = createMemoryDb();
    const requireAdminMock = vi.fn().mockResolvedValue({
      authorized: true,
      session: { email: 'nareshmepani@googlemail.com', isAdmin: true },
    });
    vi.doMock('@/lib/firebaseAdmin', () => ({ adminDb: memDb }));
    vi.doMock('@/lib/session', () => ({ requireAdminSession: requireAdminMock }));

    const routeMod = await import('@/app/api/admin/controls/route');

    // Production blocked with 403 across GET/POST/PATCH
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-8rk9t';
    expect((await routeMod.GET(new Request('https://memoryweaver.studio/api/admin/controls') as any)).status).toBe(403);
    expect((await routeMod.POST(new Request('https://memoryweaver.studio/api/admin/controls', { method: 'POST', body: '{}' }))).status).toBe(403);
    expect((await routeMod.PATCH(new Request('https://memoryweaver.studio/api/admin/controls', { method: 'PATCH', body: '{}' }))).status).toBe(403);
    expect(memDb._store.get('release_controls')?.size || 0).toBe(0);

    // Staging succeeds, seeds, and enforces 409 on stale expectedUpdatedAt
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-dev';
    const getRes = await routeMod.GET(new Request('https://dev.memoryweaver.studio/api/admin/controls') as any);
    const getJson = await getRes.json();
    expect(getRes.status).toBe(200);
    expect(getJson.controls.length).toBe(DEFAULT_RELEASE_CONTROL_SEEDS.length);

    const first = getJson.controls[0];
    const stalePatch = await routeMod.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'PATCH',
        body: JSON.stringify({
          id: first.id,
          action: 'APPROVE',
          expectedUpdatedAt: first.updatedAt - 100,
        }),
      })
    );
    expect(stalePatch.status).toBe(409);

    const okPatch = await routeMod.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'PATCH',
        body: JSON.stringify({
          id: first.id,
          action: 'APPROVE',
          expectedUpdatedAt: first.updatedAt,
        }),
      })
    );
    expect(okPatch.status).toBe(200);
    const okJson = await okPatch.json();
    expect(okJson.control.status).toBe('APPROVED');
  });

  it('/api/admin/decisions never auto-seeds staging cutover cards into production Firestore and blocks prod writes (403)', async () => {
    const memDb = createMemoryDb();
    const requireAdminMock = vi.fn().mockResolvedValue({
      authorized: true,
      session: { email: 'nareshmepani@googlemail.com', isAdmin: true },
    });
    vi.doMock('@/lib/firebaseAdmin', () => ({ adminDb: memDb }));
    vi.doMock('@/lib/session', () => ({ requireAdminSession: requireAdminMock }));

    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-8rk9t';
    const routeMod = await import('@/app/api/admin/decisions/route');

    const getRes = await routeMod.GET();
    const getJson = await getRes.json();
    expect(getRes.status).toBe(200);
    expect(getJson.isProduction).toBe(true);
    expect(getJson.decisions).toEqual([]);
    expect(memDb._store.get('founder_decisions')?.size || 0).toBe(0);

    const postRes = await routeMod.POST(
      new Request('https://memoryweaver.studio/api/admin/decisions', {
        method: 'POST',
        body: JSON.stringify({ action: 'seed' }),
      }) as any
    );
    expect(postRes.status).toBe(403);

    const patchRes = await routeMod.PATCH(
      new Request('https://memoryweaver.studio/api/admin/decisions', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'mw-409-prod-qa-purge', selectedOptionId: 'approve_now' }),
      })
    );
    expect(patchRes.status).toBe(403);
  });

  it('locks match /release_controls/{id} to admin custom claim in firestore.rules', () => {
    const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
    expect(rules).toMatch(
      /match \/release_controls\/\{id\}\s*\{\s*allow read, write: if request\.auth != null && request\.auth\.token\.isAdmin == true;\s*\}/
    );
  });

  it('evaluateEnvironmentParity normalises 7-char SHAs and handles null/unparseable timestamps without guessing', () => {
    // Full 40-char vs 7-char uppercase -> IN_SYNC
    const synced = evaluateEnvironmentParity(
      { commitSha: '5A07A0D773af6065da8323df2b4786ca91a36587', commitTimestamp: '2026-11-20T14:33:14Z' },
      { commitSha: '5a07a0d', commitTimestamp: '2026-11-20T14:33:14Z' }
    );
    expect(synced.status).toBe('IN_SYNC');
    expect(synced.stagingSha).toBe('5a07a0d');
    expect(synced.prodSha).toBe('5a07a0d');

    // Staging ahead
    const ahead = evaluateEnvironmentParity(
      { commitSha: '5a07a0d', commitTimestamp: '2026-11-20T14:33:14Z' },
      { commitSha: '8051219', commitTimestamp: '2026-11-19T20:34:45Z' }
    );
    expect(ahead.status).toBe('STAGING_AHEAD');

    // Prod newer -> back-merge warning
    const prodNewer = evaluateEnvironmentParity(
      { commitSha: '8051219', commitTimestamp: '2026-11-19T20:34:45Z' },
      { commitSha: 'f123abc', commitTimestamp: '2026-11-20T16:00:00Z' }
    );
    expect(prodNewer.status).toBe('PROD_NEWER_CHECK_BACKMERGE');
    expect(prodNewer.tone).toBe('rose');

    // Null or unparseable timestamp -> explicit SHAS_DIFFER_NO_TIMESTAMP
    const nullTs = evaluateEnvironmentParity(
      { commitSha: '5a07a0d', commitTimestamp: null },
      { commitSha: '8051219', commitTimestamp: '2026-11-19T20:34:45Z' }
    );
    expect(nullTs.status).toBe('SHAS_DIFFER_NO_TIMESTAMP');
    expect(nullTs.label).toBe('SHAs Differ (Timestamp Unavailable)');

    const badTs = evaluateEnvironmentParity(
      { commitSha: '5a07a0d', commitTimestamp: 'not-a-date' },
      { commitSha: '8051219', commitTimestamp: '2026-11-19T20:34:45Z' }
    );
    expect(badTs.status).toBe('SHAS_DIFFER_NO_TIMESTAMP');

    // Unreachable prod -> UNAVAILABLE
    const unreachable = evaluateEnvironmentParity(
      { commitSha: '5a07a0d', commitTimestamp: '2026-11-20T14:33:14Z' },
      { commitSha: null, commitTimestamp: null, reachable: false }
    );
    expect(unreachable.status).toBe('UNAVAILABLE');
  });

  it('formatThreeZoneRadar emits 4 lines and raises BACK-MERGE REQUIRED when origin/master has prod-only commits', () => {
    const cleanLines = formatThreeZoneRadar({
      localBranch: 'dev',
      dirtyCount: 0,
      unpushedDevCount: 0,
      originDevSha: '5a07a0d',
      liveStagingSha: '5a07a0d',
      originMasterSha: '8051219',
      liveProdSha: '8051219',
      stagingAheadCount: 1,
      prodOnlyCount: 0,
      refsFresh: true,
    });
    expect(cleanLines).toHaveLength(4);
    expect(cleanLines[0]).toContain('Zone 1 [LOCAL]');
    expect(cleanLines[1]).toContain('Zone 2 [STAGING]');
    expect(cleanLines[2]).toContain('Zone 3 [PROD]');
    expect(cleanLines[3]).toContain('Staging ahead of Prod by 1 commit(s)');

    const hotfixLines = formatThreeZoneRadar({
      localBranch: 'dev',
      dirtyCount: 2,
      unpushedDevCount: 1,
      originDevSha: '5a07a0d',
      liveStagingSha: '5a07a0d',
      originMasterSha: 'deadbee',
      liveProdSha: 'deadbee',
      stagingAheadCount: 1,
      prodOnlyCount: 1,
      refsFresh: false,
    });
    expect(hotfixLines).toHaveLength(4);
    expect(hotfixLines[3]).toContain('BACK-MERGE REQUIRED');
    expect(hotfixLines[3]).toContain('(cached refs)');
  });

  it('/api/admin/controls supports ?includeParity=1 on plain Web Request without external network call in VITEST', async () => {
    const memDb = createMemoryDb();
    vi.doMock('@/lib/firebaseAdmin', () => ({ adminDb: memDb }));
    vi.doMock('@/lib/session', () => ({
      requireAdminSession: vi.fn().mockResolvedValue({
        authorized: true,
        session: { email: 'nareshmepani@googlemail.com', isAdmin: true },
      }),
    }));

    const routeMod = await import('@/app/api/admin/controls/route');

    // Without ?includeParity=1: omits parity key
    const plainRes = await routeMod.GET(new Request('https://dev.memoryweaver.studio/api/admin/controls') as any);
    const plainJson = await plainRes.json();
    expect(plainRes.status).toBe(200);
    expect(plainJson.parity).toBeUndefined();

    // With ?includeParity=1: returns parity object (VITEST skips live prod fetch -> UNAVAILABLE)
    const parityRes = await routeMod.GET(
      new Request('https://dev.memoryweaver.studio/api/admin/controls?includeParity=1') as any
    );
    const parityJson = await parityRes.json();
    expect(parityRes.status).toBe(200);
    expect(parityJson.parity).toBeDefined();
    expect(parityJson.parity.status).toBe('UNAVAILABLE');
  });

  it('getReleaseControlTargetMeta distinguishes PROD, BOTH, and STAGING with bare hostnames', () => {
    const prod = getReleaseControlTargetMeta('[ENV: PROD]');
    expect(prod.isProdTarget).toBe(true);
    expect(prod.badgeLabel).toBe('[ENV: PROD] • memoryweaver.studio');
    expect(prod.badgeClassName).toContain('bg-rose-600');
    expect(prod.badgeClassName).toContain('text-white');
    expect(prod.scopeCue).toContain('Targets Live Production (memoryweaver.studio / memory-weaver-8rk9t)');

    const both = getReleaseControlTargetMeta('[ENV: BOTH]');
    expect(both.isProdTarget).toBe(false);
    expect(both.badgeLabel).toBe('[ENV: BOTH] • dev -> master');
    expect(both.scopeCue).toBeNull();

    const staging = getReleaseControlTargetMeta('[ENV: STAGING]');
    expect(staging.isProdTarget).toBe(false);
    expect(staging.badgeLabel).toBe('[ENV: STAGING] • dev.memoryweaver.studio');
    expect(staging.badgeLabel).not.toContain('https://');
    expect(staging.scopeCue).toBeNull();
  });

  it('POST /api/admin/controls enforces TIER_3_FOUNDER + allowlisted gateCategory and PATCH guards duplicate deferrals & shared tickets', async () => {
    const memDb = createMemoryDb();
    vi.doMock('@/lib/firebaseAdmin', () => ({ adminDb: memDb }));
    vi.doMock('@/lib/session', () => ({
      requireAdminSession: vi.fn().mockResolvedValue({
        authorized: true,
        session: { email: 'nareshmepani@googlemail.com', isAdmin: true },
      }),
    }));

    const createPlaneIssueMock = vi.fn().mockResolvedValue('MW-999');
    const addPlaneCommentMock = vi.fn().mockResolvedValue({ id: 'c1', bodyText: 'ok', createdAt: null, updatedAt: null, actor: null });
    const updatePlaneStateMock = vi.fn().mockResolvedValue({ issueId: 'u1', stateId: 's-done' });

    vi.doMock('@/lib/planeClient', () => ({
      loadPlaneEnv: vi.fn(() => ({
        apiKey: 'plane_test_key',
        workspaceSlug: 'memory-weaver-studio',
        projectId: 'ef45f4c8-ea7e-490d-8282-e959e484ae07',
      })),
      createPlaneIssue: createPlaneIssueMock,
      addPlaneIssueComment: addPlaneCommentMock,
      updatePlaneIssueState: updatePlaneStateMock,
    }));

    const routeMod = await import('@/app/api/admin/controls/route');

    // Reject missing gateTier / invalid gateCategory (400)
    const badPost = await routeMod.POST(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'POST',
        body: JSON.stringify({
          id: 'ctrl-tier1-noise',
          title: 'Routine bug push',
          knockOnImpact: 'None',
          severity: 'AMBER',
          gateTier: 'TIER_1_AUTO',
          gateCategory: 'ROUTINE_BUG',
        }),
      })
    );
    expect(badPost.status).toBe(400);

    // Accept valid TIER_3_FOUNDER + MONEY_BILLING (201) sharing MW-499 across two active controls
    const okPost = await routeMod.POST(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'POST',
        body: JSON.stringify({
          id: 'ctrl-shared-a',
          title: 'Shared Gate A',
          knockOnImpact: 'Blocks billing cutover.',
          severity: 'RED',
          envTag: '[ENV: PROD]',
          gateTier: 'TIER_3_FOUNDER',
          gateCategory: 'MONEY_BILLING',
          ticketRefs: ['MW-499'],
        }),
      })
    );
    expect(okPost.status).toBe(201);

    // Second active control sharing MW-499
    await routeMod.POST(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'POST',
        body: JSON.stringify({
          id: 'ctrl-shared-b',
          title: 'Shared Gate B',
          knockOnImpact: 'Blocks billing cutover.',
          severity: 'RED',
          envTag: '[ENV: PROD]',
          gateTier: 'TIER_3_FOUNDER',
          gateCategory: 'MONEY_BILLING',
          ticketRefs: ['MW-499'],
        }),
      })
    );

    // Mark ctrl-shared-a EXECUTED while ctrl-shared-b still references MW-499 -> comment ONLY, do NOT close MW-499!
    const execA = await routeMod.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'ctrl-shared-a', action: 'MARK_EXECUTED', executedCommitSha: 'ab5e6ba' }),
      })
    );
    expect(execA.status).toBe(200);
    expect(addPlaneCommentMock).toHaveBeenCalled();
    expect(updatePlaneStateMock).not.toHaveBeenCalled();

    // Defer ctrl-shared-b twice (with REOPEN in between) -> creates MW-999 once, comments on 2nd defer (no duplicate!)
    const defer1 = await routeMod.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'ctrl-shared-b',
          action: 'DEFER_TO_PLANE',
          acknowledgedKnockOn: true,
        }),
      })
    );
    const defer1Json = await defer1.json();
    expect(defer1.status).toBe(200);
    expect(defer1Json.control.planeDeferredRef).toBe('MW-999');
    expect(createPlaneIssueMock).toHaveBeenCalledTimes(1);

    await routeMod.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'ctrl-shared-b', action: 'REOPEN' }),
      })
    );
    const defer2 = await routeMod.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'ctrl-shared-b',
          action: 'DEFER_TO_PLANE',
          acknowledgedKnockOn: true,
        }),
      })
    );
    expect(defer2.status).toBe(200);
    expect(createPlaneIssueMock).toHaveBeenCalledTimes(1); // Never duplicated!

    // Now mark ctrl-shared-b EXECUTED (last active holder of MW-499) -> auto-closes MW-499!
    const execB = await routeMod.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/controls', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'ctrl-shared-b', action: 'MARK_EXECUTED', executedCommitSha: 'ab5e6ba' }),
      })
    );
    expect(execB.status).toBe(200);
    expect(updatePlaneStateMock).toHaveBeenCalledWith(expect.any(Object), 'MW-499', 'done');
    vi.doUnmock('@/lib/planeClient');
  });

  it('FounderInboxConsole renders high-contrast [ENV: PROD] cue, zero outbound app.plane.so links, and opens in-app PlaneTicketDrawer with safe plain-text rendering', async () => {
    const prodCard = buildSeededReleaseControl(DEFAULT_RELEASE_CONTROL_SEEDS[0], 1000); // ctrl-stripe-live-mode-switch (MW-408, [ENV: PROD])
    const amberCardWithInvalidRef = {
      ...buildSeededReleaseControl(SYNTHETIC_AMBER_SEED, 1000),
      ticketRefs: ['MW-405', 'EXTERNAL-99'],
    };
    const deferredLedgerCard = {
      ...buildSeededReleaseControl(SYNTHETIC_RED_SEED, 1000),
      id: 'ctrl-ledger-deferred',
      status: 'DEFERRED_TO_PLANE' as const,
      planeDeferredRef: 'MW-419',
      ticketRefs: ['MW-414'],
    };

    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/admin/controls')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            controls: [prodCard, amberCardWithInvalidRef, deferredLedgerCard],
            pendingDecisions: [],
            readyBugs: [
              {
                reportId: 'bug_ready_1',
                traceId: 'trc_1',
                userId: 'u1',
                userEmail: 'founder@example.com',
                path: '/studio',
                appVersion: 'v1.1.0-beta',
                userAgent: 'Chrome',
                description: 'Ready bug check',
                status: 'FIXED_ON_DEV',
                createdAt: 1000,
                createdAtIso: '2026-11-20T10:00:00Z',
                updatedAt: 1000,
                environmentHost: 'https://dev.memoryweaver.studio',
                planeIssueId: 'MW-415',
                resolutionNotes: 'Fixed',
                fixedInCommitSha: 'ab5e6ba',
              },
            ],
            badges: {
              red: 1,
              amber: 1,
              approvedAwaitingCli: 0,
              readySignOff: 1,
              pendingDecisions: 0,
              totalActionable: 3,
            },
            parity: evaluateEnvironmentParity(
              { commitSha: 'ab5e6ba', commitTimestamp: '2026-11-20T14:33:14Z' },
              { commitSha: '8051219', commitTimestamp: '2026-11-19T20:34:45Z' }
            ),
          }),
        };
      }
      if (urlStr.includes('/api/admin/health-probe')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            overall: 'OK',
            mode: 'FAST',
            environment: 'staging',
            projectId: 'memory-weaver-dev',
            checkedAtIso: '2026-11-20T18:00:00Z',
            durationMs: 42,
            checks: [
              { id: 'firestore', label: 'Firestore', status: 'OK', detail: 'Connected' },
              { id: 'plane', label: 'Plane.so API', status: 'UNCONFIGURED', detail: 'Pending secret' },
            ],
          }),
        };
      }
      if (urlStr.includes('/api/admin/plane/issues/MW-408')) {
        const isPatch = init?.method === 'PATCH';
        const isPost = init?.method === 'POST';
        return {
          ok: true,
          json: async () => ({
            success: true,
            configured: true,
            key: 'MW-408',
            issue: {
              id: '6bb4b6e3-1513-4210-ae7e-5cc2f3703cd9',
              key: 'MW-408',
              sequenceId: 408,
              projectId: 'ef45f4c8-ea7e-490d-8282-e959e484ae07',
              name: 'OPS-CUTOVER: Prod cutover pre-flight',
              descriptionText: 'Safe text with <script>alert("xss")</script> literal',
              priority: 'high',
              stateId: isPatch ? 'st-done' : 'st-backlog',
              stateName: isPatch ? 'Done' : 'Backlog',
              stateGroup: isPatch ? 'completed' : 'backlog',
              createdAt: '2026-11-16T18:16:42Z',
              updatedAt: '2026-11-20T18:23:42Z',
            },
            comments: isPost
              ? [{ id: 'c-new', bodyText: 'Founder verified via API', createdAt: '2026-11-20T18:30:00Z', updatedAt: null, actor: 'Founder' }]
              : [],
            states: [
              { id: 'st-backlog', name: 'Backlog', group: 'backlog' },
              { id: 'st-done', name: 'Done', group: 'completed' },
            ],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ commitSha: 'ab5e6ba', environment: 'staging' }),
      };
    });

    vi.stubGlobal('fetch', fetchMock);
    try {
      const { FounderInboxConsole } = await import('@/components/admin/FounderInboxConsole');
      const { container } = render(React.createElement(FounderInboxConsole));

      await waitFor(() => {
        expect(screen.getByTestId('RELEASE_CONTROL_CARD_ctrl-stripe-live-mode-switch')).toBeInTheDocument();
      });

      // Zero outbound app.plane.so links anywhere inside FounderInboxConsole!
      const externalPlaneAnchors = Array.from(container.querySelectorAll('a[href*="app.plane.so"]'));
      expect(externalPlaneAnchors).toHaveLength(0);

      // Synthetic health bar mounts cleanly
      expect(screen.getByTestId('ADMIN_HEALTH_BAR')).toBeInTheDocument();

      const prodEl = screen.getByTestId('RELEASE_CONTROL_CARD_ctrl-stripe-live-mode-switch');
      expect(within(prodEl).getByTestId('RELEASE_TARGET_BADGE_ctrl-stripe-live-mode-switch')).toHaveTextContent(
        '[ENV: PROD] • memoryweaver.studio'
      );
      expect(within(prodEl).getByTestId('RELEASE_TARGET_SCOPE_ctrl-stripe-live-mode-switch')).toHaveTextContent(
        'Targets Live Production (memoryweaver.studio / memory-weaver-8rk9t)'
      );

      // Click Inspect MW-408 button -> opens in-app PlaneTicketDrawer (zero page navigation!)
      const mw408Btn = within(prodEl).getByRole('button', { name: /Inspect MW-408/i });
      fireEvent.click(mw408Btn);

      await waitFor(() => {
        expect(screen.getByTestId('PLANE_TICKET_DRAWER')).toBeInTheDocument();
        expect(screen.getByTestId('PLANE_DRAWER_TITLE')).toHaveTextContent('OPS-CUTOVER: Prod cutover pre-flight');
      });

      // Strict plain-text rendering: literal <script> text shown safely, zero <script> DOM elements!
      expect(screen.getByTestId('PLANE_DRAWER_DESCRIPTION').textContent).toContain('<script>alert("xss")</script>');
      expect(container.querySelectorAll('script')).toHaveLength(0);

      // Click Mark Done via API -> sends PATCH /api/admin/plane/issues/MW-408
      fireEvent.click(screen.getByTestId('PLANE_DRAWER_MARK_DONE'));
      await waitFor(() => {
        expect(screen.getByTestId('PLANE_DRAWER_STATE_BADGE')).toHaveTextContent('Done');
      });

      // Post Founder comment -> sends POST /api/admin/plane/issues/MW-408
      fireEvent.change(screen.getByTestId('PLANE_DRAWER_COMMENT_INPUT'), {
        target: { value: 'Founder verified via API' },
      });
      fireEvent.click(screen.getByTestId('PLANE_DRAWER_COMMENT_SUBMIT'));
      await waitFor(() => {
        expect(screen.getByTestId('PLANE_DRAWER_COMMENTS').textContent).toContain('Founder verified via API');
      });

      fireEvent.click(screen.getByTestId('PLANE_DRAWER_CLOSE'));

      // Invalid ref on AMBER card still falls back to passive <span>
      const amberEl = screen.getByTestId('RELEASE_CONTROL_CARD_ctrl-test-amber-mfa');
      expect(within(amberEl).getByRole('button', { name: /Inspect MW-405/i })).toBeInTheDocument();
      const invalidSpan = within(amberEl).getByText('EXTERNAL-99');
      expect(invalidSpan.tagName).toBe('SPAN');

      // Expand Ledger and verify MW-419 is an in-app button (zero external <a>)
      fireEvent.click(screen.getByText(/Deferred & Executed Release Ledger/i));
      expect(screen.getByRole('button', { name: /Inspect MW-419/i })).toBeInTheDocument();
      expect(container.querySelectorAll('a[href*="app.plane.so"]')).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('validates planeTypes helpers, /api/admin/plane/issues/[key] guards, and fail-soft unconfigured mode', async () => {
    expect(normalisePlaneIssueKey('mw-408')).toBe('MW-408');
    expect(normalisePlaneIssueKey('405')).toBe('MW-405');
    expect(normalisePlaneIssueKey('../etc/passwd')).toBeNull();
    expect(normalisePlaneIssueKey('MW-1234567')).toBeNull();
    expect(escapeHtmlForPlane('<script>"&\'</script>')).toBe('&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;');
    expect(textToPlaneHtml('Line 1\n<tag>')).toBe('<p>Line 1<br/>&lt;tag&gt;</p>');
    expect(stripHtmlToSafeText('<p>Hello<br/>World &amp; Co</p>')).toBe('Hello\nWorld & Co');

    vi.doMock('@/lib/session', () => ({
      requireAdminSession: vi.fn().mockResolvedValue({
        authorized: true,
        session: { email: 'nareshmepani@googlemail.com', isAdmin: true },
      }),
    }));

    const planeRoute = await import('@/app/api/admin/plane/issues/[key]/route');

    // Invalid key -> 400
    const badKeyRes = await planeRoute.GET(
      new Request('https://dev.memoryweaver.studio/api/admin/plane/issues/bad') as any,
      { params: Promise.resolve({ key: '../evil' }) }
    );
    expect(badKeyRes.status).toBe(400);

    // Unset PLANE_API_KEY in Vitest -> fail-soft HTTP 200 { success: true, configured: false }
    const unconfRes = await planeRoute.GET(
      new Request('https://dev.memoryweaver.studio/api/admin/plane/issues/MW-408') as any,
      { params: Promise.resolve({ key: 'MW-408' }) }
    );
    const unconfJson = await unconfRes.json();
    expect(unconfRes.status).toBe(200);
    expect(unconfJson).toMatchObject({ success: true, configured: false, key: 'MW-408' });

    // Cross-site PATCH rejected with 403 by same-origin guard
    const csrfBlocked = await planeRoute.PATCH(
      new Request('https://dev.memoryweaver.studio/api/admin/plane/issues/MW-408', {
        method: 'PATCH',
        headers: { 'sec-fetch-site': 'cross-site', origin: 'https://evil.example' },
        body: JSON.stringify({ state: 'done' }),
      }) as any,
      { params: Promise.resolve({ key: 'MW-408' }) }
    );
    expect(csrfBlocked.status).toBe(403);
  });

  it('runs pure dependency-injected runHealthProbe, enforces POST ?deep=1 cooldown + CSRF, and handles malformed checks safely in AdminHealthBar', async () => {
    expect(classifyStripeKeyMode('sk_live_abc123', 'whsec_1234567890abcdef')).toEqual({
      mode: 'LIVE',
      webhookSecretConfigured: true,
    });
    expect(classifyStripeKeyMode('sk_test_abc123', '')).toEqual({
      mode: 'TEST',
      webhookSecretConfigured: false,
    });
    expect(classifyStripeKeyMode('sk_test_placeholder_key_for_build', null)).toEqual({
      mode: 'PLACEHOLDER',
      webhookSecretConfigured: false,
    });

    const report = await runHealthProbe({
      projectId: 'memory-weaver-dev',
      deep: false,
      selfVersion: { commitSha: 'ab5e6ba', commitTimestamp: '2026-11-20T16:00:00Z', reachable: true },
      probePeerVersion: async () => ({
        commitSha: 'ab5e6ba',
        commitTimestamp: '2026-11-20T16:00:00Z',
        reachable: true,
      }),
      checkFirestore: async () => ({ ok: true, detail: 'Connected', latencyMs: 12 }),
      checkStorage: async () => ({ ok: true, detail: 'Reachable', latencyMs: 15 }),
      checkStripe: async () => ({ id: 'stripe', label: 'Stripe Billing', status: 'OK', detail: 'TEST mode' }),
      checkPlane: async () => ({ id: 'plane', label: 'Plane.so API', status: 'OK', detail: 'Connected' }),
      checkResend: async () => ({ id: 'resend', label: 'Resend Email', status: 'OK', detail: 'Configured' }),
      checkAiWeaver: async () => ({ id: 'ai_weaver', label: 'AI Weaver (Genkit)', status: 'OK', detail: 'OAuth active' }),
    });
    expect(report.overall).toBe('OK');
    expect(report.checks).toHaveLength(7);
    expect(formatHealthProbeCliLines(report)[0]).toContain('Overall: OK');

    // Route test: GET fast + POST ?deep=1 cooldown 429 + cross-site 403
    vi.doMock('@/lib/session', () => ({
      requireAdminSession: vi.fn().mockResolvedValue({
        authorized: true,
        session: { email: 'nareshmepani@googlemail.com', isAdmin: true },
      }),
    }));
    vi.doMock('@/lib/firebaseAdmin', () => ({
      adminDb: createMemoryDb(),
      adminStorage: { bucket: () => ({ exists: async () => [true] }) },
    }));
    vi.doMock('@/ai/genkit', () => ({
      resolveServiceAccountAccessToken: vi.fn().mockResolvedValue('mock-oauth-token'),
      getAI: vi.fn().mockResolvedValue({
        generate: vi.fn().mockResolvedValue({ text: 'OK' }),
      }),
    }));

    const healthRoute = await import('@/app/api/admin/health-probe/route');
    healthRoute.clearHealthProbeCooldownForTests();

    const getHealth = await healthRoute.GET();
    const getHealthJson = await getHealth.json();
    expect(getHealth.status).toBe(200);
    expect(getHealthJson.mode).toBe('FAST');
    expect(Array.isArray(getHealthJson.checks)).toBe(true);

    // Cross-origin POST blocked 403
    const badDeep = await healthRoute.POST(
      new Request('https://dev.memoryweaver.studio/api/admin/health-probe?deep=1', {
        method: 'POST',
        headers: { origin: 'https://evil.example' },
        body: JSON.stringify({ deep: true }),
      }) as any
    );
    expect(badDeep.status).toBe(403);

    // First deep POST succeeds (200), immediate second hits 15s cooldown (429)
    const deep1 = await healthRoute.POST(
      new Request('https://dev.memoryweaver.studio/api/admin/health-probe?deep=1', {
        method: 'POST',
        body: JSON.stringify({ deep: true }),
      }) as any
    );
    expect(deep1.status).toBe(200);
    const deep2 = await healthRoute.POST(
      new Request('https://dev.memoryweaver.studio/api/admin/health-probe?deep=1', {
        method: 'POST',
        body: JSON.stringify({ deep: true }),
      }) as any
    );
    expect(deep2.status).toBe(429);

    // AdminHealthBar safely degrades on malformed payload missing `checks` array
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, checks: null }) })
    );
    try {
      const { AdminHealthBar } = await import('@/components/admin/AdminHealthBar');
      const { queryByTestId } = render(React.createElement(AdminHealthBar, { compact: true }));
      await waitFor(() => {
        expect(queryByTestId('ADMIN_HEALTH_BAR')).toBeNull();
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('classifies STAGING_AHEAD + Phase-1 unbound Plane as calm INFO (overall OK), auto-expands Deep Smoke Receipt in compact mode, and derives scannable checklist bullets', async () => {
    const infoReport = await runHealthProbe({
      projectId: 'memory-weaver-dev',
      deep: true,
      selfVersion: { commitSha: '7371f89', commitTimestamp: '2026-11-20T22:26:21Z', reachable: true },
      probePeerVersion: async () => ({
        commitSha: '8051219',
        commitTimestamp: '2026-11-19T20:34:45Z',
        reachable: true,
      }),
      checkFirestore: async () => ({ ok: true, detail: 'Connected (memory-weaver-dev)', latencyMs: 18 }),
      checkStorage: async () => ({ ok: true, detail: 'Bucket reachable', latencyMs: 22 }),
      checkStripe: async () => ({ id: 'stripe', label: 'Stripe Billing', status: 'OK', detail: 'TEST mode · webhook enabled' }),
      checkPlane: async () => ({ id: 'plane', label: 'Plane.so API', status: 'INFO', detail: 'PLANE_API_KEY pending Phase 2' }),
      checkResend: async () => ({ id: 'resend', label: 'Resend Email', status: 'OK', detail: 'Domain verified (memoryweaver.studio)' }),
      checkAiWeaver: async () => ({ id: 'ai_weaver', label: 'AI Weaver (Genkit)', status: 'OK', detail: 'Live 5-token Genkit ping succeeded ("OK")' }),
    });

    expect(infoReport.overall).toBe('OK');
    expect(infoReport.corePassedCount).toBe(5);
    expect(infoReport.coreTotalCount).toBe(5);
    expect(infoReport.infoCount).toBe(2);
    expect(infoReport.checks.find((c) => c.id === 'build_parity')?.status).toBe('INFO');
    const mdReceipt = formatHealthProbeMarkdownReceipt(infoReport);
    expect(mdReceipt).toContain('✅ PASS — 5/5 Core Systems Healthy');
    expect(mdReceipt).toContain('Live 5-token Genkit ping succeeded');

    // Checklist derivation handles both explicit checklistSteps and legacy prose summary
    expect(deriveControlChecklistSteps(DEFAULT_RELEASE_CONTROL_SEEDS[0]).length).toBe(3);
    const legacySteps = deriveControlChecklistSteps({
      summary: 'Upload live keys to Secret Manager, register canonical webhook endpoint, and trigger a fresh master rollout.',
    });
    expect(legacySteps.length).toBe(3);

    // Compact AdminHealthBar starts collapsed on fast GET, then auto-expands ADMIN_HEALTH_RECEIPT on Run Deep Smoke Test
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const isDeep = String(url).includes('deep=1') || init?.method === 'POST';
      return {
        ok: true,
        json: async () => ({
          success: true,
          ...infoReport,
          mode: isDeep ? 'DEEP' : 'FAST',
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const { AdminHealthBar } = await import('@/components/admin/AdminHealthBar');
      render(React.createElement(AdminHealthBar, { compact: true }));

      await waitFor(() => {
        expect(screen.getByTestId('ADMIN_HEALTH_VERDICT')).toHaveTextContent(
          '✅ PASS — 5/5 Core Systems Healthy'
        );
      });
      // Collapsed by default in compact mode
      expect(screen.queryByTestId('ADMIN_HEALTH_RECEIPT')).toBeNull();

      // Clicking Run Deep Smoke Test auto-expands receipt with full proof lines + Collapse/Copy controls
      fireEvent.click(screen.getByTestId('ADMIN_HEALTH_DEEP_BTN'));
      await waitFor(() => {
        expect(screen.getByTestId('ADMIN_HEALTH_RECEIPT')).toBeInTheDocument();
      });
      expect(screen.getByTestId('ADMIN_HEALTH_RECEIPT')).toHaveTextContent(
        'Live 5-token Genkit ping succeeded'
      );
      expect(screen.getByTestId('ADMIN_HEALTH_COPY_BTN')).toBeInTheDocument();

      // Clicking Collapse collapses the receipt cleanly
      fireEvent.click(screen.getByTestId('ADMIN_HEALTH_TOGGLE_RECEIPT_BTN'));
      expect(screen.queryByTestId('ADMIN_HEALTH_RECEIPT')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
