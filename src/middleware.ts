
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This is a basic pass-through middleware.
  // It can be expanded later for route protection if needed.
  return NextResponse.next();
}

// This config ensures the middleware runs on all paths except for
// API routes, static files, and images, which is a safe default.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
