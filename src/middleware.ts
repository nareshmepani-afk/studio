
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { SESSION_COOKIE_NAME } from './lib/constants';

// This secret is still needed for guest passes.
const GUEST_SECRET = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET || '');

// All routes that require a user to be logged in.
const PROTECTED_ROUTES = [
  '/dashboard', 
  '/add-memory', 
  '/settings', 
  '/requests', 
  '/create', 
  '/studio', 
  '/review'
];

// Routes for unauthenticated users (e.g., login, register).
const PUBLIC_ONLY_ROUTES = ['/login', '/register', '/forgot-password', '/auth/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const guestPass = request.cookies.get('guest_pass')?.value;

  // Legacy Redirect: /prompts -> /studio
  if (pathname.startsWith('/prompts')) {
    const newPath = pathname.replace('/prompts', '/studio');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // 1. Allow storyteller and guest director routes to pass through with sessionId
  if (pathname.startsWith('/remote/') || 
      (pathname.startsWith('/director') && request.nextUrl.searchParams.has('sessionId')) ||
      (pathname.startsWith('/studio') && request.nextUrl.searchParams.has('sessionId') && request.nextUrl.searchParams.get('mode') === 'guest')) {
    return NextResponse.next();
  }

  // 2. Handle guest pass access for the archive.
  if (pathname.startsWith('/archive')) {
    if (!guestPass) {
      // If no guest pass, redirect them. A page that explains guest passes might be better in the future.
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      // Verify the guest pass JWT.
      await jose.jwtVerify(guestPass, GUEST_SECRET);
      // If valid, allow access.
      return NextResponse.next();
    } catch (error) {
      // If invalid, redirect and clear the bad cookie.
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('guest_pass');
      return response;
    }
  }

  // 3. REMOVED PUBLIC_ONLY_REDIRECT: Allow users to reach login/register even if they have a cookie.
  // This prevents the loop where a stale cookie forces them to /studio which then fails.

  // 4. If user is NOT logged in and trying to access a protected route, redirect to login.
  if (!sessionCookie && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    loginUrl.searchParams.set('reason', 'unauthenticated');
    return NextResponse.redirect(loginUrl);
  }

  // 5. If none of the above, proceed as normal.
  return NextResponse.next();
}

// Use the more robust "deny-by-default" matcher from the old root middleware.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - remote (already handled, but good to keep here)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|remote).*)',
  ],
};
