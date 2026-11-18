import { NextRequest, NextResponse } from 'next/server';
import { STAGING_APP_URL } from '@/config/environment';
import { requireAdminSession } from '@/lib/session';
import {
  computeSignedStagingInviteToken,
  computeStagingToken,
  getStagingPasscode,
  isValidStagingToken,
  maskStagingPasscode,
  STAGING_COOKIE_NAME,
} from '@/lib/stagingAuth';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const STAGING_BASE_URL = STAGING_APP_URL;

function sanitizeTargetPath(rawPath?: string | null): string {
  const trimmed = (rawPath || '/register').trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/staging-lock')) {
    return '/register';
  }
  return trimmed;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const passcode = getStagingPasscode();
    const maskedPasscode = maskStagingPasscode(passcode);
    const cookieVal = req.cookies.get(STAGING_COOKIE_NAME)?.value;
    const browserUnlocked = await isValidStagingToken(cookieVal);

    const nowMs = Date.now();
    const exp24h = nowMs + 24 * 60 * 60 * 1000;
    const exp7d = nowMs + 7 * 24 * 60 * 60 * 1000;

    const [token24h, token7d] = await Promise.all([
      computeSignedStagingInviteToken(exp24h, passcode),
      computeSignedStagingInviteToken(exp7d, passcode),
    ]);

    return NextResponse.json(
      {
        success: true,
        passcode,
        maskedPasscode,
        isCustomEnv: Boolean(process.env.STAGING_ACCESS_PASSCODE),
        browserUnlocked,
        signedTokens: {
          '24h': {
            token: token24h,
            expiresAtIso: new Date(exp24h).toISOString(),
            url: `${STAGING_BASE_URL}/register?stage_token=${encodeURIComponent(token24h)}`,
          },
          '7d': {
            token: token7d,
            expiresAtIso: new Date(exp7d).toISOString(),
            url: `${STAGING_BASE_URL}/register?stage_token=${encodeURIComponent(token7d)}`,
          },
        },
        directUrl: `${STAGING_BASE_URL}/register?passcode=${encodeURIComponent(passcode)}`,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[/api/admin/staging-access GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to read staging access configuration.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === 'string' ? body.action.trim() : '';
    const passcode = getStagingPasscode();

    if (action === 'unlock_browser') {
      const token = await computeStagingToken(passcode);
      const response = NextResponse.json(
        {
          success: true,
          browserUnlocked: true,
          message: 'Staging perimeter unlocked for this browser for 30 days.',
        },
        { headers: NO_STORE_HEADERS }
      );

      response.cookies.set(STAGING_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    if (action === 'mint_link') {
      const targetPath = sanitizeTargetPath(body?.targetPath);
      const ttlHoursRaw = Number(body?.ttlHours);
      const ttlHours = Number.isFinite(ttlHoursRaw) && ttlHoursRaw > 0 ? Math.min(ttlHoursRaw, 24 * 30) : 24;
      const expiresAtMs = Date.now() + ttlHours * 60 * 60 * 1000;
      const stageToken = await computeSignedStagingInviteToken(expiresAtMs, passcode);

      const separator = targetPath.includes('?') ? '&' : '?';
      const signedUrl = `${STAGING_BASE_URL}${targetPath}${separator}stage_token=${encodeURIComponent(stageToken)}`;
      const directUrl = `${STAGING_BASE_URL}${targetPath}${separator}passcode=${encodeURIComponent(passcode)}`;
      const expiresAtIso = new Date(expiresAtMs).toISOString();

      const inviteMessage = [
        `You are invited to preview Memory Weaver Studio (Staging Sandbox).`,
        ``,
        `1-Click Instant Access Link (valid for ${ttlHours}h):`,
        signedUrl,
        ``,
        `Or enter Staging Access Key manually at ${STAGING_BASE_URL}/staging-lock:`,
        `Passcode: ${passcode}`,
      ].join('\n');

      return NextResponse.json(
        {
          success: true,
          targetPath,
          ttlHours,
          stageToken,
          signedUrl,
          directUrl,
          expiresAtIso,
          inviteMessage,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported action. Expected unlock_browser or mint_link.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[/api/admin/staging-access POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process staging access action.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
