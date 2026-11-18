import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeStagingToken,
  isValidStagingToken,
  getStagingPasscode,
  maskStagingPasscode,
  computeSignedStagingInviteToken,
  verifySignedStagingInviteToken,
  DEFAULT_STAGING_PASSCODE,
  STAGING_COOKIE_NAME,
} from '@/lib/stagingAuth';
import {
  POST as stagingUnlockPost,
  resetStagingUnlockRateLimitForTests,
} from '@/app/api/auth/staging-unlock/route';
import { SynthesizingOverlay } from '@/components/studio/Scriptorium/Ceremony/SelectionDeck';
import { GENKIT_MODELS } from '@/ai/models';
import { NextRequest } from 'next/server';

describe('MW-87 & Staging Perimeter Vault: Passcode Gatekeeper, Signed Invite Tokens & Rate Limiting', () => {
  const originalEnv = process.env.STAGING_ACCESS_PASSCODE;

  beforeEach(() => {
    process.env.STAGING_ACCESS_PASSCODE = 'MW-STAGE-2026';
    resetStagingUnlockRateLimitForTests();
  });

  afterEach(() => {
    process.env.STAGING_ACCESS_PASSCODE = originalEnv;
    resetStagingUnlockRateLimitForTests();
  });

  it('resolves the default staging passcode when environment variable is unset', () => {
    delete process.env.STAGING_ACCESS_PASSCODE;
    expect(getStagingPasscode()).toBe(DEFAULT_STAGING_PASSCODE);
    expect(maskStagingPasscode('MW-STAGE-2026')).toBe('•••••••••2026');
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

  it('mints and verifies time-limited signed staging invite tokens (?stage_token=)', async () => {
    const nowMs = 1_800_000_000_000;
    const futureExp = nowMs + 24 * 60 * 60 * 1000;
    const signedToken = await computeSignedStagingInviteToken(futureExp, 'MW-STAGE-2026');

    expect(await verifySignedStagingInviteToken(signedToken, nowMs)).toBe(true);
    // Expired check
    expect(await verifySignedStagingInviteToken(signedToken, futureExp + 1)).toBe(false);
    // Tampered signature check
    expect(await verifySignedStagingInviteToken(`${futureExp}.deadbeef1234567890`, nowMs)).toBe(false);
    // Tampered timestamp check
    const sigPart = signedToken.split('.')[1];
    expect(await verifySignedStagingInviteToken(`${futureExp + 5000}.${sigPart}`, nowMs)).toBe(false);
  });

  it('unlock API accepts valid passcode (case-insensitive) and sets 30-day secure cookie', async () => {
    const req = new NextRequest('https://dev.memoryweaver.studio/api/auth/staging-unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'mw-stage-2026' }),
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
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 30);
  });

  it('unlock API rejects invalid passcode with 401 and rate-limits brute force attempts with 429', async () => {
    for (let i = 0; i < 8; i++) {
      const req = new NextRequest('https://dev.memoryweaver.studio/api/auth/staging-unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.42',
        },
        body: JSON.stringify({ passcode: `wrong_secret_${i}` }),
      });
      const res = await stagingUnlockPost(req);
      expect(res.status).toBe(401);
      expect(res.cookies.get(STAGING_COOKIE_NAME)).toBeUndefined();
    }

    // 9th attempt from same IP within window triggers 429 Too Many Requests
    const rateLimitedReq = new NextRequest('https://dev.memoryweaver.studio/api/auth/staging-unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.42',
      },
      body: JSON.stringify({ passcode: 'MW-STAGE-2026' }),
    });
    const limitedRes = await stagingUnlockPost(rateLimitedReq);
    expect(limitedRes.status).toBe(429);
    const limitedBody = await limitedRes.json();
    expect(limitedBody.error).toContain('Too many failed passcode attempts');
  });

  it('StagingLockContent.tsx contains zero hardcoded passcode hints or prefilled secrets', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/auth/StagingLockContent.tsx');
    const source = fs.readFileSync(filePath, 'utf-8');
    expect(source).not.toContain('MW-STAGE-2026');
    expect(source).not.toContain('DEFAULT_STAGING_PASSCODE');
    expect(source).not.toContain('Quick Fill');
    expect(source).toContain('STAGING_LOCK_PASSCODE_INPUT');
    expect(source).toContain('STAGING_LOCK_TOGGLE_VISIBILITY_BTN');
  });

  describe('Middleware Staging Auto-Unlock, Signed Token & Admin Exemption', () => {
    it('redirects unauthenticated staging traffic on /studio to /staging-lock', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest('https://dev.memoryweaver.studio/studio', {
        headers: { host: 'dev.memoryweaver.studio' },
      });

      const res = await middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/staging-lock');
      expect(location).toContain('from=%2Fstudio');
    });

    it('exempts /admin/login from /staging-lock so administrators can reach the Staging Perimeter Vault without a Catch-22', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest('https://dev.memoryweaver.studio/admin/login', {
        headers: { host: 'dev.memoryweaver.studio' },
      });

      const res = await middleware(req);
      const location = res.headers.get('location') || '';
      expect(location).not.toContain('/staging-lock');
    });

    it('auto-unlocks with valid ?passcode=MW-STAGE-2026, sets cookie, and strips query parameter', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest(
        'https://dev.memoryweaver.studio/unboxing/MW-VAULT-7K8P-9Q2M?passcode=MW-STAGE-2026',
        {
          headers: { host: 'dev.memoryweaver.studio' },
        }
      );

      const res = await middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toBe('https://dev.memoryweaver.studio/unboxing/MW-VAULT-7K8P-9Q2M');

      const cookie = res.cookies.get(STAGING_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe(await computeStagingToken('MW-STAGE-2026'));
      expect(cookie?.maxAge).toBe(60 * 60 * 24 * 30);
    });

    it('auto-unlocks with valid expiring ?stage_token= signed token and strips query parameter', async () => {
      const { middleware } = await import('@/middleware');
      const stageToken = await computeSignedStagingInviteToken(Date.now() + 3600_000, 'MW-STAGE-2026');
      const req = new NextRequest(
        `https://dev.memoryweaver.studio/register?stage_token=${encodeURIComponent(stageToken)}`,
        {
          headers: { host: 'dev.memoryweaver.studio' },
        }
      );

      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('https://dev.memoryweaver.studio/register');
      expect(res.cookies.get(STAGING_COOKIE_NAME)?.value).toBe(
        await computeStagingToken('MW-STAGE-2026')
      );
    });

    it('auto-unlocks with valid ?stage_key= (case-insensitive)', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest('https://dev.memoryweaver.studio/gift?stage_key=mw-stage-2026', {
        headers: { host: 'dev.memoryweaver.studio' },
      });

      const res = await middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toBe('https://dev.memoryweaver.studio/gift');

      const cookie = res.cookies.get(STAGING_COOKIE_NAME);
      expect(cookie).toBeDefined();
    });

    it('rejects incorrect ?passcode= and routes to /staging-lock', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest('https://dev.memoryweaver.studio/studio?passcode=WRONG_CODE', {
        headers: { host: 'dev.memoryweaver.studio' },
      });

      const res = await middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/staging-lock');
      expect(res.cookies.get(STAGING_COOKIE_NAME)).toBeUndefined();
    });
  });

  describe('SynthesizingOverlay & Parallel AI Weaver Model Routing', () => {
    it('routes FLASH to gemini-3.8-flash and FLASH_LITE to gemini-3.5-flash-lite', () => {
      expect(GENKIT_MODELS.FLASH).toBe('googleai/gemini-3.8-flash');
      expect(GENKIT_MODELS.FLASH_LITE).toBe('googleai/gemini-3.5-flash-lite');
    });

    it('renders SynthesizingOverlay with elapsed timer, 4-phase rail, 4 ghost cards, phrase echo, and Cancel button', () => {
      const onCancel = vi.fn();
      const { getByTestId, getByText } = render(
        React.createElement(SynthesizingOverlay, {
          sourceExcerpt: 'We walked along the monsoon harbour in Mombasa while the lanterns flickered.',
          onCancel,
        })
      );

      expect(getByTestId('SYNTHESISING_ELAPSED_TIMER')).toBeDefined();
      expect(getByTestId('SYNTHESISING_PHASE_RAIL')).toBeDefined();
      expect(getByTestId('SYNTHESISING_GHOST_CARDS').children.length).toBe(4);
      expect(getByTestId('SYNTHESISING_PHRASE_ECHO').textContent).toContain('monsoon harbour');
      expect(getByText('The Atmospheric Weave')).toBeDefined();
      expect(getByText('The Flow')).toBeDefined();
      expect(getByText('The Memory Weave')).toBeDefined();

      const cancelBtn = getByTestId('SYNTHESISING_CANCEL_BTN');
      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
