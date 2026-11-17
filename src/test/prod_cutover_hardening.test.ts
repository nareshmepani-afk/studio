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

describe('MW-403 / MW-404 / Hygiene: Commit 2 QA Admin APIs, crmActions & Staging Lock', () => {
  it('removes static public/qa_checklist_interactive.html and users.json from repo & ignores them', () => {
    expect(fs.existsSync(path.join(ROOT, 'public/qa_checklist_interactive.html'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'users.json'))).toBe(false);
    const gitignore = read('.gitignore');
    expect(gitignore).toContain('users.json');
    expect(gitignore).toContain('.env.staging.local');
    const genDocs = read('scripts/generateLivingDocs.js');
    expect(genDocs).not.toContain('public/qa_checklist_interactive.html');
  });

  it('qa_checklist_interactive.html & qaFirebaseService route via /api/admin/qa/* and accept legacy + new evidence URLs', () => {
    const qaHtml = read('qa_checklist_interactive.html');
    expect(qaHtml).not.toContain('https://www.gstatic.com/firebasejs/');
    expect(qaHtml).toContain('/api/admin/qa/items');
    expect(qaHtml).toContain('/api/admin/qa/evidence');
    expect(qaHtml).toContain('/api/admin/qa/fixtures');
    expect(qaHtml).toContain('function isCloudScreenshotUrl(');
    expect(qaHtml).toContain("url.startsWith('/api/admin/qa/evidence')");
    expect(qaHtml).toContain("url.startsWith('https://')");

    const qaSvc = read('src/lib/qa/qaFirebaseService.ts');
    expect(qaSvc).not.toContain('firebase/firestore');
    expect(qaSvc).not.toContain('firebase/storage');
    expect(qaSvc).toContain('/api/admin/qa/items');
    expect(qaSvc).toContain('/api/admin/qa/evidence');
  });

  it('assertStagingServiceAccount refuses production memory-weaver-8rk9t and accepts memory-weaver-dev', async () => {
    const { assertStagingServiceAccount } = await import('../../scripts/lib/stagingAdmin');
    expect(() =>
      assertStagingServiceAccount({
        project_id: 'memory-weaver-8rk9t',
        client_email: 'a@b.iam.gserviceaccount.com',
        private_key: '---KEY---',
      })
    ).toThrow(/REFUSED/);
    expect(() => assertStagingServiceAccount(null)).toThrow(/Missing valid/);

    const ok = assertStagingServiceAccount({
      project_id: 'memory-weaver-dev',
      client_email: 'a@memory-weaver-dev.iam.gserviceaccount.com',
      private_key: '---KEY---',
    });
    expect(ok.project_id).toBe('memory-weaver-dev');
  });

  it('crmActions uses SESSION_COOKIE_NAME and requires isAdmin === true && mfaVerified === true', () => {
    const crm = read('src/actions/crmActions.ts');
    expect(crm).toContain('cookieStore.get(SESSION_COOKIE_NAME)');
    expect(crm).not.toContain("cookieStore.get('session')");
    expect(crm).toContain('payload.isAdmin === true && payload.mfaVerified === true');
    expect(crm).not.toContain('payload.admin');
  });

  it('rejects unauthenticated requests on /api/qa/cleanup-fixtures and /api/admin/qa/* (401/403)', async () => {
    vi.resetModules();
    vi.doMock('@/lib/session', () => ({
      requireAdminSession: vi.fn().mockResolvedValue({
        authorized: false,
        status: 401,
        error: 'Unauthorised: Admin session required',
      }),
    }));

    const { POST: cleanupPost } = await import('@/app/api/qa/cleanup-fixtures/route');
    const { GET: itemsGet, PATCH: itemsPatch } = await import('@/app/api/admin/qa/items/route');
    const { GET: evGet, POST: evPost } = await import('@/app/api/admin/qa/evidence/route');
    const { GET: fixGet, POST: fixPost, DELETE: fixDel } = await import('@/app/api/admin/qa/fixtures/route');

    expect((await cleanupPost(new Request('http://localhost/api/qa/cleanup-fixtures', { method: 'POST', body: '{}' }))).status).toBe(401);
    expect((await itemsGet()).status).toBe(401);
    expect((await itemsPatch(new Request('http://localhost/api/admin/qa/items', { method: 'PATCH', body: '{}' }))).status).toBe(401);
    expect((await evGet({ nextUrl: new URL('http://localhost/api/admin/qa/evidence?path=qa-evidence/54/a.png') } as any)).status).toBe(401);
    expect((await evPost(new Request('http://localhost/api/admin/qa/evidence', { method: 'POST' }))).status).toBe(401);
    expect((await fixGet({ nextUrl: new URL('http://localhost/api/admin/qa/fixtures') } as any)).status).toBe(401);
    expect((await fixPost(new Request('http://localhost/api/admin/qa/fixtures', { method: 'POST', body: '{}' }))).status).toBe(401);
    expect((await fixDel(new Request('http://localhost/api/admin/qa/fixtures', { method: 'DELETE', body: '{}' }))).status).toBe(401);
    vi.doUnmock('@/lib/session');
  });

  it('PATCH /api/admin/qa/items preserves legacy https:// URLs and /api/admin/qa/evidence?path=... URLs when authorized', async () => {
    vi.resetModules();
    const setMock = vi.fn().mockResolvedValue(undefined);
    const docMock = vi.fn(() => ({ set: setMock }));
    const colMock = vi.fn(() => ({ doc: docMock }));

    vi.doMock('@/lib/session', () => ({
      requireAdminSession: vi.fn().mockResolvedValue({
        authorized: true,
        session: { uid: 'admin-1', email: 'nareshmepani@googlemail.com', isAdmin: true, mfaVerified: true },
      }),
    }));
    vi.doMock('@/lib/firebaseAdmin', () => ({
      adminDb: { collection: colMock },
      adminAuth: null,
      adminStorage: null,
    }));

    const { PATCH } = await import('@/app/api/admin/qa/items/route');
    const legacyUrl = 'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev.firebasestorage.app/o/qa-evidence%2F52%2F52.1_1793982716576.png?alt=media&token=4782aae5';
    const newUrl = '/api/admin/qa/evidence?path=qa-evidence%2F60%2F60.1_1234.png';

    const res = await PATCH(
      new Request('http://localhost/api/admin/qa/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '52.1',
          updates: { screenshots: [legacyUrl, newUrl, 'javascript:alert(1)'] },
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(docMock).toHaveBeenCalledWith('52.1');
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        screenshots: [legacyUrl, newUrl],
        updatedBy: 'nareshmepani@googlemail.com',
      }),
      { merge: true }
    );
    vi.doUnmock('@/lib/session');
    vi.doUnmock('@/lib/firebaseAdmin');
  });
});

