/**
 * Pure, dependency-injected synthetic health & readiness probe engine.
 * Shared by `/api/admin/health-probe` (browser MFA) and `npm.cmd run qa:smoke` (local CLI).
 * Zero top-level Firebase, Genkit, or Stripe SDK imports so unit tests run in milliseconds.
 */

import {
  isProductionProject,
  PRODUCTION_APP_URL,
  STAGING_APP_URL,
} from '@/config/environment';
import {
  evaluateEnvironmentParity,
  type EnvironmentParityReport,
  type EnvironmentVersionSnapshot,
} from '@/lib/releaseControls';

export type HealthCheckStatus = 'OK' | 'INFO' | 'WARN' | 'FAIL' | 'UNCONFIGURED';

export type HealthCheckId =
  | 'build_parity'
  | 'firestore'
  | 'storage'
  | 'stripe'
  | 'plane'
  | 'resend'
  | 'ai_weaver';

export interface HealthCheckItem {
  id: HealthCheckId;
  label: string;
  status: HealthCheckStatus;
  detail: string;
  latencyMs?: number;
  meta?: Record<string, string | number | boolean | null>;
}

export type StripeKeyMode = 'LIVE' | 'TEST' | 'PLACEHOLDER' | 'UNSET';

export interface StripeModeClassification {
  mode: StripeKeyMode;
  webhookSecretConfigured: boolean;
}

export interface LatestDeepSmokeSnapshot {
  commitSha: string | null;
  checkedAtIso: string;
  overall: 'OK' | 'WARN' | 'FAIL';
  corePassedCount: number;
  coreTotalCount: number;
  durationMs: number;
  triggeredBy?: string | null;
  matchesCurrentBuild?: boolean;
}

export interface HealthProbeReport {
  overall: 'OK' | 'WARN' | 'FAIL';
  mode: 'FAST' | 'DEEP';
  environment: 'production' | 'staging' | 'unknown';
  projectId: string | null;
  checkedAtIso: string;
  durationMs: number;
  corePassedCount: number;
  coreTotalCount: number;
  infoCount: number;
  latestDeepSmoke?: LatestDeepSmokeSnapshot | null;
  parity: EnvironmentParityReport;
  checks: HealthCheckItem[];
}

export function evaluateDeepSmokeFreshness(
  latest: LatestDeepSmokeSnapshot | null | undefined,
  currentCommitSha?: string | null
): {
  isFreshForBuild: boolean;
  label: string;
  highlightButton: boolean;
} {
  const normCurrent = (currentCommitSha || '').trim().toLowerCase().slice(0, 7);
  const normLatest = (latest?.commitSha || '').trim().toLowerCase().slice(0, 7);

  if (!latest || !normLatest) {
    return {
      isFreshForBuild: false,
      label: normCurrent
        ? `Build ${normCurrent} not yet deep-tested`
        : 'No deep smoke test recorded yet',
      highlightButton: true,
    };
  }

  const matches = Boolean(normCurrent && normLatest === normCurrent);
  const timeMatch = latest.checkedAtIso?.match(/T(\d{2}:\d{2})/);
  const shortTime = timeMatch ? `${timeMatch[1]} UTC` : latest.checkedAtIso;

  if (matches && latest.overall === 'OK') {
    return {
      isFreshForBuild: true,
      label: `✅ Build ${normLatest} Deep-Verified (${shortTime})`,
      highlightButton: false,
    };
  }

  if (matches) {
    return {
      isFreshForBuild: false,
      label: `Last deep check on ${normLatest}: ${latest.overall} (${shortTime})`,
      highlightButton: true,
    };
  }

  return {
    isFreshForBuild: false,
    label: `New build ${normCurrent || 'pending'} not deep-tested yet (last verified: ${normLatest})`,
    highlightButton: true,
  };
}

export interface HealthProbeAdapters {
  projectId: string | null;
  deep: boolean;
  selfVersion: EnvironmentVersionSnapshot;
  probePeerVersion: (peerUrl: string) => Promise<EnvironmentVersionSnapshot>;
  checkFirestore: () => Promise<{ ok: boolean; detail: string; latencyMs: number }>;
  checkStorage: () => Promise<{ ok: boolean; detail: string; latencyMs: number }>;
  checkStripe: (deep: boolean) => Promise<HealthCheckItem>;
  checkPlane: (deep: boolean) => Promise<HealthCheckItem>;
  checkResend: (deep: boolean) => Promise<HealthCheckItem>;
  checkAiWeaver: (deep: boolean) => Promise<HealthCheckItem>;
}

/**
 * Classifies Stripe secret key mode strictly server-side without ever exposing key material.
 */
