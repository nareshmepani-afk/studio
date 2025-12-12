
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// This route no longer initializes the SDK. It imports the initialized adminAuth service.

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
    
    // Use the imported adminAuth singleton
    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn });

    const response = NextResponse.json({ status: 'success' });
    
    response.cookies.set('firebase-auth-token', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
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
  response.cookies.delete('firebase-auth-token');
  return response;
}
