import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/constants';
import { adminAuth } from '@/lib/firebase-admin';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5; // 5 days

// 1. GET: Check if the user is logged in
export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isLogged: false }, { status: 200 });
  }

  try {
    if (!adminAuth) throw new Error("Admin Auth not initialized");
    await adminAuth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ isLogged: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ isLogged: false }, { status: 200 });
  }
}

// 2. POST: Create a session
export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
  }

  try {
    if (!adminAuth) throw new Error("Admin Auth not initialized");
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, SESSION_COOKIE_OPTIONS);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// 3. DELETE: Sign out and delete the session
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true }, { status: 200 });
}
