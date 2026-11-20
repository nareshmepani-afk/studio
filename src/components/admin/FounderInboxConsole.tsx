'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  GitCommit,
  PauseCircle,
  RefreshCw,
  Rocket,
  RotateCcw,
  Ticket,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getReleaseControlTargetMeta,
  isControlActionable,
  type EnvironmentParityReport,
  type InboxBadgeCounts,
  type ReleaseControlAction,
  type ReleaseControlRecord,
  type ReleaseControlStatus,
} from '@/lib/releaseControls';
import type { FounderDecisionRecord } from '@/lib/founderDecisions';
import {
  doesCommitShaMatchLive,
  formatPlaneBrowseUrl,
  sanitizeBugDeepLinkRoute,
  type BugReportRecord,
} from '@/lib/bugReports';

interface ControlsApiResponse {
  success: boolean;
  controls?: ReleaseControlRecord[];
  pendingDecisions?: FounderDecisionRecord[];
  readyBugs?: BugReportRecord[];
  badges?: InboxBadgeCounts;
  parity?: EnvironmentParityReport;
  error?: string;
}

const STATUS_BADGE_MAP: Record<ReleaseControlStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Awaiting Founder',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  },
  APPROVED: {
    label: 'Approved — Handed to Antigravity',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  HELD: {
    label: 'Held (Low-Drag)',
    className: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
  },
  HELD_BLOCKING: {
    label: '🔴 BLOCKED (Held by Founder)',
    className: 'bg-rose-500/20 text-rose-200 border-rose-500/50',
  },
  DEFERRED_TO_PLANE: {
    label: 'Deferred to Plane Ticket',
    className: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  EXECUTED: {
    label: 'Executed & Locked',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  },
};

export interface FounderInboxConsoleProps {
  onNavigateSuite?: (suite: 'decisions' | 'bugs') => void;
}

export function FounderInboxConsole({ onNavigateSuite }: FounderInboxConsoleProps) {
  const [controls, setControls] = useState<ReleaseControlRecord[]>([]);
  const [pendingDecisions, setPendingDecisions] = useState<FounderDecisionRecord[]>([]);
  const [readyBugs, setReadyBugs] = useState<BugReportRecord[]>([]);
  const [badges, setBadges] = useState<InboxBadgeCounts>({
    red: 0,
    amber: 0,
    approvedAwaitingCli: 0,
    readySignOff: 0,
    pendingDecisions: 0,
    totalActionable: 0,
  });
  const [liveCommitSha, setLiveCommitSha] = useState<string>('');
  const [parity, setParity] = useState<EnvironmentParityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [confirmDeferRedId, setConfirmDeferRedId] = useState<string | null>(null);
  const [showLedger, setShowLedger] = useState<boolean>(false);

  const notifySidebarBadges = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('admin-inbox-updated'));
    }
  };

  const applyPayload = useCallback((data: ControlsApiResponse) => {
    const nextControls = Array.isArray(data.controls) ? data.controls : [];
    setControls(nextControls);
    setPendingDecisions(Array.isArray(data.pendingDecisions) ? data.pendingDecisions : []);
    setReadyBugs(Array.isArray(data.readyBugs) ? data.readyBugs : []);
    if (data.badges) setBadges(data.badges);
    if (data.parity) setParity(data.parity);
    setDraftNotes((prev) => {
      const merged = { ...prev };
      for (const c of nextControls) {
        if (merged[c.id] === undefined) {
          merged[c.id] = c.notes || '';
        }
      }
      return merged;
    });
  }, []);

  const fetchInbox = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [controlsRes, versionRes] = await Promise.all([
          fetch('/api/admin/controls?includeParity=1', { cache: 'no-store', credentials: 'same-origin' }),
          fetch('/api/version', { cache: 'no-store' }).catch(() => null),
        ]);

        if (versionRes && versionRes.ok) {
          const vData = await versionRes.json().catch(() => null);
          if (vData?.commitSha) setLiveCommitSha(String(vData.commitSha));
        }

        const data = (await controlsRes.json().catch(() => ({}))) as ControlsApiResponse;
        if (!controlsRes.ok || !data.success) {
          throw new Error(data.error || `HTTP ${controlsRes.status}`);
        }
        applyPayload(data);
      } catch (err: any) {
        const msg = err?.message || 'Unable to load Founder Inbox.';
        setError(msg);
        toast.error('Founder Inbox Error', { description: msg });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyPayload]
  );

  useEffect(() => {
    fetchInbox(false);
  }, [fetchInbox]);

  const handleControlAction = async (
    control: ReleaseControlRecord,
    action: ReleaseControlAction,
    acknowledgedKnockOn = false
  ) => {
    if (busyIds[control.id]) return;

    // 1A Guard: RED defer requires explicit 1-click knock-on confirmation
    if (action === 'DEFER_TO_PLANE' && control.severity === 'RED' && !acknowledgedKnockOn) {
      setConfirmDeferRedId(control.id);
      return;
    }

    setBusyIds((prev) => ({ ...prev, [control.id]: true }));
    try {
      const res = await fetch('/api/admin/controls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          id: control.id,
          action,
          notes: draftNotes[control.id] ?? control.notes ?? '',
          expectedUpdatedAt: control.updatedAt,
          acknowledgedKnockOn,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as ControlsApiResponse;

      if (res.status === 409) {
        toast.warning('State Changed Concurrently', {
          description: data.error || 'Refreshing Founder Inbox with latest server state.',
        });
        await fetchInbox(true);
        notifySidebarBadges();
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setConfirmDeferRedId(null);
      applyPayload(data);
      notifySidebarBadges();

      const actionLabels: Record<ReleaseControlAction, string> = {
        APPROVE: 'Approved — queued for npm run qa:controls',
        HOLD: control.severity === 'RED' ? 'Held — downstream block flagged' : 'Held quietly (low-drag)',
        DEFER_TO_PLANE:
          control.severity === 'RED'
            ? 'Deferred to Plane [DEFERRED-BLOCKER]'
            : 'Deferred to Plane [DEFERRED-CONTROL]',
        REOPEN: 'Reopened to Awaiting Founder',
        MARK_EXECUTED: 'Marked Executed',
      };
      toast.success(actionLabels[action], { description: control.title });
    } catch (err: any) {
      toast.error('Action Failed', { description: err?.message || 'Unable to update control.' });
    } finally {
      setBusyIds((prev) => ({ ...prev, [control.id]: false }));
    }
  };

  const handleBugSignOff = async (report: BugReportRecord, nextStatus: 'VERIFIED' | 'OPEN') => {
    if (busyIds[report.reportId]) return;
    setBusyIds((prev) => ({ ...prev, [report.reportId]: true }));

    try {
      const res = await fetch('/api/admin/bugs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ reportId: report.reportId, status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      toast.success(
        nextStatus === 'VERIFIED' ? 'Signed Off (Verified)' : 'Reopened for Investigation',
        { description: `${report.planeIssueId || report.reportId} updated.` }
      );
      await fetchInbox(true);
      notifySidebarBadges();
    } catch (err: any) {
      toast.error('Sign-Off Update Failed', { description: err?.message });
    } finally {
      setBusyIds((prev) => ({ ...prev, [report.reportId]: false }));
    }
  };

  const handleDecisionQuickApprove = async (decision: FounderDecisionRecord) => {
    if (busyIds[decision.id]) return;
    setBusyIds((prev) => ({ ...prev, [decision.id]: true }));
    try {
      const res = await fetch('/api/admin/decisions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          id: decision.id,
          selectedOptionId: decision.selectedOptionId || decision.recommendedOptionId,
          deferredToPlane: false,
          status: 'DECIDED',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      toast.success('Decision Confirmed', { description: decision.title });
      await fetchInbox(true);
      notifySidebarBadges();
    } catch (err: any) {
      toast.error('Decision Save Failed', { description: err?.message });
    } finally {
      setBusyIds((prev) => ({ ...prev, [decision.id]: false }));
    }
  };

  const planeWorkspaceSlug =
    (process.env.NEXT_PUBLIC_PLANE_WORKSPACE_SLUG || '').trim() || 'memory-weaver-studio';

  const renderTicketRefControl = (rawRef: string, opts?: { compact?: boolean }) => {
    const cleanRef = (rawRef || '').trim();
    if (!cleanRef) return null;
    const url = formatPlaneBrowseUrl(cleanRef, planeWorkspaceSlug);
    const displayKey = cleanRef.toUpperCase();
    const compact = Boolean(opts?.compact);

    if (url) {
      return (
        <a
          key={cleanRef}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={
            compact
              ? 'inline-flex items-center gap-1 shrink-0 whitespace-nowrap text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/45 hover:bg-indigo-500/30 transition'
              : 'inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-200 border border-indigo-400/45 hover:bg-indigo-500/30 transition'
          }
        >
          <span>Open {displayKey}</span>
          <ExternalLink className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        </a>
      );
    }

    return (
      <span
        key={cleanRef}
        className="inline-flex items-center shrink-0 whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700"
      >
        {cleanRef}
      </span>
    );
  };

  const activeRedControls = controls.filter(
    (c) => c.severity === 'RED' && isControlActionable(c)
  );
  const activeAmberControls = controls.filter(
    (c) => c.severity === 'AMBER' && isControlActionable(c)
  );
  const heldBlockingCount = controls.filter((c) => c.status === 'HELD_BLOCKING').length;
  const approvedControls = controls.filter((c) => c.status === 'APPROVED');
  const archivedControls = controls.filter(
    (c) => c.status === 'DEFERRED_TO_PLANE' || c.status === 'EXECUTED'
  );

  const isInboxZero =
    activeRedControls.length === 0 &&
    activeAmberControls.length === 0 &&
    readyBugs.length === 0 &&
    pendingDecisions.length === 0;

  return (
    <div className="space-y-6">
      {/* Executive Summary Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-500/40 bg-rose-500/15 text-rose-300">
              🔴 {badges.red} Blocking (RED)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/40 bg-amber-500/15 text-amber-300">
              🟠 {badges.amber} Low-Drag (AMBER)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-sky-500/40 bg-sky-500/15 text-sky-300">
              ✅ {badges.readySignOff} Fixes to Sign Off
            </span>
            {badges.approvedAwaitingCli > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                🚀 {badges.approvedAwaitingCli} Approved — Handed to Antigravity
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Staging Control Plane — approve, hold, or defer decisions below. Antigravity &amp; Gemini own all git pushes, promotions, and mandatory production-to-dev back-merges automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchInbox(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800/70 text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Inbox
        </button>
      </div>

      {/* Live Staging vs Production Build Parity Strip */}
      {parity && (
        <div
          data-testid="INBOX_ENVIRONMENT_PARITY_STRIP"
          className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs ${
            parity.tone === 'emerald'
              ? 'border-emerald-500/35 bg-emerald-950/20 text-emerald-200'
              : parity.tone === 'rose'
              ? 'border-rose-500/50 bg-rose-950/30 text-rose-200'
              : parity.tone === 'amber'
              ? 'border-amber-500/35 bg-amber-950/20 text-amber-200'
              : 'border-slate-700/70 bg-slate-900/50 text-slate-300'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <GitCommit className="h-3 w-3" />
              Staging (dev): {parity.stagingSha || liveCommitSha.slice(0, 7) || 'unknown'}
            </span>
            <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <GitCommit className="h-3 w-3" />
              Production (master): {parity.prodSha || 'unreachable'}
            </span>
            <span className="font-semibold">{parity.label}</span>
          </div>
          <span className="text-[11px] opacity-85">{parity.note}</span>
        </div>
      )}

      {/* Persistent Held-Blocker Banner */}
      {heldBlockingCount > 0 && (
        <div
          data-testid="INBOX_HELD_BLOCKING_BANNER"
          className="rounded-xl border border-rose-500/50 bg-rose-950/35 px-4 py-3 text-xs text-rose-200 flex items-center gap-2.5"
        >
          <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0" />
          <span>
            <strong>{heldBlockingCount} RED gate{heldBlockingCount === 1 ? ' is' : 's are'} currently HELD by Founder.</strong>{' '}
            Downstream pushes/merges remain paused; Antigravity will only work on unblocked items until approved or deferred.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center text-xs font-mono text-slate-400 animate-pulse">
          LOADING FOUNDER INBOX &amp; RELEASE GATES...
        </div>
      ) : (
        <>
          {isInboxZero && (
            <div className="rounded-2xl border border-emerald-500/35 bg-emerald-950/20 p-8 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">All Clear — 0 Items Waiting on Founder</h3>
              <p className="text-xs text-slate-400">
                No RED blockers, AMBER gates, pending cutover decisions, or staging fixes require your sign-off right now.
              </p>
            </div>
          )}

          {/* 1. RED Blocking Release Controls */}
          {activeRedControls.length > 0 && (
            <section className="space-y-3" aria-label="RED Blocking Release Controls">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center gap-2 px-1">
                <AlertOctagon className="h-4 w-4" />
                🔴 RED Gatekeeper — Blocking / Knock-On Drag ({activeRedControls.length})
              </h3>
              <div className="space-y-3">
                {activeRedControls.map((control) => {
                  const statusMeta = STATUS_BADGE_MAP[control.status];
                  const targetMeta = getReleaseControlTargetMeta(control.envTag);
                  const isBusy = Boolean(busyIds[control.id]);
                  const isConfirmingDefer = confirmDeferRedId === control.id;

                  return (
                    <div
                      key={control.id}
                      data-testid={`RELEASE_CONTROL_CARD_${control.id}`}
                      className="rounded-2xl border border-rose-500/45 bg-gradient-to-br from-rose-950/25 via-slate-900/90 to-slate-950/90 p-5 space-y-3.5 shadow-lg"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              🔴 RED
                            </span>
                            <span
                              data-testid={`RELEASE_TARGET_BADGE_${control.id}`}
                              className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${targetMeta.badgeClassName}`}
                            >
                              {targetMeta.isProdTarget && (
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                              )}
                              {targetMeta.badgeLabel}
                            </span>
                            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          {targetMeta.scopeCue && (
                            <p
                              data-testid={`RELEASE_TARGET_SCOPE_${control.id}`}
                              className="text-[11px] font-medium text-rose-200/95 bg-rose-500/10 border border-rose-500/30 rounded-lg px-2.5 py-1 inline-block"
                            >
                              🎯 {targetMeta.scopeCue}
                            </p>
                          )}
                          <h4 className="text-base font-bold text-white">{control.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{control.summary}</p>
                        </div>

                        {control.ticketRefs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {control.ticketRefs.map((ref) => renderTicketRefControl(ref))}
                          </div>
                        )}
                      </div>

                      {/* Mandatory 1-line Knock-On Impact Strip */}
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-200 flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-rose-300">Knock-on impact:</strong> {control.knockOnImpact}
                        </span>
                      </div>

                      {/* Optional Founder Note */}
                      <input
                        type="text"
                        lang="en-GB"
                        value={draftNotes[control.id] ?? ''}
                        onChange={(e) => setDraftNotes((prev) => ({ ...prev, [control.id]: e.target.value }))}
                        placeholder="Optional founder note (saved to audit ledger)..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
                      />

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleControlAction(control, 'APPROVE')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleControlAction(control, 'HOLD')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-500/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25 disabled:opacity-50 transition cursor-pointer"
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          Hold (Pause Downstream)
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleControlAction(control, 'DEFER_TO_PLANE', false)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          Defer to Ticket
                        </button>
                      </div>

                      {/* 1A Knock-On Confirmation Gate for Deferring RED Item */}
                      {isConfirmingDefer && (
                        <div
                          data-testid={`CONFIRM_RED_DEFER_${control.id}`}
                          className="rounded-xl border border-amber-500/50 bg-amber-950/35 p-3.5 space-y-2.5 text-xs"
                        >
                          <div className="text-amber-200 font-semibold">
                            Confirm Deferring RED Blocker to Plane.so (<code className="font-mono text-amber-300">[DEFERRED-BLOCKER]</code>)
                          </div>
                          <p className="text-amber-100/80">
                            Deferring this gate explicitly accepts the knock-on delay: <em>{control.knockOnImpact}</em>
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleControlAction(control, 'DEFER_TO_PLANE', true)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                            >
                              Accept Knock-On &amp; Defer to Plane
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmDeferRedId(null)}
                              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 2. AMBER Low-Drag Release Controls */}
          {activeAmberControls.length > 0 && (
            <section className="space-y-3" aria-label="AMBER Low-Drag Release Controls">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2 px-1">
                <Clock className="h-4 w-4" />
                🟠 AMBER Gatekeeper — Safe to Hold or Defer ({activeAmberControls.length})
              </h3>
              <div className="space-y-3">
                {activeAmberControls.map((control) => {
                  const statusMeta = STATUS_BADGE_MAP[control.status];
                  const targetMeta = getReleaseControlTargetMeta(control.envTag);
                  const isBusy = Boolean(busyIds[control.id]);
                  return (
                    <div
                      key={control.id}
                      data-testid={`RELEASE_CONTROL_CARD_${control.id}`}
                      className="rounded-2xl border border-amber-500/35 bg-slate-900/60 p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35">
                              🟠 AMBER
                            </span>
                            <span
                              data-testid={`RELEASE_TARGET_BADGE_${control.id}`}
                              className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${targetMeta.badgeClassName}`}
                            >
                              {targetMeta.isProdTarget && (
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                              )}
                              {targetMeta.badgeLabel}
                            </span>
                            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          {targetMeta.scopeCue && (
                            <p
                              data-testid={`RELEASE_TARGET_SCOPE_${control.id}`}
                              className="text-[11px] font-medium text-rose-200/95 bg-rose-500/10 border border-rose-500/30 rounded-lg px-2.5 py-1 inline-block"
                            >
                              🎯 {targetMeta.scopeCue}
                            </p>
                          )}
                          <h4 className="text-sm font-bold text-white">{control.title}</h4>
                          <p className="text-xs text-slate-400">{control.summary}</p>
                          <p className="text-[11px] text-amber-200/80">{control.knockOnImpact}</p>
                        </div>

                        {control.ticketRefs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {control.ticketRefs.map((ref) => renderTicketRefControl(ref))}
                          </div>
                        )}
                      </div>

                      <input
                        type="text"
                        lang="en-GB"
                        value={draftNotes[control.id] ?? ''}
                        onChange={(e) => setDraftNotes((prev) => ({ ...prev, [control.id]: e.target.value }))}
                        placeholder="Optional founder note..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleControlAction(control, 'APPROVE')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleControlAction(control, 'HOLD')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          Hold
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleControlAction(control, 'DEFER_TO_PLANE', false)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-50 transition cursor-pointer"
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          Defer to Ticket
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. Ready for 1-Click Sign-Off (FIXED_ON_DEV Bug Fixes) */}
          {readyBugs.length > 0 && (
            <section className="space-y-3" aria-label="Fixes Ready for Founder Sign-Off">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-sky-400 flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  ✅ Ready for 1-Click Sign-Off ({readyBugs.length})
                </h3>
                {onNavigateSuite && (
                  <button
                    type="button"
                    onClick={() => onNavigateSuite('bugs')}
                    className="text-[11px] text-sky-300 hover:underline cursor-pointer"
                  >
                    Open full Founder Sign-Off Queue →
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {readyBugs.map((bug) => {
                  const isBusy = Boolean(busyIds[bug.reportId]);
                  const shaMatches = doesCommitShaMatchLive(bug.fixedInCommitSha, liveCommitSha);
                  const safeRoute = sanitizeBugDeepLinkRoute(bug.path);
                  const planeUrl = bug.planeIssueId ? formatPlaneBrowseUrl(bug.planeIssueId) : null;

                  return (
                    <div
                      key={bug.reportId}
                      className="rounded-2xl border border-sky-500/35 bg-slate-900/60 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {bug.planeIssueId && planeUrl && (
                          <a
                            href={planeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                          >
                            {bug.planeIssueId} ↗
                          </a>
                        )}
                        {bug.fixedInCommitSha && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              shaMatches
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                            }`}
                          >
                            <GitCommit className="h-3 w-3" />
                            {shaMatches ? `Live Fix: ${bug.fixedInCommitSha.slice(0, 7)}` : `SHA: ${bug.fixedInCommitSha.slice(0, 7)}`}
                          </span>
                        )}
                        <a
                          href={safeRoute}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-300 hover:underline ml-auto"
                        >
                          Open Exact Route ({safeRoute})
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <p className="text-xs text-slate-200">{bug.description}</p>
                      {bug.resolutionNotes && (
                        <p className="text-[11px] text-slate-400">Fix: {bug.resolutionNotes}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleBugSignOff(bug, 'VERIFIED')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Sign Off (Verified)
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleBugSignOff(bug, 'OPEN')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-rose-500/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25 disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Still Broken (Reopen)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. Pending Founder Decisions (only PENDING shown here) */}
          {pendingDecisions.length > 0 && (
            <section className="space-y-3" aria-label="Pending Founder Decisions">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                  🧭 Pending Cutover / Policy Decisions ({pendingDecisions.length})
                </h3>
                {onNavigateSuite && (
                  <button
                    type="button"
                    onClick={() => onNavigateSuite('decisions')}
                    className="text-[11px] text-indigo-300 hover:underline cursor-pointer"
                  >
                    Open full Founder Decisions →
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {pendingDecisions.map((d) => {
                  const isBusy = Boolean(busyIds[d.id]);
                  const recOption = d.options.find((o) => o.id === d.recommendedOptionId);
                  return (
                    <div
                      key={d.id}
                      className="rounded-xl border border-indigo-500/30 bg-slate-900/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white">
                          [{d.ticketRef}] {d.title}
                        </div>
                        {recOption && (
                          <div className="text-[11px] text-slate-400">
                            Recommended: <span className="text-emerald-300">{recOption.label}</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDecisionQuickApprove(d)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        Confirm Recommended
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. Approved — Handed to Antigravity for Execution */}
          {approvedControls.length > 0 && (
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 px-1">
                🚀 Approved — Handed to Antigravity for Execution ({approvedControls.length})
              </h3>
              <div className="space-y-2">
                {approvedControls.map((c) => {
                  const isBusy = Boolean(busyIds[c.id]);
                  const targetMeta = getReleaseControlTargetMeta(c.envTag);
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 px-4 py-3 flex flex-wrap items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${targetMeta.badgeClassName}`}>
                            {targetMeta.badgeLabel}
                          </span>
                          <span className="text-xs font-bold text-emerald-200">{c.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Approved by {c.updatedBy} · Queued for Antigravity to execute and verify live
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {c.ticketRefs.map((ref) => renderTicketRefControl(ref, { compact: true }))}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleControlAction(c, 'REOPEN')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-[11px] cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Revert to Pending
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 6. Collapsible Deferred / Executed Audit Ledger */}
          {archivedControls.length > 0 && (
            <section className="rounded-2xl border border-slate-800/80 bg-slate-900/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowLedger((s) => !s)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:bg-slate-800/40 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-slate-400" />
                  Deferred &amp; Executed Release Ledger ({archivedControls.length})
                </span>
                {showLedger ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showLedger && (
                <div className="divide-y divide-slate-800/60 border-t border-slate-800/60">
                  {archivedControls.map((c) => {
                    const meta = STATUS_BADGE_MAP[c.status];
                    const targetMeta = getReleaseControlTargetMeta(c.envTag);
                    const ledgerTickets = Array.from(
                      new Set([
                        ...(c.planeDeferredRef ? [c.planeDeferredRef] : []),
                        ...(c.ticketRefs || []),
                      ])
                    );
                    return (
                      <div key={c.id} className="px-5 py-3 flex flex-wrap items-start justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${meta.className}`}>
                              {meta.label}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${targetMeta.badgeClassName}`}>
                              {targetMeta.badgeLabel}
                            </span>
                            {c.executedCommitSha && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                                SHA {c.executedCommitSha}
                              </span>
                            )}
                            <span className="font-semibold text-slate-200">{c.title}</span>
                          </div>
                          {c.notes && <div className="text-[11px] text-slate-400">Note: {c.notes}</div>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {ledgerTickets.map((ref) => renderTicketRefControl(ref, { compact: true }))}
                          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                            {c.updatedAtIso || ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