describe('MW-407 / MW-408: apphosting.prod.yaml hardening & prod-preflight fail-closed checks', () => {
  it('passes full production preflight audit against repository apphosting.yaml + apphosting.prod.yaml', async () => {
    const { runProdPreflightAudit } = await import('../../scripts/prod-preflight');
    const report = runProdPreflightAudit(ROOT);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.mergedVariables.NEXT_PUBLIC_BYPASS_CAPTCHA?.value).toBe('false');
    expect(report.mergedVariables.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.value).toBe('memory-weaver-8rk9t');
    expect(report.mergedVariables.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.value).toBe('memory-weaver-8rk9t.firebasestorage.app');
    expect(report.mergedVariables.GOOGLE_CLOUD_PROJECT_ID?.value).toBe('memory-weaver-8rk9t');
    expect(report.mergedVariables.NEXT_PUBLIC_APP_URL?.value).toBe('https://memoryweaver.studio');
    expect(read('src/lib/firebase/config.ts')).not.toContain('memory-weaver-8rk9t.appspot.com');
  });

  it('fails closed when NEXT_PUBLIC_BYPASS_CAPTCHA leaks from base apphosting.yaml or is set to true', async () => {
    const { parseAppHostingEnv, validateMergedProdConfig } = await import('../../scripts/prod-preflight');
    const base = parseAppHostingEnv(read('apphosting.yaml'));
    const prod = parseAppHostingEnv(read('apphosting.prod.yaml'));

    const missingBypass = prod.filter((e) => e.variable !== 'NEXT_PUBLIC_BYPASS_CAPTCHA');
    expect(validateMergedProdConfig(base, missingBypass).some((m) => m.includes('NEXT_PUBLIC_BYPASS_CAPTCHA'))).toBe(true);

    const trueBypass = prod.map((e) =>
      e.variable === 'NEXT_PUBLIC_BYPASS_CAPTCHA' ? { ...e, value: 'true' } : e
    );
    expect(validateMergedProdConfig(base, trueBypass).some((m) => m.includes('NEXT_PUBLIC_BYPASS_CAPTCHA'))).toBe(true);
  });

  it('fails closed on placeholder reCAPTCHA site keys or leaked staging/dev strings', async () => {
    const { parseAppHostingEnv, validateMergedProdConfig } = await import('../../scripts/prod-preflight');
    const base = parseAppHostingEnv(read('apphosting.yaml'));
    const prod = parseAppHostingEnv(read('apphosting.prod.yaml'));

    const missingSiteKey = prod.filter((e) => e.variable !== 'NEXT_PUBLIC_RECAPTCHA_SITE_KEY');
    const siteKeyFailures = validateMergedProdConfig(base, missingSiteKey);
    expect(siteKeyFailures.some((m) => m.includes('NEXT_PUBLIC_RECAPTCHA_SITE_KEY') && m.includes('placeholder'))).toBe(true);

    const leakedDevUrl = prod.map((e) =>
      e.variable === 'NEXT_PUBLIC_APP_URL' ? { ...e, value: 'https://dev.memoryweaver.studio' } : e
    );
    expect(validateMergedProdConfig(base, leakedDevUrl).some((m) => m.includes('CANONICAL_PROD_APP_URL') || m.includes('https://memoryweaver.studio'))).toBe(true);

    const nonApexUrl = prod.map((e) =>
      e.variable === 'NEXT_PUBLIC_APP_URL' ? { ...e, value: 'https://app.memoryweaver.studio' } : e
    );
    expect(validateMergedProdConfig(base, nonApexUrl).some((m) => m.includes('https://memoryweaver.studio'))).toBe(true);

    const leakedTestStripe = [...prod, { variable: 'STRIPE_SECRET_KEY', value: 'sk_test_12345' }];
    expect(validateMergedProdConfig(base, leakedTestStripe).some((m) => m.includes('Stripe test-mode key'))).toBe(true);
  });
});

