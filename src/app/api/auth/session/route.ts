
import { NextResponse, type NextRequest } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This is a critical piece of server-side infrastructure. 
// Its purpose is to create a secure bridge between the client-side Firebase 
// authentication and the server-side rendering (SSR) context.

// Initialize Firebase Admin SDK for server-side verification
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

/**
 * @name POST /api/auth/session
 * @description Receives a Firebase ID token from the client, verifies it, and creates
 * a secure, HTTP-only session cookie. This cookie is what allows Server Components
 * to authenticate the user and fetch their data.
 */
export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'Token not provided' }, { status: 400 });
  }

  try {
    // The session cookie will be valid for 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const sessionCookie = await getAuth().createSessionCookie(token, { expiresIn });

    const response = NextResponse.json({ status: 'success' });
    
    // Set the cookie on the response. This is the bridge.
    response.cookies.set('firebase-auth-token', sessionCookie, {
      httpOnly: true, // The cookie is inaccessible to client-side scripts
      secure: process.env.NODE_ENV === 'production', // Sent only over HTTPS
      maxAge: expiresIn, // Corresponds to the session length
      path: '/', // Available on all paths
    });

    return response;
  } catch (error) {
    console.error('API Error: Failed to create session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}

/**
 * @name DELETE /api/auth/session
 * @description Clears the session cookie, effectively logging the user out from the 
 * server's perspective.
 */
export async function DELETE() {
  const response = NextResponse.json({ status: 'success' });
  // Instruct the browser to delete the cookie.
  response.cookies.delete('firebase-auth-token');
  return response;
}
