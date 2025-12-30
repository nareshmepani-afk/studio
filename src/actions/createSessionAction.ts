
'use server';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

export async function createSessionAction(idToken: string) {
  if (!adminAuth) {
    console.error("[createSessionAction] Firebase Admin SDK is not initialized.");
    return { success: false, message: "Server-side authentication is not configured." };
  }
  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    cookies().set('firebase-session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { success: true, message: 'Session created successfully.' };
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    return { success: false, message: 'Could not create session: ' + error.message };
  }
}

export async function deleteSessionAction() {
    try {
        cookies().set('firebase-session', '', { expires: new Date(0), path: '/' });
        return { success: true, message: 'Session deleted successfully.' };
    } catch (error: any) {
        console.error('Error deleting session cookie:', error);
        return { success: false, message: 'Could not delete session: ' + error.message };
    }
}