describe('MW-409: purge-prod-qa refuses staging and defaults to dry-run', () => {
  it('assertProdPurgeTarget refuses memory-weaver-dev even with --confirm-prod', async () => {
    const { assertProdPurgeTarget } = await import('../../scripts/purge-prod-qa');
    expect(() =>
      assertProdPurgeTarget(
        {
          project_id: 'memory-weaver-dev',
          client_email: 'a@memory-weaver-dev.iam.gserviceaccount.com',
          private_key: '---KEY---',
        },
        ['--confirm-prod']
      )
    ).toThrow(/REFUSED/);
    expect(() => assertProdPurgeTarget(null, ['--confirm-prod'])).toThrow(/Missing valid/);
  });

  it('defaults to dryRun: true unless --confirm-prod is passed for memory-weaver-8rk9t', async () => {
    const { assertProdPurgeTarget } = await import('../../scripts/purge-prod-qa');
    const prodSa = {
      project_id: 'memory-weaver-8rk9t',
      client_email: 'a@memory-weaver-8rk9t.iam.gserviceaccount.com',
      private_key: '---KEY---',
    };
    expect(assertProdPurgeTarget(prodSa, [])).toEqual({
      projectId: 'memory-weaver-8rk9t',
      dryRun: true,
      includeStorage: false,
    });
    expect(assertProdPurgeTarget(prodSa, ['--confirm-prod'])).toEqual({
      projectId: 'memory-weaver-8rk9t',
      dryRun: false,
      includeStorage: false,
    });
  });
});
