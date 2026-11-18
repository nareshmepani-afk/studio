import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import {
  DEFAULT_FOUNDER_DECISION_SEEDS,
  FOUNDER_DECISIONS_COLLECTION,
} from '@/lib/founderDecisions';

function createDecisionsFirestore(seed: Record<string, Record<string, any>> = {}) {
  const store = new Map<string, Record<string, any>>();
  for (const [k, v] of Object.entries(seed)) {
    store.set(k, { ...v });
  }

  return {
    _store: store,
    collection: (name: string) => ({
      doc: (docId: string) => ({
        id: docId,
        async get() {
          const data = name === FOUNDER_DECISIONS_COLLECTION ? store.get(docId) : undefined;
          return {
            exists: Boolean(data),
            id: docId,
            data: () => (data ? { ...data } : undefined),
          };
        },
        async set(data: Record<string, any>, options?: { merge?: boolean }) {
          if (name !== FOUNDER_DECISIONS_COLLECTION) return;
          const prev = options?.merge ? store.get(docId) || {} : {};
          store.set(docId, { ...prev, ...data });
        },
      }),
      orderBy: (field: string, dir: 'asc' | 'desc' = 'asc') => ({
        limit: (max: number) => ({
          async get() {
            const docs = Array.from(store.entries())
              .map(([id, data]) => ({ id, data: () => ({ ...data }) }))
              .sort((a, b) => {
                const av = Number(a.data()[field] || 0);
                const bv = Number(b.data()[field] || 0);
                return dir === 'asc' ? av - bv : bv - av;
              })
              .slice(0, max);
            return { docs };
          },
        }),
      }),
    }),
  };
}