export function classifyStripeKeyMode(
  secretKey?: string | null,
  webhookSecret?: string | null
): StripeModeClassification {
  const key = (secretKey || '').trim();
  const wh = (webhookSecret || '').trim();
  const webhookSecretConfigured = wh.startsWith('whsec_') && wh.length >= 16;

  if (!key) {
    return { mode: 'UNSET', webhookSecretConfigured };
  }
  if (/placeholder|changeme|mock/i.test(key)) {
    return { mode: 'PLACEHOLDER', webhookSecretConfigured };
  }
  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) {
    return { mode: 'LIVE', webhookSecretConfigured };
  }
  if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) {
    return { mode: 'TEST', webhookSecretConfigured };
  }
  return { mode: 'PLACEHOLDER', webhookSecretConfigured };
}

/**
 * Computes overall health status:
 * - Any FAIL -> FAIL
 * - Any WARN -> WARN
 * - Calm INFO and expected UNCONFIGURED staging notices never poison a passing OK verdict.
 */
export function computeOverallHealthStatus(checks: HealthCheckItem[]): 'OK' | 'WARN' | 'FAIL' {
  if (checks.some((c) => c.status === 'FAIL')) return 'FAIL';
  if (checks.some((c) => c.status === 'WARN')) return 'WARN';
  return 'OK';
}

export function computeCoreHealthCounts(checks: HealthCheckItem[]): {
  corePassedCount: number;
  coreTotalCount: number;
  infoCount: number;
} {
  let corePassedCount = 0;
  let coreTotalCount = 0;
  let infoCount = 0;

  for (const check of checks) {
    if (check.status === 'INFO' || check.status === 'UNCONFIGURED') {
      infoCount += 1;
      continue;
    }
    coreTotalCount += 1;
    if (check.status === 'OK') {
      corePassedCount += 1;
    }
  }

  return { corePassedCount, coreTotalCount, infoCount };
}

export function resolvePeerVersionUrl(projectId: string | null): {
  isProd: boolean;
  peerUrl: string;
} {
  const isProd = isProductionProject(projectId);
  return {
    isProd,
    peerUrl: `${isProd ? STAGING_APP_URL : PRODUCTION_APP_URL}/api/version`,
  };
}

async function safeTimedCheck(
  id: HealthCheckId,
  label: string,
  fn: () => Promise<HealthCheckItem>
): Promise<HealthCheckItem> {
  const started = Date.now();
  try {
    const result = await fn();
    return {
      ...result,
      latencyMs: typeof result.latencyMs === 'number' ? result.latencyMs : Date.now() - started,
    };
  } catch (err: any) {
    return {
      id,
      label,
      status: 'FAIL',
      detail: err?.message || 'Unexpected probe error',
      latencyMs: Date.now() - started,
    };
  }
}

/**
 * Pure dependency-injected synthetic probe runner.
 * Executes all 7 readiness probes concurrently and returns a deterministic HealthProbeReport.
 */
