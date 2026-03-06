import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Secrets and project info from environment variables
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const GUEST_SECRET = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  const guestPass = request.cookies.get('guest_pass')?.value;

  // 1. STORYTELLER ROUTES (Publicly Accessible Link)
  if (pathname.startsWith('/remote/')) {
    // The page component itself will handle the invite logic.
    return NextResponse.next();
  }

  // 2. ARCHIVE ROUTES (Guest Access Pass Holders)
  if (pathname.startsWith('/archive')) {
    if (!guestPass) {
      // Redirect to a page where they can get a pass if they don't have one
      return NextResponse.redirect(new URL('/settings', request.url));
    }

    try {
      // Verify the guest pass JWT
      await jose.jwtVerify(guestPass, GUEST_SECRET);
      return NextResponse.next();
    } catch (error) {
      // Invalid or expired pass
      const response = NextResponse.redirect(new URL('/settings', request.url));
      // Clear the invalid cookie
      response.cookies.delete('guest_pass');
      return response;
    }
  }

  // 3. HOST PROTECTED ROUTES (Firebase Auth Users)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Decode the Firebase session cookie
      const payload = jose.decodeJwt(sessionCookie);
      
      // Basic validation: check expiration and audience (project ID)
      const now = Math.floor(Date.now() / 1000);
      if (!payload.exp || payload.exp < now || payload.aud !== PROJECT_ID) {
        throw new Error('Invalid session token');
      }

      return NextResponse.next();
    } catch (error) {
      // Invalid or expired session
      const response = NextResponse.redirect(new URL('/login', request.url));
      // Clear the invalid cookie
      response.cookies.delete('__session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/remote/:path*', '/archive/:path*', '/settings'],
};
