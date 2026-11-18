import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import {
  doesCommitShaMatchLive,
  formatPlaneBrowseUrl,
  sanitizeBugDeepLinkRoute,
  type BugReportRecord,
} from '@/lib/bugReports';
import { BugTriageConsole } from '@/components/admin/BugTriageConsole';

describe('Option B Fast Sign-Off Queue & Unified Bug Pipeline', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('validates commit SHA matching, Plane browse URLs, and deep-link route sanitization', () => {
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
  });

  it('renders Ready for Founder Sign-Off queue with Plane badge, green live SHA badge, Open Exact Route, QA Card pill, and Verified/Reopen buttons', async () => {
    const fixedReport: BugReportRecord = {
      reportId: 'bug_1795020000_abc123',
      traceId: 'mw_telemetry_yho6skt5tei',
      userId: 'dNq8qhzsz1WPpRarKwJBe5EpQYX2',
      userEmail: 'nareshmepani@googlemail.com',
      path: '/studio/production/0xuACyXAE3uFDuahqfd8',
      appVersion: 'v1.1.0-beta',
      userAgent: 'Chrome',
      description: 'Header badges looked like clicked buttons without tooltips.',
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
      if (url.includes('/api/admin/bugs') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify({ success: true, reports: [fixedReport] }), { status: 200 });
      }
      if (url.includes('/api/admin/bugs') && init?.method === 'PATCH') {
        const body = JSON.parse(String(init.body || '{}'));
        return new Response(JSON.stringify({ success: true, ...body }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    global.fetch = fetchMock as any;

    const { getByTestId, queryByTestId } = render(React.createElement(BugTriageConsole));

    await waitFor(() => {
      expect(getByTestId('READY_FOR_FOUNDER_SIGNOFF_SECTION')).toBeDefined();
    });

    expect(getByTestId('LIVE_STAGING_SHA_BADGE').textContent).toContain('73b4801');
    const planeLink = getByTestId('signoff-plane-link-bug_1795020000_abc123') as HTMLAnchorElement;
    expect(planeLink.getAttribute('href')).toBe('https://app.plane.so/memory-weaver-studio/browse/MW-411/');

    const shaBadge = getByTestId('signoff-sha-badge-bug_1795020000_abc123');
    expect(shaBadge.textContent).toContain('Live Fix: 73b4801');
    expect(shaBadge.className).toContain('text-emerald-300');

    const routeBtn = getByTestId('signoff-open-route-bug_1795020000_abc123') as HTMLAnchorElement;
    expect(routeBtn.getAttribute('href')).toBe('/studio/production/0xuACyXAE3uFDuahqfd8');

    const qaLink = getByTestId('signoff-qa-link-bug_1795020000_abc123') as HTMLAnchorElement;
    expect(qaLink.getAttribute('href')).toBe('/admin/qa#card-12');

    // Click Sign Off (Verified) -> PATCH status: 'VERIFIED' and removes card from Ready for Sign-Off section
    fireEvent.click(getByTestId('signoff-verified-bug_1795020000_abc123'));

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

  it('Still Broken (Reopen) transitions FIXED_ON_DEV report back to OPEN', async () => {
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

    const patchCall = fetchMock.mock.calls.find(
      ([u, i]) => String(u).includes('/api/admin/bugs') && i?.method === 'PATCH'
    );
    expect(JSON.parse(String(patchCall![1]!.body))).toEqual({
      reportId: 'bug_reopen_test',
      status: 'OPEN',
    });
  });
});
