
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  console.log('[API/AUTH/SESSION - POST] Received request to create session.');
  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      console.error('[API/AUTH/SESSION - POST] ID token is missing from request body.');
      return new NextResponse(JSON.stringify({ error: 'ID token is required' }), { status: 400 });
    }
    console.log('[API/AUTH/SESSION - POST] Extracted ID token from request body.');

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    console.log('[API/AUTH/SESSION - POST] Creating session cookie with Firebase Admin SDK...');
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log('[API/AUTH/SESSION - POST] Successfully created session cookie.');

    const response = new NextResponse(JSON.stringify({ status: 'success' }), {
      status: 200,
    });

    console.log('[API/AUTH/SESSION - POST] Setting session cookie on the response.');
    response.cookies.set('firebase-auth-token', sessionCookie, {
      httpOnly: true,
      secure: true, // Always use secure cookies with HTTPS
      maxAge: expiresIn,
      path: '/',
      sameSite: 'lax',
    });
    console.log('[API/AUTH/SESSION - POST] Session cookie set. Returning successful response.');

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[API/AUTH/SESSION - POST] CRITICAL: Error creating session cookie:', errorMessage);
    // Log the full error for more details
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Failed to create session' }), { status: 500 });
  }
}

export async function DELETE() {
  console.log('[API/AUTH/SESSION - DELETE] Received request to delete session.');
  try {
    const response = new NextResponse(JSON.stringify({ status: 'success' }), {
      status: 200,
    });
    console.log('[API/AUTH/SESSION - DELETE] Deleting session cookie from the response.');
    response.cookies.delete('firebase-auth-token');
    console.log('[API/AUTH/SESSION - DELETE] Session cookie deleted. Returning successful response.');
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[API/AUTH/SESSION - DELETE] Error deleting session cookie:', errorMessage);
    return new NextResponse(JSON.stringify({ error: 'Failed to delete session' }), { status: 500 });
  }
}
