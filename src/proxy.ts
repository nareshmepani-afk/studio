import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Define which routes are protected and which are "auth" routes
const protectedRoutes = ['/dashboard', '/prompts', '/profile'];
const authRoutes = ['/login', '/signup'];

export function proxy(request: NextRequest) {
  // 2. Get the session cookie (Middleware uses a different API than Server Actions)
  const session = request.cookies.get('firebase-session')?.value;
  
  const { pathname } = request.nextUrl;

  // 3. If the user is trying to access a protected route without a session
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url);
    // Optional: Store the attempted URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. If the user is logged in, don't let them see the login/signup pages
  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// 5. Configure the middleware to only run on specific paths for performance
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/prompts/:path*',
    '/login',
    '/signup'
  ],
};
