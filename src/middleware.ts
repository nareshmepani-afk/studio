
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { SESSION_COOKIE_NAME } from './lib/constants';

// This secret is still needed for guest passes.
const GUEST_SECRET = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET || '');

// All routes that require a user to be logged in.
const PROTECTED_ROUTES = [
  '/dashboard', 
  '/timeline', 
  '/add-memory', 
  '/prompts', 
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

  // 1. Allow storyteller routes to pass through unconditionally.
  if (pathname.startsWith('/remote/')) {
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

  // 3. If user is logged in, redirect them away from public-only pages.
  if (sessionCookie && PUBLIC_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/timeline', request.url));
  }

  // 4. If user is NOT logged in and trying to access a protected route, redirect to login.
  if (!sessionCookie && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
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
