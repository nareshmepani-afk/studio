'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  GitCommit,
  ClipboardList,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BUG_REPORT_STATUSES,
  doesCommitShaMatchLive,
  sanitizeBugDeepLinkRoute,
  type BugReportRecord,
  type BugReportStatus,
} from '@/lib/bugReports';
import { normalisePlaneIssueKey } from '@/lib/planeTypes';
import { PlaneTicketDrawer } from './PlaneTicketDrawer';

const STATUS_STYLES: Record<BugReportStatus, string> = {
  OPEN: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  TRIAGED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  FIXED_ON_DEV: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  VERIFIED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

export function BugTriageConsole() {
  const [reports, setReports] = useState<BugReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCommitSha, setLiveCommitSha] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [highlightTraceId, setHighlightTraceId] = useState<string>('');
  const [highlightReportId, setHighlightReportId] = useState<string>('');
  const [highlightUserId, setHighlightUserId] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftPlaneIds, setDraftPlaneIds] = useState<Record<string, string>>({});
  const [draftCommitShas, setDraftCommitShas] = useState<Record<string, string>>({});
  const [activePlaneKey, setActivePlaneKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      setHighlightTraceId(sp.get('traceId') || '');
      setHighlightReportId(sp.get('reportId') || '');
      setHighlightUserId(sp.get('userId') || '');
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [bugsRes, versionRes] = await Promise.all([
        fetch('/api/admin/bugs', { cache: 'no-store' }),
        fetch('/api/version', { cache: 'no-store' }).catch(() => null),
      ]);

      if (versionRes && versionRes.ok) {
        const versionData = await versionRes.json().catch(() => null);
        if (versionData?.commitSha) {
          setLiveCommitSha(String(versionData.commitSha));
        }
      }

      const data = await bugsRes.json();
      if (!bugsRes.ok || !data.success) {
        throw new Error(data.error || 'Failed to load bug reports');
      }
      const list: BugReportRecord[] = data.reports || [];
      setReports(list);
      const nextNotes: Record<string, string> = {};
      const nextPlanes: Record<string, string> = {};
      const nextShas: Record<string, string> = {};
      for (const r of list) {
        nextNotes[r.reportId] = r.resolutionNotes || '';
        nextPlanes[r.reportId] = r.planeIssueId || '';
        nextShas[r.reportId] = r.fixedInCommitSha || '';
      }
      setDraftNotes(nextNotes);
      setDraftPlaneIds(nextPlanes);
      setDraftCommitShas(nextShas);
    } catch (err: any) {
      toast.error('Failed to load bug triage queue', { description: err?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdate = async (
    reportId: string,
    updates: {
      status?: BugReportStatus;
      planeIssueId?: string | null;
      resolutionNotes?: string;
      fixedInCommitSha?: string | null;
    }
  ) => {
    setSavingId(reportId);
    try {
      const res = await fetch('/api/admin/bugs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, ...updates }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Update failed');
      }
      setReports((prev) =>
        prev.map((r) => (r.reportId === reportId ? { ...r, ...updates, updatedAt: Date.now() } : r))
      );
      if (updates.status === 'VERIFIED') {
        const planeDescription = data?.planeSync?.ok
          ? `Linked ticket ${data.planeSync.issueKey || ''} closed automatically via Plane API.`
          : 'Verified and persisted in Firestore.';
        toast.success(`Signed Off ${reportId} as VERIFIED`, {
          description: planeDescription,
        });
      } else if (updates.status === 'OPEN') {
        toast.warning(`Reopened ${reportId}`, {
          description: 'Moved back to OPEN for engineering follow-up.',
        });
      } else {
        toast.success(`Updated ${reportId}`);
      }
    } catch (err: any) {
      toast.error('Could not save triage update', { description: err?.message });
    } finally {
      setSavingId(null);
    }
  };

  const isHighlighted = (r: BugReportRecord) =>
    (highlightReportId && r.reportId === highlightReportId) ||
    (highlightTraceId && r.traceId === highlightTraceId) ||
    (highlightUserId && r.userId === highlightUserId);

  const readyForSignOffReports = useMemo(
    () => reports.filter((r) => r.status === 'FIXED_ON_DEV'),
    [reports]
  );

  const visibleReports = reports.filter((r) => statusFilter === 'ALL' || r.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* READY FOR FOUNDER SIGN-OFF QUEUE (Option B Fast Sign-Off) */}
      {!loading && readyForSignOffReports.length > 0 && (
        <section
          data-testid="READY_FOR_FOUNDER_SIGNOFF_SECTION"
          className="rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-950/35 via-slate-900/80 to-emerald-950/20 p-5 space-y-4 shadow-[0_0_30px_rgba(14,165,233,0.12)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-500/20 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Ready for Founder Sign-Off ({readyForSignOffReports.length})
                </h3>
                {liveCommitSha && (
                  <span
                    data-testid="LIVE_STAGING_SHA_BADGE"
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                  >
                    Live Staging: {liveCommitSha}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Open the exact route on staging to inspect each fix, then click{' '}
                <strong className="text-emerald-300">Sign Off (Verified)</strong> or{' '}
                <strong className="text-rose-300">Still Broken (Reopen)</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {readyForSignOffReports.map((r) => {
              const planeKey = normalisePlaneIssueKey(r.planeIssueId);
              const exactRoute = sanitizeBugDeepLinkRoute(r.path);
              const shaLive = doesCommitShaMatchLive(r.fixedInCommitSha, liveCommitSha);
              return (
                <div
                  key={`signoff-${r.reportId}`}
                  data-testid={`signoff-card-${r.reportId}`}
                  className="rounded-xl border border-slate-700/80 bg-slate-950/80 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-300">{r.reportId}</span>

                      {r.planeIssueId && (
                        planeKey ? (
                          <button
                            type="button"
                            onClick={() => setActivePlaneKey(planeKey)}
                            data-testid={`signoff-plane-link-${r.reportId}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 border border-indigo-400/35 text-indigo-300 hover:bg-indigo-500/25 transition cursor-pointer"
                          >
                            <Ticket className="h-3 w-3" />
                            <span>{planeKey}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 border border-indigo-400/35 text-indigo-300">
                            <Ticket className="h-3 w-3" />
                            <span>{r.planeIssueId}</span>
                          </span>
                        )
                      )}

                      {r.fixedInCommitSha && (
                        <span
                          data-testid={`signoff-sha-badge-${r.reportId}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            shaLive
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                          }`}
                        >
                          <GitCommit className="h-3 w-3" />
                          <span>
                            {shaLive
                              ? `Live Fix: ${r.fixedInCommitSha}`
                              : `Fixed In: ${r.fixedInCommitSha}`}
                          </span>
                        </span>
                      )}

                      {r.cardId && (
                        <a
                          href={`/admin/qa#card-${r.cardId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`signoff-qa-link-${r.reportId}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 transition"
                        >
                          <ClipboardList className="h-3 w-3" />
                          <span>QA Card #{r.cardId}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={exactRoute}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`signoff-open-route-${r.reportId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-mono font-bold transition"
                      >
                        <span>Open Exact Route</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>

                      <button
                        type="button"
                        disabled={savingId === r.reportId}
                        onClick={() => handleUpdate(r.reportId, { status: 'VERIFIED' })}
                        data-testid={`signoff-verified-${r.reportId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Sign Off (Verified)</span>
                      </button>

                      <button
                        type="button"
                        disabled={savingId === r.reportId}
                        onClick={() => handleUpdate(r.reportId, { status: 'OPEN' })}
                        data-testid={`signoff-reopen-${r.reportId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Still Broken (Reopen)</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{r.description}</p>
                  {r.resolutionNotes && (
                    <div className="text-[11px] font-mono text-emerald-300/90 bg-emerald-950/25 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                      Fix Summary: {r.resolutionNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', ...BUG_REPORT_STATUSES].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {st} ({st === 'ALL' ? reports.length : reports.filter((r) => r.status === st).length})
            </button>
          ))}
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {(highlightTraceId || highlightReportId || highlightUserId) && (
        <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center justify-between gap-4">
          <span>
            Active link highlight:{' '}
            {highlightReportId && `reportId=${highlightReportId} `}
            {highlightTraceId && `traceId=${highlightTraceId} `}
            {highlightUserId && `userId=${highlightUserId}`}
          </span>
          <button
            onClick={() => {
              setHighlightReportId('');
              setHighlightTraceId('');
              setHighlightUserId('');
            }}
            className="text-amber-300 underline cursor-pointer"
          >
            Clear highlight
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-mono text-xs">Loading Bug Triage Queue...</div>
      ) : visibleReports.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
          <Bug className="h-8 w-8 mx-auto mb-3 text-slate-600" />
          No bug reports matching filter <span className="font-mono text-amber-400">{statusFilter}</span>.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleReports.map((r) => {
            const matched = isHighlighted(r);
            const planeKey = normalisePlaneIssueKey(r.planeIssueId);
            const exactRoute = sanitizeBugDeepLinkRoute(r.path);
            const shaLive = doesCommitShaMatchLive(r.fixedInCommitSha, liveCommitSha);
            return (
              <div
                key={r.reportId}
                data-testid={`bug-report-card-${r.reportId}`}
                className={`rounded-2xl border p-5 space-y-4 transition ${
                  matched
                    ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.18)]'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{r.reportId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${STATUS_STYLES[r.status] || STATUS_STYLES.OPEN}`}>
                        {r.status}
                      </span>
                      {planeKey && (
                        <button
                          type="button"
                          onClick={() => setActivePlaneKey(planeKey)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 border border-indigo-400/35 text-indigo-300 hover:bg-indigo-500/25 transition cursor-pointer"
                        >
                          <Ticket className="h-3 w-3" />
                          <span>{planeKey}</span>
                        </button>
                      )}
                      {r.fixedInCommitSha && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            shaLive
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          <GitCommit className="h-3 w-3" />
                          <span>{r.fixedInCommitSha}</span>
                        </span>
                      )}
                      {r.cardId && (
                        <a
                          href={`/admin/qa#card-${r.cardId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300"
                        >
                          <ClipboardList className="h-3 w-3" />
                          <span>QA Card #{r.cardId}</span>
                        </a>
                      )}
                      {matched && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-black">
                          MATCHED TRACE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-2">
                      <span>
                        Route:{' '}
                        <a
                          href={exactRoute}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-300 hover:underline inline-flex items-center gap-1"
                        >
                          {exactRoute}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </span>
                      <span>•</span>
                      <span>
                        User: <span className="text-slate-200">{r.userEmail}</span> ({r.userId}) • Ver: {r.appVersion}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Trace: {r.traceId} • Logged: {r.createdAtIso} • Origin: {r.environmentHost}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {BUG_REPORT_STATUSES.map((st) => (
                      <button
                        key={st}
                        disabled={savingId === r.reportId || r.status === st}
                        onClick={() => handleUpdate(r.reportId, { status: st })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                          r.status === st
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-black/50 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 whitespace-pre-wrap">
                  {r.description}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                      Plane Ticket Ref (e.g. MW-411)
                    </label>
                    <input
                      type="text"
                      value={draftPlaneIds[r.reportId] ?? ''}
                      onChange={(e) => setDraftPlaneIds((p) => ({ ...p, [r.reportId]: e.target.value }))}
                      placeholder="MW-..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                      Fixed In Commit SHA
                    </label>
                    <input
                      type="text"
                      value={draftCommitShas[r.reportId] ?? ''}
                      onChange={(e) => setDraftCommitShas((p) => ({ ...p, [r.reportId]: e.target.value }))}
                      placeholder="e.g. 73b4801"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                        Engineering Resolution Notes
                      </label>
                      <input
                        type="text"
                        lang="en-GB"
                        value={draftNotes[r.reportId] ?? ''}
                        onChange={(e) => setDraftNotes((p) => ({ ...p, [r.reportId]: e.target.value }))}
                        placeholder="Root cause & verified staging commit SHA..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <button
                      disabled={savingId === r.reportId}
                      onClick={() =>
                        handleUpdate(r.reportId, {
                          planeIssueId: draftPlaneIds[r.reportId] || null,
                          fixedInCommitSha: draftCommitShas[r.reportId] || null,
                          resolutionNotes: draftNotes[r.reportId] || '',
                        })
                      }
                      className="px-4 py-1.5 h-[34px] rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono cursor-pointer self-end"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Headless Plane.so Ticket Drawer (zero external app.plane.so navigation) */}
      <PlaneTicketDrawer
        issueKey={activePlaneKey}
        onClose={() => setActivePlaneKey(null)}
      />
    </div>
  );
}
