import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import {
  deriveBugCardPresentation,
  doesCommitShaMatchLive,
  formatPlaneBrowseUrl,
  sanitizeBugDeepLinkRoute,
  type BugReportRecord,
} from '@/lib/bugReports';
import { BugTriageConsole } from '@/components/admin/BugTriageConsole';
import { injectFounderSignOffBanner } from '@/app/admin/qa/route';

describe('Option B Fast Sign-Off Queue & /admin/qa-Grade Sign-Off Cards (MW-432)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('validates commit SHA matching, Plane browse URLs, deep-link route sanitization, and derived human card titles/steps', () => {
    expect(doesCommitShaMatchLive('73b480147fc6', '73b4801')).toBe(true);
    expect(doesCommitShaMatchLive('73b4801', '73b4801')).toBe(true);
    expect(doesCommitShaMatchLive('039bf36', '73b4801')).toBe(false);
    expect(doesCommitShaMatchLive(null, '73b4801')).toBe(false);

    expect(formatPlaneBrowseUrl('MW-411')).toBe('https://app.plane.so/memory-weaver-studio/browse/MW-411/');
    expect(formatPlaneBrowseUrl('mw-411')).toBe('https://app.plane.so/memory-weaver-studio/browse/MW-411/');
    expect(formatPlaneBrowseUrl('invalid')).toBeNull();

    expect(sanitizeBugDeepLinkRoute('/studio/production/0xuACyXAE3uFDuahqfd8')).toBe(
      '/studio/production/0xuACyXAE3uFDuahqfd8'
    );
    expect(sanitizeBugDeepLinkRoute('//evil.example.com')).toBe('/');
    expect(sanitizeBugDeepLinkRoute('https://evil.example.com')).toBe('/');

    const derived = deriveBugCardPresentation({
      reportId: 'bug_mw_427_fireside_2_0',
      path: '/studio/fireside?id=part-1-scene-1',
      description: '[ENV: BOTH] Fireside 2.0 Mobile UX: 52px top bar + slide-up Bottom Sheets',
      resolutionNotes: 'Verified at 412x968.',
      environmentHost: 'https://dev.memoryweaver.studio',
    });
    expect(derived.title).toBe('Fireside 2.0 Mobile UX');
    expect(derived.routePathname).toBe('/studio/fireside');
    expect(derived.fullTestUrl).toBe('https://dev.memoryweaver.studio/studio/fireside?id=part-1-scene-1');
    expect(derived.testSteps.length).toBeGreaterThanOrEqual(2);
    expect(derived.verificationChecks.length).toBeGreaterThanOrEqual(2);
  });

  it('renders /admin/qa-grade Sign-Off Card without duplicating FIXED_ON_DEV items, hides raw engineering fields by default, and signs off PASS -> VERIFIED', async () => {
    const fixedReport: BugReportRecord = {
      reportId: 'bug_1795020000_abc123',
      traceId: 'mw_telemetry_yho6skt5tei',
      userId: 'dNq8qhzsz1WPpRarKwJBe5EpQYX2',
      userEmail: 'nareshmepani@googlemail.com',
      path: '/studio/production/0xuACyXAE3uFDuahqfd8',
      appVersion: 'v1.1.0-beta',
      userAgent: 'Chrome',
      title: 'Soundstage Header Badges & Hover Tooltips',
      description: 'Header badges looked like clicked buttons without tooltips.',
      testSteps: [
        'Open https://dev.memoryweaver.studio/studio/production/0xuACyXAE3uFDuahqfd8.',
        'Hover over the top Studio Master badge.',
      ],
      verificationChecks: [
        'Passive status pill does not look like a pressed button.',
        'Hovering displays the explanatory tooltip.',
      ],
      status: 'FIXED_ON_DEV',
      createdAt: 1795020000000,
      createdAtIso: '2026-11-18T16:00:00.000Z',
      updatedAt: 1795020000000,
      environmentHost: 'https://dev.memoryweaver.studio',
      planeIssueId: 'MW-411',
      fixedInCommitSha: '73b4801',
      cardId: 12,
      resolutionNotes: 'Defaulted Desktop Soundstage drafts to Studio Master & added tooltips.',
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/version')) {
        return new Response(JSON.stringify({ commitSha: '73b4801' }), { status: 200 });
      }
      if (url.includes('/api/admin/plane/issues/MW-411')) {
        return new Response(
          JSON.stringify({
            success: true,
            configured: true,
            key: 'MW-411',
            issue: {
              id: 'issue-uuid-411',
              key: 'MW-411',
              sequenceId: 411,
              projectId: 'ef45f4c8-ea7e-490d-8282-e959e484ae07',
              name: 'Header tooltips fix',
              descriptionText: 'Verified plain-text description.',
              priority: 'medium',
              stateId: 'st-1',
              stateName: 'In Progress',
              stateGroup: 'started',
              createdAt: '2026-11-18T16:00:00Z',
              updatedAt: '2026-11-18T16:10:00Z',
            },
            comments: [],
            states: [{ id: 'st-1', name: 'In Progress', group: 'started' }],
          }),
          { status: 200 }
        );
      }
      if (url.includes('/api/admin/bugs') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify({ success: true, reports: [fixedReport] }), { status: 200 });
      }
      if (url.includes('/api/admin/bugs') && init?.method === 'PATCH') {
        const body = JSON.parse(String(init.body || '{}'));
        return new Response(
          JSON.stringify({ success: true, ...body, planeSync: { attempted: true, ok: true, issueKey: 'MW-411' } }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    global.fetch = fetchMock as any;

    const { container, getByTestId, queryByTestId } = render(React.createElement(BugTriageConsole));

    await waitFor(() => {
      expect(getByTestId('READY_FOR_FOUNDER_SIGNOFF_SECTION')).toBeDefined();
    });

    expect(getByTestId('LIVE_STAGING_SHA_BADGE').textContent).toContain('73b4801');

    // Deduplicated: FIXED_ON_DEV card renders ONCE in sign-off section and NOT duplicated below
    expect(getByTestId('signoff-card-bug_1795020000_abc123')).toBeDefined();
    expect(queryByTestId('bug-report-card-bug_1795020000_abc123')).toBeNull();

    // Human title, numbered steps, interactive assertion checkboxes, and collapsed engineering metadata
    expect(getByTestId('bug-card-title-bug_1795020000_abc123').textContent).toBe(
      'Soundstage Header Badges & Hover Tooltips'
    );
    expect(queryByTestId('eng-meta-panel-bug_1795020000_abc123')).toBeNull();
    const check0 = getByTestId('bug-assertion-check-bug_1795020000_abc123-0') as HTMLInputElement;
    expect(check0.checked).toBe(false);
    fireEvent.click(check0);
    expect(check0.checked).toBe(true);

    // Zero outbound app.plane.so links; clicking MW-411 opens in-app PlaneTicketDrawer
    expect(container.querySelectorAll('a[href*="app.plane.so"]')).toHaveLength(0);
    const planeBtn = getByTestId('signoff-plane-link-bug_1795020000_abc123');
    expect(planeBtn.tagName).toBe('BUTTON');
    fireEvent.click(planeBtn);

    await waitFor(() => {
      expect(getByTestId('PLANE_TICKET_DRAWER')).toBeDefined();
      expect(getByTestId('PLANE_DRAWER_TITLE').textContent).toContain('Header tooltips fix');
    });
    fireEvent.click(getByTestId('PLANE_DRAWER_CLOSE'));

    const shaBadge = getByTestId('signoff-sha-badge-bug_1795020000_abc123');
    expect(shaBadge.textContent).toContain('Live Fix: 73b4801');
    expect(shaBadge.className).toContain('text-emerald-300');

    const routeBtn = getByTestId('signoff-open-route-bug_1795020000_abc123') as HTMLAnchorElement;
    expect(routeBtn.getAttribute('href')).toBe('/studio/production/0xuACyXAE3uFDuahqfd8');

    const qaLink = getByTestId('signoff-qa-link-bug_1795020000_abc123') as HTMLAnchorElement;
    expect(qaLink.getAttribute('href')).toBe('/admin/qa#card-12');

    // MW-434 (Option 1A): Unclicked PASS / FAIL / BACKLOG start in neutral dark outline with NO ✓ icon on load
    const passBtn = getByTestId('signoff-verified-bug_1795020000_abc123');
    expect(passBtn.className).toContain('bg-slate-900');
    expect(passBtn.className).not.toContain('bg-emerald-500');
    expect(passBtn.querySelector('svg')).toBeNull();
    expect(getByTestId('signoff-reopen-bug_1795020000_abc123').querySelector('svg')).toBeNull();
    expect(getByTestId('verdict-backlog-bug_1795020000_abc123').querySelector('svg')).toBeNull();
    expect(getByTestId('verdict-reset-bug_1795020000_abc123')).toBeDefined();

    // Click PASS -> PATCH status: 'VERIFIED' and removes card from Ready for Sign-Off section
    fireEvent.click(passBtn);

    await waitFor(() => {
      expect(queryByTestId('READY_FOR_FOUNDER_SIGNOFF_SECTION')).toBeNull();
    });

    const patchCall = fetchMock.mock.calls.find(
      ([u, i]) => String(u).includes('/api/admin/bugs') && i?.method === 'PATCH'
    );
    expect(patchCall).toBeDefined();
    expect(JSON.parse(String(patchCall![1]!.body))).toEqual({
      reportId: 'bug_1795020000_abc123',
      status: 'VERIFIED',
    });
  });

  it('FAIL transitions FIXED_ON_DEV report to OPEN, expands inline Founder Feedback + Console/Telemetry drawer, and supports BACKLOG -> TRIAGED', async () => {
    const fixedReport: BugReportRecord = {
      reportId: 'bug_reopen_test',
      traceId: 'mw_telemetry_reopen',
      userId: 'u1',
      userEmail: 'tester@example.com',
      path: '/studio',
      appVersion: 'v1.1.0-beta',
      userAgent: 'Chrome',
      description: 'Test reopen flow',
      status: 'FIXED_ON_DEV',
      createdAt: 1795020000000,
      createdAtIso: '2026-11-18T16:00:00.000Z',
      updatedAt: 1795020000000,
      environmentHost: 'https://dev.memoryweaver.studio',
      planeIssueId: 'MW-412',
      fixedInCommitSha: 'abcdef1',
      resolutionNotes: 'Attempted fix',
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/version')) {
        return new Response(JSON.stringify({ commitSha: '73b4801' }), { status: 200 });
      }
      if (url.includes('/api/admin/bugs') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify({ success: true, reports: [fixedReport] }), { status: 200 });
      }
      if (url.includes('/api/admin/bugs') && init?.method === 'PATCH') {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    global.fetch = fetchMock as any;

    const { getByTestId, queryByTestId } = render(React.createElement(BugTriageConsole));

    await waitFor(() => {
      expect(getByTestId('signoff-reopen-bug_reopen_test')).toBeDefined();
    });

    fireEvent.click(getByTestId('signoff-reopen-bug_reopen_test'));

    await waitFor(() => {
      expect(queryByTestId('READY_FOR_FOUNDER_SIGNOFF_SECTION')).toBeNull();
    });

    // Card remains visible in Action Queue as OPEN with Founder Feedback + Console/Telemetry drawer expanded!
    expect(screen.getByTestId('founder-feedback-drawer-bug_reopen_test')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('founder-feedback-input-bug_reopen_test'), {
      target: { value: 'Mobile menu sheet overlapped bottom bar.' },
    });
    fireEvent.change(screen.getByTestId('founder-telemetry-input-bug_reopen_test'), {
      target: { value: 'mw_telemetry_test_99' },
    });
    fireEvent.click(screen.getByTestId('verdict-backlog-bug_reopen_test'));

    await waitFor(() => {
      const calls = fetchMock.mock.calls.filter(
        ([u, i]) => String(u).includes('/api/admin/bugs') && i?.method === 'PATCH'
      );
      expect(calls.length).toBeGreaterThanOrEqual(2);
      expect(JSON.parse(String(calls[0][1]!.body))).toEqual({
        reportId: 'bug_reopen_test',
        status: 'OPEN',
      });
      expect(JSON.parse(String(calls[1][1]!.body))).toEqual({
        reportId: 'bug_reopen_test',
        status: 'TRIAGED',
        founderFeedback: 'Mobile menu sheet overlapped bottom bar.',
        telemetryTrace: 'mw_telemetry_test_99',
      });
    });

    // MW-434: Clicking ↺ Reset on a TRIAGED/VERIFIED card restores READY FOR SIGN-OFF (FIXED_ON_DEV)
    fireEvent.click(screen.getByTestId('verdict-reset-bug_reopen_test'));

    await waitFor(() => {
      expect(getByTestId('READY_FOR_FOUNDER_SIGNOFF_SECTION')).toBeDefined();
      const calls = fetchMock.mock.calls.filter(
        ([u, i]) => String(u).includes('/api/admin/bugs') && i?.method === 'PATCH'
      );
      expect(calls.length).toBeGreaterThanOrEqual(3);
      expect(JSON.parse(String(calls[2][1]!.body))).toEqual({
        reportId: 'bug_reopen_test',
        status: 'FIXED_ON_DEV',
        checkedIndices: [],
      });
    });
  });

  it('(1B) injectFounderSignOffBanner injects the live Sign-Off Queue counter & link into /admin/qa HTML without mutating card anchors', () => {
    const sampleHtml = '<!DOCTYPE html><html><body class="min-h-screen"><header>HUD</header></body></html>';
    const injected = injectFounderSignOffBanner(sampleHtml);
    expect(injected).toContain('id="mw-founder-signoff-bridge-banner"');
    expect(injected).toContain('href="/admin?suite=bugs"');
    expect(injected).toContain("fetch('/api/admin/bugs'");
    expect(injected).toContain('<header>HUD</header>');
  });
});
