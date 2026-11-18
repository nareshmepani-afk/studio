import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  computeStagingToken,
  getStagingPasscode,
  STAGING_COOKIE_NAME,
  verifySignedStagingInviteToken,
} from '@/lib/stagingAuth';

const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface FailedAttemptEntry {
  count: number;
  firstFailedAt: number;
}

const failedAttemptsByIp = new Map<string, FailedAttemptEntry>();

export function resetStagingUnlockRateLimitForTests() {
  failedAttemptsByIp.clear();
}

function getClientIp(req: NextRequest): string {
  const fahIp = req.headers.get('x-fah-client-ip');
  if (fahIp) return fahIp.trim();
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'local-client';
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const record = failedAttemptsByIp.get(clientIp);

    if (record) {
      if (now - record.firstFailedAt > LOCKOUT_WINDOW_MS) {
        failedAttemptsByIp.delete(clientIp);
      } else if (record.count >= MAX_FAILED_ATTEMPTS) {
        console.warn(`[StagingUnlock] Rate limit triggered for IP ${clientIp} (${record.count} failed attempts)`);
        return NextResponse.json(
          {
            success: false,
            error: 'Too many failed passcode attempts. Please wait 5 minutes before trying again.',
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const enteredPasscode = (body?.passcode || '').toString().trim();
    const stageToken = (body?.stageToken || '').toString().trim();
    const correctPasscode = getStagingPasscode();

    if (!enteredPasscode && !stageToken) {
      return NextResponse.json(
        { success: false, error: 'Passcode is required' },
        { status: 400 }
      );
    }

    let isValid = false;
    if (stageToken) {
      isValid = await verifySignedStagingInviteToken(stageToken, now);
    } else {
      // Constant-time comparison using fixed-length SHA-256 hashes to prevent timing attacks
      const enteredHash = Buffer.from(await computeStagingToken(enteredPasscode.toUpperCase()), 'hex');
      const correctHash = Buffer.from(await computeStagingToken(correctPasscode.toUpperCase()), 'hex');

      try {
        if (enteredHash.length === correctHash.length) {
          isValid = crypto.timingSafeEqual(enteredHash, correctHash);
        }
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      const current = failedAttemptsByIp.get(clientIp);
      if (!current || now - current.firstFailedAt > LOCKOUT_WINDOW_MS) {
        failedAttemptsByIp.set(clientIp, { count: 1, firstFailedAt: now });
      } else {
        failedAttemptsByIp.set(clientIp, { count: current.count + 1, firstFailedAt: current.firstFailedAt });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid access passcode. Please verify and try again.' },
        { status: 401 }
      );
    }

    failedAttemptsByIp.delete(clientIp);

    const token = await computeStagingToken(correctPasscode);
    const response = NextResponse.json({
      success: true,
      message: 'Staging sandbox access granted',
    });

    const isSecure =
      req.headers.get('x-forwarded-proto') === 'https' ||
      req.url.startsWith('https://') ||
      process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: STAGING_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[StagingUnlock] Error processing unlock request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error validating passcode' },
      { status: 500 }
    );
  }
}
