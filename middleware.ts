
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
  // Match all routes except for static assets and the API routes.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).+)',
  ],
};
