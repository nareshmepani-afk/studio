import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildSeededReleaseControl,
  computeInboxBadgeCounts,
  DEFAULT_RELEASE_CONTROL_SEEDS,
  evaluateReleaseControlTransition,
  formatReleaseControlForPlane,
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
  const originalProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = originalProjectId;
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
});
