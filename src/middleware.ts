
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Get the token from the user's cookies.
  const token = request.cookies.get('firebase-auth-token')?.value;

  // If there's no token and they're trying to access a private route, redirect to login.
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Clone the request headers so we can modify them.
  const requestHeaders = new Headers(request.headers);

  // 3. Add the token to the `x-firebase-token` header.
  // This isn't strictly necessary for client-side auth, but can be useful for API routes.
  requestHeaders.set('x-firebase-token', token);

  // 4. Return the request with the (potentially modified) headers.
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
  ],
};
