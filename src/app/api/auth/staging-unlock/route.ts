import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { 
  computeStagingToken, 
  getStagingPasscode, 
  STAGING_COOKIE_NAME 
} from '@/lib/stagingAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const enteredPasscode = (body?.passcode || '').toString().trim();
    const correctPasscode = getStagingPasscode();

    if (!enteredPasscode) {
      return NextResponse.json(
        { success: false, error: 'Passcode is required' },
        { status: 400 }
      );
    }

    // Constant-time comparison using fixed-length SHA-256 hashes to prevent timing attacks
    const enteredHash = Buffer.from(await computeStagingToken(enteredPasscode.toUpperCase()), 'hex');
    const correctHash = Buffer.from(await computeStagingToken(correctPasscode.toUpperCase()), 'hex');

    let isValid = false;
    try {
      if (enteredHash.length === correctHash.length) {
        isValid = crypto.timingSafeEqual(enteredHash, correctHash);
      }
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid access passcode. Please verify and try again.' },
        { status: 401 }
      );
    }

    const token = await computeStagingToken(correctPasscode);
    const response = NextResponse.json({ 
      success: true, 
      message: 'Staging sandbox access granted' 
    });

    const isSecure = req.headers.get('x-forwarded-proto') === 'https' || 
                     req.url.startsWith('https://') || 
                     process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: STAGING_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
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
