
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log(`[MIDDLEWARE] Running for path: ${request.nextUrl.pathname}`);

  // 1. Get the token from the user's cookies.
  const cookies = request.cookies;
  console.log('[MIDDLEWARE] All cookies received:', cookies.getAll());
  const token = cookies.get('firebase-auth-token')?.value;

  if (token) {
    console.log("[MIDDLEWARE] Found 'firebase-auth-token' cookie.");
  } else {
    console.warn("[MIDDLEWARE] WARNING: 'firebase-auth-token' cookie NOT found.");
  }

  // 2. Clone the request headers so we can modify them.
  const requestHeaders = new Headers(request.headers);

  // 3. Add the token to the `x-firebase-token` header if it exists.
  if (token) {
    requestHeaders.set('x-firebase-token', token);
    console.log("[MIDDLEWARE] Set 'x-firebase-token' header.");
  } else {
    console.log("[MIDDLEWARE] No token found, so 'x-firebase-token' header was not set.");
  }

  // 4. Return the request with the (potentially modified) headers.
  console.log('[MIDDLEWARE] Passing request to the next handler.');
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Match all paths that require authentication
    '/timeline',
    '/add-memory',
    '/prompts/:path*', // Match /prompts and any sub-paths
    '/settings',
    '/requests',

    // We must also match the API route that creates the session
    // so that we can log the cookie being set.
    // NOTE: This is for debugging only and should be removed in production.
    '/api/auth/session',
  ],
};
