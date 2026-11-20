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

export type HealthCheckStatus = 'OK' | 'WARN' | 'FAIL' | 'UNCONFIGURED';

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

export interface HealthProbeReport {
  overall: 'OK' | 'WARN' | 'FAIL';
  mode: 'FAST' | 'DEEP';
  environment: 'production' | 'staging' | 'unknown';
  projectId: string | null;
  checkedAtIso: string;
  durationMs: number;
  parity: EnvironmentParityReport;
  checks: HealthCheckItem[];
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

export function computeOverallHealthStatus(checks: HealthCheckItem[]): 'OK' | 'WARN' | 'FAIL' {
  if (checks.some((c) => c.status === 'FAIL')) return 'FAIL';
  if (checks.some((c) => c.status === 'WARN' || c.status === 'UNCONFIGURED')) return 'WARN';
  return 'OK';
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

  const parityCheck: HealthCheckItem = {
    id: 'build_parity',
    label: 'Build Parity',
    status:
      parity.status === 'IN_SYNC'
        ? 'OK'
        : parity.status === 'PROD_NEWER_CHECK_BACKMERGE'
        ? 'FAIL'
        : 'WARN',
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

  return {
    overall: computeOverallHealthStatus(checks),
    mode: adapters.deep ? 'DEEP' : 'FAST',
    environment,
    projectId: adapters.projectId,
    checkedAtIso: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    parity,
    checks,
  };
}

export function formatHealthProbeCliLines(report: HealthProbeReport): string[] {
  const iconFor = (s: HealthCheckStatus | 'OK' | 'WARN' | 'FAIL') =>
    s === 'OK' ? '✅' : s === 'FAIL' ? '❌' : s === 'UNCONFIGURED' ? '⚙️' : '🟠';

  const lines: string[] = [
    `${iconFor(report.overall)} SYNTHETIC HEALTH PROBE [${report.mode}] — ${report.environment.toUpperCase()} (${report.projectId || 'unknown'}) | Overall: ${report.overall} (${report.durationMs}ms)`,
  ];
  for (const check of report.checks) {
    const ms = typeof check.latencyMs === 'number' ? ` (${check.latencyMs}ms)` : '';
    lines.push(`  ${iconFor(check.status)} ${check.label.padEnd(20)}: [${check.status}] ${check.detail}${ms}`);
  }
  return lines;
}
