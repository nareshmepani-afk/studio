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
  Copy,
  Check,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Settings2,
  Rocket,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BUG_REPORT_STATUSES,
  deriveBugCardPresentation,
  doesCommitShaMatchLive,
  type BugReportRecord,
  type BugReportStatus,
} from '@/lib/bugReports';
import { normalisePlaneIssueKey } from '@/lib/planeTypes';
import { PlaneTicketDrawer } from './PlaneTicketDrawer';

type QueueFilter = 'ACTION_QUEUE' | 'ALL' | BugReportStatus;

export function BugTriageConsole() {
  const [reports, setReports] = useState<BugReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCommitSha, setLiveCommitSha] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<QueueFilter>('ACTION_QUEUE');
  const [routeFilter, setRouteFilter] = useState<string>('ALL_ROUTES');
  const [highlightTraceId, setHighlightTraceId] = useState<string>('');
  const [highlightReportId, setHighlightReportId] = useState<string>('');
  const [highlightUserId, setHighlightUserId] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Per-card interactive state (/admin/qa-grade checklists, feedback drawers & engineering metadata)
  const [checkedMap, setCheckedMap] = useState<Record<string, Set<number>>>({});
  const [openFeedbackIds, setOpenFeedbackIds] = useState<Record<string, boolean>>({});
  const [openEngMetaIds, setOpenEngMetaIds] = useState<Record<string, boolean>>({});
  const [draftFeedback, setDraftFeedback] = useState<Record<string, string>>({});
  const [draftConsoleLog, setDraftConsoleLog] = useState<Record<string, string>>({});
  const [draftTelemetry, setDraftTelemetry] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftPlaneIds, setDraftPlaneIds] = useState<Record<string, string>>({});
  const [draftCommitShas, setDraftCommitShas] = useState<Record<string, string>>({});
  const [activePlaneKey, setActivePlaneKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const tr = sp.get('traceId') || '';
      const rp = sp.get('reportId') || '';
      const us = sp.get('userId') || '';
      setHighlightTraceId(tr);
      setHighlightReportId(rp);
      setHighlightUserId(us);
      if (tr || rp || us) {
        setStatusFilter('ALL');
      }
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
      const nextFeedback: Record<string, string> = {};
      const nextConsole: Record<string, string> = {};
      const nextTelemetry: Record<string, string> = {};
      const nextChecked: Record<string, Set<number>> = {};

      for (const r of list) {
        nextNotes[r.reportId] = r.resolutionNotes || '';
        nextPlanes[r.reportId] = r.planeIssueId || '';
        nextShas[r.reportId] = r.fixedInCommitSha || '';
        nextFeedback[r.reportId] = r.founderFeedback || '';
        nextConsole[r.reportId] = r.consoleLog || '';
        nextTelemetry[r.reportId] = r.telemetryTrace || '';
        const derived = deriveBugCardPresentation(r);
        if (Array.isArray(r.checkedIndices) && r.checkedIndices.length > 0) {
          nextChecked[r.reportId] = new Set(r.checkedIndices);
        } else if (r.status === 'VERIFIED') {
          nextChecked[r.reportId] = new Set(derived.verificationChecks.map((_, idx) => idx));
        } else {
          nextChecked[r.reportId] = new Set();
        }
      }
      setDraftNotes(nextNotes);
      setDraftPlaneIds(nextPlanes);
      setDraftCommitShas(nextShas);
      setDraftFeedback(nextFeedback);
      setDraftConsoleLog(nextConsole);
      setDraftTelemetry(nextTelemetry);
      setCheckedMap(nextChecked);
    } catch (err: any) {
      toast.error('Failed to load sign-off queue', { description: err?.message });
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
      checkedIndices?: number[];
      founderFeedback?: string | null;
      consoleLog?: string | null;
      telemetryTrace?: string | null;
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
        prev.map((r) =>
          r.reportId === reportId ? ({ ...r, ...updates, updatedAt: Date.now() } as BugReportRecord) : r
        )
      );
      if (updates.status === 'VERIFIED') {
        const planeDescription = data?.planeSync?.ok
          ? `Linked ticket ${data.planeSync.issueKey || ''} closed automatically in Plane.`
          : 'Marked PASS (VERIFIED) in Staging Firestore.';
        toast.success(`PASS — Signed off ${reportId}`, {
          description: planeDescription,
        });
      } else if (updates.status === 'OPEN') {
        toast.warning(`FAIL — Reopened ${reportId}`, {
          description: 'Moved to OPEN. Add any observations or telemetry in the feedback drawer below.',
        });
      } else if (updates.status === 'TRIAGED') {
        toast.info(`Moved ${reportId} to BACKLOG (TRIAGED)`);
      } else {
        toast.success(`Saved ${reportId}`);
      }
    } catch (err: any) {
      toast.error('Could not save sign-off update', { description: err?.message });
    } finally {
      setSavingId(null);
    }
  };

  const toggleCheckItem = (reportId: string, idx: number) => {
    setCheckedMap((prev) => {
      const nextSet = new Set(prev[reportId] || []);
      if (nextSet.has(idx)) {
        nextSet.delete(idx);
      } else {
        nextSet.add(idx);
      }
      return { ...prev, [reportId]: nextSet };
    });
  };

  const copyCardMarkdown = async (r: BugReportRecord) => {
    const meta = deriveBugCardPresentation(r);
    const planeKey = normalisePlaneIssueKey(r.planeIssueId) || r.planeIssueId || 'UNLINKED';
    const checked = checkedMap[r.reportId] || new Set<number>();
    const md = [
      `### ${planeKey} — ${meta.title}`,
      `- **Status:** ${r.status} | **Commit:** ${r.fixedInCommitSha || liveCommitSha || 'N/A'}`,
      `- **Test Route:** ${meta.fullTestUrl}`,
      '',
      '**Test Steps:**',
      ...meta.testSteps.map((s, i) => `${i + 1}. ${s}`),
      '',
      '**Verification Assertions:**',
      ...meta.verificationChecks.map((c, i) => `- [${checked.has(i) ? 'x' : ' '}] ${c}`),
      ...(draftFeedback[r.reportId] ? ['', `**Founder Feedback:** ${draftFeedback[r.reportId]}`] : []),
      ...(draftConsoleLog[r.reportId] ? ['', `**Console Log:**\n\`\`\`\n${draftConsoleLog[r.reportId]}\n\`\`\``] : []),
      ...(draftTelemetry[r.reportId] ? ['', `**Telemetry:**\n\`\`\`\n${draftTelemetry[r.reportId]}\n\`\`\``] : []),
    ].join('\n');

    try {
      await navigator.clipboard?.writeText(md);
      setCopiedId(r.reportId);
      setTimeout(() => setCopiedId((curr) => (curr === r.reportId ? null : curr)), 2000);
      toast.success('Copied card report to clipboard');
    } catch {
      toast.error('Clipboard copy unavailable');
    }
  };

  const isHighlighted = (r: BugReportRecord) =>
    Boolean(
      (highlightReportId && r.reportId === highlightReportId) ||
        (highlightTraceId && r.traceId === highlightTraceId) ||
        (highlightUserId && r.userId === highlightUserId)
    );

  const readyForSignOffReports = useMemo(
    () => reports.filter((r) => r.status === 'FIXED_ON_DEV'),
    [reports]
  );

  const actionQueueReports = useMemo(
    () => reports.filter((r) => r.status === 'FIXED_ON_DEV' || r.status === 'OPEN'),
    [reports]
  );

  // Deduplicated visible list: when viewing ACTION_QUEUE, READY_FOR_FOUNDER_SIGNOFF_SECTION renders FIXED_ON_DEV cards
  // once at the top, and remaining OPEN items render right below without repeating FIXED_ON_DEV twice!
  const secondaryReports = useMemo(() => {
    let base: BugReportRecord[];
    if (statusFilter === 'ACTION_QUEUE') {
      base =
        actionQueueReports.length > 0
          ? reports.filter((r) => r.status === 'OPEN')
          : reports;
    } else if (statusFilter === 'ALL') {
      base = reports.filter((r) => r.status !== 'FIXED_ON_DEV');
    } else if (statusFilter === 'FIXED_ON_DEV') {
      base = [];
    } else {
      base = reports.filter((r) => r.status === statusFilter);
    }

    if (routeFilter !== 'ALL_ROUTES') {
      base = base.filter((r) => deriveBugCardPresentation(r).routePathname === routeFilter);
    }
    return base;
  }, [reports, statusFilter, actionQueueReports.length, routeFilter]);

  const filteredReadyReports = useMemo(() => {
    if (
      statusFilter !== 'ACTION_QUEUE' &&
      statusFilter !== 'FIXED_ON_DEV' &&
      statusFilter !== 'ALL'
    ) {
      return [];
    }
    if (routeFilter === 'ALL_ROUTES') return readyForSignOffReports;
    return readyForSignOffReports.filter(
      (r) => deriveBugCardPresentation(r).routePathname === routeFilter
    );
  }, [readyForSignOffReports, statusFilter, routeFilter]);

  const allDistinctRoutes = useMemo(() => {
    const counts = new Map<string, number>();
    const source = statusFilter === 'ACTION_QUEUE' && actionQueueReports.length > 0 ? actionQueueReports : reports;
    for (const r of source) {
      const p = deriveBugCardPresentation(r).routePathname;
      counts.set(p, (counts.get(p) || 0) + 1);
    }
    return Array.from(counts.entries());
  }, [reports, actionQueueReports, statusFilter]);

  const groupByRoute = (items: BugReportRecord[]) => {
    const map = new Map<string, BugReportRecord[]>();
    for (const r of items) {
      const key = deriveBugCardPresentation(r).routePathname;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  };

  const renderQaStyleSignOffCard = (r: BugReportRecord, isSignOffSection: boolean) => {
    const meta = deriveBugCardPresentation(r);
    const planeKey = normalisePlaneIssueKey(r.planeIssueId);
    const shaLive = doesCommitShaMatchLive(r.fixedInCommitSha, liveCommitSha);
    const matched = isHighlighted(r);
    const checked = checkedMap[r.reportId] || new Set<number>();
    const hasRecordedFeedback = Boolean(
      (draftFeedback[r.reportId] || '').trim() ||
        (draftConsoleLog[r.reportId] || '').trim() ||
        (draftTelemetry[r.reportId] || '').trim()
    );
    const isFeedbackOpen = Boolean(openFeedbackIds[r.reportId] || hasRecordedFeedback);
    const isEngMetaOpen = Boolean(openEngMetaIds[r.reportId]);

    const statusBadgeStyle =
      r.status === 'VERIFIED'
        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
        : r.status === 'FIXED_ON_DEV'
        ? 'bg-sky-500/15 text-sky-300 border-sky-400/40'
        : r.status === 'TRIAGED'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
        : 'bg-rose-500/15 text-rose-300 border-rose-500/40';

    const statusHumanLabel =
      r.status === 'VERIFIED'
        ? 'CERTIFIED PASS'
        : r.status === 'FIXED_ON_DEV'
        ? 'READY FOR SIGN-OFF'
        : r.status === 'TRIAGED'
        ? 'BACKLOGGED'
        : 'NEEDS ATTENTION';

    const buildFeedbackExtras = () => {
      const fb = (draftFeedback[r.reportId] || '').trim();
      const cl = (draftConsoleLog[r.reportId] || '').trim();
      const tl = (draftTelemetry[r.reportId] || '').trim();
      const extras: Record<string, unknown> = {};
      if (fb !== (r.founderFeedback || '')) extras.founderFeedback = fb;
      if (cl !== (r.consoleLog || '')) extras.consoleLog = cl;
      if (tl !== (r.telemetryTrace || '')) extras.telemetryTrace = tl;
      return extras;
    };

    return (
      <article
        key={`${isSignOffSection ? 'signoff' : 'card'}-${r.reportId}`}
        data-testid={isSignOffSection ? `signoff-card-${r.reportId}` : `bug-report-card-${r.reportId}`}
        className={`rounded-2xl border p-6 space-y-5 shadow-2xl transition ${
          matched
            ? 'bg-amber-950/20 border-amber-400 shadow-[0_0_28px_rgba(245,158,11,0.2)]'
            : hasRecordedFeedback && r.status === 'OPEN'
            ? 'bg-[#12100C] border-amber-500/60'
            : 'bg-gradient-to-br from-[#111827]/95 to-[#0B0F17] border-slate-800/90 hover:border-slate-700'
        }`}
      >
        {/* TOP HEADER BAR: Status & Plane Pill | Route Slug | Copy & Open Test Route ↗ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border ${statusBadgeStyle}`}>
              {planeKey ? `${planeKey} • ${statusHumanLabel}` : statusHumanLabel}
            </span>

            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-sky-950/60 border border-sky-500/30 text-sky-300">
              {meta.routeSlug}
            </span>

            {r.planeIssueId &&
              (planeKey ? (
                <button
                  type="button"
                  onClick={() => setActivePlaneKey(planeKey)}
                  data-testid={isSignOffSection ? `signoff-plane-link-${r.reportId}` : `card-plane-link-${r.reportId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-indigo-500/15 border border-indigo-400/35 text-indigo-300 hover:bg-indigo-500/25 transition cursor-pointer"
                  title="Inspect Plane ticket details in-app"
                >
                  <Ticket className="h-3 w-3" />
                  <span>{planeKey}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-indigo-500/15 border border-indigo-400/35 text-indigo-300">
                  <Ticket className="h-3 w-3" />
                  <span>{r.planeIssueId}</span>
                </span>
              ))}

            {r.fixedInCommitSha && (
              <span
                data-testid={isSignOffSection ? `signoff-sha-badge-${r.reportId}` : `card-sha-badge-${r.reportId}`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${
                  shaLive
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                }`}
              >
                <GitCommit className="h-3 w-3" />
                <span>
                  {shaLive ? `Live Fix: ${r.fixedInCommitSha}` : `Fixed In: ${r.fixedInCommitSha}`}
                </span>
              </span>
            )}

            {r.cardId && (
              <a
                href={`/admin/qa#card-${r.cardId}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={isSignOffSection ? `signoff-qa-link-${r.reportId}` : `card-qa-link-${r.reportId}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-amber-300 transition"
              >
                <ClipboardList className="h-3 w-3" />
                <span>QA Card #{r.cardId}</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyCardMarkdown(r)}
              data-testid={`copy-card-report-${r.reportId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-semibold transition cursor-pointer"
            >
              {copiedId === r.reportId ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>{copiedId === r.reportId ? 'Copied' : 'Copy Card'}</span>
            </button>

            <a
              href={meta.exactRoute}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={isSignOffSection ? `signoff-open-route-${r.reportId}` : `card-open-route-${r.reportId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-xs font-mono font-bold transition shadow-sm"
            >
              <span>🔗 Open Test Route</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* PLAIN-ENGLISH HEADLINE & NUMBERED 1-2-3 TEST STEPS (Matching /admin/qa) */}
        <div className="space-y-2.5">
          <h4
            data-testid={`bug-card-title-${r.reportId}`}
            className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug"
          >
            {meta.title}
          </h4>

          <ol className="space-y-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed list-none pl-0">
            {meta.testSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-mono font-bold text-sky-400 shrink-0">{idx + 1})</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* GOVERNANCE & FULLY-QUALIFIED ROUTE BAR */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <span className="truncate">
            Route: <strong className="text-slate-200">{meta.fullTestUrl}</strong>
          </span>
          {r.fixedInCommitSha && (
            <span>
              Target Commit: <strong className="text-sky-300">{r.fixedInCommitSha}</strong>
            </span>
          )}
        </div>

        {/* VERIFICATION STEPS & ASSERTIONS CHECKBOXES (Matching /admin/qa) */}
        <div className="rounded-xl bg-[#0C0E14] border border-slate-800/90 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Verification Steps &amp; Assertions
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              {checked.size}/{meta.verificationChecks.length} Checked
            </span>
          </div>

          <div className="space-y-2">
            {meta.verificationChecks.map((assertion, idx) => {
              const isTicked = checked.has(idx);
              return (
                <label
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer select-none group"
                >
                  <input
                    type="checkbox"
                    checked={isTicked}
                    onChange={() => toggleCheckItem(r.reportId, idx)}
                    data-testid={`bug-assertion-check-${r.reportId}-${idx}`}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 accent-sky-500 cursor-pointer shrink-0"
                  />
                  <span className={isTicked ? 'text-white' : 'text-slate-300 group-hover:text-white'}>
                    {assertion}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* /admin/qa-STYLE VERDICT BAR: PASS | FAIL | BACKLOG + FEEDBACK TOGGLE */}
        <div className="rounded-xl bg-slate-950/75 border border-slate-800/90 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Sign-Off Verdict:
            </span>

            <button
              type="button"
              onClick={() =>
                setOpenFeedbackIds((prev) => ({ ...prev, [r.reportId]: !isFeedbackOpen }))
              }
              data-testid={`toggle-feedback-${r.reportId}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition cursor-pointer ${
                hasRecordedFeedback
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
              <span>
                {hasRecordedFeedback ? 'Feedback & Logs Recorded' : 'Add Feedback / Console Log'}
              </span>
              {isFeedbackOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={savingId === r.reportId}
              onClick={() => {
                setCheckedMap((prev) => ({
                  ...prev,
                  [r.reportId]: new Set(meta.verificationChecks.map((_, idx) => idx)),
                }));
                const extras = buildFeedbackExtras();
                handleUpdate(r.reportId, {
                  status: 'VERIFIED',
                  ...extras,
                });
              }}
              data-testid={isSignOffSection ? `signoff-verified-${r.reportId}` : `verdict-pass-${r.reportId}`}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-mono font-bold border transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 ${
                r.status === 'VERIFIED'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-sm'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>PASS</span>
            </button>

            <button
              type="button"
              disabled={savingId === r.reportId}
              onClick={() => {
                setOpenFeedbackIds((prev) => ({ ...prev, [r.reportId]: true }));
                const extras = buildFeedbackExtras();
                handleUpdate(r.reportId, {
                  status: 'OPEN',
                  ...extras,
                });
              }}
              data-testid={isSignOffSection ? `signoff-reopen-${r.reportId}` : `verdict-fail-${r.reportId}`}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-mono font-bold border transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 ${
                r.status === 'OPEN'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-slate-900 hover:bg-rose-950/60 text-rose-300 border-rose-500/40'
              }`}
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>FAIL</span>
            </button>

            <button
              type="button"
              disabled={savingId === r.reportId}
              onClick={() => {
                const extras = buildFeedbackExtras();
                handleUpdate(r.reportId, {
                  status: 'TRIAGED',
                  ...extras,
                });
              }}
              data-testid={`verdict-backlog-${r.reportId}`}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-mono font-bold border transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 ${
                r.status === 'TRIAGED'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 hover:bg-amber-950/50 text-amber-300 border-amber-500/35'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>BACKLOG</span>
            </button>
          </div>
        </div>

        {/* INLINE FOUNDER FEEDBACK + CONSOLE ERROR + TELEMETRY TRACE DRAWER (Matching /admin/qa) */}
        {isFeedbackOpen && (
          <div
            data-testid={`founder-feedback-drawer-${r.reportId}`}
            className="rounded-xl bg-slate-950/90 border border-amber-500/35 p-4 space-y-3 animate-in fade-in duration-150"
          >
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Founder Observations &amp; Sign-Off Feedback
              </label>
              <textarea
                rows={2}
                lang="en-GB"
                data-testid={`founder-feedback-input-${r.reportId}`}
                value={draftFeedback[r.reportId] ?? ''}
                onChange={(e) =>
                  setDraftFeedback((prev) => ({ ...prev, [r.reportId]: e.target.value }))
                }
                placeholder="Describe what looked off or any polish notes..."
                className="w-full rounded-lg bg-[#07090E] border border-slate-800 focus:border-amber-500/60 p-2.5 text-xs text-white font-sans outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Console Error &amp; Network Fault Log
                </label>
                <textarea
                  rows={2}
                  data-testid={`founder-console-input-${r.reportId}`}
                  value={draftConsoleLog[r.reportId] ?? ''}
                  onChange={(e) =>
                    setDraftConsoleLog((prev) => ({ ...prev, [r.reportId]: e.target.value }))
                  }
                  placeholder="Paste any console exceptions or network errors..."
                  className="w-full rounded-lg bg-[#07090E] border border-slate-800 focus:border-amber-500/60 p-2.5 text-xs text-slate-200 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Telemetry Event Trace
                </label>
                <textarea
                  rows={2}
                  data-testid={`founder-telemetry-input-${r.reportId}`}
                  value={draftTelemetry[r.reportId] ?? ''}
                  onChange={(e) =>
                    setDraftTelemetry((prev) => ({ ...prev, [r.reportId]: e.target.value }))
                  }
                  placeholder="Paste traceId (e.g. mw_telemetry_...) or event payload..."
                  className="w-full rounded-lg bg-[#07090E] border border-slate-800 focus:border-amber-500/60 p-2.5 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={savingId === r.reportId}
                onClick={() =>
                  handleUpdate(r.reportId, {
                    founderFeedback: draftFeedback[r.reportId] || '',
                    consoleLog: draftConsoleLog[r.reportId] || '',
                    telemetryTrace: draftTelemetry[r.reportId] || '',
                    checkedIndices: Array.from(checked),
                  })
                }
                data-testid={`save-feedback-btn-${r.reportId}`}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-semibold cursor-pointer"
              >
                Save Notes
              </button>

              <button
                type="button"
                disabled={savingId === r.reportId}
                onClick={() =>
                  handleUpdate(r.reportId, {
                    status: 'OPEN',
                    founderFeedback: draftFeedback[r.reportId] || '',
                    consoleLog: draftConsoleLog[r.reportId] || '',
                    telemetryTrace: draftTelemetry[r.reportId] || '',
                    checkedIndices: Array.from(checked),
                  })
                }
                data-testid={`save-and-fail-btn-${r.reportId}`}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold cursor-pointer"
              >
                Save Feedback &amp; Mark FAIL (Reopen)
              </button>
            </div>
          </div>
        )}

        {/* COLLAPSED ENGINEERING METADATA ACCORDION (Hides raw IDs & inputs by default) */}
        <div className="pt-1 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() =>
              setOpenEngMetaIds((prev) => ({ ...prev, [r.reportId]: !isEngMetaOpen }))
            }
            data-testid={`toggle-eng-meta-${r.reportId}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            <Settings2 className="h-3 w-3" />
            <span>
              Engineering Metadata ({r.reportId} • Trace: {r.traceId})
            </span>
            {isEngMetaOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {isEngMetaOpen && (
            <div
              data-testid={`eng-meta-panel-${r.reportId}`}
              className="mt-3 p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3"
            >
              <div className="text-[11px] text-slate-400 font-mono">
                Reporter: {r.userEmail} ({r.userId}) • Version: {r.appVersion} • Logged: {r.createdAtIso}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Plane Ticket Ref
                  </label>
                  <input
                    type="text"
                    value={draftPlaneIds[r.reportId] ?? ''}
                    onChange={(e) =>
                      setDraftPlaneIds((p) => ({ ...p, [r.reportId]: e.target.value }))
                    }
                    placeholder="MW-..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Fixed In Commit SHA
                  </label>
                  <input
                    type="text"
                    value={draftCommitShas[r.reportId] ?? ''}
                    onChange={(e) =>
                      setDraftCommitShas((p) => ({ ...p, [r.reportId]: e.target.value }))
                    }
                    placeholder="e.g. 72a601b"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white"
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
                      onChange={(e) =>
                        setDraftNotes((p) => ({ ...p, [r.reportId]: e.target.value }))
                      }
                      placeholder="Root cause & verified staging commit SHA..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <button
                    type="button"
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
          )}
        </div>
      </article>
    );
  };

  const renderRouteGroupedList = (items: BugReportRecord[], isSignOffSection: boolean) => {
    const groups = groupByRoute(items);
    return (
      <div className="space-y-8">
        {groups.map(([routePath, groupItems]) => {
          const firstMeta = deriveBugCardPresentation(groupItems[0]);
          return (
            <div key={routePath} data-testid={`route-group-${firstMeta.routeSlug}`} className="space-y-4">
              <div className="rounded-xl bg-slate-900/75 border border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-amber-300">
                      Route Group: {routePath} ({groupItems.length}{' '}
                      {groupItems.length === 1 ? 'Card' : 'Cards'})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Open this route once and step through {groupItems.length === 1 ? 'this card' : `all ${groupItems.length} cards`} in sequence.
                  </p>
                </div>

                <a
                  href={firstMeta.exactRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-mono font-bold transition"
                >
                  <span>🚀 Launch Route ↗</span>
                </a>
              </div>

              <div className="space-y-5">
                {groupItems.map((r) => renderQaStyleSignOffCard(r, isSignOffSection))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* TOP STATUS & ROUTE FILTER HUD (Matching /admin/qa) */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('ACTION_QUEUE')}
              data-testid="filter-action-queue"
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                statusFilter === 'ACTION_QUEUE'
                  ? 'bg-sky-500/20 text-sky-200 border-sky-400/50 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Action Queue ({actionQueueReports.length})
            </button>

            {(['FIXED_ON_DEV', 'OPEN', 'TRIAGED', 'VERIFIED', 'ALL'] as const).map((st) => {
              const count =
                st === 'ALL' ? reports.length : reports.filter((r) => r.status === st).length;
              const label = st === 'TRIAGED' ? 'BACKLOG' : st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {liveCommitSha && (
              <span
                data-testid={readyForSignOffReports.length === 0 ? 'LIVE_STAGING_SHA_BADGE' : undefined}
                className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              >
                Active Edge: {liveCommitSha}
              </span>
            )}

            <a
              href="/admin/qa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>60-Card QA Suite ↗</span>
            </a>

            <button
              type="button"
              onClick={fetchReports}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Route Filter Pills */}
        {allDistinctRoutes.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Filter by Route:
            </span>
            <button
              type="button"
              onClick={() => setRouteFilter('ALL_ROUTES')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono border cursor-pointer ${
                routeFilter === 'ALL_ROUTES'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Routes
            </button>
            {allDistinctRoutes.map(([routePath, count]) => (
              <button
                key={routePath}
                type="button"
                onClick={() => setRouteFilter(routePath)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono border cursor-pointer ${
                  routeFilter === routePath
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {routePath} ({count})
              </button>
            ))}
          </div>
        )}
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
            type="button"
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

      {/* READY FOR FOUNDER SIGN-OFF QUEUE (/admin/qa-Grade Cards, Deduplicated) */}
      {!loading && filteredReadyReports.length > 0 && (
        <section
          data-testid="READY_FOR_FOUNDER_SIGNOFF_SECTION"
          className="rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-950/25 via-slate-900/60 to-emerald-950/15 p-5 space-y-5 shadow-[0_0_30px_rgba(14,165,233,0.1)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-500/20 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Ready for Founder Sign-Off ({filteredReadyReports.length})
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
                Step through each card below just like <span className="font-mono text-amber-300">/admin/qa</span>: tick the assertions, then click{' '}
                <strong className="text-emerald-300">PASS</strong>,{' '}
                <strong className="text-rose-300">FAIL</strong>, or{' '}
                <strong className="text-amber-300">BACKLOG</strong>.
              </p>
            </div>
          </div>

          {renderRouteGroupedList(filteredReadyReports, true)}
        </section>
      )}

      {/* REMAINING / FILTERED CARDS (Zero Duplicate FIXED_ON_DEV Rendering) */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 font-mono text-xs">
          Loading Founder Sign-Off Cards...
        </div>
      ) : secondaryReports.length === 0 && filteredReadyReports.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-300 text-sm space-y-2">
          <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
          <p className="font-semibold text-white">No items awaiting action in this filter.</p>
          <p className="text-xs text-slate-400">
            Switch to <button type="button" onClick={() => setStatusFilter('VERIFIED')} className="text-emerald-300 underline cursor-pointer font-mono">VERIFIED</button> or <button type="button" onClick={() => setStatusFilter('ALL')} className="text-amber-300 underline cursor-pointer font-mono">ALL</button> to review signed-off cards.
          </p>
        </div>
      ) : secondaryReports.length > 0 ? (
        renderRouteGroupedList(secondaryReports, false)
      ) : null}

      {/* In-App Headless Plane.so Ticket Drawer (zero external app.plane.so navigation) */}
      <PlaneTicketDrawer
        issueKey={activePlaneKey}
        onClose={() => setActivePlaneKey(null)}
      />
    </div>
  );
}
