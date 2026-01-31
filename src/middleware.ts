
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {SESSION_COOKIE_NAME} from '@/lib/constants';
import {adminAuth} from '@/lib/firebase-admin';

async function verifySession(sessionCookie: string | undefined): Promise<boolean> {
  if (!sessionCookie) {
    return false;
  }
  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
    return true;
  } catch (error) {
    return false;
  }
}

async function validateGuestToken(request: NextRequest): Promise<boolean> {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return false;
  }

  // Call the new GET endpoint to validate the token
  const verificationUrl = new URL('/api/guest-access', request.url);
  verificationUrl.searchParams.set('token', token);

  try {
    const response = await fetch(verificationUrl);
    if (response.ok) {
      const {isValid} = await response.json();
      return isValid;
    }
    return false;
  } catch (error) {
    console.error('Error validating guest token in middleware:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // 1. Handle /remote/* routes for guest access
  if (pathname.startsWith('/remote/')) {
    const isGuestTokenValid = await validateGuestToken(request);
    if (isGuestTokenValid) {
      return NextResponse.next();
    }
    // If the guest token is invalid, redirect to an error page or show a message
    // For now, we'll just return a 401 Unauthorized response.
    return new NextResponse('Invalid or missing guest token', {status: 401});
  }

  // 2. Check for a valid session for all other routes
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isUserAuthenticated = await verifySession(sessionCookie);

  // 3. Redirect to login if not authenticated and not already on a public page
  const publicPaths = ['/login', '/register', '/forgot-password'];
  if (!isUserAuthenticated && !publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. If authenticated, let the request proceed
  return NextResponse.next();
}

// 5. Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
