import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APP_VERSION } from '@/config/version';

describe('MW-9 & MW-10 Infrastructure Verification', () => {
  describe('MW-9: Git Hash & Micro-Version Tracing', () => {
    it('binds APP_VERSION with micro-build commit SHA structure', () => {
      expect(APP_VERSION).toBeDefined();
      expect(typeof APP_VERSION).toBe('string');
      // Format check: v1.1.0-beta-MW-71...
      expect(APP_VERSION).toMatch(/^v\d+\.\d+\.\d+.*-MW-71/);
    });

    it('resolves commit SHA from environment when available', () => {
      const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '';
      if (commitSha) {
        expect(APP_VERSION).toContain(commitSha);
      }
    });
  });

  describe('MW-10: Ad-Blocker Proof Fetch-First Proxy Strategy', () => {
    it('exports GET and PATCH handlers in proxy route to bypass ad-blocker domain restrictions', async () => {
      const proxyModule = await import('@/app/api/interviewer/proxy/route');
      expect(proxyModule.GET).toBeDefined();
      expect(proxyModule.PATCH).toBeDefined();
      expect(typeof proxyModule.GET).toBe('function');
      expect(typeof proxyModule.PATCH).toBe('function');
    });
  });

  describe('MW-118: Immutable Build Timestamp & Edge Version Parity', () => {
    const savedEnv = {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    };

    beforeEach(() => {
      delete process.env.GCLOUD_PROJECT;
      delete process.env.GOOGLE_CLOUD_PROJECT;
    });

    afterEach(() => {
      if (savedEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = savedEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (savedEnv.GCLOUD_PROJECT === undefined) delete process.env.GCLOUD_PROJECT;
      else process.env.GCLOUD_PROJECT = savedEnv.GCLOUD_PROJECT;
      if (savedEnv.GOOGLE_CLOUD_PROJECT === undefined) delete process.env.GOOGLE_CLOUD_PROJECT;
      else process.env.GOOGLE_CLOUD_PROJECT = savedEnv.GOOGLE_CLOUD_PROJECT;
    });

    it('returns an immutable buildTimestamp across consecutive requests to /api/version', async () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-dev';
      const versionRoute = await import('@/app/api/version/route');
      const res1 = await versionRoute.GET();
      const data1 = await res1.json();

      // Delay to simulate multiple incoming requests over time
      await new Promise((resolve) => setTimeout(resolve, 25));

      const res2 = await versionRoute.GET();
      const data2 = await res2.json();

      expect(data1.buildTimestamp).toBeDefined();
      expect(typeof data1.buildTimestamp).toBe('string');
      // Invariant: buildTimestamp must NEVER change per-request
      expect(data1.buildTimestamp).toBe(data2.buildTimestamp);
      expect(data1.environment).toBe('staging');
      expect(data1.projectId).toBe('memory-weaver-dev');
    });

    it('reports production environment and memory-weaver-8rk9t projectId on production containers', async () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-8rk9t';
      const versionRoute = await import('@/app/api/version/route');
      const res = await versionRoute.GET();
      const data = await res.json();
      expect(data.environment).toBe('production');
      expect(data.projectId).toBe('memory-weaver-8rk9t');
    });
  });
});
