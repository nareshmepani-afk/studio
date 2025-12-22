
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin'; // Ensure you have this admin setup

// Note: It is not recommended to use this approach for production apps.
// Instead, you should use a more robust authentication solution.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      return new NextResponse(JSON.stringify({ error: 'ID token is required' }), { status: 400 });
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Create the session cookie. This will also verify the ID token.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set cookie policy for session cookie.
    const response = new NextResponse(JSON.stringify({ status: 'success' }), {
      status: 200,
    });

    response.cookies.set('firebase-auth-token', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[API/AUTH/SESSION - POST] Error creating session cookie:', errorMessage);
    return new NextResponse(JSON.stringify({ error: 'Failed to create session' }), { status: 401 });
  }
}

// Note: It is not recommended to use this approach for production apps.
// Instead, you should use a more robust authentication solution.
export async function DELETE() {
  try {
    const response = new NextResponse(JSON.stringify({ status: 'success' }), {
      status: 200,
    });
    response.cookies.delete('firebase-auth-token');
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[API/AUTH/SESSION - DELETE] Error deleting session cookie:', errorMessage);
    return new NextResponse(JSON.stringify({ error: 'Failed to delete session' }), { status: 500 });
  }
}