export async function runHealthProbe(adapters: HealthProbeAdapters): Promise<HealthProbeReport> {
  const startedAt = Date.now();
  const { isProd, peerUrl } = resolvePeerVersionUrl(adapters.projectId);
  const environment: 'production' | 'staging' | 'unknown' = isProd
    ? 'production'
    : adapters.projectId === 'memory-weaver-dev'
    ? 'staging'
    : 'unknown';

  const [peerSnapshot, fsRes, storageRes, stripeCheck, planeCheck, resendCheck, aiCheck] =
    await Promise.all([
      adapters
        .probePeerVersion(peerUrl)
        .catch(
          (): EnvironmentVersionSnapshot => ({
            commitSha: null,
            commitTimestamp: null,
            reachable: false,
          })
        ),
      safeTimedCheck('firestore', 'Firestore', async () => {
        const res = await adapters.checkFirestore();
        return {
          id: 'firestore',
          label: 'Firestore',
          status: res.ok ? 'OK' : 'FAIL',
          detail: res.detail,
          latencyMs: res.latencyMs,
        };
      }),
      safeTimedCheck('storage', 'Cloud Storage', async () => {
        const res = await adapters.checkStorage();
        return {
          id: 'storage',
          label: 'Cloud Storage',
          status: res.ok ? 'OK' : 'FAIL',
          detail: res.detail,
          latencyMs: res.latencyMs,
        };
      }),
      safeTimedCheck('stripe', 'Stripe Billing', () => adapters.checkStripe(adapters.deep)),
      safeTimedCheck('plane', 'Plane.so API', () => adapters.checkPlane(adapters.deep)),
      safeTimedCheck('resend', 'Resend Email', () => adapters.checkResend(adapters.deep)),
      safeTimedCheck('ai_weaver', 'AI Weaver (Genkit)', () => adapters.checkAiWeaver(adapters.deep)),
    ]);

  const stagingSnap = isProd ? peerSnapshot : adapters.selfVersion;
  const prodSnap = isProd ? adapters.selfVersion : peerSnapshot;
  const parity = evaluateEnvironmentParity(stagingSnap, prodSnap);

  // STAGING_AHEAD is the normal everyday state of staging prior to master promotion -> calm INFO (never poisons PASS!)
  const parityStatus: HealthCheckStatus =
    parity.status === 'IN_SYNC'
      ? 'OK'
      : parity.status === 'PROD_NEWER_CHECK_BACKMERGE'
      ? 'FAIL'
      : parity.status === 'STAGING_AHEAD' && environment === 'staging'
      ? 'INFO'
      : 'WARN';

  const parityCheck: HealthCheckItem = {
    id: 'build_parity',
    label: 'Build Parity',
    status: parityStatus,
    detail: `${parity.label} (staging=${parity.stagingSha || '?'}, prod=${parity.prodSha || 'unreachable'})`,
    meta: {
      parityStatus: parity.status,
      stagingSha: parity.stagingSha,
      prodSha: parity.prodSha,
    },
  };

  const checks: HealthCheckItem[] = [
    parityCheck,
    fsRes,
    storageRes,
    stripeCheck,
    planeCheck,
    resendCheck,
    aiCheck,
  ];

  const { corePassedCount, coreTotalCount, infoCount } = computeCoreHealthCounts(checks);

  return {
    overall: computeOverallHealthStatus(checks),
    mode: adapters.deep ? 'DEEP' : 'FAST',
    environment,
    projectId: adapters.projectId,
    checkedAtIso: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    corePassedCount,
    coreTotalCount,
    infoCount,
    parity,
    checks,
  };
}

export function formatHealthProbeCliLines(report: HealthProbeReport): string[] {
  const iconFor = (s: HealthCheckStatus | 'OK' | 'WARN' | 'FAIL') =>
    s === 'OK' ? '✅' : s === 'FAIL' ? '❌' : s === 'INFO' ? 'ℹ️' : s === 'UNCONFIGURED' ? '⚙️' : '🟠';

  const lines: string[] = [
    `${iconFor(report.overall)} SYNTHETIC HEALTH PROBE [${report.mode}] — ${report.environment.toUpperCase()} (${report.projectId || 'unknown'}) | Overall: ${report.overall} (${report.corePassedCount}/${report.coreTotalCount} core OK, ${report.infoCount} info, ${report.durationMs}ms)`,
  ];
  for (const check of report.checks) {
    const ms = typeof check.latencyMs === 'number' ? ` (${check.latencyMs}ms)` : '';
    lines.push(`  ${iconFor(check.status)} ${check.label.padEnd(20)}: [${check.status}] ${check.detail}${ms}`);
  }
  return lines;
}

/**
 * Formats a concise plain-Markdown proof receipt suitable for pasting into chat or a Plane comment.
 */
export function formatHealthProbeMarkdownReceipt(report: HealthProbeReport): string {
  const verdict =
    report.overall === 'OK'
      ? `✅ PASS — ${report.corePassedCount}/${report.coreTotalCount} Core Systems Healthy`
      : report.overall === 'FAIL'
      ? `❌ FAIL — Action Required (${report.corePassedCount}/${report.coreTotalCount} Core Passed)`
      : `⚠️ WARN — Review Needed (${report.corePassedCount}/${report.coreTotalCount} Core Passed)`;

  const headerLines = [
    `### Synthetic Health Receipt (${report.mode})`,
    `- **Verdict:** ${verdict}${report.infoCount > 0 ? ` · ${report.infoCount} expected notice(s)` : ''}`,
    `- **Environment:** ${report.environment.toUpperCase()} (\`${report.projectId || 'unknown'}\`)`,
    `- **Checked At:** ${report.checkedAtIso} (${report.durationMs}ms)`,
    '',
  ];

  const checkLines = report.checks.map((c) => {
    const badge =
      c.status === 'OK'
        ? '✅ PASS'
        : c.status === 'FAIL'
        ? '❌ FAIL'
        : c.status === 'INFO'
        ? 'ℹ️ INFO'
        : c.status === 'UNCONFIGURED'
        ? 'ℹ️ UNCONFIGURED'
        : '⚠️ WARN';
    const ms = typeof c.latencyMs === 'number' ? ` (${c.latencyMs}ms)` : '';
    return `- **${c.label}:** ${badge} — ${c.detail}${ms}`;
  });

  return [...headerLines, ...checkLines].join('\n');
}
