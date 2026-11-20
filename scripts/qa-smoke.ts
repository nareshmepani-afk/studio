import https from 'https';
import {
  PRODUCTION_APP_URL,
  STAGING_APP_URL,
} from '../src/config/environment';
import {
  classifyStripeKeyMode,
  formatHealthProbeCliLines,
  runHealthProbe,
} from '../src/lib/healthProbe';
import { listPlaneStates, loadPlaneEnv } from '../src/lib/planeClient';
import type { EnvironmentVersionSnapshot } from '../src/lib/releaseControls';
import { getStagingAdmin, STAGING_STORAGE_BUCKET } from './lib/stagingAdmin';

function fetchVersionNativeHttps(
  url: string,
  timeoutMs = 12000
): Promise<EnvironmentVersionSnapshot> {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if ((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300) {
          try {
            const data = JSON.parse(body);
            resolve({
              commitSha: data?.commitSha ? String(data.commitSha) : null,
              commitTimestamp: data?.commitTimestamp ? String(data.commitTimestamp) : null,
              environment: data?.environment ? String(data.environment) : null,
              projectId: data?.projectId ? String(data.projectId) : null,
              buildTimestamp: data?.buildTimestamp ? String(data.buildTimestamp) : null,
              reachable: Boolean(data?.commitSha),
            });
            return;
          } catch {
            // Fall through to unreachable
          }
        }
        resolve({ commitSha: null, commitTimestamp: null, reachable: false });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ commitSha: null, commitTimestamp: null, reachable: false });
    });
    req.on('error', () => resolve({ commitSha: null, commitTimestamp: null, reachable: false }));
  });
}

export async function runCliSmokeProbe(argv: string[] = process.argv.slice(2)) {
  const deep = argv.includes('--deep');
  const { adminDb, adminStorage, projectId } = getStagingAdmin();

  const selfVersion = await fetchVersionNativeHttps(`${STAGING_APP_URL}/api/version`, 12000);
  const report = await runHealthProbe({
    projectId,
    deep,
    selfVersion,
    probePeerVersion: () => fetchVersionNativeHttps(`${PRODUCTION_APP_URL}/api/version`, 12000),
    checkFirestore: async () => {
      const started = Date.now();
      await adminDb.collection('prelaunch_config').doc('global').get();
      return {
        ok: true,
        detail: `Connected (${projectId})`,
        latencyMs: Date.now() - started,
      };
    },
    checkStorage: async () => {
      const started = Date.now();
      const [exists] = await adminStorage.bucket(STAGING_STORAGE_BUCKET).exists();
      return {
        ok: Boolean(exists),
        detail: exists
          ? `Bucket reachable (${STAGING_STORAGE_BUCKET})`
          : `Bucket missing (${STAGING_STORAGE_BUCKET})`,
        latencyMs: Date.now() - started,
      };
    },
    checkStripe: async () => {
      const cls = classifyStripeKeyMode(
        process.env.STRIPE_SECRET_KEY,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return {
        id: 'stripe',
        label: 'Stripe Billing',
        status: cls.mode === 'UNSET' || cls.mode === 'PLACEHOLDER' ? 'UNCONFIGURED' : 'OK',
        detail: `Local env Stripe mode=${cls.mode} (use /api/admin/health-probe on Cloud Run for deployed secret status)`,
      };
    },
    checkPlane: async (runDeep) => {
      const started = Date.now();
      const cfg = loadPlaneEnv({ allowDotEnvLocal: true });
      if (!cfg) {
        return {
          id: 'plane',
          label: 'Plane.so API',
          status: 'UNCONFIGURED',
          detail: 'PLANE_API_KEY not found in env or .env.local',
          latencyMs: Date.now() - started,
        };
      }
      const states = await listPlaneStates(cfg, { bypassCache: runDeep });
      return {
        id: 'plane',
        label: 'Plane.so API',
        status: states.length > 0 ? 'OK' : 'WARN',
        detail: `Connected (${cfg.workspaceSlug} · ${states.length} states)`,
        latencyMs: Date.now() - started,
      };
    },
    checkResend: async () => {
      const hasKey = Boolean((process.env.RESEND_API_KEY || '').trim());
      return {
        id: 'resend',
        label: 'Resend Email',
        status: hasKey ? 'OK' : 'UNCONFIGURED',
        detail: hasKey
          ? 'RESEND_API_KEY present in local environment'
          : 'Not set locally (bound in Cloud Run Secret Manager)',
      };
    },
    checkAiWeaver: async () => ({
      id: 'ai_weaver',
      label: 'AI Weaver (Genkit)',
      status: 'OK',
      detail: 'Run POST /api/admin/health-probe?deep=1 inside Admin Hub for live Cloud Run Genkit ping',
    }),
  });

  console.log('');
  for (const line of formatHealthProbeCliLines(report)) {
    console.log(line);
  }
  console.log('');

  return report;
}

if (require.main === module) {
  runCliSmokeProbe().catch((err) => {
    console.error('❌ qa:smoke failed:', err?.message || err);
    process.exit(1);
  });
}
