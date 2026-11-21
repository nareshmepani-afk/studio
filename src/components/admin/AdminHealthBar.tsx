'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Info,
  RefreshCw,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  computeCoreHealthCounts,
  computeOverallHealthStatus,
  formatHealthProbeMarkdownReceipt,
  type HealthCheckItem,
  type HealthCheckStatus,
  type HealthProbeReport,
} from '@/lib/healthProbe';

interface AdminHealthBarProps {
  compact?: boolean;
}

interface HealthProbeApiPayload extends Partial<HealthProbeReport> {
  success?: boolean;
  error?: string;
}

const STATUS_PILL_STYLES: Record<HealthCheckStatus, string> = {
  OK: 'border-emerald-500/35 bg-emerald-950/25 text-emerald-300',
  INFO: 'border-sky-500/35 bg-sky-950/20 text-sky-200',
  WARN: 'border-amber-500/40 bg-amber-950/25 text-amber-200',
  FAIL: 'border-rose-500/50 bg-rose-950/35 text-rose-200',
  UNCONFIGURED: 'border-slate-700 bg-slate-900/70 text-slate-300',
};

const OVERALL_BORDER: Record<'OK' | 'WARN' | 'FAIL', string> = {
  OK: 'border-emerald-500/35 bg-emerald-950/15',
  WARN: 'border-amber-500/35 bg-amber-950/15',
  FAIL: 'border-rose-500/45 bg-rose-950/25',
};

function formatUtcTime(iso?: string | null): string {
  if (!iso) return '';
  const match = iso.match(/T(\d{2}:\d{2}:\d{2})/);
  return match ? `${match[1]} UTC` : iso;
}

/**
 * Shared live synthetic readiness bar mounted in both FounderInboxConsole and DevOpsConsole.
 * - Classifies calm INFO notices separately so healthy core runs show an unambiguous PASS verdict.
 * - Auto-expands a detailed Deep Smoke Receipt (even in compact mode) whenever Run Deep Smoke Test completes,
 *   with Collapse/Expand and plain-Markdown Copy Receipt controls.
 * - Safely guards `Array.isArray(data?.checks)` so partial/mocked responses never throw.
 */
