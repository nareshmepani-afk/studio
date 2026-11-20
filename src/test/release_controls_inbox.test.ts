import fs from 'fs';
import path from 'path';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import {
  buildSeededReleaseControl,
  computeInboxBadgeCounts,
  DEFAULT_RELEASE_CONTROL_SEEDS,
  evaluateEnvironmentParity,
  evaluateReleaseControlTransition,
  formatReleaseControlForPlane,
  formatThreeZoneRadar,
  getReleaseControlTargetMeta,
  sortReleaseControls,
} from '@/lib/releaseControls';

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

  it('enforces RED vs AMBER state transitions and 1A knock-on acknowledgement on RED defer', () => {
    const redRecord = buildSeededReleaseControl(DEFAULT_RELEASE_CONTROL_SEEDS[0], 1000);
    const amberRecord = buildSeededReleaseControl(DEFAULT_RELEASE_CONTROL_SEEDS[3], 1000);

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
    const record = buildSeededReleaseControl(DEFAULT_RELEASE_CONTROL_SEEDS[0], 5000);

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
    const list = DEFAULT_RELEASE_CONTROL_SEEDS.map((s) => buildSeededReleaseControl(s, 1000));
    const sorted = sortReleaseControls(list);
    expect(sorted[0].severity).toBe('RED');

    const badges = computeInboxBadgeCounts({
      controls: sorted,
      pendingDecisionsCount: 1,
      readyBugsCount: 2,
    });
    expect(badges).toEqual({
      red: 3,
      amber: 2, // 1 AMBER control + 1 pending decision
      approvedAwaitingCli: 0,
      readySignOff: 2,
      pendingDecisions: 1,
      totalActionable: 7,
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

  it('FounderInboxConsole renders high-contrast [ENV: PROD] cue, deduplicated Open MW-408 link, safe span fallback, and clickable ledger links', async () => {
    const originalSlug = process.env.NEXT_PUBLIC_PLANE_WORKSPACE_SLUG;
    process.env.NEXT_PUBLIC_PLANE_WORKSPACE_SLUG = '   '; // Verify whitespace falls back cleanly to memory-weaver-studio

    const prodCard = buildSeededReleaseControl(DEFAULT_RELEASE_CONTROL_SEEDS[2], 1000); // ctrl-stripe-live-mode-switch (MW-408, [ENV: PROD])
    const amberCardWithInvalidRef = {
      ...buildSeededReleaseControl(DEFAULT_RELEASE_CONTROL_SEEDS[3], 1000),
      ticketRefs: ['MW-405', 'EXTERNAL-99'],
    };
    const deferredLedgerCard = {
      ...buildSeededReleaseControl(DEFAULT_RELEASE_CONTROL_SEEDS[0], 1000),
      status: 'DEFERRED_TO_PLANE' as const,
      planeDeferredRef: 'MW-419',
      ticketRefs: ['MW-414'],
    };

    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).includes('/api/admin/controls')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            controls: [prodCard, amberCardWithInvalidRef, deferredLedgerCard],
            pendingDecisions: [],
            readyBugs: [],
            badges: {
              red: 1,
              amber: 1,
              approvedAwaitingCli: 0,
              readySignOff: 0,
              pendingDecisions: 0,
              totalActionable: 2,
            },
            parity: evaluateEnvironmentParity(
              { commitSha: '5a07a0d', commitTimestamp: '2026-11-20T14:33:14Z' },
              { commitSha: '8051219', commitTimestamp: '2026-11-19T20:34:45Z' }
            ),
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ commitSha: '5a07a0d', environment: 'staging' }),
      };
    });

    vi.stubGlobal('fetch', fetchMock);
    try {
      const { FounderInboxConsole } = await import('@/components/admin/FounderInboxConsole');
      render(React.createElement(FounderInboxConsole));

      await waitFor(() => {
        expect(screen.getByTestId('RELEASE_CONTROL_CARD_ctrl-stripe-live-mode-switch')).toBeInTheDocument();
      });

      const prodEl = screen.getByTestId('RELEASE_CONTROL_CARD_ctrl-stripe-live-mode-switch');
      expect(within(prodEl).getByTestId('RELEASE_TARGET_BADGE_ctrl-stripe-live-mode-switch')).toHaveTextContent(
        '[ENV: PROD] • memoryweaver.studio'
      );
      expect(within(prodEl).getByTestId('RELEASE_TARGET_SCOPE_ctrl-stripe-live-mode-switch')).toHaveTextContent(
        'Targets Live Production (memoryweaver.studio / memory-weaver-8rk9t)'
      );

      // Deduplicated: exactly ONE Open MW-408 anchor and zero duplicate passive MW-408 spans
      const mw408Links = within(prodEl).getAllByRole('link', { name: /Open MW-408/i });
      expect(mw408Links).toHaveLength(1);
      expect(mw408Links[0]).toHaveAttribute('href', 'https://app.plane.so/memory-weaver-studio/browse/MW-408/');
      expect(mw408Links[0]).toHaveAttribute('target', '_blank');
      expect(mw408Links[0]).toHaveAttribute('rel', 'noopener noreferrer');
      expect(within(prodEl).queryAllByText('MW-408')).toHaveLength(0);

      // Invalid ref on AMBER card falls back to plain span (no broken anchor)
      const amberEl = screen.getByTestId('RELEASE_CONTROL_CARD_ctrl-rotate-plane-api-key');
      const mw405Link = within(amberEl).getByRole('link', { name: /Open MW-405/i });
      expect(mw405Link).toHaveAttribute('href', 'https://app.plane.so/memory-weaver-studio/browse/MW-405/');
      const invalidSpan = within(amberEl).getByText('EXTERNAL-99');
      expect(invalidSpan.tagName).toBe('SPAN');

      // Expand Ledger and verify clickable planeDeferredRef (MW-419)
      fireEvent.click(screen.getByText(/Deferred & Executed Release Ledger/i));
      const deferredLink = screen.getByRole('link', { name: /Open MW-419/i });
      expect(deferredLink).toHaveAttribute('href', 'https://app.plane.so/memory-weaver-studio/browse/MW-419/');
      expect(deferredLink).toHaveAttribute('rel', 'noopener noreferrer');
    } finally {
      vi.unstubAllGlobals();
      if (originalSlug === undefined) delete process.env.NEXT_PUBLIC_PLANE_WORKSPACE_SLUG;
      else process.env.NEXT_PUBLIC_PLANE_WORKSPACE_SLUG = originalSlug;
    }
  });
});
