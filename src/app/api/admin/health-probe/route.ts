import { NextRequest, NextResponse } from 'next/server';
import {
  isProductionProject,
  PRODUCTION_APP_URL,
  resolveProjectId,
  resolveStorageBucket,
} from '@/config/environment';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { requireAdminSession } from '@/lib/session';
import { assertSameOriginMutation } from '@/lib/adminOriginGuard';
import {
  classifyStripeKeyMode,
  runHealthProbe,
  type HealthCheckItem,
} from '@/lib/healthProbe';
import { listPlaneStates, loadPlaneEnv } from '@/lib/planeClient';
import type { EnvironmentVersionSnapshot } from '@/lib/releaseControls';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const DEEP_COOLDOWN_MS = 15_000;
const PLANE_FAST_CACHE_TTL_MS = 60_000;
const PEER_TIMEOUT_MS = 6000;

const deepCooldownByAdmin = new Map<string, number>();

export function clearHealthProbeCooldownForTests(): void {
  deepCooldownByAdmin.clear();
}

async function probePeerVersion(peerUrl: string): Promise<EnvironmentVersionSnapshot> {
  if (process.env.VITEST) {
    return { commitSha: null, commitTimestamp: null, reachable: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PEER_TIMEOUT_MS);
  try {
    const res = await fetch(peerUrl, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) {
      return { commitSha: null, commitTimestamp: null, reachable: false };
    }
    const data = await res.json().catch(() => null);
    return {
      commitSha: data?.commitSha ? String(data.commitSha) : null,
      commitTimestamp: data?.commitTimestamp ? String(data.commitTimestamp) : null,
      environment: data?.environment ? String(data.environment) : null,
      projectId: data?.projectId ? String(data.projectId) : null,
      buildTimestamp: data?.buildTimestamp ? String(data.buildTimestamp) : null,
      reachable: Boolean(data?.commitSha),
    };
  } catch {
    return { commitSha: null, commitTimestamp: null, reachable: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function executeHealthProbe(deep: boolean) {
  const projectId = resolveProjectId();
  const isProd = isProductionProject(projectId);

  const selfVersion: EnvironmentVersionSnapshot = {
    commitSha:
      process.env.NEXT_PUBLIC_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_GIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.BUILD_ID ||
      'dev',
    commitTimestamp: process.env.NEXT_PUBLIC_COMMIT_TIME || null,
    environment: isProd ? 'production' : projectId === 'memory-weaver-dev' ? 'staging' : 'unknown',
    projectId,
    reachable: true,
  };

  return runHealthProbe({
    projectId,
    deep,
    selfVersion,
    probePeerVersion,
    checkFirestore: async () => {
      const started = Date.now();
      if (!adminDb) {
        return { ok: false, detail: 'Firebase Admin Firestore not initialised', latencyMs: 0 };
      }
      await adminDb.collection('prelaunch_config').doc('global').get();
      return {
        ok: true,
        detail: `Connected (${projectId || 'unknown'})`,
        latencyMs: Date.now() - started,
      };
    },
    checkStorage: async () => {
      const started = Date.now();
      const bucketName = resolveStorageBucket();
      if (!adminStorage || !bucketName) {
        return {
          ok: false,
          detail: 'Storage bucket not configured on runtime',
          latencyMs: Date.now() - started,
        };
      }
      const [exists] = await adminStorage.bucket(bucketName).exists();
      return {
        ok: Boolean(exists),
        detail: exists ? `Bucket reachable (${bucketName})` : `Bucket missing (${bucketName})`,
        latencyMs: Date.now() - started,
      };
    },
    checkStripe: async (runDeep): Promise<HealthCheckItem> => {
      const started = Date.now();
      const cls = classifyStripeKeyMode(
        process.env.STRIPE_SECRET_KEY,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      const baseMeta = {
        stripeMode: cls.mode,
        webhookSecretConfigured: cls.webhookSecretConfigured,
      };

      if (cls.mode === 'UNSET' || cls.mode === 'PLACEHOLDER') {
        return {
          id: 'stripe',
          label: 'Stripe Billing',
          status: isProd ? 'FAIL' : 'UNCONFIGURED',
          detail: `Key ${cls.mode} · webhook secret ${cls.webhookSecretConfigured ? 'set' : 'missing'}`,
          latencyMs: Date.now() - started,
          meta: baseMeta,
        };
      }

      if (!runDeep || process.env.VITEST) {
        const prodStillTest = isProd && cls.mode === 'TEST';
        return {
          id: 'stripe',
          label: 'Stripe Billing',
          status: !cls.webhookSecretConfigured || prodStillTest ? 'WARN' : 'OK',
          detail: prodStillTest
            ? `TEST MODE active on production (Step 4 pending) · webhook secret ${cls.webhookSecretConfigured ? 'set' : 'missing'}`
            : `${cls.mode} mode · webhook secret ${cls.webhookSecretConfigured ? 'set' : 'missing'}`,
          latencyMs: Date.now() - started,
          meta: baseMeta,
        };
      }

      const { getStripe } = await import('@/lib/stripe');
      const stripe = getStripe();
      const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
      const canonicalUrl = `${PRODUCTION_APP_URL}/api/webhooks/stripe`;
      const matched = endpoints.data.find(
        (ep) => ep.url === canonicalUrl && ep.status === 'enabled'
      );
      const anyEnabled = endpoints.data.some((ep) => ep.status === 'enabled');
      const webhookOk = isProd ? Boolean(matched) : anyEnabled || cls.webhookSecretConfigured;

      return {
        id: 'stripe',
        label: 'Stripe Billing',
        status: webhookOk ? (isProd && cls.mode === 'TEST' ? 'WARN' : 'OK') : 'WARN',
        detail: matched
          ? `${cls.mode} mode · canonical webhook enabled (${matched.enabled_events?.length || 0} events)`
          : `${cls.mode} mode · ${endpoints.data.length} webhook(s) listed; canonical ${canonicalUrl} not enabled`,
        latencyMs: Date.now() - started,
        meta: {
          ...baseMeta,
          canonicalWebhookEnabled: Boolean(matched),
          listedWebhooks: endpoints.data.length,
        },
      };
    },
    checkPlane: async (runDeep): Promise<HealthCheckItem> => {
      const started = Date.now();
      const cfg = loadPlaneEnv({ allowDotEnvLocal: false });
      if (!cfg) {
        return {
          id: 'plane',
          label: 'Plane.so API',
          status: isProd ? 'UNCONFIGURED' : 'INFO',
          detail: 'PLANE_API_KEY pending Phase 2 Secret Manager binding (expected in Phase 1)',
          latencyMs: Date.now() - started,
          meta: { configured: false, expectedPhase1: true },
        };
      }
      const states = await listPlaneStates(cfg, {
        bypassCache: runDeep,
        ttlMs: PLANE_FAST_CACHE_TTL_MS,
      });
      return {
        id: 'plane',
        label: 'Plane.so API',
        status: states.length > 0 ? 'OK' : 'WARN',
        detail: `Connected (${cfg.workspaceSlug} · ${states.length} workflow states)`,
        latencyMs: Date.now() - started,
        meta: { configured: true, statesCount: states.length },
      };
    },
    checkResend: async (runDeep): Promise<HealthCheckItem> => {
      const started = Date.now();
      const key = (process.env.RESEND_API_KEY || '').trim();
      if (!key) {
        return {
          id: 'resend',
          label: 'Resend Email',
          status: isProd ? 'FAIL' : 'UNCONFIGURED',
          detail: 'RESEND_API_KEY not configured',
          latencyMs: Date.now() - started,
          meta: { configured: false },
        };
      }

      if (!runDeep || process.env.VITEST) {
        return {
          id: 'resend',
          label: 'Resend Email',
          status: 'OK',
          detail: 'API key configured (run Deep Smoke Test to verify SPF/DKIM domain status)',
          latencyMs: Date.now() - started,
          meta: { configured: true },
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PEER_TIMEOUT_MS);
      try {
        const res = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${key}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) {
          return {
            id: 'resend',
            label: 'Resend Email',
            status: 'FAIL',
            detail: `Resend /domains returned HTTP ${res.status}`,
            latencyMs: Date.now() - started,
          };
        }
        const json = await res.json().catch(() => ({}));
        const domains: any[] = Array.isArray(json?.data) ? json.data : [];
        const verified = domains.find(
          (d) => String(d?.name || '').includes('memoryweaver.studio') && d?.status === 'verified'
        );
        return {
          id: 'resend',
          label: 'Resend Email',
          status: verified ? 'OK' : 'WARN',
          detail: verified
            ? `Domain verified (${verified.name} · SPF/DKIM active)`
            : `${domains.length} domain(s) listed; memoryweaver.studio not yet verified`,
          latencyMs: Date.now() - started,
          meta: { configured: true, verifiedDomain: Boolean(verified) },
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    checkAiWeaver: async (runDeep): Promise<HealthCheckItem> => {
      const started = Date.now();
      if (!process.env.SERVICE_ACCOUNT_JSON) {
        return {
          id: 'ai_weaver',
          label: 'AI Weaver (Genkit)',
          status: 'UNCONFIGURED',
          detail: 'SERVICE_ACCOUNT_JSON unset (cannot mint Generative Language OAuth token)',
          latencyMs: Date.now() - started,
        };
      }

      if (process.env.VITEST && !runDeep) {
        return {
          id: 'ai_weaver',
          label: 'AI Weaver (Genkit)',
          status: 'OK',
          detail: 'OAuth credentials present (Vitest fast mode)',
          latencyMs: Date.now() - started,
        };
      }

      // Lazy dynamic import keeps top-level route & test startup fast
      const genkitMod = await import('@/ai/genkit');
      if (!runDeep) {
        const token = await genkitMod.resolveServiceAccountAccessToken();
        return {
          id: 'ai_weaver',
          label: 'AI Weaver (Genkit)',
          status: token ? 'OK' : 'FAIL',
          detail: token
            ? 'Service Account OAuth token active (0 LLM tokens used)'
            : 'Failed to mint Generative Language OAuth token',
          latencyMs: Date.now() - started,
        };
      }

      const aiInstance = await genkitMod.getAI();
      const response = await aiInstance.generate({
        prompt: 'Reply strictly with OK',
        config: { maxOutputTokens: 5, temperature: 0 },
      });
      const text = (response?.text || '').trim();
      return {
        id: 'ai_weaver',
        label: 'AI Weaver (Genkit)',
        status: text.length > 0 ? 'OK' : 'WARN',
        detail: text
          ? `Live 5-token Genkit ping succeeded ("${text.slice(0, 20)}")`
          : 'Genkit responded with empty text',
        latencyMs: Date.now() - started,
      };
    },
  });
}

export async function GET() {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const report = await executeHealthProbe(false);
    return NextResponse.json({ success: true, ...report }, { headers: NO_STORE_HEADERS });
  } catch (err: any) {
    console.error('[GET /api/admin/health-probe] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Health probe failed.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const originBlocked = assertSameOriginMutation(req, NO_STORE_HEADERS);
    if (originBlocked) return originBlocked;

    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const searchParams = (req.nextUrl ?? new URL(req.url)).searchParams;
    const body = await req.json().catch(() => ({}));
    const deep = searchParams.get('deep') === '1' || body?.deep === true;

    if (deep) {
      const adminKey = (authResult.session?.email || authResult.session?.uid || 'admin').toLowerCase();
      const now = Date.now();
      const lastRun = deepCooldownByAdmin.get(adminKey) || 0;
      const elapsed = now - lastRun;
      if (elapsed < DEEP_COOLDOWN_MS) {
        const retryAfterSeconds = Math.max(1, Math.ceil((DEEP_COOLDOWN_MS - elapsed) / 1000));
        return NextResponse.json(
          {
            success: false,
            error: `Deep smoke test cooldown active. Please wait ${retryAfterSeconds}s before re-running.`,
            retryAfterSeconds,
          },
          {
            status: 429,
            headers: {
              ...NO_STORE_HEADERS,
              'Retry-After': String(retryAfterSeconds),
            },
          }
        );
      }
      deepCooldownByAdmin.set(adminKey, now);
    }

    const report = await executeHealthProbe(deep);
    return NextResponse.json({ success: true, ...report }, { headers: NO_STORE_HEADERS });
  } catch (err: any) {
    console.error('[POST /api/admin/health-probe] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Deep health probe failed.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