export function AdminHealthBar({ compact = false }: AdminHealthBarProps) {
  const [report, setReport] = useState<HealthProbeReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningDeep, setRunningDeep] = useState<boolean>(false);
  const [receiptExpanded, setReceiptExpanded] = useState<boolean>(!compact);
  const [error, setError] = useState<string | null>(null);

  const runProbe = useCallback(async (deep: boolean) => {
    if (deep) setRunningDeep(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        deep ? '/api/admin/health-probe?deep=1' : '/api/admin/health-probe',
        {
          method: deep ? 'POST' : 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
          ...(deep
            ? {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deep: true }),
              }
            : {}),
        }
      );

      const data = (await res.json().catch(() => null)) as HealthProbeApiPayload | null;
      if (!res.ok || !data?.success) {
        const msg = data?.error || `HTTP ${res.status}`;
        if (deep) {
          toast.error('Deep Smoke Test Unavailable', { description: msg });
        }
        setError(msg);
        return;
      }

      if (!Array.isArray(data.checks)) {
        // Degrade silently on non-health/mocked payloads
        setReport(null);
        return;
      }

      const derivedCounts = computeCoreHealthCounts(data.checks);
      const derivedOverall =
        data.overall === 'FAIL' || data.overall === 'WARN' || data.overall === 'OK'
          ? data.overall
          : computeOverallHealthStatus(data.checks);

      const validReport: HealthProbeReport = {
        overall: derivedOverall,
        mode: data.mode === 'DEEP' ? 'DEEP' : 'FAST',
        environment: data.environment || 'unknown',
        projectId: data.projectId ?? null,
        checkedAtIso: data.checkedAtIso || new Date().toISOString(),
        durationMs: typeof data.durationMs === 'number' ? data.durationMs : 0,
        corePassedCount:
          typeof data.corePassedCount === 'number'
            ? data.corePassedCount
            : derivedCounts.corePassedCount,
        coreTotalCount:
          typeof data.coreTotalCount === 'number'
            ? data.coreTotalCount
            : derivedCounts.coreTotalCount,
        infoCount:
          typeof data.infoCount === 'number' ? data.infoCount : derivedCounts.infoCount,
        parity: data.parity as HealthProbeReport['parity'],
        checks: data.checks,
      };
      setReport(validReport);

      if (deep) {
        setReceiptExpanded(true);
        const toastTitle =
          validReport.overall === 'OK'
            ? `Deep Smoke PASS — ${validReport.corePassedCount}/${validReport.coreTotalCount} Core Healthy`
            : validReport.overall === 'FAIL'
            ? 'Deep Smoke FAIL — Action Required'
            : 'Deep Smoke WARN — Review Needed';
        toast.success(toastTitle, {
          description: `Completed in ${validReport.durationMs}ms. Full receipt expanded below.`,
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to reach /api/admin/health-probe.';
      setError(msg);
      if (deep) {
        toast.error('Deep Smoke Test Failed', { description: msg });
      }
    } finally {
      setLoading(false);
      setRunningDeep(false);
    }
  }, []);

  useEffect(() => {
    runProbe(false);
  }, [runProbe]);

  const handleCopyReceipt = async () => {
    if (!report) return;
    const markdown = formatHealthProbeMarkdownReceipt(report);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      }
      toast.success('Copied Health Receipt (Markdown)', {
        description: 'Ready to paste into chat or a Plane ticket note.',
      });
    } catch {
      toast.error('Clipboard Copy Blocked', {
        description: 'Browser blocked clipboard access — inspect receipt details below.',
      });
    }
  };

  const checks: HealthCheckItem[] = Array.isArray(report?.checks) ? report.checks : [];
  const overall = report?.overall || 'OK';

  if (!loading && !report && !error) {
    return null;
  }

  const verdictLabel = report
    ? overall === 'OK'
      ? `✅ PASS — ${report.corePassedCount}/${report.coreTotalCount} Core Systems Healthy`
      : overall === 'FAIL'
      ? `❌ FAIL — Action Required (${report.corePassedCount}/${report.coreTotalCount} Core Passed)`
      : `⚠️ WARN — Review Needed (${report.corePassedCount}/${report.coreTotalCount} Core Passed)`
    : 'Synthetic System Health';

  return (
    <section
      data-testid="ADMIN_HEALTH_BAR"
      aria-label="Live Synthetic Health Probe"
      className={`rounded-2xl border p-4 space-y-3 ${
        report ? OVERALL_BORDER[overall] : 'border-slate-800/80 bg-slate-900/40'
      }`}
    >
      {/* Top Verdict Banner & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              data-testid="ADMIN_HEALTH_VERDICT"
              className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wide ${
                overall === 'OK'
                  ? 'text-emerald-300'
                  : overall === 'FAIL'
                  ? 'text-rose-200'
                  : 'text-amber-200'
              }`}
            >
              {!report && <Activity className="h-4 w-4 text-emerald-400" />}
              <span>{verdictLabel}</span>
            </span>

            {report && (
              <span
                data-testid="ADMIN_HEALTH_OVERALL_BADGE"
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  overall === 'OK'
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : overall === 'FAIL'
                    ? 'border-rose-500/50 bg-rose-500/20 text-rose-200'
                    : 'border-amber-500/45 bg-amber-500/15 text-amber-200'
                }`}
              >
                {report.mode} · {report.durationMs}ms
              </span>
            )}
          </div>

          {report && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="inline-flex items-center gap-1" data-testid="ADMIN_HEALTH_TIMESTAMP">
                <Clock className="h-3 w-3" />
                Last {report.mode === 'DEEP' ? 'Deep Smoke' : 'Fast Check'}: {formatUtcTime(report.checkedAtIso)}
              </span>
              {report.infoCount > 0 && (
                <span className="text-sky-300/90">
                  · {report.infoCount} expected notice{report.infoCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {report && (
            <>
              <button
                type="button"
                data-testid="ADMIN_HEALTH_COPY_BTN"
                onClick={handleCopyReceipt}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:border-emerald-500/50 text-slate-200 text-[11px] font-medium transition cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                Copy Receipt
              </button>
              <button
                type="button"
                data-testid="ADMIN_HEALTH_TOGGLE_RECEIPT_BTN"
                onClick={() => setReceiptExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:border-slate-500 text-slate-300 text-[11px] font-medium transition cursor-pointer"
              >
                {receiptExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Details
                  </>
                )}
              </button>
            </>
          )}
          <button
            type="button"
            disabled={loading || runningDeep}
            data-testid="ADMIN_HEALTH_REFRESH_BTN"
            onClick={() => runProbe(false)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:border-indigo-500/50 text-slate-200 text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            disabled={loading || runningDeep}
            data-testid="ADMIN_HEALTH_DEEP_BTN"
            onClick={() => runProbe(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
          >
            <Zap className="h-3 w-3" />
            {runningDeep ? 'Running Deep Smoke...' : 'Run Deep Smoke Test'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !report ? (
        <div className="text-[11px] font-mono text-slate-400">
          PROBING FIRESTORE, STORAGE, STRIPE, PLANE, RESEND &amp; AI WEAVER...
        </div>
      ) : checks.length > 0 ? (
        <>
          {/* Compact Summary Strip (always visible when collapsed) */}
          {!receiptExpanded && (
            <div className="flex flex-wrap gap-2">
              {checks.map((c) => (
                <div
                  key={c.id}
                  data-testid={`HEALTH_CHECK_${c.id}`}
                  title={c.detail}
                  className={`rounded-xl border px-3 py-1.5 text-xs ${STATUS_PILL_STYLES[c.status]}`}
                >
                  <div className="flex items-center gap-1.5 font-mono font-bold text-[11px]">
                    {c.status === 'OK' ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    ) : c.status === 'FAIL' ? (
                      <ShieldAlert className="h-3 w-3 text-rose-400 shrink-0" />
                    ) : c.status === 'INFO' || c.status === 'UNCONFIGURED' ? (
                      <Info className="h-3 w-3 text-sky-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                    )}
                    <span>{c.label}</span>
                    <span className="opacity-85">{c.status === 'OK' ? 'PASS' : c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Auto-Expanded Proof Receipt (full per-check evidence, latency & status) */}
          {receiptExpanded && (
            <div
              data-testid="ADMIN_HEALTH_RECEIPT"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1"
            >
              {checks.map((c) => (
                <div
                  key={c.id}
                  data-testid={`HEALTH_CHECK_${c.id}`}
                  className={`rounded-xl border px-3 py-2.5 text-xs space-y-1 ${STATUS_PILL_STYLES[c.status]}`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono font-bold text-[11px]">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      {c.status === 'OK' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : c.status === 'FAIL' ? (
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      ) : c.status === 'INFO' || c.status === 'UNCONFIGURED' ? (
                        <Info className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      )}
                      <span>{c.label}</span>
                    </span>
                    <span className="shrink-0 opacity-90">
                      {c.status === 'OK' ? 'PASS' : c.status}
                      {typeof c.latencyMs === 'number' ? ` · ${c.latencyMs}ms` : ''}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-snug break-words">{c.detail}</p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
