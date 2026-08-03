import { describe, it, expect, vi } from 'vitest';
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
});
