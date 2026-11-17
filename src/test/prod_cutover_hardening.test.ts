import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Production Cutover Hardening Regression Shield (MW-402 / MW-405 / MW-407 / MW-408)
 * Guards: B1 (unauthenticated destructive routes/actions), B4 (no committed Plane secret, fail-closed script),
 * and environment isolation (no hard-coded cross-environment project / bucket / host decisions).
 */

const ROOT = path.resolve(__dirname, '../..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('MW-402 / B1: no unauthenticated destructive endpoints', () => {
  it('removes /api/temp-delete-user and the unauthenticated deleteUser server action', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/app/api/temp-delete-user'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'src/actions/deleteUserAction.ts'))).toBe(false);
  });

  it('has no temp-* / tmp-* / debug-* API route directories', () => {
    const apiDir = path.join(ROOT, 'src/app/api');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (/^(temp|tmp|debug)[-_]/i.test(entry.name)) offenders.push(path.join(dir, entry.name));
        walk(path.join(dir, entry.name));
      }
    };
    walk(apiDir);
    expect(offenders).toEqual([]);
  });
});

describe('MW-405 / B4: scripts/plane.js is env-only and fails closed', () => {
  const src = read('scripts/plane.js');

  it('contains no committed Plane API key literal', () => {
    expect(src).not.toMatch(/plane_api_[0-9a-f]{8,}/i);
  });

  it('exits non-zero when PLANE_API_KEY is missing', () => {
    expect(src).toContain('PLANE_API_KEY is not set');
    expect(src).toContain('process.exit(1)');
  });
});

describe('Environment isolation: no hard-coded cross-environment identity', () => {
  it('audioWeaver derives its fallback bucket from env, not a prod literal', () => {
    const src = read('src/actions/audioWeaver.ts');
    expect(src).not.toContain('memory-weaver-8rk9t');
    expect(src).toContain('resolveStorageBucket');
  });

  it('crmActions and admin/actions fail closed instead of falling back to a hard-coded project ID', () => {
    const crm = read('src/actions/crmActions.ts');
    const admin = read('src/app/admin/actions.ts');
    expect(crm).not.toContain("|| 'memory-weaver-8rk9t'");
    expect(admin).not.toContain("|| 'memory-weaver-dev'");
    expect(crm).toContain('resolveProjectId');
    expect(admin).toContain('resolveProjectId');
  });

  it('authActions never trusts request headers for the reCAPTCHA staging bypass', () => {
    const src = read('src/actions/authActions.ts');
    expect(src).not.toMatch(/x-forwarded-host|x-original-host|headersList/);
    expect(src).not.toContain("host.includes(");
  });
});

describe('config/environment helpers', () => {
  const saved = { ...process.env };
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.GCLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it('resolveProjectId prefers the admin project, then env, and returns null (fail closed) when unknown', async () => {
    const env = await import('@/config/environment');
    expect(env.resolveProjectId()).toBeNull();
    expect(env.resolveProjectId('   ')).toBeNull();
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-dev';
    expect(env.resolveProjectId()).toBe('memory-weaver-dev');
    expect(env.resolveProjectId('memory-weaver-8rk9t')).toBe('memory-weaver-8rk9t');
  });

  it('isStagingProject / isProductionProject are exclusive and reject null/unknown', async () => {
    const env = await import('@/config/environment');
    expect(env.isStagingProject('memory-weaver-dev')).toBe(true);
    expect(env.isStagingProject('memory-weaver-8rk9t')).toBe(false);
    expect(env.isStagingProject(null)).toBe(false);
    expect(env.isStagingProject('')).toBe(false);
    expect(env.isProductionProject('memory-weaver-8rk9t')).toBe(true);
    expect(env.isProductionProject('memory-weaver-dev')).toBe(false);
    expect(env.isProductionProject(null)).toBe(false);
  });

  it('resolveStorageBucket reads the active env bucket and returns null when unset', async () => {
    const env = await import('@/config/environment');
    expect(env.resolveStorageBucket()).toBeNull();
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'memory-weaver-dev.firebasestorage.app';
    expect(env.resolveStorageBucket()).toBe('memory-weaver-dev.firebasestorage.app');
  });
});

describe('validateAuthAttempt: reCAPTCHA bypass is project-gated (header-spoof proof)', () => {
  const saved = { ...process.env };
  const verifyMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    verifyMock.mockReset();
    verifyMock.mockResolvedValue({ isSafe: true, score: 0.9 });
    vi.doMock('@/lib/fraud-defense', () => ({ verifyRecaptchaToken: verifyMock }));
    vi.doMock('@/utils/telemetry/dbLogger', () => ({ logToDb: vi.fn().mockResolvedValue(undefined) }));
    delete process.env.GCLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_PROJECT;
  });
  afterEach(() => {
    process.env = { ...saved };
    vi.doUnmock('@/lib/fraud-defense');
    vi.doUnmock('@/utils/telemetry/dbLogger');
  });

  it('allows the bypass token on the staging project only', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-dev';
    const { validateAuthAttempt } = await import('@/actions/authActions');
    const res = await validateAuthAttempt('BYPASS_STAGE_RECAPTCHA', 'LOGIN', 'a@b.co');
    expect(res).toEqual({ success: true, score: 1.0 });
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it('never bypasses on the production project (token falls through to real verification)', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'memory-weaver-8rk9t';
    const { validateAuthAttempt } = await import('@/actions/authActions');
    await validateAuthAttempt('BYPASS_STAGE_RECAPTCHA', 'LOGIN', 'a@b.co');
    expect(verifyMock).toHaveBeenCalledTimes(1);
  });

  it('never bypasses when the project is unknown (fail closed)', async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const { validateAuthAttempt } = await import('@/actions/authActions');
    await validateAuthAttempt('BYPASS_STAGE_RECAPTCHA', 'REGISTER', 'a@b.co');
    expect(verifyMock).toHaveBeenCalledTimes(1);
  });
});
