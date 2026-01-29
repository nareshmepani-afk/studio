
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PRIVATE_ROUTES = ['/dashboard', '/timeline', '/add-memory', '/prompts', '/settings', '/requests', '/create'];

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // If the user is not authenticated and is trying to access a private route, redirect to the login page.
  if (!sessionCookie && PRIVATE_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is authenticated and is trying to access the login or register page, redirect to the timeline.
  if (sessionCookie && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/timeline', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - remote (ALLOW THE QR CODE SCAN)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|remote).*)',
  ],
};
