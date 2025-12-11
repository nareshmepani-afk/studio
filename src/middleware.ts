
import { NextResponse, type NextRequest } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// IMPORTANT: Service account credentials should be stored securely and not hardcoded.
// This uses environment variables, which is the standard and secure practice.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

// Initialize Firebase Admin SDK if not already done.
if (!getApps().length && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
} else if (!serviceAccount) {
  console.warn('[MIDDLEWARE] Firebase Admin SDK initialization skipped: FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
}

export async function middleware(request: NextRequest) {
  // If the SDK wasn't initialized, bypass the middleware logic.
  if (!getApps().length) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Get the authentication token from the browser's cookies.
  // The name 'firebase-auth-token' should match what you set on the client when a user logs in.
  const token = request.cookies.get('firebase-auth-token')?.value;

  let userId: string | null = null;

  if (token) {
    try {
      // Verify the token using the Firebase Admin SDK.
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
      // console.log(`[MIDDLEWARE] User verified: ${userId} for path: ${pathname}`);
    } catch (error) {
      // This can happen if the token is expired or invalid. 
      // The user will be treated as unauthenticated.
      console.warn(`[MIDDLEWARE] Auth token verification failed for path: ${pathname}. Error:`, (error as Error).message);
      userId = null;
    }
  }

  // Clone the request headers to make them mutable.
  const requestHeaders = new Headers(request.headers);

  // Add the user ID to the request headers. If the user is not authenticated,
  // this header will not be set, and server components can act accordingly.
  if (userId) {
    requestHeaders.set('x-user-id', userId);
  }

  // Return the request, but with the new (or original) headers.
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// This configures the middleware to run on specific paths.
// We want it to run on paths where server-side data fetching needs user context.
export const config = {
  matcher: [
    '/timeline',
    '/add-memory',
    '/prompts/:path*', // Match prompts and any sub-paths
    '/settings'
  ],
};
