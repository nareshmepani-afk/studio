'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bug, RefreshCw, CheckCircle2, Clock, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { BUG_REPORT_STATUSES, type BugReportRecord, type BugReportStatus } from '@/lib/bugReports';

const STATUS_STYLES: Record<BugReportStatus, string> = {
  OPEN: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  TRIAGED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  FIXED_ON_DEV: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  VERIFIED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

export function BugTriageConsole() {
  const [reports, setReports] = useState<BugReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [highlightTraceId, setHighlightTraceId] = useState<string>('');
  const [highlightReportId, setHighlightReportId] = useState<string>('');
  const [highlightUserId, setHighlightUserId] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftPlaneIds, setDraftPlaneIds] = useState<Record<string, string>>({});

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
      const res = await fetch('/api/admin/bugs', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load bug reports');
      }
      const list: BugReportRecord[] = data.reports || [];
      setReports(list);
      const nextNotes: Record<string, string> = {};
      const nextPlanes: Record<string, string> = {};
      for (const r of list) {
        nextNotes[r.reportId] = r.resolutionNotes || '';
        nextPlanes[r.reportId] = r.planeIssueId || '';
      }
      setDraftNotes(nextNotes);
      setDraftPlaneIds(nextPlanes);
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
    updates: { status?: BugReportStatus; planeIssueId?: string | null; resolutionNotes?: string }
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
      toast.success(`Updated ${reportId}`);
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

  const visibleReports = reports.filter((r) => statusFilter === 'ALL' || r.status === statusFilter);

  return (
    <div className="space-y-6">
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
                      {matched && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-black">
                          MATCHED TRACE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Route: <span className="text-slate-200">{r.path}</span> • User:{' '}
                      <span className="text-slate-200">{r.userEmail}</span> ({r.userId}) • Ver: {r.appVersion}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                      Plane Ticket Ref (e.g. MW-410)
                    </label>
                    <input
                      type="text"
                      value={draftPlaneIds[r.reportId] ?? ''}
                      onChange={(e) => setDraftPlaneIds((p) => ({ ...p, [r.reportId]: e.target.value }))}
                      placeholder="MW-..."
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
    </div>
  );
}
