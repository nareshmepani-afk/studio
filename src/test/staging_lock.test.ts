import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  computeStagingToken, 
  isValidStagingToken, 
  getStagingPasscode, 
  DEFAULT_STAGING_PASSCODE, 
  STAGING_COOKIE_NAME 
} from '@/lib/stagingAuth';
import { POST as stagingUnlockPost } from '@/app/api/auth/staging-unlock/route';
import { NextRequest } from 'next/server';

describe('MW-87: Staging Passcode Gatekeeper & Token Security', () => {
  const originalEnv = process.env.STAGING_ACCESS_PASSCODE;

  beforeEach(() => {
    process.env.STAGING_ACCESS_PASSCODE = 'MW-STAGE-2026';
  });

  afterEach(() => {
    process.env.STAGING_ACCESS_PASSCODE = originalEnv;
  });

  it('resolves the default staging passcode when environment variable is unset', () => {
    delete process.env.STAGING_ACCESS_PASSCODE;
    expect(getStagingPasscode()).toBe(DEFAULT_STAGING_PASSCODE);
  });

  it('computes a consistent, tamper-resistant SHA-256 token for valid passcodes', async () => {
    const token1 = await computeStagingToken('MW-STAGE-2026');
    const token2 = await computeStagingToken('MW-STAGE-2026');
    expect(token1).toBe(token2);
    expect(token1.length).toBe(64); // Hex SHA-256
  });

  it('validates correct tokens and rejects fraudulent/tampered tokens', async () => {
    const validToken = await computeStagingToken('MW-STAGE-2026');
    expect(await isValidStagingToken(validToken)).toBe(true);

    expect(await isValidStagingToken('tampered_fake_token_value')).toBe(false);
    expect(await isValidStagingToken('')).toBe(false);
    expect(await isValidStagingToken(null)).toBe(false);
    expect(await isValidStagingToken(undefined)).toBe(false);
  });

  it('unlock API accepts valid passcode (case-insensitive) and sets 30-day secure cookie', async () => {
    const req = new NextRequest('https://dev.memoryweaver.studio/api/auth/staging-unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'mw-stage-2026' }) // lowercase test
    });

    const res = await stagingUnlockPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('Staging sandbox access granted');

    const cookie = res.cookies.get(STAGING_COOKIE_NAME);
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe(await computeStagingToken('MW-STAGE-2026'));
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 30); // 30 days
  });

  it('unlock API rejects invalid passcode with 401 Unauthorized', async () => {
    const req = new NextRequest('https://dev.memoryweaver.studio/api/auth/staging-unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'wrong_secret_123' })
    });

    const res = await stagingUnlockPost(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid access passcode');
    expect(res.cookies.get(STAGING_COOKIE_NAME)).toBeUndefined();
  });
});