describe('Founder Decision Queue (/api/admin/decisions, Form & CLI)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('pre-seeds the 4 cutover decision cards with valid recommendations and verified resource IDs', () => {
    const ids = DEFAULT_FOUNDER_DECISION_SEEDS.map((s) => s.id);
    expect(ids).toEqual([
      'mw-409-prod-qa-purge',
      'mw-408-prod-web-app-id',
      'mw-408-auth-recaptcha-domains',
      'mw-405-plane-token-rotation',
    ]);

    for (const seed of DEFAULT_FOUNDER_DECISION_SEEDS) {
      expect(seed.options.some((o) => o.id === seed.recommendedOptionId && o.recommended)).toBe(true);
      expect(seed.externalLinks.length).toBeGreaterThan(0);
    }

    const webAppCard = DEFAULT_FOUNDER_DECISION_SEEDS.find((s) => s.id === 'mw-408-prod-web-app-id')!;
    expect(webAppCard.summary).toContain('f48699405c37bcf4567692');
    expect(webAppCard.summary).toContain('e2b08f9187175693567692');
  });

  it('fails closed on unauthenticated GET and auto-seeds / persists founder decisions for admins', async () => {
    const memDb = createDecisionsFirestore();
    const requireAdminMock = vi.fn();

    vi.doMock('@/lib/firebaseAdmin', () => ({ adminDb: memDb }));
    vi.doMock('@/lib/session', () => ({ requireAdminSession: requireAdminMock }));

    const routeMod = await import('@/app/api/admin/decisions/route');

    // 1. Unauthenticated rejected cleanly
    requireAdminMock.mockResolvedValue({
      authorized: false,
      status: 401,
      error: 'Unauthorized',
    });
    const unauthRes = await routeMod.GET();
    expect(unauthRes.status).toBe(401);

    // 2. Authorized first GET seeds all 4 decisions cleanly
    requireAdminMock.mockResolvedValue({
      authorized: true,
      session: { email: 'naresh@memoryweaver.studio', isAdmin: true },
    });

    const firstGet = await routeMod.GET();
    const firstJson = await firstGet.json();
    expect(firstGet.status).toBe(200);
    expect(firstJson.decisions).toHaveLength(4);
    expect(firstJson.counts).toEqual({ total: 4, decided: 0, deferred: 0, pending: 4 });
    expect(firstJson.decisions[0].selectedOptionId).toBe(firstJson.decisions[0].recommendedOptionId);

    // 3. Batch POST saves choices, notes & Plane deferral
    const saveRes = await routeMod.POST(
      new Request('https://dev.memoryweaver.studio/api/admin/decisions', {
        method: 'POST',
        body: JSON.stringify({
          decisions: [
            {
              id: 'mw-409-prod-qa-purge',
              selectedOptionId: 'approve_now',
              deferredToPlane: false,
              notes: 'Run before merging dev -> master.',
            },
            {
              id: 'mw-405-plane-token-rotation',
              selectedOptionId: 'rotate_after_walkthrough',
              deferredToPlane: true,
              notes: 'Handle after Stripe live switch prep.',
            },
          ],
        }),
      }) as any
    );
    const saveJson = await saveRes.json();
    expect(saveRes.status).toBe(200);
    expect(saveJson.counts).toEqual({ total: 4, decided: 1, deferred: 1, pending: 2 });

    // 4. Subsequent GET preserves saved choices without resetting defaults
    const secondGet = await routeMod.GET();
    const secondJson = await secondGet.json();
    const purgeCard = secondJson.decisions.find((d: any) => d.id === 'mw-409-prod-qa-purge');
    const planeCard = secondJson.decisions.find((d: any) => d.id === 'mw-405-plane-token-rotation');
    expect(purgeCard.status).toBe('DECIDED');
    expect(purgeCard.notes).toBe('Run before merging dev -> master.');
    expect(planeCard.status).toBe('DEFERRED_TO_PLANE');
    expect(planeCard.deferredToPlane).toBe(true);
  });

  it('renders FounderDecisionForm with pre-selected options, Plane defer button, notes, and 1-click Save Decisions', async () => {
    const initialDecisions = DEFAULT_FOUNDER_DECISION_SEEDS.map((s, idx) => ({
      ...s,
      order: idx + 1,
      selectedOptionId: s.recommendedOptionId,
      status: 'PENDING',
      deferredToPlane: false,
      notes: '',
      createdAt: 1000,
      updatedAt: 1000,
    }));

    const fetchMock = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      if (!init || !init.method || init.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            decisions: initialDecisions,
            counts: { total: 4, decided: 0, deferred: 0, pending: 4 },
          }),
        };
      }
      const parsedBody = JSON.parse(String(init.body || '{}'));
      return {
        ok: true,
        json: async () => ({
          success: true,
          decisions: initialDecisions.map((c) => {
            const patch = parsedBody.decisions.find((p: any) => p.id === c.id);
            return patch ? { ...c, ...patch } : c;
          }),
          counts: { total: 4, decided: 3, deferred: 1, pending: 0 },
        }),
      };
    });

    vi.stubGlobal('fetch', fetchMock);
    const { FounderDecisionForm } = await import('@/components/admin/FounderDecisionForm');

    render(React.createElement(FounderDecisionForm));

    await waitFor(() => {
      expect(screen.getByTestId('FOUNDER_DECISION_CARD_mw-409-prod-qa-purge')).toBeInTheDocument();
    });

    // Click Defer to Plane Ticket on mw-405-plane-token-rotation
    fireEvent.click(screen.getByTestId('DECISION_DEFER_mw-405-plane-token-rotation'));

    // Add founder note to MW-409 card
    const noteBoxes = screen.getAllByPlaceholderText(/Optional founder notes/i);
    fireEvent.change(noteBoxes[0], { target: { value: 'Approved for cutover.' } });

    // Save Decisions
    fireEvent.click(screen.getByTestId('FOUNDER_SAVE_DECISIONS_BTN'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const postCall = fetchMock.mock.calls[1];
    const submitted = JSON.parse(postCall[1].body);
    const mw409Submitted = submitted.decisions.find((d: any) => d.id === 'mw-409-prod-qa-purge');
    const mw405Submitted = submitted.decisions.find((d: any) => d.id === 'mw-405-plane-token-rotation');
    expect(mw409Submitted.status).toBe('DECIDED');
    expect(mw409Submitted.notes).toBe('Approved for cutover.');
    expect(mw405Submitted.status).toBe('DEFERRED_TO_PLANE');
    expect(mw405Submitted.deferredToPlane).toBe(true);

    vi.unstubAllGlobals();
  });

  it('formats CLI decision output clearly in read-founder-decisions script', async () => {
    const { formatFounderDecisionSummary } = await import('../../scripts/read-founder-decisions');
    const out = formatFounderDecisionSummary({
      ...DEFAULT_FOUNDER_DECISION_SEEDS[0],
      selectedOptionId: 'approve_now',
      status: 'DECIDED',
      deferredToPlane: false,
      notes: 'Go ahead',
      createdAt: 1,
      updatedAt: 2,
      updatedAtIso: '2026-11-18T08:35:00.000Z',
      decidedBy: 'naresh@memoryweaver.studio',
    });

    expect(out).toContain('[DECIDED] MW-409');
    expect(out).toContain('approve_now:');
    expect(out).toContain('Notes: Go ahead');
  });

  it('renders prominent error banner when fetch fails with 403 Forbidden and offers retry', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: 'Forbidden: MFA-verified admin claim required. Please re-authenticate via /admin/login',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);
    const { FounderDecisionForm } = await import('@/components/admin/FounderDecisionForm');

    render(React.createElement(FounderDecisionForm));

    await waitFor(() => {
      expect(screen.getByTestId('FOUNDER_DECISIONS_ERROR_BANNER')).toBeInTheDocument();
      expect(screen.getByText(/MFA-verified admin claim required/i)).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it('supports re-seeding cutover decisions via POST { action: "seed" }', async () => {
    const memDb = createDecisionsFirestore();
    const requireAdminMock = vi.fn().mockResolvedValue({
      authorized: true,
      session: { email: 'naresh@memoryweaver.studio', isAdmin: true, mfaVerified: true },
    });

    vi.doMock('@/lib/firebaseAdmin', () => ({ adminDb: memDb }));
    vi.doMock('@/lib/session', () => ({ requireAdminSession: requireAdminMock }));

    const routeMod = await import('@/app/api/admin/decisions/route');
    const req = {
      json: async () => ({ action: 'seed' }),
    } as any;

    const res = await routeMod.POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.decisions.length).toBe(4);
    expect(body.counts.total).toBe(4);
  });

  it('formats deferred founder decision for Plane issue creation and auto-syncs via --sync-plane', async () => {
    const { formatFounderDecisionForPlane } = await import('../../scripts/read-founder-decisions');
    const d = {
      ...DEFAULT_FOUNDER_DECISION_SEEDS[3], // MW-405
      status: 'DEFERRED_TO_PLANE' as const,
      deferredToPlane: true,
      selectedOptionId: 'rotate_after_walkthrough',
      notes: 'Deferred to Plane sprint backlog.',
      createdAt: 1000,
      updatedAt: 2000,
      updatedAtIso: '2026-11-18T12:00:00.000Z',
      decidedBy: 'founder@memoryweaver.studio',
    };

    const formatted = formatFounderDecisionForPlane(d);
    expect(formatted.title).toBe('[DEFERRED DECISION] MW-405 — Schedule Plane.so API Key Rotation');
    expect(formatted.description).toContain('**Decision ID:** mw-405-plane-token-rotation');
    expect(formatted.description).toContain('**Status:** DEFERRED_TO_PLANE');
    expect(formatted.description).toContain('**Founder Notes:** Deferred to Plane sprint backlog.');
    expect(formatted.description).toContain('### Available Options');
    expect(formatted.description).toContain('rotate_after_walkthrough');
  });
});
