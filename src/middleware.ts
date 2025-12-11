
import { NextResponse, type NextRequest } from 'next/server';

// This is the correct, lightweight middleware architecture.
// Its only job is to pass the token from the cookie to a header that server components can read.
// It does NOT perform verification and does NOT use firebase-admin, making it Edge-runtime compatible.

export function middleware(request: NextRequest) {
  // 1. Get the token from the user's cookies.
  const token = request.cookies.get('firebase-auth-token')?.value;

  // 2. Clone the request headers so we can modify them.
  const requestHeaders = new Headers(request.headers);

  // 3. If a token was found, add it to the `x-firebase-token` header.
  if (token) {
    requestHeaders.set('x-firebase-token', token);
  }

  // 4. Return the request with the new headers.
  // This makes the token available to all server components that run after this middleware.
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// This config ensures the middleware runs on the necessary paths
// where server-side authentication is required.
export const config = {
  matcher: [
    '/timeline',
    '/add-memory',
    '/prompts/:path*',
    '/settings',
    '/requests',
  ],
};
